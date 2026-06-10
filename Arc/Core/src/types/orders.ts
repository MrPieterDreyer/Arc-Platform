/**
 * @arc-platform/core — WooCommerce Store API v1 Order types
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
  name: string;
  product_id: number;
  /** 0 when the line item is not a variation. */
  variation_id: number | null;
  quantity: number;
  tax_class: string;
  subtotal: string;
  subtotal_tax: string;
  total: string;
  total_tax: string;
  taxes: unknown[];
  meta_data: unknown[];
  sku: string;
  /** WC returns price as a number in order line items (unlike cart which uses strings). */
  price: number | string;
}

// ---------------------------------------------------------------------------
// Order Totals
// ---------------------------------------------------------------------------

export interface WCOrderTotals {
  total_items: string;
  total_discount: string;
  total_shipping: string;
  total_tax: string;
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
  date_created_gmt: string;
  date_modified: string;
  billing: WCAddress;
  shipping: WCAddress;
  line_items: WCOrderLineItem[];
  totals: WCOrderTotals;
  payment_method: string;
  payment_method_title: string;
  customer_note: string;
  shipping_lines: unknown[];
  fee_lines: unknown[];
  coupon_lines: unknown[];
}
