/**
 * `@weave/next` barrel export-surface contract (WEAVE-NEXT-01..04, Pitfall 5).
 *
 * The package exposes exactly two entry points — `.` (RSC-safe) and `./server` (server-only).
 * This suite locks both surfaces:
 *   - `./server` exports the four server APIs that do NOT pull a client-only module: `weaveTag`,
 *     `loadPageConfig`, `createPreviewHandler`, `createWeaveRevalidateHandler`.
 *   - `./server` must NOT re-export `WeavePage`: it imports the `@weave/react` barrel (`import
 *     'client-only'`), so re-exporting it here would drag `client-only` into the RSC graph of any
 *     consumer importing `@weave/next/server` from a Server Component and break their build. This
 *     assertion guards that exact regression (see the comment in server.ts + examples/minimal-app).
 *   - `./index` MUST stay RSC-safe: pure `weaveTag` only, NONE of the server-only APIs.
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
  it('exports the four server APIs that are safe for the RSC server graph', async () => {
    const mod = await import('../server.js');

    // weaveTag is the cache-tag helper object; the other three are factory functions.
    expect(typeof mod.weaveTag).toBe('object');
    expect(typeof mod.weaveTag.page).toBe('function');
    expect(typeof mod.weaveTag.pageList).toBe('function');
    expect(typeof mod.loadPageConfig).toBe('function');
    expect(typeof mod.createPreviewHandler).toBe('function');
    expect(typeof mod.createWeaveRevalidateHandler).toBe('function');
  });

  it('does NOT re-export WeavePage (it pulls @weave/react client-only into the server graph)', async () => {
    // Re-exporting WeavePage here breaks any consumer that imports `@weave/next/server` from a
    // Server Component ("'client-only' cannot be imported from a Server Component module").
    // Consumers use loadPageConfig + a Client Component <SectionRenderer> wrapper instead.
    const mod = (await import('../server.js')) as Record<string, unknown>;
    expect('WeavePage' in mod).toBe(false);
  });
});

describe('@weave/next/server-page — WeavePage entry', () => {
  it('exports WeavePage for all-in-one storefront routes', async () => {
    const mod = await import('../server-page.js');
    expect('WeavePage' in mod).toBe(true);
    expect(typeof mod.WeavePage).toBe('function');
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
