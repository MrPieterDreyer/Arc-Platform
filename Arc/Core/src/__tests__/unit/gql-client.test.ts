import { gql } from 'graphql-request';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWPGraphQLClient } from '../../graphql/client';

/**
 * ARC-GQL-01 — the WPGraphQL client injects `Authorization: Bearer {token}`
 * when (and only when) the `authToken` callback returns a non-null value.
 */
const QUERY = gql`query { __typename }`;
const ENDPOINT = 'https://shop.example.com/graphql';

function mockGraphqlOk() {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ data: { __typename: 'RootQuery' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
}

function authHeaderFrom(spy: ReturnType<typeof mockGraphqlOk>): string | null {
  const init = spy.mock.calls[0]?.[1];
  return new Headers(init?.headers as HeadersInit).get('Authorization');
}

describe('createWPGraphQLClient — ARC-GQL-01 auth header injection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('injects Authorization: Bearer when authToken returns a token', async () => {
    const fetchSpy = mockGraphqlOk();
    const client = createWPGraphQLClient({ endpoint: ENDPOINT, authToken: () => 'jwt_123' });
    await client.request(QUERY);
    expect(authHeaderFrom(fetchSpy)).toBe('Bearer jwt_123');
  });

  it('omits Authorization when authToken returns null', async () => {
    const fetchSpy = mockGraphqlOk();
    const client = createWPGraphQLClient({ endpoint: ENDPOINT, authToken: () => null });
    await client.request(QUERY);
    expect(authHeaderFrom(fetchSpy)).toBeNull();
  });

  it('omits Authorization when no authToken callback is provided', async () => {
    const fetchSpy = mockGraphqlOk();
    const client = createWPGraphQLClient({ endpoint: ENDPOINT });
    await client.request(QUERY);
    expect(authHeaderFrom(fetchSpy)).toBeNull();
  });
});
