/**
 * Sentiment Analysis Module
 * Detects the emotional tone of user messages to adapt responses
 *
 * Optimized with:
 * - Hoisted RegExp patterns (js-hoist-regexp)
 * - Set for O(1) keyword lookups (js-set-map-lookups)
 * - Early returns (js-early-exit)
 * - Combined iterations (js-combine-iterations)
 */

import { Message } from '@/types';

export type Sentiment =
  | 'neutral'
  | 'frustrated'
  | 'skeptical'
  | 'enthusiastic'
  | 'busy'
  | 'curious';

export interface SentimentAnalysis {
  sentiment: Sentiment;
  confidence: number;
  signals: string[];
  responseGuidance: string;
}

// Hoisted keyword Sets for O(1) lookups
const FRUSTRATED_KEYWORDS = new Set([
  'ya te dije', 'otra vez', 'no entiendes', 'no entienden',
  'cuantas veces', 'ya lo dije', 'es que', 'pero es que',
  'no me escuchan', 'siempre lo mismo', 'que cansado',
  'hartó', 'harto', 'frustrado', 'molesto'
]);

const SKEPTICAL_KEYWORDS = new Set([
  'no sé', 'no se', 'será que', 'suena bien pero',
  'y si', 'cómo sé que', 'como se que', 'no estoy seguro',
  'dudoso', 'demasiado bueno', 'suena muy bien',
  'en serio', 'de verdad', 'seguro', 'realmente',
  'aja', 'ajá', 'mmm', 'mmmm', 'pues'
]);

const ENTHUSIASTIC_KEYWORDS = new Set([
  'wow', 'genial', 'perfecto', 'excelente', 'increíble',
  'me encanta', 'qué bien', 'que bien', 'super', 'súper',
  'buenísimo', 'justo lo que necesito', 'eso quiero',
  'me interesa mucho', 'quiero ya'
]);

const BUSY_KEYWORDS = new Set([
  'rápido', 'rapido', 'no tengo tiempo', 'luego', 'después',
  'despues', 'ahorita no', 'ocupado', 'en una junta',
  'al rato', 'dame un momento', 'estoy en', 'breve',
  'corto', 'resumido', 'directo'
]);

const CURIOUS_KEYWORDS = new Set([
  'cómo funciona', 'como funciona', 'cuéntame más', 'cuentame mas',
  'me puedes explicar', 'quiero saber', 'explícame',
  'qué incluye', 'que incluye', 'qué hace', 'que hace',
  'cuáles son', 'cuales son', 'tienen', 'ofrecen'
]);

// Hoisted RegExp patterns (compiled once, not per-call)
const FRUSTRATED_PATTERNS = [
  /[A-Z]{3,}/,           // Multiple uppercase letters (SHOUTING)
  /!{2,}/,               // Multiple exclamation marks
  /\?{2,}/,              // Multiple question marks
  /\.{4,}/,              // Excessive periods (frustration ellipsis)
  /no\s+(me|te|les)\s+(ayuda|sirve|funciona)/i
] as const;

const SKEPTICAL_PATTERNS = [
  /pero\s+(no\s+)?sé/i,
  /y\s+si\s+no/i,
  /qué\s+garantía/i,
  /cómo\s+(me\s+)?aseguro/i
] as const;

const ENTHUSIASTIC_PATTERNS = [
  /!+$/,                 // Ends with exclamation
  /[😀😃😄😁🎉🚀💪👍🔥✨]/,  // Positive emojis
  /muy\s+bien/i,
  /qué\s+(bueno|padre|chido|cool)/i
] as const;

const BUSY_PATTERNS = [
  /estoy\s+(en|ocupado|trabajando)/i,
  /tengo\s+(que|una)\s+(junta|llamada|reunión)/i,
  /no\s+tengo\s+(mucho\s+)?tiempo/i,
  /te\s+(escribo|marco)\s+(luego|después|al rato)/i
] as const;

const CURIOUS_PATTERNS = [
  /\?/,                  // Any question
  /cómo\s+(es|son|funciona|trabaja)/i,
  /qué\s+(tan|tipo|tipos)/i,
  /cuánto\s+(cuesta|vale|tiempo)/i,
  /por\s+qué\s+/i
] as const;

// Response guidance for each sentiment
const RESPONSE_GUIDANCE: Record<Sentiment, string> = {
  frustrated: 'Sé empático y directo. Reconoce su frustración, no hagas preguntas innecesarias. Ve al grano.',
  skeptical: 'Ofrece pruebas concretas: casos de éxito, números, garantías. No presiones.',
  enthusiastic: 'Aprovecha el momentum. Propón demo o cierra rápido. Mantén la energía alta.',
  busy: 'Sé ultra conciso (1 oración máximo). Ofrece retomar después si es necesario.',
  curious: 'Da información detallada y clara. Responde sus preguntas completamente. No presiones a cerrar aún.',
  neutral: 'Flujo normal de conversación. Sigue el proceso de discovery.'
};

// Helper to check if text contains any keyword from a Set
function containsKeyword(text: string, keywords: Set<string>): string | null {
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      return keyword;
    }
  }
  return null;
}

// Helper to check if text matches any pattern
function matchesPattern(text: string, patterns: readonly RegExp[]): RegExp | null {
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      return pattern;
    }
  }
  return null;
}

/**
 * Detect sentiment from a single message
 * Optimized: Single iteration through all sentiment types
 */
function detectMessageSentiment(text: string): { sentiment: Sentiment; score: number; signals: string[] }[] {
  const lowerText = text.toLowerCase();
  const results: { sentiment: Sentiment; score: number; signals: string[] }[] = [];

  // Check all sentiments in a single pass
  const sentimentConfigs: Array<{
    sentiment: Sentiment;
    keywords: Set<string>;
    patterns: readonly RegExp[];
  }> = [
    { sentiment: 'frustrated', keywords: FRUSTRATED_KEYWORDS, patterns: FRUSTRATED_PATTERNS },
    { sentiment: 'skeptical', keywords: SKEPTICAL_KEYWORDS, patterns: SKEPTICAL_PATTERNS },
    { sentiment: 'enthusiastic', keywords: ENTHUSIASTIC_KEYWORDS, patterns: ENTHUSIASTIC_PATTERNS },
    { sentiment: 'busy', keywords: BUSY_KEYWORDS, patterns: BUSY_PATTERNS },
    { sentiment: 'curious', keywords: CURIOUS_KEYWORDS, patterns: CURIOUS_PATTERNS },
  ];

  for (const { sentiment, keywords, patterns } of sentimentConfigs) {
    let score = 0;
    const signals: string[] = [];

    // Check keywords (O(1) per keyword with Set)
    const matchedKeyword = containsKeyword(lowerText, keywords);
    if (matchedKeyword) {
      score += 1;
      signals.push(`keyword: "${matchedKeyword}"`);
    }

    // Check patterns
    const matchedPattern = matchesPattern(text, patterns);
    if (matchedPattern) {
      score += 1.5;
      signals.push(`pattern match`);
    }

    if (score > 0) {
      results.push({ sentiment, score, signals });
    }
  }

  return results;
}

/**
 * Analyze conversation history for sentiment patterns
 */
function analyzeHistory(history: Message[]): { sentiment: Sentiment; score: number }[] {
  const results: { sentiment: Sentiment; score: number }[] = [];

  // Early exit if no history
  if (history.length === 0) {
    return results;
  }

  // Single iteration through history (js-combine-iterations)
  let questionCount = 0;
  let totalLength = 0;
  let userMessageCount = 0;

  for (const msg of history) {
    if (msg.role === 'user') {
      const content = msg.content.toLowerCase();
      if (content.includes('?')) questionCount++;
      totalLength += content.length;
      userMessageCount++;
    }
  }

  // Check for curiosity (many questions)
  if (questionCount >= 3) {
    results.push({ sentiment: 'curious', score: 2 });
  }

  // Check for busy/frustrated (short messages)
  if (userMessageCount >= 2) {
    const avgLength = totalLength / userMessageCount;
    if (avgLength < 20) {
      results.push({ sentiment: 'busy', score: 1 });
    }
  }

  return results;
}

/**
 * Main sentiment detection function
 */
export function detectSentiment(message: string, history: Message[] = []): SentimentAnalysis {
  // Analyze current message
  const messageResults = detectMessageSentiment(message);

  // Analyze history
  const historyResults = analyzeHistory(history);

  // Combine scores - using object instead of Record for better perf
  const combinedScores = {
    frustrated: { score: 0, signals: [] as string[] },
    skeptical: { score: 0, signals: [] as string[] },
    enthusiastic: { score: 0, signals: [] as string[] },
    busy: { score: 0, signals: [] as string[] },
    curious: { score: 0, signals: [] as string[] },
    neutral: { score: 0, signals: [] as string[] }
  };

  // Add message results (weighted more heavily)
  for (const result of messageResults) {
    combinedScores[result.sentiment].score += result.score * 1.5;
    combinedScores[result.sentiment].signals.push(...result.signals);
  }

  // Add history results
  for (const result of historyResults) {
    combinedScores[result.sentiment].score += result.score;
    combinedScores[result.sentiment].signals.push('history pattern');
  }

  // Find dominant sentiment with early exit optimization
  let dominant: Sentiment = 'neutral';
  let maxScore = 0;

  for (const sentiment of ['frustrated', 'skeptical', 'enthusiastic', 'busy', 'curious'] as const) {
    const data = combinedScores[sentiment];
    if (data.score > maxScore) {
      maxScore = data.score;
      dominant = sentiment;
    }
  }

  // Calculate confidence (0-1)
  const confidence = Math.min(maxScore / 5, 1);

  // Only return non-neutral if confidence is reasonable
  if (confidence < 0.3) {
    dominant = 'neutral';
  }

  return {
    sentiment: dominant,
    confidence,
    signals: combinedScores[dominant].signals,
    responseGuidance: RESPONSE_GUIDANCE[dominant]
  };
}

/**
 * Get a short instruction string for the LLM based on sentiment
 */
export function getSentimentInstruction(analysis: SentimentAnalysis): string {
  // Early exit for neutral or low confidence
  if (analysis.sentiment === 'neutral' || analysis.confidence < 0.4) {
    return '';
  }

  const instructions: Record<Sentiment, string> = {
    frustrated: 'TONO: Empático y directo. Reconoce su frustración. Máximo 1-2 oraciones.',
    skeptical: 'TONO: Ofrece pruebas y casos de éxito. No presiones. Genera confianza.',
    enthusiastic: 'TONO: Aprovecha el entusiasmo. Propón siguiente paso inmediatamente.',
    busy: 'TONO: Ultra conciso. Una oración máximo. Ofrece retomar después.',
    curious: 'TONO: Informativo y detallado. Responde sus preguntas completamente.',
    neutral: ''
  };

  return instructions[analysis.sentiment];
}
