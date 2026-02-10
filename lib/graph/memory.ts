/**
 * LangGraph Memory Persistence
 * Load/save conversation state from/to Supabase conversation_states table
 */

import { getSupabase, saveLeadMemory } from '@/lib/memory/supabase';
import { PersistedConversationState, DEFAULT_PERSISTED_STATE } from './state';

/**
 * Load conversation state from Supabase.
 * If no state exists (first turn), creates one with defaults.
 */
export async function loadConversationState(
  conversationId: string,
  leadId: string
): Promise<PersistedConversationState> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('conversation_states')
    .select('*')
    .eq('conversation_id', conversationId)
    .single();

  if (data && !error) {
    return {
      phase: data.phase,
      turn_count: data.turn_count,
      lead_info: data.lead_info,
      topics_covered: data.topics_covered || [],
      products_offered: data.products_offered || [],
      objections: data.objections || [],
      summary: data.summary,
      last_summary_turn: data.last_summary_turn,
      previous_topic: data.previous_topic,
      proposed_datetime: data.proposed_datetime,
      awaiting_email: data.awaiting_email,
    };
  }

  // First turn: insert default state
  const { error: insertError } = await supabase
    .from('conversation_states')
    .insert({
      conversation_id: conversationId,
      lead_id: leadId,
      ...serializeForDb(DEFAULT_PERSISTED_STATE),
    });

  if (insertError) {
    console.error('[GraphMemory] Error creating initial state:', insertError);
  }

  return { ...DEFAULT_PERSISTED_STATE };
}

/**
 * Save conversation state to Supabase.
 */
export async function saveConversationState(
  conversationId: string,
  state: PersistedConversationState
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('conversation_states')
    .update(serializeForDb(state))
    .eq('conversation_id', conversationId);

  if (error) {
    console.error('[GraphMemory] Error saving state:', error);
  }
}

/**
 * Sync summary to lead_memory for compatibility with legacy path.
 */
export async function syncSummaryToLeadMemory(
  leadId: string,
  summary: string
): Promise<void> {
  await saveLeadMemory(leadId, summary);
}

/**
 * Serialize state for database storage.
 */
function serializeForDb(state: PersistedConversationState) {
  return {
    phase: state.phase,
    turn_count: state.turn_count,
    lead_info: state.lead_info,
    topics_covered: state.topics_covered,
    products_offered: state.products_offered,
    objections: state.objections,
    summary: state.summary,
    last_summary_turn: state.last_summary_turn,
    previous_topic: state.previous_topic,
    proposed_datetime: state.proposed_datetime,
    awaiting_email: state.awaiting_email,
  };
}
