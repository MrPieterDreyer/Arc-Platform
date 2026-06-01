/**
 * @arc/core — Public error model (ARC-API-03)
 *
 * Every error thrown by @arc/core is an instance of {@link ArcClientError} and
 * carries a normalized {@link ArcError} discriminated union on its `.arcError`
 * property. This lets callers do exhaustive matching on the error category
 * without sniffing for HTTP-shaped fields:
 *
 *   import { isArcError } from '@arc/core';
 *
 *   try {
 *     await getCart(client);
 *   } catch (e) {
 *     if (isArcError(e)) {
 *       switch (e.arcError.type) {
 *         case 'api':     console.log(e.arcError.status, e.arcError.code); break;
 *         case 'network': console.log('offline?', e.arcError.cause); break;
 *         case 'parse':   console.log('bad body', e.arcError.cause); break;
 *       }
 *     }
 *   }
 */

export type { WooApiError } from './woo.js';

/**
 * Discriminated union covering every error category @arc/core can produce.
 * Satisfies ARC-API-03.
 *
 * - `api`     — the WC Store API returned a structured error response (4xx/5xx).
 * - `network` — the request never produced a response (DNS, offline, timeout, abort).
 * - `parse`   — a response arrived but its body could not be parsed as expected.
 */
export type ArcError =
  | { type: 'api'; status: number; code: string; message: string; data?: unknown }
  | { type: 'network'; message: string; cause?: unknown }
  | { type: 'parse'; message: string; cause?: unknown };

/**
 * Base class for every error @arc/core throws. Guarantees a normalized
 * {@link ArcError} is available on `.arcError` regardless of subclass.
 */
export abstract class ArcClientError extends Error {
  /** The normalized, discriminated error descriptor. */
  abstract readonly arcError: ArcError;
}

/**
 * Thrown when a request fails before a response is received — network down,
 * DNS failure, connection reset, timeout, or an aborted signal.
 */
export class ArcNetworkError extends ArcClientError {
  readonly arcError: Extract<ArcError, { type: 'network' }>;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ArcNetworkError';
    this.arcError = { type: 'network', message, cause };
  }
}

/**
 * Thrown when a response is received but its body cannot be parsed
 * (e.g. malformed JSON where JSON was expected).
 */
export class ArcParseError extends ArcClientError {
  readonly arcError: Extract<ArcError, { type: 'parse' }>;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ArcParseError';
    this.arcError = { type: 'parse', message, cause };
  }
}

/**
 * Type-guard: narrows an unknown caught value to {@link ArcClientError},
 * after which `.arcError` is safe to read.
 */
export function isArcError(value: unknown): value is ArcClientError {
  return value instanceof ArcClientError;
}
