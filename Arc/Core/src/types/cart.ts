/**
 * @arc/core — WooCommerce Store API v1 cart types
 *
 * Hand-authored from the WC Store API source + docs.
 * No runtime code — types only.
 *
 * These types use the WC* prefix (catalog / Store API convention).
 * The legacy Woo* types in woo.ts are kept for backward compatibility
 * with WooClient internals; new consumer code should use these WC* types.
 */

// ---------------------------------------------------------------------------
// Address
// ---------------------------------------------------------------------------

/**
 * Address as returned by the WC Store API cart/checkout endpoints.
 * WC always returns all fields — empty string if the field is unset.
 */
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
  email: string;
}

// ---------------------------------------------------------------------------
// Cart Item
// ---------------------------------------------------------------------------

export interface WCCartItemImage {
  id: number;
  src: string;
  thumbnail: string;
  srcset: string;
  sizes: string;
  name: string;
  alt: string;
}

export interface WCCartItemPrices {
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

export interface WCCartItemTotals {
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
}

export interface WCCartItem {
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
  images: WCCartItemImage[];
  variation: Array<{ attribute: string; value: string }>;
  item_data: Array<{ name: string; value: string; display: string }>;
  prices: WCCartItemPrices;
  totals: WCCartItemTotals;
  catalog_visibility: string;
  extensions: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Cart Totals
// ---------------------------------------------------------------------------

export interface WCTaxLine {
  name: string;
  price: string;
  rate: string;
}

export interface WCCartTotals {
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
  tax_lines: WCTaxLine[];
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

export interface WCCartCouponTotals {
  total_discount: string;
  total_discount_tax: string;
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
}

export interface WCCartCoupon {
  code: string;
  discount_type: string;
  totals: WCCartCouponTotals;
}

// ---------------------------------------------------------------------------
// Fees
// ---------------------------------------------------------------------------

export interface WCCartFee {
  key: string;
  name: string;
  total: string;
  total_tax: string;
  taxable: boolean;
}

// ---------------------------------------------------------------------------
// Shipping
// ---------------------------------------------------------------------------

export interface WCShippingRate {
  rate_id: string;
  name: string;
  description: string;
  delivery_time: string;
  price: string;
  taxes: string;
  instance_id: number;
  method_id: string;
  meta_data: unknown[];
  selected: boolean;
  currency_code: string;
}

export interface WCShippingPackage {
  package_id: number | string;
  name: string;
  destination: WCAddress;
  items: WCCartItem[];
  shipping_rates: WCShippingRate[];
}

// ---------------------------------------------------------------------------
// Cart Error
// ---------------------------------------------------------------------------

export interface WCCartError {
  code: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export interface WCCart {
  coupons: WCCartCoupon[];
  shipping_rates: WCShippingPackage[];
  shipping_address: WCAddress;
  billing_address: WCAddress;
  items: WCCartItem[];
  /** Total number of individual items in the cart (not distinct SKUs). */
  items_count: number;
  /** Total weight of all cart items in grams. */
  items_weight: number;
  cross_sells: unknown[];
  needs_payment: boolean;
  needs_shipping: boolean;
  has_calculated_shipping: boolean;
  fees: WCCartFee[];
  totals: WCCartTotals;
  errors: WCCartError[];
  payment_requirements: string[];
  extensions?: Record<string, unknown>;
}
