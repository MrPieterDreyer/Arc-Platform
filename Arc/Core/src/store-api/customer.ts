import type { WooClient } from '../client/WooClient.js';
import type { WCCustomer, WCCustomerAddress } from '../types/customer.js';
import type { WooCart } from '../types/woo.js';

/**
 * Partial billing/shipping address update payload.
 * Only include the fields you want to change.
 */
export interface WCCustomerPatch {
  billing?: Partial<WCCustomerAddress>;
  shipping?: Partial<WCCustomerAddress>;
}

/** Map a cart's session addresses into the session-scoped WCCustomer shape. */
function cartToCustomer(cart: WooCart): WCCustomer {
  const billing = cart.billing_address as unknown as WCCustomerAddress;
  const shipping = cart.shipping_address as unknown as WCCustomerAddress;
  return {
    id: 0,
    email: billing.email ?? '',
    first_name: billing.first_name ?? '',
    last_name: billing.last_name ?? '',
    billing,
    shipping,
  };
}

/**
 * Returns session-scoped customer billing/shipping address data only.
 *
 * IMPORTANT — SESSION SCOPE ONLY: WC Store API v1 has NO standalone `/customer`
 * endpoint. The session customer addresses live on the cart, so this derives
 * them from `GET /cart`. The `id` is 0 for guest sessions, and there is no
 * order history here — use `getCustomerOrders()` (WPGraphQL, authenticated).
 *
 * @param client - WooClient instance (session managed via Cart-Token)
 */
export async function getCustomer(client: WooClient): Promise<WCCustomer> {
  const cart = await client.request<WooCart>('/cart');
  return cartToCustomer(cart);
}

/**
 * Updates the session billing/shipping address.
 *
 * WC Store API v1: `POST /cart/update-customer` sets the addresses and returns
 * the updated cart. Auth is via the Cart-Token session (no login required).
 *
 * @param client - WooClient instance
 * @param patch  - Partial billing and/or shipping address fields to update
 */
export async function updateCustomer(
  client: WooClient,
  patch: WCCustomerPatch,
): Promise<WCCustomer> {
  const body: {
    billing_address?: Partial<WCCustomerAddress>;
    shipping_address?: Partial<WCCustomerAddress>;
  } = {};
  if (patch.billing) body.billing_address = patch.billing;
  if (patch.shipping) body.shipping_address = patch.shipping;

  const cart = await client.request<WooCart>('/cart/update-customer', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return cartToCustomer(cart);
}
