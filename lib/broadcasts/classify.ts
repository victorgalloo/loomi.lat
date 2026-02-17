import { SupabaseClient } from '@supabase/supabase-js';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage } from '@langchain/core/messages';
import { z } from 'zod';

// ── AI Classification Schema ────────────────────────────────────────

const ClassificationSchema = z.object({
  classification: z.enum(['hot', 'warm', 'cold', 'bot_autoresponse']),
  reason: z.string(),
});

// ── Types ────────────────────────────────────────────────────────────

export type Classification = 'hot' | 'warm' | 'cold' | 'bot_autoresponse';

interface Message {
  role: string;
  content: string;
}

// ── Stage pipeline ───────────────────────────────────────────────────

const STAGE_POSITION: Record<string, number> = {
  cold: 0, nuevo: 0, new: 0, initial: 0, lead: 0, contactado: 0,
  warm: 1, contacted: 1,
  hot: 2, calificado: 2, qualified: 2, propuesta: 2, negociacion: 2,
  ganado: 3, won: 3, closed: 3,
  perdido: 4, lost: 4,
};

const CLASSIFICATION_STAGE: Record<Exclude<Classification, 'bot_autoresponse'>, string> = {
  hot: 'Hot',
  warm: 'Warm',
  cold: 'Cold',
};

const CLASSIFICATION_PRIORITY: Record<Exclude<Classification, 'bot_autoresponse'>, string> = {
  hot: 'high',
  warm: 'medium',
  cold: 'low',
};

// ── Functions ────────────────────────────────────────────────────────

/**
 * Classify a conversation using Haiku with structured output.
 * Falls back to 'warm' if the AI call fails.
 */
export async function classifyConversationWithAI(messages: Message[]): Promise<Classification> {
  const formatted = messages
    .map(m => `[${m.role === 'user' ? 'Contacto' : 'Bot'}]: ${m.content}`)
    .join('\n');

  try {
    const model = new ChatAnthropic({
      model: 'claude-haiku-4-5-20251001',
      temperature: 0.2,
      maxTokens: 100,
    });

    const result = await model.withStructuredOutput(ClassificationSchema).invoke([
      new HumanMessage(`Clasifica esta conversación post-broadcast de WhatsApp.

Categorías:
- hot: El contacto muestra intención de compra (pregunta precios, quiere demo, pide cotización, quiere contratar, dice que le interesa)
- warm: El contacto respondió con interés general (saluda, pregunta info, responde positivamente pero sin intención clara de compra)
- cold: El contacto rechaza o pide que no le escriban (no interesa, spam, bloquear, eliminar, no molestar)
- bot_autoresponse: Respuesta automática de un sistema (fuera de horario, buzón de voz, número equivocado, auto-reply, contestadora)

Mensajes de la conversación:
${formatted}`)
    ]);

    return result.classification;
  } catch (error) {
    console.error('AI classification failed, defaulting to warm:', error);
    return 'warm';
  }
}

/**
 * Returns true only if the proposed stage is an upgrade (never downgrade).
 */
export function shouldUpdatePipeline(currentStage: string, proposedStage: string): boolean {
  const currentPos = STAGE_POSITION[currentStage.toLowerCase()] ?? 0;
  const proposedPos = STAGE_POSITION[proposedStage.toLowerCase()] ?? 0;
  return proposedPos > currentPos;
}

/**
 * Update a lead's stage and priority based on classification (only upgrades).
 */
export async function applyClassificationToLead(
  supabase: SupabaseClient,
  leadId: string,
  classification: Classification,
  currentStage: string,
): Promise<void> {
  // Always persist the classification on the lead
  const update: Record<string, string> = {
    broadcast_classification: classification,
    last_activity_at: new Date().toISOString(),
  };

  if (classification !== 'bot_autoresponse') {
    const proposedStage = CLASSIFICATION_STAGE[classification];
    if (shouldUpdatePipeline(currentStage, proposedStage)) {
      update.stage = proposedStage;
      update.priority = CLASSIFICATION_PRIORITY[classification];
    }
  }

  await supabase
    .from('leads')
    .update(update)
    .eq('id', leadId);
}
