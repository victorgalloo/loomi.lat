/**
 * Demo Agent - Lightweight agent for landing page demos
 *
 * Fast, single API call, no multi-agent analysis
 * Uses Claude Haiku for speed
 */

import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { extractTextContent } from '@/lib/langchain/utils';

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
    const model = new ChatAnthropic({
      model: 'claude-haiku-4-5-20251001',
      maxTokens: 150,
    });

    const messages = [
      new SystemMessage(DEMO_PROMPT),
      ...history.slice(-10).map(m =>
        m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
      ),
      new HumanMessage(message),
    ];

    const result = await model.invoke(messages);

    return {
      response: extractTextContent(result.content).trim(),
      tokensUsed: result.usage_metadata?.total_tokens,
    };
  } catch (error) {
    console.error('[DemoAgent] Error:', error);
    return {
      response: '¿Te interesa ver cómo funciona en tu negocio? Agenda una demo.'
    };
  }
}
