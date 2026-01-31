/**
 * Conversation Context Builder
 * Builds the context object passed to the agent
 *
 * Optimized with:
 * - Promise.all() for parallel database operations (async-parallel)
 * - Start promises early, await late (async-api-routes)
 */

import { ConversationContext, Lead, Conversation } from '@/types';
import { ParsedWhatsAppMessage } from '@/lib/whatsapp/parse';
import {
  getLeadByPhone,
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

// Números de prueba - se guardan con is_test=true para poder resetear
const TEST_PHONE_NUMBERS = new Set([
  '4779083304',
  '524779083304',
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
 */
export async function getConversationContext(
  message: ParsedWhatsAppMessage
): Promise<ConversationContext> {
  const isTest = isTestNumber(message.phone);

  if (isTest) {
    console.log(`[Context] Test number detected: ${message.phone} - persisting with is_test=true`);
  }

  // Start lead lookup immediately (async-api-routes)
  const leadPromise = getLeadByPhone(message.phone);

  // Await lead to check if we need to create one
  let lead = await leadPromise;

  if (!lead) {
    // Create lead with is_test flag if it's a test number
    lead = await createLead(message.phone, message.name, { isTest });
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
