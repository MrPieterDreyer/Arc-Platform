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

// Phase 1 — WPGraphQL client factory
export { createWPGraphQLClient } from './graphql/client';
export type { WPGraphQLConfig } from './graphql/client';

// Phase 1 — Products GraphQL module
export { getProduct, getProducts, getProductVariations } from './graphql/products';
export type { WCProductFilter, WCProductList } from './graphql/products';

// Phase 1 — Product types
export type {
  WCProduct,
  WCProductAttribute,
  WCProductCategory,
  WCProductImage,
  WCProductVariation,
} from './types/products';
