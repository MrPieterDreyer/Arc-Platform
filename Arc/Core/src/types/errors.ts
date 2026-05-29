/**
 * @arc/core — Public error types
 *
 * Re-exports the ArcError discriminated union from the HTTP layer so consumers
 * can import error types from the types barrel without depending on internal
 * implementation paths.
 *
 * Usage:
 *   import type { WooApiError } from '@arc/core';
 *
 * For throwing / catching errors, use WooClientError directly:
 *   import { WooClientError } from '@arc/core';
 */

export type { WooApiError } from './woo.js';
