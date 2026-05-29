/**
 * @arc/core — Public error types
 *
 * ArcError is the canonical discriminated union for all errors thrown by @arc/core.
 * Use it for exhaustive switch/match on error kind:
 *
 *   try { ... } catch (e) {
 *     if (e instanceof WooClientError) {
 *       const err: ArcError = e.arcError;
 *       if (err.type === 'api') console.log(err.status, err.code);
 *       if (err.type === 'network') console.log(err.cause);
 *     }
 *   }
 */

export type { WooApiError } from './woo.js';

/**
 * Discriminated union covering every error category @arc/core can produce.
 * Satisfies ARC-API-03.
 */
export type ArcError =
  | { type: 'api'; status: number; code: string; message: string; data?: unknown }
  | { type: 'network'; message: string; cause?: unknown }
  | { type: 'parse'; message: string; cause?: unknown };
