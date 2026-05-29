import type { WooApiError } from './types/woo';

/**
 * Type-guard: returns `true` if `body` is a WooCommerce API error response.
 */
export function isWooError(body: unknown): body is WooApiError {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as Record<string, unknown>).code === 'string' &&
    typeof (body as Record<string, unknown>).message === 'string' &&
    typeof (body as Record<string, unknown>).data === 'object' &&
    (body as Record<string, unknown>).data !== null &&
    typeof ((body as Record<string, unknown>).data as Record<string, unknown>).status === 'number'
  );
}

/**
 * Returns a Promise that resolves after `ms` milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RetryOptions {
  /** Maximum number of attempts (including the first). Defaults to 3. */
  maxAttempts?: number;
  /** Base delay in ms for exponential backoff. Defaults to 1000. */
  baseDelay?: number;
}

/**
 * Runs `fn`, retrying with exponential backoff on HTTP 5xx errors.
 *
 * Only retries when `fn` throws an error with a `.status` property that is
 * >= 500. All other errors are re-thrown immediately without retrying.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const baseDelay = opts.baseDelay ?? 1000;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const status =
        err !== null &&
        typeof err === 'object' &&
        typeof (err as Record<string, unknown>).status === 'number'
          ? (err as Record<string, unknown>).status as number
          : null;

      // Only retry on 5xx
      const isRetryable = status !== null && status >= 500;

      if (!isRetryable || attempt === maxAttempts) {
        throw err;
      }

      const delay = baseDelay * 2 ** (attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError;
}
