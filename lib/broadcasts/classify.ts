import { SupabaseClient } from '@supabase/supabase-js';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
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
  nuevo: 0, new: 0, initial: 0, lead: 0,
  contactado: 1, contacted: 1,
  calificado: 2, qualified: 2,
  propuesta: 3, proposal: 3,
  negociacion: 4, negotiation: 4,
  ganado: 5, won: 5, closed: 5,
  perdido: 6, lost: 6,
};

const CLASSIFICATION_STAGE: Record<Exclude<Classification, 'bot_autoresponse'>, string> = {
  hot: 'Calificado',
  warm: 'Contactado',
  cold: 'Contactado',
};

const CLASSIFICATION_PRIORITY: Record<Exclude<Classification, 'bot_autoresponse'>, string> = {
  hot: 'high',
  warm: 'medium',
  cold: 'low',
};

// ── Functions ────────────────────────────────────────────────────────

/**
 * Classify a conversation using GPT-4o-mini with structured output.
 * Falls back to 'warm' if the AI call fails.
 */
export async function classifyConversationWithAI(messages: Message[]): Promise<Classification> {
  const formatted = messages
    .map(m => `[${m.role === 'user' ? 'Contacto' : 'Bot'}]: ${m.content}`)
    .join('\n');

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: ClassificationSchema,
      temperature: 0.2,
      maxOutputTokens: 100,
      prompt: `Clasifica esta conversación post-broadcast de WhatsApp.

Categorías:
- hot: El contacto muestra intención de compra (pregunta precios, quiere demo, pide cotización, quiere contratar, dice que le interesa)
- warm: El contacto respondió con interés general (saluda, pregunta info, responde positivamente pero sin intención clara de compra)
- cold: El contacto rechaza o pide que no le escriban (no interesa, spam, bloquear, eliminar, no molestar)
- bot_autoresponse: Respuesta automática de un sistema (fuera de horario, buzón de voz, número equivocado, auto-reply, contestadora)

Mensajes de la conversación:
${formatted}`,
    });

    return object.classification;
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
