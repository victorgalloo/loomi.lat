/**
 * Fetch with timeout using AbortController
 * Prevents hanging requests from blocking the webhook pipeline
 */

export class FetchTimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`Fetch timeout after ${timeoutMs}ms: ${url}`);
    this.name = 'FetchTimeoutError';
  }
}

/**
 * Wrapper around fetch() that aborts after `timeoutMs` milliseconds.
 * Default timeout: 8 seconds.
 */
export async function fetchWithTimeout(
  url: string | URL | Request,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const { timeoutMs = 8000, ...fetchInit } = init || {};

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchInit,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      throw new FetchTimeoutError(urlStr, timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
