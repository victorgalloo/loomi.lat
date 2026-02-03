import { Client, Connection } from '@temporalio/client';

// ===========================================
// MULTI-TENANT TYPES
// ===========================================

export type TenantTier = 'free' | 'starter' | 'growth' | 'business' | 'enterprise';

export interface TenantLimits {
  maxConcurrentWorkflows: number;
  maxMessagesPerDay: number;
  maxFollowUpsPerLead: number;
  workflowTimeoutMinutes: number;
}

export interface TenantContext {
  tenantId: string;
  tier: TenantTier;
  limits: TenantLimits;
}

// Default limits by tier
export const TIER_LIMITS: Record<TenantTier, TenantLimits> = {
  free: {
    maxConcurrentWorkflows: 5,
    maxMessagesPerDay: 50,
    maxFollowUpsPerLead: 2,
    workflowTimeoutMinutes: 60,
  },
  starter: {
    maxConcurrentWorkflows: 20,
    maxMessagesPerDay: 500,
    maxFollowUpsPerLead: 5,
    workflowTimeoutMinutes: 1440,
  },
  growth: {
    maxConcurrentWorkflows: 100,
    maxMessagesPerDay: 2000,
    maxFollowUpsPerLead: 10,
    workflowTimeoutMinutes: 10080,
  },
  business: {
    maxConcurrentWorkflows: 500,
    maxMessagesPerDay: 10000,
    maxFollowUpsPerLead: 20,
    workflowTimeoutMinutes: 43200,
  },
  enterprise: {
    maxConcurrentWorkflows: -1,
    maxMessagesPerDay: -1,
    maxFollowUpsPerLead: -1,
    workflowTimeoutMinutes: 129600,
  },
};

/**
 * Build TenantContext from tenant data
 * Call this when you have tenant info from your DB
 */
export function buildTenantContext(tenantId: string, tier: TenantTier = 'starter'): TenantContext {
  return {
    tenantId,
    tier,
    limits: TIER_LIMITS[tier],
  };
}

// ===========================================
// WORKFLOW ID AND QUEUE HELPERS
// ===========================================

type WorkflowType =
  | 'followup'
  | 'demo-booking'
  | 'demo-reminders'
  | 'payment'
  | 'integration-sync'
  | 'reengagement'
  | 'memory';

/**
 * Generate workflow ID with tenant prefix
 * Format: {tenant}_{workflow_type}_{uuid}
 */
function generateWorkflowId(tenantId: string, workflowType: WorkflowType, uniqueId?: string): string {
  const id = uniqueId || Math.random().toString(36).substring(2, 10);
  return `${tenantId}_${workflowType}_${id}`;
}

/**
 * Get task queue for tenant based on tier
 */
function getTaskQueueForTenant(tenantId: string, tier: TenantTier): string {
  switch (tier) {
    case 'free':
    case 'starter':
      return 'loomi-shared';
    case 'growth':
    case 'business':
      return 'loomi-priority';
    case 'enterprise':
      return `loomi-${tenantId}`;
    default:
      return 'loomi-shared';
  }
}

// ===========================================
// TEMPORAL CLIENT
// ===========================================

let clientInstance: Client | null = null;
let connectionInstance: Connection | null = null;

function getConfig() {
  const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
  const namespace = process.env.TEMPORAL_NAMESPACE || 'default';

  const certBase64 = process.env.TEMPORAL_CLIENT_CERT;
  const keyBase64 = process.env.TEMPORAL_CLIENT_KEY;

  let clientCert: Buffer | undefined;
  let clientKey: Buffer | undefined;

  if (certBase64 && keyBase64) {
    clientCert = Buffer.from(certBase64, 'base64');
    clientKey = Buffer.from(keyBase64, 'base64');
  }

  return { address, namespace, clientCert, clientKey };
}

export async function getTemporalClient(): Promise<Client> {
  if (clientInstance) {
    return clientInstance;
  }

  const config = getConfig();
  const connectTimeoutMs = parseInt(process.env.TEMPORAL_CONNECT_TIMEOUT_MS || '5000', 10);

  // Create connection with timeout
  const connectPromise = config.clientCert && config.clientKey
    ? Connection.connect({
        address: config.address,
        tls: {
          clientCertPair: {
            crt: config.clientCert,
            key: config.clientKey,
          },
        },
      })
    : Connection.connect({
        address: config.address,
      });

  // Race against timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Temporal connection timeout after ${connectTimeoutMs}ms`)), connectTimeoutMs);
  });

  connectionInstance = await Promise.race([connectPromise, timeoutPromise]);

  clientInstance = new Client({
    connection: connectionInstance,
    namespace: config.namespace,
  });

  return clientInstance;
}

// ===========================================
// FEATURE FLAGS
// ===========================================

export function isTemporalEnabled(feature: 'followups' | 'booking' | 'payments' | 'integrations'): boolean {
  const flags: Record<string, string | undefined> = {
    followups: process.env.USE_TEMPORAL_FOLLOWUPS,
    booking: process.env.USE_TEMPORAL_BOOKING,
    payments: process.env.USE_TEMPORAL_PAYMENTS,
    integrations: process.env.USE_TEMPORAL_INTEGRATIONS,
  };
  return flags[feature] === 'true';
}

// ===========================================
// LEAD & OTHER TYPES
// ===========================================

export interface Lead {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  company: string | null;
  industry: string | null;
  stage: string;
  challenge?: string | null;
}

export interface CalSlot {
  date: string;
  time: string;
}

export interface TenantCredentials {
  phoneNumberId: string;
  accessToken: string;
  tenantId?: string;
}

export type StripePlan = 'starter' | 'growth' | 'business';

export type FollowUpType =
  | 'pre_demo_reminder'
  | 'pre_demo_24h'
  | 'post_demo'
  | 'cold_lead_reengagement'
  | 'reengagement_2'
  | 'reengagement_3'
  | 'said_later'
  | 'no_show_followup'
  | 'proposal_reminder';

// ===========================================
// WORKFLOW STARTERS
// ===========================================

export async function startFollowUpWorkflow(params: {
  tenant: TenantContext;
  leadId: string;
  lead: Lead;
  type: FollowUpType;
  appointmentId?: string;
  scheduledAt?: string;
}): Promise<string> {
  const client = await getTemporalClient();
  const workflowId = generateWorkflowId(params.tenant.tenantId, 'followup', `${params.type}-${params.leadId}`);
  const taskQueue = getTaskQueueForTenant(params.tenant.tenantId, params.tenant.tier);

  await client.workflow.start('FollowUpWorkflow', {
    args: [params],
    taskQueue,
    workflowId,
    searchAttributes: {
      tenant_id: [params.tenant.tenantId],
      workflow_type: ['followup'],
      lead_id: [params.leadId],
    },
  });

  return workflowId;
}

export async function startDemoRemindersWorkflow(params: {
  tenant: TenantContext;
  leadId: string;
  lead: Lead;
  appointmentId: string;
  scheduledAt: string;
}): Promise<string> {
  const client = await getTemporalClient();
  const workflowId = generateWorkflowId(params.tenant.tenantId, 'demo-reminders', params.appointmentId);
  const taskQueue = getTaskQueueForTenant(params.tenant.tenantId, params.tenant.tier);

  await client.workflow.start('DemoRemindersWorkflow', {
    args: [params],
    taskQueue,
    workflowId,
    searchAttributes: {
      tenant_id: [params.tenant.tenantId],
      workflow_type: ['demo-reminders'],
      lead_id: [params.leadId],
    },
  });

  return workflowId;
}

export async function startReengagementWorkflow(params: {
  tenant: TenantContext;
  leadId: string;
  lead: Lead;
}): Promise<string> {
  const client = await getTemporalClient();
  const workflowId = generateWorkflowId(params.tenant.tenantId, 'reengagement', params.leadId);
  const taskQueue = getTaskQueueForTenant(params.tenant.tenantId, params.tenant.tier);

  await client.workflow.start('ReengagementWorkflow', {
    args: [params],
    taskQueue,
    workflowId,
    workflowIdReusePolicy: 'REJECT_DUPLICATE',
    searchAttributes: {
      tenant_id: [params.tenant.tenantId],
      workflow_type: ['reengagement'],
      lead_id: [params.leadId],
    },
  });

  return workflowId;
}

export async function startDemoBookingWorkflow(params: {
  tenant: TenantContext;
  leadId: string;
  lead: Lead;
  slot: CalSlot;
  email: string;
  tenantCredentials?: TenantCredentials;
}): Promise<string> {
  const client = await getTemporalClient();
  const workflowId = generateWorkflowId(params.tenant.tenantId, 'demo-booking', params.leadId);
  const taskQueue = getTaskQueueForTenant(params.tenant.tenantId, params.tenant.tier);

  await client.workflow.start('DemoBookingWorkflow', {
    args: [params],
    taskQueue,
    workflowId,
    searchAttributes: {
      tenant_id: [params.tenant.tenantId],
      workflow_type: ['demo-booking'],
      lead_id: [params.leadId],
    },
  });

  return workflowId;
}

export async function startPaymentWorkflow(params: {
  tenant: TenantContext;
  leadId: string;
  lead: Lead;
  email: string;
  plan: StripePlan;
  tenantCredentials?: TenantCredentials;
}): Promise<string> {
  const client = await getTemporalClient();
  // Idempotent: same lead+plan = same workflow
  const workflowId = generateWorkflowId(params.tenant.tenantId, 'payment', `${params.leadId}-${params.plan}`);
  const taskQueue = getTaskQueueForTenant(params.tenant.tenantId, params.tenant.tier);

  await client.workflow.start('PaymentWorkflow', {
    args: [params],
    taskQueue,
    workflowId,
    workflowIdReusePolicy: 'REJECT_DUPLICATE',
    searchAttributes: {
      tenant_id: [params.tenant.tenantId],
      workflow_type: ['payment'],
      lead_id: [params.leadId],
    },
  });

  return workflowId;
}

export async function startIntegrationSyncWorkflow(params: {
  tenant: TenantContext;
  leadId: string;
  lead: Lead;
  conversationId?: string;
  eventType: 'demo_scheduled' | 'lead_qualified' | 'payment_completed' | 'conversation_ended';
}): Promise<string> {
  const client = await getTemporalClient();
  const workflowId = generateWorkflowId(params.tenant.tenantId, 'integration-sync', `${params.eventType}-${params.leadId}`);
  const taskQueue = getTaskQueueForTenant(params.tenant.tenantId, params.tenant.tier);

  await client.workflow.start('IntegrationSyncWorkflow', {
    args: [params],
    taskQueue,
    workflowId,
    searchAttributes: {
      tenant_id: [params.tenant.tenantId],
      workflow_type: ['integration-sync'],
      lead_id: [params.leadId],
    },
  });

  return workflowId;
}

// ===========================================
// CANCEL WORKFLOWS
// ===========================================

/**
 * Cancel all follow-up workflows for a lead
 * Queries by tenant_id + lead_id + running status
 */
export async function cancelFollowUps(tenantId: string, leadId: string): Promise<void> {
  const client = await getTemporalClient();

  // Query running workflows for this tenant and lead
  const query = `tenant_id = "${tenantId}" AND lead_id = "${leadId}" AND ExecutionStatus = "Running" AND (workflow_type = "followup" OR workflow_type = "demo-reminders" OR workflow_type = "reengagement")`;

  const workflows = client.workflow.list({ query });

  for await (const workflow of workflows) {
    try {
      const handle = client.workflow.getHandle(workflow.workflowId);
      await handle.signal('cancelFollowUp');
    } catch (error) {
      console.warn(`Failed to cancel workflow ${workflow.workflowId}:`, error);
    }
  }
}

/**
 * Cancel demo reminders for a specific appointment
 */
export async function cancelDemoReminders(tenantId: string, appointmentId: string): Promise<void> {
  const client = await getTemporalClient();
  const workflowId = `${tenantId}_demo-reminders_${appointmentId}`;

  try {
    const handle = client.workflow.getHandle(workflowId);
    await handle.signal('cancelFollowUp');
  } catch (error) {
    console.warn(`Failed to cancel demo reminders ${workflowId}:`, error);
  }
}

/**
 * Signal payment completed (called from Stripe webhook)
 */
export async function signalPaymentCompleted(
  tenantId: string,
  leadId: string,
  plan: StripePlan,
  data: { sessionId: string; subscriptionId: string }
): Promise<void> {
  const client = await getTemporalClient();
  const workflowId = `${tenantId}_payment_${leadId}-${plan}`;

  try {
    const handle = client.workflow.getHandle(workflowId);
    await handle.signal('paymentCompleted', data);
  } catch (error) {
    console.warn(`Failed to signal payment workflow ${workflowId}:`, error);
  }
}

// ===========================================
// WORKFLOW QUERIES
// ===========================================

/**
 * Get running workflow count for a tenant
 * Useful for enforcing limits
 */
export async function getRunningWorkflowCount(tenantId: string): Promise<number> {
  const client = await getTemporalClient();
  const query = `tenant_id = "${tenantId}" AND ExecutionStatus = "Running"`;

  let count = 0;
  const workflows = client.workflow.list({ query });
  for await (const _ of workflows) {
    count++;
  }
  return count;
}

/**
 * Get workflows for a lead
 */
export async function getLeadWorkflows(tenantId: string, leadId: string): Promise<string[]> {
  const client = await getTemporalClient();
  const query = `tenant_id = "${tenantId}" AND lead_id = "${leadId}"`;

  const workflowIds: string[] = [];
  const workflows = client.workflow.list({ query });
  for await (const workflow of workflows) {
    workflowIds.push(workflow.workflowId);
  }
  return workflowIds;
}
