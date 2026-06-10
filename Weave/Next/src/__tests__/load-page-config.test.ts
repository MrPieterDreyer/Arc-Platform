import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cacheTagMock } from './__mocks__/next-cache.js';

// Controllable draft-mode double, hoisted so the `vi.mock` factory below can close over it
// (vi.mock is hoisted above plain top-level consts; vi.hoisted is the supported escape hatch).
const draft = vi.hoisted(() => ({ isEnabled: false }));

vi.mock('next/cache', () => ({
  cacheTag: cacheTagMock,
  cacheLife: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('next/headers', () => ({
  draftMode: vi.fn(async () => draft),
}));

// `loadPageConfig` validates against the real `@weave-platform/react` schema — no mock.

const VALID_CONFIG = {
  schemaVersion: 1,
  slug: 'home',
  sections: [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'hero',
      data: { heading: 'Hi' },
      version: 1,
    },
  ],
  updatedAt: '2026-06-01T00:00:00Z',
};

function stubFetch(impl: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', impl);
  return impl;
}

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

describe('WEAVE-NEXT-01 — loadPageConfig', () => {
  beforeEach(() => {
    cacheTagMock.mockClear();
    draft.isEnabled = false;
    process.env.WEAVE_WP_BASE_URL = 'http://localhost:8888';
    process.env.WEAVE_WP_APP_USER = 'admin';
    process.env.WEAVE_WP_APP_PASSWORD = 'pass word here';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.WEAVE_WP_BASE_URL = undefined;
    process.env.WEAVE_WP_APP_USER = undefined;
    process.env.WEAVE_WP_APP_PASSWORD = undefined;
  });

  // NOTE: assigning `undefined` to process.env coerces to the string "undefined"; use `delete`
  // to truly unset, which is what `readEnv()`'s falsy guard checks for.

  it('tags weave:page:{slug}, sends Basic auth, and parses the config (non-draft)', async () => {
    const fetchMock = stubFetch(vi.fn().mockResolvedValue(okResponse(VALID_CONFIG)));
    const { loadPageConfig } = await import('../load-page-config.js');

    await expect(loadPageConfig('home')).resolves.toEqual(VALID_CONFIG);

    expect(cacheTagMock).toHaveBeenCalledWith('weave:page:home');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8888/wp-json/weave/v1/pages/home',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Basic ${Buffer.from('admin:pass word here').toString('base64')}`,
        }),
      }),
    );
    // Non-draft path must NOT request `no-store`.
    const opts = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(opts.cache).toBeUndefined();
  });

  it('throws when HTTP is not ok (mentions slug + status)', async () => {
    stubFetch(vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }));
    const { loadPageConfig } = await import('../load-page-config.js');

    await expect(loadPageConfig('home')).rejects.toThrow(/home.*404|404.*home/);
  });

  it('throws when the response fails WeavePageConfigSchema.parse (missing slug)', async () => {
    const bad = { schemaVersion: 1, sections: [], updatedAt: '2026-06-01T00:00:00Z' };
    stubFetch(vi.fn().mockResolvedValue(okResponse(bad)));
    const { loadPageConfig } = await import('../load-page-config.js');

    await expect(loadPageConfig('home')).rejects.toThrow();
  });

  it('bypasses the cache in draft mode (cache:no-store, no cacheTag)', async () => {
    draft.isEnabled = true;
    const fetchMock = stubFetch(vi.fn().mockResolvedValue(okResponse(VALID_CONFIG)));
    const { loadPageConfig } = await import('../load-page-config.js');

    await expect(loadPageConfig('home')).resolves.toEqual(VALID_CONFIG);

    expect(cacheTagMock).not.toHaveBeenCalled();
    const opts = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(opts.cache).toBe('no-store');
  });

  it('throws "Missing WEAVE_WP_* env" before fetching when an env var is absent', async () => {
    process.env.WEAVE_WP_APP_PASSWORD = undefined;
    delete process.env.WEAVE_WP_APP_PASSWORD;
    const fetchMock = stubFetch(vi.fn());
    const { loadPageConfig } = await import('../load-page-config.js');

    await expect(loadPageConfig('home')).rejects.toThrow(/Missing WEAVE_WP_\* env/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
