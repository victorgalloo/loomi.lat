/**
 * Multi-Agent System - Venta de Seguros
 *
 * Agente 1 (Analista): Analiza el mensaje, detecta objeciones, define estrategia
 * Agente 2 (Vendedor): Ejecuta la estrategia con el tono de Sofi
 */

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const AnalysisSchema = z.object({
  literalMessage: z.string().describe('¿Qué dijo el cliente literalmente?'),
  realIntent: z.string().describe('¿Qué quiere decir realmente? La intención detrás'),

  stage: z.enum([
    'curiosidad',      // Solo preguntando, no comprometido
    'interes',         // Muestra interés real en proteger a su familia
    'evaluacion',      // Evaluando si le conviene
    'decision',        // Listo para comprar
    'objecion',        // Tiene una objeción que resolver
    'rechazo'          // No interesado
  ]).describe('Etapa del prospecto'),

  hasObjection: z.boolean().describe('¿Hay una objeción?'),
  objectionType: z.enum([
    'none',
    'price',           // Muy caro, no tengo presupuesto
    'trust',           // No confío en seguros, no pagan
    'need',            // No lo necesito, ya tengo del trabajo
    'timing',          // No es el momento, lo pienso
    'young',           // Soy joven, no tengo hijos
    'fear'             // Miedo a hablar de muerte
  ]).describe('Tipo de objeción'),

  signals: z.object({
    hasKids: z.boolean().describe('¿Mencionó que tiene hijos?'),
    mentionedAge: z.boolean().describe('¿Mencionó su edad?'),
    isSmoker: z.boolean().describe('¿Mencionó si fuma?'),
    hasDebt: z.boolean().describe('¿Mencionó deudas (hipoteca, carro)?'),
    isMainProvider: z.boolean().describe('¿Es el sostén principal de la familia?'),
    readyToBuy: z.boolean().describe('¿Está listo para comprar?'),
    askedPrice: z.boolean().describe('¿Preguntó por precio?'),
  }),

  qualificationStatus: z.enum([
    'not_qualified',   // Falta info básica (edad, fuma, hijos)
    'partially',       // Tiene algo pero falta
    'qualified'        // Tenemos edad, fuma, dependientes
  ]).describe('Estado de calificación'),

  recommendedStrategy: z.enum([
    'qualify_age',        // Preguntar edad
    'qualify_smoker',     // Preguntar si fuma
    'qualify_dependents', // Preguntar por hijos/dependientes
    'calculate_sum',      // Calcular suma asegurada
    'handle_objection',   // Manejar objeción
    'present_price',      // Presentar precio
    'close',              // Cerrar la venta
    'let_go'              // No es buen fit, soltar
  ]).describe('Siguiente paso'),

  instruction: z.string().describe('Instrucción específica de qué hacer'),
  keyQuestion: z.string().describe('Pregunta clave a hacer. "none" si no aplica'),
});

export type ConversationAnalysis = z.infer<typeof AnalysisSchema>;

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

  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: AnalysisSchema,
    prompt: `Eres un analista de ventas de seguros. Analiza esta conversación para ayudar a Sofi a vender un seguro de vida.

PRODUCTO: Seguro de vida desde $500 MXN/mes ($25-30 USD)
- Suma asegurada: $500,000 a $1,500,000 MXN
- Precio depende de: edad y si fuma
- Sin examen médico hasta $1.5M

PROCESO DE CALIFICACIÓN:
1. Edad (determina precio)
2. ¿Fuma? (+40-50% si fuma)
3. ¿Tiene dependientes? (hijos, esposa, padres)

PARA CERRAR necesitamos:
- Nombre completo
- Fecha de nacimiento
- Beneficiario
- Cuestionario de salud básico

HISTORIAL:
${historyText}

MENSAJE ACTUAL:
"${message}"

Analiza y define la mejor estrategia.`,
    temperature: 0.3,
  });

  console.log('[Analyst] Stage:', result.object.stage, 'Strategy:', result.object.recommendedStrategy);

  return result.object;
}

export function generateSellerInstructions(analysis: ConversationAnalysis): string {
  let instructions = `
# ANÁLISIS
- Cliente dijo: "${analysis.literalMessage}"
- Intención real: ${analysis.realIntent}
- Etapa: ${analysis.stage.toUpperCase()}
- Calificación: ${analysis.qualificationStatus}
${analysis.hasObjection ? `- OBJECIÓN: ${analysis.objectionType}` : ''}

# ESTRATEGIA: ${analysis.recommendedStrategy.toUpperCase()}
${analysis.instruction}

${analysis.keyQuestion && analysis.keyQuestion !== 'none' ? `# PREGUNTA A HACER:\n"${analysis.keyQuestion}"` : ''}

# INFO DEL CLIENTE:
${analysis.signals.hasKids ? '✓ Tiene hijos - USAR ESTO' : '? No sabemos si tiene hijos'}
${analysis.signals.mentionedAge ? '✓ Ya dio edad' : '? Falta preguntar edad'}
${analysis.signals.isSmoker ? '✓ Ya sabemos si fuma' : '? Falta preguntar si fuma'}
${analysis.signals.hasDebt ? '✓ Tiene deudas - INCLUIR EN SUMA' : ''}
${analysis.signals.isMainProvider ? '✓ Es sostén de familia - URGENCIA' : ''}
${analysis.signals.readyToBuy ? '✓ LISTO PARA CERRAR' : ''}
`;

  if (analysis.hasObjection) {
    const handlers: Record<string, string> = {
      price: `
# OBJECIÓN DE PRECIO:
- Pregunta: "¿Cuánto es lo máximo que podrías pagar sin que te duela?"
- Ofrece suma menor: $300/mes = $500,000 de cobertura
- Haz la cuenta: "Son $20/día, menos que un Uber"
- NO bajes precio, ajusta cobertura`,

      trust: `
# OBJECIÓN DE CONFIANZA ("no pagan"):
- Valida: "Entiendo, hay muchas historias así"
- Diferencia: "En vida es simple: si te mueres, pagan. Punto."
- Explica las ÚNICAS 2 exclusiones: suicidio año 1, mentir en cuestionario
- Pregunta: "¿Tienes alguna enfermedad que no me hayas dicho?"`,

      need: `
# OBJECIÓN "YA TENGO DEL TRABAJO":
- Pregunta: "¿Sabes de cuánto es?"
- Haz ver el riesgo: "¿Y si cambias de trabajo o te corren?"
- Posiciona como complemento, no reemplazo
- "El del trabajo es temporal, este es tuyo para siempre"`,

      timing: `
# OBJECIÓN "LO PIENSO":
- Pregunta: "¿Qué te hace dudar?"
- Si tiene hijos, pregunta directo: "¿Qué pasa con ellos si mañana no llegas?"
- No presiones pero planta la semilla
- Ofrece: "Si quieres lo dejamos y me escribes cuando estés listo"`,

      young: `
# OBJECIÓN "SOY JOVEN / SIN HIJOS":
- Valida: "Honestamente a tu edad no es urgente"
- Busca otra razón: "¿Ayudas a tus papás económicamente?"
- Si no hay dependientes, puede no ser buen fit - suéltalo`,

      fear: `
# OBJECIÓN DE MIEDO A HABLAR DE MUERTE:
- Normaliza: "Nadie quiere pensar en esto, pero es importante"
- Enfoca en los que quedan: "No es para ti, es para los que amas"
- No uses lenguaje morboso`,
    };

    if (analysis.objectionType !== 'none') {
      instructions += handlers[analysis.objectionType] || '';
    }
  }

  return instructions;
}

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
