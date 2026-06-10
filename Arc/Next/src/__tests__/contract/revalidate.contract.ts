/**
 * ARC-NEXT-05 — revalidate webhook contract (live Next route)
 *
 * The handler's auth logic (HMAC verify, replay window, tag allowlist) is fully
 * unit-tested in revalidate.test.ts. This contract test exercises the real wire
 * format against a DEPLOYED revalidate route — the same signed request the Weave
 * WP plugin (Phase 4a) will send — and asserts it is accepted. The downstream
 * "next page load returns fresh data" half is an E2E concern verified in Phase 5
 * (Pilot, Playwright).
 *
 * Run against a deployed route:
 *   CI_WP_ENV=true ARC_REVALIDATE_URL=https://app.example.com/api/revalidate \
 *     WEAVE_WEBHOOK_SECRET=... pnpm --filter @arc-platform/next exec vitest run
 */
import { createHmac } from 'node:crypto';
import { describe, expect, test } from 'vitest';

const REVALIDATE_URL = process.env.ARC_REVALIDATE_URL;
const SECRET = process.env.WEAVE_WEBHOOK_SECRET ?? '';

describe('ARC-NEXT-05 — revalidate webhook contract', () => {
  test.skipIf(!process.env.CI_WP_ENV || !REVALIDATE_URL || !SECRET)(
    'a correctly HMAC-signed webhook POST is accepted by the deployed route',
    async () => {
      const timestamp = new Date().toISOString();
      const body = JSON.stringify({
        event: 'product.updated',
        tag: 'arc:product:contract-test',
        timestamp,
      });
      // Matches PHP `hash_hmac('sha256', $body, $secret)` — lowercase hex, `sha256=` prefix.
      const signature = `sha256=${createHmac('sha256', SECRET).update(body, 'utf8').digest('hex')}`;

      const res = await fetch(REVALIDATE_URL as string, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-weave-signature': signature,
          'x-weave-timestamp': timestamp,
        },
        body,
      });

      expect(res.status).toBe(200);
      const json = (await res.json()) as { revalidated?: boolean };
      expect(json.revalidated).toBe(true);
    },
  );
});
