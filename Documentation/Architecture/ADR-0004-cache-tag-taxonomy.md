# ADR-0004: Cache Tag Taxonomy

**Status:** Accepted
**Date:** 2026-05-28
**Deciders:** Arc Platform maintainers
**Phase:** Phase 0
**Related requirements:** TOOL-09 (prep for ARC-NEXT-04, ARC-NEXT-05, WEAVE-NEXT-01, WEAVE-WP-06)

## Context

Next.js 16's `'use cache'` directive + `cacheTag()` + `revalidateTag()` API requires every cached data fetch to be tagged with a string identifier. When content changes (e.g. a WC product is updated), the corresponding revalidation webhook calls `revalidateTag(tag)` to purge the cached entry. This creates a **read/write contract**: the tag string used when populating the cache must be identical to the tag string used when invalidating it.

Without a locked taxonomy:
- `@arc/next` cache helpers might tag a product with `product:${slug}`
- The Weave WP plugin webhook might invalidate with `arc-product-${slug}`
- The mismatch causes silent cache staleness — the invalidation fires but nothing is purged

String-typo silent failures are the most dangerous class of caching bug: they produce no error, the system appears healthy, but users see stale data indefinitely. A typed helper that enforces the taxonomy at compile time eliminates this entire failure class.

## Decision Drivers

- Predictability: every developer knows the correct tag string without looking it up
- Consistency: read paths and invalidation paths use the same constants
- Type safety: misspellings fail at compile time, not at runtime
- Namespace isolation: `@arc/*` and `@weave/*` tags cannot accidentally collide
- Extensibility: new resource types can be added without renaming existing tags

## Considered Options

1. **Free-form per-package** — each package defines its own tag strings; no shared contract; silent mismatch bugs likely across package boundaries
2. **Hierarchical namespace (chosen)** — `{owner}:{resource}:{key}` pattern; owned by this ADR; typed helper in `@arc/next` + `@weave/next` enforces at compile time
3. **Hash-based tags** — content-addressed (e.g. `sha256(slug)`); eliminates collision but makes tags unreadable in traces and impossible to invalidate from the WP side without the hash function

## Decision

The cache tag namespace pattern is `{owner}:{resource}:{key}`. The following tags are locked:

| Tag | Owner package | Meaning |
|-----|---------------|---------|
| `arc:product:{slug}` | `@arc/next` | Single product detail page keyed by slug |
| `arc:product:list` | `@arc/next` | Product listing (paginated catalog) |
| `arc:collection:{slug}` | `@arc/next` | Product collection / category page keyed by slug |
| `arc:collection:list` | `@arc/next` | All collections listing |
| `arc:cart` | `@arc/next` | Cart endpoint (typically `no-store`; tag reserved for future server-rendered cart state) |
| `weave:page:{slug}` | `@weave/next` | Weave page config for a given page slug |
| `weave:page:list` | `@weave/next` | Metadata list of all Weave pages |

**Tag construction rules:**
- All lowercase, colon-delimited; no spaces, no hyphens in the structural separators
- Slug values use the same slug as the WP/WC permalink slug (URL-encoded if needed, but typically ASCII-safe)
- The `arc:` prefix is reserved for `@arc/*` packages; the `weave:` prefix is reserved for `@weave/*` packages
- No other tag prefix is permitted in `@arc/*` or `@weave/*` package code

**Typed helper pattern** (implemented in Phase 2 `@arc/next` and Phase 4b `@weave/next`):

```typescript
// @arc/next — arc/cache-tags.ts
export const arcTag = {
  product: (slug: string) => `arc:product:${slug}` as const,
  productList: () => 'arc:product:list' as const,
  collection: (slug: string) => `arc:collection:${slug}` as const,
  collectionList: () => 'arc:collection:list' as const,
  cart: () => 'arc:cart' as const,
} as const;

// @weave/next — weave/cache-tags.ts
export const weaveTag = {
  page: (slug: string) => `weave:page:${slug}` as const,
  pageList: () => 'weave:page:list' as const,
} as const;
```

The WP plugin webhook body uses the tag string directly (e.g. `"tag": "weave:page:home"`). The Next.js revalidate handler validates the prefix before calling `revalidateTag()`.

## Consequences

### Positive

- Webhook handlers and read paths use the same constants — no string-typo silent failures across the WP ↔ Next boundary
- Typed at compile time via the helper pattern — misspellings are TypeScript errors, not runtime bugs
- Tag strings are human-readable in Next.js dev tools and deployment traces (`arc:product:blue-widget` vs an opaque hash)

### Negative

- New resource types (e.g. orders, customers, blog posts) require an ADR amendment to add the new tag to the locked table above, plus updating the typed helpers in both packages
- The `arc:` and `weave:` namespace reservation means third-party packages building on Arc cannot use these prefixes — they must use their own prefix (e.g. `myplugin:resource:key`)

### Neutral

- `arc:` and `weave:` namespaces are reserved globally — no other tag prefix is permitted in `@arc/*` / `@weave/*` packages
- `arc:cart` is defined but the cart response is typically fetched with `cache: 'no-store'` — the tag exists for the edge case where server-rendered cart state needs invalidation

## Implementation Notes

- Phase 2 (`@arc/next`): implement `arcTag` helper in `src/cache-tags.ts`; export from package index; use `cacheTag(arcTag.product(slug))` in every cached server component / fetch
- Phase 4a (Weave WP plugin): `class-weave-revalidate.php` sends `{ "tag": "weave:page:{$slug}", "event": "page.updated", "timestamp": ... }` in webhook body
- Phase 4b (`@weave/next`): implement `weaveTag` helper in `src/cache-tags.ts`; revalidate handler validates `tag.startsWith('weave:') || tag.startsWith('arc:')` before calling `revalidateTag(tag)`
- TypeScript: both helpers return `as const` string literals — callers get exact literal types, not `string`
- To add a new tag: (1) amend this ADR table, (2) update the typed helper, (3) update the verify-adrs check if needed, (4) document in Phase 2/4b implementation notes

## References

- Research: `.planning/research/SUMMARY.md` — "Cache tag taxonomy" decision entry
- [Next.js `cacheTag` API reference](https://nextjs.org/docs/app/api-reference/functions/cacheTag)
- [Next.js `revalidateTag` API reference](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- ADR-0007 — webhook auth mechanism (the transport that carries the tag to the revalidate handler)
