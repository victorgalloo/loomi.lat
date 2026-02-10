/**
 * LangGraph Nodes
 * 5 nodes: analyze, route, summarize, generate, persist
 */

import { generateText } from 'ai';
import { tool, zodSchema } from '@ai-sdk/provider-utils';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { generateReasoningFast } from '@/lib/agents/reasoning';
import { checkAvailability, createEvent } from '@/lib/tools/calendar';
import { sendWhatsAppLink, escalateToHuman } from '@/lib/whatsapp/send';
import { createKnowledgeTools } from '@/lib/knowledge';
import { SimpleAgentResult } from '@/lib/agents/simple-agent';
import { buildSystemPrompt } from './prompts';
import { syncSummaryToLeadMemory } from './memory';
import {
  GraphStateType,
  SalesPhase,
  TopicCategory,
  PersistedConversationState,
  ObjectionEntry,
} from './state';

// ============================================
// Keyword Sets (migrated from simple-agent.ts)
// ============================================

const BUSINESS_KEYWORDS = new Set([
  'tienda', 'negocio', 'vendo', 'empresa', 'servicios', 'consultorio',
  'restaurante', 'clínica', 'agencia', 'tengo un', 'tengo una', 'trabajo en'
]);

const PAIN_KEYWORDS = new Set([
  'no doy abasto', 'pierdo cliente', 'no alcanzo', 'muy ocupado',
  'no puedo contestar', 'se me van', 'pierdo venta', 'no tengo tiempo'
]);

const REFERRAL_KEYWORDS = new Set(['me recomend', 'me dij', 'referido']);

const DEMO_ACCEPT_KEYWORDS = new Set([
  'sí', 'si', 'dale', 'me interesa', 'claro', 'perfecto', 'ok',
  'va', 'sale', 'órale', 'bueno'
]);

const DEMO_PROPOSE_KEYWORDS = new Set(['quieres ver', 'te muestro', 'demo', '¿lo vemos']);

const SCHEDULE_KEYWORDS = new Set([
  'quiero agendar', 'agendemos', 'agenda', 'agendar demo', 'agendar llamada',
  'agendar cita', 'quiero una demo', 'me interesa la demo', 'cuando podemos',
  'cuándo podemos', 'programar', 'reservar'
]);

const LATER_KEYWORDS = new Set([
  'luego', 'después', 'despues', 'ahorita no', 'al rato', 'otro día'
]);

const HORARIO_KEYWORDS = new Set([
  'martes', 'miércoles', 'jueves', '10am', '3pm', '11am'
]);

const VOLUME_PATTERN = /\d+/;
const TIME_PATTERN = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
const EMAIL_PATTERN = /@.*\./;

// Topic detection keyword sets
const TOPIC_KEYWORDS: Record<TopicCategory, Set<string>> = {
  precio: new Set(['precio', 'costo', 'cuánto', 'cuanto', 'inversión', 'pago', 'cobran', 'tarifa', 'plan', 'mensualidad', '$', 'dólares', 'dolares', 'usd']),
  funcionalidad: new Set(['funciona', 'hace', 'puede', 'característica', 'feature', 'incluye', 'hace el bot', 'capacidad', 'qué hace']),
  integraciones: new Set(['integra', 'conecta', 'crm', 'hubspot', 'zapier', 'api', 'shopify', 'woocommerce', 'sistema']),
  competencia: new Set(['ya tengo', 'ya uso', 'otro', 'chatbot', 'manychat', 'respond.io', 'comparable', 'diferencia', 'vs']),
  demo: new Set(['demo', 'agendar', 'llamada', 'mostrar', 'ver', 'reunión', 'cita']),
  implementacion: new Set(['implementar', 'configurar', 'instalar', 'cuánto tarda', 'setup', 'tiempo', 'proceso']),
  caso_de_uso: new Set(['mi negocio', 'mi empresa', 'para nosotros', 'sector', 'industria', 'ejemplo', 'caso']),
  objecion: new Set(['caro', 'no creo', 'no funciona', 'después', 'luego', 'no sé', 'consultarlo', 'pensarlo']),
  general: new Set([]),
};

// Objection category detection
const OBJECTION_CATEGORIES: Record<string, Set<string>> = {
  precio: new Set(['caro', 'costoso', 'precio', 'costo', 'inversión', 'mucho dinero']),
  tiempo: new Set(['no tengo tiempo', 'muy ocupado', 'después', 'luego', 'ahorita no']),
  competencia: new Set(['ya tengo', 'ya uso', 'otro chatbot', 'otro sistema']),
  desconfianza: new Set(['no creo', 'no funciona', 'no estoy seguro', 'no sé si']),
  autoridad: new Set(['consultar', 'mi jefe', 'mi socio', 'decisión']),
  necesidad: new Set(['no necesito', 'no me interesa', 'no gracias', 'estamos bien']),
};

function containsAny(text: string, keywords: Set<string>): boolean {
  for (const keyword of keywords) {
    if (text.includes(keyword)) return true;
  }
  return false;
}

// ============================================
// NODE 1: analyzeNode
// ============================================

export async function analyzeNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const reasoning = await generateReasoningFast(state.message, state.context);

  const currentTopic = detectTopic(state.message);
  const topicChanged = state.conversationState.previous_topic !== null &&
    state.conversationState.previous_topic !== currentTopic &&
    currentTopic !== 'general';

  return {
    reasoning,
    sentiment: reasoning.sentiment.sentiment,
    industry: reasoning.industry,
    topicChanged,
    currentTopic,
  };
}

function detectTopic(message: string): TopicCategory {
  const lower = message.toLowerCase();

  let bestCategory: TopicCategory = 'general';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (category === 'general') continue;
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as TopicCategory;
    }
  }

  return bestCategory;
}

// ============================================
// NODE 2: routeNode
// ============================================

export function routeNode(state: GraphStateType): Partial<GraphStateType> {
  const history = state.history;
  const currentMsg = state.message.toLowerCase();
  const convState = { ...state.conversationState };

  // Increment turn count
  convState.turn_count += 1;

  // --- State detection (migrated from simple-agent.ts lines 362-494) ---
  let hasBusinessInfo = false;
  let hasVolumeInfo = false;
  let hasPainExpressed = false;
  let isReferred = false;
  let demoProposed = false;
  let horariosGiven = false;
  let userAcceptedDemo = false;
  let userProposedTime = false;
  let userGaveEmail = false;
  let yaSinContexto = false;
  let yaTieneAlgo = false;
  let userWantsToSchedule = false;
  let saidLater = false;
  let proposedDateTime: { date?: string; time?: string } = {};

  // Single pass through history
  for (const msg of history) {
    const c = msg.content.toLowerCase();
    if (msg.role === 'user') {
      if (!hasBusinessInfo && containsAny(c, BUSINESS_KEYWORDS)) hasBusinessInfo = true;
      if (!hasVolumeInfo && VOLUME_PATTERN.test(c) && (c.includes('mensaje') || c.includes('cliente') || c.includes('día') || c.includes('diario'))) hasVolumeInfo = true;
      if (!hasPainExpressed && containsAny(c, PAIN_KEYWORDS)) hasPainExpressed = true;
      if (!isReferred && containsAny(c, REFERRAL_KEYWORDS)) isReferred = true;
      if (demoProposed && !userAcceptedDemo && containsAny(c, DEMO_ACCEPT_KEYWORDS)) userAcceptedDemo = true;
    } else {
      if (!demoProposed && containsAny(c, DEMO_PROPOSE_KEYWORDS)) demoProposed = true;
      if (!horariosGiven && containsAny(c, HORARIO_KEYWORDS)) horariosGiven = true;
    }
  }

  // Detect in current message
  if (!isReferred && containsAny(currentMsg, REFERRAL_KEYWORDS)) isReferred = true;
  if (!hasPainExpressed && containsAny(currentMsg, PAIN_KEYWORDS)) hasPainExpressed = true;
  if (!hasVolumeInfo && VOLUME_PATTERN.test(currentMsg) && !horariosGiven) hasVolumeInfo = true;
  if (containsAny(currentMsg, SCHEDULE_KEYWORDS)) userWantsToSchedule = true;
  if (containsAny(currentMsg, LATER_KEYWORDS)) saidLater = true;
  if (demoProposed && containsAny(currentMsg, DEMO_ACCEPT_KEYWORDS)) userAcceptedDemo = true;

  // Extract datetime
  const DAY_MAP = new Map<string, number>([
    ['lunes', 1], ['martes', 2], ['miércoles', 3], ['miercoles', 3],
    ['jueves', 4], ['viernes', 5]
  ]);

  const extractDateTime = (text: string): { date?: string; time?: string } => {
    const result: { date?: string; time?: string } = {};

    for (const [dayName, dayNum] of DAY_MAP) {
      if (text.includes(dayName)) {
        const today = new Date();
        const currentDay = today.getDay();
        let daysToAdd = dayNum - currentDay;
        if (daysToAdd <= 0) daysToAdd += 7;
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysToAdd);
        result.date = targetDate.toISOString().split('T')[0];
        break;
      }
    }

    const timeMatch = text.match(TIME_PATTERN);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] || '00';
      const period = timeMatch[3]?.toLowerCase();
      if (period === 'pm' && hour < 12) hour += 12;
      if (period === 'am' && hour === 12) hour = 0;
      result.time = `${String(hour).padStart(2, '0')}:${minutes}`;
    }

    return result;
  };

  // User proposed time
  if (horariosGiven && (currentMsg.includes('jueves') || currentMsg.includes('viernes') ||
      currentMsg.includes('lunes') || currentMsg.includes('martes') || currentMsg.includes('miércoles') ||
      /\d+\s*(am|pm|:)/.test(currentMsg))) {
    userProposedTime = true;
    const extracted = extractDateTime(currentMsg);
    if (extracted.date) proposedDateTime.date = extracted.date;
    if (extracted.time) proposedDateTime.time = extracted.time;
  }

  // Search previous messages for datetime
  if (!proposedDateTime.date || !proposedDateTime.time) {
    for (let i = history.length - 2; i >= 0; i--) {
      const msg = history[i];
      if (msg.role === 'user') {
        const c = msg.content.toLowerCase();
        if (c.includes('lunes') || c.includes('martes') || c.includes('miércoles') ||
            c.includes('jueves') || c.includes('viernes') || /\d+\s*(am|pm|:)/.test(c)) {
          const extracted = extractDateTime(c);
          if (!proposedDateTime.date && extracted.date) proposedDateTime.date = extracted.date;
          if (!proposedDateTime.time && extracted.time) proposedDateTime.time = extracted.time;
          if (proposedDateTime.date && proposedDateTime.time) break;
        }
      }
    }
  }

  // Email detection
  if (EMAIL_PATTERN.test(currentMsg)) {
    userGaveEmail = true;
  }

  // "Ya" without context
  if ((currentMsg.trim() === 'ya' || currentMsg.trim() === 'ya.') && !demoProposed && !hasBusinessInfo) {
    yaSinContexto = true;
  }

  // "Ya tengo algo"
  if (currentMsg.includes('ya tengo') || currentMsg.includes('tengo algo') || currentMsg.includes('ya uso')) {
    yaTieneAlgo = true;
  }

  // --- Determine phase (same priority order as simple-agent.ts) ---
  let resolvedPhase: SalesPhase;
  if (userGaveEmail) resolvedPhase = 'confirmar_y_despedir';
  else if (userProposedTime) resolvedPhase = 'pedir_email';
  else if (horariosGiven) resolvedPhase = 'esperando_confirmacion';
  else if (userAcceptedDemo || userWantsToSchedule || (demoProposed && (currentMsg.includes('sí') || currentMsg.includes('si') ||
           currentMsg.includes('dale') || currentMsg.includes('me interesa')))) resolvedPhase = 'dar_horarios';
  else if (demoProposed) resolvedPhase = 'esperando_aceptacion';
  else if (yaSinContexto) resolvedPhase = 'pedir_clarificacion_ya';
  else if (yaTieneAlgo) resolvedPhase = 'preguntar_que_tiene';
  else if (isReferred || hasPainExpressed) resolvedPhase = 'proponer_demo_urgente';
  else if (hasBusinessInfo && hasVolumeInfo) resolvedPhase = 'listo_para_demo';
  else if (hasBusinessInfo) resolvedPhase = 'preguntando_volumen';
  else resolvedPhase = 'discovery';

  // --- Accumulate lead_info ---
  if (hasBusinessInfo && !convState.lead_info.business_type) {
    // Extract business type from current or recent messages
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'user' && containsAny(history[i].content.toLowerCase(), BUSINESS_KEYWORDS)) {
        convState.lead_info = { ...convState.lead_info, business_type: history[i].content.substring(0, 100) };
        break;
      }
    }
  }
  if (hasVolumeInfo && !convState.lead_info.volume) {
    const volumeMatch = currentMsg.match(/\d+/);
    if (volumeMatch) {
      convState.lead_info = { ...convState.lead_info, volume: volumeMatch[0] };
    }
  }
  if (hasPainExpressed) {
    for (const kw of PAIN_KEYWORDS) {
      if (currentMsg.includes(kw) && !convState.lead_info.pain_points.includes(kw)) {
        convState.lead_info = {
          ...convState.lead_info,
          pain_points: [...convState.lead_info.pain_points, kw],
        };
      }
    }
  }
  if (isReferred && !convState.lead_info.referral_source) {
    convState.lead_info = { ...convState.lead_info, referral_source: 'referido' };
  }
  if (yaTieneAlgo && !convState.lead_info.current_solution) {
    convState.lead_info = { ...convState.lead_info, current_solution: currentMsg.substring(0, 100) };
  }

  // --- Accumulate objections ---
  for (const [category, keywords] of Object.entries(OBJECTION_CATEGORIES)) {
    if (containsAny(currentMsg, keywords)) {
      const alreadyExists = convState.objections.some(
        o => o.category === category && !o.addressed
      );
      if (!alreadyExists) {
        const newObjection: ObjectionEntry = {
          category,
          text: currentMsg.substring(0, 150),
          addressed: false,
        };
        convState.objections = [...convState.objections, newObjection];
      }
    }
  }

  // --- Accumulate topics_covered ---
  const currentTopic = state.currentTopic;
  if (currentTopic !== 'general' && !convState.topics_covered.includes(currentTopic)) {
    convState.topics_covered = [...convState.topics_covered, currentTopic];
  }

  // --- Update proposed_datetime ---
  if (proposedDateTime.date || proposedDateTime.time) {
    convState.proposed_datetime = {
      ...convState.proposed_datetime,
      ...proposedDateTime,
    };
  }

  // --- Update awaiting_email ---
  convState.awaiting_email = resolvedPhase === 'pedir_email' || resolvedPhase === 'esperando_confirmacion';

  // --- Update previous_topic ---
  convState.previous_topic = currentTopic;

  // --- Update phase ---
  convState.phase = resolvedPhase;

  // --- Calculate needsSummary ---
  const needsSummary = convState.turn_count >= 5 &&
    (convState.turn_count - convState.last_summary_turn >= 5);

  return {
    resolvedPhase,
    needsSummary,
    saidLater,
    conversationState: convState,
  };
}

// ============================================
// NODE 3: summarizeNode (conditional)
// ============================================

export async function summarizeNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const history = state.history;
  const convState = { ...state.conversationState };

  // Take last 10 messages
  const recentHistory = history.slice(-10);
  const conversationText = recentHistory
    .map(m => `${m.role === 'user' ? 'Cliente' : 'Vendedor'}: ${m.content}`)
    .join('\n');

  const leadInfoText = [];
  const li = convState.lead_info;
  if (li.business_type) leadInfoText.push(`Negocio: ${li.business_type}`);
  if (li.volume) leadInfoText.push(`Volumen: ${li.volume} mensajes`);
  if (li.pain_points.length > 0) leadInfoText.push(`Dolores: ${li.pain_points.join(', ')}`);
  if (li.current_solution) leadInfoText.push(`Solución actual: ${li.current_solution}`);

  const summaryPrompt = `Eres un asistente que resume conversaciones de ventas para un agente de IA.

${convState.summary ? `RESUMEN PREVIO:\n${convState.summary}\n\n` : ''}${leadInfoText.length > 0 ? `INFO DEL LEAD:\n${leadInfoText.join('\n')}\n\n` : ''}CONVERSACIÓN RECIENTE:
${conversationText}

Genera un resumen actualizado de máximo 150 palabras que capture:
1. Tipo de negocio y contexto del cliente
2. Necesidades y dolores expresados
3. Nivel de interés y etapa de la conversación
4. Objeciones mencionadas y si fueron abordadas
5. Productos/beneficios discutidos
6. Próximos pasos acordados o pendientes

Formato: Texto corrido, sin bullets. Incluye solo información confirmada.
Si hay resumen previo, actualízalo incorporando la nueva información.`;

  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: summaryPrompt,
      prompt: 'Resume la conversación.',
      maxOutputTokens: 300,
    });

    const newSummary = result.text.trim();

    if (newSummary && newSummary.length > 10) {
      convState.summary = newSummary;
      convState.last_summary_turn = convState.turn_count;

      // Sync to lead_memory for compatibility
      await syncSummaryToLeadMemory(state.context.lead.id, newSummary);

      console.log(`[GraphSummarize] Updated summary at turn ${convState.turn_count}: ${newSummary.substring(0, 50)}...`);
    }
  } catch (error) {
    console.error('[GraphSummarize] Error generating summary:', error);
    // Non-fatal, continue without updating summary
  }

  return {
    conversationState: convState,
  };
}

// ============================================
// NODE 4: generateNode
// ============================================

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

export async function generateNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const { resolvedPhase, context, reasoning, conversationState, message, history, topicChanged, currentTopic } = state;

  // Deterministic path: show schedule list
  if (resolvedPhase === 'dar_horarios') {
    console.log('[GraphGenerate] User accepted demo, triggering schedule list');
    return {
      result: {
        response: 'Perfecto, déjame mostrarte los horarios disponibles.',
        showScheduleList: true,
        detectedIndustry: reasoning && reasoning.industry !== 'generic' ? reasoning.industry : undefined,
      },
    };
  }

  // Build system prompt
  const systemPrompt = buildSystemPrompt({
    message,
    context,
    conversationState,
    reasoning: reasoning!,
    topicChanged,
    currentTopic,
    resolvedPhase,
  });

  // Client info for tools
  const clientName = context.lead.name || 'Cliente';
  const clientPhone = context.lead.phone || '';

  // Define tools (migrated from simple-agent.ts)
  const checkAvailabilitySchema = z.object({
    date: z.string().describe('Fecha en formato YYYY-MM-DD. Si no se especifica fecha exacta, usa los próximos días hábiles.')
  });

  const bookAppointmentSchema = z.object({
    date: z.string().describe('Fecha de la cita en formato YYYY-MM-DD'),
    time: z.string().describe('Hora de la cita en formato HH:MM (24h)'),
    email: z.string().describe('Email del cliente para enviar la invitación')
  });

  const tools = {
    check_availability: tool({
      description: 'Verifica disponibilidad en el calendario para una fecha específica. Usa formato YYYY-MM-DD.',
      inputSchema: zodSchema(checkAvailabilitySchema),
      execute: async (params) => {
        const { date } = params as z.infer<typeof checkAvailabilitySchema>;
        console.log(`[Tool] Checking availability for: ${date}`);
        let dateToCheck = date;
        if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const nextDays = getNextBusinessDays(3);
          dateToCheck = nextDays.join(',');
        }
        const slots = await checkAvailability(dateToCheck);
        if (slots.length === 0) {
          return { available: false, message: 'No hay horarios disponibles para esa fecha.' };
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
        return { available: true, slots: readable, rawSlots: slots.slice(0, 8) };
      }
    }),

    book_appointment: tool({
      description: 'Agenda una cita en el calendario. Requiere fecha (YYYY-MM-DD), hora (HH:MM), y email del cliente.',
      inputSchema: zodSchema(bookAppointmentSchema),
      execute: async (params) => {
        const { date, time, email } = params as z.infer<typeof bookAppointmentSchema>;
        console.log(`[Tool] Booking appointment: ${date} ${time} for ${email}`);
        const result = await createEvent({
          date,
          time,
          name: clientName,
          phone: clientPhone,
          email
        });
        if (result.success) {
          if (result.meetingUrl && clientPhone) {
            const { sendWhatsAppMessage } = await import('@/lib/whatsapp/send');
            await sendWhatsAppMessage(
              clientPhone,
              `Aquí está el link para nuestra llamada:\n${result.meetingUrl}\n\nTe llegará también la invitación a tu correo.`
            );
            console.log(`[Tool] Meeting link sent to ${clientPhone}: ${result.meetingUrl}`);
          }
          return {
            success: true,
            eventId: result.eventId,
            meetingUrl: result.meetingUrl,
            message: `Cita agendada exitosamente para ${date} a las ${time}. Se envió invitación a ${email} y el link de la reunión por WhatsApp.`
          };
        }
        return {
          success: false,
          message: 'No se pudo agendar la cita. El horario puede no estar disponible.'
        };
      }
    }),

    send_brochure: tool({
      description: 'Envía información detallada sobre el servicio de agentes de IA para WhatsApp. Usa cuando pidan más información, ejemplos o detalles.',
      inputSchema: zodSchema(z.object({
        reason: z.string().describe('Motivo por el que se envía el brochure')
      })),
      execute: async (params) => {
        const { reason } = params as { reason: string };
        console.log(`[Tool] Sending brochure: ${reason}`);
        const brochureUrl = process.env.BROCHURE_URL || 'https://anthana.com/info';
        const sent = await sendWhatsAppLink(
          clientPhone,
          brochureUrl,
          '📄 Aquí tienes más información sobre nuestros agentes de IA para WhatsApp:'
        );
        return {
          success: sent,
          message: sent
            ? 'Brochure enviado exitosamente. Pregunta si tiene dudas o quiere agendar demo.'
            : 'No se pudo enviar el brochure.'
        };
      }
    }),

    escalate_to_human: tool({
      description: 'Transfiere la conversación a un humano. Usa SOLO para clientes VIP, proyectos grandes, o cuando el cliente lo pida explícitamente.',
      inputSchema: zodSchema(z.object({
        reason: z.string().describe('Motivo de la escalación'),
        summary: z.string().describe('Resumen breve de la conversación')
      })),
      execute: async (params) => {
        const { reason, summary } = params as { reason: string; summary: string };
        console.log(`[Tool] Escalating to human: ${reason}`);
        const escalated = await escalateToHuman({
          clientPhone,
          clientName,
          reason,
          conversationSummary: summary
        });
        return {
          success: escalated,
          message: escalated
            ? 'Escalado exitosamente. El cliente será contactado por un humano pronto.'
            : 'No se pudo escalar. Intenta resolver la situación.'
        };
      }
    }),

    ...createKnowledgeTools()
  };

  // Track tool results
  let appointmentBooked: SimpleAgentResult['appointmentBooked'] = undefined;
  let brochureSent = false;
  let escalatedToHumanResult: SimpleAgentResult['escalatedToHuman'] = undefined;

  try {
    const result = await generateText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      system: systemPrompt,
      messages: history,
      tools,
      maxOutputTokens: 250,
      onStepFinish: async (step) => {
        if (step.toolResults) {
          for (const toolResult of step.toolResults) {
            const output = toolResult.output as { success?: boolean; eventId?: string; meetingUrl?: string } | undefined;

            if (toolResult.toolName === 'book_appointment' && output?.success) {
              const toolCall = step.toolCalls?.find(tc => tc.toolName === 'book_appointment');
              if (toolCall) {
                const args = toolCall.input as { date: string; time: string; email: string };
                appointmentBooked = {
                  eventId: output.eventId || '',
                  date: args.date,
                  time: args.time,
                  email: args.email,
                  meetingUrl: output.meetingUrl
                };
                console.log(`[Tool] Appointment booked: ${JSON.stringify(appointmentBooked)}`);
              }
            }

            if (toolResult.toolName === 'send_brochure' && output?.success) {
              brochureSent = true;
              console.log(`[Tool] Brochure sent`);
            }

            if (toolResult.toolName === 'escalate_to_human' && output?.success) {
              const toolCall = step.toolCalls?.find(tc => tc.toolName === 'escalate_to_human');
              if (toolCall) {
                const args = toolCall.input as { reason: string; summary: string };
                escalatedToHumanResult = { reason: args.reason, summary: args.summary };
                console.log(`[Tool] Escalated to human: ${args.reason}`);
              }
            }
          }
        }
      }
    });

    let response = result.text.trim();
    response = response.replace(/\*+/g, '');
    response = response.replace(/^(Víctor|Victor):\s*/i, '');

    console.log('=== GRAPH RESPONSE ===');
    console.log(response);

    // Track products offered if brochure was sent
    const updatedState = { ...state.conversationState };
    if (brochureSent && !updatedState.products_offered.includes('brochure')) {
      updatedState.products_offered = [...updatedState.products_offered, 'brochure'];
    }

    return {
      result: {
        response,
        tokensUsed: result.usage?.totalTokens,
        appointmentBooked,
        brochureSent: brochureSent || undefined,
        escalatedToHuman: escalatedToHumanResult,
        detectedIndustry: reasoning && reasoning.industry !== 'generic' ? reasoning.industry : undefined,
        saidLater: state.saidLater,
      },
      conversationState: updatedState,
    };

  } catch (error) {
    console.error('Graph agent error:', error);
    return {
      result: {
        response: 'Perdón, tuve un problema. ¿Me repites?'
      },
    };
  }
}

// ============================================
// NODE 5: persistNode
// ============================================

export async function persistNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const { saveConversationState } = await import('./memory');
  await saveConversationState(state.context.conversation.id, state.conversationState);
  return {};
}
