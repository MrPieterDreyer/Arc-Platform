import { beforeEach, describe, expect, it, vi } from 'vitest';
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
