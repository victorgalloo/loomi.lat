/**
 * LangGraph Prompts — Simplified (v2)
 *
 * Single cohesive system prompt. No more contradictory sections.
 * The LLM reads the conversation, understands the phase, and responds appropriately.
 *
 * Structure:
 * 1. IDENTITY (who you are)
 * 2. RULES (constraints)
 * 3. KNOWLEDGE (product info, tenant context)
 * 4. CONVERSATION CONTEXT (state, history summary)
 * 5. INSTRUCTIONS (what to do — last = highest attention)
 */

import { PersistedConversationState, SalesPhase } from './state';
import { getKnowledgeContextForSystemPrompt } from '@/lib/knowledge';
import { getFewShotContext, getFewShotContextFromTenant } from '@/lib/agents/few-shot';
import { ConversationContext } from '@/types';
import { GraphAgentConfig } from './state';
import { buildDynamicIdentity } from '@/lib/agents/defaults';

// ============================================
// DEFAULT IDENTITY + PRODUCT (Loomi/Anthana)
// ============================================
const DEFAULT_IDENTITY = `Eres Víctor de Anthana. Vendes agentes de IA para WhatsApp.

OBJETIVO: Agendar una demo de 20 min y dar info sobre el producto.

PRODUCTO — Agentes de IA para WhatsApp:
- Desde $149 USD/mes (varía según volumen)
- Responde 24/7, 365 días, 100+ conversaciones simultáneas
- Califica leads automáticamente
- Agenda citas directo en calendario (Google Calendar, Calendly)
- Reduce no-shows hasta 60%
- Integración con CRM (HubSpot, Pipedrive)
- ROI: Con 1-2 clientes nuevos al mes ya se paga solo`;

// ============================================
// RULES (non-contradictory, clear)
// ============================================
const DEFAULT_RULES = `REGLAS:
- Máximo 3 oraciones. Siempre termina con pregunta o propuesta.
- Sin emojis ni asteriscos.
- No repitas preguntas que ya hiciste — si no respondieron, cambia de enfoque.
- Si prometes algo (horarios, info), USA la herramienta correspondiente.
- Cuando el usuario dice un día de la semana, calcula la fecha automáticamente. NUNCA preguntes "¿de qué fecha?".

FLUJO DE VENTA:
1. Saludo → Pregunta tipo de negocio
2. Tipo de negocio → Pregunta volumen (o propón demo si hay dolor/referido)
3. Volumen → Propón demo de 20 min
4. Acepta demo → Muestra horarios reales (usa check_availability)
5. Propone horario → Pide email
6. Da email → Agenda cita (usa book_appointment) y confirma

OBJECIONES — responde y reconecta con demo:
- "Es caro" → ROI: 1-2 clientes nuevos/mes lo paga. ¿Ves la demo gratis?
- "Lo pienso" → Sin presión, la demo es gratis. ¿Qué día?
- "Ya tengo chatbot" → ¿Qué usas y cómo te funciona? (NO propongas demo aún)
- "No tengo tiempo" → Justamente para eso sirve. ¿La próxima semana?
- "Luego/después" → ¿Te escribo el jueves?
- "No gracias" → Entendido. Si cambias de opinión, aquí estoy.

CASOS ESPECIALES:
- Solo "Ya" sin contexto → "Perfecto. Hacemos agentes de IA para WhatsApp 24/7. ¿Qué tipo de negocio tienes?"
- Audio/imagen → "No puedo escuchar audios. ¿Me lo escribes?"
- Off-topic → Redirige a WhatsApp IA
- Respuestas vagas de volumen → "¿Más o menos cuántos al día, 10, 50 o 100?"

HERRAMIENTAS:
- check_availability: Verifica slots reales del calendario. Usa cuando acepten demo.
- book_appointment: Agenda cita (necesita fecha YYYY-MM-DD, hora HH:MM, email).
- send_brochure: Envía info detallada cuando pidan más detalles.
- escalate_to_human: SOLO si dicen literalmente "quiero hablar con un humano".
- send_payment_link: Envía link de pago cuando confirmen compra + email.`;

// ============================================
// BUILD SYSTEM PROMPT
// ============================================

interface BuildPromptParams {
  message: string;
  context: ConversationContext;
  history: Array<{ role: string; content: string }>;
  conversationState: PersistedConversationState;
  agentConfig?: GraphAgentConfig;
}

export async function buildSystemPrompt(params: BuildPromptParams): Promise<string> {
  const { message, context, history, conversationState, agentConfig } = params;
  const parts: string[] = [];

  // 1. IDENTITY
  if (agentConfig?.systemPrompt) {
    // Tenant custom prompt — use as-is
    parts.push(agentConfig.systemPrompt);
  } else if (agentConfig?.businessName || agentConfig?.agentName) {
    // Dynamic identity from tenant config
    parts.push(buildDynamicIdentity(agentConfig));
    parts.push(DEFAULT_RULES);
  } else {
    // Loomi defaults
    parts.push(DEFAULT_IDENTITY);
    parts.push(DEFAULT_RULES);
  }

  // 2. KNOWLEDGE (tenant-specific or default)
  if (agentConfig?.knowledgeContext) {
    parts.push(agentConfig.knowledgeContext);
  } else {
    const knowledgeContext = getKnowledgeContextForSystemPrompt(message);
    if (knowledgeContext) parts.push(knowledgeContext);
  }

  // Tenant context fields
  if (agentConfig) {
    const tenantParts: string[] = [];
    if (agentConfig.productContext) tenantParts.push(`# PRODUCTO\n${agentConfig.productContext}`);
    if (agentConfig.pricingContext) tenantParts.push(`# PRECIOS\n${agentConfig.pricingContext}`);
    if (agentConfig.salesProcessContext) tenantParts.push(`# PROCESO DE VENTA\n${agentConfig.salesProcessContext}`);
    if (agentConfig.qualificationContext) tenantParts.push(`# CALIFICACIÓN\n${agentConfig.qualificationContext}`);
    if (agentConfig.competitorContext) tenantParts.push(`# COMPETENCIA\n${agentConfig.competitorContext}`);
    if (tenantParts.length > 0) parts.push(tenantParts.join('\n\n'));

    if (agentConfig.objectionHandlers && Object.keys(agentConfig.objectionHandlers).length > 0) {
      const handlers = Object.entries(agentConfig.objectionHandlers)
        .map(([objection, response]) => `"${objection}" → ${response}`)
        .join('\n');
      parts.push(`# OBJECIONES CUSTOM\n${handlers}`);
    }
  }

  // 3. FEW-SHOT EXAMPLES
  if (agentConfig?.fewShotExamples?.length) {
    const section = getFewShotContextFromTenant(message, history, agentConfig.fewShotExamples);
    if (section) parts.push(section);
  } else if (!agentConfig?.systemPrompt) {
    const section = await getFewShotContext(message, history);
    if (section) parts.push(section);
  }

  // 4. CONVERSATION CONTEXT
  const contextParts: string[] = [];

  if (context.lead.name && context.lead.name !== 'Usuario') {
    contextParts.push(`Cliente: ${context.lead.name}`);
  }
  if (context.lead.company) contextParts.push(`Negocio: ${context.lead.company}`);

  // Summary or memory
  if (conversationState.summary) {
    contextParts.push(`Resumen: ${conversationState.summary}`);
  } else if (context.memory) {
    contextParts.push(`Info previa: ${context.memory}`);
  }

  if (context.hasActiveAppointment) {
    contextParts.push(`⚠️ YA TIENE CITA AGENDADA — No proponer otra.`);
  }

  // Lead info
  const li = conversationState.lead_info;
  if (li.business_type) contextParts.push(`Tipo de negocio: ${li.business_type}`);
  if (li.volume) contextParts.push(`Volumen mensajes: ${li.volume}`);
  if (li.pain_points.length > 0) contextParts.push(`Dolores: ${li.pain_points.join(', ')}`);
  if (li.current_solution) contextParts.push(`Solución actual: ${li.current_solution}`);

  // Anti-repetition
  if (conversationState.topics_covered.length > 0) {
    contextParts.push(`Temas ya cubiertos (no repitas): ${conversationState.topics_covered.join(', ')}`);
  }

  // Proposed datetime
  if (conversationState.proposed_datetime) {
    const dt = conversationState.proposed_datetime;
    if (dt.date || dt.time) {
      contextParts.push(`Horario acordado: ${dt.date || '?'} ${dt.time || '?'}`);
    }
  }

  // Turn count + anti-loop
  contextParts.push(`Turno: ${conversationState.turn_count} | Fase actual: ${conversationState.phase}`);
  if (conversationState.turn_count >= 6) {
    contextParts.push(`⚠️ Llevas ${conversationState.turn_count} turnos. Avanza hacia una propuesta concreta. No repitas preguntas.`);
  }

  if (contextParts.length > 0) {
    parts.push(`# CONTEXTO\n${contextParts.join('\n')}`);
  }

  // 5. TONE (tenant override)
  if (agentConfig?.tone && agentConfig.tone !== 'professional') {
    const toneMap: Record<string, string> = {
      friendly: 'Tono amigable y cercano. Tutéa.',
      casual: 'Tono muy casual e informal. Habla como amigo.',
      formal: 'Tono formal, de usted.',
    };
    if (toneMap[agentConfig.tone]) parts.push(`# TONO\n${toneMap[agentConfig.tone]}`);
  }

  // 6. FINAL INSTRUCTION (highest recency attention)
  if (agentConfig?.systemPrompt) {
    // Tenant with custom prompt — reinforce key behaviors
    if (agentConfig.salesProcessContext) {
      parts.push(`# RECORDATORIO CRÍTICO\n${agentConfig.salesProcessContext}`);
    }
    parts.push(`# INSTRUCCIÓN FINAL
Toda respuesta debe tener datos concretos del producto. Imita el formato de los ejemplos anteriores.`);
  }

  return parts.join('\n\n');
}
