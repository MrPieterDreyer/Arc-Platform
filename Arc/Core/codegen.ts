/**
 * graphql-codegen configuration for @arc-platform/core
 *
 * USAGE:
 *   pnpm --filter @arc-platform/core codegen
 *
 * PREREQUISITES:
 *   - A running WPGraphQL endpoint (use wp-env: pnpm wp-env start in Pilot)
 *   - WP_GRAPHQL_ENDPOINT env var pointing to /graphql
 *   - WPGraphQL for WooCommerce plugin installed and activated
 *   - Public introspection enabled in WP Admin > GraphQL > Settings
 *
 * OUTPUT:
 *   src/graphql/__generated__/ — gitignored, regenerate when queries change
 *
 * NOTE: graphql-request v7 is the final release under this name.
 *   v8 is renamed to 'graffle'. Pin "^7.4.0" — do not upgrade across this boundary.
 */

import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  /**
   * WPGraphQL schema endpoint.
   * Falls back to the wp-env default when running locally.
   * Set WP_GRAPHQL_ENDPOINT in .env or CI environment for non-default URLs.
   */
  schema: process.env['WP_GRAPHQL_ENDPOINT'] ?? 'http://localhost:8888/graphql',

  /**
   * All .graphql files across all domain modules:
   *   products.graphql   — getProduct, getProducts, getProductVariations
   *   collections.graphql — getCollection, listCollections, getCollectionProducts
   *   search.graphql      — searchProducts
   *   customer.graphql    — getCustomerOrders
   *
   * New domain modules added in future plans are automatically picked up
   * by this glob pattern without requiring changes to this config.
   */
  documents: 'src/graphql/**/*.graphql',

  /**
   * Fail loudly if the documents glob matches no files.
   * This prevents silent misconfiguration (e.g. wrong cwd or glob typo).
   */
  ignoreNoDocuments: false,

  generates: {
    'src/graphql/__generated__/': {
      preset: 'client',
      presetConfig: {
        /**
         * Disable fragment masking — Arc consumers want direct field access,
         * not fragment-scoped types. Masking adds boilerplate with no benefit
         * for a server-side-first framework where fragments are used for
         * reuse, not encapsulation.
         */
        fragmentMasking: false,
      },
      config: {
        /**
         * Enforce that all scalars are explicitly mapped to TS types.
         * This prevents codegen from silently falling back to `any` for
         * custom WPGraphQL scalars (e.g. BlockAttributesObject, AvatarRatingEnum).
         */
        strictScalars: true,
        scalars: {
          ID: 'string',
          Upload: 'File',
          /** WPGraphQL custom scalars */
          BlockAttributesObject: 'Record<string, unknown>',
        },

        /**
         * Use `import type` for type-only imports — avoids runtime imports
         * of type-only symbols, which can cause bundler issues in strict
         * ESM environments.
         */
        useTypeImports: true,
      },
    },
  },
};

export default config;
