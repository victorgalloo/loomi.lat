import {
  proxyActivities,
  sleep,
  defineSignal,
  setHandler,
  condition,
  workflowInfo,
  upsertSearchAttributes,
  ApplicationFailure,
} from '@temporalio/workflow';
import type {
  FollowUpWorkflowInput,
  DemoRemindersWorkflowInput,
  ReengagementWorkflowInput,
  FollowUpType,
  FollowUpContext,
  Lead,
  SEARCH_ATTRIBUTES,
} from '../types';

// Import activity types
import type * as activities from '../activities';

const {
  sendMessage,
  getLeadById,
  getLeadMemory,
  updateLeadStage,
  cancelFollowUps,
  getActiveAppointment,
  updateAppointmentStatus,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    initialInterval: '1 second',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

// Signals for cancellation
export const cancelFollowUpSignal = defineSignal('cancelFollowUp');

// ===========================================
// LOGGING HELPER (deterministic for workflows)
// ===========================================
function log(tenantId: string, workflowId: string, message: string, data?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    tenant_id: tenantId,
    workflow_id: workflowId,
    workflow_type: 'followup',
    message,
    ...data,
  };
  console.log(JSON.stringify(entry));
}

// ===========================================
// MESSAGE TEMPLATES
// ===========================================
function generateFollowUpMessage(type: FollowUpType, context: FollowUpContext): string {
  const name = context.leadName || 'ahí';

  switch (type) {
    case 'pre_demo_24h':
      return `¡Hola ${name}! 👋 Te recuerdo que mañana tenemos nuestra demo. ¿Todo listo para vernos?`;

    case 'pre_demo_reminder':
      return `¡Hola ${name}! En 30 minutos comienza nuestra demo. Te espero puntual 🙌`;

    case 'post_demo':
      return `¡Hola ${name}! Gracias por tu tiempo en la demo. ¿Qué te pareció? ¿Tienes alguna pregunta?`;

    case 'said_later':
      return `¡Hola ${name}! Retomando nuestra conversación de ayer. ¿Ahora sí tienes tiempo para platicarte de Loomi? 🙂`;

    case 'cold_lead_reengagement':
      return `¡Hola ${name}! Vi que nos quedamos a medias la última vez. ¿Te gustaría retomar la plática sobre cómo Loomi puede ayudarte?`;

    case 'reengagement_2':
      return `¡Hola ${name}! No quiero ser insistente, pero vi que ${context.challenge || 'buscabas automatizar tu atención'}. ¿Sigue siendo algo que te interesa?`;

    case 'reengagement_3':
      return `¡Hola ${name}! Última vez que te escribo 🙂 Si cambias de opinión sobre automatizar tu WhatsApp, aquí estaré.`;

    case 'no_show_followup':
      return `¡Hola ${name}! Noté que no pudiste unirte a la demo. ¿Todo bien? Podemos reagendar cuando te funcione mejor.`;

    case 'proposal_reminder':
      return `¡Hola ${name}! ¿Tuviste oportunidad de revisar la propuesta? Quedo atento a tus dudas.`;

    default:
      return `¡Hola ${name}! ¿Cómo estás?`;
  }
}

// Calculate delay for follow-up type
function getDelayMs(type: FollowUpType, scheduledAt?: string): number {
  switch (type) {
    case 'pre_demo_24h':
      if (scheduledAt) {
        const demoTime = new Date(scheduledAt).getTime();
        return Math.max(demoTime - Date.now() - 24 * 60 * 60 * 1000, 0);
      }
      return 0;

    case 'pre_demo_reminder':
      if (scheduledAt) {
        const demoTime = new Date(scheduledAt).getTime();
        return Math.max(demoTime - Date.now() - 30 * 60 * 1000, 0);
      }
      return 0;

    case 'post_demo':
      if (scheduledAt) {
        const demoTime = new Date(scheduledAt).getTime();
        return Math.max(demoTime - Date.now() + 32 * 60 * 1000, 0); // 30min demo + 2min after
      }
      return 2 * 60 * 1000;

    case 'said_later':
      return 12 * 60 * 60 * 1000; // 12 hours

    case 'cold_lead_reengagement':
      return 24 * 60 * 60 * 1000; // 24 hours

    case 'reengagement_2':
      return 60 * 60 * 60 * 1000; // 60 hours

    case 'reengagement_3':
      return 168 * 60 * 60 * 1000; // 7 days

    case 'no_show_followup':
      return 7 * 60 * 1000; // 7 minutes

    case 'proposal_reminder':
      return 12 * 60 * 60 * 1000; // 12 hours

    default:
      return 60 * 60 * 1000; // 1 hour
  }
}

// ===========================================
// FOLLOW-UP WORKFLOW
// ===========================================
export async function FollowUpWorkflow(input: FollowUpWorkflowInput): Promise<void> {
  const { tenant, leadId, lead, type, appointmentId, scheduledAt } = input;
  const wfInfo = workflowInfo();
  let cancelled = false;

  // Set search attributes for querying
  upsertSearchAttributes({
    tenant_id: [tenant.tenantId],
    workflow_type: ['followup'],
    lead_id: [leadId],
    custom_status: ['waiting'],
  });

  log(tenant.tenantId, wfInfo.workflowId, 'FollowUp workflow started', {
    type,
    leadId,
    appointmentId,
  });

  // Validate tenant limits
  if (tenant.limits.maxFollowUpsPerLead > 0) {
    // Note: In production, query Temporal for running workflows count
    // For now we trust the limit check happened at trigger time
  }

  // Set up cancellation signal handler
  setHandler(cancelFollowUpSignal, () => {
    cancelled = true;
    log(tenant.tenantId, wfInfo.workflowId, 'FollowUp cancelled via signal');
  });

  // Build context for message generation
  const memory = await getLeadMemory(leadId);
  const context: FollowUpContext = {
    leadName: lead.name,
    company: lead.company,
    industry: lead.industry,
    scheduledAt,
    challenge: lead.challenge,
    memory,
  };

  // Calculate and wait for the delay
  const delayMs = getDelayMs(type, scheduledAt);
  log(tenant.tenantId, wfInfo.workflowId, `Waiting ${delayMs}ms for ${type}`);

  // Use condition to allow cancellation during sleep
  const timedOut = await condition(() => cancelled, delayMs);

  if (cancelled) {
    upsertSearchAttributes({ custom_status: ['cancelled'] });
    log(tenant.tenantId, wfInfo.workflowId, 'FollowUp cancelled, exiting');
    return;
  }

  // Check if lead stage has changed
  const currentLead = await getLeadById(leadId);
  if (!currentLead) {
    upsertSearchAttributes({ custom_status: ['skipped'] });
    log(tenant.tenantId, wfInfo.workflowId, 'Lead not found, skipping');
    return;
  }

  if (currentLead.stage === 'won' || currentLead.stage === 'lost') {
    upsertSearchAttributes({ custom_status: ['skipped'] });
    log(tenant.tenantId, wfInfo.workflowId, `Lead is ${currentLead.stage}, skipping`);
    return;
  }

  // For demo-related follow-ups, verify appointment still exists
  if (appointmentId && (type === 'pre_demo_24h' || type === 'pre_demo_reminder')) {
    const appointment = await getActiveAppointment(leadId);
    if (!appointment || appointment.status !== 'scheduled') {
      upsertSearchAttributes({ custom_status: ['skipped'] });
      log(tenant.tenantId, wfInfo.workflowId, 'Appointment no longer active, skipping');
      return;
    }
  }

  // Generate and send the message
  const message = generateFollowUpMessage(type, context);
  await sendMessage(currentLead.phone, message);

  upsertSearchAttributes({ custom_status: ['sent'] });
  log(tenant.tenantId, wfInfo.workflowId, `Sent ${type} follow-up`, { phone: currentLead.phone });
}

// ===========================================
// DEMO REMINDERS WORKFLOW
// ===========================================
export async function DemoRemindersWorkflow(input: DemoRemindersWorkflowInput): Promise<void> {
  const { tenant, leadId, lead, appointmentId, scheduledAt } = input;
  const wfInfo = workflowInfo();
  let cancelled = false;

  upsertSearchAttributes({
    tenant_id: [tenant.tenantId],
    workflow_type: ['demo-reminders'],
    lead_id: [leadId],
    custom_status: ['active'],
  });

  log(tenant.tenantId, wfInfo.workflowId, 'DemoReminders workflow started', {
    appointmentId,
    scheduledAt,
  });

  setHandler(cancelFollowUpSignal, () => {
    cancelled = true;
    log(tenant.tenantId, wfInfo.workflowId, 'DemoReminders cancelled via signal');
  });

  const memory = await getLeadMemory(leadId);
  const context: FollowUpContext = {
    leadName: lead.name,
    company: lead.company,
    industry: lead.industry,
    scheduledAt,
    challenge: lead.challenge,
    memory,
  };

  const demoTime = new Date(scheduledAt).getTime();
  const now = Date.now();

  // 1. Send 24h reminder (if demo is > 24h away)
  const twentyFourHoursBefore = demoTime - 24 * 60 * 60 * 1000;
  if (twentyFourHoursBefore > now && !cancelled) {
    const delay24h = twentyFourHoursBefore - now;
    await condition(() => cancelled, delay24h);

    if (!cancelled) {
      const currentLead = await getLeadById(leadId);
      if (currentLead && currentLead.stage !== 'won' && currentLead.stage !== 'lost') {
        const message = generateFollowUpMessage('pre_demo_24h', context);
        await sendMessage(currentLead.phone, message);
        log(tenant.tenantId, wfInfo.workflowId, 'Sent 24h reminder');
      }
    }
  }

  // 2. Send 30min reminder
  const thirtyMinutesBefore = demoTime - 30 * 60 * 1000;
  if (thirtyMinutesBefore > Date.now() && !cancelled) {
    const delay30m = thirtyMinutesBefore - Date.now();
    await condition(() => cancelled, delay30m);

    if (!cancelled) {
      const currentLead = await getLeadById(leadId);
      if (currentLead && currentLead.stage !== 'won' && currentLead.stage !== 'lost') {
        const message = generateFollowUpMessage('pre_demo_reminder', context);
        await sendMessage(currentLead.phone, message);
        log(tenant.tenantId, wfInfo.workflowId, 'Sent 30min reminder');
      }
    }
  }

  // 3. Post-demo follow-up (2 minutes after demo ends)
  const demoEnd = demoTime + 30 * 60 * 1000;
  const postDemoTime = demoEnd + 2 * 60 * 1000;
  if (postDemoTime > Date.now() && !cancelled) {
    const delayPost = postDemoTime - Date.now();
    await condition(() => cancelled, delayPost);

    if (!cancelled) {
      const currentLead = await getLeadById(leadId);
      if (currentLead && currentLead.stage !== 'won' && currentLead.stage !== 'lost') {
        const message = generateFollowUpMessage('post_demo', context);
        await sendMessage(currentLead.phone, message);
        log(tenant.tenantId, wfInfo.workflowId, 'Sent post-demo follow-up');
      }
    }
  }

  const finalStatus = cancelled ? 'cancelled' : 'completed';
  upsertSearchAttributes({ custom_status: [finalStatus] });
  log(tenant.tenantId, wfInfo.workflowId, `DemoReminders ${finalStatus}`);
}

// ===========================================
// REENGAGEMENT WORKFLOW
// ===========================================
export async function ReengagementWorkflow(input: ReengagementWorkflowInput): Promise<void> {
  const { tenant, leadId, lead } = input;
  const wfInfo = workflowInfo();
  let cancelled = false;

  upsertSearchAttributes({
    tenant_id: [tenant.tenantId],
    workflow_type: ['reengagement'],
    lead_id: [leadId],
    custom_status: ['active'],
  });

  log(tenant.tenantId, wfInfo.workflowId, 'Reengagement workflow started');

  setHandler(cancelFollowUpSignal, () => {
    cancelled = true;
    log(tenant.tenantId, wfInfo.workflowId, 'Reengagement cancelled via signal');
  });

  const attemptOrder: FollowUpType[] = [
    'cold_lead_reengagement',
    'reengagement_2',
    'reengagement_3',
  ];

  const delays = [
    24 * 60 * 60 * 1000,  // 24 hours
    60 * 60 * 60 * 1000,  // 60 hours
    168 * 60 * 60 * 1000, // 7 days
  ];

  for (let i = 0; i < attemptOrder.length; i++) {
    // Wait for the delay
    await condition(() => cancelled, delays[i]);

    if (cancelled) {
      upsertSearchAttributes({ custom_status: ['cancelled'] });
      log(tenant.tenantId, wfInfo.workflowId, 'Reengagement cancelled');
      return;
    }

    // Get fresh lead data
    const currentLead = await getLeadById(leadId);
    if (!currentLead) {
      upsertSearchAttributes({ custom_status: ['skipped'] });
      log(tenant.tenantId, wfInfo.workflowId, 'Lead not found, stopping');
      return;
    }

    // Stop if lead has responded or progressed
    if (currentLead.stage !== 'new' && currentLead.stage !== 'contacted') {
      upsertSearchAttributes({ custom_status: ['stopped'] });
      log(tenant.tenantId, wfInfo.workflowId, `Lead progressed to ${currentLead.stage}, stopping`);
      return;
    }

    // Check recent activity
    const lastInteraction = currentLead.last_interaction
      ? new Date(currentLead.last_interaction).getTime()
      : 0;
    const hoursSinceInteraction = (Date.now() - lastInteraction) / (1000 * 60 * 60);

    if (hoursSinceInteraction < 12) {
      upsertSearchAttributes({ custom_status: ['stopped'] });
      log(tenant.tenantId, wfInfo.workflowId, 'Recent interaction detected, stopping');
      return;
    }

    // Get memory for context
    const memory = await getLeadMemory(leadId);
    const context: FollowUpContext = {
      leadName: currentLead.name,
      company: currentLead.company,
      industry: currentLead.industry,
      challenge: currentLead.challenge,
      memory,
    };

    // Send the message
    const message = generateFollowUpMessage(attemptOrder[i], context);
    await sendMessage(currentLead.phone, message);

    log(tenant.tenantId, wfInfo.workflowId, `Sent ${attemptOrder[i]}`, { attempt: i + 1 });
  }

  // After all attempts, mark as lost
  await updateLeadStage(leadId, 'lost');
  upsertSearchAttributes({ custom_status: ['completed'] });
  log(tenant.tenantId, wfInfo.workflowId, 'Lead marked as lost after reengagement sequence');
}
