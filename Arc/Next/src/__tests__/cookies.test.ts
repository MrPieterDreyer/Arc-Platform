import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ARC_CART_TOKEN_COOKIE } from '../constants.js';
import { CART_COOKIE_OPTIONS } from '../cookies.js';
import { createMockCookieJar } from './__mocks__/next-headers.js';

const jar = createMockCookieJar();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => jar),
}));

describe('ARC-NEXT-02 — cart token cookie bridge', () => {
  beforeEach(() => {
    jar.get.mockClear();
    jar.set.mockClear();
    jar.store.clear();
  });

  it('refreshCartTokenCookie re-sets Max-Age when token unchanged (D-05)', async () => {
    jar.store.set(ARC_CART_TOKEN_COOKIE, {
      name: ARC_CART_TOKEN_COOKIE,
      value: 'tok_unchanged',
    });

    const { refreshCartTokenCookie } = await import('../cookies.js');
    await refreshCartTokenCookie();

    expect(jar.set).toHaveBeenCalledWith(
      ARC_CART_TOKEN_COOKIE,
      'tok_unchanged',
      CART_COOKIE_OPTIONS,
    );
  });

  it('refreshCartTokenCookie no-ops when cookie absent', async () => {
    const { refreshCartTokenCookie } = await import('../cookies.js');
    await refreshCartTokenCookie();
    expect(jar.set).not.toHaveBeenCalled();
  });

  it('createCartClient wires getCartToken from the cookie jar', async () => {
    jar.store.set(ARC_CART_TOKEN_COOKIE, {
      name: ARC_CART_TOKEN_COOKIE,
      value: 'tok_read',
    });

    const { createCartClient, readCartTokenValue } = await import('../cookies.js');
    await createCartClient('https://shop.test');
    expect(await readCartTokenValue()).toBe('tok_read');
    expect(jar.get).toHaveBeenCalledWith(ARC_CART_TOKEN_COOKIE);
  });

  it('createReadOnlyCartClient reads token without persisting', async () => {
    jar.store.set(ARC_CART_TOKEN_COOKIE, {
      name: ARC_CART_TOKEN_COOKIE,
      value: 'tok_ro',
    });

    const { createReadOnlyCartClient } = await import('../cookies.js');
    const client = await createReadOnlyCartClient('https://shop.test');
    expect(client).toBeDefined();
    expect(jar.set).not.toHaveBeenCalled();
  });

  it('createCartClient swallows cookie set failures during RSC', async () => {
    jar.set.mockImplementation(() => {
      throw new Error('Cookies can only be modified in a Server Action or Route Handler');
    });

    const { createCartClient } = await import('../cookies.js');
    const client = await createCartClient('https://shop.test');
    expect(client).toBeDefined();
  });

  it('CART_COOKIE_OPTIONS match ADR-0006', () => {
    expect(CART_COOKIE_OPTIONS).toEqual({
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
      maxAge: 2_592_000,
    });
  });
});

describe('ARC_CART_COOKIE_SECURE override (decision 1-F, ADR-0006)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('honors =false outside production (SameSite=Lax for local HTTP E2E)', async () => {
    vi.resetModules();
    vi.stubEnv('ARC_CART_COOKIE_SECURE', 'false');
    vi.stubEnv('NODE_ENV', 'test');

    const { CART_COOKIE_OPTIONS: opts } = await import('../cookies.js');
    expect(opts.secure).toBe(false);
    expect(opts.sameSite).toBe('lax');
  });

  it('ignores =false in production — fail closed to SameSite=None; Secure', async () => {
    vi.resetModules();
    vi.stubEnv('ARC_CART_COOKIE_SECURE', 'false');
    vi.stubEnv('NODE_ENV', 'production');

    const { CART_COOKIE_OPTIONS: opts } = await import('../cookies.js');
    expect(opts.secure).toBe(true);
    expect(opts.sameSite).toBe('none');
  });
});
