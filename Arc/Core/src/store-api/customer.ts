import type { WooClient } from '../client/WooClient.js';
import type { WCCustomer, WCCustomerAddress } from '../types/customer.js';

/**
 * Partial billing/shipping address update payload for POST /customer.
 * Only include the fields you want to change.
 */
export interface WCCustomerPatch {
  billing?: Partial<WCCustomerAddress>;
  shipping?: Partial<WCCustomerAddress>;
}

/**
 * Returns session-scoped customer billing/shipping address data only.
 *
 * IMPORTANT — SESSION SCOPE ONLY: This is NOT a full customer profile.
 * It contains only the address data attached to the current WC session
 * (identified by Cart-Token). The `id` field will be 0 for guest sessions.
 *
 * For full customer data including order history, use `getCustomerOrders()`
 * from `graphql/customer.ts` which requires a JWT auth token.
 *
 * Reference: RESEARCH.md Pitfall #8 — Store API customer endpoint is session-scoped.
 *
 * @param client - WooClient instance (session managed via Cart-Token)
 */
export function getCustomer(client: WooClient): Promise<WCCustomer> {
  return client.request<WCCustomer>('/customer');
}

/**
 * Updates the session billing/shipping address.
 * Auth not required — uses Cart-Token session.
 *
 * @param client - WooClient instance
 * @param patch  - Partial billing and/or shipping address fields to update
 */
export function updateCustomer(client: WooClient, patch: WCCustomerPatch): Promise<WCCustomer> {
  return client.request<WCCustomer>('/customer', {
    method: 'POST',
    body: JSON.stringify(patch),
  });
}
