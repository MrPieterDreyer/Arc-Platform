/**
 * @arc/core — WooCommerce Store API v1 Order types
 *
 * Hand-authored from the WC Store API /order/{id} endpoint docs.
 * No runtime code — types only.
 */

// ---------------------------------------------------------------------------
// Address
// ---------------------------------------------------------------------------

/** Billing or shipping address as returned by the WC Store API. */
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
  email?: string;
  phone: string;
}

// ---------------------------------------------------------------------------
// Order Line Items
// ---------------------------------------------------------------------------

export interface WCOrderLineItem {
  id: number;
  product_id: number;
  variation_id: number;
  quantity: number;
  name: string;
  sku: string;
  total: string;
  total_tax: string;
}

// ---------------------------------------------------------------------------
// Order Totals
// ---------------------------------------------------------------------------

export interface WCOrderTotals {
  total_items: string;
  total_tax: string;
  total_shipping: string;
  total_price: string;
  currency_code: string;
}

// ---------------------------------------------------------------------------
// Order
// ---------------------------------------------------------------------------

export interface WCOrder {
  id: number;
  number: string;
  status: string;
  currency: string;
  date_created: string;
  billing: WCAddress;
  shipping: WCAddress;
  line_items: WCOrderLineItem[];
  totals: WCOrderTotals;
  payment_method: string;
  payment_method_title: string;
}
