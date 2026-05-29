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

<<<<<<< HEAD
// Phase 1 — Cart module (Store API)
export { getCart, addItem, updateItem, removeItem, applyCoupon, removeCoupon } from './store-api/cart.js';
export type { AddItemPayload, UpdateItemPayload } from './store-api/cart.js';

// Phase 1 — Checkout (ARC-API-05)
export { getCheckoutSchema, submitCheckout, getPaymentGateways } from './store-api/checkout';
export type { WCPaymentGateway } from './store-api/checkout';
export type {
  WCBillingAddress,
  WCCheckoutPayload,
  WCCheckoutResponse,
  WCPaymentData,
  WCPaymentResult,
} from './types/checkout';

// Phase 1 — Orders (Store API)
export { getOrder } from './store-api/orders';
export type {
  WCAddress,
  WCOrder,
  WCOrderLineItem,
  WCOrderTotals,
} from './types/orders';

// Phase 1 — Customer types
export type { WCCustomer, WCCustomerAddress } from './types/customer';

// Phase 1 — Store API customer
export { getCustomer, updateCustomer } from './store-api/customer';
export type { WCCustomerPatch } from './store-api/customer';

// Phase 1 — GraphQL client
export { createWPGraphQLClient } from './graphql/client';
export type { WPGraphQLConfig } from './graphql/client';

// Phase 1 — GraphQL customer
export { getCustomerOrders } from './graphql/customer';
export type {
  WCCustomerOrdersResult,
  WCGQLOrder,
  WCGQLOrderLineItem,
} from './graphql/customer';

// Phase 1 — Product + catalog types
export type { WCProduct, WCProductList, WCPageInfo } from './types/products';

// Phase 1 — Collections + Search GraphQL modules
export { getCollection, listCollections, getCollectionProducts } from './graphql/collections';
export type { WCCollection, WCCollectionList } from './graphql/collections';
export { searchProducts } from './graphql/search';
export type { WCSearchFilter } from './graphql/search';
