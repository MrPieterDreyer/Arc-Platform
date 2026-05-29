import { GraphQLClient } from 'graphql-request';

/**
 * Configuration for the WPGraphQL client.
 * The `authToken` callback is called on every request — return null/undefined
 * to make unauthenticated requests (public queries only).
 */
export interface WPGraphQLConfig {
  /** Full URL to the WPGraphQL endpoint, e.g. https://shop.example.com/graphql */
  endpoint: string;

  /**
   * Optional callback that returns a JWT or Application Password auth token.
   * Called on each request. Return null/undefined for unauthenticated requests.
   * In @arc/next, wire this to read the token from an HttpOnly cookie.
   */
  authToken?: () => string | null | undefined;
}

/**
 * Creates a configured graphql-request GraphQLClient for WPGraphQL.
 * Automatically injects `Authorization: Bearer {token}` when authToken returns
 * a non-null value. No `next/*` imports — framework-agnostic.
 *
 * @param config - WPGraphQL endpoint URL and optional auth token callback
 */
export function createWPGraphQLClient(config: WPGraphQLConfig): GraphQLClient {
  return new GraphQLClient(config.endpoint, {
    requestMiddleware: (request) => {
      if (!config.authToken) return request;
      const token = config.authToken();
      if (!token) return request;
      return {
        ...request,
        headers: {
          ...request.headers,
          Authorization: `Bearer ${token}`,
        },
      };
    },
  });
}
