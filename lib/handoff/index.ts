/**
 * Handoff System - Robust escalation to human operators
 *
 * This is the safety net when AI or services fail.
 * Designed to NEVER lose a lead.
 */

import { sendWhatsAppMessage } from '@/lib/whatsapp/send';

import { getSupabase } from '@/lib/memory/supabase';

// ===========================================
// TYPES
// ===========================================

export type HandoffPriority = 'critical' | 'urgent' | 'normal';

export type HandoffReason =
  | 'user_requested'        // Cliente pidió hablar con humano
  | 'user_frustrated'       // Cliente frustrado
  | 'agent_error'           // Error del agente AI
  | 'service_timeout'       // Timeout de servicio externo (Temporal, etc.)
  | 'complex_question'      // Pregunta que el agente no puede responder
  | 'enterprise_lead'       // Lead enterprise/alto valor
  | 'payment_issue'         // Problema con pago
  | 'repeated_failures'     // Múltiples intentos fallidos
  | 'negative_sentiment'    // Sentimiento muy negativo
  | 'competitor_mention'    // Menciona competidor (oportunidad)
  | 'custom';               // Otro motivo

export interface HandoffContext {
  // Lead info
  leadId?: string;
  phone: string;
  name: string;
  email?: string;
  company?: string;
  industry?: string;

  // Conversation
  conversationId?: string;
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>;

  // Handoff details
  reason: HandoffReason;
  customReason?: string;
  priority: HandoffPriority;

  // Technical context
  errorMessage?: string;
  failedService?: string;

  // Business context
  leadValue?: 'high' | 'medium' | 'low';
  currentStage?: string;

  // Tenant (multi-tenant support)
  tenantId?: string;
  credentials?: {
    phoneNumberId: string;
    accessToken: string;
  };
}

export interface HandoffResult {
  success: boolean;
  handoffId: string;
  notifiedOperator: boolean;
  notifiedClient: boolean;
  operatorPhone?: string;
}

// ===========================================
// PRIORITY & REASON CONFIGS
// ===========================================

const PRIORITY_CONFIG: Record<HandoffPriority, {
  emoji: string;
  label: string;
  responseTimeMinutes: number;
  color: string;
}> = {
  critical: {
    emoji: '🔴',
    label: 'CRÍTICO',
    responseTimeMinutes: 2,
    color: 'red'
  },
  urgent: {
    emoji: '🟠',
    label: 'URGENTE',
    responseTimeMinutes: 5,
    color: 'orange'
  },
  normal: {
    emoji: '🟢',
    label: 'HANDOFF',
    responseTimeMinutes: 15,
    color: 'green'
  }
};

export const REASON_CONFIG: Record<HandoffReason, {
  label: string;
  defaultPriority: HandoffPriority;
  suggestedAction: string;
  clientMessage: string;
}> = {
  user_requested: {
    label: 'Cliente solicitó humano',
    defaultPriority: 'urgent',
    suggestedAction: 'Contactar inmediatamente - el cliente espera',
    clientMessage: 'Claro, te comunico con alguien del equipo. Te escriben en los próximos minutos.'
  },
  user_frustrated: {
    label: 'Cliente frustrado',
    defaultPriority: 'critical',
    suggestedAction: 'URGENTE: Cliente molesto, ser empático y resolver rápido',
    clientMessage: 'Perdón si no me expliqué bien. Te paso con alguien que te puede ayudar mejor. Te escriben en un momento.'
  },
  agent_error: {
    label: 'Error del agente',
    defaultPriority: 'critical',
    suggestedAction: 'El agente falló - retomar conversación manualmente',
    clientMessage: 'Tuve un problema técnico. Te paso con alguien del equipo. Te escriben en un momento.'
  },
  service_timeout: {
    label: 'Timeout de servicio',
    defaultPriority: 'urgent',
    suggestedAction: 'Servicio externo no disponible - continuar manualmente',
    clientMessage: 'Estoy teniendo problemas técnicos. Te comunico con alguien del equipo para ayudarte.'
  },
  complex_question: {
    label: 'Pregunta compleja',
    defaultPriority: 'normal',
    suggestedAction: 'Pregunta técnica/compleja que requiere expertise',
    clientMessage: 'Buena pregunta. Deja te paso con alguien del equipo que te puede dar más detalles.'
  },
  enterprise_lead: {
    label: 'Lead Enterprise',
    defaultPriority: 'urgent',
    suggestedAction: 'LEAD DE ALTO VALOR - atención prioritaria',
    clientMessage: 'Perfecto, para enterprise te comunico con nuestro equipo de ventas. Te escriben en breve.'
  },
  payment_issue: {
    label: 'Problema de pago',
    defaultPriority: 'urgent',
    suggestedAction: 'Revisar estado del pago y resolver',
    clientMessage: 'Deja verifico eso con el equipo. Te escriben para resolverlo.'
  },
  repeated_failures: {
    label: 'Fallos repetidos',
    defaultPriority: 'critical',
    suggestedAction: 'Múltiples intentos fallidos - el cliente puede estar muy frustrado',
    clientMessage: 'Perdón por los problemas. Te paso directamente con alguien del equipo.'
  },
  negative_sentiment: {
    label: 'Sentimiento negativo',
    defaultPriority: 'urgent',
    suggestedAction: 'Cliente con actitud negativa - manejar con cuidado',
    clientMessage: 'Entiendo tu frustración. Deja te comunico con alguien que pueda ayudarte mejor.'
  },
  competitor_mention: {
    label: 'Menciona competidor',
    defaultPriority: 'normal',
    suggestedAction: 'Oportunidad: comparar con competidor, resaltar diferenciadores',
    clientMessage: 'Buena pregunta sobre las diferencias. Te paso con alguien que te puede explicar a detalle.'
  },
  custom: {
    label: 'Otro motivo',
    defaultPriority: 'normal',
    suggestedAction: 'Revisar contexto de la conversación',
    clientMessage: 'Te comunico con alguien del equipo. Te escriben pronto.'
  }
};

// ===========================================
// HANDOFF KEYWORDS (expanded)
// ===========================================

export const HANDOFF_TRIGGERS = {
  // Direct requests for human
  humanRequest: new Set([
    'humano', 'persona', 'persona real', 'hablar con alguien',
    'asesor', 'representante', 'alguien real', 'no eres humano',
    'eres un bot', 'quiero hablar con', 'pásame con', 'pasame con',
    'comunícame', 'comunicame', 'transfiere', 'agente real',
    'hablar con una persona', 'quiero un humano'
  ]),

  // Frustration indicators (with the bot, NOT sales objections)
  // Words like "estafa", "fraude", "mentira" are common sales objections
  // that the agent should handle — NOT automatic handoff triggers.
  frustration: new Set([
    'no me entiendes', 'no entiendes', 'esto no sirve', 'no sirve',
    'ya me cansé', 'me cansé', 'inútil', 'no funciona', 'mal servicio',
    'pésimo', 'horrible', 'terrible',
    'qué asco', 'que asco', 'basura', 'porquería', 'porqueria'
  ]),

  // Enterprise signals
  enterprise: new Set([
    'enterprise', 'corporativo', 'empresa grande', 'multinacional',
    'miles de mensajes', 'millones', 'volumen alto', 'muchas líneas',
    'varias sucursales', 'múltiples países', 'multiples paises',
    'api', 'integración custom', 'integracion custom', 'white label',
    'on-premise', 'self-hosted', 'sla', 'contrato anual'
  ]),

  // Competitor mentions (informational only, NOT handoff triggers)
  // Kept for reference but no longer triggers handoff.
  // "ya uso", "ya tengo" etc. are discovery signals, not escalation signals.
  competitors: new Set([
    'wati', 'manychat', 'leadsales', 'respond.io', 'messagebird',
    'twilio', 'zenvia', 'waboxapp', 'sirena', 'trengo', 'landbot',
    'chatfuel', 'botsify', 'tidio', 'drift', 'intercom'
  ]),

  // Payment issues
  paymentIssues: new Set([
    'no puedo pagar', 'error de pago', 'cobro', 'factura', 'reembolso',
    'cancelar suscripción', 'cancelar suscripcion', 'darme de baja',
    'cobro doble', 'cargo no reconocido', 'problema con el pago'
  ])
};

// ===========================================
// DETECTION FUNCTIONS
// ===========================================

/**
 * Check if user is describing their own situation (not complaining about the bot).
 * E.g., "mi chatbot no funciona" = describing their problem, not frustration with us.
 */
function isUserDescribingTheirSituation(
  recentMessages?: Array<{ role: string; content: string }>
): boolean {
  if (!recentMessages || recentMessages.length === 0) return false;

  // Find the last assistant message
  for (let i = recentMessages.length - 1; i >= 0; i--) {
    if (recentMessages[i].role === 'assistant') {
      const assistantMsg = recentMessages[i].content.toLowerCase();
      // If last assistant message was a discovery question, user is likely
      // describing their situation, not expressing frustration with us
      const discoveryPatterns = [
        'qué tipo de negocio', 'cuántos mensajes', 'cómo manejan',
        'qué usas', 'cómo te va', 'qué te llamó', 'en qué te puedo',
        'a qué te dedicas', 'cuéntame', 'qué problema', 'qué necesitas',
        'cómo funciona tu', 'qué solución', 'qué herramienta'
      ];
      return discoveryPatterns.some(p => assistantMsg.includes(p));
    }
  }
  return false;
}

/**
 * Detect handoff triggers from message with conversation context.
 * Frustration keywords are only triggered when the user is actually frustrated
 * with the bot, not when describing their own situation.
 */
export function detectHandoffTrigger(
  message: string,
  recentMessages?: Array<{ role: string; content: string }>
): {
  shouldHandoff: boolean;
  reason: HandoffReason;
  priority: HandoffPriority;
} | null {
  const lower = message.toLowerCase();

  // 1. Human request keywords — always trigger (unambiguous)
  for (const keyword of HANDOFF_TRIGGERS.humanRequest) {
    if (lower.includes(keyword)) {
      return { shouldHandoff: true, reason: 'user_requested', priority: 'urgent' };
    }
  }

  // 2. Frustration keywords — only trigger if NOT describing their situation
  if (!isUserDescribingTheirSituation(recentMessages)) {
    for (const keyword of HANDOFF_TRIGGERS.frustration) {
      if (lower.includes(keyword)) {
        return { shouldHandoff: true, reason: 'user_frustrated', priority: 'critical' };
      }
    }
  }

  // 3. Enterprise signals — always trigger
  for (const keyword of HANDOFF_TRIGGERS.enterprise) {
    if (lower.includes(keyword)) {
      return { shouldHandoff: true, reason: 'enterprise_lead', priority: 'urgent' };
    }
  }

  // 4. Payment issues — always trigger
  for (const keyword of HANDOFF_TRIGGERS.paymentIssues) {
    if (lower.includes(keyword)) {
      return { shouldHandoff: true, reason: 'payment_issue', priority: 'urgent' };
    }
  }

  // 5. Competitors — NO LONGER trigger handoff.
  // "ya uso", "ya tengo" are discovery signals, not escalation signals.
  // The agent should handle these in conversation.

  return null;
}

/**
 * Detect repeated failures pattern
 */
export function detectRepeatedFailures(
  messages: Array<{ role: string; content: string }>
): boolean {
  // Count "error" or apologetic messages from assistant in last 5 messages
  const recentAssistant = messages
    .slice(-10)
    .filter(m => m.role === 'assistant')
    .slice(-5);

  const errorPatterns = [
    'problema', 'error', 'perdón', 'perdon', 'disculpa',
    'no pude', 'intenta de nuevo', 'fallo', 'no funciono'
  ];

  let errorCount = 0;
  for (const msg of recentAssistant) {
    const lower = msg.content.toLowerCase();
    for (const pattern of errorPatterns) {
      if (lower.includes(pattern)) {
        errorCount++;
        break;
      }
    }
  }

  return errorCount >= 2;
}

// ===========================================
// MAIN HANDOFF FUNCTION
// ===========================================

/**
 * Execute handoff to human operator
 */
export async function executeHandoff(context: HandoffContext): Promise<HandoffResult> {
  const handoffId = `ho_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const config = REASON_CONFIG[context.reason];
  const priorityConfig = PRIORITY_CONFIG[context.priority];

  // Get fallback phone(s)
  const fallbackPhone = process.env.FALLBACK_PHONE;
  const fallbackPhone2 = process.env.FALLBACK_PHONE_2; // Backup operator

  if (!fallbackPhone) {
    console.error('[Handoff] No FALLBACK_PHONE configured');
    return {
      success: false,
      handoffId,
      notifiedOperator: false,
      notifiedClient: false
    };
  }

  // Build operator notification message
  const operatorMessage = buildOperatorMessage(context, config, priorityConfig, handoffId);

  // Build client message
  const clientMessage = context.customReason
    ? `${config.clientMessage}`
    : config.clientMessage;

  // Send notifications in parallel
  const [operatorResult, clientResult, backupResult] = await Promise.all([
    // Notify main operator
    sendWhatsAppMessage(fallbackPhone, operatorMessage, context.credentials),

    // Notify client
    sendWhatsAppMessage(context.phone, clientMessage, context.credentials),

    // Notify backup operator for critical/urgent
    (context.priority === 'critical' || context.priority === 'urgent') && fallbackPhone2
      ? sendWhatsAppMessage(fallbackPhone2, operatorMessage, context.credentials)
      : Promise.resolve(false)
  ]);

  console.log(`[Handoff] ${handoffId} | Priority: ${context.priority} | Reason: ${context.reason}`);
  console.log(`[Handoff] Operator notified: ${operatorResult} | Client notified: ${clientResult}`);

  // Track handoff in database
  try {
    const supabase = getSupabase();
    await supabase.from('handoffs').insert({
      tenant_id: context.tenantId || null,
      conversation_id: context.conversationId || null,
      lead_id: context.leadId || null,
      reason: context.customReason || context.reason,
      priority: context.priority,
      status: 'pending',
    });
  } catch (dbError) {
    console.error('[Handoff] Failed to save to DB:', dbError);
  }

  return {
    success: operatorResult || backupResult,
    handoffId,
    notifiedOperator: operatorResult || backupResult,
    notifiedClient: clientResult,
    operatorPhone: fallbackPhone
  };
}

/**
 * Build detailed operator notification message
 */
function buildOperatorMessage(
  context: HandoffContext,
  config: typeof REASON_CONFIG[HandoffReason],
  priorityConfig: typeof PRIORITY_CONFIG[HandoffPriority],
  handoffId: string
): string {
  const parts: string[] = [];

  // Header with priority
  parts.push(`${priorityConfig.emoji} ${priorityConfig.label}: ${config.label}`);
  parts.push('');

  // Lead info
  parts.push(`👤 *${context.name}*`);
  parts.push(`📱 ${context.phone}`);
  if (context.email) parts.push(`📧 ${context.email}`);
  if (context.company) parts.push(`🏢 ${context.company}`);
  if (context.industry) parts.push(`🏭 ${context.industry}`);
  if (context.currentStage) parts.push(`📊 Etapa: ${context.currentStage}`);
  parts.push('');

  // Suggested action
  parts.push(`⚡ *Acción:* ${config.suggestedAction}`);
  parts.push(`⏱️ Responder en menos de ${priorityConfig.responseTimeMinutes} min`);
  parts.push('');

  // Error context if applicable
  if (context.errorMessage) {
    parts.push(`🔧 Error: ${context.errorMessage.slice(0, 100)}`);
  }
  if (context.failedService) {
    parts.push(`⚠️ Servicio fallido: ${context.failedService}`);
  }
  if (context.customReason) {
    parts.push(`📝 Detalle: ${context.customReason}`);
  }

  // Recent conversation (last 5 messages)
  if (context.recentMessages.length > 0) {
    parts.push('');
    parts.push('💬 *Últimos mensajes:*');
    parts.push('---');
    const recent = context.recentMessages.slice(-5);
    for (const msg of recent) {
      const speaker = msg.role === 'user' ? context.name.split(' ')[0] : 'Bot';
      const truncated = msg.content.length > 150
        ? msg.content.slice(0, 147) + '...'
        : msg.content;
      parts.push(`${speaker}: ${truncated}`);
    }
    parts.push('---');
  }

  // Quick action link
  parts.push('');
  const cleanPhone = context.phone.replace(/\D/g, '');
  parts.push(`📲 wa.me/${cleanPhone}`);

  // Footer with ID
  parts.push('');
  parts.push(`ID: ${handoffId}`);

  return parts.join('\n');
}

// ===========================================
// CONVENIENCE FUNCTIONS
// ===========================================

/**
 * Quick handoff for service errors (Temporal, etc.)
 */
export async function handoffOnServiceError(
  phone: string,
  name: string,
  serviceName: string,
  errorMessage: string,
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>,
  credentials?: HandoffContext['credentials']
): Promise<HandoffResult> {
  return executeHandoff({
    phone,
    name,
    recentMessages,
    reason: 'service_timeout',
    priority: 'urgent',
    errorMessage,
    failedService: serviceName,
    credentials
  });
}

/**
 * Quick handoff for agent errors
 */
export async function handoffOnAgentError(
  phone: string,
  name: string,
  errorMessage: string,
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>,
  credentials?: HandoffContext['credentials']
): Promise<HandoffResult> {
  return executeHandoff({
    phone,
    name,
    recentMessages,
    reason: 'agent_error',
    priority: 'critical',
    errorMessage,
    credentials
  });
}

/**
 * Quick handoff when user requests human
 */
export async function handoffOnUserRequest(
  phone: string,
  name: string,
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>,
  credentials?: HandoffContext['credentials']
): Promise<HandoffResult> {
  return executeHandoff({
    phone,
    name,
    recentMessages,
    reason: 'user_requested',
    priority: 'urgent',
    credentials
  });
}

/**
 * Quick handoff for frustrated user
 */
export async function handoffOnFrustration(
  phone: string,
  name: string,
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>,
  credentials?: HandoffContext['credentials']
): Promise<HandoffResult> {
  return executeHandoff({
    phone,
    name,
    recentMessages,
    reason: 'user_frustrated',
    priority: 'critical',
    credentials
  });
}
