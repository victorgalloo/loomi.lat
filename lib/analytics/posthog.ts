/**
 * PostHog Server-Side Client Singleton
 *
 * Provides a shared PostHog client for server-side LLM analytics.
 * Used by withTracing (Vercel AI SDK) and LangChainCallbackHandler.
 *
 * flushPostHog() must be called before serverless functions return,
 * otherwise batched events may be lost.
 */

import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

export function getPostHogServer(): PostHog {
  if (!posthogClient) {
    posthogClient = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_KEY!,
      {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        flushAt: 1,
        flushInterval: 0,
      }
    );
  }
  return posthogClient;
}

/**
 * Flush pending PostHog events. Call this before serverless function returns.
 */
export async function flushPostHog(): Promise<void> {
  if (posthogClient) {
    await posthogClient.flush();
  }
}
