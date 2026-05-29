# Requirements: Arc + Weave Platform

**Defined:** 2026-05-28
**Core Value:** A developer can ship a production headless WooCommerce storefront on `@arc/core` + `@arc/next` + `@weave/react` with the same productivity Shopify Hydrogen + Weaverse gives Shopify developers — and the page configuration lives inside the merchant's own WordPress, not a vendor SaaS.

---

## v1 Requirements

Each requirement is testable and maps to a roadmap phase. Categories follow the package/surface split.

### Tooling & Foundations (TOOL)

- [x] **TOOL-01**: pnpm 11 workspace passes `pnpm install` clean from a fresh clone
- [x] **TOOL-02**: Biome 2 lints + formats all packages via one root command (`pnpm lint`)
- [x] **TOOL-03**: Vitest 4 workspace runs all package tests via `pnpm test`
- [x] **TOOL-04**: tsup 8 builds every package to `dist/` with esm + cjs + `.d.ts` outputs
- [x] **TOOL-05**: Turborepo 2 orchestrates lint/test/build with proper caching
- [x] **TOOL-06**: GitHub Actions CI runs lint + test + build + license-check on every PR
- [x] **TOOL-07**: Changesets gate enforces `0.x.y` versioning until publish flag flipped
- [x] **TOOL-08**: CI grep check fails if `@arc/core` or `@weave/react` imports anything from `next/*`
- [ ] **TOOL-09**: ADR-0001 through ADR-0008 committed to `Documentation/Architecture/` (versioning, Next 16 + Gutenberg independence, license policy, cache tag taxonomy, page-config JSON shape, cart-token cookie, webhook auth, npm scope)
- [x] **TOOL-10**: License-allowlist CI gate via `pnpm licenses list` (MIT, Apache-2.0, ISC, BSD only)

### Arc Core — WC Store API Client (ARC-API)

- [x] **ARC-API-01**: `WooClient` fetch wrapper handles Cart-Token lifecycle (reads response header, persists, replays on subsequent calls)
- [x] **ARC-API-02**: `WooClient` handles Nonce lifecycle and auto-refreshes on `rest_cookie_invalid_nonce` errors
- [ ] **ARC-API-03**: `WooClient` normalizes error responses into a single `ArcError` discriminated union
- [x] **ARC-API-04**: Cart module: `getCart`, `addItem`, `updateItem`, `removeItem`, `applyCoupon`, `removeCoupon`
- [ ] **ARC-API-05**: Checkout module: `submitCheckout(payment_data)` accepts gateway-tokenized payloads; `getCheckoutSchema`
- [ ] **ARC-API-06**: Customer module: `getCustomer`, `updateCustomer`, address CRUD, order list
- [ ] **ARC-API-07**: Orders module: `getOrder`, `listCustomerOrders` with pagination
- [x] **ARC-API-08**: Hand-authored TypeScript types for every Store API surface, with Vitest contract tests against `wp-env`

### Arc Core — WPGraphQL Client (ARC-GQL)

- [ ] **ARC-GQL-01**: `graphql-request` client wired to `/graphql` with auth header passthrough
- [ ] **ARC-GQL-02**: `@graphql-codegen/cli` produces typed query hooks from WPGraphQL schema introspection
- [ ] **ARC-GQL-03**: Products module: `getProduct(slug)`, `getProducts(filter)`, variation matrix helper
- [ ] **ARC-GQL-04**: Two fragments per resource — `ProductListFields` (no variations) and `ProductDetailFields` (full)
- [ ] **ARC-GQL-05**: Collections module: `getCollection(slug)`, category tree traversal
- [ ] **ARC-GQL-06**: Search module: `searchProducts(query, facets)`, facet helpers
- [ ] **ARC-GQL-07**: Vitest perf budget: any documented query <500ms against seeded `wp-env` fixture

### Arc Core — React Hooks (ARC-HOOK)

- [ ] **ARC-HOOK-01**: `useCart()` — reactive cart state with optimistic mutations
- [ ] **ARC-HOOK-02**: `useProduct(slug)` — single product with variation state
- [ ] **ARC-HOOK-03**: `useCollection(slug)` — collection with pagination
- [ ] **ARC-HOOK-04**: `useCustomer()` — current customer + address management
- [ ] **ARC-HOOK-05**: `useSearch(query)` — debounced search with facet state

### Arc Next — Next.js 16 Adapter (ARC-NEXT)

- [ ] **ARC-NEXT-01**: Hydrogen-style loader factory consumable from App Router pages
- [ ] **ARC-NEXT-02**: `arc_cart_token` cookie bridge (HttpOnly, SameSite=None+Secure) ties Cart-Token to Next session
- [ ] **ARC-NEXT-03**: Server Actions for every cart mutation (`addItem`, `updateItem`, `removeItem`)
- [ ] **ARC-NEXT-04**: `'use cache'` + `cacheTag` helpers emit tags from the ADR-0004 taxonomy
- [ ] **ARC-NEXT-05**: Revalidate route handler factory consumes WP webhook payloads and calls `revalidateTag`
- [ ] **ARC-NEXT-06**: ISR config exports for product, collection, and page-config routes
- [ ] **ARC-NEXT-07**: `useOptimistic` cart pattern documented and exported as helper

### Weave React — Section Schema SDK (WEAVE-SDK)

- [ ] **WEAVE-SDK-01**: `WeaveComponentSchema<TProps>` generic type enforces `inputs[].name: keyof TProps` at compile time
- [ ] **WEAVE-SDK-02**: `defineSection<TProps>(component, schema)` helper with dev-mode drift warning
- [ ] **WEAVE-SDK-03**: Module-scoped section registry as plain `Map` (works in Server Components)
- [ ] **WEAVE-SDK-04**: `<SectionRenderer>` resolves registry entry and renders with validated props
- [ ] **WEAVE-SDK-05**: ~15 input types: text, richtext, number, toggle, select, color, image, url, product-picker, collection-picker, repeater, range, datetime, code, markdown
- [ ] **WEAVE-SDK-06**: Inspector groups: tabbed groups + conditional visibility
- [ ] **WEAVE-SDK-07**: Zod-derived runtime validation for incoming section data
- [ ] **WEAVE-SDK-08**: Default values from schema applied when section data is partial
- [ ] **WEAVE-SDK-09**: Section error boundaries isolate one broken section from the page

### Weave WordPress Plugin (WEAVE-WP)

- [ ] **WEAVE-WP-01**: `weave_page` custom post type registered with JSON content body
- [ ] **WEAVE-WP-02**: `/wp-json/weave/v1/pages/{slug}` GET + PUT endpoints
- [ ] **WEAVE-WP-03**: `/wp-json/weave/v1/sections` POST + DELETE endpoints
- [ ] **WEAVE-WP-04**: Explicit `permission_callback` on every REST route, enforced via wrapper
- [ ] **WEAVE-WP-05**: PHPUnit test asserts 401/403 for every route called unauthenticated
- [ ] **WEAVE-WP-06**: Outbound webhook on `save_post_weave_page` POSTs to configured Next revalidate URL with HMAC signature
- [ ] **WEAVE-WP-07**: WP Admin React sidebar bundles via `@wordpress/scripts` — section list + add/remove/reorder + per-section form from schema
- [ ] **WEAVE-WP-08**: WP Media Library picker integrated for `image` input type
- [ ] **WEAVE-WP-09**: GitHub Actions CI matrix: PHP 8.1–8.4 × WP latest + LTS × WC latest + WC-1

### Weave Next — Next.js Sections Renderer (WEAVE-NEXT)

- [ ] **WEAVE-NEXT-01**: `loadPageConfig(slug)` server function fetches + caches with `weave:page:{slug}` tag
- [ ] **WEAVE-NEXT-02**: `<WeavePage slug>` server component renders all configured sections in order
- [ ] **WEAVE-NEXT-03**: Draft-mode route (`/api/weave-preview`) bypasses cache and renders draft config
- [ ] **WEAVE-NEXT-04**: Revalidate route handler factory wired to WP webhook → `revalidateTag('weave:page:{slug}')`

### Arc Pilot — Canonical Reference Starter (PILOT)

- [ ] **PILOT-01**: Next 16 + React 19 app with home, PLP, PDP, cart, checkout, account, search pages
- [ ] **PILOT-02**: 5–7 Weave sections registered (hero, feature grid, product showcase, testimonial, CTA, image+text, newsletter)
- [ ] **PILOT-03**: `@arc/payment-stripe` Stripe Payment Intents adapter implements the gateway interface
- [ ] **PILOT-04**: `Scripts/docker-compose.yml` boots WP + WC + WPGraphQL + Weave plugin locally
- [ ] **PILOT-05**: Lighthouse CI budget: Performance ≥90, Accessibility ≥95 on home/PLP/PDP
- [ ] **PILOT-06**: Playwright multi-tab E2E verifies Cart-Token persistence (add in tab A, see in tab B)
- [ ] **PILOT-07**: Playwright Stripe + PayPal sandbox checkout E2E completes with 3DS redirect

### Templates & Docs (DOCS)

- [ ] **DOCS-01**: `Templates/Arc-Commerce` opinionated Pilot fork (general e-commerce)
- [ ] **DOCS-02**: `Templates/Arc-Golf` opinionated Pilot fork derived from LOFT (sporting-goods vertical)
- [ ] **DOCS-03**: Public docs site (TypeDoc auto-generated API reference + handwritten guides)
- [ ] **DOCS-04**: `npx create-arc-app` scaffolds a working store in <5 minutes
- [ ] **DOCS-05**: README and CONTRIBUTING in every package
- [ ] **DOCS-06**: ADR index page on docs site lists ADR-0001..n with status

### Customer Zero Validation (LOFT)

- [ ] **LOFT-01**: LOFT Pro Shop (`D:\09. LOFT Pro Shop\loft-pro-shop\`) consumes Arc + Weave via `file:` references
- [ ] **LOFT-02**: LOFT site renders home/PLP/PDP/cart/checkout against real WP/WC backend
- [ ] **LOFT-03**: LOFT runs in production for ≥90 days before any package hits `1.0.0`

---

## v2 Requirements

Tracked, not in current roadmap. Move to v1 only after Customer Zero validation.

### Weave Studio (STUDIO)

- **STUDIO-01**: Drag-and-drop section editor with live iframe preview
- **STUDIO-02**: Multi-user concurrent editing
- **STUDIO-03**: Revision history with diff + revert
- **STUDIO-04**: Hosted SaaS tiers ($29/$79 per site, $199 agency)
- **STUDIO-05**: AI section generation from prompt

### Additional Payment Adapters (PAY)

- **PAY-01**: `@arc/payment-paypal`
- **PAY-02**: `@arc/payment-mollie`
- **PAY-03**: `@arc/payment-adyen`

### Internationalization (I18N)

- **I18N-01**: WPML pass-through helpers
- **I18N-02**: Polylang pass-through helpers
- **I18N-03**: Multilingual page-config storage strategy

### Search Adapters (SEARCH)

- **SEARCH-01**: Algolia adapter
- **SEARCH-02**: Typesense adapter

### Framework Adapters (ADAPT)

- **ADAPT-01**: `@arc/remix`
- **ADAPT-02**: `@arc/astro`

---

## Out of Scope

Explicitly excluded for v1 to prevent scope creep.

| Feature | Reason |
|---------|--------|
| CoCart integration | Replaced by WC Store API v1 — no advantage at this scale, adds paid dep |
| Hosted-checkout flow | WC requires inline gateway elements; documented in ADR/architecture |
| Pre-React-19 / pre-Next-15 support | React peer is `>=19`; no back-compat shims, no `useEffect` workarounds |
| Non-Next.js framework adapters in v1 | Focus on one reference framework before fragmenting |
| Gutenberg integration | Weave owns its data model and editor — never a Gutenberg block sink (ADR-0002) |
| Proprietary code in `Arc/` or `Templates/` | MIT only; monetization is in Studio (v2) |
| LOFT Pro Shop client code in this repo | Lives in its own private repo forever — `file:` references only |
| Weave Studio SaaS in v1 | Explicitly v2; free WP Admin editor ships in v1 to drive plugin adoption |
| Live iframe preview in v1 editor | WP Admin sidebar is form-only in v1; live preview ships with Studio v2 |
| AI page generation | v2 Studio feature |
| GraphQL cart/checkout mutations | WPGraphQL for WC has cart mutations but Store API is the documented production path |
| Multilingual page-config storage | v2 — needs WPML/Polylang/custom decision |
| WordPress.com hosting support | Self-hosted WordPress only for v1 |
| Premature 1.0.0 release | Versioning policy ADR-0001 — `0.x.y` until LOFT prod 90d + 1 external community site |

---

## Traceability

Every v1 requirement maps to exactly one phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TOOL-01 | Phase 0 | Complete |
| TOOL-02 | Phase 0 | Complete |
| TOOL-03 | Phase 0 | Complete |
| TOOL-04 | Phase 0 | Complete |
| TOOL-05 | Phase 0 | Complete |
| TOOL-06 | Phase 0 | Complete |
| TOOL-07 | Phase 0 | Complete |
| TOOL-08 | Phase 0 | Complete |
| TOOL-09 | Phase 0 | Pending |
| TOOL-10 | Phase 0 | Complete |
| ARC-API-01 | Phase 1 | Complete — 01-01 |
| ARC-API-02 | Phase 1 | Complete — 01-01 |
| ARC-API-03 | Phase 1 | Pending |
| ARC-API-04 | Phase 1 | Complete |
| ARC-API-05 | Phase 1 | Pending |
| ARC-API-06 | Phase 1 | Pending |
| ARC-API-07 | Phase 1 | Pending |
| ARC-API-08 | Phase 1 | Complete |
| ARC-GQL-01 | Phase 1 | Pending |
| ARC-GQL-02 | Phase 1 | Pending |
| ARC-GQL-03 | Phase 1 | Pending |
| ARC-GQL-04 | Phase 1 | Pending |
| ARC-GQL-05 | Phase 1 | Pending |
| ARC-GQL-06 | Phase 1 | Pending |
| ARC-GQL-07 | Phase 1 | Pending |
| ARC-HOOK-01 | Phase 1 | Pending |
| ARC-HOOK-02 | Phase 1 | Pending |
| ARC-HOOK-03 | Phase 1 | Pending |
| ARC-HOOK-04 | Phase 1 | Pending |
| ARC-HOOK-05 | Phase 1 | Pending |
| ARC-NEXT-01 | Phase 2 | Pending |
| ARC-NEXT-02 | Phase 2 | Pending |
| ARC-NEXT-03 | Phase 2 | Pending |
| ARC-NEXT-04 | Phase 2 | Pending |
| ARC-NEXT-05 | Phase 2 | Pending |
| ARC-NEXT-06 | Phase 2 | Pending |
| ARC-NEXT-07 | Phase 2 | Pending |
| WEAVE-SDK-01 | Phase 3 | Pending |
| WEAVE-SDK-02 | Phase 3 | Pending |
| WEAVE-SDK-03 | Phase 3 | Pending |
| WEAVE-SDK-04 | Phase 3 | Pending |
| WEAVE-SDK-05 | Phase 3 | Pending |
| WEAVE-SDK-06 | Phase 3 | Pending |
| WEAVE-SDK-07 | Phase 3 | Pending |
| WEAVE-SDK-08 | Phase 3 | Pending |
| WEAVE-SDK-09 | Phase 3 | Pending |
| WEAVE-WP-01 | Phase 4a | Pending |
| WEAVE-WP-02 | Phase 4a | Pending |
| WEAVE-WP-03 | Phase 4a | Pending |
| WEAVE-WP-04 | Phase 4a | Pending |
| WEAVE-WP-05 | Phase 4a | Pending |
| WEAVE-WP-06 | Phase 4a | Pending |
| WEAVE-WP-07 | Phase 4b | Pending |
| WEAVE-WP-08 | Phase 4b | Pending |
| WEAVE-WP-09 | Phase 4a | Pending |
| WEAVE-NEXT-01 | Phase 4b | Pending |
| WEAVE-NEXT-02 | Phase 4b | Pending |
| WEAVE-NEXT-03 | Phase 4b | Pending |
| WEAVE-NEXT-04 | Phase 4b | Pending |
| PILOT-01 | Phase 5 | Pending |
| PILOT-02 | Phase 5 | Pending |
| PILOT-03 | Phase 5 | Pending |
| PILOT-04 | Phase 5 | Pending |
| PILOT-05 | Phase 5 | Pending |
| PILOT-06 | Phase 5 | Pending |
| PILOT-07 | Phase 5 | Pending |
| DOCS-01 | Phase 6 | Pending |
| DOCS-02 | Phase 6 | Pending |
| DOCS-03 | Phase 6 | Pending |
| DOCS-04 | Phase 6 | Pending |
| DOCS-05 | Phase 6 | Pending |
| DOCS-06 | Phase 6 | Pending |
| LOFT-01 | Phase 5 | Pending |
| LOFT-02 | Phase 5 | Pending |
| LOFT-03 | Phase 6 | Pending |

**Coverage targets:**
- v1 requirements: 75 total
- Mapped to phases: 75 ✓
- Unmapped: 0

---

*Requirements defined: 2026-05-28*
*Last updated: 2026-05-28 after roadmap creation (traceability populated)*
