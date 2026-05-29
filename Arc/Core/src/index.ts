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

// Phase 1 — GraphQL client + product types
export { createWPGraphQLClient } from './graphql/client';
export type { WPGraphQLConfig } from './graphql/client';
export type { WCProduct, WCProductList, WCPageInfo } from './types/products';

// Phase 1 — Collections + Search GraphQL modules
export { getCollection, listCollections, getCollectionProducts } from './graphql/collections';
export type { WCCollection, WCCollectionList } from './graphql/collections';
export { searchProducts } from './graphql/search';
export type { WCSearchFilter } from './graphql/search';
