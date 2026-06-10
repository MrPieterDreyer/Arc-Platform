import 'server-only';

export { arcTag } from './cache-tags.js';
export {
  ARC_AUTH_TOKEN_COOKIE,
  ARC_CART_TOKEN_COOKIE,
  ARC_REFRESH_TOKEN_COOKIE,
  recommendedNextConfig,
  WEAVE_WEBHOOK_SECRET_ENV,
} from './constants.js';
export { ARC_CACHE_PROFILE, type ArcCacheProfile } from './isr.js';
export {
  ARC_CSP_HEADER,
  ARC_CSP_REPORT_ONLY_HEADER,
  ARC_NONCE_HEADER,
  arcSecurityHeaders,
  createArcCsp,
  type ArcCspOptions,
  type ArcSecurityHeader,
} from './security-headers.js';
export { useArcNonce } from './nonce.js';

export {
  addItemAction,
  createCartActions,
  removeItemAction,
  updateItemAction,
} from './actions.js';
export {
  AUTH_COOKIE_OPTIONS,
  clearAuthCookies,
  persistAuthCookies,
  readAuthTokenValue,
  readRefreshTokenValue,
  REFRESH_COOKIE_OPTIONS,
  rotateAuthCookie,
} from './auth-cookies.js';
export {
  getAuthToken,
  isAuthenticated,
  loadCustomerOrders,
  loginAction,
  logoutAction,
} from './auth-actions.js';
export { createArcClient, createCatalogClient, type ArcClientConfig } from './client-factory.js';
export {
  CART_COOKIE_OPTIONS,
  createCartClient,
  createReadOnlyCartClient,
  readCartTokenValue,
  refreshCartTokenCookie,
} from './cookies.js';
export { createLoaders, type ArcLoaderConfig, type ArcLoaders } from './loaders.js';
export {
  createRevalidateHandler,
  type CreateRevalidateHandlerOptions,
  type RevalidateWebhookBody,
} from './revalidate.js';
