/**
 * @arc-platform/core — WooCommerce Store API v1 checkout types
 *
 * Hand-authored from the WC Store API source + docs.
 * No runtime code — types only.
 */

// ---------------------------------------------------------------------------
// Shared address type (reused by both billing and shipping)
// ---------------------------------------------------------------------------

export interface WCAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
}

export interface WCBillingAddress extends WCAddress {
  email: string;
}

// ---------------------------------------------------------------------------
// Checkout payload (POST /checkout)
// ---------------------------------------------------------------------------

/** A key/value pair for passing gateway-specific payment data. */
export interface WCPaymentData {
  key: string;
  value: string;
}

/**
 * Payload for POST /checkout.
 *
 * `payment_data` is gateway-specific — never transform; pass through verbatim.
 */
export interface WCCheckoutPayload {
  billing_address: WCBillingAddress;
  shipping_address: WCAddress;
  customer_note?: string;
  payment_method: string;
  payment_data?: WCPaymentData[];
  extensions?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Checkout response (POST /checkout)
// ---------------------------------------------------------------------------

export interface WCPaymentResult {
  payment_status: 'success' | 'pending' | 'failure' | 'error';
  payment_details: WCPaymentData[];
  redirect_url: string;
}

export interface WCCheckoutResponse {
  order_id: number;
  status: string;
  payment_result: WCPaymentResult;
}
