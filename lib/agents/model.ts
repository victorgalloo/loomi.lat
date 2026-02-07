/**
 * Model Resolution Helper
 *
 * Resolves the correct AI model provider based on model string prefix.
 * - claude-* → Anthropic provider
 * - gpt-* → OpenAI provider
 * - null/undefined → Default (Claude Sonnet 4.5)
 */

import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';

export const DEFAULT_CHAT_MODEL = 'claude-sonnet-4-5-20250929';
export const DEFAULT_ANALYSIS_MODEL = 'claude-haiku-4-5-20251001';

/**
 * Resolve the correct model provider based on model string.
 * Supports both Anthropic (claude-*) and OpenAI (gpt-*) models.
 * Falls back to Claude Sonnet 4.5 when no override is provided.
 */
export function resolveModel(modelOverride?: string | null) {
  if (!modelOverride) {
    return anthropic(DEFAULT_CHAT_MODEL);
  }

  if (modelOverride.startsWith('claude-')) {
    return anthropic(modelOverride);
  }

  if (modelOverride.startsWith('gpt-')) {
    return openai(modelOverride);
  }

  // Unknown prefix — treat as OpenAI for backward compatibility
  return openai(modelOverride);
}
