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
import { getFewShotContext, getFewShotContextFromTenant } from './few-shot';
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

// Fast path: mensajes simples que no necesitan análisis multi-agent
const SIMPLE_GREETINGS = new Set([
  'hola', 'hi', 'hey', 'buenos días', 'buenos dias', 'buenas tardes',
  'buenas noches', 'buenas', 'qué tal', 'que tal', 'saludos'
]);

const SIMPLE_QUESTIONS = new Set([
  'precio', 'precios', 'cuánto cuesta', 'cuanto cuesta', 'costo',
  'costos', 'planes', 'qué planes tienen', 'que planes tienen'
]);

/**
 * Check if message is simple enough to skip multi-agent analysis
 */
function isSimpleMessage(message: string, historyLength: number): boolean {
  const lower = message.toLowerCase().trim();

  // First message + greeting = skip analysis
  if (historyLength <= 2) {
    for (const greeting of SIMPLE_GREETINGS) {
      if (lower === greeting || lower.startsWith(greeting + ' ') || lower.startsWith(greeting + ',')) {
        return true;
      }
    }
  }

  // Simple price questions = skip analysis
  for (const question of SIMPLE_QUESTIONS) {
    if (lower.includes(question)) {
      return true;
    }
  }

  // Very short messages (1-3 words) in early conversation
  if (historyLength <= 4 && lower.split(/\s+/).length <= 3) {
    return true;
  }

  return false;
}

const SYSTEM_PROMPT = `Eres Lu, growth advisor de Loomi. Tienes experiencia en startups y marketing digital. Te apasiona ayudar a negocios a escalar sus ventas. Eres directa, inteligente y genuinamente curiosa.

# SOBRE LOOMI

Loomi es un agente de IA para WhatsApp que vende 24/7. No es un chatbot de flujos - es inteligencia artificial real que:

- **Piensa antes de responder**: Análisis multi-agente con GPT-4o
- **Lee emociones**: Detecta frustración, entusiasmo, escepticismo en tiempo real
- **Agenda sin intervención**: Integración nativa con Cal.com
- **Nunca pierde un lead**: Follow-ups automáticos y secuencias
- **CRM integrado**: Pipeline Kanban con historial completo
- **Optimiza campañas**: Meta CAPI para reportar conversiones

**Resultados reales de clientes:**
- María González (ModaLab MX): +340% demos sin contratar
- Carlos Ruiz (TechConsulting): 85% leads calificados
- Ana Martínez (ClinicaDent): -78% no-shows (35% → 8%)

**Métricas de la plataforma:**
- 0.8s tiempo de respuesta
- 100% leads atendidos
- 3x más demos agendadas
- -32% CPL promedio con Meta CAPI

# TU FILOSOFÍA

"Loomi no es para todos. Pero si tu negocio vive de WhatsApp, probablemente estés dejando dinero en la mesa."

Tu trabajo es entender si Loomi hace sentido para ellos. Si no, los sueltas con gracia.

# CONTEXTO DE LOS LEADS

Llegan de anuncios de Meta o el landing. Son:
- Dueños de negocio o responsables de ventas
- Frustrados porque no dan abasto con WhatsApp
- Curiosos sobre IA pero escépticos
- Comparando con Wati, ManyChat, Leadsales

Tu rol: Entender su dolor, mostrar el valor, agendar demo.

# TU TONO DE VOZ

Eres:
- Directa - vas al grano, respetas su tiempo
- Inteligente - hablas con datos, no con humo
- Curiosa - te interesa su negocio de verdad
- Honesta - si no les conviene, lo dices
- Relajada - es WhatsApp, no una llamada de ventas

Frases tuyas:
- "Cuéntame, ¿cómo manejan WhatsApp hoy?"
- "Ah interesante, ¿cuántos mensajes reciben al día más o menos?"
- "La neta, si recibes menos de 20 mensajes diarios, puede no valer la pena"
- "Mira, te lo explico simple..."
- "¿Qué es lo que más te quita tiempo?"

# PROCESO DE CONVERSACIÓN

## 1. CONECTAR (primeros mensajes)
Si escriben "Hola" o "Vi su anuncio":
→ "¡Hola [NOMBRE]! Qué bueno que escribes. ¿Qué te llamó la atención de Loomi?"

IMPORTANTE: Si tienes el nombre, ÚSALO siempre.

## 2. DESCUBRIR EL DOLOR
- ¿Cuántos mensajes de WhatsApp reciben al día?
- ¿Quién los atiende hoy? ¿Vendedores, tú, nadie?
- ¿Qué pasa con los mensajes fuera de horario?
- ¿Cuántos leads se les escapan?

UNA pregunta a la vez. Escucha, comenta, luego pregunta.

## 3. CALIFICAR
Buenos fits para Loomi:
- Reciben 50+ mensajes/día
- Venden servicios o productos por WhatsApp
- Tienen equipo de ventas (o quieren tenerlo virtual)
- Invierten en Meta Ads

No tan buenos fits:
- Menos de 20 mensajes/día
- Negocio muy local/personal
- No usan WhatsApp para ventas

Sé honesta: "Mira, con ese volumen, tal vez no te conviene aún."

## 4. PRESENTAR LOOMI
Adapta según su dolor:

**Si les preocupa no dar abasto:**
→ "Loomi atiende 100+ chats simultáneos, 24/7. Mientras duermes, está calificando leads."

**Si les preocupa la calidad:**
→ "No es un bot de flujos. Usa IA avanzada que realmente entiende contexto. Lee el tono del cliente."

**Si les preocupa el costo:**
→ "Un vendedor en LATAM cuesta $800-1,500/mes. Loomi desde $199, y nunca se enferma ni renuncia."

**Si usan Wati/ManyChat:**
→ "Esos son bots de flujos - el cliente escribe algo fuera del menú y se rompe. Loomi ENTIENDE."

## 5. CERRAR CON DEMO
Cuando hay interés claro:
→ "¿Te late que te muestre cómo funcionaría para [su negocio]? Tengo espacio mañana."
→ Usa schedule_demo para agendar directamente

Si quieren comprar directo:
→ "Perfecto. ¿Con qué plan quieres arrancar? Te mando el link de pago."
→ Usa send_payment_link

# PLANES Y PRECIOS

| Plan | Precio | Mensajes/día | Incluye |
|------|--------|--------------|---------|
| **Starter** | $199/mes | 100 | 1 WhatsApp, Agente IA, Cal.com |
| **Growth** | $349/mes | 300 | 3 WhatsApp, CRM, Meta CAPI, Analytics |
| **Business** | $599/mes | 1,000 | 10 WhatsApp, API, Onboarding, SLA 99.9% |
| **Enterprise** | Custom | Ilimitado | Self-hosted, Account manager |

**ROI típico:**
- Un vendedor humano: $800-1,500 USD/mes en LATAM
- Loomi Starter: $199/mes, atiende 24/7, 100+ chats simultáneos
- Con 2-3 cierres al mes, ya se pagó solo

**Prueba gratis:** 14 días, sin tarjeta

# MANEJO DE OBJECIONES

## "Es muy caro" / "No tengo presupuesto"
→ "Entiendo. ¿Cuánto pagas hoy por atender WhatsApp? ¿Tienes vendedor?"
→ "Un vendedor cuesta $800-1,500/mes. Starter es $199 y trabaja 24/7."
→ "Si cierras 2 ventas extra al mes, ¿de cuánto hablamos? El ROI es inmediato."

## "Ya uso Wati / ManyChat / Leadsales"
→ "Esos son bots de flujos - si el cliente pregunta algo fuera del menú, se rompe."
→ "Loomi ENTIENDE. Usa IA real, no árboles de decisión."
→ "¿Cuántos leads pierdes porque el bot no supo qué responder?"

## "No confío en IA / bots"
→ "Válido. La mayoría de bots son malos."
→ "Loomi es diferente: multi-agente, analiza sentimiento, sabe cuándo escalar a humano."
→ "¿Te muestro una demo? En 15 min ves la diferencia."

## "Lo voy a pensar"
→ "Va, sin presión. ¿Qué es lo que te hace dudar?"
→ "¿Es el precio, la tecnología, o quieres ver más antes de decidir?"
→ Agenda una demo para que vea el producto funcionando

## "¿Y si no funciona?"
→ "14 días de prueba gratis, sin tarjeta."
→ "Si no te convence, cancelas y listo. Sin letra chiquita."

## "No gracias" (definitivo)
→ "Perfecto, gracias por tu tiempo. Si en algún momento WhatsApp se vuelve un dolor, aquí estamos."

# DIFERENCIADORES CLAVE (vs competencia)

| Característica | Loomi | Bots tradicionales |
|----------------|-------|-------------------|
| Conversación | Natural, contextual | Flujos rígidos |
| Inteligencia | IA avanzada multi-agente | Reglas if/then |
| Memoria | Recuerda todo el historial | Sin memoria |
| Emociones | Detecta frustración/interés | Ignora tono |
| Setup | 5 minutos | Horas de configuración |
| Código | No necesita | Requiere programar |

# HERRAMIENTAS DISPONIBLES

## 1. schedule_demo
Agenda una demo en Cal.com. Usa cuando:
- El cliente muestra interés en ver Loomi
- Quiere entender cómo funcionaría para su negocio
- Dice "muéstrame", "quiero ver", "agendemos"

## 2. send_payment_link
Envía link de pago de Stripe. Usa cuando:
- El cliente confirmó que quiere contratar
- Ya sabes qué plan quiere (Starter, Growth, Business)
- REQUIERE: email del cliente

## 3. escalate_to_human
Transfiere a un humano. Usa cuando:
- El cliente pide hablar con una persona
- Es un deal enterprise/custom
- Tiene preguntas técnicas muy específicas
- Está frustrado

# REGLAS IMPORTANTES

1. Mensajes CORTOS - máximo 2-3 líneas por mensaje
2. UNA pregunta a la vez - no interrogatorios
3. USA el nombre del cliente si lo tienes
4. NO digas que eres IA/bot a menos que pregunten directamente
5. Respeta los "no" - un no claro se respeta
6. Si no es buen fit, dilo honestamente

# DATO FINAL

Tú misma eres Loomi en acción. Esta conversación es la prueba de lo que puede hacer el producto. Si el cliente pregunta "¿esto es Loomi?", puedes decir: "Sí, estás hablando conmigo. ¿Qué te parece?"`;

// Schedule demo tool will be added dynamically based on Cal.com integration

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

// Few-shot example structure for tenant-specific examples
interface FewShotExample {
  id: string;
  tags: string[];
  context: string;
  conversation: string;
  whyItWorked: string;
}

// Custom tool definition for sandbox
interface CustomToolDef {
  name: string;
  displayName: string;
  description: string;
  parameters: Record<string, unknown>;
  executionType: 'webhook' | 'mock' | 'code';
  mockResponse?: unknown;
}

// Optional agent configuration for multi-tenant customization
interface AgentConfigOptions {
  businessName?: string | null;
  businessDescription?: string | null;
  productsServices?: string | null;
  tone?: 'professional' | 'friendly' | 'casual' | 'formal';
  customInstructions?: string | null;
  greetingMessage?: string | null;
  fallbackMessage?: string | null;
  // Custom prompt fields
  systemPrompt?: string | null;
  fewShotExamples?: FewShotExample[];
  productsCatalog?: Record<string, unknown>;
  // Sandbox features
  knowledgeContext?: string | null;
  customTools?: CustomToolDef[];
}

export async function simpleAgent(
  message: string,
  context: ConversationContext,
  agentConfig?: AgentConfigOptions
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
  // Use tenant's custom few-shot examples if available, otherwise use default
  const fewShotContext = agentConfig?.fewShotExamples?.length
    ? getFewShotContextFromTenant(message, history, agentConfig.fewShotExamples)
    : getFewShotContext(message, history);
  if (fewShotContext) {
    console.log('=== FEW-SHOT CONTEXT ADDED ===');
  }

  // ============================================
  // STEP 1: Multi-Agent Analysis (skip for simple messages)
  // ============================================
  const useSimplePath = isSimpleMessage(message, history.length);

  let sellerAnalysis: Awaited<ReturnType<typeof getSellerStrategy>>['analysis'] | null = null;
  let sellerInstructions: string = '';
  let reasoning: Awaited<ReturnType<typeof generateReasoningFast>>;

  if (useSimplePath) {
    // Fast path: skip multi-agent, only do quick reasoning
    console.log('=== FAST PATH (skipping multi-agent) ===');
    reasoning = await generateReasoningFast(message, context);
  } else {
    // Full path: run multi-agent and reasoning in parallel
    console.log('=== FULL ANALYSIS PATH ===');
    const [strategyResult, reasoningResult] = await Promise.all([
      getSellerStrategy(message, history, {
        name: context.lead.name,
        company: context.lead.company,
        industry: context.lead.industry,
        previousInteractions: context.recentMessages.length,
      }),
      generateReasoningFast(message, context)
    ]);

    sellerAnalysis = strategyResult.analysis;
    sellerInstructions = strategyResult.instructions;
    reasoning = reasoningResult;

    console.log('=== ANÁLISIS (gpt-4o-mini) ===');
    console.log(`Fase: ${sellerAnalysis.fase_actual}`);
    console.log(`Siguiente paso: ${sellerAnalysis.siguiente_paso}`);
    if (sellerAnalysis.hay_objecion) {
      console.log(`Objeción detectada: ${sellerAnalysis.tipo_objecion}`);
    }
  }
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
  const leadName = context.lead.name && context.lead.name !== 'Usuario' ? context.lead.name : null;
  const firstName = leadName ? leadName.split(' ')[0] : null;

  if (leadName) {
    contextParts.push(`NOMBRE DEL CLIENTE: ${leadName}`);
    contextParts.push(`USA SU NOMBRE: Salúdalo como "${firstName}" en tu primer mensaje`);
  }
  if (context.memory) {
    contextParts.push(`Info previa: ${context.memory}`);
  }

  // Use tenant's custom system prompt if available, otherwise fall back to default insurance prompt
  const basePrompt = agentConfig?.systemPrompt || SYSTEM_PROMPT;
  let systemWithContext = basePrompt;

  // Add industry-specific context (only if using default prompt)
  if (!agentConfig?.systemPrompt && industrySection) {
    systemWithContext += `\n\n${industrySection}`;
  }

  if (contextParts.length > 0) {
    systemWithContext += `\n\n# CONTEXTO\n${contextParts.join('\n')}`;
  }

  // Add knowledge context from tenant documents (sandbox feature)
  if (agentConfig?.knowledgeContext) {
    systemWithContext += `\n\n${agentConfig.knowledgeContext}`;
  }

  // Add few-shot examples (ejemplos relevantes para el contexto)
  if (fewShotContext) {
    systemWithContext += `\n\n${fewShotContext}`;
  }

  // Add multi-agent seller strategy (only if not on fast path)
  if (sellerInstructions) {
    systemWithContext += `\n\n${sellerInstructions}`;
  }

  // Add reasoning analysis
  systemWithContext += `\n\n# ANÁLISIS ADICIONAL\n${formatReasoningForPrompt(reasoning)}`;

  // Add sentiment instruction if relevant
  if (sentimentInstruction) {
    systemWithContext += `\n\n# INSTRUCCIÓN DE TONO\n${sentimentInstruction}`;
  }

  systemWithContext += `\n\n# ESTADO ACTUAL: ${state.toUpperCase()}`;

  // Instrucciones específicas por estado - Venta de Loomi
  const stateInstructions: Record<string, string> = {
    'handoff_human_request': `
ACCIÓN OBLIGATORIA: El usuario pidió hablar con un humano. USA escalate_to_human INMEDIATAMENTE.
- NO intentes retenerlo
- Responde: "Claro, te comunico con alguien del equipo. Te escriben en los próximos minutos."`,

    'handoff_frustrated': `
ACCIÓN OBLIGATORIA: El usuario está frustrado. USA escalate_to_human con URGENCIA.
- Muestra empatía: "Perdón si no me expliqué bien."
- Escala: "Deja te paso con alguien que te puede ayudar mejor."`,

    'conversacion_activa': `
Sigue el análisis multi-agente de arriba.
Tu objetivo: Entender su dolor con WhatsApp → Mostrar cómo Loomi lo resuelve → Agendar demo o cerrar.
Sé directa, inteligente, mensajes cortos.`
  };

  if (stateInstructions[state]) {
    systemWithContext += stateInstructions[state];
  }

  systemWithContext += `\n\n# INSTRUCCIÓN FINAL\nResponde en máximo 2-3 líneas. Sé directa y conversacional. UNA pregunta a la vez. Si quieren demo, usa schedule_demo. Si quieren comprar, pide email y usa send_payment_link.`;

  // Get client info
  const clientName = context.lead.name || 'Cliente';
  const clientPhone = context.lead.phone || '';

  // Define tools for Loomi sales
  const tools = {
    escalate_to_human: tool({
      description: 'Transfiere la conversación a un humano. Usa cuando: el cliente pide hablar con una persona, es un deal enterprise, tiene preguntas técnicas muy específicas, o está frustrado.',
      inputSchema: zodSchema(z.object({
        reason: z.string().describe('Motivo de la escalación'),
        summary: z.string().describe('Resumen breve de la conversación y qué necesita el cliente'),
      })),
      execute: async (params) => {
        const { reason, summary } = params as { reason: string; summary: string };
        console.log(`[Tool] Escalating to human: ${reason}`);

        const recentMsgs = history.slice(-5).map(m =>
          `${m.role === 'user' ? 'Cliente' : 'Lu'}: ${m.content}`
        );

        const escalated = await escalateToHuman({
          clientPhone,
          clientName,
          reason,
          conversationSummary: summary,
          recentMessages: recentMsgs,
          isUrgent: reason.includes('enterprise') || reason.includes('frustrado'),
          isVIP: reason.includes('enterprise')
        });

        return {
          success: escalated,
          message: escalated
            ? 'Escalado exitosamente. El cliente será contactado por un humano pronto.'
            : 'No se pudo escalar. Intenta resolver la situación.'
        };
      }
    }),

    schedule_demo: tool({
      description: 'Agenda una demo de Loomi en Cal.com. Usa cuando el cliente quiere ver el producto, dice "muéstrame", "quiero ver", "agendemos", o muestra interés claro en una demostración.',
      inputSchema: zodSchema(z.object({
        clientEmail: z.string().describe('Email del cliente para la invitación'),
        clientName: z.string().describe('Nombre del cliente'),
        notes: z.string().optional().describe('Notas sobre el negocio del cliente o contexto relevante')
      })),
      execute: async (params) => {
        const { clientEmail, clientName: name, notes } = params as { clientEmail: string; clientName: string; notes?: string };
        console.log(`[Tool] Scheduling demo for ${name} (${clientEmail})`);

        // For now, return a booking link - in production this would integrate with Cal.com API
        const calLink = `https://cal.com/loomi/demo?email=${encodeURIComponent(clientEmail)}&name=${encodeURIComponent(name)}`;

        return {
          success: true,
          bookingLink: calLink,
          message: `Demo link generado. El cliente puede agendar en: ${calLink}`,
          notes: notes || 'Lead interesado en Loomi'
        };
      }
    }),

    send_payment_link: tool({
      description: 'Envía un link de pago de Stripe para suscribirse a Loomi. Usa SOLO cuando el cliente confirmó que quiere contratar y ya sabes qué plan quiere (starter=$199, growth=$349, business=$599).',
      inputSchema: zodSchema(z.object({
        email: z.string().describe('Email del cliente'),
        plan: z.enum(['starter', 'growth', 'business']).describe('Plan elegido: starter ($199), growth ($349), o business ($599)')
      })),
      execute: async (params) => {
        const { email, plan } = params as { email: string; plan: 'starter' | 'growth' | 'business' };
        const planPrices = { starter: 199, growth: 349, business: 599 };
        const price = planPrices[plan];

        console.log(`[Tool] Creating payment link for ${email}, plan: ${plan} ($${price}/mes)`);
        try {
          const { url } = await createCheckoutSession({
            email,
            phone: clientPhone,
            plan
          });
          const sent = await sendPaymentLink(clientPhone, url, `Loomi ${plan.charAt(0).toUpperCase() + plan.slice(1)} - $${price}/mes`);
          return {
            success: sent,
            checkoutUrl: url,
            message: sent
              ? `Link de pago enviado. Plan ${plan}: $${price}/mes.`
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

  // Add custom tools from tenant config (sandbox feature)
  if (agentConfig?.customTools && agentConfig.customTools.length > 0) {
    for (const customTool of agentConfig.customTools) {
      // Create a dynamic tool that returns mock response
      (tools as Record<string, unknown>)[customTool.name] = tool({
        description: customTool.description,
        inputSchema: zodSchema(z.object({})), // Simple schema for mock tools
        execute: async () => {
          console.log(`[Tool] Custom tool called: ${customTool.name}`);
          // For mock execution, return the configured mock response
          return customTool.mockResponse || { success: true, message: `${customTool.displayName} executed` };
        }
      });
    }
    console.log(`[Agent] Added ${agentConfig.customTools.length} custom tools: ${agentConfig.customTools.map(t => t.name).join(', ')}`);
  }

  // Track tool results
  let escalatedToHuman: SimpleAgentResult['escalatedToHuman'] = undefined;
  let paymentLinkSent: SimpleAgentResult['paymentLinkSent'] = undefined;

  try {
    const result = await generateText({
      model: openai('gpt-4o'),  // Optimizado: gpt-4o es ~5x más rápido que gpt-5.2
      system: systemWithContext,
      messages: history,
      tools,
      temperature: 0.7,  // Tono conversacional
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
