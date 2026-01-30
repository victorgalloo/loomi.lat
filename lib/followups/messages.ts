/**
 * Follow-up Message Templates
 * Generates personalized follow-up messages based on context
 */

import { FollowUpType } from './types';
import { Lead, Message } from '@/types';
import { detectIndustry, getIndustryContext, getIndustryExample } from '@/lib/agents/industry';

interface MessageContext {
  lead: Lead;
  memory?: string | null;
  recentMessages?: Message[];
  appointmentDate?: string;
  appointmentTime?: string;
  attemptNumber?: number;
}

/**
 * Format time for display (12h format in Spanish)
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format date for display (Spanish)
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${dias[date.getDay()]} ${date.getDate()} de ${meses[date.getMonth()]}`;
}

/**
 * Get the lead's first name
 */
function getFirstName(lead: Lead): string {
  if (!lead.name || lead.name === 'Usuario') return '';
  return lead.name.split(' ')[0];
}

/**
 * Generate pre-demo reminder message (30 min before)
 */
function generatePreDemoReminder(ctx: MessageContext): string {
  const name = getFirstName(ctx.lead);
  const greeting = name ? `Hola ${name}` : 'Hola';
  const time = ctx.appointmentTime ? formatTime(ctx.appointmentTime) : 'en 30 minutos';

  return `${greeting}, te recuerdo que tenemos nuestra demo en 30 minutos (${time}). El link de la reunión ya te lo envié antes. ¿Todo listo?`;
}

/**
 * Generate pre-demo 24h reminder
 */
function generatePreDemo24h(ctx: MessageContext): string {
  const name = getFirstName(ctx.lead);
  const greeting = name ? `Hola ${name}` : 'Hola';
  const dateStr = ctx.appointmentDate ? formatDate(ctx.appointmentDate) : 'mañana';
  const timeStr = ctx.appointmentTime ? formatTime(ctx.appointmentTime) : '';

  return `${greeting}, te recuerdo que mañana ${dateStr}${timeStr ? ` a las ${timeStr}` : ''} tenemos nuestra demo. Si necesitas reagendar, avísame.`;
}

/**
 * Generate post-demo follow-up
 */
function generatePostDemo(ctx: MessageContext): string {
  const name = getFirstName(ctx.lead);
  const greeting = name ? `${name}, ` : '';

  return `${greeting}Gracias por tu tiempo en la demo. ¿Qué te pareció? ¿Tienes alguna pregunta adicional?`;
}

/**
 * Generate no-show follow-up
 */
function generateNoShowFollowup(ctx: MessageContext): string {
  const name = getFirstName(ctx.lead);
  const greeting = name ? `Hola ${name}` : 'Hola';

  return `${greeting}, veo que no pudiste conectarte a la demo. No hay problema, entiendo que pueden surgir imprevistos. ¿Te parece si reagendamos? ¿Qué día te funciona mejor?`;
}

/**
 * Generate "said later" follow-up
 */
function generateSaidLaterFollowup(ctx: MessageContext): string {
  const name = getFirstName(ctx.lead);
  const greeting = name ? `Hola ${name}` : 'Hola';

  return `${greeting}, ayer quedamos en platicar hoy. ¿Tienes un momento para que te cuente cómo podemos ayudarte con tu negocio?`;
}

/**
 * Generate proposal reminder
 */
function generateProposalReminder(ctx: MessageContext): string {
  const name = getFirstName(ctx.lead);
  const greeting = name ? `Hola ${name}` : 'Hola';

  return `${greeting}, ¿pudiste revisar la propuesta? Si tienes dudas sobre algo, con gusto te las aclaro.`;
}

/**
 * Generate cold lead re-engagement message
 */
function generateColdLeadReengagement(ctx: MessageContext): string {
  const name = getFirstName(ctx.lead);
  const greeting = name ? `Hola ${name}` : 'Hola';

  // Detect industry for personalized message
  const industry = detectIndustry(
    [ctx.lead.company, ctx.lead.industry, ctx.memory].filter(Boolean).join(' ') || '',
    ctx.lead.industry
  );

  // First attempt - friendly reminder based on context
  if (!ctx.attemptNumber || ctx.attemptNumber === 1) {
    if (ctx.memory) {
      // Use memory to personalize
      return `${greeting}, quería dar seguimiento a nuestra conversación. ¿Sigues interesado en automatizar tu WhatsApp?`;
    }

    if (industry !== 'generic') {
      const benefit = getIndustryContext(industry).benefits[0];
      return `${greeting}, solo quería recordarte que podemos ayudarte a ${benefit.toLowerCase()}. ¿Te gustaría que agendemos una demo rápida?`;
    }

    return `${greeting}, ¿cómo vas? Quería saber si todavía te interesa ver cómo funciona nuestro agente de IA para WhatsApp.`;
  }

  return generateReengagementSequence(ctx);
}

/**
 * Generate re-engagement sequence messages (attempts 2-3)
 */
function generateReengagementSequence(ctx: MessageContext): string {
  const name = getFirstName(ctx.lead);
  const greeting = name ? `Hola ${name}` : 'Hola';
  const attempt = ctx.attemptNumber || 1;

  // Detect industry for personalized examples
  const industry = detectIndustry(
    [ctx.lead.company, ctx.lead.industry, ctx.memory].filter(Boolean).join(' ') || '',
    ctx.lead.industry
  );

  // Second attempt (5 days) - offer value
  if (attempt === 2) {
    if (industry !== 'generic') {
      const example = getIndustryExample(industry);
      return `${greeting}, te comparto un caso que puede interesarte: ${example}. Si quieres ver cómo aplicaría a tu negocio, dime y te muestro.`;
    }
    return `${greeting}, te comparto un dato: los negocios que usan IA en WhatsApp responden 10x más rápido y cierran hasta 30% más ventas. ¿Te gustaría ver cómo funcionaría para ti?`;
  }

  // Third attempt (2 weeks) - final, soft close
  return `${greeting}, es mi último mensaje de seguimiento. Si en algún momento te interesa explorar cómo automatizar tu WhatsApp, aquí estoy. ¡Éxito con tu negocio!`;
}

/**
 * Main function to generate follow-up message
 */
export function generateFollowUpMessage(
  type: FollowUpType,
  context: MessageContext
): string {
  switch (type) {
    case 'pre_demo_reminder':
      return generatePreDemoReminder(context);
    case 'pre_demo_24h':
      return generatePreDemo24h(context);
    case 'post_demo':
      return generatePostDemo(context);
    case 'no_show_followup':
      return generateNoShowFollowup(context);
    case 'said_later':
      return generateSaidLaterFollowup(context);
    case 'proposal_reminder':
      return generateProposalReminder(context);
    case 'cold_lead_reengagement':
      return generateColdLeadReengagement(context);
    case 'reengagement_2':
      return generateReengagementSequence({ ...context, attemptNumber: 2 });
    case 'reengagement_3':
      return generateReengagementSequence({ ...context, attemptNumber: 3 });
    default:
      return `Hola, ¿cómo puedo ayudarte hoy?`;
  }
}

/**
 * Check if we should send a re-engagement follow-up
 * Returns false if max attempts reached or lead is in wrong stage
 */
export function shouldSendReengagement(
  lead: Lead,
  attemptNumber: number
): boolean {
  // Don't re-engage if demo already scheduled
  if (lead.stage === 'demo_scheduled' || lead.stage === 'demo_completed') {
    return false;
  }

  // Max 3 re-engagement attempts
  if (attemptNumber > 3) {
    return false;
  }

  return true;
}
