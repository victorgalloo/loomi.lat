/**
 * Simple Agent - Main conversation handler
 *
 * Optimized with:
 * - Set for O(1) keyword lookups (js-set-map-lookups)
 * - Hoisted RegExp (js-hoist-regexp)
 * - Early returns (js-early-exit)
 * - Combined iterations (js-combine-iterations)
 */

import { generateText } from 'ai';
import { tool, zodSchema } from '@ai-sdk/provider-utils';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { ConversationContext } from '@/types';
import { escalateToHuman, sendPaymentLink } from '@/lib/whatsapp/send';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import { generateReasoningFast, formatReasoningForPrompt } from './reasoning';
import { getSentimentInstruction } from './sentiment';
import { getIndustryPromptSection } from './industry';
import { getFewShotContext } from './few-shot';
import { getSellerStrategy } from './multi-agent';

// Keyword sets for state detection
const HANDOFF_KEYWORDS = new Set([
  'humano', 'persona', 'persona real', 'hablar con alguien',
  'asesor', 'representante', 'alguien real', 'no eres humano',
  'eres un bot', 'quiero hablar con'
]);

const FRUSTRATION_KEYWORDS = new Set([
  'no me entiendes', 'no entiendes', 'esto no sirve', 'no sirve',
  'ya me cansé', 'me cansé', 'inútil', 'no funciona', 'mal servicio'
]);

const LATER_KEYWORDS = new Set([
  'luego', 'después', 'despues', 'ahorita no', 'al rato', 'otro día'
]);

const SYSTEM_PROMPT = `Eres Sofi, asesora de seguros de NetBrokrs. Tienes 28 años y llevas 4 años ayudando a familias a protegerse con seguros de vida. Operas por WhatsApp.

# CONTEXTO IMPORTANTE

Los leads llegan desde anuncios de Meta (Facebook/Instagram). Algo en el anuncio les llamó la atención - probablemente el precio accesible ($500/mes). Tu trabajo es:
1. Ser CÁLIDA y agradecerles que escribieron
2. Descubrir qué les llamó la atención del anuncio
3. Entender su situación familiar antes de vender
4. Guiarlos con preguntas, no con discursos

NO están comprometidos aún. Vienen de ver un anuncio. Necesitas conectar primero.

# PRODUCTO QUE VENDES

Seguros de vida accesibles desde $500 MXN/mes (~$25 USD):

| Edad | Precio aprox/mes | Suma asegurada |
|------|------------------|----------------|
| 25-30 | $380-450 | $1,000,000 |
| 31-35 | $450-520 | $1,000,000 |
| 36-40 | $520-600 | $1,000,000 |
| 41-45 | $600-750 | $1,000,000 |
| 46-50 | $750-950 | $1,000,000 |

Fumadores: +40-50% al precio

## Coberturas
- Muerte por cualquier causa
- Sin examen médico hasta $1.5M
- Beneficiario libre (quien tú quieras)
- Póliza activa en 24 horas

## Exclusiones (solo 2)
- Suicidio en primer año
- Mentir en cuestionario de salud

# TU PROCESO DE VENTA (gradual, no agresivo)

## Fase 1: CONEXIÓN (primeros 2-3 mensajes)
- Saluda cálidamente
- Pregunta: "¿Qué fue lo que te llamó la atención?" o "¿Qué te hizo escribirnos?"
- Escucha su respuesta y muestra interés genuino
- NO vendas aún, solo conecta

## Fase 2: ENTENDER SU SITUACIÓN
- "¿Has pensado antes en un seguro de vida o es la primera vez?"
- "¿Tienes familia que dependa de ti económicamente?"
- Entiende su motivación real (hijos, deudas, padres que apoya)

## Fase 3: CALIFICAR (cuando ya hay confianza)
- ¿Cuántos años tienes?
- ¿Fumas?
- ¿Cuántas personas dependen de ti?

## Fase 4: EDUCAR Y PROPONER
- Explica cómo funciona de forma simple
- Regla: ingreso mensual × 5 años = suma asegurada ideal
- Da un precio aproximado basado en su edad
- "El seguro básicamente es: si te pasa algo, tu familia recibe dinero para salir adelante"

## Fase 5: CERRAR (solo si está listo)
Datos que necesitas:
- Nombre completo
- Fecha de nacimiento
- ¿Tienes diabetes, hipertensión o alguna enfermedad crónica?
- ¿A quién pongo como beneficiario?
- Link de pago
- Póliza activa en 24 horas

# TU PERSONALIDAD

Eres:
- Cálida y accesible (no fría ni corporativa)
- Curiosa por la situación del cliente
- Paciente (no apresuras)
- Honesta (si no le conviene, lo dices)
- Conversacional (esto es WhatsApp, no un call center)

Tu tono:
- "¡Hola! Qué bueno que escribiste"
- "Cuéntame, ¿qué fue lo que te llamó la atención?"
- "Ah ok, entiendo perfectamente"
- "Mira, te explico cómo funciona..."
- Usas "tú", nunca "usted"
- Mensajes de 2-3 líneas máximo
- Muletillas: "va que va", "sale", "órale", "a ver cuéntame"

# LO QUE NUNCA HACES

- NO vendes de golpe (primero conecta)
- NO dices que eres IA o bot
- NO usas frases manipuladoras ("¿no crees que tu familia lo merece?")
- NO presionas con miedo ("nadie sabe cuándo le toca")
- NO explicas cláusulas que nadie preguntó
- NO envías párrafos largos (esto es WhatsApp)
- NO suenas como vendedor de call center
- NO dices "¿cuánto vale la tranquilidad?"
- NO repites preguntas que ya hiciste

# PRIMER MENSAJE IDEAL

Si alguien escribe "Hola" o "Vi su anuncio":
→ "¡Hola! Qué bueno que escribiste. Cuéntame, ¿qué fue lo que te llamó la atención del anuncio?"

Esto abre la conversación y te da contexto de su interés.

# MANEJO DE OBJECIONES

## "Es muy caro" / "No tengo presupuesto"
→ "Entiendo. ¿Cuánto es lo máximo que podrías pagar al mes sin que te duela?"
→ Ofrece suma menor: $300/mes = $500,000 de cobertura
→ "Son como $15 al día, menos que un café"

## "No creo en seguros" / "No pagan"
→ "Entiendo, hay muchas historias así"
→ "En vida es más simple: si te mueres, pagan. Punto."
→ "Solo hay 2 exclusiones: suicidio en primer año y mentir en el cuestionario de salud"
→ "¿Tienes alguna enfermedad que no me hayas dicho?"

## "Ya tengo seguro del trabajo"
→ "Ah qué bien. ¿Sabes de cuánto es?"
→ "¿Y qué pasa si cambias de trabajo o te corren?"
→ "El del trabajo es temporal. Este es tuyo para siempre, te lo llevas a donde vayas."

## "Lo voy a pensar"
→ "Va, sin presión. ¿Qué te hace dudar?"
→ Si tiene hijos: "¿Qué pasaría con ellos si mañana no llegas? ¿Tu pareja puede mantener todo sola?"
→ No presiones, pero planta la semilla

## "Soy joven" / "No tengo hijos"
→ "Honestamente a tu edad no es urgente"
→ "¿Ayudas a tus papás económicamente?"
→ Si no tiene dependientes, puede no ser buen fit - suéltalo con gracia

## "No gracias" (definitivo)
→ "Sale, que te vaya bien. Si algún día te interesa, aquí ando."

# REGLAS IMPORTANTES

1. Nunca ignores un mensaje. Si no entiendes, pregunta.
2. No seas insistente. Máximo 2 follow-ups si no responde.
3. Respeta los no. Un no claro se respeta.
4. Adapta la velocidad. Si responde rápido, tú también.
5. Pasa a humano cuando sea necesario.

# CASOS ESPECIALES

Audio/imagen:
→ "No puedo escuchar audios. ¿Me lo escribes?"

Respuestas monosilábicas (Ok, Aja, emoji):
→ Tomar como interés leve, hacer una pregunta abierta

Lead recurrente:
→ Reconoce que ya hablaron, retoma donde quedaron

Cliente comparando con competencia:
→ "¿Por cuánto te cotizaron? ¿Suma asegurada?" (compara manzanas con manzanas)

# HERRAMIENTAS DISPONIBLES

## Herramienta de Pago:
1. **send_payment_link**: Envía link de pago de Stripe. Usa SOLO cuando:
   - El cliente confirmó que quiere contratar
   - Ya tienes: nombre, fecha nacimiento, si fuma, beneficiario
   - REQUIERE: email del cliente
   - Después de enviar: "Te envié el link de pago. Son $X/mes. En cuanto pagues, en 24 horas tienes tu póliza activa."

## Herramienta de Escalación:
2. **escalate_to_human**: Transfiere a un humano. Usa cuando:
   - El cliente pide hablar con una persona
   - Tienes dudas técnicas que no puedes resolver
   - El cliente está frustrado o molesto
   - Es un caso especial (enfermedad preexistente, suma muy alta, etc.)
   - Responde: "Claro, te comunico con alguien del equipo. Te van a escribir en los próximos minutos."`;

export interface SimpleAgentResult {
  response: string;
  tokensUsed?: number;
  escalatedToHuman?: {
    reason: string;
    summary: string;
  };
  paymentLinkSent?: {
    plan: string;
    email: string;
    checkoutUrl: string;
  };
  detectedIndustry?: string;
  saidLater?: boolean;  // User said "later" - trigger follow-up
}

export async function simpleAgent(
  message: string,
  context: ConversationContext
): Promise<SimpleAgentResult> {
  const history = context.recentMessages
    .slice(-20)
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

  history.push({ role: 'user', content: message });

  console.log('=== HISTORY ===');
  console.log(JSON.stringify(history, null, 2));

  // ============================================
  // STEP 0: Get Few-Shot Context (ejemplos relevantes)
  // ============================================
  const fewShotContext = getFewShotContext(message, history);
  if (fewShotContext) {
    console.log('=== FEW-SHOT CONTEXT ADDED ===');
  }

  // ============================================
  // STEP 1: Multi-Agent Analysis (Analista → Estrategia)
  // ============================================
  const { analysis: sellerAnalysis, instructions: sellerInstructions } = await getSellerStrategy(
    message,
    history,
    {
      name: context.lead.name,
      company: context.lead.company,
      industry: context.lead.industry,
      previousInteractions: context.recentMessages.length,
    }
  );
  console.log('=== SELLER STRATEGY ===');
  console.log(`Stage: ${sellerAnalysis.stage}, Strategy: ${sellerAnalysis.recommendedStrategy}`);
  if (sellerAnalysis.hasObjection) {
    console.log(`Objection detected: ${sellerAnalysis.objectionType}`);
  }

  // ============================================
  // STEP 2: Generate reasoning analysis
  // ============================================
  const reasoning = await generateReasoningFast(message, context);
  console.log('=== REASONING ===');
  console.log(reasoning.analysis);

  // ============================================
  // STEP 2: Detect industry for personalization
  // ============================================
  const industry = reasoning.industry;
  const industrySection = getIndustryPromptSection(industry);

  // ============================================
  // STEP 3: Get sentiment instruction
  // ============================================
  const sentimentInstruction = getSentimentInstruction(reasoning.sentiment);

  // Helper to check if text contains any keyword from a Set
  const containsAny = (text: string, keywords: Set<string>): boolean => {
    for (const keyword of keywords) {
      if (text.includes(keyword)) return true;
    }
    return false;
  };

  const currentMsg = message.toLowerCase();
  let saidLater = containsAny(currentMsg, LATER_KEYWORDS);

  // Detectar estado - solo handoff triggers, el resto lo maneja el multi-agent
  let state = 'conversacion_activa';
  if (containsAny(currentMsg, HANDOFF_KEYWORDS)) state = 'handoff_human_request';
  else if (containsAny(currentMsg, FRUSTRATION_KEYWORDS)) state = 'handoff_frustrated';

  // Construir contexto del cliente
  const contextParts: string[] = [];

  if (context.lead.name && context.lead.name !== 'Usuario') {
    contextParts.push(`Cliente: ${context.lead.name}`);
  }
  if (context.memory) {
    contextParts.push(`Info previa: ${context.memory}`);
  }

  let systemWithContext = SYSTEM_PROMPT;

  // Add industry-specific context
  if (industrySection) {
    systemWithContext += `\n\n${industrySection}`;
  }

  if (contextParts.length > 0) {
    systemWithContext += `\n\n# CONTEXTO\n${contextParts.join('\n')}`;
  }

  // Add few-shot examples (ejemplos relevantes para el contexto)
  if (fewShotContext) {
    systemWithContext += `\n\n${fewShotContext}`;
  }

  // Add multi-agent seller strategy
  systemWithContext += `\n\n${sellerInstructions}`;

  // Add reasoning analysis
  systemWithContext += `\n\n# ANÁLISIS ADICIONAL\n${formatReasoningForPrompt(reasoning)}`;

  // Add sentiment instruction if relevant
  if (sentimentInstruction) {
    systemWithContext += `\n\n# INSTRUCCIÓN DE TONO\n${sentimentInstruction}`;
  }

  systemWithContext += `\n\n# ESTADO ACTUAL: ${state.toUpperCase()}`;

  // Instrucciones específicas por estado - Venta de Seguros
  const stateInstructions: Record<string, string> = {
    // HANDOFF STATES
    'handoff_human_request': `
ACCIÓN OBLIGATORIA: El usuario pidió hablar con un humano. USA escalate_to_human INMEDIATAMENTE.
- NO intentes retenerlo ni convencerlo
- Responde: "Claro, te comunico con alguien del equipo. Te van a escribir en los próximos minutos."`,

    'handoff_frustrated': `
ACCIÓN OBLIGATORIA: El usuario está frustrado. USA escalate_to_human con URGENCIA.
- Muestra empatía primero
- Responde: "Perdón si no me expliqué bien. Deja te paso con alguien del equipo que te puede ayudar mejor. Te escriben ahorita mismo."`,

    'conversacion_activa': `
Deja que el sistema multi-agente guíe la conversación.
SIGUE las instrucciones del análisis que viene arriba.
Sé cálida, haz UNA pregunta a la vez, mensajes cortos.`
  };

  if (stateInstructions[state]) {
    systemWithContext += stateInstructions[state];
  }

  systemWithContext += `\n\n# INSTRUCCIÓN FINAL\nResponde en máximo 2-3 líneas. Sé cálida y conversacional. Haz UNA pregunta a la vez. Si el cliente está listo para comprar, pide los datos necesarios (nombre, fecha nacimiento, email, beneficiario).`;

  // Get client info
  const clientName = context.lead.name || 'Cliente';
  const clientPhone = context.lead.phone || '';

  // Define tools for insurance sales
  const tools = {
    escalate_to_human: tool({
      description: 'Transfiere la conversación a un humano. Usa cuando: el cliente pide hablar con una persona, está frustrado, tiene un caso especial (enfermedad preexistente, suma muy alta), o tienes dudas que no puedes resolver.',
      inputSchema: zodSchema(z.object({
        reason: z.string().describe('Motivo de la escalación'),
        summary: z.string().describe('Resumen breve de la conversación y qué necesita el cliente'),
      })),
      execute: async (params) => {
        const { reason, summary } = params as { reason: string; summary: string };
        console.log(`[Tool] Escalating to human: ${reason}`);

        const recentMsgs = history.slice(-5).map(m =>
          `${m.role === 'user' ? 'Cliente' : 'Sofi'}: ${m.content}`
        );

        const escalated = await escalateToHuman({
          clientPhone,
          clientName,
          reason,
          conversationSummary: summary,
          recentMessages: recentMsgs,
          isUrgent: false,
          isVIP: false
        });

        return {
          success: escalated,
          message: escalated
            ? 'Escalado exitosamente. El cliente será contactado por un humano pronto.'
            : 'No se pudo escalar. Intenta resolver la situación.'
        };
      }
    }),

    send_payment_link: tool({
      description: 'Envía un link de pago de Stripe por WhatsApp para el seguro de vida. Usa SOLO cuando el cliente haya confirmado que quiere contratar y ya tengas: nombre completo, fecha de nacimiento, email, y beneficiario.',
      inputSchema: zodSchema(z.object({
        email: z.string().describe('Email del cliente'),
        monthlyAmount: z.number().describe('Monto mensual en MXN (ej: 540 para $540/mes)')
      })),
      execute: async (params) => {
        const { email, monthlyAmount } = params as { email: string; monthlyAmount: number };
        console.log(`[Tool] Creating payment link for ${email}, amount: $${monthlyAmount}/mes`);
        try {
          const { url } = await createCheckoutSession({
            email,
            phone: clientPhone,
            plan: 'starter' // Default plan, amount overridden
          });
          const sent = await sendPaymentLink(clientPhone, url, `Seguro de Vida - $${monthlyAmount}/mes`);
          return {
            success: sent,
            checkoutUrl: url,
            message: sent
              ? `Link de pago enviado. $${monthlyAmount}/mes.`
              : 'No se pudo enviar el link de pago.'
          };
        } catch (error) {
          console.error('[Tool] Payment link error:', error);
          return {
            success: false,
            message: 'Error al crear el link de pago.'
          };
        }
      }
    })
  };

  // Track tool results
  let escalatedToHuman: SimpleAgentResult['escalatedToHuman'] = undefined;
  let paymentLinkSent: SimpleAgentResult['paymentLinkSent'] = undefined;

  try {
    const result = await generateText({
      model: openai('gpt-5.2-chat-latest'),
      system: systemWithContext,
      messages: history,
      tools,
      temperature: 0.4,
      maxOutputTokens: 250,
      onStepFinish: async (step) => {
        if (step.toolResults) {
          for (const toolResult of step.toolResults) {
            const output = toolResult.output as { success?: boolean; checkoutUrl?: string } | undefined;

            // Track escalate_to_human
            if (toolResult.toolName === 'escalate_to_human' && output?.success) {
              const toolCall = step.toolCalls?.find(tc => tc.toolName === 'escalate_to_human');
              if (toolCall) {
                const args = toolCall.input as { reason: string; summary: string };
                escalatedToHuman = { reason: args.reason, summary: args.summary };
                console.log(`[Tool] Escalated to human: ${args.reason}`);
              }
            }

            // Track send_payment_link
            if (toolResult.toolName === 'send_payment_link' && output?.success) {
              const toolCall = step.toolCalls?.find(tc => tc.toolName === 'send_payment_link');
              if (toolCall) {
                const args = toolCall.input as { email: string; monthlyAmount: number };
                paymentLinkSent = {
                  plan: `$${args.monthlyAmount}/mes`,
                  email: args.email,
                  checkoutUrl: output.checkoutUrl || ''
                };
                console.log(`[Tool] Payment link sent: $${args.monthlyAmount}/mes to ${args.email}`);
              }
            }
          }
        }
      }
    });

    let response = result.text.trim();
    response = response.replace(/\*+/g, '');
    response = response.replace(/^(Víctor|Victor):\s*/i, '');

    console.log('=== RESPONSE ===');
    console.log(response);

    return {
      response,
      tokensUsed: result.usage?.totalTokens,
      escalatedToHuman,
      paymentLinkSent,
      detectedIndustry: industry !== 'generic' ? industry : undefined,
      saidLater
    };

  } catch (error) {
    console.error('Agent error:', error);
    return {
      response: 'Perdón, tuve un problema. ¿Me repites?'
    };
  }
}
