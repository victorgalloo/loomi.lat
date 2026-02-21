/**
 * Conversation Context Builder
 * Builds the context object passed to the agent
 *
 * Optimized with:
 * - Promise.all() for parallel database operations (async-parallel)
 * - Start promises early, await late (async-api-routes)
 */

import { ConversationContext, Lead, Conversation, Message, Appointment } from '@/types';
import { ParsedWhatsAppMessage } from '@/lib/whatsapp/parse';
import {
  getLeadByPhone,
  getLeadByPhoneAndTenant,
  createLead,
  getActiveConversation,
  createConversation,
  getRecentMessages,
  getLeadMemory,
  getActiveAppointment,
  getConversationCount,
  getFirstInteractionDate,
  getSupabase
} from './supabase';
import { AgentConfig } from '@/lib/tenant/context';
import { CustomToolDef } from '@/lib/tenant/knowledge';
import { decrypt } from '@/lib/crypto';
import { CalTenantConfig } from '@/lib/tools/calendar';
import { PersistedConversationState, DEFAULT_PERSISTED_STATE } from '@/lib/graph/state';

/** Ensure lead_info has all required fields (DB can return null/partial JSONB) */
function ensureLeadInfo(raw: PersistedConversationState['lead_info'] | null): PersistedConversationState['lead_info'] {
  if (!raw) return { ...DEFAULT_PERSISTED_STATE.lead_info };
  return {
    business_type: raw.business_type ?? null,
    volume: raw.volume ?? null,
    pain_points: Array.isArray(raw.pain_points) ? raw.pain_points : [],
    current_solution: raw.current_solution ?? null,
    referral_source: raw.referral_source ?? null,
  };
}

// Números de prueba - se auto-resetean en cada mensaje para siempre empezar como contacto nuevo
const TEST_PHONE_NUMBERS = new Set<string>([
  '5214779083304',
]);

/**
 * Check if phone number is a test number
 */
function isTestNumber(phone: string): boolean {
  // Normalizar: quitar prefijos comunes
  const normalized = phone.replace(/^\+?52?1?/, '');
  return TEST_PHONE_NUMBERS.has(phone) || TEST_PHONE_NUMBERS.has(normalized);
}

/**
 * Get or create conversation context for a message
 * Optimized: Parallel database operations
 * Multi-tenant: Optional tenantId for data isolation
 */
export async function getConversationContext(
  message: ParsedWhatsAppMessage,
  tenantId?: string
): Promise<ConversationContext> {
  const isTest = isTestNumber(message.phone);

  if (isTest) {
    console.log(`[Context] Test number detected: ${message.phone} - is_test=true`);
  }

  // Start lead lookup immediately (async-api-routes)
  // For multi-tenant, we look up by phone + tenant_id
  const leadPromise = tenantId
    ? getLeadByPhoneAndTenant(message.phone, tenantId)
    : getLeadByPhone(message.phone);

  // Await lead to check if we need to create one
  let lead = await leadPromise;

  if (!lead) {
    // Create lead with is_test flag if it's a test number
    lead = await createLead(message.phone, message.name, { isTest, tenantId });
  } else if (lead.name === 'Usuario' && message.name && message.name !== 'Usuario') {
    // Update name in background (non-blocking)
    Promise.resolve(
      getSupabase()
        .from('leads')
        .update({ name: message.name })
        .eq('id', lead.id)
    ).catch(console.error);
    lead.name = message.name;
  }

  // Start conversation lookup
  let conversation = await getActiveConversation(lead.id);

  if (!conversation) {
    conversation = await createConversation(lead.id);
  }

  // Now fetch all remaining data in parallel (async-parallel)
  const [
    recentMessages,
    memory,
    appointment,
    totalConversations,
    firstInteractionDate
  ] = await Promise.all([
    getRecentMessages(conversation.id, 20),
    getLeadMemory(lead.id),
    getActiveAppointment(lead.id),
    getConversationCount(lead.id),
    getFirstInteractionDate(lead.id)
  ]);

  return {
    lead,
    conversation,
    recentMessages,
    memory,
    appointment: appointment ?? undefined,
    hasActiveAppointment: !!appointment,
    isFirstConversation: totalConversations <= 1,
    totalConversations,
    firstInteractionDate: firstInteractionDate ?? undefined
  };
}

/**
 * Get active conversation for a lead (helper for cron job)
 */
export { getActiveConversation };

/**
 * Result of the consolidated webhook context RPC
 */
export interface WebhookContextResult {
  context: ConversationContext;
  agentConfig: AgentConfig | undefined;
  calConfig: CalTenantConfig | undefined;
  botPaused: boolean;
  conversationState: PersistedConversationState | undefined;
}

/**
 * Get all webhook context in a single Supabase RPC call
 * Replaces 12 individual queries with 1 Postgres function call
 */
export async function getWebhookContext(
  message: ParsedWhatsAppMessage,
  tenantId?: string
): Promise<WebhookContextResult> {
  const isTest = isTestNumber(message.phone);
  const supabase = getSupabase();

  if (isTest) {
    console.log(`[Context] Test number detected: ${message.phone} - is_test=true`);
  }

  const { data, error } = await supabase.rpc('get_webhook_context', {
    p_phone: message.phone,
    p_name: message.name || 'Usuario',
    p_tenant_id: tenantId ?? null,
    p_is_test: isTest,
  });

  if (error || !data) {
    console.error('[Context] RPC get_webhook_context failed, falling back to individual queries:', error);
    // Fallback to the original multi-query approach
    const context = await getConversationContext(message, tenantId);
    return { context, agentConfig: undefined, calConfig: undefined, botPaused: false, conversationState: undefined };
  }

  const r = data as Record<string, unknown>;

  // Parse lead
  const leadData = r.lead as Record<string, unknown>;
  const lead: Lead = {
    id: leadData.id as string,
    phone: leadData.phone as string,
    name: leadData.name as string,
    email: leadData.email as string | undefined,
    company: leadData.company as string | undefined,
    industry: leadData.industry as string | undefined,
    stage: leadData.stage as string,
    challenge: leadData.challenge as string | undefined,
    createdAt: new Date(leadData.created_at as string),
    lastInteraction: new Date(leadData.created_at as string),
  };

  // Parse conversation
  const convData = r.conversation as Record<string, unknown>;
  const conversation: Conversation = {
    id: convData.id as string,
    leadId: convData.lead_id as string,
    startedAt: new Date(convData.started_at as string),
    endedAt: convData.ended_at ? new Date(convData.ended_at as string) : undefined,
    summary: convData.summary as string | undefined,
  };

  // Parse messages
  const messagesRaw = r.recentMessages as Array<Record<string, unknown>> | null;
  const recentMessages: Message[] = (messagesRaw || []).map(m => ({
    id: m.id as string,
    role: m.role as 'user' | 'assistant',
    content: m.content as string,
    timestamp: new Date(m.created_at as string),
  }));

  // Parse appointment
  const apptRaw = r.activeAppointment as Record<string, unknown> | null;
  const appointment: Appointment | undefined = apptRaw
    ? {
        id: apptRaw.id as string,
        scheduledAt: new Date(apptRaw.scheduled_at as string),
        eventId: apptRaw.event_id as string | undefined,
      }
    : undefined;

  const convCount = (r.conversationCount as number) || 0;
  const firstInteraction = r.firstInteractionDate
    ? new Date(r.firstInteractionDate as string)
    : undefined;

  const context: ConversationContext = {
    lead,
    conversation,
    recentMessages,
    memory: (r.memory as string) || null,
    appointment,
    hasActiveAppointment: !!appointment,
    isFirstConversation: convCount <= 1,
    totalConversations: convCount,
    firstInteractionDate: firstInteraction ?? undefined,
  };

  // Parse agent config
  let agentConfig: AgentConfig | undefined;
  const acRaw = r.agentConfig as Record<string, unknown> | null;
  if (acRaw) {
    agentConfig = {
      id: acRaw.id as string,
      tenantId: acRaw.tenant_id as string,
      businessName: acRaw.business_name as string | null,
      businessDescription: acRaw.business_description as string | null,
      productsServices: acRaw.products_services as string | null,
      tone: (acRaw.tone as AgentConfig['tone']) || 'professional',
      customInstructions: acRaw.custom_instructions as string | null,
      businessHours: (acRaw.business_hours as Record<string, unknown>) || {},
      autoReplyEnabled: acRaw.auto_reply_enabled as boolean ?? true,
      greetingMessage: acRaw.greeting_message as string | null,
      fallbackMessage: acRaw.fallback_message as string | null,
      systemPrompt: acRaw.system_prompt as string | null,
      fewShotExamples: (acRaw.few_shot_examples as AgentConfig['fewShotExamples']) || [],
      productsCatalog: (acRaw.products_catalog as Record<string, unknown>) || {},
      model: acRaw.model as string | null,
      productContext: acRaw.product_context as string | null,
      pricingContext: acRaw.pricing_context as string | null,
      salesProcessContext: acRaw.sales_process_context as string | null,
      qualificationContext: acRaw.qualification_context as string | null,
      competitorContext: acRaw.competitor_context as string | null,
      objectionHandlers: (acRaw.objection_handlers as Record<string, string>) || {},
      analysisEnabled: acRaw.analysis_enabled as boolean ?? true,
      maxResponseTokens: (acRaw.max_response_tokens as number) ?? 500,
      temperature: acRaw.temperature != null ? Number(acRaw.temperature) : 0.7,
      agentName: acRaw.agent_name as string | null,
      agentRole: acRaw.agent_role as string | null,
    };

    // Enrich with tenant documents (knowledge context)
    const docsRaw = r.tenantDocuments as Array<Record<string, string>> | null;
    if (docsRaw && docsRaw.length > 0) {
      const docsContext = docsRaw
        .map(d => `### ${d.name}\n${d.content}`)
        .join('\n\n');
      (agentConfig as AgentConfig & { knowledgeContext?: string }).knowledgeContext =
        `# KNOWLEDGE BASE\nUsa esta información para responder preguntas:\n\n${docsContext}`;
    }

    // Enrich with custom tools
    const toolsRaw = r.tenantTools as Array<Record<string, unknown>> | null;
    if (toolsRaw && toolsRaw.length > 0) {
      const customTools: CustomToolDef[] = toolsRaw.map(t => ({
        name: t.name as string,
        displayName: t.display_name as string,
        description: t.description as string,
        parameters: (t.parameters as Record<string, unknown>) || {},
        executionType: t.execution_type as CustomToolDef['executionType'],
        mockResponse: t.mock_response,
      }));
      (agentConfig as AgentConfig & { customTools?: CustomToolDef[] }).customTools = customTools;
    }

    if (docsRaw && docsRaw.length > 0 || toolsRaw && toolsRaw.length > 0) {
      console.log(`[Context] Tenant ${tenantId}: docs=${docsRaw?.length || 0}, tools=${toolsRaw?.length || 0}`);
    }
  }

  // Parse cal config (decrypt access token in JS)
  let calConfig: CalTenantConfig | undefined;
  const calRaw = r.calConfig as Record<string, unknown> | null;
  if (calRaw && tenantId) {
    const encryptedToken = calRaw.access_token_encrypted as string | null;
    const eventTypeId = calRaw.cal_event_type_id as string | null;
    if (encryptedToken && eventTypeId) {
      try {
        calConfig = {
          apiKey: decrypt(encryptedToken),
          eventTypeId,
          tenantId,
        };
      } catch (e) {
        console.error('[Context] Failed to decrypt Cal.com token:', e);
      }
    }
  }

  // Parse conversation state (preloaded from RPC to avoid duplicate query in graph)
  let conversationState: PersistedConversationState | undefined;
  const csRaw = r.conversationState as Record<string, unknown> | null;
  if (csRaw) {
    conversationState = {
      phase: csRaw.phase as PersistedConversationState['phase'],
      turn_count: (csRaw.turn_count as number) || 0,
      lead_info: ensureLeadInfo(csRaw.lead_info as PersistedConversationState['lead_info'] | null),
      topics_covered: (csRaw.topics_covered as string[]) || [],
      products_offered: (csRaw.products_offered as string[]) || [],
      objections: (csRaw.objections as PersistedConversationState['objections']) || [],
      summary: csRaw.summary as string | null,
      last_summary_turn: (csRaw.last_summary_turn as number) || 0,
      previous_topic: csRaw.previous_topic as string | null,
      proposed_datetime: csRaw.proposed_datetime as PersistedConversationState['proposed_datetime'],
      awaiting_email: (csRaw.awaiting_email as boolean) || false,
      ask_counts: (csRaw.ask_counts as Record<string, number>) || {},
      stalled_turns: (csRaw.stalled_turns as number) || 0,
    };
  }

  return {
    context,
    agentConfig,
    calConfig,
    botPaused: (r.botPaused as boolean) || false,
    conversationState,
  };
}

/**
 * Get conversation context by lead ID (for follow-ups)
 * Optimized: Parallel database operations
 */
export async function getContextByLeadId(leadId: string): Promise<ConversationContext | null> {
  const { getLeadById } = await import('./supabase');

  // Start lead lookup
  const lead = await getLeadById(leadId);
  if (!lead) return null;

  // Get or create conversation
  let conversation = await getActiveConversation(leadId);
  if (!conversation) {
    conversation = await createConversation(leadId);
  }

  // Fetch all data in parallel (async-parallel)
  const [
    recentMessages,
    memory,
    appointment,
    totalConversations,
    firstInteractionDate
  ] = await Promise.all([
    getRecentMessages(conversation.id, 20),
    getLeadMemory(leadId),
    getActiveAppointment(leadId),
    getConversationCount(leadId),
    getFirstInteractionDate(leadId)
  ]);

  return {
    lead,
    conversation,
    recentMessages,
    memory,
    appointment: appointment ?? undefined,
    hasActiveAppointment: !!appointment,
    isFirstConversation: totalConversations <= 1,
    totalConversations,
    firstInteractionDate: firstInteractionDate ?? undefined
  };
}
