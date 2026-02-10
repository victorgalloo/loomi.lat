/**
 * Model Resolution Helper
 *
 * Resolves all models to Anthropic Claude equivalents.
 * Any OpenAI model strings stored in the DB are mapped to Claude.
 */

import { anthropic } from '@ai-sdk/anthropic';

export const DEFAULT_CHAT_MODEL = 'claude-sonnet-4-5-20250929';
export const DEFAULT_ANALYSIS_MODEL = 'claude-haiku-4-5-20251001';

const OPENAI_TO_CLAUDE: Record<string, string> = {
  'gpt-4o-mini': 'claude-haiku-4-5-20251001',
  'gpt-4o': 'claude-sonnet-4-5-20250929',
  'gpt-5.2-chat-latest': 'claude-sonnet-4-5-20250929',
};

/**
 * Resolve the correct Anthropic model based on model string.
 * Maps any OpenAI model to its Claude equivalent.
 * Falls back to Claude Sonnet 4.5 when no override is provided.
 */
export function resolveModel(modelOverride?: string | null) {
  if (!modelOverride) {
    return anthropic(DEFAULT_CHAT_MODEL);
  }

  if (modelOverride.startsWith('claude-')) {
    return anthropic(modelOverride);
  }

  // Map known OpenAI models; unknown ones default to Sonnet
  const mapped = OPENAI_TO_CLAUDE[modelOverride] ?? DEFAULT_CHAT_MODEL;
  return anthropic(mapped);
}
