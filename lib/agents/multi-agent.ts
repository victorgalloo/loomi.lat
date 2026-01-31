/**
 * Multi-Agent System
 *
 * Agente 1 (Analista): Analiza el mensaje, detecta objeciones, define estrategia
 * Agente 2 (Vendedor): Ejecuta la estrategia con el tono de Sofi
 */

import { generateObject, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Schema para el análisis del Agente Analista
const AnalysisSchema = z.object({
  // Análisis del mensaje
  literalMessage: z.string().describe('¿Qué dijo el cliente literalmente?'),
  realIntent: z.string().describe('¿Qué quiere decir realmente? La intención detrás'),

  // Estado del prospecto
  stage: z.enum([
    'curiosidad',      // Solo preguntando, no comprometido
    'interes',         // Muestra interés real
    'evaluacion',      // Comparando opciones, evaluando
    'decision',        // Listo para decidir
    'objecion',        // Tiene una objeción que resolver
    'rechazo'          // No interesado
  ]).describe('Etapa del prospecto en el funnel'),

  // Detección de objeciones
  hasObjection: z.boolean().describe('¿Hay una objeción oculta o explícita?'),
  objectionType: z.enum([
    'none',
    'price',           // Muy caro, no tengo presupuesto
    'trust',           // No confío en bots/tecnología
    'need',            // No lo necesito, ya tengo algo
    'timing',          // No es el momento, lo pienso
    'authority',       // Tengo que consultarlo
    'competitor'       // Estoy viendo otras opciones
  ]).describe('Tipo de objeción si existe'),

  // Señales detectadas
  signals: z.object({
    expressedPain: z.boolean().describe('¿Expresó un dolor o problema?'),
    mentionedVolume: z.boolean().describe('¿Mencionó volumen de mensajes/clientes?'),
    mentionedProduct: z.string().describe('Producto de seguro mencionado (vida, gmm, pensiones, etc). Usar "none" si no mencionó ninguno'),
    isReferral: z.boolean().describe('¿Es un referido?'),
    readyToSchedule: z.boolean().describe('¿Está listo para agendar?'),
    askedPrice: z.boolean().describe('¿Preguntó por precio?'),
  }),

  // Estrategia recomendada
  recommendedStrategy: z.enum([
    'qualify',           // Hacer preguntas para calificar
    'empathize_pain',    // Mostrar empatía con su dolor
    'handle_objection',  // Manejar la objeción detectada
    'present_value',     // Presentar propuesta de valor
    'propose_demo',      // Proponer demo/llamada
    'close',             // Intentar cerrar
    'let_go',            // Soltar amablemente (no es buen fit)
    're_engage'          // Re-enganchar un prospecto frío
  ]).describe('Estrategia recomendada para este mensaje'),

  // Instrucción específica para el vendedor
  instruction: z.string().describe('Instrucción específica de qué hacer y qué NO hacer'),

  // Pregunta clave a hacer (si aplica)
  keyQuestion: z.string().describe('Pregunta clave que debería hacer el vendedor. Usar "none" si no aplica'),
});

export type ConversationAnalysis = z.infer<typeof AnalysisSchema>;

/**
 * Agente Analista: Analiza el mensaje y define estrategia
 */
export async function analyzeMessage(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  leadContext?: {
    name?: string;
    company?: string;
    industry?: string;
    previousInteractions?: number;
  }
): Promise<ConversationAnalysis> {
  const historyText = history
    .slice(-10)
    .map(m => `${m.role === 'user' ? 'Cliente' : 'Sofi'}: ${m.content}`)
    .join('\n');

  const contextText = leadContext
    ? `
Información del lead:
- Nombre: ${leadContext.name || 'Desconocido'}
- Empresa: ${leadContext.company || 'No especificada'}
- Industria: ${leadContext.industry || 'No detectada'}
- Interacciones previas: ${leadContext.previousInteractions || 0}
`
    : '';

  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: AnalysisSchema,
    prompt: `Eres un analista de ventas experto. Tu trabajo es analizar conversaciones de WhatsApp con agentes de seguros para definir la mejor estrategia de venta.

CONTEXTO DEL NEGOCIO:
- Vendemos Loomi: un bot de IA para WhatsApp especializado en seguros
- Precio: $199-599 USD/mes
- Clientes ideales: agentes de seguros, brokers, promotorías
- El bot califica prospectos, recopila datos para cotizaciones, agenda citas

${contextText}

HISTORIAL DE CONVERSACIÓN:
${historyText}

MENSAJE ACTUAL DEL CLIENTE:
"${message}"

Analiza este mensaje y define la mejor estrategia de respuesta. Sé específico en tu instrucción.`,
    temperature: 0.3,
  });

  console.log('[Analyst] Analysis:', JSON.stringify(result.object, null, 2));

  return result.object;
}

/**
 * Genera instrucciones para el vendedor basadas en el análisis
 */
export function generateSellerInstructions(analysis: ConversationAnalysis): string {
  let instructions = `
# ANÁLISIS DE LA SITUACIÓN
- El cliente dijo: "${analysis.literalMessage}"
- Lo que realmente quiere: ${analysis.realIntent}
- Etapa actual: ${analysis.stage.toUpperCase()}
${analysis.hasObjection ? `- OBJECIÓN DETECTADA: ${analysis.objectionType}` : ''}

# ESTRATEGIA: ${analysis.recommendedStrategy.toUpperCase()}
${analysis.instruction}

${analysis.keyQuestion && analysis.keyQuestion !== 'none' ? `# PREGUNTA CLAVE A HACER:\n"${analysis.keyQuestion}"` : ''}

# SEÑALES DETECTADAS:
${analysis.signals.expressedPain ? '✓ Expresó dolor/problema - APROVECHA ESTO' : ''}
${analysis.signals.mentionedVolume ? '✓ Mencionó volumen - CUANTIFICA EL IMPACTO' : ''}
${analysis.signals.mentionedProduct && analysis.signals.mentionedProduct !== 'none' ? `✓ Producto: ${analysis.signals.mentionedProduct} - USA EJEMPLOS ESPECÍFICOS` : ''}
${analysis.signals.isReferral ? '✓ Es referido - USA PRUEBA SOCIAL' : ''}
${analysis.signals.readyToSchedule ? '✓ Listo para agendar - CIERRA AHORA' : ''}
${analysis.signals.askedPrice ? '✓ Preguntó precio - CONECTA CON ROI' : ''}
`;

  // Instrucciones específicas por tipo de objeción
  if (analysis.hasObjection) {
    const objectionHandlers: Record<string, string> = {
      price: `
# MANEJO DE OBJECIÓN DE PRECIO:
- NO bajes el precio ni ofrezcas descuento
- Pregunta por su comisión promedio por póliza
- Haz el cálculo: "Si el bot te ayuda a cerrar 1 póliza extra..."
- Reencuadra como inversión, no gasto`,

      trust: `
# MANEJO DE OBJECIÓN DE CONFIANZA:
- Valida su experiencia negativa anterior
- Diferencia: "Este está entrenado específicamente para seguros"
- Ofrece demo corta para que vea la diferencia
- NO te pongas a la defensiva`,

      need: `
# MANEJO DE OBJECIÓN DE NECESIDAD:
- Pregunta qué usa actualmente y cómo le funciona
- Busca el hueco: "¿Y qué pasa cuando...?"
- Posiciona como complemento, no reemplazo
- Si realmente no lo necesita, suéltalo`,

      timing: `
# MANEJO DE OBJECIÓN DE TIMING:
- Pregunta qué le hace dudar específicamente
- Haz preguntas que revelen el costo de esperar
- "¿Cuántos prospectos se te fueron la semana pasada?"
- No presiones, pero planta la semilla`,

      authority: `
# MANEJO DE OBJECIÓN DE AUTORIDAD:
- Pregunta quién más decide
- Ofrece incluirlo en la demo
- "¿Quieres que les mande info antes para que lleguen con contexto?"`,

      competitor: `
# MANEJO DE OBJECIÓN DE COMPETIDOR:
- Pregunta qué están evaluando
- NO tires a la competencia
- Pregunta qué es lo más importante para ellos
- Diferencia con especialización en seguros`,
    };

    if (analysis.objectionType !== 'none') {
      instructions += objectionHandlers[analysis.objectionType] || '';
    }
  }

  return instructions;
}

/**
 * Sistema completo: Analiza → Genera instrucciones
 */
export async function getSellerStrategy(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  leadContext?: {
    name?: string;
    company?: string;
    industry?: string;
    previousInteractions?: number;
  }
): Promise<{
  analysis: ConversationAnalysis;
  instructions: string;
}> {
  const analysis = await analyzeMessage(message, history, leadContext);
  const instructions = generateSellerInstructions(analysis);

  return { analysis, instructions };
}
