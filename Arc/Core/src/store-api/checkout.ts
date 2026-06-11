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

// ---------------------------------------------------------------------------
// CART-P2 — getPaymentMethodsFromCheckout
// ---------------------------------------------------------------------------

/**
 * Minimal shape of a checkout/cart draft object that may carry payment-method
 * information. The WC Store API exposes this on GET /checkout and GET /cart
 * responses as `payment_requirements` (an array of capability strings) and
 * sometimes as embedded gateway data.
 *
 * We type it loosely so callers can pass either a WCCheckoutResponse or a raw
 * cart/checkout draft without needing an exact match — the function only reads
 * the fields it needs and falls back gracefully when they are absent.
 */
export interface WCCheckoutDraft {
  /** Payment-requirement capability strings returned by the Store API checkout draft. */
  payment_requirements?: string[];
  /**
   * Some WC Stripe plugin versions embed available payment methods in the
   * checkout response extensions object. Shape is plugin-version-dependent —
   * Plan 03 contract-tests the live shape.
   */
  extensions?: Record<string, unknown>;
  /** Fallback: top-level payment_method field (set after a draft is submitted). */
  payment_method?: string;
}

/**
 * Extracts available payment-method ids from a checkout/cart draft object.
 *
 * **CART-P2** — the `/payment-gateways` Store API route returns 404; the
 * checkout draft is the only source of gateway information available to a
 * headless Next.js client. This function is a pure transformation over the
 * draft so it unit-tests without network calls.
 *
 * Strategy (in priority order):
 * 1. `payment_requirements` array — WC Store API returns capability strings
 *    like `["stripe"]` when the cart contains items that need that gateway.
 * 2. `extensions.stripe` presence — the WC Stripe plugin adds its gateway id
 *    under `extensions` in some versions (Plan 03 confirms the live key).
 * 3. `payment_method` field — present after a draft is partially submitted.
 *
 * Returns a deduplicated array of gateway id strings, or `[]` when none found.
 *
 * @param draft - A checkout/cart draft object from the WC Store API.
 */
export function getPaymentMethodsFromCheckout(draft: WCCheckoutDraft): string[] {
  const ids = new Set<string>();

  // Strategy 1: payment_requirements array
  if (Array.isArray(draft.payment_requirements)) {
    for (const req of draft.payment_requirements) {
      if (typeof req === 'string' && req.length > 0) {
        ids.add(req);
      }
    }
  }

  // Strategy 2: extensions object keys that look like gateway ids
  if (draft.extensions && typeof draft.extensions === 'object') {
    for (const key of Object.keys(draft.extensions)) {
      // Only include keys that look like gateway identifiers (no slashes, dots,
      // or WP-namespace separators) to avoid pulling in unrelated extension data.
      if (/^[a-z][a-z0-9_-]*$/.test(key)) {
        ids.add(key);
      }
    }
  }

  // Strategy 3: top-level payment_method string
  if (typeof draft.payment_method === 'string' && draft.payment_method.length > 0) {
    ids.add(draft.payment_method);
  }

  return Array.from(ids);
}
