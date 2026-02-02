/**
 * Demo Agent - Lightweight agent for landing page demos
 *
 * Fast, single API call, no multi-agent analysis
 * Uses gpt-4o-mini for speed
 */

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const DEMO_PROMPT = `Eres Loomi, un agente de ventas por WhatsApp. Eres rápido, amigable y directo.

TU OBJETIVO: Mostrar cómo funciona un agente de IA para ventas. Responde de forma natural y breve.

SOBRE LOOMI:
- Automatiza ventas por WhatsApp 24/7
- Califica leads automáticamente
- Agenda demos sin intervención humana
- Respuesta en <1 segundo
- Planes desde $199/mes

REGLAS:
- Respuestas CORTAS (1-2 oraciones máximo)
- Sé amigable pero profesional
- Si preguntan precios: Starter $199, Growth $349, Business $599
- Si quieren demo: Ofrece agendar para mañana
- NO uses emojis
- NO hagas preguntas largas

IMPORTANTE: Esto es una DEMO. Muestra lo que puede hacer un agente de IA.`;

export interface DemoAgentResult {
  response: string;
  tokensUsed?: number;
}

export async function demoAgent(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<DemoAgentResult> {
  try {
    const messages = [
      ...history.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user' as const, content: message }
    ];

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: DEMO_PROMPT,
      messages,
      maxOutputTokens: 150,
    });

    return {
      response: result.text.trim(),
      tokensUsed: result.usage?.totalTokens
    };
  } catch (error) {
    console.error('[DemoAgent] Error:', error);
    return {
      response: '¿Te interesa ver cómo funciona en tu negocio? Agenda una demo.'
    };
  }
}
