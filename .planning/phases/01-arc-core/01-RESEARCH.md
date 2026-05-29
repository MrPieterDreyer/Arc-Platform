# Phase 1: `@arc/core` — Research

**Researched:** 2026-05-28
**Domain:** WC Store API v1 client, WPGraphQL client, framework-agnostic React 19 hooks, TypeScript types
**Confidence:** HIGH

---

## Summary

`@arc/core` is the framework-agnostic heart of the Arc platform. It owns three surfaces: (1) a typed HTTP client for the WC Store API v1 — including the full Cart-Token + Nonce session lifecycle, (2) a GraphQL client for WPGraphQL + WPGraphQL for WooCommerce via `graphql-request` with codegen-typed queries, and (3) five framework-agnostic React 19 hooks (`useCart`, `useProduct`, `useCollection`, `useCustomer`, `useSearch`) that consume both surfaces with no `next/*` symbols in the bundle.

The single most important build constraint is that `WooClient` — the class that owns Cart-Token persistence and Nonce lifecycle — must be built first, as a pre-swarm step. Every domain module (cart, checkout, customer, orders) shares it. If it is wrong, all downstream modules are wrong in the same way. The prior research synthesis (SUMMARY.md) flagged this independently from multiple angles; it is confirmed here.

The second critical constraint is the package boundary rule: `@arc/core` must never import from `next/*`. This is enforced at two levels — Biome's `noRestrictedImports` rule in `biome.jsonc`, and a CI grep gate. The hooks layer is the highest-risk area for boundary leakage; framework-specific patterns (`cookies()`, `headers()`, `revalidateTag`) belong in `@arc/next`.

The third constraint is that the WC Store API has no machine-readable OpenAPI/GraphQL schema. Types for its entire REST surface must be hand-authored and kept correct via Vitest contract tests against a live `wp-env` fixture. This is the most labour-intensive part of Phase 1 and must not be underestimated.

**Primary recommendation:** Build `WooClient` (pre-step) → run 6 parallel domain agents (Cart, Checkout, Products/GQL, Collections+Search/GQL, Orders, Customer) → converge on types reconciliation agent → hooks agent last. No parallel agent should touch `src/http/` or `src/session/`; those files are owned exclusively by the pre-step.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARC-API-01 | `WooClient` fetch wrapper: Cart-Token lifecycle (read response header, persist, replay), Nonce lifecycle, base URL config | Cart-Token flow section; Nonce retry pattern section |
| ARC-API-02 | `WooClient` Nonce auto-refresh on `rest_cookie_invalid_nonce`, retry exactly once | Nonce retry pattern section |
| ARC-API-03 | `WooClient` normalises errors into `ArcError` discriminated union | Error normalisation section |
| ARC-API-04 | Cart module: `getCart`, `addItem`, `updateItem`, `removeItem`, `applyCoupon`, `removeCoupon` | Store API endpoint inventory — Cart |
| ARC-API-05 | Checkout module: `submitCheckout(payment_data)`, `getPaymentGateways` | Store API endpoint inventory — Checkout |
| ARC-API-06 | Customer module: `getCustomer`, `updateCustomer`, address CRUD, order list | Store API endpoint inventory — Customer |
| ARC-API-07 | Orders module: `getOrder`, `listCustomerOrders` with pagination | Store API endpoint inventory — Orders |
| ARC-API-08 | Hand-authored TS types for every Store API surface + Vitest contract tests against `wp-env` | Types strategy section |
| ARC-GQL-01 | `graphql-request` client wired to `/graphql` with auth header passthrough | graphql-request v7 section |
| ARC-GQL-02 | `@graphql-codegen/cli` produces typed query functions from WPGraphQL schema introspection | graphql-codegen config section |
| ARC-GQL-03 | Products module: `getProduct(slug)`, `getProducts(filter)`, variation matrix helper | WPGraphQL query inventory — Products |
| ARC-GQL-04 | Two fragments per resource: `*ListFields` (no variations) and `*DetailFields` (full) | Fragment strategy section |
| ARC-GQL-05 | Collections module: `getCollection(slug)`, category tree traversal | WPGraphQL query inventory — Collections |
| ARC-GQL-06 | Search module: `searchProducts(query, facets)`, facet helpers | WPGraphQL query inventory — Search |
| ARC-GQL-07 | Vitest perf budget: any documented query <500ms against seeded `wp-env` fixture | Perf budget section |
| ARC-HOOK-01 | `useCart()` — reactive cart state with optimistic mutations | React 19 hooks section |
| ARC-HOOK-02 | `useProduct(slug)` — single product with variation state | React 19 hooks section |
| ARC-HOOK-03 | `useCollection(slug)` — collection with pagination | React 19 hooks section |
| ARC-HOOK-04 | `useCustomer()` — current customer + address management | React 19 hooks section |
| ARC-HOOK-05 | `useSearch(query)` — debounced search with facet state | React 19 hooks section |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | `5.9.3` | Type system, strict mode | Verified live from npm 2026-05-28; TS 5.9 stabilised `--erasableSyntaxOnly` and `node20` module mode |
| native `fetch` | built-in | WC Store API v1 HTTP client | Node 20.4+ and all modern browsers ship stable fetch; keeps the package dep-free for a framework lib |
| `zod` | `4.4.x` | Runtime validation of Store API responses + `ArcError` shape | Zod 4 ships Zod Mini (tree-shakable); verified from npm |
| `graphql-request` | `7.4.x` | WPGraphQL HTTP client | ~8kb, fetch-based, `requestMiddleware`/`responseMiddleware` for auth injection, delegates caching to Next data cache |
| `graphql` | `16.14.x` | GraphQL types peer | Required by `graphql-request`; graphql 17 not yet stable |
| `@graphql-codegen/cli` | `6.0.x` | Typed query generation from WPGraphQL schema introspection | April 2026 v6 release: generates types only for used operations, ESM-native, simpler config |
| `@graphql-codegen/client-preset` | `6.0.x` | Client preset (replaces per-plugin config) | Single preset generates typed `gql` tag, removes unused schema types, sha256 persisted documents |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `server-only` | `^0.0.1` | Module boundary enforcement | Import at top of any file that must never land in a browser bundle (WooClient auth helpers, session storage) |
| Vitest | `4.1.x` | Unit + contract + perf budget tests | Workspace-aware, ESM-native; runs `wp-env` contract tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| native fetch wrapper | `ky` (4kb) | Ky is fine but adds a runtime dep to a framework package; native fetch is ~100 LOC for our surface |
| native fetch wrapper | `axios` | Never — too heavy, CJS-first, CVE history |
| `graphql-request` | `@apollo/client` | Apollo is 40kb+, normalised cache fights Next data cache |
| `graphql-request` | `urql` | urql is fine but adds normalised cache we don't need |
| Zod 4 | Valibot | Valibot has better tree-shaking; consider for v0.2 if `@weave/react` bundle size matters |

**Installation:**
```bash
# In Arc/Core/ — runtime deps only
pnpm add graphql-request graphql zod

# Dev / codegen — not bundled
pnpm add -D @graphql-codegen/cli @graphql-codegen/client-preset
```

**Version verification (run before implementation):**
```bash
npm view graphql-request version        # expect 7.4.x
npm view graphql version                # expect 16.14.x
npm view zod version                    # expect 4.4.x
npm view @graphql-codegen/cli version   # expect 6.0.x
```

---

## Architecture Patterns

### Recommended Project Structure

```
Arc/Core/
├── src/
│   ├── http/
│   │   ├── client.ts          # WooClient class — Cart-Token + Nonce + retry
│   │   ├── errors.ts          # ArcError discriminated union + normalise()
│   │   └── session.ts         # Cart-Token + Nonce store (in-memory + injectable)
│   ├── store-api/
│   │   ├── cart.ts            # getCart, addItem, updateItem, removeItem, applyCoupon, removeCoupon
│   │   ├── checkout.ts        # submitCheckout, getPaymentGateways
│   │   ├── customer.ts        # getCustomer, updateCustomer, address CRUD
│   │   └── orders.ts          # getOrder, listCustomerOrders
│   ├── graphql/
│   │   ├── client.ts          # GraphQLClient setup, requestMiddleware, responseMiddleware
│   │   ├── products.ts        # getProduct, getProducts, variation matrix helper
│   │   ├── collections.ts     # getCollection, listCollections, getCollectionProducts
│   │   └── search.ts          # searchProducts, facet helpers
│   ├── hooks/
│   │   ├── useCart.ts         # useSyncExternalStore + optimistic mutations
│   │   ├── useProduct.ts      # product + variation state
│   │   ├── useCollection.ts   # collection + pagination
│   │   ├── useCustomer.ts     # customer + address management
│   │   └── useSearch.ts       # debounced search + facet state
│   ├── types/
│   │   ├── cart.ts            # WC Store API cart types (hand-authored)
│   │   ├── checkout.ts        # WC Store API checkout types
│   │   ├── customer.ts        # WC Store API customer types
│   │   ├── orders.ts          # WC Store API order types
│   │   ├── products.ts        # WC Store API product types
│   │   └── errors.ts          # ArcError, ArcApiError, ArcNetworkError
│   └── index.ts               # barrel — explicit named exports only
├── codegen.ts                 # graphql-codegen config (generates into src/graphql/__generated__/)
├── src/graphql/__generated__/ # gitignored, regenerated via `pnpm codegen`
├── __tests__/
│   ├── smoke.test.ts          # existing
│   ├── contract/              # Vitest contract tests against wp-env
│   │   ├── cart.contract.ts
│   │   ├── checkout.contract.ts
│   │   ├── products.contract.ts
│   │   ├── customer.contract.ts
│   │   └── orders.contract.ts
│   └── perf/
│       └── graphql.perf.ts    # <500ms budget per query
└── package.json
```

**Key constraint:** Nothing in `src/` imports from `next/*`, `react-dom/server`, or any Node-only module. `server-only` is the one Node-side exception, and only for files that genuinely must not ship to browsers.

---

## WC Store API v1 — Complete Endpoint Inventory

**Base URL:** `{WP_URL}/wp-json/wc/store/v1`

All endpoints return JSON. All endpoints are unauthenticated for reads (except customer/order scoped data). Write endpoints require **either** a `Cart-Token` header **or** a `Nonce` header (`X-WC-Store-API-Nonce`). For headless, always use Cart-Token — do not co-send Nonce when Cart-Token is present.

### Cart Endpoints

| Method | Path | Auth Required | Description |
|--------|------|---------------|-------------|
| GET | `/cart` | None (read), Cart-Token captures session | Get full cart object; response includes `Cart-Token` header on first call |
| POST | `/cart/add-item` | Cart-Token | Add item; body: `{ id, quantity, variation? }` |
| POST | `/cart/remove-item` | Cart-Token | Remove item; body: `{ key }` (line item key from cart response) |
| POST | `/cart/update-item` | Cart-Token | Update quantity; body: `{ key, quantity }` |
| GET | `/cart/coupons` | Cart-Token | List applied coupons |
| POST | `/cart/coupons` | Cart-Token | Apply coupon; body: `{ code }` |
| DELETE | `/cart/coupons/{code}` | Cart-Token | Remove one coupon |
| DELETE | `/cart/coupons` | Cart-Token | Remove all coupons |
| POST | `/cart/select-shipping-rate` | Cart-Token | Select shipping rate; body: `{ package_id, rate_id }` |
| POST | `/cart/update-customer` | Cart-Token | Update billing/shipping address in session |

**Cart response shape (abbreviated):**
```typescript
interface WCCart {
  items: WCCartItem[];
  items_count: number;
  items_weight: number;
  coupons: WCCartCoupon[];
  totals: WCCartTotals;
  shipping_address: WCAddress;
  billing_address: WCAddress;
  payment_requirements: string[];
  cross_sells: WCProduct[];
  fees: WCCartFee[];
  tax_lines: WCTaxLine[];
  shipping_rates: WCShippingPackage[];
  errors: WCCartError[];
  needs_shipping: boolean;
  needs_payment: boolean;
}
```

### Checkout Endpoints

| Method | Path | Auth Required | Description |
|--------|------|---------------|-------------|
| GET | `/checkout` | Cart-Token | Get current cart data formatted for checkout |
| POST | `/checkout` | Cart-Token | Process checkout; body: `{ billing_address, shipping_address, payment_method, payment_data }` |
| POST | `/checkout/{order_id}` | Cart-Token | Process payment for existing order (resume after 3DS redirect) |
| GET | `/checkout/order/{order_id}` | Cart-Token | Get order details post-checkout |

**Checkout POST body shape:**
```typescript
interface WCCheckoutPayload {
  billing_address: WCAddress;
  shipping_address: WCAddress;
  customer_note?: string;
  payment_method: string;           // e.g. 'stripe', 'paypal'
  payment_data?: Array<{
    key: string;
    value: string;
  }>;
  extensions?: Record<string, unknown>;
}
```

**Checkout POST response — `payment_result`:**
```typescript
interface WCCheckoutResponse {
  order_id: number;
  status: string;
  payment_result: {
    payment_status: 'success' | 'pending' | 'failure' | 'error';
    payment_details: Array<{ key: string; value: string }>;
    redirect_url: string;
  };
}
```

### Products Endpoints

| Method | Path | Auth Required | Description |
|--------|------|---------------|-------------|
| GET | `/products` | None | List products; supports `?per_page`, `?page`, `?search`, `?category`, `?tag`, `?on_sale`, `?orderby`, `?order` |
| GET | `/products/{id}` | None | Single product by ID |
| GET | `/products/collection` | None | Products in a collection/category |

**Note:** Product catalog should prefer WPGraphQL over Store API products endpoint. Store API products are for cart context (checking availability, price). WPGraphQL is richer for catalog display.

### Customer Endpoint

| Method | Path | Auth Required | Description |
|--------|------|---------------|-------------|
| GET | `/customer` | Session cookie or Cart-Token with logged-in user | Get current customer data (billing/shipping addresses, non-sensitive) |
| POST | `/customer` | Session cookie | Update customer billing/shipping addresses |

**Important limitation:** Store API customer endpoint returns **session-scoped** data only — it cannot look up a customer by ID, list all orders across sessions, or authenticate. Full customer auth (login, register, order history) requires either the WC REST API (`/wp-json/wc/v3/`) with OAuth1a/Application Passwords, or WPGraphQL customer queries with JWT auth. This is the customer auth strategy open question flagged in SUMMARY.md. For Phase 1, scope `getCustomer`/`updateCustomer` to the session-scoped Store API surface; full auth is a Phase 1 spike / ADR item.

### Orders Endpoint (Store API)

| Method | Path | Auth Required | Description |
|--------|------|---------------|-------------|
| GET | `/order/{id}` | Cart-Token (order must belong to session) | Get single order; same shape as cart response |

**Note:** `listCustomerOrders` requires WPGraphQL or WC REST API — the Store API `/order/{id}` endpoint only retrieves a single order by ID for the current session. Order history queries must use WPGraphQL `customer.orders` connection (requires auth) or fall back to WC REST API.

### Search / Products Filter

The Store API `/products` endpoint accepts `?search=` but returns raw product data without facets. Full search with facets should use WPGraphQL `products(where: { search: ... })` query.

---

## Cart-Token Flow — Implementation Pattern

**Confidence: HIGH** — Verified against [WC Cart Tokens docs](https://developer.woocommerce.com/docs/apis/store-api/cart-tokens/) and cross-referenced with PITFALLS.md pitfall #1.

### The Flow

```
1. Client: GET /wc/store/v1/cart
   ← Response: 200, body: { items: [], ... }, header: Cart-Token: <token>

2. Client: Extract Cart-Token from response headers
   → Store in WooClient session store (in-memory Map<WooClient, SessionState>)
   → In @arc/next: persist to arc_cart_token HttpOnly cookie

3. Client: POST /wc/store/v1/cart/add-item
   → Header: Cart-Token: <token>
   ← Response: 200, body: updated cart, header: Cart-Token: <same token>

4. Client: Tab reload / new request
   → Read Cart-Token from session store (or from cookie in @arc/next)
   → Send as header on all cart/checkout requests
```

### WooClient Session Store

The session store must be injectable to support:
- Server-side (Next.js): token comes from `arc_cart_token` cookie passed in from `@arc/next`
- Client-side: token persisted in-memory (survives React re-renders, lost on full page reload without cookie bridge)
- Test: token injectable via constructor for deterministic tests

```typescript
// src/session.ts
export interface ArcSession {
  cartToken: string | null;
  nonce: string | null;
}

export interface SessionStore {
  get(): ArcSession;
  set(session: Partial<ArcSession>): void;
}

// Default: in-memory (used in @arc/core standalone / hooks)
export function createInMemorySessionStore(): SessionStore {
  let state: ArcSession = { cartToken: null, nonce: null };
  return {
    get: () => ({ ...state }),
    set: (patch) => { state = { ...state, ...patch }; },
  };
}
```

### WooClient Request/Response Cycle

```typescript
// src/http/client.ts
export class WooClient {
  private readonly baseUrl: string;
  private readonly session: SessionStore;

  constructor(config: WooClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '') + '/wp-json/wc/store/v1';
    this.session = config.session ?? createInMemorySessionStore();
  }

  async request<T>(
    method: string,
    path: string,
    options?: RequestInit & { body?: unknown }
  ): Promise<T> {
    const { cartToken, nonce } = this.session.get();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(cartToken ? { 'Cart-Token': cartToken } : {}),
      // Only send Nonce when no Cart-Token — never co-send
      ...(!cartToken && nonce ? { 'X-WC-Store-API-Nonce': nonce } : {}),
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    // Capture Cart-Token from response — first call and any rotation
    const returnedToken = response.headers.get('Cart-Token');
    if (returnedToken && returnedToken !== cartToken) {
      this.session.set({ cartToken: returnedToken });
    }

    if (!response.ok) {
      return this.handleError(response, method, path, options);
    }

    return response.json() as T;
  }
}
```

### CORS: `Access-Control-Expose-Headers`

The WP host must expose the `Cart-Token` header to the Next.js origin. Store API 9.8+ automatically includes it for Store API responses, but earlier versions require a manual WP filter. Document this in the Pilot's `docker-compose` setup and ship a `functions.php` snippet:

```php
// Expose Cart-Token header for cross-origin headless setups
add_filter('rest_pre_serve_request', function($served, $result, $request) {
    header('Access-Control-Expose-Headers: Cart-Token, X-WC-Store-API-Nonce');
    return $served;
}, 10, 3);
```

**Confidence: MEDIUM** — WC 9.8+ reportedly handles this automatically but the exact version boundary is not confirmed in official docs. Ship the filter as a safety net regardless.

---

## Nonce Retry Pattern

**Confidence: HIGH** — Verified against [WC Nonce Tokens docs](https://developer.woocommerce.com/docs/apis/store-api/nonce-tokens) and WooCommerce GitHub issues.

### Error Response Shape

When a nonce is invalid, the Store API returns:

```json
HTTP 401
{
  "code": "woocommerce_rest_cookie_invalid_nonce",
  "message": "Cookie nonce is invalid",
  "data": { "status": 401 }
}
```

**Note:** The error code in the JSON body is `woocommerce_rest_cookie_invalid_nonce` (not `rest_cookie_invalid_nonce` — the WP core variant). Detect by checking `response.code === 'woocommerce_rest_cookie_invalid_nonce'`.

### Retry-Once Pattern

```typescript
// In WooClient.request() — handleError method
private async handleError<T>(
  response: Response,
  method: string,
  path: string,
  options?: RequestInit & { body?: unknown },
  isRetry = false
): Promise<T> {
  const body = await response.json().catch(() => ({}));

  if (
    response.status === 401 &&
    body.code === 'woocommerce_rest_cookie_invalid_nonce' &&
    !isRetry
  ) {
    // Refresh nonce via lightweight WP endpoint, then retry exactly once
    const fresh = await this.refreshNonce();
    this.session.set({ nonce: fresh });
    return this.request<T>(method, path, { ...options, _isRetry: true } as any);
  }

  throw normaliseError(response.status, body);
}

private async refreshNonce(): Promise<string> {
  // WP nonce endpoint — route registered by Arc's WP helper plugin or documented
  // as a requirement in the Pilot setup guide
  const r = await fetch(`${this.wpBaseUrl}/wp-json/arc/v1/nonce`);
  const { nonce } = await r.json();
  return nonce as string;
}
```

**Key constraint:** Cart-Token auth mode bypasses nonce checks entirely. In pure headless mode with Cart-Token, the nonce retry path is only triggered for non-session write operations. Document this explicitly: if `cartToken` is present, `woocommerce_rest_cookie_invalid_nonce` should not appear; if it does, it indicates a misconfigured WP CORS setup or a request missing the Cart-Token header.

---

## Error Normalisation Pattern

```typescript
// src/types/errors.ts
export type ArcError =
  | { type: 'api'; status: number; code: string; message: string; data?: unknown }
  | { type: 'network'; message: string; cause?: Error }
  | { type: 'parse'; message: string; cause?: Error };

export function normaliseError(status: number, body: unknown): ArcError {
  if (
    typeof body === 'object' && body !== null &&
    'code' in body && 'message' in body
  ) {
    return {
      type: 'api',
      status,
      code: String((body as any).code),
      message: String((body as any).message),
      data: (body as any).data,
    };
  }
  return { type: 'api', status, code: 'unknown', message: String(body) };
}
```

All WooClient methods throw `ArcError` — never raw `Response` or `Error`. Callers use discriminated union to handle error types.

---

## graphql-request v7 — Client Setup and Auth Injection

**Confidence: HIGH** — Verified via `graphql-request@7.4.0` jsDocs.io API reference and npm package metadata.

### Client Instantiation with requestMiddleware

```typescript
// src/graphql/client.ts
import { GraphQLClient, type RequestMiddleware, type ResponseMiddleware } from 'graphql-request';

export interface WPGraphQLConfig {
  endpoint: string;        // e.g. 'https://store.example.com/graphql'
  authToken?: () => string | null;  // function to return current JWT/token
}

export function createWPGraphQLClient(config: WPGraphQLConfig): GraphQLClient {
  const requestMiddleware: RequestMiddleware = async (request) => {
    const token = config.authToken?.();
    return {
      ...request,
      headers: {
        ...request.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  };

  const responseMiddleware: ResponseMiddleware = (response) => {
    if (response instanceof Error) return;
    // Log GraphQL errors in dev; surface as ArcError in production
    if ('errors' in response && response.errors?.length) {
      // normalise to ArcError shape for callers
    }
  };

  return new GraphQLClient(config.endpoint, {
    requestMiddleware,
    responseMiddleware,
  });
}
```

### Key v7 API facts

- `requestMiddleware` is an async function; it receives the full `Request` object and returns a modified `Request`.
- `responseMiddleware` receives `GraphQLClientResponse<unknown> | ClientError | Error`; return type is `MaybePromise<void>`.
- `GraphQLClient.request<TData, TVariables>()` is generic and TypeScript-safe when combined with codegen output.
- The `graphql-request` v7 package is the final release under that name — it has been renamed to `graffle` for v8+. Pin `graphql-request@7.x` for v0.1; plan migration to `graffle` for v0.2+. **Confidence: MEDIUM** (sourced from npm metadata and GitHub repo rename).

---

## graphql-codegen v6 — Config for WPGraphQL for WooCommerce

**Confidence: HIGH** — Verified against [graphql-codegen v6 April 2026 release](https://the-guild.dev/graphql/hive/blog/graphql-codegen-client-v6-202604) and [client-preset docs](https://the-guild.dev/graphql/codegen/plugins/presets/preset-client).

### Prerequisites on WP side

Enable public introspection in WP Admin: **GraphQL > Settings > Enable Public Introspection**. Required for schema pull during codegen.

### `codegen.ts` (in `Arc/Core/`)

```typescript
// codegen.ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: {
    [`${process.env.WP_GRAPHQL_ENDPOINT ?? 'http://localhost:8888/graphql'}`]: {
      headers: {
        // Optional: add auth for private schemas
        ...(process.env.WP_GRAPHQL_TOKEN
          ? { Authorization: `Bearer ${process.env.WP_GRAPHQL_TOKEN}` }
          : {}),
      },
    },
  },
  documents: ['src/graphql/**/*.graphql', '!src/graphql/__generated__/**'],
  generates: {
    'src/graphql/__generated__/': {
      preset: 'client',
      presetConfig: {
        // v6: only generates types for operations actually in `documents`
        // fragment masking disabled — Arc consumers want direct field access
        fragmentMasking: false,
      },
      config: {
        strictScalars: true,
        scalars: {
          // WPGraphQL common custom scalars
          ID: 'string',
          Upload: 'File',
        },
        useTypeImports: true,
      },
    },
  },
  ignoreNoDocuments: false,
};

export default config;
```

**v6 behaviour change:** In v6 the preset only generates types for operations listed in `documents`. The full schema type tree is no longer emitted. This means `src/graphql/__generated__/` will contain only types used by Arc's actual queries — not all 400+ WooCommerce GraphQL types. This is the desired behaviour.

### Sample `.graphql` query files

```graphql
# src/graphql/products.graphql
fragment ProductListFields on SimpleProduct {
  databaseId
  slug
  name
  price
  regularPrice
  salePrice
  onSale
  featuredImage { node { sourceUrl altText } }
  productCategories { nodes { slug name } }
}

fragment ProductDetailFields on SimpleProduct {
  ...ProductListFields
  description
  shortDescription
  galleryImages { nodes { sourceUrl altText } }
  attributes { nodes { name options } }
  related { nodes { ...ProductListFields } }
}

fragment VariableProductDetailFields on VariableProduct {
  databaseId
  slug
  name
  price
  variations {
    nodes {
      databaseId
      price
      stockStatus
      attributes { nodes { name value } }
      image { sourceUrl altText }
    }
  }
}

query GetProduct($slug: ID!) {
  product(id: $slug, idType: SLUG) {
    ... on SimpleProduct { ...ProductDetailFields }
    ... on VariableProduct { ...VariableProductDetailFields }
  }
}

query GetProducts($first: Int = 24, $after: String, $where: RootQueryToProductConnectionWhereArgs) {
  products(first: $first, after: $after, where: $where) {
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on SimpleProduct { ...ProductListFields }
      ... on VariableProduct { databaseId slug name price featuredImage { node { sourceUrl altText } } }
    }
  }
}
```

```graphql
# src/graphql/collections.graphql
fragment CollectionListFields on ProductCategory {
  databaseId
  slug
  name
  count
  image { sourceUrl altText }
}

query GetCollection($slug: ID!) {
  productCategory(id: $slug, idType: SLUG) {
    ...CollectionListFields
    children { nodes { ...CollectionListFields } }
    ancestors { nodes { ...CollectionListFields } }
  }
}

query ListCollections($first: Int = 50) {
  productCategories(first: $first, where: { hideEmpty: true }) {
    nodes { ...CollectionListFields }
  }
}

query GetCollectionProducts($slug: ID!, $first: Int = 24, $after: String) {
  products(first: $first, after: $after, where: { categoryIn: [$slug] }) {
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on SimpleProduct { ...ProductListFields }
      ... on VariableProduct { databaseId slug name price featuredImage { node { sourceUrl altText } } }
    }
  }
}
```

```graphql
# src/graphql/search.graphql
query SearchProducts($search: String!, $first: Int = 24, $after: String) {
  products(first: $first, after: $after, where: { search: $search, status: "publish" }) {
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on SimpleProduct { ...ProductListFields }
      ... on VariableProduct { databaseId slug name price featuredImage { node { sourceUrl altText } } }
    }
  }
}
```

```graphql
# src/graphql/customer.graphql
# Requires auth token in Authorization header
query GetCustomerOrders($first: Int = 10, $after: String) {
  customer {
    databaseId
    email
    firstName
    lastName
    billing { firstName lastName address1 address2 city state postcode country phone email }
    shipping { firstName lastName address1 address2 city state postcode country }
    orders(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        databaseId
        orderNumber
        status
        total
        date
        lineItems { nodes { productId quantity total product { node { name slug } } } }
      }
    }
  }
}
```

---

## WPGraphQL for WooCommerce — Query Inventory

**Confidence: HIGH** — Sourced from [WPGraphQL for WooCommerce GitHub](https://github.com/wp-graphql/wp-graphql-woocommerce).

| Query | What it does | Auth required |
|-------|-------------|---------------|
| `product(id, idType)` | Single product by ID, slug, or SKU | No |
| `products(first, after, where)` | Paginated product list with filtering | No |
| `productCategory(id, idType)` | Single category/collection | No |
| `productCategories(first, where)` | List categories | No |
| `productTags(first)` | List tags (for faceting) | No |
| `customer` | Current customer data + orders | Yes — JWT in Authorization header |
| `order(id)` | Single order | Yes |
| `orders(first, where)` | Customer order list | Yes |
| `coupon(id)` | Coupon details | No |
| `refund(id)` | Refund details | Yes |

**Union types for products:** WPGraphQL for WooCommerce exposes `SimpleProduct`, `VariableProduct`, `ExternalProduct`, `GroupProduct`. Use inline fragments in all queries.

**Fragment gotcha:** `ProductListFields` fragment defined on `SimpleProduct` cannot be spread onto a `VariableProduct` — they are separate types. Define fragments per type, or use an interface (`Node`, `Product`) if the WooGraphQL schema version supports it. Safest pattern: inline fragments with `... on SimpleProduct` and `... on VariableProduct`.

---

## React 19 Hooks — Framework-Agnostic Pattern

**Confidence: HIGH** — Verified against [React 19 release blog](https://react.dev/blog/2024/12/05/react-19) and React hook documentation.

### Key React 19 APIs relevant to `@arc/core` hooks

| API | Use in Arc | Notes |
|-----|-----------|-------|
| `useSyncExternalStore` | `useCart` — subscribe to WooClient cart state | The correct hook for external mutable stores; React 18+ |
| `useOptimistic` | `useCart` mutations — show immediate update before network | React 19 stable; reducer pattern `(current, optimistic) => merged` |
| `useState` + `useEffect` | `useProduct`, `useCollection`, `useSearch` | Standard for data fetching in client components |
| `use(promise)` | Suspense-based product/collection loading | React 19 stable; requires Suspense boundary at callsite |

### `useCart` — Architecture Decision

`useCart` is the most complex hook. It needs:
1. Reactive updates when cart changes (multiple components consuming same cart)
2. Optimistic mutations (add/remove appears instant)
3. Framework-agnostic (no Next.js imports)

**Recommended pattern: `useSyncExternalStore` with an external cart store**

```typescript
// src/hooks/useCart.ts
import { useSyncExternalStore, useOptimistic } from 'react';
import type { WCCart } from '../types/cart';
import type { WooClient } from '../http/client';

// Cart store singleton per WooClient instance
class CartStore {
  private listeners = new Set<() => void>();
  private cart: WCCart | null = null;
  private loading = false;

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): { cart: WCCart | null; loading: boolean } {
    return { cart: this.cart, loading: this.loading };
  }

  getServerSnapshot(): { cart: WCCart | null; loading: boolean } {
    // SSR: return empty cart — cart state is always client-side
    return { cart: null, loading: false };
  }

  notify() {
    for (const l of this.listeners) l();
  }

  async refresh(client: WooClient) {
    this.loading = true;
    this.notify();
    try {
      this.cart = await client.getCart();
    } finally {
      this.loading = false;
      this.notify();
    }
  }
}

const storeMap = new WeakMap<WooClient, CartStore>();

export function useCart(client: WooClient) {
  const store = storeMap.get(client) ?? (() => {
    const s = new CartStore();
    storeMap.set(client, s);
    return s;
  })();

  const { cart, loading } = useSyncExternalStore(
    store.subscribe.bind(store),
    store.getSnapshot.bind(store),
    store.getServerSnapshot.bind(store),
  );

  const [optimisticCart, applyOptimistic] = useOptimistic(
    cart,
    (current, action: OptimisticCartAction) => applyOptimisticUpdate(current, action),
  );

  const addItem = async (productId: number, quantity: number) => {
    applyOptimistic({ type: 'add', productId, quantity });
    const updated = await client.addItem({ id: productId, quantity });
    store.setCart(updated);
    store.notify();
  };

  return { cart: optimisticCart, loading, addItem, /* removeItem, updateItem, etc. */ };
}
```

**Why `useSyncExternalStore` over `useState`:** Multiple components calling `useCart(client)` with the same client instance must share state. `useState` creates independent state per component. `useSyncExternalStore` + the `WeakMap` pattern ensures all consumers on the same `WooClient` see the same cart.

**Why not React Context:** Context requires a Provider wrapper, which adds coupling to the component tree. The `WeakMap<WooClient, CartStore>` pattern works without any Provider and is compatible with Server Components trees.

### `useProduct` — Pattern

```typescript
// src/hooks/useProduct.ts — simplified
export function useProduct(slug: string, client: GraphQLClient) {
  const [data, setData] = useState<WCProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariation, setSelectedVariation] = useState<WCVariation | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    client.request(GetProductDocument, { slug })
      .then((res) => { if (!cancelled) setData(res.product); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug, client]);

  return { product: data, loading, selectedVariation, setSelectedVariation };
}
```

### `useSearch` — Debounce Pattern

```typescript
// src/hooks/useSearch.ts
export function useSearch(client: GraphQLClient, debounceMs = 300) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WCProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await client.request(SearchProductsDocument, { search: query });
        setResults(res.products.nodes);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [query, client, debounceMs]);

  return { query, setQuery, results, loading };
}
```

### Framework-Agnostic Enforcement

- No `next/cache`, `next/headers`, `next/navigation` imports anywhere in `src/`
- No `cookies()`, `headers()`, `revalidateTag()` calls
- No `'use server'` directives
- Import `server-only` at the top of `src/http/session.ts` only if that module must not run in a browser (assess per function)

**Biome `noRestrictedImports` config (to add to `biome.jsonc`):**
```json
{
  "linter": {
    "rules": {
      "correctness": {
        "noRestrictedImports": {
          "level": "error",
          "options": {
            "paths": [
              {
                "name": "next",
                "message": "@arc/core must not import from next/*. Use @arc/next for Next.js-specific code."
              },
              {
                "name": "next/cache",
                "message": "@arc/core must not import from next/*."
              },
              {
                "name": "next/headers",
                "message": "@arc/core must not import from next/*."
              },
              {
                "name": "next/navigation",
                "message": "@arc/core must not import from next/*."
              }
            ]
          }
        }
      }
    }
  }
}
```

The CI grep gate (already in Phase 0) provides a second enforcement layer:
```bash
# In CI — fails PR if next/* found in @arc/core or @weave/react source
grep -r "from ['\"]next/" Arc/Core/src Weave/React/src && exit 1 || exit 0
```

---

## Phase 1 Parallelisation Strategy

**Pre-swarm (serial, blocks everything):**

| Step | What | Why serial |
|------|------|-----------|
| P0 | Scaffold `src/` directory structure + empty barrel exports | Avoids import path conflicts when 6 agents write simultaneously |
| P1 | `src/http/client.ts` + `src/http/errors.ts` + `src/session.ts` — `WooClient` complete | All domain agents import and depend on it |
| P2 | `src/types/` hand-authored TS types (cart, checkout, customer, orders, products) stubs | Agents need type references; stubs prevent TS errors during development |
| P3 | `src/graphql/client.ts` — `createWPGraphQLClient` + codegen scaffold | GraphQL agents import this |

**Swarm wave 1 (6 parallel agents — all independent after pre-swarm):**

| Agent | Files | Dependencies |
|-------|-------|-------------|
| A — Cart | `src/store-api/cart.ts`, `src/__tests__/contract/cart.contract.ts` | WooClient (P1), cart types (P2) |
| B — Checkout | `src/store-api/checkout.ts`, `src/__tests__/contract/checkout.contract.ts` | WooClient (P1), checkout types (P2) |
| C — Products/GQL | `src/graphql/products.graphql`, `src/graphql/products.ts`, `src/__tests__/contract/products.contract.ts` | GQL client (P3), product types (P2) |
| D — Collections+Search/GQL | `src/graphql/collections.graphql`, `src/graphql/search.graphql`, `src/graphql/collections.ts`, `src/graphql/search.ts` | GQL client (P3), collection types (P2) |
| E — Orders | `src/store-api/orders.ts`, `src/__tests__/contract/orders.contract.ts` | WooClient (P1), order types (P2) |
| F — Customer | `src/store-api/customer.ts`, `src/graphql/customer.graphql`, `src/__tests__/contract/customer.contract.ts` | WooClient (P1), GQL client (P3), customer types (P2) |

**Swarm wave 2 (2 serial follow-on agents — after wave 1 complete):**

| Agent | Files | Why serial |
|-------|-------|-----------|
| G — Types reconciliation | `src/types/*.ts` — fill in all stubs with full types validated against contract test output | Needs to see all module shapes before finalising |
| H — Hooks | `src/hooks/*.ts` — all 5 hooks | Needs all domain modules + types complete |

**Final step:** Update `src/index.ts` barrel to export all public symbols.

**File ownership rule:** Agents A–F must not modify `src/http/`, `src/session.ts`, `src/graphql/client.ts`, or `src/types/`. They consume but do not own these files. Conflicts prevented by clear ownership in task descriptions.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GraphQL typed queries | Custom code-generation | `@graphql-codegen/cli` + `client-preset` | 400+ type variations in WC schema; codegen handles schema drift, union types, nullable fields |
| Zod validation schemas for every Store API type | Manual type guards | Zod 4 `.parse()` / `.safeParse()` | Store API returns inconsistent nulls vs undefined vs missing keys across WC versions |
| GraphQL HTTP client | Custom fetch + error handling | `graphql-request` | Handles multipart, batching, persisted queries, correct error extraction from 200-status GraphQL errors |
| Debounce utility | `setTimeout` abstraction | Plain `setTimeout`/`clearTimeout` in `useSearch` (no lib) | ~5 lines; not worth a dep |
| Session storage abstraction | Custom localStorage wrapper | Injectable `SessionStore` interface (see above) | Allows `@arc/next` to inject cookie-based session without core importing `next/headers` |

---

## Common Pitfalls

### Pitfall 1: Cart-Token Not Captured (CORS)

**What goes wrong:** `GET /cart` returns `Cart-Token` in response headers. Browser fetch cannot read it because `Access-Control-Expose-Headers` does not list `Cart-Token`. Every subsequent add-to-cart starts a new anonymous cart. Symptom: cart count flickers between 0 and actual value on reload; two browser tabs show different carts.

**Why it happens:** WC Store API 9.8+ exposes `Cart-Token` in CORS responses but only if the request origin matches an allowed origin. On many hosting setups the wildcard CORS config (`*`) prevents header access.

**How to avoid:** Ship a documented WP filter (`Access-Control-Expose-Headers: Cart-Token, X-WC-Store-API-Nonce`). Verify with a test that reads `response.headers.get('Cart-Token')` from a fresh `GET /cart` in the contract test suite.

**Warning signs:** `response.headers.get('Cart-Token')` returns `null` in tests despite a 200 response.

### Pitfall 2: Co-sending Nonce + Cart-Token

**What goes wrong:** Sending both `Cart-Token` and `X-WC-Store-API-Nonce` on the same request causes WC to validate both and potentially reject the request if the nonce is stale, even though Cart-Token alone would have succeeded.

**How to avoid:** `WooClient.request()` must be gated: if `cartToken` is present, do not send `nonce`. These are mutually exclusive auth modes.

### Pitfall 3: WPGraphQL Union Type Fragments

**What goes wrong:** `fragment ProductFields on Product` — WPGraphQL for WooCommerce's `Product` is an interface, not a type. Fragments on interfaces only expose shared fields. Variation-specific fields require `... on VariableProduct` inline fragments. Devs write one fragment and wonder why `variations` is undefined.

**How to avoid:** Always write `... on SimpleProduct` and `... on VariableProduct` inline fragments in product queries. The `ProductListFields` and `ProductDetailFields` fragments must target concrete types.

### Pitfall 4: Nonce Error Code Mismatch

**What goes wrong:** Implementing nonce retry by catching `rest_cookie_invalid_nonce` (WordPress core error code) — but WC Store API returns `woocommerce_rest_cookie_invalid_nonce`. The retry never fires. Silent auth failures.

**How to avoid:** Use `woocommerce_rest_cookie_invalid_nonce` as the detection code in `WooClient.handleError()`.

### Pitfall 5: graphql-request v8 Breaking Rename

**What goes wrong:** Running `pnpm update graphql-request` in the future and accidentally upgrading to `graffle` (the v8 rename), which has a completely different API.

**How to avoid:** Pin `graphql-request` to `"^7.4.0"` with an explicit `<8.0.0` ceiling in `package.json`. Add a note in the package.json comment or CLAUDE.md: "graphql-request v8 is renamed to graffle — migration is a breaking change, plan separately."

### Pitfall 6: `useCart` State Split Across Components

**What goes wrong:** Using `useState` in `useCart` means each component calling `useCart(client)` gets its own isolated state. Cart count in the header and cart drawer in a modal end up out of sync after a mutation.

**How to avoid:** Use the `WeakMap<WooClient, CartStore>` + `useSyncExternalStore` pattern described above. All consumers sharing the same `WooClient` instance share the same cart state.

### Pitfall 7: `@arc/core` Importing from `next/*`

**What goes wrong:** Developer adds `import { cookies } from 'next/headers'` inside `useCart` to read the `arc_cart_token` cookie for SSR. Package passes local tests (they run in Next.js context) but fails when consumed in a plain Vite app or Remix.

**How to avoid:** The Biome `noRestrictedImports` rule + CI grep gate enforced in Phase 0 catches this at PR time. Cookie bridge lives exclusively in `@arc/next`.

### Pitfall 8: Store API Customer Endpoint Is Session-Scoped Only

**What goes wrong:** Developer calls `GET /wc/store/v1/customer` expecting full customer profile and order history. Gets only the session-level billing/shipping address. Then queries `listCustomerOrders` and finds no endpoint exists in Store API.

**How to avoid:** Document clearly in JSDoc on `getCustomer()`: "Returns session-scoped customer address data only. For order history, use `useCustomer()` which queries WPGraphQL with auth token." The `listCustomerOrders` function lives in `src/graphql/customer.ts`, not `src/store-api/customer.ts`.

### Pitfall 9: graphql-codegen Generates Too Many Types (v5 behaviour)

**What goes wrong:** Using older codegen v5 config generates all WC GraphQL types (~400 types) even when only 6 queries are defined, bloating `__generated__/` and slowing TypeScript compilation.

**How to avoid:** Use `@graphql-codegen/client-preset@6.x` — v6 generates types only for operations in `documents`. Also add `src/graphql/__generated__/` to `.gitignore`; it regenerates from schema.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `unstable_cache` for Next.js caching | `'use cache'` + `cacheTag` directive | Next.js 16 | `@arc/next` must use new API; `@arc/core` unaffected (no caching) |
| `graphql-request` v5/v6 middleware | `requestMiddleware` / `responseMiddleware` async functions in v7 | v7.0 (2024) | Same API concept, now async-safe |
| `graphql-codegen` per-plugin config | `client-preset` v6 (April 2026) | April 2026 | Simpler config, less generated code, ESM-native |
| `useSyncExternalStore` + Context | `useSyncExternalStore` + `WeakMap` store | React 18+ pattern, no version change | Context-free; works in RSC component trees |
| `graphql-request` package name | `graffle` (v8+ rename) | 2025/2026 | Pin v7; plan v8 migration separately |

**Deprecated/outdated:**
- `@graphql-codegen/typescript-graphql-request` plugin: does not support v7 (tracked in [issue #743](https://github.com/dotansimha/graphql-code-generator-community/issues/743)). Use `client-preset` instead — it generates typed documents used directly with `graphql-request`.
- `middleware.ts` in Next.js 16: renamed to `proxy.ts`. Irrelevant to `@arc/core` but relevant to `Arc/Pilot` setup.

---

## Open Questions

1. **Customer authentication strategy**
   - What we know: Store API customer endpoint is session-scoped only. Full customer auth (login, order history) needs JWT or Application Passwords via WC REST API or WPGraphQL auth.
   - What's unclear: Which auth flow to ship in v0.1 — JWT (WPGraphQL JWT Authentication plugin), Application Passwords (WC REST API), or custom auth bridge. Each has different security tradeoffs.
   - Recommendation: Spike before Phase 1 hooks agent (Agent H) starts `useCustomer`. Likely ADR-0009. For Phase 1, scope `useCustomer` to session address data + WPGraphQL order history behind an `authToken` parameter.

2. **npm scope availability — `@arc` and `@weave`**
   - What we know: Both scopes are likely taken (flagged in SUMMARY.md as ADR-0008 open item).
   - What's unclear: Actual availability. Cannot verify without npm account check.
   - Recommendation: Verify before writing any import path anywhere. If `@arc` is taken, alternatives: `@arcwoo`, `@arc-woo`, `@arcwc`. All internal `workspace:*` imports unaffected — only affects published package names.

3. **WooGraphQL schema version compatibility**
   - What we know: WPGraphQL for WooCommerce is actively maintained but single-maintainer. CVE-2026-33290 affects WPGraphQL core.
   - What's unclear: Which minimum version of `wp-graphql-woocommerce` supports the complete query set listed above.
   - Recommendation: Pin `^0.21.0` minimum in Pilot's `docker-compose` WP setup. Run contract tests against the pinned version in CI.

4. **graphql-request → graffle migration timeline**
   - What we know: v8 is the `graffle` rename; v7 is the final `graphql-request` release.
   - What's unclear: Whether `graffle` v8 will be a clean migration or a full API rewrite.
   - Recommendation: Ship Phase 1 on `graphql-request@^7.4.0`. Add a migration note in CLAUDE.md. Plan `graffle` migration for v0.2 once its API stabilises.

---

## Environment Availability

> Phase 1 is source-code-only — no runtime tools beyond Node.js and the existing monorepo are required to implement `@arc/core`. The `wp-env` dependency for contract tests is a dev-time concern.

| Dependency | Required By | Available | Notes | Fallback |
|------------|------------|-----------|-------|----------|
| Node.js | pnpm, Vitest, tsup | Yes (Phase 0 verified) | Must be >=22.12 for Vitest 4 | — |
| pnpm 11 | Package install | Yes (Phase 0 complete) | — | — |
| `wp-env` (`@wordpress/env`) | Contract tests (`ARC-API-08`, `ARC-GQL-07`) | Not verified | Requires Docker. Needed for `wp-env start` to spin up local WP+WC | Skip contract tests in Phase 1 unit test pass; mark contract tests as `test.skip` pending `wp-env` setup in Phase 5 |
| Docker | `wp-env` | Not verified | Required for `wp-env` | Document in CONTRIBUTING.md; contract tests gated behind `CI_WP_ENV=true` env flag |
| WPGraphQL introspection endpoint | `codegen.ts` | Not available (no WP instance yet) | Required for `pnpm codegen` to generate types | Check in pre-generated `__generated__/` snapshot from a seeded `wp-env` fixture for Phase 1; regenerate in CI |

**Missing dependencies with no fallback for Phase 1 unit tests:** None — all unit tests run without external services.

**Missing dependencies for contract tests:** `wp-env` + Docker. Recommendation: gate contract tests behind environment flag. Phase 1 completion criteria should include unit tests passing; contract test CI pass is a Phase 5 gate.

---

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json`.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.x |
| Config file | Root `vitest.workspace.ts` (Phase 0 established) |
| Quick run command | `pnpm --filter @arc/core test --run` |
| Full suite command | `pnpm test` (Turborepo workspace) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ARC-API-01 | Cart-Token captured from response header and replayed on next request | unit | `pnpm --filter @arc/core test --run src/__tests__/unit/cart-token.test.ts` | Wave 0 |
| ARC-API-02 | `rest_cookie_invalid_nonce` triggers nonce refresh and retry exactly once | unit | `pnpm --filter @arc/core test --run src/__tests__/unit/nonce-retry.test.ts` | Wave 0 |
| ARC-API-03 | Error normalisation produces correct `ArcError` shape for each error code | unit | `pnpm --filter @arc/core test --run src/__tests__/unit/errors.test.ts` | Wave 0 |
| ARC-API-04 | Cart CRUD functions return typed `WCCart` response | unit + contract | `pnpm --filter @arc/core test --run src/__tests__/contract/cart.contract.ts` | Wave 0 |
| ARC-API-05 | `submitCheckout` sends correct payload shape | unit + contract | `pnpm --filter @arc/core test --run src/__tests__/contract/checkout.contract.ts` | Wave 0 |
| ARC-API-06 | `getCustomer` returns session-scoped customer data | unit + contract | `pnpm --filter @arc/core test --run src/__tests__/contract/customer.contract.ts` | Wave 0 |
| ARC-API-07 | `getOrder` returns typed order response | unit + contract | `pnpm --filter @arc/core test --run src/__tests__/contract/orders.contract.ts` | Wave 0 |
| ARC-API-08 | All Store API types present, exported, and non-`any` | TS compile | `pnpm --filter @arc/core build` (tsup + d.ts emit fails on `any` with strict) | Wave 0 |
| ARC-GQL-01 | `graphql-request` client sends auth header when token provided | unit | `pnpm --filter @arc/core test --run src/__tests__/unit/gql-client.test.ts` | Wave 0 |
| ARC-GQL-02 | Codegen generates typed `GetProductQuery`, `GetProductsQuery` etc. | TS compile | `pnpm --filter @arc/core codegen && pnpm --filter @arc/core build` | Wave 0 (codegen setup) |
| ARC-GQL-03 | `getProduct(slug)` returns typed product | contract | `pnpm --filter @arc/core test --run src/__tests__/contract/products.contract.ts` | Wave 0 |
| ARC-GQL-04 | Fragment exports present: `ProductListFieldsFragmentDoc`, `ProductDetailFieldsFragmentDoc` | TS compile | `pnpm --filter @arc/core build` | Wave 0 |
| ARC-GQL-05 | `getCollection(slug)` returns typed collection | contract | `pnpm --filter @arc/core test --run src/__tests__/contract/products.contract.ts` | Wave 0 |
| ARC-GQL-06 | `searchProducts(query)` returns paginated results | contract | `pnpm --filter @arc/core test --run src/__tests__/contract/products.contract.ts` | Wave 0 |
| ARC-GQL-07 | All documented queries resolve in <500ms | perf | `pnpm --filter @arc/core test --run src/__tests__/perf/graphql.perf.ts` (CI_WP_ENV=true) | Wave 0 |
| ARC-HOOK-01 | `useCart` state shared across two consumers of same WooClient | unit (jsdom) | `pnpm --filter @arc/core test --run src/__tests__/unit/hooks.test.ts` | Wave 0 |
| ARC-HOOK-02 | `useProduct` fetches and returns product on mount | unit (jsdom) | `pnpm --filter @arc/core test --run src/__tests__/unit/hooks.test.ts` | Wave 0 |
| ARC-HOOK-03 | `useCollection` returns paginated collection | unit (jsdom) | `pnpm --filter @arc/core test --run src/__tests__/unit/hooks.test.ts` | Wave 0 |
| ARC-HOOK-04 | `useCustomer` returns session customer data | unit (jsdom) | `pnpm --filter @arc/core test --run src/__tests__/unit/hooks.test.ts` | Wave 0 |
| ARC-HOOK-05 | `useSearch` debounces query and returns results | unit (jsdom) | `pnpm --filter @arc/core test --run src/__tests__/unit/hooks.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter @arc/core test --run` (unit tests only; <10s)
- **Per wave merge:** `pnpm test` (full workspace; unit + type-check)
- **Phase gate:** Full suite green (including contract tests with `CI_WP_ENV=true`) before `/gsd:verify-work`

### Wave 0 Gaps (files that must be created before implementation agents start)

- [ ] `Arc/Core/src/__tests__/unit/cart-token.test.ts` — covers ARC-API-01
- [ ] `Arc/Core/src/__tests__/unit/nonce-retry.test.ts` — covers ARC-API-02
- [ ] `Arc/Core/src/__tests__/unit/errors.test.ts` — covers ARC-API-03
- [ ] `Arc/Core/src/__tests__/unit/gql-client.test.ts` — covers ARC-GQL-01
- [ ] `Arc/Core/src/__tests__/unit/hooks.test.ts` — covers ARC-HOOK-01 through ARC-HOOK-05
- [ ] `Arc/Core/src/__tests__/contract/cart.contract.ts` — ARC-API-04 (gated: `CI_WP_ENV=true`)
- [ ] `Arc/Core/src/__tests__/contract/checkout.contract.ts` — ARC-API-05
- [ ] `Arc/Core/src/__tests__/contract/products.contract.ts` — ARC-GQL-03, ARC-GQL-05, ARC-GQL-06
- [ ] `Arc/Core/src/__tests__/contract/customer.contract.ts` — ARC-API-06
- [ ] `Arc/Core/src/__tests__/contract/orders.contract.ts` — ARC-API-07
- [ ] `Arc/Core/src/__tests__/perf/graphql.perf.ts` — ARC-GQL-07 (gated: `CI_WP_ENV=true`)
- [ ] `Arc/Core/codegen.ts` — graphql-codegen config (ARC-GQL-02)
- [ ] `Arc/Core/src/graphql/__generated__/.gitkeep` — placeholder until `pnpm codegen` runs against wp-env

---

## Project Constraints (from CLAUDE.md)

| Constraint | Impact on Phase 1 |
|------------|------------------|
| TypeScript strict throughout | All `src/` files must pass `tsc --strict`; no `any` types in public API |
| pnpm workspaces | Use `pnpm --filter @arc/core` for scoped commands |
| tsup 8.5.x | `Arc/Core/package.json` `build` script already configured |
| Biome 2.4.x | `noRestrictedImports` for `next/*` must be added to `biome.jsonc` |
| Vitest 4.1.x | Test env must be `jsdom` for hooks tests; default for contract tests |
| Files under 500 lines — split before crossing | Each domain module (cart, checkout, products, etc.) stays in its own file |
| No secrets in repo | `WP_GRAPHQL_ENDPOINT` and `WP_GRAPHQL_TOKEN` in `.env.example` only |
| No `next/*` imports in `@arc/core` or `@weave/react` | CI grep gate from Phase 0 already enforces this |
| Commits: one concern | Each swarm agent produces one commit per file group |
| MIT license only in `Arc/` | No GPL dependencies; `graphql-request` (MIT), `zod` (MIT), `graphql` (MIT) — all compliant |
| GSD workflow enforcement | All file edits go through GSD `/gsd:execute-phase` |

---

## Sources

### Primary (HIGH confidence)
- [WooCommerce Store API root docs](https://developer.woocommerce.com/docs/apis/store-api/) — endpoint inventory, auth model
- [WooCommerce Cart Tokens docs](https://developer.woocommerce.com/docs/apis/store-api/cart-tokens/) — Cart-Token lifecycle
- [WooCommerce Nonce Tokens docs](https://developer.woocommerce.com/docs/apis/store-api/nonce-tokens) — Nonce retry pattern, error codes
- [WooCommerce Cart API docs](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/cart/) — Cart endpoint inventory
- [WooCommerce Cart Coupons API docs](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/cart-coupons/) — Coupon endpoints
- [WooCommerce Checkout API docs](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/checkout/) — Checkout payload shape
- [WooCommerce Order API docs](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/order/) — Order endpoint
- [WPGraphQL for WooCommerce GitHub](https://github.com/wp-graphql/wp-graphql-woocommerce) — Query inventory, schema types
- [graphql-request@7.4.0 jsDocs.io API reference](https://www.jsdocs.io/package/graphql-request) — `requestMiddleware`, `responseMiddleware`, `GraphQLClient` API
- [graphql-codegen client-preset docs](https://the-guild.dev/graphql/codegen/plugins/presets/preset-client) — Config reference
- [graphql-codegen v6 April 2026 release](https://the-guild.dev/graphql/hive/blog/graphql-codegen-client-v6-202604) — v6 behaviour changes
- [React 19 release blog](https://react.dev/blog/2024/12/05/react-19) — `useOptimistic`, `use()` stable APIs
- `.planning/research/SUMMARY.md` — prior synthesis, Cart-Token architecture
- `.planning/research/PITFALLS.md` — pitfalls 1–2 (Cart-Token CORS, WPGraphQL N+1)
- `CLAUDE.md` — project stack constraints

### Secondary (MEDIUM confidence)
- [Headless WooCommerce Store API in Next.js — real-world gotchas (dev.to)](https://dev.to/admondtamang/using-headless-woo-commerce-store-api-v1-in-nextjs-issue-faced-and-solutions-ieh) — CORS header requirements
- [WooCommerce issue #55653 — cart merge bug](https://github.com/woocommerce/woocommerce/issues/55653) — multi-session cart pitfall
- [WooCommerce issue #51217 — Invalid Nonce with Cart-Token](https://github.com/woocommerce/woocommerce/issues/51217) — co-send pitfall
- [graphql-codegen community issue #743 — typescript-graphql-request v7 support](https://github.com/dotansimha/graphql-code-generator-community/issues/743) — confirms using `client-preset` over deprecated plugin
- [Biome noRestrictedImports rule docs](https://biomejs.dev/linter/rules/no-restricted-imports/) — boundary enforcement config

### Tertiary (LOW — verify during implementation)
- graphql-request → graffle rename: inferred from npm metadata and GitHub repo; verify exact version when v8 ships
- WC Store API 9.8+ automatic CORS exposure of Cart-Token: referenced in PITFALLS.md; exact WC version boundary not confirmed in official release notes

---

## Metadata

**Confidence breakdown:**
- Store API endpoint inventory: HIGH — official WC docs verified
- Cart-Token flow: HIGH — official docs + cross-reference PITFALLS.md + GitHub issues
- Nonce retry pattern: HIGH — official docs + error code confirmed from WC source
- graphql-request v7 API: HIGH — jsDocs.io API reference for 7.4.0
- graphql-codegen v6 config: HIGH — official docs + April 2026 release post
- React 19 hooks patterns: HIGH — official React docs + React 19 release blog
- WPGraphQL query inventory: HIGH — official WPGraphQL for WooCommerce GitHub
- graphql-request → graffle rename: MEDIUM — npm metadata, not officially announced in docs
- WC 9.8+ CORS auto-exposure: MEDIUM — referenced in pitfalls research, exact version not confirmed

**Research date:** 2026-05-28
**Valid until:** 2026-06-28 (30 days) for stable APIs; 2026-06-05 (7 days) for graphql-codegen v6 (fast-moving)
