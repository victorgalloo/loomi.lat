import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { Scenario } from './scenarios';

const evaluationSchema = z.object({
  score: z.number().describe('Score from 0 to 100'),
  passed: z.boolean(),
  issues: z.array(z.string()),
  suggestions: z.array(z.string()),
  reasoning: z.string(),
});

export type EvaluationResult = z.infer<typeof evaluationSchema>;

export async function evaluateResponse(
  scenario: Scenario,
  agentResponse: string
): Promise<EvaluationResult> {
  const conversationContext = scenario.conversation
    .map(m => `${m.role === 'user' ? 'Usuario' : 'Agente'}: ${m.content}`)
    .join('\n');

  const prompt = `Evalúa la respuesta de un agente de ventas de WhatsApp.

CONTEXTO DE LA CONVERSACIÓN:
${conversationContext || '(Conversación nueva)'}

MENSAJE DEL USUARIO:
${scenario.nextUserMessage}

RESPUESTA DEL AGENTE:
${agentResponse}

CRITERIOS A EVALUAR:
1. No repetir preguntas ya hechas: ${scenario.criteria.shouldNotRepeatQuestions ? 'SÍ verificar' : 'No aplica'}
2. Debe avanzar a propuesta/demo: ${scenario.criteria.shouldProgressToProposal ? 'SÍ debe hacerlo' : 'No aplica aún'}
3. Debe mencionar el producto: ${scenario.criteria.shouldMentionProduct ? 'SÍ debe hacerlo' : 'No aplica aún'}
4. Debe proponer demo: ${scenario.criteria.shouldAskForDemo ? 'SÍ debe hacerlo' : 'No aplica aún'}
5. Respuesta corta (máx 3 oraciones): ${scenario.criteria.shouldBeShort ? 'SÍ verificar' : 'No aplica'}
${scenario.criteria.customCheck ? `6. IMPORTANTE: ${scenario.criteria.customCheck}` : ''}
7. No repetir preguntas ya hechas en la conversación: SÍ verificar (revisar historial completo)
8. Avanzar la conversación (no quedarse en el mismo tema): ${conversationContext.split('\n').length >= 8 ? 'SÍ verificar si hay 4+ turnos previos' : 'No aplica aún'}

INSTRUCCIONES:
- Score de 0-100 basado en qué tan bien cumple los criterios
- passed = true si score >= 70
- issues = lista de problemas encontrados
- suggestions = cómo mejorar la respuesta
- reasoning = explicación breve de la evaluación

Sé estricto. Si no cumple un criterio marcado como "SÍ", baja el score significativamente.`;

  try {
    const { object } = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: evaluationSchema,
      prompt,
    });

    return object;
  } catch (error) {
    console.error('Evaluation error:', error);
    return {
      score: 0,
      passed: false,
      issues: ['Error en evaluación'],
      suggestions: [],
      reasoning: 'Error al evaluar',
    };
  }
}
