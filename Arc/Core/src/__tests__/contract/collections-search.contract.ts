/**
 * Contract tests for Collections + Search GraphQL modules.
 * ARC-GQL-05: Collections — getCollection, listCollections, getCollectionProducts
 * ARC-GQL-06: Search — searchProducts
 *
 * All tests are gated on CI_WP_ENV and will skip cleanly without a live wp-env fixture.
 */

import { describe, expect, test } from 'vitest';
import { createWPGraphQLClient } from '../../graphql/client.js';
import {
  getCollection,
  getCollectionProducts,
  listCollections,
} from '../../graphql/collections.js';
import { searchProducts } from '../../graphql/search.js';

const gqlClient = createWPGraphQLClient({
  endpoint: process.env['WP_GRAPHQL_ENDPOINT'] ?? 'http://localhost:8888/graphql',
});

// ---------------------------------------------------------------------------
// ARC-GQL-05 — Collections
// ---------------------------------------------------------------------------

describe('Collections GQL — ARC-GQL-05', () => {
  test.skipIf(!process.env['CI_WP_ENV'])(
    'listCollections returns nodes array with slug + name',
    async () => {
      const result = await listCollections(gqlClient);
      expect(result).toHaveProperty('nodes');
      expect(Array.isArray(result.nodes)).toBe(true);
      for (const node of result.nodes) {
        expect(typeof node.slug).toBe('string');
        expect(typeof node.name).toBe('string');
      }
    },
  );

  test.skipIf(!process.env['CI_WP_ENV'])(
    'getCollection by slug returns databaseId, name, and children field',
    async () => {
      const slug = process.env['TEST_COLLECTION_SLUG'] ?? 'uncategorized';
      const result = await getCollection(gqlClient, slug);
      expect(result).not.toBeNull();
      if (result === null) return;
      expect(typeof result.databaseId).toBe('number');
      expect(typeof result.name).toBe('string');
      // children field should exist (may be empty nodes array)
      expect(result).toHaveProperty('children');
    },
  );

  test.skipIf(!process.env['CI_WP_ENV'])(
    'getCollectionProducts returns WCProductList shape with pageInfo and nodes',
    async () => {
      const slug = process.env['TEST_COLLECTION_SLUG'] ?? 'uncategorized';
      const result = await getCollectionProducts(gqlClient, slug);
      expect(result).toHaveProperty('pageInfo');
      expect(typeof result.pageInfo.hasNextPage).toBe('boolean');
      expect(result).toHaveProperty('nodes');
      expect(Array.isArray(result.nodes)).toBe(true);
    },
  );
});

// ---------------------------------------------------------------------------
// ARC-GQL-06 — Search
// ---------------------------------------------------------------------------

describe('Search GQL — ARC-GQL-06', () => {
  test.skipIf(!process.env['CI_WP_ENV'])(
    'searchProducts basic — returns nodes array and hasNextPage boolean',
    async () => {
      const result = await searchProducts(gqlClient, 'shirt');
      expect(result).toHaveProperty('nodes');
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(typeof result.pageInfo.hasNextPage).toBe('boolean');
    },
  );

  test.skipIf(!process.env['CI_WP_ENV'])(
    'searchProducts empty query — handles gracefully without throw',
    async () => {
      // Many WP configs return all products on empty search; assert no throw.
      await expect(searchProducts(gqlClient, '')).resolves.toHaveProperty('nodes');
    },
  );

  test.skipIf(!process.env['CI_WP_ENV'])(
    'searchProducts with pagination — nodes.length <= first',
    async () => {
      const result = await searchProducts(gqlClient, 'shirt', { first: 3 });
      expect(result.nodes.length).toBeLessThanOrEqual(3);
    },
  );
});
