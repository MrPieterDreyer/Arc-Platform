import { afterEach, describe, expect, it, vi } from 'vitest';
import { loginCustomer, refreshAuthToken } from '../../graphql/auth';
import { createWPGraphQLClient } from '../../graphql/client';

/**
 * ADR-0009 — wp-graphql-jwt-authentication login/refresh mutations with
 * empty/short-token rejection (audit H-2).
 */
const ENDPOINT = 'https://shop.example.com/graphql';
const ACCESS = 'header.payload.signature-access-0001';
const REFRESH = 'header.payload.signature-refresh-001';
const USER = { databaseId: 7, email: 'jo@example.com', firstName: 'Jo', lastName: 'Soap' };

function mockGraphqlData(data: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('loginCustomer — ADR-0009', () => {
  it('returns both tokens + customer identity on success', async () => {
    mockGraphqlData({ login: { authToken: ACCESS, refreshToken: REFRESH, user: USER } });
    const client = createWPGraphQLClient({ endpoint: ENDPOINT });

    const result = await loginCustomer(client, { username: 'jo', password: 'pw' });
    expect(result).toEqual({ authToken: ACCESS, refreshToken: REFRESH, customer: USER });
  });

  it('rejects an empty authToken (never persist a malformed credential)', async () => {
    mockGraphqlData({ login: { authToken: '', refreshToken: REFRESH, user: USER } });
    const client = createWPGraphQLClient({ endpoint: ENDPOINT });

    await expect(loginCustomer(client, { username: 'jo', password: 'pw' })).rejects.toThrow(
      /authToken/,
    );
  });

  it('rejects a short refreshToken', async () => {
    mockGraphqlData({ login: { authToken: ACCESS, refreshToken: 'tiny', user: USER } });
    const client = createWPGraphQLClient({ endpoint: ENDPOINT });

    await expect(loginCustomer(client, { username: 'jo', password: 'pw' })).rejects.toThrow(
      /refreshToken/,
    );
  });

  it('rejects tokens without a user payload', async () => {
    mockGraphqlData({ login: { authToken: ACCESS, refreshToken: REFRESH, user: null } });
    const client = createWPGraphQLClient({ endpoint: ENDPOINT });

    await expect(loginCustomer(client, { username: 'jo', password: 'pw' })).rejects.toThrow(
      /user payload/,
    );
  });

  it('propagates GraphQL credential errors from graphql-request', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ errors: [{ message: 'incorrect_password' }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const client = createWPGraphQLClient({ endpoint: ENDPOINT });

    await expect(loginCustomer(client, { username: 'jo', password: 'nope' })).rejects.toThrow();
  });
});

describe('refreshAuthToken — ADR-0009', () => {
  it('exchanges the refresh token for a fresh access token', async () => {
    const fetchSpy = mockGraphqlData({ refreshJwtAuthToken: { authToken: ACCESS } });
    const client = createWPGraphQLClient({ endpoint: ENDPOINT });

    await expect(refreshAuthToken(client, REFRESH)).resolves.toBe(ACCESS);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('rejects a short refresh token WITHOUT calling the endpoint', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const client = createWPGraphQLClient({ endpoint: ENDPOINT });

    await expect(refreshAuthToken(client, 'tiny')).rejects.toThrow(/refreshToken/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects an empty/short returned authToken', async () => {
    mockGraphqlData({ refreshJwtAuthToken: { authToken: null } });
    const client = createWPGraphQLClient({ endpoint: ENDPOINT });

    await expect(refreshAuthToken(client, REFRESH)).rejects.toThrow(/authToken/);
  });
});
