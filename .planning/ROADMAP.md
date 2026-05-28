# Arc + Weave Platform — Roadmap

**Created:** 2026-05-28
**Granularity:** fine
**Phases:** 8 (0, 1, 2, 3, 4a, 4b, 5, 6) — Phase 4 split into independent parallel tracks
**Coverage:** 75/75 v1 requirements mapped

---

## Phases

- [ ] **Phase 0: Tooling & Foundations** — pnpm/Turbo/Biome/Vitest/tsup/Changesets/CI + 8 locked ADRs
- [ ] **Phase 1: `@arc/core`** — `WooClient` (Cart-Token + Nonce), Store API + WPGraphQL clients, framework-agnostic React 19 hooks
- [ ] **Phase 2: `@arc/next`** — App Router loaders, Server Actions, cart-token cookie bridge, `'use cache'` + cacheTag helpers, revalidate webhook
- [ ] **Phase 3: `@weave/react`** — `WeaveComponentSchema<TProps>` generic, `defineSection`, registry, `<SectionRenderer>`, 15 input types, Zod validation
- [ ] **Phase 4a: Weave WordPress Plugin (storage + REST)** — `weave_page` CPT, REST routes with explicit `permission_callback`, outbound revalidation webhook, PHP × WP × WC CI matrix [parallel: phase-1]
- [ ] **Phase 4b: `@weave/next` + WP Admin Editor** — page-config loader, draft mode, revalidate handler, WP Admin React sidebar with media picker
- [ ] **Phase 5: `Arc/Pilot` Canonical Starter** — full Next 16 storefront, `@arc/payment-stripe`, docker-compose, Lighthouse + multi-tab + Stripe/PayPal E2E
- [ ] **Phase 6: Templates + Docs Site + Customer Zero** — `Arc-Commerce`, `Arc-Golf`, public docs site, `create-arc-app`, LOFT 90-day production validation

---

## Phase Details

### Phase 0: Tooling & Foundations
**Goal**: A new contributor can clone the repo, run `pnpm install`, and have lint/test/build/CI working out of the box — and the eight architecture decisions every downstream package depends on are locked.
**Depends on**: Nothing (foundation phase)
**Requirements**: TOOL-01, TOOL-02, TOOL-03, TOOL-04, TOOL-05, TOOL-06, TOOL-07, TOOL-08, TOOL-09, TOOL-10
**Success Criteria** (what must be TRUE):
  1. A new contributor can clone, run `pnpm install`, and `pnpm test` passes within 5 minutes on a clean machine.
  2. `pnpm lint`, `pnpm test`, `pnpm build` all run via Turborepo with cache hits on second invocation.
  3. CI on every PR runs lint + test + build + license-allowlist check and fails on the first non-permissive license in the dep graph.
  4. CI grep gate fails any PR that imports `next/*` from `@arc/core` or `@weave/react` source files.
  5. ADR-0001 through ADR-0008 are committed to `Documentation/Architecture/` and resolve the eight decisions downstream packages will code against (versioning, Next 16 + Gutenberg independence, license policy, cache tag taxonomy, page-config JSON shape, cart-token cookie, webhook auth, npm scope).
**Plans**: TBD

### Phase 1: `@arc/core`
**Goal**: A developer importing `@arc/core` can call every WC Store API and WPGraphQL surface — cart, checkout, customer, orders, products, collections, search — with typed responses and transparent Cart-Token + Nonce session handling. Built as a pre-step (`WooClient`) plus a 6-agent parallel swarm + 2 follow-on agents (types reconciliation, hooks).
**Depends on**: Phase 0
**Requirements**: ARC-API-01, ARC-API-02, ARC-API-03, ARC-API-04, ARC-API-05, ARC-API-06, ARC-API-07, ARC-API-08, ARC-GQL-01, ARC-GQL-02, ARC-GQL-03, ARC-GQL-04, ARC-GQL-05, ARC-GQL-06, ARC-GQL-07, ARC-HOOK-01, ARC-HOOK-02, ARC-HOOK-03, ARC-HOOK-04, ARC-HOOK-05
**Success Criteria** (what must be TRUE):
  1. Multi-tab Vitest E2E confirms the same cart appears across two `WooClient` instances on the same Cart-Token (token persisted from response header, replayed on every subsequent call).
  2. A `rest_cookie_invalid_nonce` response auto-refreshes the nonce and retries exactly once without surfacing the failure to the caller.
  3. Any documented WPGraphQL query in `@arc/core` resolves in <500ms against a seeded `wp-env` fixture (perf budget enforced in CI).
  4. `useCart`, `useProduct`, `useCollection`, `useCustomer`, `useSearch` import in a plain Vite test app with zero `next/*` symbols pulled into the bundle.
  5. Every WC Store API surface has hand-authored TypeScript types validated by Vitest contract tests against a live `wp-env`.
**Plans**: TBD

### Phase 2: `@arc/next`
**Goal**: A Next.js 16 App Router developer can compose a working storefront route in a single file by importing a Hydrogen-style loader, dropping a Server Action into a Client Component, and adding a `'use cache'` + `cacheTag` helper — with cart state surviving across requests via an HttpOnly cookie bridge.
**Depends on**: Phase 1
**Requirements**: ARC-NEXT-01, ARC-NEXT-02, ARC-NEXT-03, ARC-NEXT-04, ARC-NEXT-05, ARC-NEXT-06, ARC-NEXT-07
**Success Criteria** (what must be TRUE):
  1. A demo PDP route consumes a single loader function and renders product data fetched server-side with `'use cache'` + a tag from the ADR-0004 taxonomy.
  2. Adding an item via a Server Action sets the `arc_cart_token` cookie (HttpOnly, SameSite=None, Secure) on first response and replays it on subsequent navigations.
  3. Posting a WP webhook payload to the revalidate route handler triggers `revalidateTag` for the matching tag, and the next page load returns fresh data without TTL wait.
  4. A `useOptimisticCart` example component shows the cart count updating before the Server Action round-trip completes, with rollback on error.
  5. ISR config exports for product, collection, and page-config routes are documented and consumed by Pilot without additional configuration.
**Plans**: TBD
**UI hint**: yes

### Phase 3: `@weave/react`
**Goal**: A developer can author a section as a React component co-located with a fully typed `WeaveComponentSchema<TProps>` export, register it once, and render any page configuration through `<SectionRenderer>` with compile-time guarantees that every schema field matches a component prop.
**Depends on**: Phase 0 (runs in parallel with Phase 2)
**Requirements**: WEAVE-SDK-01, WEAVE-SDK-02, WEAVE-SDK-03, WEAVE-SDK-04, WEAVE-SDK-05, WEAVE-SDK-06, WEAVE-SDK-07, WEAVE-SDK-08, WEAVE-SDK-09
**Success Criteria** (what must be TRUE):
  1. Declaring a schema input whose `name` is not `keyof TProps` produces a TypeScript compile error.
  2. `defineSection<TProps>` emits a dev-mode console warning the first time a component prop is rendered that has no matching schema field (or vice versa).
  3. `<SectionRenderer>` renders a page of 5 sections from a registry initialized only via module-scope side-effect imports — works in a Server Component test.
  4. A malformed section payload is caught by Zod validation and rendered as a single-section error boundary that does not crash the page.
  5. All 15 input types (text, richtext, number, toggle, select, color, image, url, product-picker, collection-picker, repeater, range, datetime, code, markdown) render with their declared default values when section data is partial.
**Plans**: TBD
**UI hint**: yes

### Phase 4a: Weave WordPress Plugin — Storage + REST
**Goal**: A WordPress admin can install the Weave plugin, create a `weave_page` post, and have its JSON content readable + writable via authenticated REST endpoints — with an outbound webhook firing to a configured Next.js URL on save. Runs in parallel with Phase 1; REST contract locked by ADR-0005 in Phase 0.
**Depends on**: Phase 0 (parallel with Phase 1)
**Requirements**: WEAVE-WP-01, WEAVE-WP-02, WEAVE-WP-03, WEAVE-WP-04, WEAVE-WP-05, WEAVE-WP-06, WEAVE-WP-09
**Success Criteria** (what must be TRUE):
  1. Activating the plugin registers the `weave_page` custom post type with JSON content storage visible in WP Admin's posts list.
  2. `GET /wp-json/weave/v1/pages/{slug}` returns the stored page config; `PUT` updates it; `POST /sections` and `DELETE /sections/{id}` mutate section state.
  3. Every registered REST route has an explicit `permission_callback` (enforced via wrapper); a PHPUnit test calls every route unauthenticated and asserts 401/403.
  4. Saving a `weave_page` post fires an HMAC-signed POST to the configured Next revalidate URL within 1 second.
  5. The GitHub Actions matrix passes on PHP 8.1–8.4 × WP latest + LTS × WC latest + WC-1.
**Plans**: TBD

### Phase 4b: `@weave/next` + WP Admin Editor
**Goal**: A non-developer site editor can open the WP Admin sidebar, add/remove/reorder sections via form inputs driven by each section's schema, pick a hero image from the WP Media Library, hit save — and see the live storefront update within seconds via tag revalidation. Three sub-agents: (i) `loadPageConfig` + revalidate handler; (ii) draft-mode preview route; (iii) WP Admin React sidebar.
**Depends on**: Phase 3, Phase 4a (REST stub returning real JSON)
**Requirements**: WEAVE-WP-07, WEAVE-WP-08, WEAVE-NEXT-01, WEAVE-NEXT-02, WEAVE-NEXT-03, WEAVE-NEXT-04
**Success Criteria** (what must be TRUE):
  1. `<WeavePage slug="home">` server component fetches via `loadPageConfig`, renders all sections in order, and is cached under tag `weave:page:home`.
  2. Hitting the `/api/weave-preview?slug=...&token=...` route enables draft mode and renders the unsaved revision bypassing the cache.
  3. A WP webhook POST to the revalidate handler triggers `revalidateTag('weave:page:{slug}')` and the next storefront request returns the updated config.
  4. The WP Admin sidebar lists registered sections, supports add/remove/reorder, and renders a per-section form derived from each schema's input declarations.
  5. The `image` input launches the WP Media Library picker and stores the selected attachment URL + ID in the section data.
**Plans**: TBD
**UI hint**: yes

### Phase 5: `Arc/Pilot` Canonical Starter
**Goal**: A new developer running `docker compose up` followed by `pnpm dev` against the Pilot starter has a working Next 16 storefront — home, PLP, PDP, cart, checkout, account, search — driven entirely by `@arc/*` + `@weave/*` packages, with 5–7 registered Weave sections, a working Stripe + PayPal sandbox checkout, and CI-enforced Lighthouse + multi-tab cart budgets. This is the integration gate: any API mistake in Phases 1–4 surfaces here before two templates fork from it.
**Depends on**: Phase 2, Phase 4b
**Requirements**: PILOT-01, PILOT-02, PILOT-03, PILOT-04, PILOT-05, PILOT-06, PILOT-07, LOFT-01, LOFT-02
**Success Criteria** (what must be TRUE):
  1. `Scripts/docker-compose.yml` boots WP + WC + WPGraphQL + Weave plugin locally and the Pilot app renders home/PLP/PDP/cart/checkout/account/search against it.
  2. Lighthouse CI run shows Performance ≥90 and Accessibility ≥95 on home, PLP, and PDP routes.
  3. Playwright multi-tab E2E adds an item in tab A and verifies the same Cart-Token-bound cart appears in tab B without re-add.
  4. Playwright Stripe + PayPal sandbox checkout E2E completes a 3DS-redirect purchase and lands on a server-confirmed order-received page (no client-trust of payment_status).
  5. LOFT Pro Shop's separate private repo consumes Arc + Weave via `file:` references and renders home/PLP/PDP/cart/checkout against a real WP/WC backend.
**Plans**: TBD
**UI hint**: yes

### Phase 6: Templates + Docs Site + Customer Zero Validation
**Goal**: An external developer can run `npx create-arc-app` and have a working store live in under 5 minutes, navigate a public docs site with auto-generated API reference and handwritten guides, choose between two vertical-flavored templates (general commerce, sporting goods), and trust that the platform has been running in production at LOFT Pro Shop for at least 90 days before any package crosses the `1.0.0` line. Three parallel agents once Phase 5 API is frozen.
**Depends on**: Phase 5
**Requirements**: DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05, DOCS-06, LOFT-03
**Success Criteria** (what must be TRUE):
  1. `npx create-arc-app my-store` scaffolds a working storefront against a public demo WP host in <5 minutes (timed in CI).
  2. `Templates/Arc-Commerce` and `Templates/Arc-Golf` build, lint, and run their Pilot-derived test suites green from a fresh clone.
  3. Public docs site serves TypeDoc-generated API reference for every exported symbol plus handwritten "Hello WooCommerce" + per-API guides, with an ADR-0001..n index page showing each ADR's status.
  4. Every published package ships a README and CONTRIBUTING.
  5. LOFT Pro Shop has been running in production for ≥90 days before any `@arc/*` or `@weave/*` package is published at `1.0.0`.
**Plans**: TBD
**UI hint**: yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Tooling & Foundations | 8/9 | In Progress|  |
| 1. `@arc/core` | 0/0 | Not started | - |
| 2. `@arc/next` | 0/0 | Not started | - |
| 3. `@weave/react` | 0/0 | Not started | - |
| 4a. Weave WP Plugin (storage + REST) | 0/0 | Not started | - |
| 4b. `@weave/next` + WP Admin Editor | 0/0 | Not started | - |
| 5. `Arc/Pilot` | 0/0 | Not started | - |
| 6. Templates + Docs + LOFT | 0/0 | Not started | - |

---

## Parallelization Plan

| Phase | Can start | Runs parallel with | Hard blockers |
|-------|-----------|--------------------|---------------|
| 0 | Day 1 | — | — |
| 1 | After Phase 0 | Phase 4a | Phase 0 |
| 2 | After Phase 1 | Phase 3 | Phase 1 |
| 3 | After Phase 0 | Phase 2 | Phase 0 |
| 4a | After Phase 0 | Phase 1 | Phase 0 (ADR-0005 page-config shape) |
| 4b | After Phase 3 + 4a stub | — | Phase 3 (schema types), Phase 4a (REST endpoints returning real JSON) |
| 5 | After Phase 2 + 4b | — | Phase 2, Phase 4b |
| 6 | After Phase 5 API freeze | — | Phase 5 |

**Net elapsed phases:** ~5 critical-path waves (Phase 0 → Phase 1 ∥ Phase 4a → Phase 2 ∥ Phase 3 → Phase 4b → Phase 5 → Phase 6) versus 8 sequential.

---

*Roadmap created: 2026-05-28*
