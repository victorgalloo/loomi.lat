import {
  proxyActivities,
  startChild,
  executeChild,
  defineSignal,
  setHandler,
  ApplicationFailure,
  workflowInfo,
  upsertSearchAttributes,
} from '@temporalio/workflow';
import type {
  DemoBookingWorkflowInput,
  DemoRemindersWorkflowInput,
  CalSlot,
  TenantCredentials,
  TenantContext,
  Lead,
} from '../types';
import { generateWorkflowId, getTaskQueueForTenant } from '../types';
import { DemoRemindersWorkflow } from './follow-up';

// Import activity types
import type * as activities from '../activities';

const {
  createEvent,
  cancelEvent,
  sendMessage,
  sendConfirmationButtons,
  getLeadById,
  updateLeadStage,
  createAppointment,
  updateAppointmentStatus,
  cancelFollowUps,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    initialInterval: '1 second',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

// Signals
export const cancelBookingSignal = defineSignal('cancelBooking');
export const rescheduleSignal = defineSignal<[CalSlot]>('reschedule');

interface BookingState {
  eventId?: string;
  appointmentId?: string;
  cancelled: boolean;
  meetingUrl?: string;
}

// ===========================================
// LOGGING HELPER
// ===========================================
function log(tenantId: string, workflowId: string, message: string, data?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    tenant_id: tenantId,
    workflow_id: workflowId,
    workflow_type: 'demo-booking',
    message,
    ...data,
  };
  console.log(JSON.stringify(entry));
}

function logError(tenantId: string, workflowId: string, message: string, error: string) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    tenant_id: tenantId,
    workflow_id: workflowId,
    workflow_type: 'demo-booking',
    message,
    error,
  };
  console.error(JSON.stringify(entry));
}

// Format helpers
function formatDateSpanish(dateStr: string): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Mexico_City',
  };
  return date.toLocaleDateString('es-MX', options);
}

function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// ===========================================
// DEMO BOOKING WORKFLOW (Saga Pattern)
// ===========================================
export async function DemoBookingWorkflow(
  input: DemoBookingWorkflowInput
): Promise<{ success: boolean; eventId?: string; meetingUrl?: string; error?: string }> {
  const { tenant, leadId, lead, slot, email, tenantCredentials } = input;
  const wfInfo = workflowInfo();
  const state: BookingState = { cancelled: false };

  // Set search attributes
  upsertSearchAttributes({
    tenant_id: [tenant.tenantId],
    workflow_type: ['demo-booking'],
    lead_id: [leadId],
    custom_status: ['processing'],
  });

  log(tenant.tenantId, wfInfo.workflowId, 'DemoBooking workflow started', {
    leadId,
    slot: `${slot.date} ${slot.time}`,
    email,
  });

  // Set up signal handlers
  setHandler(cancelBookingSignal, async () => {
    state.cancelled = true;
    log(tenant.tenantId, wfInfo.workflowId, 'Booking cancellation requested');
  });

  try {
    // ===========================================
    // STEP 1: Create calendar event
    // ===========================================
    log(tenant.tenantId, wfInfo.workflowId, 'Creating calendar event');

    const bookingResult = await createEvent({
      slot,
      name: lead.name || 'Prospecto Loomi',
      email,
      phone: lead.phone,
      notes: `Lead ID: ${leadId} | Tenant: ${tenant.tenantId}`,
      metadata: {
        leadId,
        tenantId: tenant.tenantId,
        industry: lead.industry,
        company: lead.company,
      },
    });

    if (!bookingResult.success) {
      upsertSearchAttributes({ custom_status: ['failed'] });
      logError(tenant.tenantId, wfInfo.workflowId, 'Calendar event creation failed', bookingResult.error || 'Unknown');
      throw ApplicationFailure.nonRetryable('Failed to create calendar event', 'CalendarError', {
        error: bookingResult.error,
      });
    }

    state.eventId = bookingResult.eventId;
    state.meetingUrl = bookingResult.meetingUrl;
    log(tenant.tenantId, wfInfo.workflowId, 'Calendar event created', { eventId: state.eventId });

    // ===========================================
    // STEP 2: Create appointment record
    // ===========================================
    const scheduledAt = `${slot.date}T${slot.time}:00`;
    const appointmentResult = await createAppointment(leadId, scheduledAt, state.eventId);

    if (!appointmentResult.success) {
      // COMPENSATION: Cancel calendar event
      log(tenant.tenantId, wfInfo.workflowId, 'Appointment creation failed, compensating');
      await cancelEvent(state.eventId!);
      upsertSearchAttributes({ custom_status: ['rolled_back'] });
      throw ApplicationFailure.nonRetryable('Failed to create appointment record', 'DatabaseError', {
        error: appointmentResult.error,
      });
    }

    state.appointmentId = appointmentResult.appointmentId;
    log(tenant.tenantId, wfInfo.workflowId, 'Appointment record created', { appointmentId: state.appointmentId });

    // ===========================================
    // STEP 3: Update lead stage
    // ===========================================
    const stageResult = await updateLeadStage(leadId, 'demo_scheduled');
    if (!stageResult.success) {
      // COMPENSATION: Cancel calendar + mark appointment cancelled
      log(tenant.tenantId, wfInfo.workflowId, 'Stage update failed, compensating');
      await Promise.all([
        cancelEvent(state.eventId!),
        updateAppointmentStatus(state.appointmentId!, 'cancelled'),
      ]);
      upsertSearchAttributes({ custom_status: ['rolled_back'] });
      throw ApplicationFailure.nonRetryable('Failed to update lead stage', 'DatabaseError', {
        error: stageResult.error,
      });
    }

    // ===========================================
    // STEP 4: Cancel existing follow-ups
    // ===========================================
    await cancelFollowUps(leadId);

    // ===========================================
    // STEP 5: Send confirmation message
    // ===========================================
    const dateFormatted = formatDateSpanish(slot.date);
    const timeFormatted = formatTime12h(slot.time);

    const confirmationMessage = `¡Listo ${lead.name || ''}! 🎉\n\nTu demo quedó agendada para:\n📅 ${dateFormatted}\n🕐 ${timeFormatted}\n\n${state.meetingUrl ? `Link de la reunión: ${state.meetingUrl}\n\n` : ''}Te llegarán recordatorios antes de la llamada.`;

    await sendMessage(lead.phone, confirmationMessage, tenantCredentials);
    await sendConfirmationButtons(lead.phone, '¿Confirmas que estarás disponible?', tenantCredentials);

    log(tenant.tenantId, wfInfo.workflowId, 'Confirmation sent');

    // ===========================================
    // STEP 6: Start reminder child workflow
    // ===========================================
    const remindersInput: DemoRemindersWorkflowInput = {
      tenant,
      leadId,
      lead,
      appointmentId: state.appointmentId!,
      scheduledAt,
    };

    const childWorkflowId = generateWorkflowId(tenant.tenantId, 'demo-reminders', state.appointmentId);

    await startChild(DemoRemindersWorkflow, {
      args: [remindersInput],
      workflowId: childWorkflowId,
      taskQueue: getTaskQueueForTenant(tenant.tenantId, tenant.tier),
      parentClosePolicy: 'ABANDON', // Keep running even if parent completes
    });

    log(tenant.tenantId, wfInfo.workflowId, 'Started DemoReminders child workflow', {
      childWorkflowId,
    });

    upsertSearchAttributes({ custom_status: ['completed'] });
    log(tenant.tenantId, wfInfo.workflowId, 'DemoBooking completed successfully');

    return {
      success: true,
      eventId: state.eventId,
      meetingUrl: state.meetingUrl,
    };

  } catch (error) {
    // Final cleanup if needed
    if (state.eventId && !state.appointmentId) {
      await cancelEvent(state.eventId);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError(tenant.tenantId, wfInfo.workflowId, 'DemoBooking failed', errorMessage);

    // Notify user of failure
    await sendMessage(
      lead.phone,
      `Lo siento, hubo un problema al agendar tu demo. ¿Podrías intentar de nuevo o responder con otro horario?`,
      tenantCredentials
    );

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ===========================================
// RESCHEDULE WORKFLOW
// ===========================================
export async function RescheduleWorkflow(input: {
  tenant: TenantContext;
  leadId: string;
  lead: Lead;
  oldEventId: string;
  oldAppointmentId: string;
  newSlot: CalSlot;
  email: string;
  tenantCredentials?: TenantCredentials;
}): Promise<{ success: boolean; eventId?: string; meetingUrl?: string; error?: string }> {
  const { tenant, leadId, lead, oldEventId, oldAppointmentId, newSlot, email, tenantCredentials } = input;
  const wfInfo = workflowInfo();

  upsertSearchAttributes({
    tenant_id: [tenant.tenantId],
    workflow_type: ['reschedule'],
    lead_id: [leadId],
    custom_status: ['processing'],
  });

  log(tenant.tenantId, wfInfo.workflowId, 'Reschedule workflow started', {
    oldEventId,
    newSlot: `${newSlot.date} ${newSlot.time}`,
  });

  try {
    // Cancel old event
    await cancelEvent(oldEventId);
    await updateAppointmentStatus(oldAppointmentId, 'cancelled');

    log(tenant.tenantId, wfInfo.workflowId, 'Old booking cancelled');

    // Create new booking
    const bookingInput: DemoBookingWorkflowInput = {
      tenant,
      leadId,
      lead,
      slot: newSlot,
      email,
      tenantCredentials,
    };

    const result = await executeChild(DemoBookingWorkflow, {
      args: [bookingInput],
      workflowId: generateWorkflowId(tenant.tenantId, 'demo-booking', `reschedule-${leadId}`),
      taskQueue: getTaskQueueForTenant(tenant.tenantId, tenant.tier),
    });

    upsertSearchAttributes({ custom_status: [result.success ? 'completed' : 'failed'] });
    log(tenant.tenantId, wfInfo.workflowId, `Reschedule ${result.success ? 'completed' : 'failed'}`);

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError(tenant.tenantId, wfInfo.workflowId, 'Reschedule failed', errorMessage);
    upsertSearchAttributes({ custom_status: ['failed'] });
    return { success: false, error: errorMessage };
  }
}

// ===========================================
// CANCEL BOOKING WORKFLOW
// ===========================================
export async function CancelBookingWorkflow(input: {
  tenant: TenantContext;
  leadId: string;
  eventId: string;
  appointmentId: string;
  lead: Lead;
  reason?: string;
  tenantCredentials?: TenantCredentials;
}): Promise<{ success: boolean; error?: string }> {
  const { tenant, leadId, eventId, appointmentId, lead, reason, tenantCredentials } = input;
  const wfInfo = workflowInfo();

  upsertSearchAttributes({
    tenant_id: [tenant.tenantId],
    workflow_type: ['cancel-booking'],
    lead_id: [leadId],
    custom_status: ['processing'],
  });

  log(tenant.tenantId, wfInfo.workflowId, 'CancelBooking workflow started', { eventId, appointmentId });

  try {
    await cancelEvent(eventId);
    await updateAppointmentStatus(appointmentId, 'cancelled');
    await updateLeadStage(leadId, 'qualified');

    const message = reason
      ? `Entendido, tu demo ha sido cancelada. ${reason}\n\nCuando quieras reagendar, solo responde "Quiero agendar demo".`
      : `Entendido, tu demo ha sido cancelada.\n\nCuando quieras reagendar, solo responde "Quiero agendar demo".`;

    await sendMessage(lead.phone, message, tenantCredentials);

    upsertSearchAttributes({ custom_status: ['completed'] });
    log(tenant.tenantId, wfInfo.workflowId, 'Booking cancelled successfully');

    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError(tenant.tenantId, wfInfo.workflowId, 'CancelBooking failed', errorMessage);
    upsertSearchAttributes({ custom_status: ['failed'] });
    return { success: false, error: errorMessage };
  }
}
