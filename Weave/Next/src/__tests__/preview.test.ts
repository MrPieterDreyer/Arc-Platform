import { beforeEach, describe, expect, it, vi } from 'vitest';

// Controllable draftMode double, hoisted so the `vi.mock('next/headers')` factory can close over it
// (vi.mock is hoisted above plain top-level consts; vi.hoisted is the supported escape hatch — the
// same pattern load-page-config.test.ts uses). `enable` is a spy so the valid-token path is observable.
const draft = vi.hoisted(() => ({ isEnabled: false, enable: vi.fn(), disable: vi.fn() }));

vi.mock('next/headers', () => ({
  draftMode: vi.fn(async () => draft),
}));

// `redirect` works by THROWING NEXT_REDIRECT — mirror that so the throw is observable in tests.
vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

const SECRET = 'super-secret-preview-token';

function requestFor(params: Record<string, string>): Request {
  const url = new URL('https://shop.example.com/api/preview');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Request(url.toString());
}

describe('WEAVE-NEXT-03 — createPreviewHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    draft.isEnabled = false;
  });

  it('returns 401 and does NOT enable draft mode for a bad token', async () => {
    const { createPreviewHandler } = await import('../preview.js');
    const handler = createPreviewHandler({ secret: SECRET });

    const res = await handler(requestFor({ token: 'wrong', slug: 'home' }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid preview token' });
    expect(draft.enable).not.toHaveBeenCalled();
  });

  it('returns 401 when no token is supplied (length mismatch, no throw)', async () => {
    const { createPreviewHandler } = await import('../preview.js');
    const handler = createPreviewHandler({ secret: SECRET });

    const res = await handler(requestFor({ slug: 'home' }));

    expect(res.status).toBe(401);
    expect(draft.enable).not.toHaveBeenCalled();
  });

  it('enables draft mode then redirects to /{slug} for a valid token', async () => {
    const { redirect } = await import('next/navigation');
    const { createPreviewHandler } = await import('../preview.js');
    const handler = createPreviewHandler({ secret: SECRET });

    // redirect() throws NEXT_REDIRECT — the handler must let it propagate (Pitfall 7).
    await expect(handler(requestFor({ token: SECRET, slug: 'home' }))).rejects.toThrow(
      'NEXT_REDIRECT:/home',
    );

    expect(draft.enable).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith('/home');
  });
});
