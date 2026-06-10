import 'server-only';

import { createWPGraphQLClient } from '@arc-platform/core';
import { GraphQLClient } from 'graphql-request';
import { createCartClient } from './cookies.js';

export interface ArcClientConfig {
  wcBaseUrl: string;
  graphqlEndpoint: string;
  graphqlHeaders?: Record<string, string>;
}

export interface CatalogClientConfig {
  graphqlEndpoint: string;
  graphqlHeaders?: Record<string, string>;
}

/** Anonymous catalog client — no `cookies()` (safe inside `'use cache'` loaders). */
export function createCatalogClient(config: CatalogClientConfig): GraphQLClient {
  if (config.graphqlHeaders && Object.keys(config.graphqlHeaders).length > 0) {
    return new GraphQLClient(config.graphqlEndpoint, { headers: config.graphqlHeaders });
  }
  return createWPGraphQLClient({ endpoint: config.graphqlEndpoint });
}

/** Hydrogen-style factory: cookie-bridged WooClient + WPGraphQL catalog client. */
export async function createArcClient(config: ArcClientConfig) {
  const woo = await createCartClient(config.wcBaseUrl);
  const gql = createCatalogClient({
    graphqlEndpoint: config.graphqlEndpoint,
    graphqlHeaders: config.graphqlHeaders,
  });
  return { woo, gql } as const;
}
