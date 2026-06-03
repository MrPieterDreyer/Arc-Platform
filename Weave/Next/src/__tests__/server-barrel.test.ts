/**
 * `@weave/next` barrel export-surface contract (WEAVE-NEXT-01..04, Pitfall 5).
 *
 * The package exposes exactly two entry points — `.` (RSC-safe) and `./server` (server-only) — so
 * a symbol that exists in a module but is re-exported from NEITHER barrel is unreachable by
 * consumers. This suite locks both surfaces:
 *   - `./server` MUST export all five server APIs (a regression here once left `WeavePage`
 *     defined but unreachable — see the fix in server.ts).
 *   - `./index` MUST stay RSC-safe: it re-exports the pure `weaveTag` only and NONE of the
 *     server-only APIs (re-exporting one would drag `server-only` into a client graph).
 *
 * The Next runtime modules the server graph imports are stubbed so the barrel import is hermetic —
 * we assert the export SURFACE, not behavior (behavior lives in each module's own test).
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
  revalidateTag: vi.fn(),
}));
vi.mock('next/headers', () => ({
  draftMode: vi.fn(async () => ({ isEnabled: false, enable: vi.fn(), disable: vi.fn() })),
  cookies: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('@weave/next/server — export surface', () => {
  it('exports all five server APIs', async () => {
    const mod = await import('../server.js');

    // weaveTag is the cache-tag helper object; the other four are factory/component functions.
    expect(typeof mod.weaveTag).toBe('object');
    expect(typeof mod.weaveTag.page).toBe('function');
    expect(typeof mod.weaveTag.pageList).toBe('function');
    expect(typeof mod.loadPageConfig).toBe('function');
    expect(typeof mod.WeavePage).toBe('function');
    expect(typeof mod.createPreviewHandler).toBe('function');
    expect(typeof mod.createWeaveRevalidateHandler).toBe('function');
  });

  it('exposes WeavePage so storefront routes can import it (WEAVE-NEXT-02 reachability)', async () => {
    const mod = await import('../server.js');
    expect('WeavePage' in mod).toBe(true);
    expect(mod.WeavePage.name).toBe('WeavePage');
  });
});

describe('@weave/next (./index) — RSC-safe surface', () => {
  it('re-exports the pure weaveTag helper', async () => {
    const index = await import('../index.js');
    expect(typeof index.weaveTag).toBe('object');
    expect(index.weaveTag.page('home')).toBe('weave:page:home');
  });

  it('does NOT re-export any server-only API (keeps client graphs free of server-only)', async () => {
    const index = (await import('../index.js')) as Record<string, unknown>;
    expect('loadPageConfig' in index).toBe(false);
    expect('WeavePage' in index).toBe(false);
    expect('createPreviewHandler' in index).toBe(false);
    expect('createWeaveRevalidateHandler' in index).toBe(false);
  });

  it('shares a single weaveTag instance with the server barrel (one source of truth)', async () => {
    const index = await import('../index.js');
    const server = await import('../server.js');
    expect(server.weaveTag).toBe(index.weaveTag);
  });
});
