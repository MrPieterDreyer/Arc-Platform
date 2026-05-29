/**
 * useCustomer — React 19 hook for session-scoped WooCommerce customer data.
 *
 * Provides billing/shipping address data from the WC Store API customer endpoint.
 * Optionally fetches order history via WPGraphQL when a gqlClient with an auth
 * token is supplied.
 *
 * Client Component only — no next/* imports.
 *
 * @remarks Provide gqlClient (created with authToken) to enable order history.
 * Without gqlClient, orders is null.
 */
import { useCallback, useEffect, useState } from 'react';
import type { GraphQLClient } from 'graphql-request';
import type { WCCustomer } from '../types/customer.js';
import { WooClient } from '../client/WooClient.js';
import { getCustomer, updateCustomer } from '../store-api/customer.js';
import type { WCCustomerPatch } from '../store-api/customer.js';
import { getCustomerOrders } from '../graphql/customer.js';
import type { WCCustomerOrdersResult } from '../graphql/customer.js';

export interface CustomerState {
  customer: WCCustomer | null;
  orders: WCCustomerOrdersResult | null;
  loading: boolean;
  error: string | null;
  updateAddress: (patch: WCCustomerPatch) => Promise<void>;
}

export function useCustomer(
  storeClient: WooClient,
  gqlClient?: GraphQLClient,
): CustomerState {
  const [customer, setCustomer] = useState<WCCustomer | null>(null);
  const [orders, setOrders] = useState<WCCustomerOrdersResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetches: [Promise<WCCustomer>, Promise<WCCustomerOrdersResult | null>] = [
      getCustomer(storeClient),
      gqlClient ? getCustomerOrders(gqlClient) : Promise.resolve(null),
    ];

    Promise.all(fetches)
      .then(([cust, ords]) => {
        if (!cancelled) {
          setCustomer(cust);
          setOrders(ords);
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
  }, [storeClient, gqlClient]);

  const updateAddress = useCallback(
    async (patch: WCCustomerPatch) => {
      const updated = await updateCustomer(storeClient, patch);
      setCustomer(updated);
    },
    [storeClient],
  );

  return { customer, orders, loading, error, updateAddress };
}
