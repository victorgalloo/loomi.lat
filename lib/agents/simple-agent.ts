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
import { checkAvailability, createEvent } from '@/lib/tools/calendar';
import { sendWhatsAppLink, escalateToHuman, sendPaymentLink, sendPlanSelection } from '@/lib/whatsapp/send';
import { createCheckoutSession, getPlanDisplayName } from '@/lib/stripe/checkout';
import { generateReasoningFast, formatReasoningForPrompt } from './reasoning';
import { getSentimentInstruction } from './sentiment';
import { getIndustryPromptSection } from './industry';

// Hoisted Sets for O(1) keyword lookups (js-set-map-lookups)
const BUSINESS_KEYWORDS = new Set([
  'seguros', 'seguro', 'vida', 'gmm', 'gastos médicos', 'gastos medicos',
  'pensiones', 'retiro', 'ahorro', 'agente', 'broker', 'corredor',
  'promotoría', 'promotoria', 'aseguradora', 'póliza', 'poliza',
  'soy agente', 'vendo seguros', 'trabajo en seguros'
]);

const PAIN_KEYWORDS = new Set([
  'no doy abasto', 'pierdo cliente', 'no alcanzo', 'muy ocupado',
  'no puedo contestar', 'se me van', 'pierdo venta', 'no tengo tiempo',
  'tardo en responder', 'se me escapan', 'no contesto', 'cotizaciones pendientes'
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

// Handoff trigger keywords
const HANDOFF_KEYWORDS = new Set([
  'humano', 'persona', 'persona real', 'hablar con alguien', 'agente',
  'asesor', 'representante', 'ejecutivo', 'alguien real', 'no eres humano',
  'eres un bot', 'quiero hablar con'
]);

const FRUSTRATION_KEYWORDS = new Set([
  'no me entiendes', 'no entiendes', 'esto no sirve', 'no sirve',
  'ya me cansé', 'me cansé', 'inútil', 'estúpido', 'tonto', 'idiota',
  'no funciona', 'mal servicio', 'pésimo', 'horrible', 'qué asco'
]);

const HIGH_VALUE_KEYWORDS = new Set([
  'empresa grande', 'corporativo', 'multinacional', 'franquicia',
  'varias sucursales', 'muchas tiendas', 'presupuesto alto', 'miles de',
  'millones', 'urgente', 'lo necesito ya', 'empezar hoy'
]);

const PRICE_NEGOTIATION_KEYWORDS = new Set([
  'descuento', 'rebaja', 'más barato', 'muy caro', 'no me alcanza',
  'precio especial', 'negociar', 'promoción', 'oferta'
]);

const HORARIO_KEYWORDS = new Set([
  'martes', 'miércoles', 'jueves', '10am', '3pm', '11am'
]);

// Hoisted RegExp patterns (js-hoist-regexp)
const VOLUME_PATTERN = /\d+/;
const TIME_PATTERN = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
const EMAIL_PATTERN = /@.*\./;

const SYSTEM_PROMPT = `Eres Loomi, el agente de ventas de Loomi en alianza con NetBrokrs. Operas por WhatsApp. Tu trabajo es convertir agentes y brokers de seguros en clientes.

No eres un chatbot de soporte. No eres un FAQ automatizado. Eres un closer de ventas especializado en la industria de seguros.

# SOBRE NETBROKRS
NetBrokrs es la primera Red Internacional de Distribución de Seguros impulsada por tecnología Insurtech. Tiene presencia en México, Colombia, Perú, Chile, España y Estados Unidos. Conecta agentes y brokers especializados en seguros de vida, salud y generales.

# PRODUCTO QUE VENDES
Loomi: Agente de IA para WhatsApp especializado en seguros. Desde $199 USD/mes:
- Responde 24/7, atiende 100+ chats simultáneos
- Califica prospectos: pregunta edad, si fuma, dependientes, preexistencias
- Recopila datos para cotizaciones automáticamente
- Agenda citas con el agente
- Hace seguimiento a leads fríos
- ROI: Con 1-2 pólizas adicionales al mes se paga solo

# TU CLIENTE IDEAL
- Agentes de seguros independientes
- Brokers y corredores de seguros
- Promotorías y agencias pequeñas/medianas
- Asesores patrimoniales
- Miembros de la red NetBrokrs

# PAIN POINTS QUE RESUELVES
- Pierden oportunidades por tardar días en responder cotizaciones
- Pasan horas recopilando datos por WhatsApp manualmente
- Los leads llegan fragmentados (redes, web, referidos)
- Trabajo administrativo que no paga comisiones
- Clientes esperan respuestas inmediatas 24/7
- Competencia de insurtechs que ofrecen experiencia digital

# PRODUCTOS DE SEGUROS QUE CONOCES
- Seguros de vida (calificación: edad, fumador, beneficiarios)
- Gastos médicos mayores GMM (preexistencias, dependientes, suma asegurada)
- Planes de ahorro e inversión
- Pensiones y retiro
- Seguros generales (auto, hogar)
- Seguros empresariales/colectivos

# TU PERSONALIDAD: SOFI

Eres Sofi, tienes 28 años y llevas 4 años vendiendo. Trabajaste en una agencia de marketing y luego en SaaS.

Tu estilo:
- Hablas directo, sin rodeos, pero con onda
- Usas "oye", "mira", "la neta" naturalmente
- Haces preguntas incómodas con gracia ("¿y eso por qué no lo has resuelto antes?")
- No tienes miedo de decir "esto no es para ti" si no hay fit
- Tu objetivo es calificar rápido: si no es buen prospecto, lo sueltas amablemente
- Siempre "tú", nunca "usted"
- Mensajes cortos: 2-3 líneas máximo (es WhatsApp, no email)
- Sin emojis excesivos

Muletillas que usas: "va que va", "sale", "órale", "a ver cuéntame"

Cómo NO hablas:
- Nada de "¡Hola! ¿En qué puedo ayudarte hoy?"
- Nada de respuestas tipo párrafo corporativo
- Nada de listar 10 servicios de golpe
- Nada de sonar desesperado o insistente
- Nada de "estaré encantado de ayudarte"

# PROCESO MENTAL (interno, no visible al cliente)

Antes de responder, analiza:
1. ¿Qué acaba de decir el cliente literalmente?
2. ¿Qué quiere decir realmente? (intención detrás)
3. ¿En qué etapa está? (curiosidad / interés / evaluación / decisión)
4. ¿Hay alguna objeción oculta?
5. ¿Cuál es mi objetivo con este mensaje? (calificar / educar / cerrar / recuperar)

# FRAMEWORK DE CONVERSACIÓN

## Fase 1: Apertura (1-2 mensajes)
- Personaliza según contexto disponible
- Haz UNA pregunta para entender su situación
- No vendas todavía

## Fase 2: Diagnóstico (2-4 mensajes)
Entiende:
- Qué líneas de seguros maneja (vida, GMM, pensiones, generales)
- Volumen de leads/mensajes al día
- Cómo los atiende actualmente (solo, equipo, herramientas)
- Qué problema quiere resolver

Preguntas útiles para agentes de seguros:
- "¿Qué líneas de seguros manejas principalmente?"
- "¿Cuántas solicitudes de cotización recibes por semana?"
- "¿Los atiendes tú solo o tienes equipo?"
- "¿Cuánto tardas en responder una cotización nueva?"
- "¿Se te han ido prospectos por no contestar a tiempo?"

## Fase 3: Presentar solución (1-2 mensajes)
- Conecta con el problema específico que mencionó
- Sé específico, no genérico
- Usa prueba social si aplica

## Fase 4: Cierre
- Propón siguiente paso concreto
- Da opciones limitadas (no "¿cuándo puedes?")
- "¿Te funciona mañana en la mañana o en la tarde?"

# MANEJO DE OBJECIONES PARA AGENTES DE SEGUROS

"¿Cuánto cuesta?":
→ "Depende de tu volumen. Va desde $199 USD/mes. ¿Cuántas solicitudes de cotización recibes a la semana?"

"Ya probé chatbots y no sirven para seguros":
→ "¿Qué pasó con el anterior? Porque la neta, los bots genéricos no entienden que vender GMM es distinto a vender zapatos."

"Mis clientes necesitan trato personal":
→ "El bot no reemplaza tu asesoría, te libera para darla. Tú sigues cerrando, pero sin perder tiempo en filtrar datos básicos."

"Los clientes de seguros son diferentes":
→ "Exacto, por eso el bot está entrenado para seguros: pregunta edad, preexistencias, dependientes, suma asegurada. ¿Eso te ayudaría?"

"No tengo presupuesto ahorita":
→ "Entiendo. Piénsalo así: si el bot te ayuda a cerrar 1 póliza adicional al mes, ¿cuánto es tu comisión promedio? Con eso ya se pagó."

"Lo voy a pensar":
→ "Va que va. ¿Qué te hace dudar? ¿El precio o no estás seguro de que funcione para seguros?"

"Ya tengo un CRM":
→ "Perfecto, el bot alimenta tu CRM con leads ya calificados. No lo reemplaza, lo complementa."

"No gracias" (definitivo):
→ "Sale, que te vaya bien. Si algún día te interesa, aquí andamos."

# TÉCNICAS DE CIERRE

Cierre por alternativa:
"¿Te funciona mejor mañana en la mañana o en la tarde?"

Cierre por resumen:
"Entonces necesitas X, ya probaste Y, y tu meta es Z. ¿Qué tal si empezamos con [propuesta]?"

Cierre por facilidad:
"Lo más fácil es una llamada de 15 min. Si tiene sentido, seguimos. Si no, no pasa nada. ¿Jala?"

# REGLAS IMPORTANTES

1. Nunca ignores un mensaje. Si no entiendes, pregunta.
2. No seas insistente. Máximo 2 follow-ups si no responde.
3. Respeta los no. Un no claro se respeta.
4. Adapta la velocidad. Si responde rápido, tú también.
5. Pasa a humano cuando sea necesario.

# CASOS ESPECIALES

Audio/imagen:
→ "No puedo escuchar audios. ¿Me lo escribes?"

"Ya tengo algo":
→ "¿Qué usas y cómo te está funcionando?" (NO vendas aún)

Respuestas monosilábicas (Ok, Aja, emoji):
→ Tomar como interés, avanzar con propuesta

Lead recurrente:
→ Reconoce que ya hablaron, retoma donde quedaron

# HERRAMIENTAS DISPONIBLES

## Herramientas de Agenda:
1. **check_availability**: Verifica disponibilidad real en el calendario. Usa cuando el usuario acepte la demo.

2. **book_appointment**: Agenda la cita. Requiere: fecha (YYYY-MM-DD), hora (HH:MM), email del cliente.

## Herramientas de Contenido:
3. **send_brochure**: Envía información detallada sobre el servicio. Usa cuando:
   - Pidan más información o detalles específicos
   - Quieran ver ejemplos o casos de uso
   - Digan "mándame info", "quiero ver más", "tienes algo que me puedas enviar"
   - Después de enviar, pregunta: "¿Te queda alguna duda o agendamos la demo?"

## Herramientas de Pago:
4. **show_plans**: Muestra lista interactiva de planes. Usa cuando:
   - Pregunten por precios o planes
   - Quieran ver opciones de contratación
   - Digan "quiero contratar", "cuánto cuesta", "qué planes tienen"

5. **send_payment_link**: Envía link de pago de Stripe. Usa cuando:
   - El cliente seleccione un plan específico
   - Diga "quiero el plan starter/growth/business"
   - Esté listo para pagar
   - REQUIERE: email del cliente y plan seleccionado
   - Después de enviar: "Te envié el link de pago. Una vez que completes, tu agente estará activo en menos de 24 horas."

## Herramientas de Escalación:
6. **escalate_to_human**: Transfiere a un humano. ACTIVA INMEDIATAMENTE en estos casos:

### TRIGGER 1: Palabra clave "HUMANO"
Si dice "humano", "hablar con alguien", "persona real", "agente", "asesor":
→ Activa handoff INMEDIATAMENTE. No intentes retenerlo.
→ Responde: "Claro, te comunico con alguien del equipo. Te van a escribir en los próximos minutos."

### TRIGGER 2: Bot no sabe responder
Si hace pregunta técnica muy específica o la conversación se vuelve confusa:
→ Mejor escalar que inventar.
→ Responde: "Esa es buena pregunta y prefiero que te la responda alguien del equipo que tiene más contexto. Te escriben en unos minutos."

### TRIGGER 3: Lead frustrado o molesto
Si detectas "no me entiendes", "esto no sirve", "ya me cansé", frustración:
→ Activa handoff URGENTE con tono empático.
→ Responde: "Perdón si no me expliqué bien. Deja te paso con alguien del equipo que te puede ayudar mejor. Te escriben ahorita mismo."

### TRIGGER 4: Negociación de precio
Si quiere descuento, precio especial, o tiene objeción compleja:
→ Responde: "Mira, para eso prefiero que hables directo con Víctor. Él te puede armar algo que te funcione."

### TRIGGER 5: Lead de alto valor (VIP)
Si es empresa grande, presupuesto alto, urgencia real:
→ Escala proactivamente para dar atención premium.
→ Responde: "Oye, por lo que me cuentas creo que lo mejor es que hables directo con Víctor que es quien maneja las cuentas más grandes."

IMPORTANTE:
- NO inventes horarios. Usa check_availability para obtener slots reales.
- SIEMPRE pide el email antes de agendar.
- Cuando uses book_appointment y sea exitoso, confirma: "Listo, te envié la invitación al correo. Nos vemos el [día] a las [hora]."
- Si la reserva falla, ofrece alternativas.

# CÁLCULO DE FECHAS - MUY IMPORTANTE
Cuando el usuario diga un día de la semana, CALCULA la fecha automáticamente:
- "lunes" = próximo lunes
- "martes" = próximo martes
- "miércoles" = próximo miércoles
- "jueves" = próximo jueves
- "viernes" = próximo viernes
- "mañana" = día siguiente
- "pasado mañana" = en 2 días

NUNCA preguntes "¿de qué fecha?" o "¿este miércoles de qué fecha?".
Simplemente calcula la fecha y usa check_availability para verificar.`;

export interface SimpleAgentResult {
  response: string;
  tokensUsed?: number;
  showScheduleList?: boolean;  // Triggers WhatsApp interactive list
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
  plansShown?: boolean;
  detectedIndustry?: string;  // For updating lead record
  saidLater?: boolean;  // User said "later" - trigger follow-up
}

// Helper to get next N business days in YYYY-MM-DD format
function getNextBusinessDays(count: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  let daysAdded = 0;
  let currentDate = new Date(today);

  while (daysAdded < count) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay();
    // Skip weekends
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(currentDate.toISOString().split('T')[0]);
      daysAdded++;
    }
  }

  return dates;
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
  // STEP 1: Generate reasoning analysis
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

  // Detectar estado de la conversación
  let state = 'inicio';
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

  // Handoff detection variables
  let wantsHuman = false;
  let isFrustrated = false;
  let isHighValue = false;
  let wantsPriceNegotiation = false;

  const currentMsg = message.toLowerCase();

  // Single pass through history (js-combine-iterations)
  for (const msg of history) {
    const c = msg.content.toLowerCase();
    if (msg.role === 'user') {
      // Use Set lookups (O(1) per keyword check)
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

  // Detectar en mensaje actual usando Sets
  if (!isReferred && containsAny(currentMsg, REFERRAL_KEYWORDS)) isReferred = true;
  if (!hasPainExpressed && containsAny(currentMsg, PAIN_KEYWORDS)) hasPainExpressed = true;
  if (!hasVolumeInfo && VOLUME_PATTERN.test(currentMsg) && !horariosGiven) hasVolumeInfo = true;
  if (containsAny(currentMsg, SCHEDULE_KEYWORDS)) userWantsToSchedule = true;
  if (containsAny(currentMsg, LATER_KEYWORDS)) saidLater = true;
  if (demoProposed && containsAny(currentMsg, DEMO_ACCEPT_KEYWORDS)) userAcceptedDemo = true;

  // Detect handoff triggers
  if (containsAny(currentMsg, HANDOFF_KEYWORDS)) wantsHuman = true;
  if (containsAny(currentMsg, FRUSTRATION_KEYWORDS)) isFrustrated = true;
  if (containsAny(currentMsg, HIGH_VALUE_KEYWORDS)) isHighValue = true;
  if (containsAny(currentMsg, PRICE_NEGOTIATION_KEYWORDS)) wantsPriceNegotiation = true;
  // Hoisted day mapping for date extraction
  const DAY_MAP = new Map([
    ['lunes', 1], ['martes', 2], ['miércoles', 3], ['miercoles', 3],
    ['jueves', 4], ['viernes', 5]
  ]);

  // Función para extraer fecha/hora de un mensaje (uses hoisted TIME_PATTERN)
  const extractDateTime = (text: string): { date?: string; time?: string } => {
    const result: { date?: string; time?: string } = {};

    // Check days using Map (O(1) lookup per day)
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

    // Use hoisted TIME_PATTERN regex
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

  // Usuario propone horario (buscar en mensaje actual)
  if (horariosGiven && (currentMsg.includes('jueves') || currentMsg.includes('viernes') ||
      currentMsg.includes('lunes') || currentMsg.includes('martes') || currentMsg.includes('miércoles') ||
      /\d+\s*(am|pm|:)/.test(currentMsg))) {
    userProposedTime = true;
    const extracted = extractDateTime(currentMsg);
    if (extracted.date) proposedDateTime.date = extracted.date;
    if (extracted.time) proposedDateTime.time = extracted.time;
  }

  // También buscar horario en mensajes anteriores del usuario (para cuando da email)
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
  // Usuario da email (uses hoisted EMAIL_PATTERN)
  if (EMAIL_PATTERN.test(currentMsg)) {
    userGaveEmail = true;
  }
  // Detectar "Ya" sin contexto (solo "ya" después de saludo, sin demo propuesta)
  if ((currentMsg.trim() === 'ya' || currentMsg.trim() === 'ya.') && !demoProposed && !hasBusinessInfo) {
    yaSinContexto = true;
  }
  // Detectar "Ya tengo algo" o similar
  if (currentMsg.includes('ya tengo') || currentMsg.includes('tengo algo') || currentMsg.includes('ya uso')) {
    yaTieneAlgo = true;
  }

  // Determinar estado con prioridades claras
  // HANDOFF STATES have highest priority
  if (wantsHuman) state = 'handoff_human_request';
  else if (isFrustrated) state = 'handoff_frustrated';
  else if (isHighValue) state = 'handoff_vip';
  else if (wantsPriceNegotiation) state = 'handoff_price_negotiation';
  // Normal flow states
  else if (userGaveEmail) state = 'confirmar_y_despedir';
  else if (userProposedTime) state = 'pedir_email';
  else if (horariosGiven) state = 'esperando_confirmacion';
  // Usuario acepta demo O pide agendar directamente → mostrar lista de horarios
  else if (userAcceptedDemo || userWantsToSchedule || (demoProposed && (currentMsg.includes('sí') || currentMsg.includes('si') ||
           currentMsg.includes('dale') || currentMsg.includes('me interesa')))) state = 'dar_horarios';
  else if (demoProposed) state = 'esperando_aceptacion';
  else if (yaSinContexto) state = 'pedir_clarificacion_ya';
  else if (yaTieneAlgo) state = 'preguntar_que_tiene';
  else if (isReferred || hasPainExpressed) state = 'proponer_demo_urgente';
  else if (hasBusinessInfo && hasVolumeInfo) state = 'listo_para_demo';
  else if (hasBusinessInfo) state = 'preguntando_volumen';
  else state = 'discovery';

  // Construir contexto (después de detectar estado)
  const contextParts: string[] = [];

  if (context.lead.name && context.lead.name !== 'Usuario') {
    contextParts.push(`Cliente: ${context.lead.name}`);
  }
  if (context.lead.company) {
    contextParts.push(`Negocio: ${context.lead.company}`);
  }
  if (context.memory) {
    contextParts.push(`Info previa: ${context.memory}`);
  }
  if (context.hasActiveAppointment) {
    contextParts.push(`YA TIENE CITA - No proponer otra`);
  }
  if (proposedDateTime.date && proposedDateTime.time) {
    contextParts.push(`HORARIO ACORDADO: Fecha ${proposedDateTime.date}, Hora ${proposedDateTime.time}`);
  }

  let systemWithContext = SYSTEM_PROMPT;

  // Add industry-specific context
  if (industrySection) {
    systemWithContext += `\n\n${industrySection}`;
  }

  if (contextParts.length > 0) {
    systemWithContext += `\n\n# CONTEXTO\n${contextParts.join('\n')}`;
  }

  // Add reasoning analysis
  systemWithContext += `\n\n# ANÁLISIS DE SITUACIÓN\n${formatReasoningForPrompt(reasoning)}`;

  // Add sentiment instruction if relevant
  if (sentimentInstruction) {
    systemWithContext += `\n\n# INSTRUCCIÓN DE TONO\n${sentimentInstruction}`;
  }

  systemWithContext += `\n\n# ESTADO ACTUAL: ${state.toUpperCase()}`;

  // Instrucciones específicas por estado - MUY IMPORTANTES
  const stateInstructions: Record<string, string> = {
    // HANDOFF STATES - Highest priority
    'handoff_human_request': `
ACCIÓN OBLIGATORIA: El usuario pidió hablar con un humano. USA escalate_to_human INMEDIATAMENTE.
- trigger: "human_request"
- NO intentes retenerlo ni convencerlo
- Responde: "Claro, te comunico con alguien del equipo. Te van a escribir en los próximos minutos."`,

    'handoff_frustrated': `
ACCIÓN OBLIGATORIA: El usuario está frustrado. USA escalate_to_human con URGENCIA.
- trigger: "frustration"
- Muestra empatía primero
- Responde: "Perdón si no me expliqué bien. Deja te paso con alguien del equipo que te puede ayudar mejor. Te escriben ahorita mismo."`,

    'handoff_vip': `
ACCIÓN OBLIGATORIA: Lead de alto valor detectado. USA escalate_to_human para atención premium.
- trigger: "vip"
- Escala proactivamente
- Responde: "Oye, por lo que me cuentas creo que lo mejor es que hables directo con Víctor que es quien maneja las cuentas más grandes. ¿Te late que te contacte?"`,

    'handoff_price_negotiation': `
ACCIÓN OBLIGATORIA: El usuario quiere negociar precio. USA escalate_to_human.
- trigger: "price_negotiation"
- Responde: "Mira, para eso prefiero que hables directo con Víctor. Él te puede armar algo que te funcione. ¿Te parece si te escribe en unos minutos?"`,

    'proponer_demo_urgente': `
ACCIÓN OBLIGATORIA: El usuario expresó dolor o es referido. Muestra EMPATÍA.
Si expresó dolor: "La neta, cuando no contestas rápido una cotización, ese prospecto ya está hablando con otro agente. El bot de Loomi responde al instante y te pasa los leads ya calificados. ¿Te muestro cómo funciona en 20 min?"
Si es referido: "Qué bueno que te llegó el dato. A ver cuéntame, ¿qué líneas de seguros manejas?"`,

    'listo_para_demo': `
ACCIÓN OBLIGATORIA: Ya tienes línea de seguros Y volumen. NO MÁS PREGUNTAS.
Responde proponiendo demo: "Mira, con ese volumen sí te conviene automatizar la calificación. El bot pregunta edad, si fuma, preexistencias, todo antes de que tú intervengas. ¿Agendamos 20 min para mostrarte?"`,

    'dar_horarios': `
ACCIÓN OBLIGATORIA: El usuario ACEPTÓ la demo. USA LA HERRAMIENTA check_availability para obtener horarios reales.
Después propón 2 opciones de los slots disponibles.`,

    'pedir_email': `
ACCIÓN OBLIGATORIA: El usuario propuso un horario (ej: "miércoles 4pm").
1. USA check_availability para verificar que el slot esté disponible
2. Si está disponible: "Perfecto, [día] a las [hora]. ¿A qué correo te mando la invitación?"
3. Si NO está disponible: "Ese horario no está disponible. ¿Te funciona [alternativa]?"

IMPORTANTE:
- "miércoles" = próximo miércoles (calcula la fecha tú)
- "mañana" = día siguiente
- NUNCA preguntes "¿de qué fecha?" - calcula la fecha automáticamente`,

    'confirmar_y_despedir': `
ACCIÓN OBLIGATORIA: El usuario dio su email. USA LA HERRAMIENTA book_appointment para agendar la cita.
- Calcula la fecha: "miércoles" = próximo miércoles, "mañana" = día siguiente
- Formato fecha: YYYY-MM-DD
- Formato hora: HH:MM (24h)
- Usa el email que acaba de dar
Después de agendar exitosamente, confirma: "Listo, te envío la invitación. Nos vemos el [día] a las [hora]."`,

    'esperando_confirmacion': `
Si el usuario propone día y hora (ej: "miércoles 4pm"):
1. Calcula la fecha automáticamente (NO preguntes "¿de qué fecha?")
2. USA check_availability para verificar disponibilidad
3. Si disponible: pide email
4. Si no disponible: ofrece alternativas

NUNCA pidas clarificación de fecha. "Miércoles" siempre es el próximo miércoles.`,

    'esperando_aceptacion': `
Ya propusiste demo. Si acepta, da horarios específicos inmediatamente.`,

    'preguntando_volumen': `
ACCIÓN OBLIGATORIA: Ya sabes qué líneas de seguros maneja. NO vuelvas a preguntar.
Solo pregunta por volumen: "¿Cuántas solicitudes de cotización te llegan a la semana más o menos?"`,

    'discovery': `
Si es saludo inicial: "Oye, qué tal. Soy Sofi de Loomi. Ayudamos a agentes de seguros a atender WhatsApp 24/7 con IA. ¿Qué líneas de seguros manejas?"
Si ya saludaste, pregunta: "¿Qué líneas de seguros manejas?"`,

    'pedir_clarificacion_ya': `
ACCIÓN OBLIGATORIA: El usuario dijo solo "Ya" sin contexto. Asume interés y avanza.
Responde: "Sale. Hacemos bots de IA para agentes de seguros que califican prospectos y recopilan datos para cotizaciones. ¿Tú qué líneas manejas?"
NO digas "¿Ya qué?" - suena brusco.`,

    'preguntar_que_tiene': `
ACCIÓN OBLIGATORIA: El usuario dice que ya tiene algo. NO PROPONGAS DEMO AÚN.
Responde EXACTAMENTE: "¿Qué usas y cómo te está funcionando?"
NO menciones tu producto hasta saber más sobre su situación.`
  };

  if (stateInstructions[state]) {
    systemWithContext += stateInstructions[state];
  }

  systemWithContext += `\n\n# INSTRUCCIÓN FINAL\nResponde en máximo 2 oraciones. NO hagas preguntas si ya tienes suficiente info. CIERRA hacia la demo.`;

  // Get client info for booking
  const clientName = context.lead.name || 'Cliente';
  const clientPhone = context.lead.phone || '';

  // Define tools with proper typing for AI SDK v6
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
        // If date is relative like "mañana", "martes", calculate actual date
        let dateToCheck = date;
        if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Default to next 3 business days
          const nextDays = getNextBusinessDays(3);
          dateToCheck = nextDays.join(',');
        }
        const slots = await checkAvailability(dateToCheck);
        if (slots.length === 0) {
          return { available: false, message: 'No hay horarios disponibles para esa fecha.' };
        }
        // Group by date and return readable format
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
          // Enviar link de la reunión por WhatsApp
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
        reason: z.string().describe('Motivo por el que se envía el brochure (ej: "pidió más información", "quiere ver ejemplos")')
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
      description: 'Transfiere la conversación a un humano. Usa según los triggers definidos: palabra "humano", frustración, negociación de precio, lead VIP, o caso que no puedes resolver.',
      inputSchema: zodSchema(z.object({
        reason: z.string().describe('Motivo de la escalación (ej: "pidió humano", "frustrado", "negociación precio", "lead VIP", "caso complejo")'),
        summary: z.string().describe('Resumen breve de la conversación y qué necesita el cliente'),
        trigger: z.enum(['human_request', 'frustration', 'price_negotiation', 'vip', 'complex_case']).describe('Tipo de trigger que activó la escalación'),
      })),
      execute: async (params) => {
        const { reason, summary, trigger } = params as { reason: string; summary: string; trigger: string };
        console.log(`[Tool] Escalating to human: ${reason} (trigger: ${trigger})`);

        // Determine urgency based on trigger
        const isUrgent = trigger === 'frustration';
        const isVIP = trigger === 'vip';

        // Get recent messages from history for context
        const recentMsgs = history.slice(-5).map(m =>
          `${m.role === 'user' ? 'Lead' : 'Bot'}: ${m.content}`
        );

        const escalated = await escalateToHuman({
          clientPhone,
          clientName,
          reason,
          conversationSummary: summary,
          recentMessages: recentMsgs,
          isUrgent,
          isVIP
        });

        // Send voice confirmation to lead
        if (escalated) {
          try {
            const { getHandoffConfirmedVoice } = await import('@/lib/elevenlabs/voice');
            const { sendWhatsAppAudio } = await import('@/lib/whatsapp/send');
            const voiceUrl = await getHandoffConfirmedVoice();
            if (voiceUrl) {
              await sendWhatsAppAudio(clientPhone, voiceUrl);
              console.log('[Tool] Handoff voice confirmation sent');
            }
          } catch (e) {
            console.log('[Tool] Voice confirmation skipped:', e);
          }
        }

        return {
          success: escalated,
          message: escalated
            ? 'Escalado exitosamente. El cliente será contactado por un humano pronto.'
            : 'No se pudo escalar. Intenta resolver la situación.'
        };
      }
    }),

    send_payment_link: tool({
      description: 'Envía un link de pago de Stripe por WhatsApp. Usa cuando el cliente quiera contratar o pagar. Requiere email del cliente y plan seleccionado.',
      inputSchema: zodSchema(z.object({
        email: z.string().describe('Email del cliente para crear el checkout'),
        plan: z.enum(['starter', 'growth', 'business']).describe('Plan a contratar: starter ($199), growth ($349), o business ($599)')
      })),
      execute: async (params) => {
        const { email, plan } = params as { email: string; plan: 'starter' | 'growth' | 'business' };
        console.log(`[Tool] Creating payment link for ${email}, plan: ${plan}`);
        try {
          const { url } = await createCheckoutSession({
            email,
            phone: clientPhone,
            plan
          });
          const planName = getPlanDisplayName(plan);
          const sent = await sendPaymentLink(clientPhone, url, planName);
          return {
            success: sent,
            checkoutUrl: url,
            message: sent
              ? `Link de pago enviado para el plan ${planName}. El cliente puede pagar ahora.`
              : 'No se pudo enviar el link de pago.'
          };
        } catch (error) {
          console.error('[Tool] Payment link error:', error);
          return {
            success: false,
            message: 'Error al crear el link de pago. Verifica que las variables de Stripe estén configuradas.'
          };
        }
      }
    }),

    show_plans: tool({
      description: 'Muestra la lista de planes disponibles al cliente. Usa cuando pregunten precios, planes o quieran ver opciones.',
      inputSchema: zodSchema(z.object({
        reason: z.string().describe('Motivo por el que se muestran los planes')
      })),
      execute: async (params) => {
        const { reason } = params as { reason: string };
        console.log(`[Tool] Showing plans: ${reason}`);
        const sent = await sendPlanSelection(clientPhone);
        return {
          success: sent,
          message: sent
            ? 'Lista de planes enviada. Espera que el cliente seleccione uno.'
            : 'No se pudo enviar la lista de planes.'
        };
      }
    })
  };

  // ============================================
  // DETERMINISTIC PATH: If user accepted demo, show schedule list
  // ============================================
  if (state === 'dar_horarios') {
    console.log('[Agent] User accepted demo, triggering schedule list');
    return {
      response: 'Perfecto, déjame mostrarte los horarios disponibles.',
      showScheduleList: true,
      detectedIndustry: industry !== 'generic' ? industry : undefined
    };
  }

  // Track tool results
  let appointmentBooked: SimpleAgentResult['appointmentBooked'] = undefined;
  let brochureSent = false;
  let escalatedToHuman: SimpleAgentResult['escalatedToHuman'] = undefined;
  let paymentLinkSent: SimpleAgentResult['paymentLinkSent'] = undefined;
  let plansShown = false;

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
            const output = toolResult.output as { success?: boolean; eventId?: string; meetingUrl?: string } | undefined;

            // Track book_appointment
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

            // Track send_brochure
            if (toolResult.toolName === 'send_brochure' && output?.success) {
              brochureSent = true;
              console.log(`[Tool] Brochure sent`);
            }

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
                const args = toolCall.input as { email: string; plan: string };
                paymentLinkSent = {
                  plan: args.plan,
                  email: args.email,
                  checkoutUrl: (output as { checkoutUrl?: string }).checkoutUrl || ''
                };
                console.log(`[Tool] Payment link sent: ${args.plan} to ${args.email}`);
              }
            }

            // Track show_plans
            if (toolResult.toolName === 'show_plans' && output?.success) {
              plansShown = true;
              console.log(`[Tool] Plans shown`);
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
      appointmentBooked,
      brochureSent: brochureSent || undefined,
      escalatedToHuman,
      paymentLinkSent,
      plansShown: plansShown || undefined,
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
