import {
  proxyActivities,
  sleep,
  defineSignal,
  setHandler,
  condition,
  ApplicationFailure,
  workflowInfo,
  upsertSearchAttributes,
} from '@temporalio/workflow';
import type { PaymentWorkflowInput, StripePlan, TenantCredentials, TenantContext, Lead } from '../types';
import { generateWorkflowId, getTaskQueueForTenant } from '../types';

// Import activity types
import type * as activities from '../activities';

const {
  createCheckoutSession,
  sendMessage,
  sendPaymentLink,
  getLeadById,
  updateLeadStage,
  updateLead,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    initialInterval: '1 second',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

// Helper function (deterministic, runs in workflow)
function getPlanDisplayName(plan: StripePlan): string {
  const names: Record<StripePlan, string> = {
    starter: 'Starter ($199/mes)',
    growth: 'Growth ($349/mes)',
    business: 'Business ($599/mes)',
  };
  return names[plan];
}

// Signals
export const paymentCompletedSignal = defineSignal<[{ sessionId: string; subscriptionId: string }]>(
  'paymentCompleted'
);
export const cancelPaymentSignal = defineSignal('cancelPayment');

interface PaymentState {
  sessionId?: string;
  checkoutUrl?: string;
  completed: boolean;
  cancelled: boolean;
  subscriptionId?: string;
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
    workflow_type: 'payment',
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
    workflow_type: 'payment',
    message,
    error,
  };
  console.error(JSON.stringify(entry));
}

// ===========================================
// PAYMENT WORKFLOW
// ===========================================
export async function PaymentWorkflow(
  input: PaymentWorkflowInput
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  const { tenant, leadId, lead, email, plan, tenantCredentials } = input;
  const wfInfo = workflowInfo();
  const state: PaymentState = { completed: false, cancelled: false };

  // Set search attributes
  upsertSearchAttributes({
    tenant_id: [tenant.tenantId],
    workflow_type: ['payment'],
    lead_id: [leadId],
    custom_status: ['pending'],
  });

  log(tenant.tenantId, wfInfo.workflowId, 'Payment workflow started', {
    leadId,
    plan,
    email,
  });

  // Set up signal handlers
  setHandler(paymentCompletedSignal, (data) => {
    state.completed = true;
    state.subscriptionId = data.subscriptionId;
    log(tenant.tenantId, wfInfo.workflowId, 'Payment completed signal received', {
      sessionId: data.sessionId,
      subscriptionId: data.subscriptionId,
    });
  });

  setHandler(cancelPaymentSignal, () => {
    state.cancelled = true;
    log(tenant.tenantId, wfInfo.workflowId, 'Payment cancelled signal received');
  });

  try {
    // ===========================================
    // STEP 1: Create checkout session
    // ===========================================
    log(tenant.tenantId, wfInfo.workflowId, 'Creating checkout session');

    const checkoutResult = await createCheckoutSession({
      email,
      phone: lead.phone,
      plan,
      leadId,
      name: lead.name || undefined,
    });

    state.sessionId = checkoutResult.sessionId;
    state.checkoutUrl = checkoutResult.shortUrl;

    log(tenant.tenantId, wfInfo.workflowId, 'Checkout session created', {
      sessionId: state.sessionId,
    });

    // ===========================================
    // STEP 2: Update lead with account ID
    // ===========================================
    await updateLead(leadId, {
      email,
      account_id: checkoutResult.accountId,
    } as any);

    // ===========================================
    // STEP 3: Update lead stage
    // ===========================================
    await updateLeadStage(leadId, 'proposal_sent');
    upsertSearchAttributes({ custom_status: ['link_sent'] });

    // ===========================================
    // STEP 4: Send payment link
    // ===========================================
    const planName = getPlanDisplayName(plan);
    await sendPaymentLink(lead.phone, checkoutResult.shortUrl, planName, tenantCredentials);

    log(tenant.tenantId, wfInfo.workflowId, 'Payment link sent');

    // ===========================================
    // STEP 5: Wait for payment or timeout (24 hours)
    // ===========================================

    // First reminder at 12 hours
    const firstReminderTriggered = await condition(
      () => state.completed || state.cancelled,
      12 * 60 * 60 * 1000
    );

    if (!state.completed && !state.cancelled) {
      // Send 12h reminder
      const currentLead = await getLeadById(leadId);
      if (currentLead && currentLead.stage === 'proposal_sent') {
        await sendMessage(
          lead.phone,
          `¡Hola ${lead.name || ''}! ¿Todo bien? Vi que no has completado tu pago del plan ${planName}.\n\n¿Tienes alguna duda que pueda resolver?`,
          tenantCredentials
        );
        log(tenant.tenantId, wfInfo.workflowId, '12h reminder sent');
      }
    }

    // Second reminder at 20 hours (8 hours after first)
    if (!state.completed && !state.cancelled) {
      await condition(
        () => state.completed || state.cancelled,
        8 * 60 * 60 * 1000
      );

      if (!state.completed && !state.cancelled) {
        const currentLead = await getLeadById(leadId);
        if (currentLead && currentLead.stage === 'proposal_sent') {
          await sendMessage(
            lead.phone,
            `¡Último aviso! Tu link de pago expira en 4 horas:\n\n${state.checkoutUrl}\n\nSi prefieres otro plan o tienes dudas, responde aquí.`,
            tenantCredentials
          );
          log(tenant.tenantId, wfInfo.workflowId, '20h reminder sent');
        }
      }
    }

    // Final wait (4 hours until 24h total)
    if (!state.completed && !state.cancelled) {
      await condition(
        () => state.completed || state.cancelled,
        4 * 60 * 60 * 1000
      );
    }

    // ===========================================
    // FINAL STATE HANDLING
    // ===========================================

    if (state.cancelled) {
      upsertSearchAttributes({ custom_status: ['cancelled'] });
      log(tenant.tenantId, wfInfo.workflowId, 'Payment workflow cancelled');
      return { success: false, sessionId: state.sessionId, error: 'Cancelled' };
    }

    if (state.completed) {
      await updateLeadStage(leadId, 'won');
      upsertSearchAttributes({ custom_status: ['completed'] });

      await sendMessage(
        lead.phone,
        `¡Pago recibido! 🎉 Bienvenido a Loomi ${planName}.\n\nEn los próximos minutos recibirás un correo con los siguientes pasos para configurar tu agente.`,
        tenantCredentials
      );

      log(tenant.tenantId, wfInfo.workflowId, 'Payment completed successfully');
      return { success: true, sessionId: state.sessionId };
    }

    // Timeout - link expired
    upsertSearchAttributes({ custom_status: ['expired'] });
    log(tenant.tenantId, wfInfo.workflowId, 'Payment link expired');

    await sendMessage(
      lead.phone,
      `¡Hola ${lead.name || ''}! Noté que tu link de pago expiró. ¿Necesitas ayuda o tienes alguna duda sobre el plan?`,
      tenantCredentials
    );

    return {
      success: false,
      sessionId: state.sessionId,
      error: 'Payment link expired',
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError(tenant.tenantId, wfInfo.workflowId, 'Payment workflow failed', errorMessage);
    upsertSearchAttributes({ custom_status: ['failed'] });

    await sendMessage(
      lead.phone,
      `Lo siento, hubo un problema al generar tu link de pago. ¿Podrías intentar de nuevo?`,
      tenantCredentials
    );

    return {
      success: false,
      error: errorMessage,
    };
  }
}
