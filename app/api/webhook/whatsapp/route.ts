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
import {
  sendWhatsAppMessage,
  sendScheduleList,
  notifyFallback,
  markAsRead,
  TimeSlot,
  TenantCredentials
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
import { getTenantFromPhoneNumberId, getAgentConfig, AgentConfig } from '@/lib/tenant/context';
import { trackDemoScheduled } from '@/lib/integrations/meta-conversions';

// Temporal feature flags (no gRPC connection required)
function isTemporalEnabled(feature: 'followups' | 'booking' | 'payments' | 'integrations'): boolean {
  const flags: Record<string, string | undefined> = {
    followups: process.env.USE_TEMPORAL_FOLLOWUPS,
    booking: process.env.USE_TEMPORAL_BOOKING,
    payments: process.env.USE_TEMPORAL_PAYMENTS,
    integrations: process.env.USE_TEMPORAL_INTEGRATIONS,
  };
  return flags[feature] === 'true';
}

// Dynamic Temporal imports - only loads @temporalio/client when actually needed
// Returns null on any error (import or connection) to allow fallback to legacy scheduler
type TemporalModule = typeof import('@/lib/temporal/client');
let temporalModuleCache: TemporalModule | null = null;
let temporalFailed = false;
let temporalLastAttempt = 0;
const TEMPORAL_RETRY_INTERVAL_MS = 60000; // Retry connection every 60s after failure

async function getTemporalModule(): Promise<TemporalModule | null> {
  // Return cached result if available and not expired
  if (temporalFailed) {
    if (Date.now() - temporalLastAttempt < TEMPORAL_RETRY_INTERVAL_MS) {
      return null; // Still in cooldown, use fallback
    }
    // Cooldown expired, retry
    temporalFailed = false;
  }

  if (temporalModuleCache) {
    return temporalModuleCache;
  }

  try {
    temporalLastAttempt = Date.now();
    const module = await import('@/lib/temporal/client');
    // Test connection by getting client (will throw on timeout/connection error)
    await module.getTemporalClient();
    temporalModuleCache = module;
    return module;
  } catch (error) {
    console.error('[Temporal] Failed to load/connect:', error instanceof Error ? error.message : error);
    temporalFailed = true;
    return null;
  }
}

// Temporal types (inline to avoid import)
interface TemporalLead {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  company: string | null;
  industry: string | null;
  stage: string;
  challenge?: string | null;
}

interface TenantContext {
  tenantId: string;
  tier: 'free' | 'starter' | 'growth' | 'business' | 'enterprise';
  limits: {
    maxConcurrentWorkflows: number;
    maxMessagesPerDay: number;
    maxFollowUpsPerLead: number;
    workflowTimeoutMinutes: number;
  };
}

// Tier limits (inline to avoid Temporal import)
const TIER_LIMITS = {
  free: { maxConcurrentWorkflows: 5, maxMessagesPerDay: 50, maxFollowUpsPerLead: 2, workflowTimeoutMinutes: 60 },
  starter: { maxConcurrentWorkflows: 20, maxMessagesPerDay: 500, maxFollowUpsPerLead: 5, workflowTimeoutMinutes: 1440 },
  growth: { maxConcurrentWorkflows: 100, maxMessagesPerDay: 2000, maxFollowUpsPerLead: 10, workflowTimeoutMinutes: 10080 },
  business: { maxConcurrentWorkflows: 500, maxMessagesPerDay: 10000, maxFollowUpsPerLead: 20, workflowTimeoutMinutes: 43200 },
  enterprise: { maxConcurrentWorkflows: -1, maxMessagesPerDay: -1, maxFollowUpsPerLead: -1, workflowTimeoutMinutes: 129600 },
};

function buildTenantContext(tenantId: string, tier: TenantContext['tier'] = 'starter'): TenantContext {
  return { tenantId, tier, limits: TIER_LIMITS[tier] };
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

    // Multi-tenant: Get tenant credentials from phone_number_id
    let credentials: TenantCredentials | undefined;
    let tenantId: string | undefined;
    let agentConfig: AgentConfig | undefined;

    if (message.phoneNumberId) {
      const tenantData = await getTenantFromPhoneNumberId(message.phoneNumberId);
      if (tenantData) {
        tenantId = tenantData.tenantId;
        credentials = {
          phoneNumberId: message.phoneNumberId,
          accessToken: tenantData.accessToken,
          tenantId: tenantData.tenantId
        };
        // Load agent config for this tenant
        agentConfig = await getAgentConfig(tenantId) || undefined;
        console.log(`[Webhook] Multi-tenant: Routing to tenant ${tenantId}`);
      } else {
        // Fallback to environment variables for backward compatibility
        console.log(`[Webhook] No tenant found for phone_number_id ${message.phoneNumberId}, using env vars`);
      }
    }

    try {
      // Check rate limits
      const rateLimit = await checkRateLimit(message.phone);
      if (!rateLimit.allowed) {
        console.log(`Rate limited: ${message.phone} - ${rateLimit.reason}`);
        if (rateLimit.reason === 'minute_limit') {
          await sendWhatsAppMessage(message.phone, 'Dame un momento para procesar tus mensajes anteriores.', credentials);
        }
        return NextResponse.json({ status: 'rate_limited' });
      }

      // Mark message as read immediately (shows blue checkmarks)
      await markAsRead(message.messageId, credentials);

      // Get conversation context (with tenant_id if available)
      const context = await getConversationContext(message, tenantId);

      // Build TenantContext for Temporal workflows
      // Default to 'starter' tier if not specified (can be loaded from DB in production)
      const tenantContext: TenantContext | null = tenantId
        ? buildTenantContext(tenantId, 'starter')
        : null;

      // Save message and cancel re-engagement in parallel (async-parallel)
      const cancelFollowUpsPromise = isTemporalEnabled('followups') && tenantContext
        ? getTemporalModule().then(t => t?.cancelFollowUps(tenantContext.tenantId, context.lead.id))
        : cancelFollowUps(context.lead.id, ['cold_lead_reengagement', 'reengagement_2', 'reengagement_3']);

      await Promise.all([
        saveMessage(context.conversation.id, 'user', message.text, context.lead.id),
        cancelFollowUpsPromise
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
                await sendScheduleList(message.phone, moreSlots, 'Más horarios', 'Aquí tienes más opciones:', credentials);
                saveMessage(context.conversation.id, 'assistant', '[Lista de más horarios]', context.lead.id).catch(console.error);
              } else {
                await sendWhatsAppMessage(message.phone, 'No hay más horarios disponibles esta semana. ¿Te escribo la próxima?', credentials);
              }
            })()
          );
          return NextResponse.json({ status: 'ok', flow: 'more_days_requested' });
        }

        await sendWhatsAppMessage(message.phone, slotSelection.response!, credentials);
        await saveMessage(context.conversation.id, 'assistant', slotSelection.response!, context.lead.id);
        return NextResponse.json({ status: 'ok', flow: 'slot_selected' });
      }

      // 1b. Check for "other days" via text
      if (wantsOtherDays(message.text)) {
        console.log(`[Webhook] User asking for other days via text`);
        waitUntil(
          (async () => {
            await sendWhatsAppMessage(message.phone, 'Claro, déjame mostrarte más opciones.', credentials);
            const moreSlots = await getAvailableTimeSlots(2, 3);
            if (moreSlots.length > 0) {
              await sendScheduleList(message.phone, moreSlots, 'Más horarios', 'Aquí tienes más opciones:', credentials);
              saveMessage(context.conversation.id, 'assistant', '[Lista de más horarios]', context.lead.id).catch(console.error);
            } else {
              await sendWhatsAppMessage(message.phone, 'No hay más horarios disponibles esta semana. ¿Te escribo la próxima?', credentials);
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
          await sendScheduleList(message.phone, slots, 'Elige otro horario', 'Estos son los horarios disponibles:', credentials);
          await saveMessage(context.conversation.id, 'assistant', '[Lista de horarios enviada]', context.lead.id);
        } else {
          await sendWhatsAppMessage(message.phone, 'No hay horarios disponibles en este momento. Te contactamos pronto.', credentials);
          await saveMessage(context.conversation.id, 'assistant', 'No hay horarios disponibles.', context.lead.id);
        }
        return NextResponse.json({ status: 'ok', flow: 'schedule_list_sent' });
      }

      // 3. Handle email for pending slot
      const emailResult = await handleEmailForPendingSlot(message, context);
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
              await updateLeadStage(context.lead.phone, 'Demo Agendada');

              // Use Temporal for follow-ups if enabled, otherwise use legacy scheduler
              if (isTemporalEnabled('followups') && tenantContext) {
                const temporalLead: TemporalLead = {
                  id: context.lead.id,
                  phone: context.lead.phone,
                  name: context.lead.name,
                  email: context.lead.email || email || null,
                  company: context.lead.company ?? null,
                  industry: context.lead.industry ?? null,
                  stage: 'demo_scheduled',
                  challenge: context.lead.challenge ?? null
                };
                const temporal = await getTemporalModule();
                if (temporal) {
                  await temporal.startDemoRemindersWorkflow({
                    tenant: tenantContext,
                    leadId: context.lead.id,
                    lead: temporalLead,
                    appointmentId: appointment.id,
                    scheduledAt: scheduledAt.toISOString()
                  });
                  console.log('[Webhook] Started Temporal demo reminders workflow');
                } else {
                  console.warn('[Webhook] Temporal module unavailable, falling back to legacy reminders');
                  await scheduleDemoReminders(context.lead.id, appointment.id, scheduledAt, context.lead);
                }
              } else {
                await scheduleDemoReminders(context.lead.id, appointment.id, scheduledAt, context.lead);
              }

              // Use Temporal for integrations if enabled
              if (isTemporalEnabled('integrations') && tenantContext) {
                const temporalLead: TemporalLead = {
                  id: context.lead.id,
                  phone: context.lead.phone,
                  name: context.lead.name,
                  email: context.lead.email || email || null,
                  company: context.lead.company ?? null,
                  industry: context.lead.industry ?? null,
                  stage: 'demo_scheduled'
                };
                const temporal = await getTemporalModule();
                if (temporal) {
                  await temporal.startIntegrationSyncWorkflow({
                    tenant: tenantContext,
                    leadId: context.lead.id,
                    lead: temporalLead,
                    conversationId: context.conversation.id,
                    eventType: 'demo_scheduled'
                  });
                  console.log('[Webhook] Started Temporal integration sync workflow');
                } else {
                  console.warn('[Webhook] Temporal module unavailable, falling back to direct HubSpot sync');
                  await syncLeadToHubSpot({
                    phone: context.lead.phone,
                    name: context.lead.name,
                    email,
                    stage: 'Demo Agendada',
                    messages: [...context.recentMessages, { role: 'user', content: message.text }],
                    appointmentBooked: { date, time, meetingUrl }
                  });
                }
              } else {
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
              }
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
        await sendWhatsAppMessage(message.phone, planSelection.response!, credentials);
        await saveMessage(context.conversation.id, 'assistant', planSelection.response!, context.lead.id);
        return NextResponse.json({ status: 'ok', flow: 'plan_selected' });
      }

      // 5. Handle email for pending plan (Stripe checkout)
      const planEmailResult = await handleEmailForPendingPlan(message);
      if (planEmailResult.handled) {
        await sendWhatsAppMessage(message.phone, planEmailResult.response!, credentials);
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
        // Pass agent config for tenant-specific behavior
        result = await simpleAgent(message.text, context, agentConfig);
      } catch (agentError) {
        console.error('Agent error:', agentError);
        notifyFallback({
          type: 'agent_error',
          clientPhone: message.phone,
          clientName: context.lead.name,
          error: String(agentError),
          credentials
        }).catch(console.error);
        await sendWhatsAppMessage(message.phone, 'Perdón, tuve un problema técnico. Te contacto en un momento.', credentials);
        return NextResponse.json({ status: 'agent_error' });
      }

      console.log(`Response: ${result.response.substring(0, 50)}...`);

      // Check if agent triggered schedule list
      if (result.showScheduleList) {
        console.log('[Webhook] Agent triggered schedule list');
        const slots = await getAvailableTimeSlots();
        if (slots.length > 0) {
          // Send agent's response first, then the schedule list
          if (result.response) {
            await sendWhatsAppMessage(message.phone, result.response, credentials);
            await saveMessage(context.conversation.id, 'assistant', result.response, context.lead.id);
          }
          await sendScheduleList(message.phone, slots, 'Horarios disponibles', 'Elige el que te funcione:', credentials);
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

      // Send response
      await sendWhatsAppMessage(message.phone, result.response, credentials);
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
            if (isTemporalEnabled('followups') && tenantContext) {
              const temporalLead: TemporalLead = {
                id: context.lead.id,
                phone: context.lead.phone,
                name: context.lead.name,
                email: context.lead.email ?? null,
                company: context.lead.company ?? null,
                industry: context.lead.industry ?? null,
                stage: context.lead.stage,
                challenge: context.lead.challenge ?? null
              };
              const temporal = await getTemporalModule();
              if (temporal) {
                await temporal.startFollowUpWorkflow({
                  tenant: tenantContext,
                  leadId: context.lead.id,
                  lead: temporalLead,
                  type: 'said_later'
                });
                console.log('[Webhook] Started Temporal said_later workflow');
              } else {
                console.warn('[Webhook] Temporal module unavailable, falling back to legacy follow-up');
                await scheduleSaidLaterFollowUp(context.lead.id, context.lead);
              }
            } else {
              await scheduleSaidLaterFollowUp(context.lead.id, context.lead);
            }
          }

          // Sync to HubSpot (use Temporal if integrations enabled)
          if (isTemporalEnabled('integrations') && tenantContext) {
            const temporalLead: TemporalLead = {
              id: context.lead.id,
              phone: context.lead.phone,
              name: context.lead.name,
              email: context.lead.email ?? null,
              company: context.lead.company ?? null,
              industry: context.lead.industry ?? null,
              stage: context.lead.stage
            };
            const temporal = await getTemporalModule();
            if (temporal) {
              await temporal.startIntegrationSyncWorkflow({
                tenant: tenantContext,
                leadId: context.lead.id,
                lead: temporalLead,
                conversationId: context.conversation.id,
                eventType: 'conversation_ended'
              });
            } else {
              console.warn('[Webhook] Temporal module unavailable, falling back to direct HubSpot sync');
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
            }
          } else {
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
      // Note: credentials not available in outer catch, uses env fallback
    }).catch(console.error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
