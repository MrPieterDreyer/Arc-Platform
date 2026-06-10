import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ARC_AUTH_TOKEN_COOKIE, ARC_REFRESH_TOKEN_COOKIE } from '../constants.js';
import { createMockCookieJar } from './__mocks__/next-headers.js';

const jar = createMockCookieJar();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => jar),
}));

const ACCESS = 'header.payload.signature-access-0001';
const REFRESH = 'header.payload.signature-refresh-001';

describe('ADR-0009 — auth cookie bridge', () => {
  beforeEach(() => {
    jar.get.mockClear();
    jar.set.mockClear();
    jar.delete.mockClear();
    jar.set.mockImplementation((name, value, options) => {
      jar.store.set(name, { name, value, options });
    });
    jar.store.clear();
  });

  it('persistAuthCookies sets both cookies with ADR-0006 attributes + split lifetimes', async () => {
    const { AUTH_COOKIE_OPTIONS, persistAuthCookies, REFRESH_COOKIE_OPTIONS } = await import(
      '../auth-cookies.js'
    );
    await persistAuthCookies(ACCESS, REFRESH);

    expect(jar.set).toHaveBeenCalledWith(ARC_AUTH_TOKEN_COOKIE, ACCESS, AUTH_COOKIE_OPTIONS);
    expect(jar.set).toHaveBeenCalledWith(ARC_REFRESH_TOKEN_COOKIE, REFRESH, REFRESH_COOKIE_OPTIONS);
    expect(AUTH_COOKIE_OPTIONS).toMatchObject({ httpOnly: true, path: '/', maxAge: 900 });
    expect(REFRESH_COOKIE_OPTIONS).toMatchObject({ httpOnly: true, path: '/', maxAge: 1_209_600 });
  });

  it('persistAuthCookies rejects empty/short tokens before any cookie write (audit H-2)', async () => {
    const { persistAuthCookies } = await import('../auth-cookies.js');

    await expect(persistAuthCookies('', REFRESH)).rejects.toThrow(/auth token/);
    await expect(persistAuthCookies(ACCESS, 'tiny')).rejects.toThrow(/refresh token/);
    expect(jar.set).not.toHaveBeenCalled();
  });

  it('persistAuthCookies THROWS on a forbidden RSC write (login must fail loudly)', async () => {
    jar.set.mockImplementation(() => {
      throw new Error('Cookies can only be modified in a Server Action or Route Handler');
    });
    const { persistAuthCookies } = await import('../auth-cookies.js');

    await expect(persistAuthCookies(ACCESS, REFRESH)).rejects.toThrow(/Server Action/);
  });

  it('rotateAuthCookie swallows the RSC write restriction (token stays valid for this read)', async () => {
    jar.set.mockImplementation(() => {
      throw new Error('Cookies can only be modified in a Server Action or Route Handler');
    });
    const { rotateAuthCookie } = await import('../auth-cookies.js');

    await expect(rotateAuthCookie(ACCESS)).resolves.toBeUndefined();
  });

  it('clearAuthCookies deletes both cookies', async () => {
    const { clearAuthCookies } = await import('../auth-cookies.js');
    await clearAuthCookies();

    expect(jar.delete).toHaveBeenCalledWith(ARC_AUTH_TOKEN_COOKIE);
    expect(jar.delete).toHaveBeenCalledWith(ARC_REFRESH_TOKEN_COOKIE);
  });

  it('readAuthTokenValue / readRefreshTokenValue read the jar (RSC read-only)', async () => {
    jar.store.set(ARC_AUTH_TOKEN_COOKIE, { name: ARC_AUTH_TOKEN_COOKIE, value: ACCESS });
    jar.store.set(ARC_REFRESH_TOKEN_COOKIE, { name: ARC_REFRESH_TOKEN_COOKIE, value: REFRESH });

    const { readAuthTokenValue, readRefreshTokenValue } = await import('../auth-cookies.js');
    expect(await readAuthTokenValue()).toBe(ACCESS);
    expect(await readRefreshTokenValue()).toBe(REFRESH);
  });
});
