/**
 * Multi-Agent System - Venta de Seguros
 *
 * Agente 1 (Razonamiento - o3-mini): Analiza contexto completo, decide estrategia
 * Agente 2 (Chat - gpt-5.2): Ejecuta la estrategia con personalidad de Sofi
 */

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const AnalysisSchema = z.object({
  // Análisis de la conversación
  fase_actual: z.enum([
    'primer_contacto',      // Acaba de escribir, necesita saludo cálido
    'conociendo_motivacion', // Descubriendo qué le llamó la atención
    'entendiendo_situacion', // Entendiendo su vida (familia, hijos, trabajo)
    'calificando',          // Obteniendo datos (edad, fuma, dependientes)
    'educando',             // Explicando cómo funciona el seguro
    'presentando_precio',   // Dando cotización
    'cerrando',             // Pidiendo datos para contratar
    'manejando_objecion',   // Resolviendo una duda/objeción
    'seguimiento'           // Ya habíamos hablado antes
  ]).describe('Fase actual de la conversación'),

  // Lo que ya sabemos (para no repetir)
  ya_preguntamos: z.array(z.string()).describe('Lista de cosas que YA preguntamos (ej: "qué le llamó la atención", "si tiene hijos")'),

  ya_sabemos: z.object({
    nombre: z.string().describe('Nombre del cliente o "desconocido"'),
    motivacion: z.string().describe('Qué le llamó la atención o "desconocido"'),
    tiene_hijos: z.string().describe('"si", "no", o "desconocido"'),
    num_hijos: z.string().describe('Número de hijos o "desconocido"'),
    edad: z.string().describe('Edad del cliente o "desconocido"'),
    fuma: z.string().describe('"si", "no", o "desconocido"'),
    situacion_familiar: z.string().describe('Resumen de su situación o "desconocido"'),
  }).describe('Información que ya tenemos del cliente'),

  // Detección de objeciones
  hay_objecion: z.boolean().describe('¿El cliente expresó una objeción o duda?'),
  tipo_objecion: z.string().describe('Tipo de objeción: "precio", "desconfianza", "timing", "no_necesita", "joven", o "ninguna"'),

  // Decisión estratégica
  siguiente_paso: z.string().describe('Qué debe hacer Sofi ahora (ser específico)'),
  pregunta_a_hacer: z.string().describe('La pregunta exacta que debe hacer, o "ninguna" si no aplica'),

  // Instrucción para el modelo de chat
  instruccion_para_sofi: z.string().describe('Instrucción detallada de cómo debe responder Sofi, qué decir y qué NO decir'),
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
  // Formatear historial completo para análisis
  const historyText = history
    .map((m, i) => `[${i + 1}] ${m.role === 'user' ? 'CLIENTE' : 'SOFI'}: ${m.content}`)
    .join('\n');

  const messageCount = history.filter(m => m.role === 'user').length;
  const clientName = leadContext?.name || 'desconocido';

  const result = await generateObject({
    model: openai('o3-mini'),  // Modelo avanzado de razonamiento
    schema: AnalysisSchema,
    prompt: `Eres un analista experto en ventas de seguros. Tu trabajo es analizar la conversación y dar instrucciones PRECISAS a Sofi (la vendedora) sobre qué hacer.

# CONTEXTO DEL NEGOCIO
- Somos NetBrokrs, la primera Red Internacional de Distribución de Seguros (Insurtech)
- Presencia en México, Colombia, Perú, Chile, España, USA
- +5,000 corredores afiliados
- Vendemos seguros de vida ACCESIBLES desde $400 MXN/mes (~$20-25 USD)
- Los leads llegan de anuncios de Meta (Facebook/Instagram)
- No están comprometidos - solo tienen curiosidad por el anuncio

# PRODUCTO - SEGURO DE VIDA DE BAJO COSTO
Este es el producto estrella, probado en México, Colombia y Uruguay.

| Edad | Precio/mes | Suma asegurada |
|------|------------|----------------|
| 25-30 | $350-420 | $500,000-1,000,000 |
| 31-35 | $420-480 | $500,000-1,000,000 |
| 36-40 | $480-550 | $500,000-1,000,000 |
| 41-45 | $550-650 | $500,000-1,000,000 |
| 46-50 | $650-800 | $500,000-1,000,000 |
Fumadores: +40%

Punto de venta: "Son como $15 pesos al día - menos que un café"

# PROCESO DE VENTA (en orden estricto)
1. **PRIMER CONTACTO**: Saludar cálido + preguntar qué le llamó la atención
2. **CONOCER MOTIVACIÓN**: Escuchar por qué le interesó
3. **ENTENDER SITUACIÓN**: ¿Tiene familia? ¿Hijos? ¿Primera vez que piensa en seguro?
4. **CALIFICAR**: Edad, si fuma, cuántos dependientes
5. **EDUCAR**: Explicar cómo funciona el seguro de forma simple
6. **PRESENTAR PRECIO**: Dar cotización basada en su edad
7. **CERRAR**: Pedir datos (nombre completo, fecha nacimiento, beneficiario)

# REGLAS CRÍTICAS
1. **NUNCA REPETIR PREGUNTAS** - Si ya preguntamos algo, no volver a preguntar
2. **UNA PREGUNTA A LA VEZ** - No bombardear con múltiples preguntas
3. **PROGRESAR** - Cada mensaje debe avanzar la conversación
4. **ESCUCHAR** - Comentar sobre lo que dice el cliente antes de preguntar otra cosa

# INFORMACIÓN DEL CLIENTE
- Nombre: ${clientName}
- Mensajes previos: ${messageCount}

# CONVERSACIÓN COMPLETA
${historyText || '(Sin historial - este es el primer mensaje)'}

# MENSAJE ACTUAL DEL CLIENTE
"${message}"

# TU TAREA
Analiza TODO el historial y determina:
1. ¿Qué ya preguntamos? (para no repetir)
2. ¿Qué ya sabemos del cliente?
3. ¿En qué fase estamos?
4. ¿Cuál es el siguiente paso lógico?
5. ¿Qué instrucción específica darle a Sofi?

Sé MUY específico en la instrucción. Ejemplo:
- MAL: "Pregunta sobre su situación"
- BIEN: "Ya sabemos que le interesó el precio. Ahora pregunta: '¿Tienes hijos o alguien que dependa de ti económicamente?'"`,
    // temperature not supported for o3-mini reasoning model
  });

  console.log('[Razonamiento] Fase:', result.object.fase_actual);
  console.log('[Razonamiento] Ya sabemos:', JSON.stringify(result.object.ya_sabemos));
  console.log('[Razonamiento] Siguiente paso:', result.object.siguiente_paso);

  return result.object;
}

export function generateSellerInstructions(analysis: ConversationAnalysis): string {
  // Construir instrucciones claras basadas en el análisis de o3-mini
  let instructions = `
# ANÁLISIS DE LA CONVERSACIÓN (por o3-mini)

## Fase actual: ${analysis.fase_actual.toUpperCase()}

## Lo que YA preguntamos (NO REPETIR):
${analysis.ya_preguntamos.length > 0 ? analysis.ya_preguntamos.map(p => `- ${p}`).join('\n') : '- (Nada aún)'}

## Lo que YA sabemos del cliente:
- Nombre: ${analysis.ya_sabemos.nombre}
- Motivación: ${analysis.ya_sabemos.motivacion}
- Tiene hijos: ${analysis.ya_sabemos.tiene_hijos}
- Edad: ${analysis.ya_sabemos.edad}
- Fuma: ${analysis.ya_sabemos.fuma}
- Situación: ${analysis.ya_sabemos.situacion_familiar}

${analysis.hay_objecion ? `## ⚠️ OBJECIÓN DETECTADA: ${analysis.tipo_objecion}` : ''}

## SIGUIENTE PASO:
${analysis.siguiente_paso}

${analysis.pregunta_a_hacer !== 'ninguna' ? `## PREGUNTA A HACER:\n"${analysis.pregunta_a_hacer}"` : ''}

## INSTRUCCIÓN ESPECÍFICA PARA TI:
${analysis.instruccion_para_sofi}

# REGLAS IMPORTANTES:
1. NO repitas ninguna pregunta de la lista "YA preguntamos"
2. Usa la información de "YA sabemos" para personalizar
3. Haz SOLO UNA pregunta por mensaje
4. Mensajes cortos (2-3 líneas máximo)
5. Sé cálida y conversacional
`;

  // Agregar manejo de objeciones si aplica
  if (analysis.hay_objecion && analysis.tipo_objecion !== 'ninguna') {
    const handlers: Record<string, string> = {
      'precio': `
# MANEJO DE OBJECIÓN - PRECIO:
- "¿Cuánto es lo máximo que podrías pagar al mes sin que te duela?"
- Ofrece ajustar cobertura: $300/mes = $500,000
- "Son como $15 al día, menos que un café"`,

      'desconfianza': `
# MANEJO DE OBJECIÓN - DESCONFIANZA:
- Valida: "Entiendo, hay muchas historias así"
- "En vida es simple: si falleces, pagan. Punto."
- Solo 2 exclusiones: suicidio año 1, mentir en cuestionario`,

      'timing': `
# MANEJO DE OBJECIÓN - TIMING:
- "¿Qué te hace dudar?"
- Sin presión: "Si quieres lo dejamos y me escribes cuando estés listo"`,

      'no_necesita': `
# MANEJO DE OBJECIÓN - YA TIENE:
- "¿Sabes de cuánto es el que tienes?"
- "¿Y qué pasa si cambias de trabajo?"`,

      'joven': `
# MANEJO DE OBJECIÓN - JOVEN/SIN HIJOS:
- "Honestamente a tu edad no es urgente"
- "¿Ayudas a tus papás económicamente?"
- Si no hay dependientes, puede no ser buen fit`,
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
