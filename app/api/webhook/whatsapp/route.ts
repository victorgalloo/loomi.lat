/**
 * WhatsApp Webhook Handler
 *
 * Multi-tenant support:
 * - Routes messages by phone_number_id to correct tenant
 * - Loads tenant-specific credentials and agent config
 * - Uses tenant credentials for all WhatsApp API calls
 *
 * Optimized with:
 * - Promise.all() for parallel operations (async-parallel)
 * - Start promises early, await late (async-api-routes)
 * - Early returns (js-early-exit)
 * - Set for O(1) lookups (js-set-map-lookups)
 * - Hoisted RegExp (js-hoist-regexp)
 * - after() for non-blocking operations (server-after-nonblocking)
 */

import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { parseWhatsAppWebhook, ParsedWhatsAppMessage } from '@/lib/whatsapp/parse';
import { retryAsync } from '@/lib/utils/retry';
import {
  sendWhatsAppMessage,
  sendScheduleList,
  markAsRead,
  notifyFallback,
  TimeSlot,
  TenantCredentials
} from '@/lib/whatsapp/send';
import {
  executeHandoff,
  handoffOnAgentError,
  handoffOnServiceError,
  detectHandoffTrigger,
  detectRepeatedFailures,
  HandoffContext,
  REASON_CONFIG
} from '@/lib/handoff';
import { getWebhookContext } from '@/lib/memory/context';
import { processMessageGraph } from '@/lib/graph/graph';
import {
  checkRateLimit,
  isProcessing,
  clearProcessing,
  acquireConversationLock,
  releaseConversationLock,
  setPendingSlot,
  getPendingSlot,
  clearPendingSlot,
  PendingSlot,
  setPendingPlan,
  getPendingPlan,
  clearPendingPlan,
  PendingPlan,
  setScheduleListSent,
  wasScheduleListSent,
  clearScheduleListSent
} from '@/lib/ratelimit';
import { createCheckoutSession, getPlanDisplayName } from '@/lib/stripe/checkout';
import { sendPaymentLink } from '@/lib/whatsapp/send';
import { saveMessage, createAppointment, updateLeadStage, updateLeadIndustry } from '@/lib/memory/supabase';
import { generateMemory, shouldGenerateMemory } from '@/lib/memory/generate';
import { syncLeadToHubSpot } from '@/lib/integrations/hubspot';
import { checkAvailability, createEvent, CalTenantConfig } from '@/lib/tools/calendar';
import { ConversationContext } from '@/types';
import {
  scheduleDemoReminders,
  scheduleSaidLaterFollowUp,
  scheduleReengagement,
  cancelFollowUps,
  checkAndHandleOptOut
} from '@/lib/followups/scheduler';
import { getTenantFromPhoneNumberId, AgentConfig } from '@/lib/tenant/context';
import { isAutoResponder } from '@/lib/whatsapp/autoresponder';
import { transcribeWhatsAppAudio } from '@/lib/whatsapp/audio';
import { trackDemoScheduled } from '@/lib/integrations/meta-conversions';

// Webhook timeout guard: Vercel kills functions at 30s, so we race at 25s
const WEBHOOK_TIMEOUT_MS = 25000;

class WebhookTimeoutError extends Error {
  constructor() {
    super('Webhook processing exceeded 25s timeout');
    this.name = 'WebhookTimeoutError';
  }
}

function withWebhookTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new WebhookTimeoutError()), WEBHOOK_TIMEOUT_MS)
    ),
  ]);
}

// Hoisted RegExp for email extraction (js-hoist-regexp)
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

// Day names for formatting (hoisted constant)
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;

// Set for O(1) lookup on "other days" keywords (js-set-map-lookups)
const OTHER_DAYS_KEYWORDS = new Set([
  'otro día', 'otro dia', 'otros días', 'otros dias',
  'otra fecha', 'otras fechas', 'más horarios', 'mas horarios',
  'más días', 'mas dias', 'siguiente semana', 'proxima semana', 'próxima semana'
]);

// Tenant cache with 5-minute TTL (avoids repeated Supabase lookups for same phone_number_id)
const tenantCache = new Map<string, { data: NonNullable<Awaited<ReturnType<typeof getTenantFromPhoneNumberId>>>; cachedAt: number }>();
const TENANT_CACHE_TTL = 5 * 60 * 1000;

async function getCachedTenant(phoneNumberId: string) {
  const cached = tenantCache.get(phoneNumberId);
  if (cached && Date.now() - cached.cachedAt < TENANT_CACHE_TTL) {
    return cached.data;
  }
  const data = await getTenantFromPhoneNumberId(phoneNumberId);
  if (data) {
    tenantCache.set(phoneNumberId, { data, cachedAt: Date.now() });
  }
  return data;
}

/**
 * Extract email from text using hoisted regex
 */
function extractEmail(text: string): string | null {
  const match = text.match(EMAIL_REGEX);
  return match ? match[0].toLowerCase() : null;
}

/**
 * Format date for display (Spanish)
 */
function formatDateSpanish(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return DIAS[date.getDay()];
}

/**
 * Format time for display (12h format)
 */
function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Get next N business days
 */
function getNextBusinessDays(count: number, skip: number = 0): string[] {
  const dates: string[] = [];
  const today = new Date();
  let currentDate = new Date(today);
  let skipped = 0;
  let added = 0;

  while (added < count) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      if (skipped < skip) {
        skipped++;
      } else {
        dates.push(currentDate.toISOString().split('T')[0]);
        added++;
      }
    }
  }

  return dates;
}

/**
 * Get available time slots
 */
async function getAvailableTimeSlots(skip: number = 0, daysCount: number = 2, calConfig?: CalTenantConfig): Promise<TimeSlot[]> {
  try {
    const dates = getNextBusinessDays(daysCount, skip);
    console.log(`[getAvailableTimeSlots] Checking dates: ${dates.join(',')}`);

    const allSlots = await checkAvailability(dates.join(','), calConfig);
    console.log(`[getAvailableTimeSlots] Got ${allSlots.length} raw slots`);

    // Group slots by date in single iteration (js-combine-iterations)
    const slotsByDate = new Map<string, typeof allSlots>();
    for (const slot of allSlots) {
      const existing = slotsByDate.get(slot.date);
      if (existing) {
        existing.push(slot);
      } else {
        slotsByDate.set(slot.date, [slot]);
      }
    }

    // Build result with max 5 slots per day
    const result: TimeSlot[] = [];
    const slotsPerDay = skip > 0 ? 3 : 5;

    for (const date of dates) {
      const daySlots = slotsByDate.get(date) || [];
      const step = Math.max(1, Math.floor(daySlots.length / slotsPerDay));
      let added = 0;

      for (let i = 0; i < daySlots.length && added < slotsPerDay; i += step) {
        const slot = daySlots[i];
        result.push({
          id: `${slot.date}_${slot.time}`,
          date: slot.date,
          time: slot.time,
          displayText: `${formatDateSpanish(slot.date)} - ${formatTime12h(slot.time)}`
        });
        added++;
      }
    }

    // Add "Other day" option only for first page
    if (skip === 0) {
      result.push({
        id: 'otro_dia',
        date: '',
        time: '',
        displayText: 'Ver más días'
      });
    }

    return result;
  } catch (error) {
    console.error(`[getAvailableTimeSlots] Error:`, error);
    return [];
  }
}

/**
 * Check if user is asking for other days using Set lookup
 */
function wantsOtherDays(text: string): boolean {
  const lower = text.toLowerCase();
  for (const keyword of OTHER_DAYS_KEYWORDS) {
    if (lower.includes(keyword)) {
      return true;
    }
  }
  return false;
}

/**
 * Handle slot selection from list
 */
async function handleSlotSelection(
  message: ParsedWhatsAppMessage,
  context: ConversationContext,
  tenantId?: string
): Promise<{ handled: boolean; response?: string; showMoreDays?: boolean }> {
  // Early exits
  if (message.interactiveType !== 'list_reply' || !message.interactiveId) {
    return { handled: false };
  }

  if (message.interactiveId === 'otro_dia') {
    return { handled: true, showMoreDays: true };
  }

  // Parse slot ID
  const [date, time] = message.interactiveId.split('_');
  if (!date || !time) {
    console.error(`[Webhook] Invalid slot ID: ${message.interactiveId}`);
    return { handled: false };
  }

  // Store pending slot
  const pendingSlot: PendingSlot = {
    date,
    time,
    displayText: message.text,
    selectedAt: Date.now()
  };
  await setPendingSlot(message.phone, pendingSlot, tenantId);

  return {
    handled: true,
    response: `Perfecto, ${formatDateSpanish(date)} a las ${formatTime12h(time)}. ¿A qué correo te mando la invitación?`
  };
}

/**
 * Handle button reply
 */
async function handleButtonReply(
  message: ParsedWhatsAppMessage,
  tenantId?: string
): Promise<{ handled: boolean; showScheduleList?: boolean }> {
  if (message.interactiveType !== 'button_reply' || !message.interactiveId) {
    return { handled: false };
  }

  if (message.interactiveId === 'change_time') {
    await clearPendingSlot(message.phone, tenantId);
    return { handled: true, showScheduleList: true };
  }

  return { handled: false };
}

/**
 * Handle plan selection from list
 */
async function handlePlanSelection(
  message: ParsedWhatsAppMessage,
  tenantId?: string
): Promise<{ handled: boolean; response?: string }> {
  // Early exit if not a list reply
  if (message.interactiveType !== 'list_reply' || !message.interactiveId) {
    return { handled: false };
  }

  // Check if it's a plan selection
  const planMap: Record<string, 'starter' | 'growth' | 'business'> = {
    'plan_starter': 'starter',
    'plan_growth': 'growth',
    'plan_business': 'business'
  };

  const plan = planMap[message.interactiveId];
  if (!plan) {
    return { handled: false };
  }

  // Store pending plan
  const pendingPlan: PendingPlan = {
    plan,
    displayText: message.text,
    selectedAt: Date.now()
  };
  await setPendingPlan(message.phone, pendingPlan, tenantId);

  const planName = getPlanDisplayName(plan);
  return {
    handled: true,
    response: `Perfecto, elegiste el plan ${planName}. ¿A qué correo te mando el link de pago?`
  };
}

/**
 * Handle email for pending plan (Stripe checkout)
 */
async function handleEmailForPendingPlan(
  message: ParsedWhatsAppMessage,
  tenantId?: string
): Promise<{
  handled: boolean;
  response?: string;
  paymentLinkSent?: boolean;
}> {
  // Start pending plan lookup early
  const pendingPlanPromise = getPendingPlan(message.phone, tenantId);

  // Extract email while waiting
  const email = extractEmail(message.text);

  // Now await pending plan
  const pendingPlan = await pendingPlanPromise;

  // Early exits
  if (!pendingPlan) return { handled: false };
  if (!email) return { handled: false };

  console.log(`[Webhook] Creating checkout for ${email}, plan: ${pendingPlan.plan}`);

  try {
    const { shortUrl } = await createCheckoutSession({
      email,
      phone: message.phone,
      plan: pendingPlan.plan
    });

    const planName = getPlanDisplayName(pendingPlan.plan);
    const sent = await sendPaymentLink(message.phone, shortUrl, planName);

    // Clear pending plan
    await clearPendingPlan(message.phone, tenantId);

    if (!sent) {
      return {
        handled: true,
        response: `Aquí está tu link de pago:\n${shortUrl}`
      };
    }

    return {
      handled: true,
      response: `Te envié el link de pago por mensaje. Una vez que completes, tu agente estará activo en menos de 24 horas 🚀`,
      paymentLinkSent: true
    };

  } catch (error) {
    console.error('[Webhook] Checkout error:', error);
    await clearPendingPlan(message.phone, tenantId);
    return {
      handled: true,
      response: `Hubo un problema al generar el link de pago. ¿Podrías intentar de nuevo?`
    };
  }
}

/**
 * Handle email for pending slot
 */
async function handleEmailForPendingSlot(
  message: ParsedWhatsAppMessage,
  context: ConversationContext,
  tenantId?: string,
  calConfig?: CalTenantConfig
): Promise<{
  handled: boolean;
  response?: string;
  appointmentBooked?: {
    eventId: string;
    date: string;
    time: string;
    email: string;
    meetingUrl?: string;
  };
}> {
  // Start pending slot lookup early (async-api-routes)
  const pendingSlotPromise = getPendingSlot(message.phone, tenantId);

  // Extract email while waiting
  const email = extractEmail(message.text);

  // Now await pending slot
  const pendingSlot = await pendingSlotPromise;

  // Early exits
  if (!pendingSlot) return { handled: false };
  if (!email) return { handled: false };

  // Book the appointment
  console.log(`[Webhook] Booking directly: ${pendingSlot.date} ${pendingSlot.time} for ${email}`);

  const result = await createEvent({
    date: pendingSlot.date,
    time: pendingSlot.time,
    name: context.lead.name,
    phone: context.lead.phone,
    email
  }, calConfig);

  // Clear pending slot
  await clearPendingSlot(message.phone, tenantId);

  if (!result.success) {
    console.error(`[Webhook] Booking failed:`, result.error);
    return {
      handled: true,
      response: `Hubo un problema al agendar. ¿Te parece si elegimos otro horario?`
    };
  }

  // Build confirmation message
  const dateDisplay = formatDateSpanish(pendingSlot.date);
  const timeDisplay = formatTime12h(pendingSlot.time);
  let response = `¡Listo! Tu demo está agendada para el ${dateDisplay} a las ${timeDisplay}.\n\nTe envié la invitación a ${email}.`;

  if (result.meetingUrl) {
    response += `\n\nLink de la reunión:\n${result.meetingUrl}`;
  }

  response += `\n\n¡Nos vemos! 🚀`;

  return {
    handled: true,
    response,
    appointmentBooked: {
      eventId: result.eventId!,
      date: pendingSlot.date,
      time: pendingSlot.time,
      email,
      meetingUrl: result.meetingUrl
    }
  };
}

// Webhook verification for Meta
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('Webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

// Handle incoming messages
export async function POST(request: NextRequest) {
  const t0 = performance.now();
  try {
    const body = await request.json();
    const message = parseWhatsAppWebhook(body);

    // Handle message status updates (delivery receipts for broadcasts)
    if (!message) {
      try {
        const entry = (body as Record<string, unknown[]>)?.entry?.[0] as Record<string, unknown[]> | undefined;
        const change = (entry?.changes?.[0] as Record<string, Record<string, unknown[]>> | undefined);
        const statuses = change?.value?.statuses as Array<{ id: string; status: string; timestamp: string; errors?: Array<{ code: number; title: string }> }> | undefined;
        if (statuses && statuses.length > 0) {
          const { getSupabase } = await import('@/lib/memory/supabase');
          const supabase = getSupabase();
          for (const s of statuses) {
            if (s.status === 'failed') {
              const errorMsg = s.errors?.[0]?.title || 'Unknown delivery error';
              await supabase
                .from('broadcast_recipients')
                .update({ status: 'failed', error_message: errorMsg })
                .eq('wa_message_id', s.id);
              console.log(`[Webhook] Message ${s.id} FAILED: ${errorMsg}`);
            } else if (s.status === 'delivered') {
              await supabase
                .from('broadcast_recipients')
                .update({ status: 'delivered' })
                .eq('wa_message_id', s.id)
                .eq('status', 'sent');
            } else if (s.status === 'read') {
              await supabase
                .from('broadcast_recipients')
                .update({ status: 'read' })
                .eq('wa_message_id', s.id)
                .in('status', ['sent', 'delivered']);
            }
          }
        }
      } catch (e) {
        // Don't fail the webhook on status processing errors
        console.warn('[Webhook] Status update processing error:', e);
      }
      return NextResponse.json({ status: 'ok' });
    }

    // ============================================
    // PHASE 1: Independent checks (parallel)
    // No dependencies between these three operations
    // ============================================
    const [isDuplicate, tenantData, rateLimit] = await Promise.all([
      isProcessing(message.messageId),
      message.phoneNumberId ? getCachedTenant(message.phoneNumberId) : Promise.resolve(null),
      checkRateLimit(message.phone),
    ]);

    // Gate: duplicate
    if (isDuplicate) {
      console.log(`Message ${message.messageId} already processing`);
      return NextResponse.json({ status: 'duplicate' });
    }

    // Resolve tenant credentials from cache/DB result
    let credentials: TenantCredentials | undefined;
    let tenantId: string | undefined;
    let agentConfig: AgentConfig | undefined;
    let calConfig: CalTenantConfig | undefined;

    if (tenantData) {
      tenantId = tenantData.tenantId;
      credentials = {
        phoneNumberId: message.phoneNumberId,
        accessToken: tenantData.accessToken,
        tenantId: tenantData.tenantId
      };
    } else if (message.phoneNumberId) {
      console.log(`[Webhook] No tenant found for phone_number_id ${message.phoneNumberId}, using env vars`);
    }

    // Gate: rate limit (before acquiring costly resources)
    if (!rateLimit.allowed) {
      console.log(`Rate limited: ${message.phone} - ${rateLimit.reason}`);
      if (rateLimit.reason === 'minute_limit') {
        await sendWhatsAppMessage(message.phone, 'Dame un momento para procesar tus mensajes anteriores.', credentials);
      }
      return NextResponse.json({ status: 'rate_limited' });
    }

    try {
      // Audio transcription (needs credentials, modifies message.text before context load)
      if (message.mediaId && (message.mediaType === 'audio' || message.mediaType === 'voice')) {
        const transcription = await transcribeWhatsAppAudio(message.mediaId, credentials);
        if (transcription) {
          message.text = `[Audio transcrito: ${transcription}]`;
        }
      }

      // ============================================
      // PHASE 2: Single RPC + non-Supabase ops (parallel)
      // 1 Postgres call replaces 12 individual Supabase round trips
      // ============================================
      const [lockAcquired, , webhookCtx] = await Promise.all([
        acquireConversationLock(message.phone, 5000, tenantId),  // Redis
        markAsRead(message.messageId, credentials),               // WhatsApp API
        getWebhookContext(message, tenantId),                      // 1 RPC call
      ]);

      const { context, botPaused, conversationState: preloadedConversationState } = webhookCtx;
      agentConfig = webhookCtx.agentConfig;
      calConfig = webhookCtx.calConfig;

      // Gate: conversation lock
      if (!lockAcquired) {
        console.log(`[Webhook] Could not acquire lock for ${message.phone}, saving message only`);
        await saveMessage(context.conversation.id, 'user', message.text, context.lead.id);
        return NextResponse.json({ status: 'queued_no_response' });
      }

      // Check for auto-responder messages (first interaction only)
      if (context.recentMessages.length <= 1 && isAutoResponder(message.text)) {
        console.log(`[Webhook] Auto-responder detected from ${message.phone}, saving without responding`);
        await saveMessage(context.conversation.id, 'user', message.text, context.lead.id);
        return NextResponse.json({ status: 'autoresponder_detected' });
      }

      // Check if bot is paused (operator has taken control) — from RPC result
      if (botPaused) {
        console.log(`[Webhook] Bot paused for conversation ${context.conversation.id}, saving message only`);
        await saveMessage(context.conversation.id, 'user', message.text, context.lead.id);
        return NextResponse.json({ status: 'bot_paused' });
      }

      // Check for opt-out signals
      const recentMessagesForOptOut = context.recentMessages?.map(m => ({
        role: m.role,
        content: m.content
      })) || [];
      const isOptOut = await checkAndHandleOptOut(
        context.lead.id,
        message.text,
        recentMessagesForOptOut
      );

      if (isOptOut) {
        console.log(`[Webhook] Lead ${context.lead.id} opted out of follow-ups`);
      }

      // Save message and cancel re-engagement in parallel
      await Promise.all([
        saveMessage(context.conversation.id, 'user', message.text, context.lead.id),
        cancelFollowUps(context.lead.id, ['cold_lead_reengagement', 'reengagement_2', 'reengagement_3'])
      ]);

      const t1 = performance.now();

      // ============================================
      // DETERMINISTIC FLOW - Handle interactive messages first
      // ============================================

      // 1. Handle slot selection
      const slotSelection = await handleSlotSelection(message, context, tenantId);
      if (slotSelection.handled) {
        if (slotSelection.showMoreDays) {
          console.log(`[Webhook] User wants more days`);
          waitUntil(
            (async () => {
              const moreSlots = await getAvailableTimeSlots(2, 3, calConfig);
              if (moreSlots.length > 0) {
                await sendScheduleList(message.phone, moreSlots, 'Más horarios', 'Aquí tienes más opciones:', credentials);
                await setScheduleListSent(message.phone, tenantId);
                saveMessage(context.conversation.id, 'assistant', '[Lista de más horarios]', context.lead.id).catch(console.error);
              } else {
                await sendWhatsAppMessage(message.phone, 'No hay más horarios disponibles esta semana. ¿Te escribo la próxima?', credentials);
              }
            })()
          );
          return NextResponse.json({ status: 'ok', flow: 'more_days_requested' });
        }

        await sendWhatsAppMessage(message.phone, slotSelection.response!, credentials);
        await Promise.all([
          saveMessage(context.conversation.id, 'assistant', slotSelection.response!, context.lead.id),
          clearScheduleListSent(message.phone, tenantId)
        ]);
        return NextResponse.json({ status: 'ok', flow: 'slot_selected' });
      }

      // 1b. Check for "other days" via text
      if (wantsOtherDays(message.text)) {
        console.log(`[Webhook] User asking for other days via text`);
        waitUntil(
          (async () => {
            await sendWhatsAppMessage(message.phone, 'Claro, déjame mostrarte más opciones.', credentials);
            const moreSlots = await getAvailableTimeSlots(2, 3, calConfig);
            if (moreSlots.length > 0) {
              await sendScheduleList(message.phone, moreSlots, 'Más horarios', 'Aquí tienes más opciones:', credentials);
              await setScheduleListSent(message.phone, tenantId);
              saveMessage(context.conversation.id, 'assistant', '[Lista de más horarios]', context.lead.id).catch(console.error);
            } else {
              await sendWhatsAppMessage(message.phone, 'No hay más horarios disponibles esta semana. ¿Te escribo la próxima?', credentials);
            }
          })()
        );
        return NextResponse.json({ status: 'ok', flow: 'more_days_text' });
      }

      // 2. Handle button reply
      const buttonReply = await handleButtonReply(message, tenantId);
      if (buttonReply.handled && buttonReply.showScheduleList) {
        console.log(`[Webhook] User wants to change time`);
        const slots = await getAvailableTimeSlots(0, 2, calConfig);
        if (slots.length > 0) {
          await sendScheduleList(message.phone, slots, 'Elige otro horario', 'Estos son los horarios disponibles:', credentials);
          await setScheduleListSent(message.phone, tenantId);
          await saveMessage(context.conversation.id, 'assistant', '[Lista de horarios enviada]', context.lead.id);
        } else {
          await sendWhatsAppMessage(message.phone, 'No hay horarios disponibles en este momento. Te contactamos pronto.', credentials);
          await saveMessage(context.conversation.id, 'assistant', 'No hay horarios disponibles.', context.lead.id);
        }
        return NextResponse.json({ status: 'ok', flow: 'schedule_list_sent' });
      }

      // 2b. If schedule list was sent and user types free text (not an interactive reply),
      //     nudge once then clear the flag so next message reaches the agent
      if (!message.interactiveType && message.text && !extractEmail(message.text)) {
        const scheduleListPending = await wasScheduleListSent(message.phone, tenantId);
        if (scheduleListPending) {
          console.log(`[Webhook] Schedule list pending for ${message.phone}, nudging once and clearing flag`);
          await saveMessage(context.conversation.id, 'user', message.text, context.lead.id);
          const nudgeMsg = 'Tienes una lista de horarios arriba ☝️ Elige el que te funcione, o dime si necesitas ver más días.';
          await sendWhatsAppMessage(message.phone, nudgeMsg, credentials);
          await saveMessage(context.conversation.id, 'assistant', nudgeMsg, context.lead.id);
          // Clear the flag so subsequent messages reach the agent normally
          await clearScheduleListSent(message.phone, tenantId);
          return NextResponse.json({ status: 'ok', flow: 'schedule_list_nudge' });
        }
      }

      // 3. Handle email for pending slot
      const emailResult = await handleEmailForPendingSlot(message, context, tenantId, calConfig);
      if (emailResult.handled) {
        await sendWhatsAppMessage(message.phone, emailResult.response!, credentials);
        await saveMessage(context.conversation.id, 'assistant', emailResult.response!, context.lead.id);

        if (emailResult.appointmentBooked) {
          const { eventId, date, time, email, meetingUrl } = emailResult.appointmentBooked;
          const scheduledAt = new Date(`${date}T${time}:00`);

          // Schedule follow-ups and sync in background
          waitUntil((async () => {
            try {
              const appointment = await createAppointment(context.lead.id, scheduledAt, eventId);
              await updateLeadStage(context.lead.id, 'Hot');

              await scheduleDemoReminders(context.lead.id, appointment.id, scheduledAt, context.lead);

              await syncLeadToHubSpot({
                phone: context.lead.phone,
                name: context.lead.name,
                email,
                stage: 'Demo Agendada',
                messages: [...context.recentMessages, { role: 'user', content: message.text }],
                appointmentBooked: { date, time, meetingUrl }
              });

              // Track conversion event for Meta
              await trackDemoScheduled({
                phone: context.lead.phone,
                leadId: context.lead.id,
                name: context.lead.name,
                email
              });
            } catch (err) {
              console.error('[Webhook] After error:', err);
            }
          })());
        }

        return NextResponse.json({ status: 'ok', flow: 'appointment_booked' });
      }

      // 4. Handle plan selection (Stripe)
      const planSelection = await handlePlanSelection(message, tenantId);
      if (planSelection.handled) {
        await sendWhatsAppMessage(message.phone, planSelection.response!, credentials);
        await saveMessage(context.conversation.id, 'assistant', planSelection.response!, context.lead.id);
        return NextResponse.json({ status: 'ok', flow: 'plan_selected' });
      }

      // 5. Handle email for pending plan (Stripe checkout)
      const planEmailResult = await handleEmailForPendingPlan(message, tenantId);
      if (planEmailResult.handled) {
        await sendWhatsAppMessage(message.phone, planEmailResult.response!, credentials);
        await saveMessage(context.conversation.id, 'assistant', planEmailResult.response!, context.lead.id);

        if (planEmailResult.paymentLinkSent) {
          // Update lead stage to payment_pending
          waitUntil((async () => {
            try {
              await updateLeadStage(context.lead.id, 'Hot');
            } catch (err) {
              console.error('[Webhook] Update stage error:', err);
            }
          })());
        }

        return NextResponse.json({ status: 'ok', flow: 'payment_link_sent' });
      }

      // ============================================
      // LLM FLOW
      // ============================================

      // Detect alumni/existing customer and inject context
      const alumniKeywords = ['ya soy cliente', 'ya cursé', 'ya curse', 'ya tomé', 'ya tome', 'ya compré', 'ya compre', 'soy alumno', 'soy alumna', 'ya tengo loomi', 'ya lo tengo'];
      const isAlumni = ['Ganado', 'customer', 'alumno', 'won'].includes(context.lead.stage) ||
        alumniKeywords.some(kw => message.text.toLowerCase().includes(kw));

      if (isAlumni && context.memory) {
        context.memory += '\n[ALUMNO/CLIENTE EXISTENTE] No le vendas. Pregunta cómo le ha ido, si necesita ayuda con algo, o si tiene dudas sobre su cuenta.';
      } else if (isAlumni) {
        context.memory = '[ALUMNO/CLIENTE EXISTENTE] No le vendas. Pregunta cómo le ha ido, si necesita ayuda con algo, o si tiene dudas sobre su cuenta.';
      }

      // Check for handoff triggers before calling agent (with context for false-positive prevention)
      const handoffTrigger = detectHandoffTrigger(
        message.text,
        context.recentMessages.map(m => ({ role: m.role, content: m.content }))
      );
      const hasRepeatedFailures = detectRepeatedFailures(
        context.recentMessages.map(m => ({ role: m.role, content: m.content }))
      );

      // Immediate handoff for explicit triggers or repeated failures
      if (handoffTrigger || hasRepeatedFailures) {
        const reason = hasRepeatedFailures ? 'repeated_failures' : handoffTrigger!.reason;
        const priority = hasRepeatedFailures ? 'critical' : handoffTrigger!.priority;

        console.log(`[Webhook] Handoff triggered: ${reason} (priority: ${priority})`);

        const handoffResult = await executeHandoff({
          phone: message.phone,
          name: context.lead.name || 'Cliente',
          email: context.lead.email || undefined,
          company: context.lead.company || undefined,
          industry: context.lead.industry || undefined,
          leadId: context.lead.id,
          conversationId: context.conversation.id,
          recentMessages: context.recentMessages.slice(-5).map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          })),
          reason,
          priority,
          currentStage: context.lead.stage,
          credentials
        });

        if (handoffResult.notifiedClient) {
          const clientMsg = REASON_CONFIG[reason]?.clientMessage || 'Te comunico con alguien del equipo.';
          await saveMessage(context.conversation.id, 'assistant', clientMsg, context.lead.id);
        }

        return NextResponse.json({
          status: 'handoff',
          handoffId: handoffResult.handoffId,
          reason
        });
      }

      let result;
      let t2: number;
      try {
        // Inject WhatsApp credentials into agent config for tool use
        const configWithCreds = credentials && agentConfig
          ? { ...agentConfig, whatsappCredentials: credentials }
          : agentConfig;

        result = await withWebhookTimeout(
          processMessageGraph(message.text, context, configWithCreds, preloadedConversationState)
        );
        t2 = performance.now();
      } catch (agentError) {
        // Webhook timeout: send fallback message + handoff
        if (agentError instanceof WebhookTimeoutError) {
          console.error(`[Webhook] TIMEOUT after ${WEBHOOK_TIMEOUT_MS}ms for ${message.phone}`);
          waitUntil((async () => {
            try {
              await sendWhatsAppMessage(
                message.phone,
                'Disculpa la demora, estoy tardando más de lo normal. Te comunico con alguien del equipo.',
                credentials
              );
              await handoffOnServiceError(
                message.phone,
                context.lead.name || 'Cliente',
                'webhook',
                'Webhook timeout: processing exceeded 25s',
                context.recentMessages.slice(-5).map(m => ({
                  role: m.role as 'user' | 'assistant',
                  content: m.content
                })),
                credentials
              );
            } catch (err) {
              console.error('[Webhook] Timeout fallback error:', err);
            }
          })());
          return NextResponse.json({ status: 'timeout_handoff' });
        }

        console.error('Agent error:', agentError);

        // Use new handoff system for agent errors
        const recentMsgs = context.recentMessages.slice(-5).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }));

        await handoffOnAgentError(
          message.phone,
          context.lead.name || 'Cliente',
          String(agentError),
          recentMsgs,
          credentials
        );

        return NextResponse.json({ status: 'agent_error_handoff' });
      }

      console.log(`Response: ${result.response.substring(0, 50)}...`);

      // Check if agent triggered schedule list
      if (result.showScheduleList) {
        console.log('[Webhook] Agent triggered schedule list');
        const slots = await getAvailableTimeSlots(0, 2, calConfig);
        if (slots.length > 0) {
          // Send agent's response first, then the schedule list
          if (result.response) {
            await sendWhatsAppMessage(message.phone, result.response, credentials);
            await saveMessage(context.conversation.id, 'assistant', result.response, context.lead.id);
          }
          await sendScheduleList(message.phone, slots, 'Horarios disponibles', 'Elige el que te funcione:', credentials);
          await setScheduleListSent(message.phone, tenantId);
          await saveMessage(context.conversation.id, 'assistant', '[Lista de horarios enviada]', context.lead.id);
          return NextResponse.json({ status: 'ok', flow: 'schedule_list_from_agent' });
        } else {
          // No slots available, send message with Cal.com link as fallback
          const fallbackMsg = 'No tengo horarios disponibles en estos días. Puedes agendar directo aquí: https://cal.com/loomi/demo';
          await sendWhatsAppMessage(message.phone, fallbackMsg, credentials);
          await saveMessage(context.conversation.id, 'assistant', fallbackMsg, context.lead.id);
          return NextResponse.json({ status: 'ok', flow: 'schedule_fallback' });
        }
      }

      // Guard against empty responses
      if (!result.response || !result.response.trim()) {
        console.warn(`[Webhook] Empty response for ${message.phone}`);
        if (result.paymentLinkSent) {
          result.response = 'Listo, te mandé el link de pago por aquí. Cualquier duda me dices.';
        } else {
          result.response = 'Dame un momento, estoy procesando tu solicitud.';
        }
      }

      // Send response (saveMessage deferred to waitUntil)
      await sendWhatsAppMessage(message.phone, result.response, credentials);
      const t3 = performance.now();
      console.log(`⏱️ [Webhook] Preprocess: ${(t1 - t0).toFixed(0)}ms | Pipeline: ${(t2! - t1).toFixed(0)}ms | WA send: ${(t3 - t2!).toFixed(0)}ms | TOTAL: ${(t3 - t0).toFixed(0)}ms`);

      // Background operations (non-blocking, isolated with allSettled)
      waitUntil((async () => {
        // Critical: save message with retry (3 attempts, exponential backoff)
        await retryAsync(
          () => saveMessage(context.conversation.id, 'assistant', result.response, context.lead.id),
          {
            maxAttempts: 3,
            onRetry: (err, attempt) => console.warn(`[Webhook] saveMessage retry ${attempt}:`, err),
          }
        ).catch(err => console.error('[Webhook] saveMessage failed after retries:', err));

        // All remaining tasks run in parallel, each isolated with .catch()
        const backgroundTasks: Promise<unknown>[] = [];

        // Update industry if detected
        if (result.detectedIndustry) {
          backgroundTasks.push(
            updateLeadIndustry(context.lead.id, result.detectedIndustry)
              .catch(err => console.error('[Webhook] updateLeadIndustry error:', err))
          );
        }

        // Schedule "said later" follow-up
        if (result.saidLater) {
          backgroundTasks.push(
            scheduleSaidLaterFollowUp(context.lead.id, context.lead)
              .catch(err => console.error('[Webhook] saidLater follow-up error:', err))
          );
        }

        // Schedule re-engagement for early conversations that end with a question
        const isEarlyConversation = context.recentMessages.length <= 4;
        const endsWithQuestion = result.response.trim().endsWith('?');
        if (isEarlyConversation && endsWithQuestion && !result.saidLater && !result.escalatedToHuman) {
          backgroundTasks.push(
            scheduleReengagement(context.lead.id, context.lead, context.memory)
              .catch(err => console.error('[Webhook] re-engagement error:', err))
          );
        }

        // Sync to HubSpot
        backgroundTasks.push(
          syncLeadToHubSpot({
            phone: context.lead.phone,
            name: context.lead.name,
            company: context.lead.company,
            stage: context.lead.stage,
            messages: [
              ...context.recentMessages,
              { role: 'user', content: message.text },
              { role: 'assistant', content: result.response }
            ]
          }).catch(err => console.error('[Webhook] HubSpot sync error:', err))
        );

        // Generate memory if needed (skipped when LangGraph handles summarization)
        if (process.env.USE_LANGGRAPH !== 'true') {
          backgroundTasks.push(
            (async () => {
              if (await shouldGenerateMemory(context.conversation.startedAt, context.recentMessages.length + 2)) {
                await generateMemory(context.lead.id, [
                  ...context.recentMessages,
                  { id: '', role: 'user', content: message.text, timestamp: new Date() },
                  { id: '', role: 'assistant', content: result.response, timestamp: new Date() },
                ]);
              }
            })().catch(err => console.error('[Webhook] memory generation error:', err))
          );
        }

        // Wait for all background tasks, none can crash the others
        const results = await Promise.allSettled(backgroundTasks);
        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length > 0) {
          console.warn(`[Webhook] ${failed.length}/${results.length} background tasks failed`);
        }
      })());

      return NextResponse.json({
        status: 'ok',
        tokensUsed: result.tokensUsed
      });

    } finally {
      await Promise.all([
        clearProcessing(message.messageId),
        releaseConversationLock(message.phone, tenantId)
      ]);
    }
  } catch (error) {
    console.error('Webhook error:', error);

    // Try to extract phone from body for handoff notification
    // Note: In outer catch we may not have parsed message, so this is best-effort
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log for monitoring but don't fail silently
    console.error(`[Webhook] Critical error: ${errorMessage}`);

    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
