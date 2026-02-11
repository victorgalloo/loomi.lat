/**
 * Simple Agent - Main conversation handler
 *
 * Now fully configurable per tenant. All tenants go through the full pipeline
 * (multi-agent analysis + sentiment + industry + few-shot + reasoning)
 * parametrized with their own context. Defaults to Loomi config when not set.
 *
 * Optimized with:
 * - Set for O(1) keyword lookups (js-set-map-lookups)
 * - Hoisted RegExp (js-hoist-regexp)
 * - Early returns (js-early-exit)
 * - Combined iterations (js-combine-iterations)
 */

import { generateText, stepCountIs } from 'ai';
import { tool, zodSchema } from '@ai-sdk/provider-utils';
import { resolveModel } from './model';
import { z } from 'zod';
import { ConversationContext } from '@/types';
import { sendPaymentLink } from '@/lib/whatsapp/send';
import { executeHandoff, HandoffContext } from '@/lib/handoff';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import { createEvent } from '@/lib/tools/calendar';
import { generateReasoningFast, formatReasoningForPrompt } from './reasoning';
import { getSentimentInstruction } from './sentiment';
import { getIndustryPromptSection, detectIndustry, Industry, INDUSTRY_CONTEXTS } from './industry';
import { getFewShotContext, getFewShotContextFromTenant } from './few-shot';
import { getSellerStrategy, TenantAnalysisContext } from './multi-agent';
import {
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_PRODUCT_CONTEXT,
  DEFAULT_PRICING_CONTEXT,
  DEFAULT_SALES_PROCESS,
  DEFAULT_QUALIFICATION_CRITERIA,
  DEFAULT_COMPETITOR_CONTEXT,
  DEFAULT_OBJECTION_HANDLERS,
  DEFAULT_AGENT_NAME,
  DEFAULT_AGENT_ROLE,
  buildDynamicIdentity,
} from './defaults';
import { analyzeProgress } from './progress-tracker';
import { guardResponse } from './response-guard';

// Keyword sets for state detection
// Note: HANDOFF_KEYWORDS and FRUSTRATION_KEYWORDS removed.
// Handoff detection is now handled at webhook level via detectHandoffTrigger()
// with context-awareness to prevent false positives.

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

// Schedule demo tool will be added dynamically based on Cal.com integration

export interface SimpleAgentResult {
  response: string;
  tokensUsed?: number;
  appointmentBooked?: {
    eventId: string;
    date: string;
    time: string;
    email: string;
    meetingUrl?: string;
  };
  brochureSent?: boolean;
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
  showScheduleList?: boolean;  // Trigger interactive schedule list in WhatsApp
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
  // Model override per tenant
  model?: string | null;
  // Tenant ID for multi-tenant features (payments, etc)
  tenantId?: string;
  // Configurable tenant context fields
  productContext?: string | null;
  pricingContext?: string | null;
  salesProcessContext?: string | null;
  qualificationContext?: string | null;
  competitorContext?: string | null;
  objectionHandlers?: Record<string, string>;
  analysisEnabled?: boolean;
  maxResponseTokens?: number;
  temperature?: number;
  agentName?: string | null;
  agentRole?: string | null;
}

/**
 * Build tenant analysis context from agent config, falling back to defaults
 */
function buildTenantAnalysisContext(agentConfig?: AgentConfigOptions): TenantAnalysisContext {
  const hasCustomIdentity = !!(agentConfig?.systemPrompt || agentConfig?.agentName || agentConfig?.businessName);

  if (!hasCustomIdentity) {
    // Loomi default: comportamiento actual intacto
    return {
      productContext: agentConfig?.productContext || DEFAULT_PRODUCT_CONTEXT,
      pricingContext: agentConfig?.pricingContext || DEFAULT_PRICING_CONTEXT,
      salesProcessContext: agentConfig?.salesProcessContext || DEFAULT_SALES_PROCESS,
      qualificationContext: agentConfig?.qualificationContext || DEFAULT_QUALIFICATION_CRITERIA,
      competitorContext: agentConfig?.competitorContext || DEFAULT_COMPETITOR_CONTEXT,
      objectionHandlers: (agentConfig?.objectionHandlers && Object.keys(agentConfig.objectionHandlers).length > 0)
        ? agentConfig.objectionHandlers
        : DEFAULT_OBJECTION_HANDLERS,
      agentName: agentConfig?.agentName || DEFAULT_AGENT_NAME,
      agentRole: agentConfig?.agentRole || DEFAULT_AGENT_ROLE,
    };
  }

  // Custom tenant: solo usar lo que configuraron explícitamente
  const agentName = agentConfig.agentName || agentConfig.businessName || 'Agente';
  const agentRole = agentConfig.agentRole
    || (agentConfig.businessName ? `representante de ${agentConfig.businessName}` : 'asistente de ventas');

  return {
    productContext: agentConfig.productContext || '',
    pricingContext: agentConfig.pricingContext || '',
    salesProcessContext: agentConfig.salesProcessContext || '',
    qualificationContext: agentConfig.qualificationContext || '',
    competitorContext: agentConfig.competitorContext || '',
    objectionHandlers: (agentConfig.objectionHandlers && Object.keys(agentConfig.objectionHandlers).length > 0)
      ? agentConfig.objectionHandlers
      : {},
    agentName,
    agentRole,
    systemPromptExcerpt: agentConfig.systemPrompt!.substring(0, 800),
  };
}

export async function simpleAgent(
  message: string,
  context: ConversationContext,
  agentConfig?: AgentConfigOptions
): Promise<SimpleAgentResult> {
  // Build history with time gap awareness
  const recentSlice = context.recentMessages.slice(-20);
  const history: { role: 'user' | 'assistant'; content: string }[] = [];

  for (let i = 0; i < recentSlice.length; i++) {
    const m = recentSlice[i];
    // Detect large time gaps (>2 hours) between messages and inject a system note
    if (i > 0 && m.timestamp) {
      const prev = recentSlice[i - 1];
      if (prev.timestamp) {
        const gapMs = m.timestamp.getTime() - prev.timestamp.getTime();
        const gapHours = gapMs / (1000 * 60 * 60);
        if (gapHours >= 2) {
          const gapText = gapHours >= 24
            ? `${Math.round(gapHours / 24)} día(s)`
            : `${Math.round(gapHours)} hora(s)`;
          history.push({
            role: 'assistant',
            content: `[Han pasado ${gapText} desde el último mensaje. Si el usuario saluda o cambia de tema, trátalo como una conversación nueva.]`
          });
        }
      }
    }
    history.push({
      role: m.role as 'user' | 'assistant',
      content: m.content
    });
  }

  history.push({ role: 'user', content: message });

  console.log('=== HISTORY ===');
  console.log(JSON.stringify(history, null, 2));

  // Build tenant context for multi-agent analysis
  const tenantCtx = buildTenantAnalysisContext(agentConfig);
  const agentName = tenantCtx.agentName;

  // ============================================
  // STEP 0: Get Few-Shot Context (ejemplos relevantes)
  // ============================================
  // Use tenant's custom few-shot examples if available
  // For custom prompt tenants (systemPrompt set), don't inject Loomi's default examples
  let fewShotContext = '';
  if (agentConfig?.fewShotExamples?.length) {
    fewShotContext = getFewShotContextFromTenant(message, history, agentConfig.fewShotExamples);
  } else if (!agentConfig?.systemPrompt) {
    fewShotContext = await getFewShotContext(message, history);
  }
  if (fewShotContext) {
    console.log('=== FEW-SHOT CONTEXT ADDED ===');
  }

  // ============================================
  // STEP 1: Multi-Agent Analysis (all tenants go through full pipeline)
  // ============================================
  const skipAnalysis = isSimpleMessage(message, history.length);
  const analysisEnabled = agentConfig?.analysisEnabled !== false && !skipAnalysis;
  let sellerAnalysis: Awaited<ReturnType<typeof getSellerStrategy>>['analysis'] | null = null;
  let sellerInstructions: string = '';
  let reasoning: Awaited<ReturnType<typeof generateReasoningFast>> | null = null;

  if (skipAnalysis) {
    console.log('=== SIMPLE MESSAGE - SKIPPING MULTI-AGENT ===');
  } else if (!analysisEnabled) {
    console.log('=== MULTI-AGENT DISABLED (tenant config) ===');
    reasoning = await generateReasoningFast(message, context);
  } else {
    console.log('=== FULL ANALYSIS PATH ===');

    const strategyResult = await getSellerStrategy(message, history, {
      name: context.lead.name,
      company: context.lead.company,
      industry: context.lead.industry,
      previousInteractions: context.recentMessages.length,
    }, tenantCtx).catch((err: Error) => {
      console.error('[Multi-Agent] Analysis failed, continuing without:', err.message);
      return null;
    });

    if (strategyResult) {
      sellerAnalysis = strategyResult.analysis;
      sellerInstructions = strategyResult.instructions;

      console.log('=== ANÁLISIS (claude-haiku) ===');
      console.log(`Fase: ${sellerAnalysis.fase_actual}`);
      console.log(`Siguiente paso: ${sellerAnalysis.siguiente_paso}`);
      if (sellerAnalysis.hay_objecion) {
        console.log(`Objeción detectada: ${sellerAnalysis.tipo_objecion}`);
      }
    } else {
      console.log('=== ANÁLISIS SKIPPED (error fallback) ===');
      // Fallback to reasoning only if multi-agent failed
      reasoning = await generateReasoningFast(message, context);
    }
  }

  if (reasoning) {
    console.log('=== REASONING ===');
    console.log(reasoning.analysis);
  }

  // ============================================
  // STEP 2: Detect industry for personalization
  // ============================================
  const rawIndustry = sellerAnalysis?.industria_detectada
    || reasoning?.industry
    || detectIndustry(message, context.lead.industry);
  // Multi-agent returns free string; only use industry prompt section if it matches a known template
  const industry: Industry = (rawIndustry in INDUSTRY_CONTEXTS)
    ? rawIndustry as Industry
    : 'generic';
  const industrySection = getIndustryPromptSection(industry);

  // ============================================
  // STEP 3: Get sentiment instruction
  // ============================================
  const sentimentInstruction = sellerAnalysis?.tono_recomendado
    || (reasoning ? getSentimentInstruction(reasoning.sentiment) : '');

  // Helper to check if text contains any keyword from a Set
  const containsAny = (text: string, keywords: Set<string>): boolean => {
    for (const keyword of keywords) {
      if (text.includes(keyword)) return true;
    }
    return false;
  };

  const currentMsg = message.toLowerCase();
  let saidLater = containsAny(currentMsg, LATER_KEYWORDS);

  // Handoff detection is now handled at webhook level (detectHandoffTrigger with context).
  // Simple-agent only needs to know the conversation state for prompt assembly.
  const state = 'conversacion_activa';

  // ============================================
  // STEP 3.5: Progress tracking (anti-loop)
  // ============================================
  const progress = analyzeProgress({
    history,
    currentMessage: message,
    turnCount: history.length,
  });

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

  // Use tenant's custom system prompt, or build dynamic identity from config, or fall back to default
  const basePrompt = agentConfig?.systemPrompt
    || (agentConfig?.businessName ? buildDynamicIdentity(agentConfig) : null)
    || DEFAULT_SYSTEM_PROMPT;
  let systemWithContext = basePrompt;

  // Add industry-specific context (for all tenants)
  if (industrySection) {
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

  // Add multi-agent seller strategy
  if (sellerInstructions) {
    systemWithContext += `\n\n${sellerInstructions}`;
  }

  // Add reasoning analysis only if multi-agent failed (avoid duplicate analysis)
  if (!sellerInstructions && reasoning) {
    systemWithContext += `\n\n# ANÁLISIS ADICIONAL\n${formatReasoningForPrompt(reasoning)}`;
  }

  // Add progress tracking alert (anti-loop, high recency attention)
  if (progress.progressInstruction) {
    systemWithContext += `\n\n# ALERTA DE PROGRESO\n${progress.progressInstruction}`;
  }
  if (progress.pivotInstruction) {
    systemWithContext += `\n${progress.pivotInstruction}`;
  }

  // Add sentiment instruction only if multi-agent failed (it includes tono_recomendado)
  if (!sellerInstructions && sentimentInstruction) {
    systemWithContext += `\n\n# INSTRUCCIÓN DE TONO\n${sentimentInstruction}`;
  }

  systemWithContext += `\n\n# ESTADO ACTUAL: ${state.toUpperCase()}`;

  systemWithContext += `\nSigue el análisis multi-agente de arriba.
Sé directo, conversacional, mensajes cortos (2-3 líneas max).
UNA pregunta a la vez.`;

  systemWithContext += `\n\n# REGLAS INQUEBRANTABLES
1. Máximo 2 oraciones + 1 pregunta (3 oraciones total)
2. UNA sola pregunta por mensaje
3. Si ya preguntaste algo y no respondieron, NO lo repitas — cambia de enfoque
4. Si prometes algo (horarios, info), USA la herramienta correspondiente
5. NUNCA te identifiques como Loomi/Lu si tienes otro nombre configurado
6. Si quieren demo/reunión, usa schedule_demo. Si quieren comprar, pide email y usa send_payment_link
7. NUNCA menciones productos o servicios que no estén en tu prompt`;

  // Get client info
  const clientName = context.lead.name || 'Cliente';
  const clientPhone = context.lead.phone || '';

  // Define tools
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

        // Determine priority based on reason
        let handoffReason: HandoffContext['reason'] = 'custom';
        let priority: HandoffContext['priority'] = 'normal';

        if (reason.toLowerCase().includes('frustrad')) {
          handoffReason = 'user_frustrated';
          priority = 'critical';
        } else if (reason.toLowerCase().includes('enterprise') || reason.toLowerCase().includes('alto valor')) {
          handoffReason = 'enterprise_lead';
          priority = 'urgent';
        } else if (reason.toLowerCase().includes('pide') || reason.toLowerCase().includes('solicit')) {
          handoffReason = 'user_requested';
          priority = 'urgent';
        } else if (reason.toLowerCase().includes('técnic') || reason.toLowerCase().includes('complej')) {
          handoffReason = 'complex_question';
          priority = 'normal';
        }

        const recentMsgs = history.slice(-5).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }));

        const result = await executeHandoff({
          phone: clientPhone,
          name: clientName,
          recentMessages: recentMsgs,
          reason: handoffReason,
          priority,
          customReason: summary
        });

        return {
          success: result.notifiedOperator,
          message: result.notifiedOperator
            ? 'Listo, ya le avisé al equipo. Te escriben en los próximos minutos.'
            : 'No pude contactar al equipo en este momento. ¿Hay algo que pueda ayudarte mientras tanto?'
        };
      }
    }),

    schedule_demo: tool({
      description: `Muestra horarios disponibles para agendar una reunión o demo. Usa SOLO para mostrar horarios inicialmente. Cuando el cliente ya eligió horario y dio nombre+email, usa book_demo en su lugar.`,
      inputSchema: zodSchema(z.object({
        reason: z.string().optional().describe('Breve nota del contexto o interés del cliente')
      })),
      execute: async (params) => {
        const { reason } = params as { reason?: string };
        console.log(`[Tool] Triggering schedule list. Reason: ${reason || 'Cliente interesado en demo'}`);

        // This triggers the interactive schedule list in WhatsApp
        // The actual slot selection is handled by the webhook
        return {
          success: true,
          triggerScheduleList: true,
          message: '¡Genial! Te muestro los horarios disponibles.',
          reason: reason || 'Lead interesado en demo'
        };
      }
    }),

    book_demo: tool({
      description: 'Confirma y agenda una demo en el calendario. Usa DESPUÉS de que el cliente eligió un horario Y dio su nombre y email. Necesitas: fecha (YYYY-MM-DD), hora (HH:MM), nombre y email.',
      inputSchema: zodSchema(z.object({
        date: z.string().describe('Fecha elegida en formato YYYY-MM-DD, ej: 2026-02-09'),
        time: z.string().describe('Hora elegida en formato HH:MM, ej: 09:00'),
        name: z.string().describe('Nombre del cliente'),
        email: z.string().describe('Email del cliente'),
      })),
      execute: async (params) => {
        const { date, time, name, email } = params as { date: string; time: string; name: string; email: string };
        console.log(`[Tool] Booking demo for ${name} (${email}) on ${date} at ${time}`);
        try {
          const result = await createEvent({
            date,
            time,
            name,
            email,
            phone: clientPhone,
          });
          if (result.success) {
            console.log(`[Tool] Demo booked! Event ID: ${result.eventId}`);
            return {
              success: true,
              message: `Demo agendada para ${name} el ${date} a las ${time}. Te enviaremos un enlace de confirmación a ${email}.`,
              meetingUrl: result.meetingUrl,
            };
          }
          return { success: false, message: 'No se pudo agendar la demo. Intenta con otro horario.' };
        } catch (error) {
          console.error('[Tool] Book demo error:', error);
          return { success: false, message: 'Error al agendar. Intenta de nuevo.' };
        }
      }
    }),

    send_payment_link: tool({
      description: 'Envía un link de pago de Stripe al cliente por WhatsApp. Usa cuando el cliente confirmó que quiere comprar y ya dio su email.',
      inputSchema: zodSchema(z.object({
        email: z.string().describe('Email del cliente'),
        productName: z.string().describe('Nombre del producto o servicio'),
      })),
      execute: async (params) => {
        const { email, productName } = params as { email: string; productName: string };
        const tenantId = agentConfig?.tenantId;

        console.log(`[Tool] send_payment_link for ${email}, product: ${productName}, tenant: ${tenantId}`);
        try {
          // 1. Check for fixed payment link in products catalog
          const catalog = agentConfig?.productsCatalog as Record<string, unknown> | undefined;
          const fixedLink = catalog?.paymentLink as string | undefined;

          if (fixedLink) {
            console.log(`[Tool] Using fixed payment link: ${fixedLink}`);
            const sent = await sendPaymentLink(clientPhone, fixedLink, productName);
            return {
              success: sent,
              checkoutUrl: fixedLink,
              message: sent
                ? 'Link de pago enviado exitosamente por WhatsApp.'
                : 'No se pudo enviar el link de pago.',
            };
          }

          // 2. Tenant with Stripe credentials: create dynamic checkout
          if (tenantId) {
            const { createTenantCheckoutSession } = await import('@/lib/stripe/checkout');
            const { shortUrl } = await createTenantCheckoutSession({
              tenantId,
              email,
              phone: clientPhone,
              amount: 27500, // default $275
              productName,
            });
            const sent = await sendPaymentLink(clientPhone, shortUrl, productName);
            return {
              success: sent,
              checkoutUrl: shortUrl,
              message: sent
                ? 'Link de pago enviado exitosamente por WhatsApp.'
                : 'No se pudo enviar el link de pago.',
            };
          }

          // 3. Loomi default
          const { url } = await createCheckoutSession({ email, phone: clientPhone, plan: 'starter' });
          const sent = await sendPaymentLink(clientPhone, url, productName);
          return {
            success: sent,
            checkoutUrl: url,
            message: sent ? 'Link de pago enviado.' : 'No se pudo enviar el link de pago.',
          };
        } catch (error) {
          console.error('[Tool] Payment link error:', error);
          return { success: false, message: 'Error al crear el link de pago.' };
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
  let showScheduleList = false;
  let toolCallsLog: string[] = [];

  // Note: Automatic handoff is now handled at webhook level (detectHandoffTrigger with context)
  // before the agent is even called. This prevents false positives like "no funciona"
  // when describing their situation.

  try {
    const result = await generateText({
      model: resolveModel(agentConfig?.model),
      system: systemWithContext,
      messages: history,
      tools,
      temperature: agentConfig?.temperature ?? 0.7,
      maxOutputTokens: agentConfig?.maxResponseTokens ?? 250,
      stopWhen: stepCountIs(3),
      onStepFinish: async (step) => {
        console.log(`[Agent] Step finished: toolCalls=${step.toolCalls?.length || 0}, text=${step.text?.substring(0, 50) || '(empty)'}, finishReason=${step.finishReason}`);
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
                const args = toolCall.input as { email: string; amount: number; productName: string };
                paymentLinkSent = {
                  plan: `${args.productName} - $${args.amount / 100}`,
                  email: args.email,
                  checkoutUrl: output.checkoutUrl || ''
                };
                console.log(`[Tool] Payment link sent: $${args.amount / 100} to ${args.email}`);
              }
            }

            // Track schedule_demo - trigger interactive schedule list
            if (toolResult.toolName === 'schedule_demo') {
              const scheduleOutput = toolResult.output as { triggerScheduleList?: boolean };
              if (scheduleOutput?.triggerScheduleList) {
                showScheduleList = true;
                console.log('[Tool] Schedule demo triggered - will show interactive slot list');
              }
            }
          }
        }
      }
    });

    console.log(`[Agent] generateText done: steps=${result.steps?.length || 0}, text="${result.text?.substring(0, 80) || '(empty)'}", finishReason=${result.finishReason}`);

    let response = result.text.trim();
    response = response.replace(/\*+/g, '');
    response = response.replace(/^(Víctor|Victor):\s*/i, '');

    // If model called tools but didn't generate text, use tool result message
    // Check both toolResults (old API) and steps (new API)
    const toolResults = result.toolResults ||
      (result.steps?.flatMap((s: { toolResults?: unknown[] }) => s.toolResults || [])) || [];

    console.log('[Debug] response:', response);
    console.log('[Debug] toolResults count:', toolResults.length);

    if (!response && toolResults.length > 0) {
      for (const toolResult of toolResults) {
        const tr = toolResult as {
          toolName?: string;
          result?: { success?: boolean; message?: string; bookingLink?: string };
          output?: { success?: boolean; message?: string; bookingLink?: string; checkoutUrl?: string };
        };
        console.log('[Debug] toolResult:', JSON.stringify(tr));
        // Handle both 'result' and 'output' property names (API versions differ)
        const output = tr.output || tr.result;
        if (output?.message) {
          response = output.message;
          break;
        }
        // Fallback for schedule_demo
        if (tr.toolName === 'schedule_demo' && output?.bookingLink) {
          response = `¡Listo! Agenda tu demo aquí: ${output.bookingLink}`;
          break;
        }
      }
    }

    // Final fallback
    if (!response) {
      response = '¿En qué más te puedo ayudar?';
    }

    // Phase 3B: Response guard (length enforcement)
    const guarded = guardResponse(response, 3);
    response = guarded.response;
    if (guarded.wasGuarded) {
      console.log(`[Agent] Response guarded: ${guarded.reason}`);
    }

    // Phase 5A: Promise-action validation
    // If agent promised to show schedules but didn't call schedule_demo, trigger the list
    const PROMISE_PATTERNS = [
      { pattern: /te muestro.*horarios|horarios.*disponibles|déjame.*horarios/i, tool: 'schedule_demo' },
    ];
    if (!showScheduleList) {
      const toolsCalled = new Set(
        (result.steps?.flatMap((s: { toolCalls?: Array<{ toolName: string }> }) =>
          s.toolCalls?.map(tc => tc.toolName) || []) || [])
      );
      for (const { pattern, tool } of PROMISE_PATTERNS) {
        if (pattern.test(response) && !toolsCalled.has(tool)) {
          showScheduleList = true;
          console.log(`[Agent] Promise validation: response promises "${tool}" but didn't call it. Triggering schedule list.`);
          break;
        }
      }
    }

    console.log('=== RESPONSE ===');
    console.log(response);

    return {
      response,
      tokensUsed: result.usage?.totalTokens,
      escalatedToHuman,
      paymentLinkSent,
      detectedIndustry: rawIndustry !== 'generic' ? rawIndustry : undefined,
      saidLater,
      showScheduleList
    };

  } catch (error) {
    console.error('Agent error:', error);

    // Automatic handoff on error using new system
    try {
      const recentMsgs = history.slice(-5).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      const result = await executeHandoff({
        phone: clientPhone,
        name: clientName,
        recentMessages: recentMsgs,
        reason: 'agent_error',
        priority: 'critical',
        errorMessage
      });

      if (result.notifiedOperator) {
        console.log('[Agent] Auto-escalated due to error');
        return {
          response: '', // Client already notified by handoff system
          escalatedToHuman: { reason: 'agent_error', summary: errorMessage }
        };
      }
    } catch (handoffError) {
      console.error('[Agent] Handoff also failed:', handoffError instanceof Error ? handoffError.message : handoffError);
    }

    // Fallback if escalation also fails
    return {
      response: 'Perdón, tuve un problema técnico. ¿Me repites?'
    };
  }
}
