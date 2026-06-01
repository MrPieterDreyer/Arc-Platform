/**
 * Next.js 16 `cacheLife` profile names for catalog vs page-config routes.
 * Consumer apps must set `cacheComponents: true` in `next.config` — this library cannot enable that.
 */
export const ARC_CACHE_PROFILE = {
  product: 'hours',
  collection: 'hours',
  pageConfig: 'minutes',
} as const;

export type ArcCacheProfile = (typeof ARC_CACHE_PROFILE)[keyof typeof ARC_CACHE_PROFILE];
