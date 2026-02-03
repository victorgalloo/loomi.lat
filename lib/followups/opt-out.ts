/**
 * Opt-Out Detection for Follow-ups
 *
 * Detects negative signals to stop follow-up sequences:
 * - Explicit opt-out keywords ("no gracias", "no me interesa")
 * - Short/cold responses that indicate disinterest
 * - Frustration signals
 */

// Explicit opt-out keywords (Set for O(1) lookup)
const OPT_OUT_KEYWORDS = new Set([
  'no gracias',
  'no, gracias',
  'no me interesa',
  'no me interesa gracias',
  'no estoy interesado',
  'no estoy interesada',
  'no quiero',
  'no necesito',
  'deja de escribirme',
  'deja de escribir',
  'no me escribas',
  'no me contactes',
  'para de escribir',
  'basta',
  'stop',
  'unsubscribe',
  'cancelar',
  'ya no',
  'no mas',
  'no más',
  'dejame en paz',
  'déjame en paz',
  'no molestes',
  'no jodas',
  'bájame',
  'dame de baja',
  'quiero darme de baja',
  'elimíname',
  'eliminame',
  'bórrame',
  'borrame',
]);

// Short negative responses (exact matches)
const SHORT_NEGATIVES = new Set([
  'no',
  'nel',
  'nop',
  'nope',
  'nah',
  'paso',
  'x',
  'xx',
  '👎',
  '🚫',
  '❌',
  '✋',
]);

// Polite but firm rejections (partial matches)
const REJECTION_PHRASES = [
  'gracias pero no',
  'gracias, pero no',
  'por ahora no',
  'ahorita no',
  'en este momento no',
  'no por ahora',
  'no en este momento',
  'quizás después', // followed by no response = soft no
  'tal vez luego',
  'no es para mi',
  'no es para mí',
  'no me sirve',
  'no me conviene',
  'ya tengo',
  'ya lo tengo',
  'ya cuento con',
  'no lo necesito',
  'estoy bien así',
  'estoy bien asi',
  'no busco eso',
  'no es lo que busco',
];

// Cold/disinterested responses (very short, no engagement)
const COLD_RESPONSE_MAX_LENGTH = 5;
const COLD_RESPONSE_PATTERNS = [
  /^ok+$/i,
  /^k+$/i,
  /^si+$/i,
  /^ya$/i,
  /^aja+$/i,
  /^ajá+$/i,
  /^mm+$/i,
  /^hmm+$/i,
  /^bien$/i,
  /^va$/i,
  /^sale$/i,
  /^bueno$/i,
  /^\.+$/,  // Just dots
  /^👍$/,   // Just thumbs up (minimal engagement)
];

export interface OptOutResult {
  isOptOut: boolean;
  isColdResponse: boolean;
  reason?: 'explicit_keyword' | 'short_negative' | 'rejection_phrase' | 'cold_response';
  shouldStopFollowUps: boolean;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Detect if a message indicates opt-out or disinterest
 */
export function detectOptOut(message: string): OptOutResult {
  const normalized = message.toLowerCase().trim();

  // 1. Check explicit opt-out keywords (high confidence)
  if (OPT_OUT_KEYWORDS.has(normalized)) {
    return {
      isOptOut: true,
      isColdResponse: false,
      reason: 'explicit_keyword',
      shouldStopFollowUps: true,
      confidence: 'high',
    };
  }

  // 2. Check short negative responses (high confidence)
  if (SHORT_NEGATIVES.has(normalized)) {
    return {
      isOptOut: true,
      isColdResponse: false,
      reason: 'short_negative',
      shouldStopFollowUps: true,
      confidence: 'high',
    };
  }

  // 3. Check rejection phrases (medium confidence)
  for (const phrase of REJECTION_PHRASES) {
    if (normalized.includes(phrase)) {
      return {
        isOptOut: true,
        isColdResponse: false,
        reason: 'rejection_phrase',
        shouldStopFollowUps: true,
        confidence: 'medium',
      };
    }
  }

  // 4. Check cold/disinterested responses (low confidence - track but don't stop yet)
  if (normalized.length <= COLD_RESPONSE_MAX_LENGTH) {
    for (const pattern of COLD_RESPONSE_PATTERNS) {
      if (pattern.test(normalized)) {
        return {
          isOptOut: false,
          isColdResponse: true,
          reason: 'cold_response',
          shouldStopFollowUps: false, // Don't stop on first cold response
          confidence: 'low',
        };
      }
    }
  }

  return {
    isOptOut: false,
    isColdResponse: false,
    shouldStopFollowUps: false,
    confidence: 'low',
  };
}

/**
 * Check if multiple cold responses indicate disinterest
 * Call this with recent messages to detect pattern of disengagement
 */
export function detectColdResponsePattern(
  recentMessages: Array<{ role: string; content: string }>
): boolean {
  // Get last 3 user messages
  const userMessages = recentMessages
    .filter(m => m.role === 'user')
    .slice(-3);

  if (userMessages.length < 2) return false;

  // Count cold responses
  let coldCount = 0;
  for (const msg of userMessages) {
    const result = detectOptOut(msg.content);
    if (result.isColdResponse) {
      coldCount++;
    }
  }

  // If 2+ of last 3 messages are cold, they're disengaged
  return coldCount >= 2;
}

/**
 * Combined check for opt-out signals
 * Use this in the webhook to determine if follow-ups should stop
 */
export function shouldStopFollowUps(
  currentMessage: string,
  recentMessages?: Array<{ role: string; content: string }>
): { stop: boolean; reason?: string } {
  // Check current message
  const result = detectOptOut(currentMessage);

  if (result.shouldStopFollowUps) {
    return {
      stop: true,
      reason: `Opt-out detected: ${result.reason} (${result.confidence} confidence)`,
    };
  }

  // Check for pattern of cold responses
  if (recentMessages && detectColdResponsePattern(recentMessages)) {
    return {
      stop: true,
      reason: 'Multiple cold responses detected - lead disengaged',
    };
  }

  return { stop: false };
}
