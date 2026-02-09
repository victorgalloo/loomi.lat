/**
 * Multi-Agent System - Configurable per Tenant
 *
 * Agente 1 (Análisis - claude-haiku): Analiza contexto completo, decide estrategia
 * Agente 2 (Chat - main model): Ejecuta la estrategia con la personalidad del agente
 *
 * Now parametrized with TenantAnalysisContext instead of hardcoded Loomi content.
 */

import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import {
  DEFAULT_PRODUCT_CONTEXT,
  DEFAULT_PRICING_CONTEXT,
  DEFAULT_SALES_PROCESS,
  DEFAULT_QUALIFICATION_CRITERIA,
  DEFAULT_COMPETITOR_CONTEXT,
  DEFAULT_OBJECTION_HANDLERS,
  DEFAULT_AGENT_NAME,
  DEFAULT_AGENT_ROLE,
} from './defaults';

export interface TenantAnalysisContext {
  productContext: string;
  pricingContext: string;
  salesProcessContext: string;
  qualificationContext: string;
  competitorContext: string;
  objectionHandlers: Record<string, string>;
  agentName: string;
  agentRole: string;
}

const AnalysisSchema = z.object({
  // Análisis de la conversación
  fase_actual: z.enum([
    'primer_contacto',      // Acaba de escribir, necesita saludo
    'descubriendo_dolor',   // Entendiendo su problema
    'calificando',          // Verificando si es buen fit
    'presentando_valor',    // Mostrando cómo el producto resuelve su problema
    'manejando_objecion',   // Resolviendo dudas/objeciones
    'cerrando_demo',        // Invitando a agendar demo/reunión
    'cerrando_venta',       // Listo para comprar
    'seguimiento'           // Ya habíamos hablado antes
  ]).describe('Fase actual de la conversación'),

  // Lo que ya sabemos (para no repetir preguntas)
  ya_preguntamos: z.array(z.string()).describe('Lista de cosas que YA preguntamos'),

  ya_sabemos: z.object({
    nombre: z.string().describe('Nombre del cliente o "desconocido"'),
    negocio: z.string().describe('Tipo de negocio o "desconocido"'),
    volumen_mensajes: z.string().describe('Cantidad de mensajes/día o "desconocido"'),
    solucion_actual: z.string().describe('Cómo atienden hoy o "desconocido"'),
    dolor_principal: z.string().describe('Su mayor frustración o "desconocido"'),
    usa_competencia: z.string().describe('Si usa alguna alternativa o "desconocido"'),
  }).describe('Información que ya tenemos del cliente'),

  // Detección de objeciones
  hay_objecion: z.boolean().describe('¿El cliente expresó una objeción o duda?'),
  tipo_objecion: z.enum([
    'precio',           // "Es caro", "No tengo presupuesto"
    'no_confio_ia',     // "Los bots no sirven", "No confío en IA"
    'ya_tengo',         // "Ya uso otra solución"
    'timing',           // "Ahorita no", "Después"
    'no_necesito',      // "No recibo tantos mensajes"
    'ninguna'
  ]).describe('Tipo de objeción detectada'),

  // Señales de interés
  nivel_interes: z.enum(['bajo', 'medio', 'alto']).describe('Qué tan interesado parece'),
  listo_para_demo: z.boolean().describe('¿Está listo para agendar demo/reunión?'),
  listo_para_comprar: z.boolean().describe('¿Quiere comprar directamente?'),

  // Decisión estratégica
  siguiente_paso: z.string().describe('Qué debe hacer el agente ahora (ser específico)'),
  pregunta_a_hacer: z.string().describe('La pregunta exacta a hacer, o "ninguna"'),

  // Instrucción para el modelo de chat
  instruccion_para_lu: z.string().describe('Instrucción detallada de cómo responder'),
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
  },
  tenantContext?: TenantAnalysisContext
): Promise<ConversationAnalysis> {
  const ctx = tenantContext || {
    productContext: DEFAULT_PRODUCT_CONTEXT,
    pricingContext: DEFAULT_PRICING_CONTEXT,
    salesProcessContext: DEFAULT_SALES_PROCESS,
    qualificationContext: DEFAULT_QUALIFICATION_CRITERIA,
    competitorContext: DEFAULT_COMPETITOR_CONTEXT,
    objectionHandlers: DEFAULT_OBJECTION_HANDLERS,
    agentName: DEFAULT_AGENT_NAME,
    agentRole: DEFAULT_AGENT_ROLE,
  };

  const historyText = history
    .map((m, i) => `[${i + 1}] ${m.role === 'user' ? 'CLIENTE' : ctx.agentName.toUpperCase()}: ${m.content}`)
    .join('\n');

  const messageCount = history.filter(m => m.role === 'user').length;
  const clientName = leadContext?.name || 'desconocido';
  const clientCompany = leadContext?.company || 'desconocido';

  const result = await generateObject({
    model: anthropic('claude-haiku-4-5-20251001'),
    schema: AnalysisSchema,
    prompt: `Eres un analista experto en ventas B2B. Analiza esta conversación y da instrucciones PRECISAS a ${ctx.agentName} (${ctx.agentRole}).

# SOBRE EL PRODUCTO/SERVICIO
${ctx.productContext}

# PRECIOS
${ctx.pricingContext}

# PROCESO DE VENTA
${ctx.salesProcessContext}

# CALIFICACIÓN
${ctx.qualificationContext}

# COMPETENCIA
${ctx.competitorContext}

# REGLAS CRÍTICAS
1. **NUNCA REPETIR PREGUNTAS** - Si ya preguntamos algo, no volver a preguntar
2. **UNA PREGUNTA A LA VEZ** - No bombardear
3. **MENSAJES CORTOS** - 2-3 líneas máximo
4. **SER HONESTO** - Si no es buen fit, decirlo

# INFORMACIÓN DEL CLIENTE
- Nombre: ${clientName}
- Negocio: ${clientCompany}
- Mensajes en conversación: ${messageCount}

# CONVERSACIÓN COMPLETA
${historyText || '(Sin historial - primer mensaje)'}

# MENSAJE ACTUAL
"${message}"

# TU TAREA
Analiza TODO y determina:
1. ¿Qué ya preguntamos? (para no repetir)
2. ¿Qué ya sabemos del cliente?
3. ¿En qué fase estamos?
4. ¿Hay alguna objeción que manejar?
5. ¿Cuál es el siguiente paso lógico?

Sé MUY específico en la instrucción. Ejemplo:
- MAL: "Pregunta sobre su negocio"
- BIEN: "Ya sabemos que tiene una tienda online. Pregunta: '¿Cuántos mensajes reciben al día más o menos?'"`,
    temperature: 0.3,
  });

  console.log('[Análisis] Fase:', result.object.fase_actual);
  console.log('[Análisis] Ya sabemos:', JSON.stringify(result.object.ya_sabemos));
  console.log('[Análisis] Siguiente paso:', result.object.siguiente_paso);

  return result.object;
}

export function generateSellerInstructions(
  analysis: ConversationAnalysis,
  tenantContext?: TenantAnalysisContext
): string {
  const ctx = tenantContext || {
    productContext: DEFAULT_PRODUCT_CONTEXT,
    pricingContext: DEFAULT_PRICING_CONTEXT,
    salesProcessContext: DEFAULT_SALES_PROCESS,
    qualificationContext: DEFAULT_QUALIFICATION_CRITERIA,
    competitorContext: DEFAULT_COMPETITOR_CONTEXT,
    objectionHandlers: DEFAULT_OBJECTION_HANDLERS,
    agentName: DEFAULT_AGENT_NAME,
    agentRole: DEFAULT_AGENT_ROLE,
  };

  let instructions = `
# ANÁLISIS DE LA CONVERSACIÓN

## Fase actual: ${analysis.fase_actual.toUpperCase()}

## Lo que YA preguntamos (NO REPETIR):
${analysis.ya_preguntamos.length > 0 ? analysis.ya_preguntamos.map(p => `- ${p}`).join('\n') : '- (Nada aún)'}

## Lo que YA sabemos del cliente:
- Nombre: ${analysis.ya_sabemos.nombre}
- Negocio: ${analysis.ya_sabemos.negocio}
- Volumen mensajes: ${analysis.ya_sabemos.volumen_mensajes}
- Solución actual: ${analysis.ya_sabemos.solucion_actual}
- Dolor principal: ${analysis.ya_sabemos.dolor_principal}
- Usa competencia: ${analysis.ya_sabemos.usa_competencia}

## Nivel de interés: ${analysis.nivel_interes.toUpperCase()}
${analysis.listo_para_demo ? '## LISTO PARA DEMO - Usa schedule_demo' : ''}
${analysis.listo_para_comprar ? '## LISTO PARA COMPRAR - Pide email y usa send_payment_link' : ''}

${analysis.hay_objecion ? `## OBJECIÓN DETECTADA: ${analysis.tipo_objecion}` : ''}

## SIGUIENTE PASO:
${analysis.siguiente_paso}

${analysis.pregunta_a_hacer !== 'ninguna' ? `## PREGUNTA A HACER:\n"${analysis.pregunta_a_hacer}"` : ''}

## INSTRUCCIÓN ESPECÍFICA:
${analysis.instruccion_para_lu}

# REGLAS:
1. NO repitas preguntas de la lista "YA preguntamos"
2. Usa la info de "YA sabemos" para personalizar
3. SOLO UNA pregunta por mensaje
4. Mensajes cortos (2-3 líneas)
5. Tono directo pero amigable
`;

  // Agregar manejo de objeciones from tenant context
  if (analysis.hay_objecion && analysis.tipo_objecion !== 'ninguna') {
    const handler = ctx.objectionHandlers[analysis.tipo_objecion];
    if (handler) {
      instructions += `\n# MANEJO DE OBJECIÓN - ${analysis.tipo_objecion.toUpperCase()}:\n${handler}`;
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
  },
  tenantContext?: TenantAnalysisContext
): Promise<{
  analysis: ConversationAnalysis;
  instructions: string;
}> {
  const analysis = await analyzeMessage(message, history, leadContext, tenantContext);
  const instructions = generateSellerInstructions(analysis, tenantContext);

  return { analysis, instructions };
}
