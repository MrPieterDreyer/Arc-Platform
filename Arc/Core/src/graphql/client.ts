import { GraphQLClient } from 'graphql-request';

/**
 * Configuration for the WPGraphQL client.
 */
export interface WPGraphQLConfig {
  /** WPGraphQL endpoint — typically {WP_URL}/graphql */
  endpoint: string;
  /** Optional factory that returns a Bearer token for authenticated queries. */
  authToken?: () => string | null | undefined;
}

/**
 * Creates a pre-configured `graphql-request` client for WPGraphQL.
 * Auth token is injected per-request via requestMiddleware so the factory
 * is always called fresh (supports token rotation without recreating client).
 */
export function createWPGraphQLClient(config: WPGraphQLConfig): GraphQLClient {
  const client = new GraphQLClient(config.endpoint, {
    headers: () => {
      const token = config.authToken?.();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      return headers;
    },
  });
  return client;
}
