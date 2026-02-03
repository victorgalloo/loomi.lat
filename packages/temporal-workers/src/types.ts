// Shared types for Temporal workflows and activities

// ===========================================
// MULTI-TENANT FOUNDATION
// ===========================================

/**
 * Tenant configuration for workflow execution
 * Required in ALL workflow inputs for proper isolation
 */
export interface TenantContext {
  tenantId: string;
  tier: TenantTier;
  // Limits (loaded from config, not hardcoded)
  limits: TenantLimits;
}

export type TenantTier = 'free' | 'starter' | 'growth' | 'business' | 'enterprise';

export interface TenantLimits {
  maxConcurrentWorkflows: number;
  maxMessagesPerDay: number;
  maxFollowUpsPerLead: number;
  workflowTimeoutMinutes: number;
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
    workflowTimeoutMinutes: 1440, // 24h
  },
  growth: {
    maxConcurrentWorkflows: 100,
    maxMessagesPerDay: 2000,
    maxFollowUpsPerLead: 10,
    workflowTimeoutMinutes: 10080, // 7 days
  },
  business: {
    maxConcurrentWorkflows: 500,
    maxMessagesPerDay: 10000,
    maxFollowUpsPerLead: 20,
    workflowTimeoutMinutes: 43200, // 30 days
  },
  enterprise: {
    maxConcurrentWorkflows: -1, // unlimited
    maxMessagesPerDay: -1,
    maxFollowUpsPerLead: -1,
    workflowTimeoutMinutes: 129600, // 90 days
  },
};

/**
 * Generate workflow ID with tenant prefix
 * Format: {tenant}_{workflow_type}_{uuid}
 */
export function generateWorkflowId(
  tenantId: string,
  workflowType: WorkflowType,
  uniqueId?: string
): string {
  const id = uniqueId || crypto.randomUUID().slice(0, 8);
  return `${tenantId}_${workflowType}_${id}`;
}

export type WorkflowType =
  | 'followup'
  | 'demo-booking'
  | 'demo-reminders'
  | 'payment'
  | 'integration-sync'
  | 'reengagement'
  | 'memory';

/**
 * Get task queue for tenant based on tier
 * - free/starter: shared queue
 * - growth/business: dedicated queue
 * - enterprise: isolated queue
 */
export function getTaskQueueForTenant(tenantId: string, tier: TenantTier): string {
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

// Search Attribute keys (must be registered in Temporal)
export const SEARCH_ATTRIBUTES = {
  TENANT_ID: 'tenant_id',
  WORKFLOW_TYPE: 'workflow_type',
  LEAD_ID: 'lead_id',
  STATUS: 'custom_status',
} as const;

// ===========================================
// LEAD & CORE TYPES
// ===========================================

export interface Lead {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  company: string | null;
  industry: string | null;
  stage: LeadStage;
  created_at: string;
  last_interaction: string | null;
  is_test: boolean;
  tenant_id: string | null;
  is_qualified: boolean | null;
  challenge: string | null;
  message_volume: string | null;
  stripe_customer_id: string | null;
  account_id: string | null;
}

export type LeadStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'demo_scheduled'
  | 'proposal_sent'
  | 'negotiation'
  | 'won'
  | 'lost';

export interface TenantCredentials {
  phoneNumberId: string;
  accessToken: string;
  tenantId?: string;
}

export interface CalSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
}

export interface BookingResult {
  success: boolean;
  eventId?: string;
  meetingUrl?: string;
  error?: string;
}

export interface Appointment {
  id: string;
  lead_id: string;
  scheduled_at: string;
  event_id: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  created_at: string;
}

export interface FollowUpRecord {
  id: string;
  lead_id: string;
  appointment_id: string | null;
  scheduled_for: string;
  type: FollowUpType;
  message: string;
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
  sent_at: string | null;
  attempt: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

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

export interface CheckoutResult {
  url: string;
  shortUrl: string;
  sessionId: string;
  accountId: string;
}

export type StripePlan = 'starter' | 'growth' | 'business';

// ===========================================
// WORKFLOW INPUT TYPES
// All inputs MUST include TenantContext for multi-tenant isolation
// ===========================================

/** Base input that all workflows must extend */
export interface BaseWorkflowInput {
  /** Required: Tenant context for isolation and limits */
  tenant: TenantContext;
  /** Lead ID for search attributes */
  leadId: string;
  /** Full lead data */
  lead: Lead;
}

export interface FollowUpWorkflowInput extends BaseWorkflowInput {
  type: FollowUpType;
  appointmentId?: string;
  scheduledAt?: string; // ISO date for demos
}

export interface DemoBookingWorkflowInput extends BaseWorkflowInput {
  slot: CalSlot;
  email: string;
  tenantCredentials?: TenantCredentials;
}

export interface PaymentWorkflowInput extends BaseWorkflowInput {
  email: string;
  plan: StripePlan;
  tenantCredentials?: TenantCredentials;
}

export interface IntegrationSyncWorkflowInput extends BaseWorkflowInput {
  conversationId?: string;
  eventType: 'demo_scheduled' | 'lead_qualified' | 'payment_completed' | 'conversation_ended';
}

export interface DemoRemindersWorkflowInput extends BaseWorkflowInput {
  appointmentId: string;
  scheduledAt: string;
}

export interface ReengagementWorkflowInput extends BaseWorkflowInput {
  // No additional fields needed
}

export interface MemoryGenerationWorkflowInput {
  tenant: TenantContext;
  leadId: string;
  conversationId: string;
}

// Message context for follow-up generation
export interface FollowUpContext {
  leadName: string | null;
  company: string | null;
  industry: string | null;
  scheduledAt?: string;
  challenge?: string | null;
  memory?: string | null;
}
