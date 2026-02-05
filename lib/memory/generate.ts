/**
 * Memory Generation Module
 * Generates summaries of conversations for long-term context
 */

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { Message } from '@/types';
import { saveLeadMemory, getLeadMemory } from './supabase';

/**
 * Check if we should generate memory for this conversation
 */
export async function shouldGenerateMemory(
  conversationStartedAt: Date,
  messageCount: number
): Promise<boolean> {
  // Generate memory every 5 messages or if conversation is over 10 minutes old
  const conversationAgeMinutes = (Date.now() - conversationStartedAt.getTime()) / (1000 * 60);

  if (messageCount >= 5 && messageCount % 5 === 0) {
    return true;
  }

  if (conversationAgeMinutes >= 10 && messageCount >= 3) {
    return true;
  }

  return false;
}

/**
 * Generate memory from conversation messages
 */
export async function generateMemory(
  leadId: string,
  messages: Message[]
): Promise<void> {
  if (messages.length < 3) {
    return; // Not enough context to generate useful memory
  }

  try {
    // Get existing memory for context
    const existingMemory = await getLeadMemory(leadId);

    // Build conversation text
    const conversationText = messages
      .map(m => `${m.role === 'user' ? 'Cliente' : 'Vendedor'}: ${m.content}`)
      .join('\n');

    const systemPrompt = `Eres un asistente que resume conversaciones de ventas.

${existingMemory ? `MEMORIA PREVIA:\n${existingMemory}\n\n` : ''}NUEVA CONVERSACIÓN:
${conversationText}

Genera un resumen BREVE (máximo 100 palabras) que capture:
1. Tipo de negocio del cliente (si se menciona)
2. Necesidades o dolores expresados
3. Nivel de interés en el producto
4. Objeciones mencionadas
5. Estado actual (interesado, escéptico, listo para demo, etc.)

Formato: Texto corrido, sin bullets. Incluye solo información confirmada.
Si hay memoria previa, actualízala con la nueva información.`;

    const result = await generateText({
      model: openai('gpt-5.2-instant'),
      system: systemPrompt,
      prompt: 'Resume la conversación.'
    });

    const newMemory = result.text.trim();

    if (newMemory && newMemory.length > 10) {
      await saveLeadMemory(leadId, newMemory);
      console.log(`[Memory] Updated for lead ${leadId}: ${newMemory.substring(0, 50)}...`);
    }

  } catch (error) {
    console.error('[Memory] Generation error:', error);
    // Non-fatal, don't throw
  }
}
