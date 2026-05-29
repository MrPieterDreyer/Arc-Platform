/**
 * Products contract tests — ARC-GQL-03 + ARC-GQL-04
 *
 * All tests are gated behind CI_WP_ENV=true so they skip cleanly in local
 * unit-test runs that do not have a live wp-env instance running.
 *
 * Run with a live wp-env:
 *   CI_WP_ENV=true WP_GRAPHQL_ENDPOINT=http://localhost:8888/graphql pnpm --filter @arc/core test --run
 */
import { describe, test, expect } from 'vitest';
import { createWPGraphQLClient } from '../../graphql/client';
import { getProduct, getProducts, getProductVariations } from '../../graphql/products';

const gqlClient = createWPGraphQLClient({
  endpoint: process.env.WP_GRAPHQL_ENDPOINT ?? 'http://localhost:8888/graphql',
});

const TEST_PRODUCT_SLUG =
  process.env.TEST_PRODUCT_SLUG ?? 'test-product';
const TEST_VARIABLE_PRODUCT_SLUG =
  process.env.TEST_VARIABLE_PRODUCT_SLUG ?? 'test-variable';

describe('Products GQL — ARC-GQL-03 + ARC-GQL-04', () => {
  // -------------------------------------------------------------------------
  // ARC-GQL-03: getProduct by slug
  // -------------------------------------------------------------------------
  test.skipIf(!process.env.CI_WP_ENV)(
    'getProduct by slug returns typed product with required fields',
    async () => {
      const product = await getProduct(gqlClient, TEST_PRODUCT_SLUG);

      expect(product).not.toBeNull();
      expect(typeof product!.databaseId).toBe('number');
      expect(typeof product!.name).toBe('string');
      expect(typeof product!.price).toBe('string');
      expect(typeof product!.slug).toBe('string');
    },
  );

  // -------------------------------------------------------------------------
  // ARC-GQL-03: getProducts list
  // -------------------------------------------------------------------------
  test.skipIf(!process.env.CI_WP_ENV)(
    'getProducts list returns nodes array and pageInfo',
    async () => {
      const list = await getProducts(gqlClient);

      expect(Array.isArray(list.nodes)).toBe(true);
      expect(list.nodes.length).toBeGreaterThanOrEqual(0);
      expect(typeof list.pageInfo.hasNextPage).toBe('boolean');
      // endCursor may be null when list is empty or single page
      expect(
        list.pageInfo.endCursor === null ||
          typeof list.pageInfo.endCursor === 'string',
      ).toBe(true);
    },
  );

  // -------------------------------------------------------------------------
  // ARC-GQL-03: getProducts with search filter
  // -------------------------------------------------------------------------
  test.skipIf(!process.env.CI_WP_ENV)(
    'getProducts with search filter returns WCProductList shape',
    async () => {
      const list = await getProducts(gqlClient, { search: 'test', first: 10 });

      expect(list).toHaveProperty('nodes');
      expect(list).toHaveProperty('pageInfo');
      expect(Array.isArray(list.nodes)).toBe(true);
      expect(typeof list.pageInfo.hasNextPage).toBe('boolean');
    },
  );

  // -------------------------------------------------------------------------
  // ARC-GQL-04: Two-fragment pattern — DetailFields vs ListFields
  // getProduct uses ProductDetailFields (has galleryImages)
  // getProducts uses ProductListFields (no galleryImages)
  // -------------------------------------------------------------------------
  test.skipIf(!process.env.CI_WP_ENV)(
    'getProduct (DetailFields) includes galleryImages; getProducts nodes (ListFields) do not',
    async () => {
      const product = await getProduct(gqlClient, TEST_PRODUCT_SLUG);
      // DetailFields: galleryImages should be present (may be empty array)
      expect(product).toHaveProperty('galleryImages');

      const list = await getProducts(gqlClient, { first: 5 });
      if (list.nodes.length > 0) {
        // ListFields: nodes must NOT have galleryImages
        expect(list.nodes[0]).not.toHaveProperty('galleryImages');
      }
    },
  );

  // -------------------------------------------------------------------------
  // ARC-GQL-03: Variation matrix — getProductVariations
  // -------------------------------------------------------------------------
  test.skipIf(!process.env.CI_WP_ENV)(
    'getProductVariations returns variation matrix from a VariableProduct',
    async () => {
      const product = await getProduct(gqlClient, TEST_VARIABLE_PRODUCT_SLUG);
      expect(product).not.toBeNull();

      const variations = getProductVariations(product!);
      expect(Array.isArray(variations)).toBe(true);
      expect(variations.length).toBeGreaterThan(0);

      const firstVariation = variations[0];
      expect(typeof firstVariation.databaseId).toBe('number');
      expect(Array.isArray(firstVariation.attributes)).toBe(true);
    },
  );
});

// ---------------------------------------------------------------------------
// Placeholder: Collections GQL — ARC-GQL-05 (filled by Plan 01-05)
// ---------------------------------------------------------------------------
describe('Collections GQL — ARC-GQL-05', () => {
  test.skipIf(!process.env.CI_WP_ENV)(
    'placeholder — getCollection and listCollections (Plan 01-05)',
    () => {
      // Implementation added by Plan 01-05
    },
  );
});

// ---------------------------------------------------------------------------
// Placeholder: Search GQL — ARC-GQL-06 (filled by Plan 01-05)
// ---------------------------------------------------------------------------
describe('Search GQL — ARC-GQL-06', () => {
  test.skipIf(!process.env.CI_WP_ENV)(
    'placeholder — searchProducts (Plan 01-05)',
    () => {
      // Implementation added by Plan 01-05
    },
  );
});
