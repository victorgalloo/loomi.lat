/**
 * Persistent Conversation State
 *
 * Generates and persists a structured summary of the conversation
 * using Haiku. Updated every ~5 user messages to keep cost low
 * while maintaining fresh context for the agent.
 */

import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage } from '@langchain/core/messages';
import { z } from 'zod';
// Types defined inline (not yet exported from @/types)
interface Message {
  role: string;
  content: string;
}

interface ConversationState {
  current_phase: string;
  topics_covered: string[];
  objections_raised: string[];
  objections_resolved: string[];
  lead_interest_level: string;
  next_action: string;
  summary: string;
  message_count_at_update: number;
  last_updated: string;
}
import { getSupabase } from '@/lib/memory/supabase';

const STATE_REFRESH_INTERVAL = 5; // user messages between state updates

const ConversationStateSchema = z.object({
  current_phase: z.string()
    .describe('Fase actual de la conversacion, ej: discovery, objection_handling, closing, follow_up'),
  topics_covered: z.array(z.string())
    .describe('Temas que ya se cubrieron, ej: ["pricing", "features", "competitor_comparison"]'),
  objections_raised: z.array(z.string())
    .describe('Objeciones que el lead ha expresado'),
  objections_resolved: z.array(z.string())
    .describe('Objeciones que ya se resolvieron'),
  lead_interest_level: z.string()
    .describe('Nivel de interes actual: low, medium, high'),
  next_action: z.string()
    .describe('Siguiente accion recomendada para el agente'),
  summary: z.string()
    .describe('Resumen conciso de toda la conversacion: que quiere el lead, que se ha ofrecido, en que quedaron'),
});

/**
 * Decide if the conversation state needs a refresh
 */
export function shouldRefreshState(
  currentState: ConversationState | null,
  userMessageCount: number
): boolean {
  // No state yet and we have enough messages to generate one
  if (!currentState && userMessageCount >= 3) return true;

  // State exists but is stale
  if (currentState) {
    const messagesSinceUpdate = userMessageCount - currentState.message_count_at_update;
    return messagesSinceUpdate >= STATE_REFRESH_INTERVAL;
  }

  return false;
}

/**
 * Generate conversation state from message history using Haiku
 */
export async function generateConversationState(
  messages: Message[],
  currentState: ConversationState | null,
  leadContext?: { name?: string; company?: string; industry?: string }
): Promise<ConversationState> {
  const userMessageCount = messages.filter(m => m.role === 'user').length;

  const historyText = messages
    .map((m, i) => `[${i + 1}] ${m.role === 'user' ? 'CLIENTE' : 'AGENTE'}: ${m.content}`)
    .join('\n');

  const previousStateContext = currentState
    ? `\n\n# ESTADO ANTERIOR (actualiza, no reemplaces sin razon):\n${JSON.stringify(currentState, null, 2)}`
    : '';

  const model = new ChatAnthropic({
    model: 'claude-haiku-4-5-20251001',
    temperature: 0.2,
  });

  const result = await model.withStructuredOutput(ConversationStateSchema).invoke([
    new HumanMessage(`Analiza esta conversacion de ventas y genera un resumen estructurado del estado actual.

# CONTEXTO DEL LEAD
- Nombre: ${leadContext?.name || 'desconocido'}
- Empresa: ${leadContext?.company || 'desconocido'}
- Industria: ${leadContext?.industry || 'desconocido'}
${previousStateContext}

# CONVERSACION COMPLETA (${messages.length} mensajes)
${historyText}

# INSTRUCCIONES
1. Resume QUE quiere el lead, QUE se le ha ofrecido, y EN QUE quedaron
2. Lista TODOS los temas que se cubrieron (no pierdas ninguno)
3. Identifica objeciones pendientes vs resueltas
4. El summary debe ser conciso pero completo (max 3 oraciones)
5. Si hay estado anterior, CONSERVA informacion relevante que siga vigente`)
  ]);

  return {
    ...result,
    message_count_at_update: userMessageCount,
    last_updated: new Date().toISOString(),
  };
}

/**
 * Save conversation state to Supabase
 */
export async function saveConversationState(
  conversationId: string,
  state: ConversationState
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('conversations')
    .update({ state })
    .eq('id', conversationId);

  if (error) {
    console.error('[ConversationState] Error saving state:', error.message);
  }
}

/**
 * Format conversation state for prompt injection
 */
export function formatStateForPrompt(state: ConversationState): string {
  const parts = [
    `Fase: ${state.current_phase}`,
    `Interés: ${state.lead_interest_level}`,
  ];

  if (state.topics_covered.length > 0) {
    parts.push(`Temas cubiertos: ${state.topics_covered.join(', ')}`);
  }

  if (state.objections_raised.length > 0) {
    const pending = state.objections_raised.filter(
      o => !state.objections_resolved.includes(o)
    );
    if (pending.length > 0) {
      parts.push(`Objeciones pendientes: ${pending.join(', ')}`);
    }
    if (state.objections_resolved.length > 0) {
      parts.push(`Objeciones resueltas: ${state.objections_resolved.join(', ')}`);
    }
  }

  parts.push(`Resumen: ${state.summary}`);
  parts.push(`Siguiente acción: ${state.next_action}`);

  return `# ESTADO DE LA CONVERSACIÓN\n${parts.join('\n')}`;
}
