/**
 * Generic retry utility with exponential backoff
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (error: unknown, attempt: number) => void;
}

/**
 * Retry an async function with exponential backoff.
 * Default: 3 attempts, 500ms initial delay, 5s max delay.
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 500,
    maxDelayMs = 5000,
    onRetry,
  } = options || {};

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;

      const delay = Math.min(initialDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      onRetry?.(error, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
