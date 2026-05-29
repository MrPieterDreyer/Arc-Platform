// Phase 0 stub. Real exports land in Phase 1.
export const __ARC_CORE_VERSION = '0.0.1';

// Phase 1 — WooClient HTTP foundation
export { WooClient, WooClientError } from './client/WooClient';
export { isWooError, sleep, withRetry } from './http';
export type {
  WooApiError,
  WooCart,
  WooCartCoupon,
  WooCartItem,
  WooCartItemImage,
  WooCartItemPrices,
  WooCartTotals,
  WooClientOptions,
  WooMoney,
  WooRequestOptions,
} from './types/woo';

// Phase 1 — Cart module (Store API)
export { getCart, addItem, updateItem, removeItem, applyCoupon, removeCoupon } from './store-api/cart.js';
export type { AddItemPayload, UpdateItemPayload } from './store-api/cart.js';

// Phase 1 — Checkout (ARC-API-05)
export { getCheckoutSchema, submitCheckout, getPaymentGateways } from './store-api/checkout';
export type { WCPaymentGateway } from './store-api/checkout';
export type {
  WCAddress,
  WCBillingAddress,
  WCCheckoutPayload,
  WCCheckoutResponse,
  WCPaymentData,
  WCPaymentResult,
} from './types/checkout';
