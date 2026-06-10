/**
 * Cache tag taxonomy for `@arc-platform/next` (ADR-0004).
 * Pure module — safe to import from the barrel and client bundles.
 */
export const arcTag = {
  product: (slug: string) => `arc:product:${slug}` as const,
  productList: () => 'arc:product:list' as const,
  collection: (slug: string) => `arc:collection:${slug}` as const,
  collectionList: () => 'arc:collection:list' as const,
  cart: () => 'arc:cart' as const,
} as const;
