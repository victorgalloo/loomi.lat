/**
 * Multi-Agent System - Venta de Loomi
 *
 * Agente 1 (Análisis - gpt-5-mini): Analiza contexto completo, decide estrategia
 * Agente 2 (Chat - gpt-5-mini): Ejecuta la estrategia con personalidad de Lu
 *
 * Optimizado para velocidad: ~2-4s total vs ~15-25s con modelos reasoning
 */

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const AnalysisSchema = z.object({
  // Análisis de la conversación
  fase_actual: z.enum([
    'primer_contacto',      // Acaba de escribir, necesita saludo
    'descubriendo_dolor',   // Entendiendo su problema con WhatsApp
    'calificando',          // Verificando si es buen fit (volumen, tipo de negocio)
    'presentando_valor',    // Mostrando cómo Loomi resuelve su problema
    'manejando_objecion',   // Resolviendo dudas/objeciones
    'cerrando_demo',        // Invitando a agendar demo
    'cerrando_venta',       // Listo para comprar
    'seguimiento'           // Ya habíamos hablado antes
  ]).describe('Fase actual de la conversación'),

  // Lo que ya sabemos (para no repetir preguntas)
  ya_preguntamos: z.array(z.string()).describe('Lista de cosas que YA preguntamos'),

  ya_sabemos: z.object({
    nombre: z.string().describe('Nombre del cliente o "desconocido"'),
    negocio: z.string().describe('Tipo de negocio o "desconocido"'),
    volumen_mensajes: z.string().describe('Cantidad de mensajes/día o "desconocido"'),
    solucion_actual: z.string().describe('Cómo atienden WhatsApp hoy o "desconocido"'),
    dolor_principal: z.string().describe('Su mayor frustración o "desconocido"'),
    usa_competencia: z.string().describe('Si usa Wati/ManyChat/otro o "desconocido"'),
  }).describe('Información que ya tenemos del cliente'),

  // Detección de objeciones
  hay_objecion: z.boolean().describe('¿El cliente expresó una objeción o duda?'),
  tipo_objecion: z.enum([
    'precio',           // "Es caro", "No tengo presupuesto"
    'no_confio_ia',     // "Los bots no sirven", "No confío en IA"
    'ya_tengo',         // "Ya uso Wati/ManyChat"
    'timing',           // "Ahorita no", "Después"
    'no_necesito',      // "No recibo tantos mensajes"
    'ninguna'
  ]).describe('Tipo de objeción detectada'),

  // Señales de interés
  nivel_interes: z.enum(['bajo', 'medio', 'alto']).describe('Qué tan interesado parece'),
  listo_para_demo: z.boolean().describe('¿Está listo para agendar demo?'),
  listo_para_comprar: z.boolean().describe('¿Quiere comprar directamente?'),

  // Decisión estratégica
  siguiente_paso: z.string().describe('Qué debe hacer Lu ahora (ser específico)'),
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
  }
): Promise<ConversationAnalysis> {
  const historyText = history
    .map((m, i) => `[${i + 1}] ${m.role === 'user' ? 'CLIENTE' : 'LU'}: ${m.content}`)
    .join('\n');

  const messageCount = history.filter(m => m.role === 'user').length;
  const clientName = leadContext?.name || 'desconocido';
  const clientCompany = leadContext?.company || 'desconocido';

  const result = await generateObject({
    model: openai('gpt-5-mini'),
    schema: AnalysisSchema,
    prompt: `Eres un analista experto en ventas de SaaS B2B. Analiza esta conversación y da instrucciones PRECISAS a Lu (la vendedora de Loomi).

# SOBRE LOOMI
Loomi es un agente de IA para WhatsApp que vende 24/7. No es un chatbot de flujos - es IA real.

**Diferenciadores clave:**
- IA real (GPT-4o) que ENTIENDE, no flujos predefinidos
- Detecta emociones y adapta el tono
- Agenda demos automáticamente (Cal.com)
- CRM integrado con pipeline Kanban
- Meta CAPI para optimizar campañas

**Precios:**
- Starter: $199/mes (100 msg/día, 1 WhatsApp)
- Growth: $349/mes (300 msg/día, 3 WhatsApp, CRM, Meta CAPI)
- Business: $599/mes (1000 msg/día, 10 WhatsApp, API, SLA)
- 14 días gratis, sin tarjeta

**Buenos fits:**
- Reciben 50+ mensajes/día en WhatsApp
- Venden productos/servicios por WhatsApp
- Invierten en Meta Ads
- Tienen equipo de ventas saturado

**Malos fits:**
- Menos de 20 mensajes/día
- No usan WhatsApp para ventas

# PROCESO DE VENTA LOOMI

1. **PRIMER CONTACTO**: Saludo + preguntar qué le llamó la atención
2. **DESCUBRIR DOLOR**:
   - ¿Cuántos mensajes reciben al día?
   - ¿Quién los atiende? ¿Dan abasto?
   - ¿Qué pasa con mensajes fuera de horario?
3. **CALIFICAR**: Verificar volumen y tipo de negocio
4. **PRESENTAR VALOR**: Adaptar pitch según su dolor específico
5. **MANEJAR OBJECIONES**: Resolver dudas con honestidad
6. **CERRAR**: Demo o compra directa

# REGLAS CRÍTICAS
1. **NUNCA REPETIR PREGUNTAS** - Si ya preguntamos algo, no volver a preguntar
2. **UNA PREGUNTA A LA VEZ** - No bombardear
3. **MENSAJES CORTOS** - 2-3 líneas máximo
4. **SER HONESTA** - Si no es buen fit, decirlo

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
- BIEN: "Ya sabemos que tiene una tienda online. Pregunta: '¿Cuántos mensajes de WhatsApp reciben al día más o menos?'"`,
    temperature: 0.3,
  });

  console.log('[Análisis] Fase:', result.object.fase_actual);
  console.log('[Análisis] Ya sabemos:', JSON.stringify(result.object.ya_sabemos));
  console.log('[Análisis] Siguiente paso:', result.object.siguiente_paso);

  return result.object;
}

export function generateSellerInstructions(analysis: ConversationAnalysis): string {
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
${analysis.listo_para_demo ? '## ✅ LISTO PARA DEMO - Usa schedule_demo' : ''}
${analysis.listo_para_comprar ? '## ✅ LISTO PARA COMPRAR - Pide email y usa send_payment_link' : ''}

${analysis.hay_objecion ? `## ⚠️ OBJECIÓN DETECTADA: ${analysis.tipo_objecion}` : ''}

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

  // Agregar manejo de objeciones
  if (analysis.hay_objecion && analysis.tipo_objecion !== 'ninguna') {
    const handlers: Record<string, string> = {
      'precio': `
# MANEJO DE OBJECIÓN - PRECIO:
- "¿Cuánto pagas hoy por atender WhatsApp? ¿Tienes vendedor?"
- "Un vendedor cuesta $800-1,500/mes. Loomi desde $199, 24/7"
- "Si cierras 2-3 ventas extra al mes, ya se pagó solo"
- Ofrecer Starter ($199) como entrada`,

      'no_confio_ia': `
# MANEJO DE OBJECIÓN - NO CONFÍA EN IA:
- "Válido, la mayoría de bots son malos"
- "Loomi no es un bot de flujos - es IA real que ENTIENDE"
- "Detecta cuando alguien está frustrado y escala a humano"
- "¿Te muestro una demo? En 15 min ves la diferencia"`,

      'ya_tengo': `
# MANEJO DE OBJECIÓN - YA USA COMPETENCIA:
- "¿Y cómo te va? ¿El bot responde bien cuando preguntan algo fuera del menú?"
- "Wati/ManyChat son flujos - si el cliente sale del script, se rompe"
- "Loomi ENTIENDE contexto, no sigue árboles de decisión"
- "¿Cuántos leads pierdes porque el bot no supo qué responder?"`,

      'timing': `
# MANEJO DE OBJECIÓN - TIMING:
- "Va, sin presión. ¿Qué te hace dudar?"
- "¿Es el precio, la tecnología, o quieres ver más?"
- Si insiste: "Perfecto, si en algún momento WhatsApp se vuelve un dolor, aquí estamos"
- Ofrecer demo para ver el producto sin compromiso`,

      'no_necesito': `
# MANEJO DE OBJECIÓN - NO NECESITA:
- "Entiendo. ¿Cuántos mensajes reciben al día más o menos?"
- Si <20/día: "La neta, con ese volumen puede no valer la pena aún"
- Si >50/día: "¿Y quién los atiende? ¿Dan abasto?"
- Ser honesta si no es buen fit`,
    };

    instructions += handlers[analysis.tipo_objecion] || '';
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
