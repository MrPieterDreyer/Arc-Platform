/**
 * Cache tag taxonomy for `@weave-platform/next` (ADR-0004).
 * Pure module — safe to import from the barrel and client bundles.
 */
export const weaveTag = {
  page: (slug: string) => `weave:page:${slug}` as const,
  pageList: () => 'weave:page:list' as const,
} as const;
