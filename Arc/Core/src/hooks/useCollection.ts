/**
 * useCollection — React 19 hook for fetching a WPGraphQL product collection
 * (category) with its first page of products and cursor-based pagination.
 *
 * Client Component only — no next/* imports.
 */
import { useCallback, useEffect, useState } from 'react';
import type { GraphQLClient } from 'graphql-request';
import type { WCCollection, WCCollectionList } from '../graphql/collections.js';
import { getCollection, getCollectionProducts } from '../graphql/collections.js';
import type { WCProductList } from '../types/products.js';

export interface CollectionState {
  collection: WCCollection | null;
  products: WCProductList | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
}

/**
 * Fetches a collection (category) + first page of products from WPGraphQL.
 * Call `loadMore()` to append the next page when `products.pageInfo.hasNextPage` is true.
 *
 * @param client - GraphQLClient instance
 * @param slug   - Collection/category slug
 */
export function useCollection(client: GraphQLClient, slug: string): CollectionState {
  const [collection, setCollection] = useState<WCCollection | null>(null);
  const [products, setProducts] = useState<WCProductList | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getCollection(client, slug),
      getCollectionProducts(client, slug),
    ])
      .then(([col, prods]) => {
        if (!cancelled) {
          setCollection(col);
          setProducts(prods);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [client, slug]);

  const loadMore = useCallback(async () => {
    if (!products?.pageInfo.hasNextPage) return;
    setLoadingMore(true);
    try {
      const nextPage = await getCollectionProducts(client, slug, {
        after: products.pageInfo.endCursor ?? undefined,
      });
      setProducts((prev) =>
        prev
          ? {
              pageInfo: nextPage.pageInfo,
              nodes: [...prev.nodes, ...nextPage.nodes],
            }
          : nextPage,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingMore(false);
    }
  }, [client, slug, products]);

  return { collection, products, loading, loadingMore, error, loadMore };
}
