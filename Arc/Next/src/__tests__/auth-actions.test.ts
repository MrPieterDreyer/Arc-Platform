import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ARC_AUTH_TOKEN_COOKIE, ARC_REFRESH_TOKEN_COOKIE } from '../constants.js';
import { createMockCookieJar } from './__mocks__/next-headers.js';

const jar = createMockCookieJar();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => jar),
}));

const ACCESS = 'header.payload.signature-access-0001';
const FRESH = 'header.payload.signature-access-fresh';
const REFRESH = 'header.payload.signature-refresh-001';
const USER = { databaseId: 7, email: 'jo@example.com', firstName: 'Jo', lastName: 'Soap' };

const loginCustomer = vi.fn();
const refreshAuthToken = vi.fn();
const getCustomerOrders = vi.fn();

vi.mock('@arc/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@arc/core')>();
  return {
    ...actual,
    loginCustomer,
    refreshAuthToken,
    getCustomerOrders,
  };
});

const ENDPOINT = 'https://cms.test/graphql';

describe('ADR-0009 — auth actions', () => {
  beforeEach(() => {
    jar.get.mockClear();
    jar.set.mockClear();
    jar.delete.mockClear();
    jar.set.mockImplementation((name, value, options) => {
      jar.store.set(name, { name, value, options });
    });
    jar.store.clear();
    loginCustomer.mockReset();
    refreshAuthToken.mockReset();
    getCustomerOrders.mockReset();
  });

  it('loginAction persists both cookies and returns ONLY the customer identity', async () => {
    loginCustomer.mockResolvedValue({ authToken: ACCESS, refreshToken: REFRESH, customer: USER });
    const { loginAction } = await import('../auth-actions.js');

    const customer = await loginAction({ username: 'jo', password: 'pw' }, ENDPOINT);

    expect(customer).toEqual(USER);
    expect(jar.store.get(ARC_AUTH_TOKEN_COOKIE)?.value).toBe(ACCESS);
    expect(jar.store.get(ARC_REFRESH_TOKEN_COOKIE)?.value).toBe(REFRESH);
  });

  it('loginAction propagates credential failures (no cookies written)', async () => {
    loginCustomer.mockRejectedValue(new Error('incorrect_password'));
    const { loginAction } = await import('../auth-actions.js');

    await expect(loginAction({ username: 'jo', password: 'nope' }, ENDPOINT)).rejects.toThrow(
      'incorrect_password',
    );
    expect(jar.set).not.toHaveBeenCalled();
  });

  it('logoutAction clears both cookies', async () => {
    const { logoutAction } = await import('../auth-actions.js');
    await logoutAction();

    expect(jar.delete).toHaveBeenCalledWith(ARC_AUTH_TOKEN_COOKIE);
    expect(jar.delete).toHaveBeenCalledWith(ARC_REFRESH_TOKEN_COOKIE);
  });

  it('getAuthToken returns the access cookie without a refresh round-trip', async () => {
    jar.store.set(ARC_AUTH_TOKEN_COOKIE, { name: ARC_AUTH_TOKEN_COOKIE, value: ACCESS });
    const { getAuthToken } = await import('../auth-actions.js');

    await expect(getAuthToken(ENDPOINT)).resolves.toBe(ACCESS);
    expect(refreshAuthToken).not.toHaveBeenCalled();
  });

  it('getAuthToken refreshes via the refresh cookie and rotates the access cookie', async () => {
    jar.store.set(ARC_REFRESH_TOKEN_COOKIE, { name: ARC_REFRESH_TOKEN_COOKIE, value: REFRESH });
    refreshAuthToken.mockResolvedValue(FRESH);
    const { getAuthToken } = await import('../auth-actions.js');

    await expect(getAuthToken(ENDPOINT)).resolves.toBe(FRESH);
    expect(refreshAuthToken).toHaveBeenCalledWith(expect.anything(), REFRESH);
    expect(jar.store.get(ARC_AUTH_TOKEN_COOKIE)?.value).toBe(FRESH);
  });

  it('getAuthToken resolves null for anonymous visitors', async () => {
    const { getAuthToken } = await import('../auth-actions.js');
    await expect(getAuthToken(ENDPOINT)).resolves.toBeNull();
  });

  it('getAuthToken resolves null when the refresh exchange fails (revoked/expired)', async () => {
    jar.store.set(ARC_REFRESH_TOKEN_COOKIE, { name: ARC_REFRESH_TOKEN_COOKIE, value: REFRESH });
    refreshAuthToken.mockRejectedValue(new Error('expired refresh token'));
    const { getAuthToken } = await import('../auth-actions.js');

    await expect(getAuthToken(ENDPOINT)).resolves.toBeNull();
  });

  it('loadCustomerOrders returns null for anonymous visitors — no env-token escape hatch', async () => {
    const { loadCustomerOrders } = await import('../auth-actions.js');

    await expect(loadCustomerOrders({ first: 10 }, ENDPOINT)).resolves.toBeNull();
    expect(getCustomerOrders).not.toHaveBeenCalled();
  });

  it('loadCustomerOrders queries with the cookie-bridged token when authenticated', async () => {
    jar.store.set(ARC_AUTH_TOKEN_COOKIE, { name: ARC_AUTH_TOKEN_COOKIE, value: ACCESS });
    const orders = { databaseId: 7, orders: { nodes: [], pageInfo: {} } };
    getCustomerOrders.mockResolvedValue(orders);
    const { loadCustomerOrders } = await import('../auth-actions.js');

    await expect(loadCustomerOrders({ first: 10 }, ENDPOINT)).resolves.toBe(orders);
    expect(getCustomerOrders).toHaveBeenCalledWith(expect.anything(), { first: 10 });
  });
});
