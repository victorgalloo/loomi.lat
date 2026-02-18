/**
 * LangGraph Nodes — Simplified (v2)
 *
 * 2 nodes: generate, persist
 *
 * generate: Single LLM call that handles analysis + routing + response + tools.
 * persist: Save conversation state to Supabase.
 *
 * What was removed:
 * - analyzeNode (sentiment/industry detection via separate LLM call)
 * - routeNode (280+ lines of keyword matching)
 * - summarizeNode (separate summarization LLM call)
 * All of this is now handled by the main LLM in a single invocation.
 */

import { ChatAnthropic } from '@langchain/anthropic';
import { tool as langchainTool, type StructuredToolInterface } from '@langchain/core/tools';
import { HumanMessage, SystemMessage, AIMessage, ToolMessage, type BaseMessage } from '@langchain/core/messages';
import type { RunnableConfig } from '@langchain/core/runnables';
import { z } from 'zod';
import { checkAvailability, createEvent, CalTenantConfig } from '@/lib/tools/calendar';
import { getCalConfig } from '@/lib/integrations/tenant-integrations';
import { sendWhatsAppLink, escalateToHuman } from '@/lib/whatsapp/send';
import { SimpleAgentResult, SalesPhase } from './state';
import { buildSystemPrompt } from './prompts';
import { syncSummaryToLeadMemory } from './memory';
import { guardResponse } from '@/lib/agents/response-guard';
import { GraphStateType, PersistedConversationState } from './state';

// Re-export from shared utility
import { extractTextContent } from '@/lib/langchain/utils';

// ============================================
// Model helpers
// ============================================

const OPENAI_TO_CLAUDE: Record<string, string> = {
  'gpt-4o-mini': 'claude-haiku-4-5-20251001',
  'gpt-4o': 'claude-sonnet-4-5-20250929',
  'gpt-5.2-chat-latest': 'claude-sonnet-4-5-20250929',
};

function resolveChatModel(modelOverride?: string | null): string {
  if (!modelOverride) return 'claude-sonnet-4-5-20250929';
  if (modelOverride.startsWith('claude-')) return modelOverride;
  return OPENAI_TO_CLAUDE[modelOverride] ?? 'claude-sonnet-4-5-20250929';
}

function getNextBusinessDays(count: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  let daysAdded = 0;
  let currentDate = new Date(today);
  while (daysAdded < count) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(currentDate.toISOString().split('T')[0]);
      daysAdded++;
    }
  }
  return dates;
}

// ============================================
// Phase inference from LLM structured output
// ============================================

function inferPhaseFromResponse(
  response: string,
  toolsCalled: Set<string>,
  prevPhase: SalesPhase
): SalesPhase {
  const lower = response.toLowerCase();

  if (toolsCalled.has('book_appointment')) return 'closed';
  if (toolsCalled.has('check_availability') || /horario|disponib|agenda/.test(lower)) return 'scheduling';
  if (/demo|te muestro|20 min|llamada/.test(lower)) return 'demo_proposed';
  if (/qué tipo|a qué te dedicas|cuántos mensajes|volumen/.test(lower)) return 'qualification';
  if (prevPhase === 'closed') return 'closed';

  return prevPhase;
}

// ============================================
// NODE 1: generateNode (main — single LLM call)
// ============================================

export async function generateNode(state: GraphStateType, config?: RunnableConfig): Promise<Partial<GraphStateType>> {
  const { context, conversationState, message, history, agentConfig } = state;

  // Resolve Cal.com config
  let calConfig: CalTenantConfig | undefined;
  if (agentConfig?.tenantId) {
    const cfg = await getCalConfig(agentConfig.tenantId);
    if (cfg) calConfig = { apiKey: cfg.accessToken, eventTypeId: cfg.eventTypeId, tenantId: agentConfig.tenantId };
  }

  // Build system prompt (simplified — no more separate analysis sections)
  const systemPrompt = await buildSystemPrompt({
    message,
    context,
    history,
    conversationState,
    agentConfig,
  });

  // Client info for tools
  const clientName = context.lead.name || 'Cliente';
  const clientPhone = context.lead.phone || '';

  // Track tool results via closures
  let appointmentBooked: SimpleAgentResult['appointmentBooked'] = undefined;
  let brochureSent = false;
  let escalatedToHumanResult: SimpleAgentResult['escalatedToHuman'] = undefined;
  let paymentLinkSent: SimpleAgentResult['paymentLinkSent'] = undefined;
  let toolResponseMessage = '';
  let showScheduleList = false;

  // ============================================
  // Define tools (same as before — these work well)
  // ============================================

  const checkAvailabilityTool = langchainTool(
    async ({ date }: { date: string }) => {
      console.log(`[Tool] Checking availability for: ${date}`);
      let dateToCheck = date;
      if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const nextDays = getNextBusinessDays(3);
        dateToCheck = nextDays.join(',');
      }
      const slots = await checkAvailability(dateToCheck, calConfig);
      if (slots.length === 0) {
        return JSON.stringify({ available: false, message: 'No hay horarios disponibles para esa fecha.' });
      }
      const grouped: Record<string, string[]> = {};
      for (const slot of slots) {
        if (!grouped[slot.date]) grouped[slot.date] = [];
        grouped[slot.date].push(slot.time);
      }
      const readable = Object.entries(grouped).map(([d, times]) => {
        const dateObj = new Date(d + 'T12:00:00');
        const dayName = dateObj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
        return `${dayName}: ${times.slice(0, 4).join(', ')}`;
      }).join(' | ');
      return JSON.stringify({ available: true, slots: readable, rawSlots: slots.slice(0, 8) });
    },
    {
      name: 'check_availability',
      description: 'Verifica disponibilidad en el calendario para una fecha específica. Usa formato YYYY-MM-DD.',
      schema: z.object({
        date: z.string().describe('Fecha en formato YYYY-MM-DD. Si no se especifica, usa los próximos días hábiles.'),
      }),
    }
  );

  const bookAppointmentTool = langchainTool(
    async ({ date, time, email }: { date: string; time: string; email: string }) => {
      console.log(`[Tool] Booking appointment: ${date} ${time} for ${email}`);
      const result = await createEvent({ date, time, name: clientName, phone: clientPhone, email }, calConfig);
      if (result.success) {
        if (result.meetingUrl && clientPhone) {
          const { sendWhatsAppMessage } = await import('@/lib/whatsapp/send');
          await sendWhatsAppMessage(
            clientPhone,
            `Aquí está el link para nuestra llamada:\n${result.meetingUrl}\n\nTe llegará también la invitación a tu correo.`
          );
        }
        appointmentBooked = { eventId: result.eventId || '', date, time, email, meetingUrl: result.meetingUrl };
        return JSON.stringify({
          success: true,
          eventId: result.eventId,
          meetingUrl: result.meetingUrl,
          message: `Cita agendada para ${date} a las ${time}. Invitación enviada a ${email}.`,
        });
      }
      return JSON.stringify({ success: false, message: 'No se pudo agendar. El horario puede no estar disponible.' });
    },
    {
      name: 'book_appointment',
      description: 'Agenda una cita. Requiere fecha (YYYY-MM-DD), hora (HH:MM), y email del cliente.',
      schema: z.object({
        date: z.string().describe('Fecha YYYY-MM-DD'),
        time: z.string().describe('Hora HH:MM (24h)'),
        email: z.string().describe('Email del cliente'),
      }),
    }
  );

  const sendBrochureTool = langchainTool(
    async ({ reason }: { reason: string }) => {
      console.log(`[Tool] Sending brochure: ${reason}`);
      const brochureUrl = process.env.BROCHURE_URL || 'https://anthana.com/info';
      const sent = await sendWhatsAppLink(
        clientPhone,
        brochureUrl,
        '📄 Aquí tienes más información sobre nuestros agentes de IA para WhatsApp:'
      );
      if (sent) brochureSent = true;
      return JSON.stringify({
        success: sent,
        message: sent ? 'Brochure enviado. Pregunta si tiene dudas.' : 'No se pudo enviar.',
      });
    },
    {
      name: 'send_brochure',
      description: 'Envía información detallada del servicio. Usa cuando pidan más info o ejemplos.',
      schema: z.object({
        reason: z.string().describe('Motivo por el que se envía'),
      }),
    }
  );

  const escalateToHumanTool = langchainTool(
    async ({ reason, summary }: { reason: string; summary: string }) => {
      console.log(`[Tool] Escalating to human: ${reason}`);
      const escalated = await escalateToHuman({
        clientPhone, clientName, reason, conversationSummary: summary,
      });
      if (escalated) escalatedToHumanResult = { reason, summary };
      return JSON.stringify({
        success: escalated,
        message: escalated ? 'Escalado. El cliente será contactado pronto.' : 'No se pudo escalar.',
      });
    },
    {
      name: 'escalate_to_human',
      description: 'Transfiere a un humano. SOLO cuando el cliente dice LITERALMENTE "quiero hablar con un humano". NUNCA para objeciones o dudas.',
      schema: z.object({
        reason: z.string().describe('Motivo de la escalación'),
        summary: z.string().describe('Resumen de la conversación'),
      }),
    }
  );

  const sendPaymentLinkTool = langchainTool(
    async ({ email, productName }: { email: string; productName: string }) => {
      const tenantId = agentConfig?.tenantId;
      console.log(`[Tool] send_payment_link for ${email}, product: ${productName}`);
      try {
        const { sendPaymentLink } = await import('@/lib/whatsapp/send');
        const waCreds = agentConfig?.whatsappCredentials;
        const catalog = agentConfig?.productsCatalog as Record<string, unknown> | undefined;
        const fixedLink = catalog?.paymentLink as string | undefined;

        if (fixedLink) {
          const sent = await sendPaymentLink(clientPhone, fixedLink, productName, waCreds);
          toolResponseMessage = 'Listo, te mandé el link de pago por aquí. Cualquier duda me dices.';
          return JSON.stringify({ success: true, checkoutUrl: fixedLink, message: sent ? 'Link enviado.' : `Link: ${fixedLink}` });
        }

        if (tenantId) {
          const { createTenantCheckoutSession } = await import('@/lib/stripe/checkout');
          const { shortUrl } = await createTenantCheckoutSession({
            tenantId, email, phone: clientPhone, amount: 27500, productName,
          });
          const sent = await sendPaymentLink(clientPhone, shortUrl, productName, waCreds);
          toolResponseMessage = 'Listo, te mandé el link de pago por aquí. Cualquier duda me dices.';
          return JSON.stringify({ success: true, checkoutUrl: shortUrl, message: sent ? 'Link enviado.' : `Link: ${shortUrl}` });
        }

        return JSON.stringify({ success: false, message: 'No se pudo identificar el tenant.' });
      } catch (error) {
        console.error('[Tool] Payment link error:', error);
        return JSON.stringify({ success: false, message: 'Error al crear el link.' });
      }
    },
    {
      name: 'send_payment_link',
      description: 'Envía link de pago Stripe por WhatsApp. Usa cuando el cliente confirmó compra y dio email.',
      schema: z.object({
        email: z.string().describe('Email del cliente'),
        productName: z.string().describe('Nombre del producto'),
      }),
    }
  );

  // Collect all tools
  const allTools: StructuredToolInterface[] = [
    checkAvailabilityTool, bookAppointmentTool, sendBrochureTool,
    escalateToHumanTool, sendPaymentLinkTool,
  ];

  // Add custom tools from tenant config
  if (agentConfig?.customTools && agentConfig.customTools.length > 0) {
    for (const customTool of agentConfig.customTools) {
      allTools.push(langchainTool(
        async () => {
          console.log(`[Tool] Custom tool: ${customTool.name}`);
          return JSON.stringify(customTool.mockResponse || { success: true, message: `${customTool.displayName} executed` });
        },
        { name: customTool.name, description: customTool.description, schema: z.object({}) }
      ));
    }
  }

  try {
    const model = new ChatAnthropic({
      model: resolveChatModel(agentConfig?.model),
      maxTokens: agentConfig?.maxResponseTokens || 250,
      temperature: agentConfig?.temperature,
    }).bindTools(allTools);

    const lcMessages: BaseMessage[] = [
      new SystemMessage(systemPrompt),
      ...history.map(m => m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)),
    ];

    const MAX_TOOL_ROUNDS = 3;
    let responseText = '';
    let totalTokens = 0;
    const toolsCalled = new Set<string>();

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const aiResponse = await model.invoke(lcMessages, config);
      totalTokens += aiResponse.usage_metadata?.total_tokens || 0;

      const hasToolCalls = aiResponse.tool_calls && aiResponse.tool_calls.length > 0;

      if (!hasToolCalls || round === MAX_TOOL_ROUNDS) {
        responseText = extractTextContent(aiResponse.content);
        break;
      }

      lcMessages.push(aiResponse);
      for (const tc of aiResponse.tool_calls!) {
        toolsCalled.add(tc.name);
        const toolObj = allTools.find(t => t.name === tc.name);
        const result = toolObj
          ? await toolObj.invoke(tc.args)
          : JSON.stringify({ error: 'Tool not found' });
        lcMessages.push(new ToolMessage({
          content: typeof result === 'string' ? result : JSON.stringify(result),
          tool_call_id: tc.id || `tc_${round}`,
        }));
      }
    }

    let response = responseText.trim();
    response = response.replace(/\*+/g, '');
    response = response.replace(/^(Víctor|Victor):\s*/i, '');

    // Closure fallback
    if (!response && toolResponseMessage) {
      response = toolResponseMessage;
    }
    if (!response) {
      response = '¿En qué más te puedo ayudar?';
    }

    // Response guard (length enforcement)
    const guarded = guardResponse(response, 3);
    response = guarded.response;
    if (guarded.wasGuarded) {
      console.log(`[Generate] Response guarded: ${guarded.reason}`);
    }

    // Promise-action validation
    const PROMISE_PATTERNS = [
      { pattern: /te muestro.*horarios|horarios.*disponibles|déjame.*horarios/i, tool: 'schedule_demo' },
    ];
    for (const { pattern, tool: toolName } of PROMISE_PATTERNS) {
      if (pattern.test(response) && !toolsCalled.has(toolName)) {
        showScheduleList = true;
        break;
      }
    }

    console.log(`=== RESPONSE (${totalTokens} tokens) ===\n${response}`);

    // Infer phase from response + tools called
    const updatedState = { ...state.conversationState };
    updatedState.phase = inferPhaseFromResponse(response, toolsCalled, updatedState.phase);

    // Track products offered
    if (brochureSent && !updatedState.products_offered.includes('brochure')) {
      updatedState.products_offered = [...updatedState.products_offered, 'brochure'];
    }

    // Auto-summarize every 5 turns (inline, no separate LLM call — just accumulate context)
    if (updatedState.turn_count >= 5 && updatedState.turn_count - updatedState.last_summary_turn >= 5) {
      // Build a lightweight summary from accumulated lead_info
      const li = updatedState.lead_info;
      const summaryParts: string[] = [];
      if (li.business_type) summaryParts.push(`Negocio: ${li.business_type}`);
      if (li.volume) summaryParts.push(`Volumen: ${li.volume}`);
      if (li.pain_points.length > 0) summaryParts.push(`Dolores: ${li.pain_points.join(', ')}`);
      if (li.current_solution) summaryParts.push(`Solución actual: ${li.current_solution}`);
      summaryParts.push(`Fase: ${updatedState.phase}`);
      summaryParts.push(`Turno: ${updatedState.turn_count}`);

      const newSummary = summaryParts.join('. ');
      updatedState.summary = newSummary;
      updatedState.last_summary_turn = updatedState.turn_count;
      await syncSummaryToLeadMemory(context.lead.id, newSummary);
    }

    return {
      result: {
        response,
        tokensUsed: totalTokens || undefined,
        appointmentBooked,
        brochureSent: brochureSent || undefined,
        paymentLinkSent,
        escalatedToHuman: escalatedToHumanResult,
        showScheduleList: showScheduleList || undefined,
        saidLater: /luego|después|despues|ahorita no|al rato|otro día/i.test(message) || undefined,
      },
      conversationState: updatedState,
    };

  } catch (error) {
    console.error('Generate error:', error);
    return {
      result: { response: 'Perdón, tuve un problema. ¿Me repites?' },
    };
  }
}

// ============================================
// NODE 2: persistNode (unchanged)
// ============================================

export async function persistNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const { saveConversationState } = await import('./memory');
  await saveConversationState(state.context.conversation.id, state.conversationState);
  return {};
}
