/**
 * useSearch — React 19 hook for debounced WPGraphQL product search.
 *
 * Debounce is implemented with plain setTimeout/clearTimeout — no external
 * debounce library (per RESEARCH.md §Don't Hand-Roll rule: keep it simple).
 *
 * Client Component only — no next/* imports.
 */

import type { GraphQLClient } from 'graphql-request';
import { useEffect, useState } from 'react';
import type { WCSearchFilter } from '../graphql/search.js';
import { searchProducts } from '../graphql/search.js';
import type { WCProduct } from '../types/products.js';

export interface SearchState {
  query: string;
  setQuery: (q: string) => void;
  results: WCProduct[];
  loading: boolean;
  error: string | null;
}

/**
 * Debounced product search via WPGraphQL.
 *
 * @param client      - GraphQLClient instance
 * @param debounceMs  - Debounce delay in milliseconds (default 300)
 * @param filter      - Optional WCSearchFilter (first, after pagination)
 */
export function useSearch(
  client: GraphQLClient,
  debounceMs = 300,
  filter?: WCSearchFilter,
): SearchState {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WCProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const timerId = setTimeout(() => {
      searchProducts(client, query, filter)
        .then((list) => {
          setResults(list.nodes);
          setLoading(false);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : String(err));
          setResults([]);
          setLoading(false);
        });
    }, debounceMs);

    return () => {
      clearTimeout(timerId);
    };
  }, [client, query, debounceMs, filter]);

  return { query, setQuery, results, loading, error };
}
