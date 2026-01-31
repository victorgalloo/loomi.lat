/**
 * WhatsApp Webhook Handler
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
import {
  sendWhatsAppMessage,
  sendScheduleList,
  notifyFallback,
  TimeSlot
} from '@/lib/whatsapp/send';
import { getConversationContext } from '@/lib/memory/context';
import { simpleAgent } from '@/lib/agents/simple-agent';
import {
  checkRateLimit,
  isProcessing,
  clearProcessing,
  setPendingSlot,
  getPendingSlot,
  clearPendingSlot,
  PendingSlot,
  setPendingPlan,
  getPendingPlan,
  clearPendingPlan,
  PendingPlan
} from '@/lib/ratelimit';
import { createCheckoutSession, getPlanDisplayName } from '@/lib/stripe/checkout';
import { sendPaymentLink } from '@/lib/whatsapp/send';
import { saveMessage, createAppointment, updateLeadStage, updateLeadIndustry } from '@/lib/memory/supabase';
import { generateMemory, shouldGenerateMemory } from '@/lib/memory/generate';
import { syncLeadToHubSpot } from '@/lib/integrations/hubspot';
import { checkAvailability, createEvent } from '@/lib/tools/calendar';
import { ConversationContext } from '@/types';
import {
  scheduleDemoReminders,
  scheduleSaidLaterFollowUp,
  cancelFollowUps
} from '@/lib/followups/scheduler';

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
async function getAvailableTimeSlots(skip: number = 0, daysCount: number = 2): Promise<TimeSlot[]> {
  try {
    const dates = getNextBusinessDays(daysCount, skip);
    console.log(`[getAvailableTimeSlots] Checking dates: ${dates.join(',')}`);

    const allSlots = await checkAvailability(dates.join(','));
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
  context: ConversationContext
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
  await setPendingSlot(message.phone, pendingSlot);

  return {
    handled: true,
    response: `Perfecto, ${formatDateSpanish(date)} a las ${formatTime12h(time)}. ¿A qué correo te mando la invitación?`
  };
}

/**
 * Handle button reply
 */
async function handleButtonReply(
  message: ParsedWhatsAppMessage
): Promise<{ handled: boolean; showScheduleList?: boolean }> {
  if (message.interactiveType !== 'button_reply' || !message.interactiveId) {
    return { handled: false };
  }

  if (message.interactiveId === 'change_time') {
    await clearPendingSlot(message.phone);
    return { handled: true, showScheduleList: true };
  }

  return { handled: false };
}

/**
 * Handle plan selection from list
 */
async function handlePlanSelection(
  message: ParsedWhatsAppMessage
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
  await setPendingPlan(message.phone, pendingPlan);

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
  message: ParsedWhatsAppMessage
): Promise<{
  handled: boolean;
  response?: string;
  paymentLinkSent?: boolean;
}> {
  // Start pending plan lookup early
  const pendingPlanPromise = getPendingPlan(message.phone);

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
    await clearPendingPlan(message.phone);

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
    await clearPendingPlan(message.phone);
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
  context: ConversationContext
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
  const pendingSlotPromise = getPendingSlot(message.phone);

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
  });

  // Clear pending slot
  await clearPendingSlot(message.phone);

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
  try {
    const body = await request.json();
    const message = parseWhatsAppWebhook(body);

    // Early exit: Not a message event
    if (!message) {
      return NextResponse.json({ status: 'ok' });
    }

    // Early exit: Duplicate processing
    if (await isProcessing(message.messageId)) {
      console.log(`Message ${message.messageId} already processing`);
      return NextResponse.json({ status: 'duplicate' });
    }

    try {
      // Check rate limits
      const rateLimit = await checkRateLimit(message.phone);
      if (!rateLimit.allowed) {
        console.log(`Rate limited: ${message.phone} - ${rateLimit.reason}`);
        if (rateLimit.reason === 'minute_limit') {
          await sendWhatsAppMessage(message.phone, 'Dame un momento para procesar tus mensajes anteriores.');
        }
        return NextResponse.json({ status: 'rate_limited' });
      }

      // Get conversation context
      const context = await getConversationContext(message);

      // Save message and cancel re-engagement in parallel (async-parallel)
      await Promise.all([
        saveMessage(context.conversation.id, 'user', message.text, context.lead.id),
        cancelFollowUps(context.lead.id, ['cold_lead_reengagement', 'reengagement_2', 'reengagement_3'])
      ]);

      // ============================================
      // DETERMINISTIC FLOW - Handle interactive messages first
      // ============================================

      // 1. Handle slot selection
      const slotSelection = await handleSlotSelection(message, context);
      if (slotSelection.handled) {
        if (slotSelection.showMoreDays) {
          console.log(`[Webhook] User wants more days`);
          waitUntil(
            (async () => {
              const moreSlots = await getAvailableTimeSlots(2, 3);
              if (moreSlots.length > 0) {
                await sendScheduleList(message.phone, moreSlots, 'Más horarios', 'Aquí tienes más opciones:');
                saveMessage(context.conversation.id, 'assistant', '[Lista de más horarios]', context.lead.id).catch(console.error);
              } else {
                await sendWhatsAppMessage(message.phone, 'No hay más horarios disponibles esta semana. ¿Te escribo la próxima?');
              }
            })()
          );
          return NextResponse.json({ status: 'ok', flow: 'more_days_requested' });
        }

        await sendWhatsAppMessage(message.phone, slotSelection.response!);
        await saveMessage(context.conversation.id, 'assistant', slotSelection.response!, context.lead.id);
        return NextResponse.json({ status: 'ok', flow: 'slot_selected' });
      }

      // 1b. Check for "other days" via text
      if (wantsOtherDays(message.text)) {
        console.log(`[Webhook] User asking for other days via text`);
        waitUntil(
          (async () => {
            await sendWhatsAppMessage(message.phone, 'Claro, déjame mostrarte más opciones.');
            const moreSlots = await getAvailableTimeSlots(2, 3);
            if (moreSlots.length > 0) {
              await sendScheduleList(message.phone, moreSlots, 'Más horarios', 'Aquí tienes más opciones:');
              saveMessage(context.conversation.id, 'assistant', '[Lista de más horarios]', context.lead.id).catch(console.error);
            } else {
              await sendWhatsAppMessage(message.phone, 'No hay más horarios disponibles esta semana. ¿Te escribo la próxima?');
            }
          })()
        );
        return NextResponse.json({ status: 'ok', flow: 'more_days_text' });
      }

      // 2. Handle button reply
      const buttonReply = await handleButtonReply(message);
      if (buttonReply.handled && buttonReply.showScheduleList) {
        console.log(`[Webhook] User wants to change time`);
        const slots = await getAvailableTimeSlots();
        if (slots.length > 0) {
          await sendScheduleList(message.phone, slots, 'Elige otro horario', 'Estos son los horarios disponibles:');
          await saveMessage(context.conversation.id, 'assistant', '[Lista de horarios enviada]', context.lead.id);
        } else {
          await sendWhatsAppMessage(message.phone, 'No hay horarios disponibles en este momento. Te contactamos pronto.');
          await saveMessage(context.conversation.id, 'assistant', 'No hay horarios disponibles.', context.lead.id);
        }
        return NextResponse.json({ status: 'ok', flow: 'schedule_list_sent' });
      }

      // 3. Handle email for pending slot
      const emailResult = await handleEmailForPendingSlot(message, context);
      if (emailResult.handled) {
        await sendWhatsAppMessage(message.phone, emailResult.response!);
        await saveMessage(context.conversation.id, 'assistant', emailResult.response!, context.lead.id);

        if (emailResult.appointmentBooked) {
          const { eventId, date, time, email, meetingUrl } = emailResult.appointmentBooked;
          const scheduledAt = new Date(`${date}T${time}:00`);

          // Schedule follow-ups and sync in background
          waitUntil((async () => {
            try {
              const appointment = await createAppointment(context.lead.id, scheduledAt, eventId);
              await updateLeadStage(context.lead.phone, 'demo_scheduled');

              await scheduleDemoReminders(context.lead.id, appointment.id, scheduledAt, context.lead);

              await syncLeadToHubSpot({
                phone: context.lead.phone,
                name: context.lead.name,
                email,
                stage: 'demo_scheduled',
                messages: [...context.recentMessages, { role: 'user', content: message.text }],
                appointmentBooked: { date, time, meetingUrl }
              });
            } catch (err) {
              console.error('[Webhook] After error:', err);
            }
          })());
        }

        return NextResponse.json({ status: 'ok', flow: 'appointment_booked' });
      }

      // 4. Handle plan selection (Stripe)
      const planSelection = await handlePlanSelection(message);
      if (planSelection.handled) {
        await sendWhatsAppMessage(message.phone, planSelection.response!);
        await saveMessage(context.conversation.id, 'assistant', planSelection.response!, context.lead.id);
        return NextResponse.json({ status: 'ok', flow: 'plan_selected' });
      }

      // 5. Handle email for pending plan (Stripe checkout)
      const planEmailResult = await handleEmailForPendingPlan(message);
      if (planEmailResult.handled) {
        await sendWhatsAppMessage(message.phone, planEmailResult.response!);
        await saveMessage(context.conversation.id, 'assistant', planEmailResult.response!, context.lead.id);

        if (planEmailResult.paymentLinkSent) {
          // Update lead stage to payment_pending
          waitUntil((async () => {
            try {
              await updateLeadStage(context.lead.phone, 'payment_pending');
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

      let result;
      try {
        result = await simpleAgent(message.text, context);
      } catch (agentError) {
        console.error('Agent error:', agentError);
        notifyFallback({
          type: 'agent_error',
          clientPhone: message.phone,
          clientName: context.lead.name,
          error: String(agentError)
        }).catch(console.error);
        await sendWhatsAppMessage(message.phone, 'Perdón, tuve un problema técnico. Te contacto en un momento.');
        return NextResponse.json({ status: 'agent_error' });
      }

      console.log(`Response: ${result.response.substring(0, 50)}...`);

      // Send response
      await sendWhatsAppMessage(message.phone, result.response);
      await saveMessage(context.conversation.id, 'assistant', result.response, context.lead.id);

      // Background operations
      waitUntil((async () => {
        try {
          // Update industry if detected
          if (result.detectedIndustry) {
            await updateLeadIndustry(context.lead.phone, result.detectedIndustry);
          }

          // Schedule "said later" follow-up
          if (result.saidLater) {
            await scheduleSaidLaterFollowUp(context.lead.id, context.lead);
          }

          // Sync to HubSpot
          await syncLeadToHubSpot({
            phone: context.lead.phone,
            name: context.lead.name,
            company: context.lead.company,
            stage: context.lead.stage,
            messages: [
              ...context.recentMessages,
              { role: 'user', content: message.text },
              { role: 'assistant', content: result.response }
            ]
          });

          // Generate memory if needed
          if (await shouldGenerateMemory(context.conversation.startedAt, context.recentMessages.length + 2)) {
            await generateMemory(context.lead.id, [
              ...context.recentMessages,
              { id: '', role: 'user', content: message.text, timestamp: new Date() },
              { id: '', role: 'assistant', content: result.response, timestamp: new Date() },
            ]);
          }
        } catch (err) {
          console.error('[Webhook] After error:', err);
        }
      })());

      return NextResponse.json({
        status: 'ok',
        tokensUsed: result.tokensUsed
      });

    } finally {
      await clearProcessing(message.messageId);
    }
  } catch (error) {
    console.error('Webhook error:', error);
    notifyFallback({
      type: 'general_error',
      error: String(error),
      details: 'Error en webhook principal'
    }).catch(console.error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
