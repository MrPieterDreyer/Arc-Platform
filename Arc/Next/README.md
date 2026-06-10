# @arc-platform/next

Next.js 16 App Router integration for Arc — cached catalog loaders, cart Server Actions, Cart-Token cookie bridge, and HMAC revalidation webhooks.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `ARC_WC_URL` | WooCommerce Store API base URL (no trailing path) |
| `ARC_GRAPHQL_ENDPOINT` | WPGraphQL endpoint for catalog loaders |
| `WEAVE_WEBHOOK_SECRET` | Shared secret for `createRevalidateHandler` (ADR-0007) |

Cart cookies require **HTTPS** in production (`SameSite=None; Secure` per ADR-0006).

## Imports

| Entry | Use for |
|-------|---------|
| `@arc-platform/next` | `arcTag`, `ARC_CACHE_PROFILE`, cookie/webhook constant names |
| `@arc-platform/next/server` | `createLoaders`, `createArcClient`, cart actions, `createRevalidateHandler` |
| `@arc-platform/next/client` | `useOptimisticCart` |

## Server Actions (consumer pattern)

Library exports plain async functions. Re-export from your app with `'use server'`:

```typescript
// app/actions/cart.ts
'use server';

export { addItemAction, updateItemAction, removeItemAction } from '@arc-platform/next/server';
```

Actions **throw** `WooClientError` on failure (no `{ ok: false }`) so `useOptimisticCart` can roll back. Surface UI copy in your error boundary (see Phase 2 UI-SPEC).

## Cached loaders

Consumer `next.config.ts` must set `cacheComponents: true`. Loaders use `'use cache'` + `cacheTag` + `cacheLife`:

```typescript
import { createLoaders } from '@arc-platform/next/server';

const { loadProduct } = createLoaders({
  graphqlEndpoint: process.env.ARC_GRAPHQL_ENDPOINT!,
});

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  // ...
}
```

## ISR / cacheLife profiles (Pilot)

Import `ARC_CACHE_PROFILE` from `@arc-platform/next` and pass to `cacheLife()` in loaders (or rely on `createLoaders`, which applies them automatically):

| Route type | Profile constant | Typical use |
|------------|------------------|-------------|
| Product PDP | `ARC_CACHE_PROFILE.product` | `hours` |
| Collection | `ARC_CACHE_PROFILE.collection` | `hours` |
| Weave page (Phase 4b) | `ARC_CACHE_PROFILE.pageConfig` | `minutes` |

## Revalidate webhook

```typescript
// app/api/revalidate/route.ts
import { createRevalidateHandler, WEAVE_WEBHOOK_SECRET_ENV } from '@arc-platform/next/server';

export const POST = createRevalidateHandler({
  secret: process.env[WEAVE_WEBHOOK_SECRET_ENV]!,
});
```

## Example app

See `examples/minimal-app` for PDP + optimistic cart + revalidate wiring.
