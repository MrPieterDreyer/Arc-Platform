/**
 * @arc-platform/core — WC Store API v1 checkout functions
 *
 * All functions accept a `WooClient` as their first argument and delegate
 * entirely to `client.request()` — no direct fetch calls, no header logic.
 */
import type { WooClient } from '../client/WooClient';
import type { WCCheckoutPayload, WCCheckoutResponse } from '../types/checkout';

// ---------------------------------------------------------------------------
// Payment gateway type
// ---------------------------------------------------------------------------

export interface WCPaymentGateway {
  id: string;
  title: string;
  description: string;
  order: number;
  enabled: boolean;
  method_title: string;
  method_description: string;
  additional_fields?: unknown[];
}

// ---------------------------------------------------------------------------
// Checkout functions
// ---------------------------------------------------------------------------

/**
 * Retrieves the checkout draft order for the current session.
 *
 * GET /checkout — returns the draft ORDER (order_id, billing/shipping addresses,
 * payment methods), NOT a cart. Requires an authenticated session with a
 * non-empty cart.
 */
export async function getCheckoutSchema(client: WooClient): Promise<WCCheckoutResponse> {
  return client.request<WCCheckoutResponse>('/checkout');
}

/**
 * Submits the checkout to WooCommerce and returns the order result.
 *
 * POST /checkout — never transform `payment_data`; pass gateway tokens
 * through verbatim so payment provider credentials are not inspected.
 *
 * @param client  - Configured WooClient instance
 * @param payload - Checkout payload including addresses and payment method
 */
export async function submitCheckout(
  client: WooClient,
  payload: WCCheckoutPayload,
): Promise<WCCheckoutResponse> {
  return client.request<WCCheckoutResponse>('/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Lists available payment gateways enabled on the WooCommerce store.
 *
 * ⚠️ WC Store API v1 has NO `/payment-gateways` route (calling this returns 404
 * `rest_no_route`). Available gateways are surfaced through the checkout flow,
 * not a dedicated list endpoint. This function is retained for API shape but is
 * not functional against the Store API; a gateway-discovery strategy (e.g. via
 * the checkout response or WC REST with admin auth) is a Phase 5 decision.
 */
export async function getPaymentGateways(client: WooClient): Promise<WCPaymentGateway[]> {
  return client.request<WCPaymentGateway[]>('/payment-gateways');
}
