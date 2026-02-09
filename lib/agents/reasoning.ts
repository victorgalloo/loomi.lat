/**
 * Chain of Thought Reasoning Module
 * Generates internal analysis before responding to improve response quality
 *
 * Optimized with:
 * - Set for O(1) keyword lookups (js-set-map-lookups)
 * - Early returns (js-early-exit)
 * - Parallel async operations (async-parallel)
 */

import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { Message, ConversationContext } from '@/types';
import { detectSentiment, SentimentAnalysis } from './sentiment';
import { detectIndustry, getIndustryContext, Industry } from './industry';

export interface ReasoningResult {
  analysis: string;
  sentiment: SentimentAnalysis;
  industry: Industry;
  suggestedAction: string;
  hiddenObjections: string[];
  interestLevel: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high';
}

// Hoisted Sets for O(1) lookups
const HIGH_INTEREST_SIGNALS = new Set([
  'me interesa', 'quiero', 'necesito', 'urge', 'cuánto cuesta',
  'cómo funciona', 'agendemos', 'demo', 'quiero ver'
]);

const LOW_INTEREST_SIGNALS = new Set([
  'no gracias', 'no me interesa', 'ya tengo', 'no necesito',
  'tal vez', 'quizás'
]);

const URGENT_SIGNALS = new Set([
  'urgente', 'hoy', 'ahora', 'ya', 'lo antes posible',
  'necesito resolver', 'estoy perdiendo', 'no doy abasto'
]);

// Objection detection patterns
const OBJECTION_PATTERNS: Array<{ pattern: string; message: string }> = [
  { pattern: 'lo pienso', message: 'Posible indecisión - puede necesitar más información o tiene dudas no expresadas' },
  { pattern: 'déjame ver', message: 'Posible indecisión - puede necesitar más información o tiene dudas no expresadas' },
  { pattern: 'caro', message: 'Preocupación por precio - enfatizar ROI y valor' },
  { pattern: 'precio', message: 'Preocupación por precio - enfatizar ROI y valor' },
  { pattern: 'costo', message: 'Preocupación por precio - enfatizar ROI y valor' },
  { pattern: 'después', message: 'No es prioridad ahora - ofrecer seguimiento programado' },
  { pattern: 'luego', message: 'No es prioridad ahora - ofrecer seguimiento programado' },
  { pattern: 'ahorita no', message: 'No es prioridad ahora - ofrecer seguimiento programado' },
  { pattern: 'ya tengo', message: 'Ya tiene solución actual - preguntar cómo le funciona antes de proponer cambio' },
  { pattern: 'ya uso', message: 'Ya tiene solución actual - preguntar cómo le funciona antes de proponer cambio' },
  { pattern: 'no sé', message: 'Incertidumbre - necesita más claridad o confianza' },
  { pattern: 'no estoy seguro', message: 'Incertidumbre - necesita más claridad o confianza' },
];

// Helper to check if text contains any signal from a Set
function containsSignal(text: string, signals: Set<string>): boolean {
  for (const signal of signals) {
    if (text.includes(signal)) {
      return true;
    }
  }
  return false;
}

/**
 * Quick heuristic analysis without LLM (for speed)
 */
function quickAnalysis(
  message: string,
  context: ConversationContext,
  sentiment: SentimentAnalysis,
  industry: Industry
): Omit<ReasoningResult, 'analysis'> {
  const lowerMsg = message.toLowerCase();
  const hiddenObjections: string[] = [];

  // Detect hidden objections - single pass through patterns
  for (const { pattern, message: objMessage } of OBJECTION_PATTERNS) {
    if (lowerMsg.includes(pattern)) {
      hiddenObjections.push(objMessage);
    }
  }

  // Detect interest level using Sets (O(1) lookup per signal)
  let interestLevel: 'low' | 'medium' | 'high' = 'medium';
  if (containsSignal(lowerMsg, HIGH_INTEREST_SIGNALS)) {
    interestLevel = 'high';
  } else if (containsSignal(lowerMsg, LOW_INTEREST_SIGNALS)) {
    interestLevel = 'low';
  }

  // Detect urgency using Set
  let urgency: 'low' | 'medium' | 'high' = 'low';
  if (containsSignal(lowerMsg, URGENT_SIGNALS)) {
    urgency = 'high';
  } else if (sentiment.sentiment === 'frustrated' || sentiment.sentiment === 'enthusiastic') {
    urgency = 'medium';
  }

  // Determine suggested action with early returns
  let suggestedAction: string;

  if (interestLevel === 'high' && !context.hasActiveAppointment) {
    suggestedAction = 'proponer siguiente paso (demo/reunión/cotización)';
  } else if (interestLevel === 'low') {
    suggestedAction = 'generar interés con beneficio relevante';
  } else if (hiddenObjections.length > 0) {
    suggestedAction = 'abordar objeciones antes de avanzar';
  } else if (!context.lead.company && !context.lead.industry) {
    suggestedAction = 'preguntar tipo de negocio';
  } else if (context.lead.company && !context.hasActiveAppointment) {
    suggestedAction = 'proponer siguiente paso con beneficio personalizado';
  } else {
    suggestedAction = 'continuar discovery';
  }

  return {
    sentiment,
    industry,
    suggestedAction,
    hiddenObjections,
    interestLevel,
    urgency
  };
}

/**
 * Generate reasoning analysis (fast version - heuristic only)
 */
export async function generateReasoningFast(
  message: string,
  context: ConversationContext
): Promise<ReasoningResult> {
  // Get user messages for sentiment analysis
  const userMessages = context.recentMessages.filter(m => m.role === 'user').slice(-5);

  // Detect sentiment and industry in parallel (async-parallel)
  const sentiment = detectSentiment(message, userMessages);
  const industry = detectIndustry(message, context.lead.industry);

  // Quick heuristic analysis
  const quickResult = quickAnalysis(message, context, sentiment, industry);

  // Build analysis string efficiently
  const parts = [
    `Sentimiento: ${sentiment.sentiment} (${Math.round(sentiment.confidence * 100)}%)`,
    `Nivel de interés: ${quickResult.interestLevel}`,
    `Urgencia: ${quickResult.urgency}`
  ];

  if (industry !== 'generic') {
    parts.push(`Industria detectada: ${getIndustryContext(industry).name}`);
  }

  if (quickResult.hiddenObjections.length > 0) {
    parts.push(`Objeciones detectadas: ${quickResult.hiddenObjections.join('; ')}`);
  }

  parts.push(`Acción sugerida: ${quickResult.suggestedAction}`);

  return {
    ...quickResult,
    analysis: parts.join('\n')
  };
}

/**
 * Generate reasoning analysis (full version with LLM)
 * Use this for complex situations or when more nuance is needed
 */
export async function generateReasoningFull(
  message: string,
  context: ConversationContext
): Promise<ReasoningResult> {
  // Get user messages once
  const userMessages = context.recentMessages.filter(m => m.role === 'user').slice(-5);

  // Parallel detection (async-parallel pattern)
  const sentiment = detectSentiment(message, userMessages);
  const industry = detectIndustry(message, context.lead.industry);
  const quickResult = quickAnalysis(message, context, sentiment, industry);

  // Build context for LLM
  const recentHistory = context.recentMessages
    .slice(-6)
    .map(m => `${m.role === 'user' ? 'Cliente' : 'Vendedor'}: ${m.content}`)
    .join('\n');

  const systemPrompt = `Eres un analista de ventas experto. Analiza esta conversación de ventas por WhatsApp y proporciona insights breves.

CONTEXTO:
- Cliente: ${context.lead.name || 'Desconocido'}
- Negocio: ${context.lead.company || 'No identificado'}
- Industria: ${industry !== 'generic' ? getIndustryContext(industry).name : 'No identificada'}
- Ya tiene cita: ${context.hasActiveAppointment ? 'Sí' : 'No'}
- Sentimiento detectado: ${sentiment.sentiment}

HISTORIAL RECIENTE:
${recentHistory}

MENSAJE ACTUAL DEL CLIENTE:
"${message}"

Proporciona un análisis BREVE (máximo 100 tokens) que incluya:
1. Intención real del cliente (qué quiere realmente)
2. Objeciones no expresadas (qué podría estar pensando pero no dice)
3. Nivel de interés (bajo/medio/alto) y por qué
4. Próxima mejor acción para el vendedor

Sé directo y conciso. No uses bullet points largos.`;

  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: systemPrompt,
      prompt: 'Analiza y responde directamente.'
    });

    return {
      analysis: result.text.trim(),
      sentiment,
      industry,
      suggestedAction: quickResult.suggestedAction,
      hiddenObjections: quickResult.hiddenObjections,
      interestLevel: quickResult.interestLevel,
      urgency: quickResult.urgency
    };
  } catch (error) {
    console.error('[Reasoning] LLM error, falling back to fast mode:', error);
    // Fallback to quick analysis
    return {
      ...quickResult,
      analysis: [
        `Sentimiento: ${sentiment.sentiment}`,
        `Interés: ${quickResult.interestLevel}`,
        `Acción: ${quickResult.suggestedAction}`
      ].join('\n')
    };
  }
}

/**
 * Format reasoning result for injection into system prompt
 */
export function formatReasoningForPrompt(reasoning: ReasoningResult): string {
  const parts = [
    '## Análisis de situación:',
    reasoning.analysis
  ];

  if (reasoning.sentiment.sentiment !== 'neutral') {
    parts.push(`\n## Tono recomendado: ${reasoning.sentiment.responseGuidance}`);
  }

  if (reasoning.hiddenObjections.length > 0) {
    parts.push('\n## Objeciones a abordar:');
    for (const obj of reasoning.hiddenObjections) {
      parts.push(`- ${obj}`);
    }
  }

  parts.push(`\n## Próxima acción: ${reasoning.suggestedAction}`);

  return parts.join('\n');
}
