// Phase 0 stub. Real exports land in Phase 1.
export const __ARC_CORE_VERSION = '0.0.1';

// Phase 1 — WooClient HTTP foundation
export { WooClient, WooClientError } from './client/WooClient';
export type { WPGraphQLConfig } from './graphql/client';
// Phase 1 — GraphQL client
export { createWPGraphQLClient } from './graphql/client';
export type { WCCollection, WCCollectionList } from './graphql/collections';
// Phase 1 — Collections + Search GraphQL modules
export { getCollection, getCollectionProducts, listCollections } from './graphql/collections';
export type {
  WCCustomerOrdersResult,
  WCGQLOrder,
  WCGQLOrderLineItem,
} from './graphql/customer';
// Phase 1 — GraphQL customer
export { getCustomerOrders } from './graphql/customer';
export type { WCProductFilter } from './graphql/products';
// Phase 1 — Products GraphQL module
export { getProduct, getProducts, getProductVariations } from './graphql/products';
export type { WCSearchFilter } from './graphql/search';
export { searchProducts } from './graphql/search';
export type { CartActions, CartSnapshot, CartState } from './hooks/useCart.js';
// Phase 1 — Hooks (React 19 — Client Components only)
export { getOrCreateCartStore, useCart } from './hooks/useCart.js';
export type { CollectionState } from './hooks/useCollection.js';
export { useCollection } from './hooks/useCollection.js';
export type { CustomerState } from './hooks/useCustomer.js';
export { useCustomer } from './hooks/useCustomer.js';
export type { ProductState } from './hooks/useProduct.js';
export { useProduct } from './hooks/useProduct.js';
export type { SearchState } from './hooks/useSearch.js';
export { useSearch } from './hooks/useSearch.js';
export { isWooError, sleep, withRetry } from './http';
export type { AddItemPayload, UpdateItemPayload } from './store-api/cart.js';
// Phase 1 — Cart module (Store API)
export {
  addItem,
  applyCoupon,
  getCart,
  removeCoupon,
  removeItem,
  updateItem,
} from './store-api/cart.js';
export type { WCPaymentGateway } from './store-api/checkout';
// Phase 1 — Checkout (ARC-API-05)
export { getCheckoutSchema, getPaymentGateways, submitCheckout } from './store-api/checkout';
export type { WCCustomerPatch } from './store-api/customer';
// Phase 1 — Store API customer
export { getCustomer, updateCustomer } from './store-api/customer';
// Phase 1 — Orders (Store API)
export { getOrder } from './store-api/orders';
// Phase 1 — Cart types (WC* prefix, complete shapes)
export type {
  WCCart,
  WCCartCoupon,
  WCCartCouponTotals,
  WCCartError,
  WCCartFee,
  WCCartItem,
  WCCartItemImage,
  WCCartItemPrices,
  WCCartItemTotals,
  WCCartTotals,
  WCShippingPackage,
  WCShippingRate,
  WCTaxLine,
} from './types/cart';
export type {
  WCBillingAddress,
  WCCheckoutPayload,
  WCCheckoutResponse,
  WCPaymentData,
  WCPaymentResult,
} from './types/checkout';
// Phase 1 — Customer types
export type { WCCustomer, WCCustomerAddress } from './types/customer';
export type {
  WCAddress,
  WCOrder,
  WCOrderLineItem,
  WCOrderTotals,
} from './types/orders';
// Phase 1 — Product + catalog types
export type {
  WCPageInfo,
  WCProduct,
  WCProductAttribute,
  WCProductCategory,
  WCProductImage,
  WCProductList,
  WCProductTag,
  WCProductVariation,
  // Store API product types (cart cross_sells / REST shape)
  WCStoreProduct,
  WCStoreProductAttribute,
  WCStoreProductCategory,
  WCStoreProductImage,
  WCStoreProductVariation,
} from './types/products';
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
