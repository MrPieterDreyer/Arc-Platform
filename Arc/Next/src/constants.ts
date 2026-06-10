/** HttpOnly cookie name for WC Store API Cart-Token (ADR-0006). */
export const ARC_CART_TOKEN_COOKIE = 'arc_cart_token' as const;

/** HttpOnly cookie name for the short-lived WPGraphQL access JWT (ADR-0009). */
export const ARC_AUTH_TOKEN_COOKIE = 'arc_auth_token' as const;

/** HttpOnly cookie name for the long-lived WPGraphQL refresh JWT (ADR-0009). */
export const ARC_REFRESH_TOKEN_COOKIE = 'arc_refresh_token' as const;

/** Environment variable name for the Weave/Arc revalidate webhook secret (ADR-0007). */
export const WEAVE_WEBHOOK_SECRET_ENV = 'WEAVE_WEBHOOK_SECRET' as const;

/**
 * REQUIRED Next.js 16 config fragment for any app consuming `@arc-platform/next`.
 *
 * The `'use cache'` directive used by Arc's loaders is INERT unless the
 * consuming app sets `cacheComponents: true` in `next.config`. Without it,
 * every Arc loader silently bypasses the data cache with no error. Merge this
 * into your config so the caching layer actually engages:
 *
 *   // next.config.ts
 *   import { recommendedNextConfig } from '@arc-platform/next';
 *   export default { ...recommendedNextConfig };
 */
export const recommendedNextConfig = {
  cacheComponents: true,
} as const;
