/**
 * useProduct — React 19 hook for fetching a single WPGraphQL product by slug.
 *
 * Client Component only — for RSC, use getProduct() from @arc/next server loader.
 * No next/* imports — framework-agnostic.
 */
import { useEffect, useState } from 'react';
import type { GraphQLClient } from 'graphql-request';
import type { WCProduct, WCProductVariation } from '../types/products.js';
import { getProduct } from '../graphql/products.js';

export interface ProductState {
  product: WCProduct | null;
  loading: boolean;
  error: string | null;
  selectedVariation: WCProductVariation | null;
  setSelectedVariation: (v: WCProductVariation | null) => void;
}

/**
 * Fetches a single product by slug from WPGraphQL.
 *
 * @param client - GraphQLClient instance (from createWPGraphQLClient)
 * @param slug   - Product slug
 *
 * @remarks Client Component only — use @arc/next getProduct server loader for RSC.
 */
export function useProduct(client: GraphQLClient, slug: string): ProductState {
  const [product, setProduct] = useState<WCProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<WCProductVariation | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getProduct(client, slug)
      .then((data) => {
        if (!cancelled) {
          setProduct(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setProduct(null);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [client, slug]);

  return { product, loading, error, selectedVariation, setSelectedVariation };
}
