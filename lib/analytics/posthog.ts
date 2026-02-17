/**
 * PostHog Server-Side Client Singleton
 *
 * Provides a shared PostHog client for server-side LLM analytics.
 * Used by withTracing (Vercel AI SDK) and LangChainCallbackHandler.
 */

import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

export function getPostHogServer(): PostHog {
  if (!posthogClient) {
    posthogClient = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_KEY!,
      { host: process.env.NEXT_PUBLIC_POSTHOG_HOST }
    );
  }
  return posthogClient;
}
