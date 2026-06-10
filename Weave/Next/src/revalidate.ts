import 'server-only';

import { createRevalidateHandler } from '@arc-platform/next/server';

/**
 * `createWeaveRevalidateHandler({ secret })` (WEAVE-NEXT-04, D-07) — a THIN wrapper over
 * `@arc-platform/next`'s read-verified `createRevalidateHandler`, with `allowedTagPrefixes` PINNED to
 * `['weave:']`.
 *
 * All HMAC-SHA256 verification, the ±5min replay window, and the raw-body byte-parity read
 * (Pitfall 4) live in the reused `@arc-platform/next` handler — this module deliberately reimplements
 * NONE of it. Pinning the prefix means `weave:`-tagged webhooks are accepted while the
 * `@arc-platform/next` default `arc:` prefix is rejected with 400.
 */
export function createWeaveRevalidateHandler({ secret }: { secret: string }) {
  return createRevalidateHandler({ secret, allowedTagPrefixes: ['weave:'] });
}
