import { Client, Connection } from '@temporalio/client';
import { createClientConnection, getNamespace, TASK_QUEUE } from './config';
import type {
  FollowUpWorkflowInput,
  DemoBookingWorkflowInput,
  PaymentWorkflowInput,
  IntegrationSyncWorkflowInput,
  Lead,
  CalSlot,
  StripePlan,
  TenantCredentials,
} from './types';

let clientInstance: Client | null = null;
let connectionInstance: Connection | null = null;

export async function getTemporalClient(): Promise<Client> {
  if (clientInstance) {
    return clientInstance;
  }

  connectionInstance = await createClientConnection();
  clientInstance = new Client({
    connection: connectionInstance,
    namespace: getNamespace(),
  });

  return clientInstance;
}

export async function closeTemporalClient(): Promise<void> {
  if (connectionInstance) {
    await connectionInstance.close();
    connectionInstance = null;
    clientInstance = null;
  }
}

// Workflow starters

export async function startFollowUpWorkflow(input: FollowUpWorkflowInput): Promise<string> {
  const client = await getTemporalClient();
  const workflowId = `followup-${input.type}-${input.leadId}-${Date.now()}`;

  await client.workflow.start('FollowUpWorkflow', {
    args: [input],
    taskQueue: TASK_QUEUE,
    workflowId,
  });

  return workflowId;
}

export async function startDemoRemindersWorkflow(params: {
  leadId: string;
  appointmentId: string;
  scheduledAt: string;
  lead: Lead;
}): Promise<string> {
  const client = await getTemporalClient();
  const workflowId = `demo-reminders-${params.appointmentId}`;

  await client.workflow.start('DemoRemindersWorkflow', {
    args: [params],
    taskQueue: TASK_QUEUE,
    workflowId,
  });

  return workflowId;
}

export async function startReengagementWorkflow(params: {
  leadId: string;
  lead: Lead;
}): Promise<string> {
  const client = await getTemporalClient();
  const workflowId = `reengagement-${params.leadId}`;

  // Use idempotent workflowId to prevent duplicate sequences
  await client.workflow.start('ReengagementWorkflow', {
    args: [params],
    taskQueue: TASK_QUEUE,
    workflowId,
    workflowIdReusePolicy: 'REJECT_DUPLICATE',
  });

  return workflowId;
}

export async function startDemoBookingWorkflow(
  input: DemoBookingWorkflowInput
): Promise<{ workflowId: string; handle: Awaited<ReturnType<typeof Client.prototype.workflow.start>> }> {
  const client = await getTemporalClient();
  const workflowId = `booking-${input.leadId}-${Date.now()}`;

  const handle = await client.workflow.start('DemoBookingWorkflow', {
    args: [input],
    taskQueue: TASK_QUEUE,
    workflowId,
  });

  return { workflowId, handle };
}

export async function startRescheduleWorkflow(params: {
  leadId: string;
  lead: Lead;
  oldEventId: string;
  oldAppointmentId: string;
  newSlot: CalSlot;
  email: string;
  tenantCredentials?: TenantCredentials;
}): Promise<string> {
  const client = await getTemporalClient();
  const workflowId = `reschedule-${params.leadId}-${Date.now()}`;

  await client.workflow.start('RescheduleWorkflow', {
    args: [params],
    taskQueue: TASK_QUEUE,
    workflowId,
  });

  return workflowId;
}

export async function startCancelBookingWorkflow(params: {
  leadId: string;
  eventId: string;
  appointmentId: string;
  lead: Lead;
  reason?: string;
  tenantCredentials?: TenantCredentials;
}): Promise<string> {
  const client = await getTemporalClient();
  const workflowId = `cancel-booking-${params.leadId}-${Date.now()}`;

  await client.workflow.start('CancelBookingWorkflow', {
    args: [params],
    taskQueue: TASK_QUEUE,
    workflowId,
  });

  return workflowId;
}

export async function startPaymentWorkflow(
  input: PaymentWorkflowInput
): Promise<{ workflowId: string; handle: Awaited<ReturnType<typeof Client.prototype.workflow.start>> }> {
  const client = await getTemporalClient();
  // Use idempotent workflowId per lead+plan to prevent duplicate checkouts
  const workflowId = `payment-${input.leadId}-${input.plan}`;

  const handle = await client.workflow.start('PaymentWorkflow', {
    args: [input],
    taskQueue: TASK_QUEUE,
    workflowId,
    workflowIdReusePolicy: 'REJECT_DUPLICATE',
  });

  return { workflowId, handle };
}

export async function startIntegrationSyncWorkflow(
  input: IntegrationSyncWorkflowInput
): Promise<string> {
  const client = await getTemporalClient();
  const workflowId = `sync-${input.eventType}-${input.leadId}-${Date.now()}`;

  await client.workflow.start('IntegrationSyncWorkflow', {
    args: [input],
    taskQueue: TASK_QUEUE,
    workflowId,
  });

  return workflowId;
}

export async function startMemoryGenerationWorkflow(params: {
  leadId: string;
  conversationId: string;
}): Promise<string> {
  const client = await getTemporalClient();
  const workflowId = `memory-${params.conversationId}`;

  await client.workflow.start('MemoryGenerationWorkflow', {
    args: [params],
    taskQueue: TASK_QUEUE,
    workflowId,
    workflowIdReusePolicy: 'REJECT_DUPLICATE',
  });

  return workflowId;
}

// Signal helpers

export async function cancelFollowUp(workflowId: string): Promise<void> {
  const client = await getTemporalClient();
  const handle = client.workflow.getHandle(workflowId);
  await handle.signal('cancelFollowUp');
}

export async function signalPaymentCompleted(
  workflowId: string,
  data: { sessionId: string; subscriptionId: string }
): Promise<void> {
  const client = await getTemporalClient();
  const handle = client.workflow.getHandle(workflowId);
  await handle.signal('paymentCompleted', data);
}

export async function cancelBooking(workflowId: string): Promise<void> {
  const client = await getTemporalClient();
  const handle = client.workflow.getHandle(workflowId);
  await handle.signal('cancelBooking');
}

// Workflow status helpers

export async function getWorkflowStatus(
  workflowId: string
): Promise<{ status: string; result?: unknown }> {
  const client = await getTemporalClient();
  const handle = client.workflow.getHandle(workflowId);

  try {
    const description = await handle.describe();
    const status = description.status.name;

    if (status === 'COMPLETED') {
      const result = await handle.result();
      return { status, result };
    }

    return { status };
  } catch (error) {
    return { status: 'UNKNOWN' };
  }
}

// Re-export types
export type {
  FollowUpWorkflowInput,
  DemoBookingWorkflowInput,
  PaymentWorkflowInput,
  IntegrationSyncWorkflowInput,
  Lead,
  CalSlot,
  StripePlan,
  TenantCredentials,
};
