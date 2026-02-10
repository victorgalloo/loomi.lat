/**
 * Response Guard - Post-generation length & quality enforcement
 *
 * Trims overly long responses, removes multiple questions,
 * and strips markdown artifacts.
 *
 * Used by both simple-agent.ts and LangGraph graph/nodes.ts.
 */

export interface GuardResult {
  response: string;
  wasGuarded: boolean;
  reason?: string;
}

// Sentence-ending patterns
const SENTENCE_END = /(?<=[.!?])\s+/;
const QUESTION_MARK = /\?/g;
const MARKDOWN_ARTIFACTS = /\*{1,2}|#{1,6}\s?/g;

export function guardResponse(response: string, maxSentences: number = 3): GuardResult {
  if (!response || !response.trim()) {
    return { response: response || '', wasGuarded: false };
  }

  let text = response.trim();
  let wasGuarded = false;
  const reasons: string[] = [];

  // Strip markdown artifacts
  const cleaned = text.replace(MARKDOWN_ARTIFACTS, '');
  if (cleaned !== text) {
    text = cleaned.trim();
    wasGuarded = true;
    reasons.push('stripped markdown');
  }

  // Split into sentences
  const sentences = text.split(SENTENCE_END).filter(s => s.trim().length > 0);

  // If too many sentences, keep first 2 + last question (or last sentence)
  if (sentences.length > maxSentences) {
    const questions = sentences.filter(s => s.includes('?'));
    const lastQuestion = questions.length > 0 ? questions[questions.length - 1] : null;

    if (lastQuestion && sentences.indexOf(lastQuestion) > 1) {
      // Keep first 2 sentences + last question
      text = [...sentences.slice(0, 2), lastQuestion].join(' ');
    } else {
      // Keep first maxSentences sentences
      text = sentences.slice(0, maxSentences).join(' ');
    }
    wasGuarded = true;
    reasons.push(`trimmed from ${sentences.length} to ${maxSentences} sentences`);
  }

  // If more than 1 question mark, keep only the last question
  const questionMatches = text.match(QUESTION_MARK);
  if (questionMatches && questionMatches.length > 1) {
    // Find the last question sentence and keep everything before the second-to-last question
    const questionSentences = text.split(SENTENCE_END).filter(s => s.includes('?'));
    if (questionSentences.length > 1) {
      const lastQ = questionSentences[questionSentences.length - 1];
      const nonQuestionParts = text.split(SENTENCE_END).filter(s => !s.includes('?'));
      text = [...nonQuestionParts.slice(0, 2), lastQ].join(' ');
      wasGuarded = true;
      reasons.push('removed duplicate questions');
    }
  }

  // Final safety: never return empty
  if (!text.trim()) {
    text = response.trim();
    wasGuarded = false;
  }

  return {
    response: text.trim(),
    wasGuarded,
    reason: reasons.length > 0 ? reasons.join('; ') : undefined,
  };
}
