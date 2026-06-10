/**
 * @arc-platform/core — WooCommerce Store API v1 TypeScript types
 *
 * Hand-authored from the WC Store API source + docs.
 * No runtime code — types only.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** A money value returned by the WC Store API. */
export interface WooMoney {
  value: string;
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export interface WooCartItemPrices {
  price: string;
  regular_price: string;
  sale_price: string;
  price_range: null | { min_amount: string; max_amount: string };
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
}

export interface WooCartItemImage {
  id: number;
  src: string;
  thumbnail: string;
  srcset: string;
  sizes: string;
  name: string;
  alt: string;
}

export interface WooCartItem {
  key: string;
  id: number;
  quantity: number;
  quantity_limits: {
    minimum: number;
    maximum: number;
    multiple_of: number;
    editable: boolean;
  };
  name: string;
  short_description: string;
  description: string;
  sku: string;
  low_stock_remaining: number | null;
  backorders_allowed: boolean;
  show_backorder_badge: boolean;
  sold_individually: boolean;
  permalink: string;
  images: WooCartItemImage[];
  variation: Array<{ attribute: string; value: string }>;
  item_data: Array<{ name: string; value: string; display: string }>;
  prices: WooCartItemPrices;
  totals: {
    line_subtotal: string;
    line_subtotal_tax: string;
    line_total: string;
    line_total_tax: string;
    currency_code: string;
    currency_symbol: string;
    currency_minor_unit: number;
    currency_decimal_separator: string;
    currency_thousand_separator: string;
    currency_prefix: string;
    currency_suffix: string;
  };
  catalog_visibility: string;
  extensions: Record<string, unknown>;
}

export interface WooCartTotals {
  total_items: string;
  total_items_tax: string;
  total_fees: string;
  total_fees_tax: string;
  total_discount: string;
  total_discount_tax: string;
  total_shipping: string;
  total_shipping_tax: string;
  total_price: string;
  total_tax: string;
  tax_lines: Array<{
    name: string;
    price: string;
    rate: string;
  }>;
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
}

export interface WooCartCoupon {
  code: string;
  discount_type: string;
  totals: {
    total_discount: string;
    total_discount_tax: string;
    currency_code: string;
    currency_symbol: string;
    currency_minor_unit: number;
    currency_decimal_separator: string;
    currency_thousand_separator: string;
    currency_prefix: string;
    currency_suffix: string;
  };
}

export interface WooCart {
  coupons: WooCartCoupon[];
  shipping_rates: unknown[];
  shipping_address: {
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
  };
  billing_address: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  items: WooCartItem[];
  items_count: number;
  items_weight: number;
  cross_sells: unknown[];
  needs_payment: boolean;
  needs_shipping: boolean;
  has_calculated_shipping: boolean;
  fees: unknown[];
  totals: WooCartTotals;
  errors: WooApiError[];
  payment_requirements: string[];
  extensions: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** A WooCommerce REST API error response body. */
export interface WooApiError {
  code: string;
  message: string;
  data: {
    status: number;
    params?: Record<string, string>;
    details?: Record<string, WooApiError>;
  };
}

// ---------------------------------------------------------------------------
// Client options
// ---------------------------------------------------------------------------

/** Options passed to the `WooClient` constructor. */
export interface WooClientOptions {
  /** WooCommerce site base URL, e.g. `https://shop.example.com` */
  baseUrl: string;

  /**
   * Called when the WC Store API returns a new `Cart-Token` response header.
   * Use this in framework integrations (e.g. `@arc-platform/next`) to persist the token
   * as an HttpOnly cookie. Framework-agnostic — not called if token is unchanged.
   */
  onCartToken?: (token: string) => void | Promise<void>;

  /**
   * Called before each cart request to retrieve the current Cart-Token.
   * Return `null | undefined` if no token is available (first cart interaction).
   */
  getCartToken?: () => string | null | undefined;

  /**
   * Called when `rest_cookie_invalid_nonce` is received, to fetch a fresh nonce.
   * Return `null | undefined` to skip nonce retry.
   */
  getNonce?: () => string | null | undefined | Promise<string | null | undefined>;

  /**
   * Called after a successful nonce refresh so the caller can cache the new value.
   */
  onNonce?: (nonce: string) => void;

  /**
   * Request timeout in milliseconds. Defaults to 10 000 ms.
   */
  timeout?: number;
}

/** Per-request options that can override client-level settings. */
export interface WooRequestOptions {
  /** AbortSignal to cancel the request externally. */
  signal?: AbortSignal;
  /** Explicit nonce for this request (overrides `getNonce`). */
  nonce?: string;
}
