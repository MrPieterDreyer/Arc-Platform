import { test } from '@playwright/test';

/**
 * Wave 8 — Weave WP Admin sidebar (Phase 4b).
 * Blocker: `Weave/WordPress/admin/src/` has no production editor UI yet (Vitest smoke only).
 * Remove @quarantine when list/reorder/save flows ship.
 */
test.describe('Wave 8 — WP Admin editor @quarantine', () => {
  test.skip('list / reorder / save smoke — editor not implemented @quarantine', async () => {
    // Target: wp-admin post editor sidebar mount + weave/v1 save round-trip.
  });
});
