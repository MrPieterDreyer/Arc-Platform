/**
 * Resolve E2E URLs from environment (see Documentation/Testing/TESTING.md).
 */

import path from 'node:path';

import { applyStagingEnvOverrides } from './staging-env';

export type E2eEnvironmentName = 'local-wp-env' | 'staging' | 'ci-pr-smoke' | 'ci-nightly';

export interface E2eEnv {
  name: E2eEnvironmentName;
  wpUrl: string;
  storefrontUrl: string;
  graphqlEndpoint: string;
  storeApiCartUrl: string;
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function getE2eEnv(): E2eEnv {
  applyStagingEnvOverrides();

  const wpUrl = stripTrailingSlash(
    process.env.E2E_WP_URL ?? process.env.WP_URL ?? 'http://localhost:8888',
  );
  const storefrontUrl = stripTrailingSlash(
    process.env.E2E_STOREFRONT_URL ?? 'http://localhost:3000',
  );
  const graphqlEndpoint = stripTrailingSlash(
    process.env.ARC_GRAPHQL_ENDPOINT ?? process.env.WP_GRAPHQL_ENDPOINT ?? `${wpUrl}/graphql`,
  );
  const e2eEnv = process.env.E2E_ENV ?? 'local-wp-env';

  let name: E2eEnvironmentName = 'local-wp-env';
  if (process.env.CI === 'true' || process.env.CI === '1') {
    name = 'ci-pr-smoke';
  } else if (e2eEnv === 'staging') {
    name = 'staging';
  }

  return {
    name,
    wpUrl,
    storefrontUrl,
    graphqlEndpoint,
    storeApiCartUrl: `${wpUrl}/wp-json/wc/store/v1/cart`,
  };
}

export function repoRootFromPlaywrightConfig(configDir: string): string {
  // Arc/Next/examples/minimal-app → repo root (four levels up)
  return path.resolve(configDir, '..', '..', '..', '..');
}

/** Seeded simple product id from `.env.wp-test` (`pnpm wp:setup`). */
export function seededProductId(): number {
  const id = Number(process.env.TEST_PRODUCT_ID ?? '0');
  return Number.isFinite(id) && id > 0 ? id : 0;
}
