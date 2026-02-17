/**
 * Model Resolution Helper
 *
 * Resolves all models to Anthropic Claude equivalents.
 * Any OpenAI model strings stored in the DB are mapped to Claude.
 * Optionally wraps models with PostHog tracing for LLM analytics.
 */

import { anthropic } from '@ai-sdk/anthropic';
import { withTracing } from '@posthog/ai/vercel';
import { getPostHogServer } from '@/lib/analytics/posthog';

export const DEFAULT_CHAT_MODEL = 'claude-sonnet-4-5-20250929';
export const DEFAULT_ANALYSIS_MODEL = 'claude-haiku-4-5-20251001';

const OPENAI_TO_CLAUDE: Record<string, string> = {
  'gpt-4o-mini': 'claude-haiku-4-5-20251001',
  'gpt-4o': 'claude-sonnet-4-5-20250929',
  'gpt-5.2-chat-latest': 'claude-sonnet-4-5-20250929',
};

export interface TracingOptions {
  distinctId: string;
  traceId?: string;
  properties?: Record<string, unknown>;
}

/**
 * Resolve the correct Anthropic model based on model string.
 * Maps any OpenAI model to its Claude equivalent.
 * Falls back to Claude Sonnet 4.5 when no override is provided.
 *
 * When tracing options are provided, wraps the model with PostHog
 * withTracing for $ai_generation event tracking.
 */
export function resolveModel(modelOverride?: string | null, tracing?: TracingOptions) {
  let model;

  if (!modelOverride) {
    model = anthropic(DEFAULT_CHAT_MODEL);
  } else if (modelOverride.startsWith('claude-')) {
    model = anthropic(modelOverride);
  } else {
    const mapped = OPENAI_TO_CLAUDE[modelOverride] ?? DEFAULT_CHAT_MODEL;
    model = anthropic(mapped);
  }

  if (tracing) {
    return withTracing(model, getPostHogServer(), {
      posthogDistinctId: tracing.distinctId,
      posthogTraceId: tracing.traceId,
      posthogProperties: tracing.properties,
    });
  }

  return model;
}
