import {
  GraphQLClient,
  type RequestMiddleware,
  type ResponseMiddleware,
} from 'graphql-request';

export interface WPGraphQLConfig {
  /** Full URL to the WPGraphQL endpoint, e.g. https://store.example.com/graphql */
  endpoint: string;
  /** Optional function returning the current JWT/auth token (or null/undefined if unauthenticated) */
  authToken?: () => string | null | undefined;
}

/**
 * Creates a GraphQLClient configured for WPGraphQL.
 *
 * - Injects `Authorization: Bearer <token>` when authToken() returns a value.
 * - Logs GraphQL-level errors in development (process.env.NODE_ENV !== 'production').
 * - No next/* imports — fully framework-agnostic.
 */
export function createWPGraphQLClient(config: WPGraphQLConfig): GraphQLClient {
  const requestMiddleware: RequestMiddleware = async (request) => {
    const token = config.authToken?.();
    return {
      ...request,
      headers: {
        ...request.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  };

  const responseMiddleware: ResponseMiddleware = (response) => {
    if (response instanceof Error) return;
    // Log GraphQL errors in non-production environments
    const isDev =
      typeof globalThis !== 'undefined' &&
      'process' in globalThis &&
      // biome-ignore lint/suspicious/noExplicitAny: process is not typed in browser builds
      (globalThis as any).process?.env?.NODE_ENV !== 'production';
    if (
      isDev &&
      'errors' in response &&
      Array.isArray(response.errors) &&
      response.errors.length > 0
    ) {
      for (const err of response.errors) {
        console.warn('[WPGraphQL]', err.message, err.extensions ?? '');
      }
    }
  };

  return new GraphQLClient(config.endpoint, {
    requestMiddleware,
    responseMiddleware,
  });
}
