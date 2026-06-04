# E2E — Requirement traceability & expansion template

Use this table when adding tests for new phases. Each row should eventually have **Unit**, **Contract**, and **E2E** columns filled or explicitly `N/A` with reason.

**Legend:** ✅ implemented · 🟡 planned · ⬜ not started · — not applicable

---

## Wave 0 — Platform health (minimal-app)

| Req ID | Journey / check | Unit | Contract | E2E | Priority wave |
|--------|-----------------|------|----------|-----|---------------|
| — | WP REST, GraphQL, Store API cart, Next home | — | — | ✅ | 0 |

## Wave 1 — Integration spine (minimal-app)

| Req ID | Journey / check | Unit | Contract | E2E | Priority wave |
|--------|-----------------|------|----------|-----|---------------|
| ARC-NEXT-05 | HMAC POST `/api/revalidate` → fresh PDP | ✅ | ✅ | ✅ | 1 |
| — | Unsigned webhook → 401 | ✅ | — | ✅ | 1 |

Spec: `e2e/integration/revalidate.spec.ts` (`@integration`, not in PR smoke grep).

---

## Phase 0–2 — Arc storefront core

| Req ID | Journey / check | Unit | Contract | E2E | Priority wave |
|--------|-----------------|------|----------|-----|---------------|
| ARC-NEXT-02 | `arc_cart_token` cookie flags + replay | ✅ | ✅ | ✅ | 3 |
| ARC-NEXT-03 | Server Actions add/update/remove | ✅ | ✅ | ✅ | 3 |
| ARC-NEXT-05 | Webhook → revalidate → fresh PDP | ✅ | ✅ | ✅ | 1 |
| ARC-NEXT-07 | Optimistic cart rollback on error | ✅ | — | ✅ | 3 |
| ARC-GQL-03 | PDP renders product by slug (SSR title) | ✅ | ✅ | ✅ | 2 |
| ARC-GQL-04 | PLP grid lists products with PDP links | — | ✅ | ✅ | 2 |
| ARC-GQL-05 | Collection page lists category products | — | ✅ | ✅ | 2 |
| ARC-GQL-06 | Search route returns matching products | — | ✅ | ✅ | 2 |

Specs: `e2e/catalog/pdp.spec.ts`, `plp.spec.ts`, `collection.spec.ts`, `search.spec.ts` (`@regression`).

| ARC-API-04 | Cart mutations | ✅ | ✅ | ✅ | 3 |

Specs: `e2e/cart/optimistic.spec.ts`, `e2e/cart/cookie.spec.ts` (`@regression`).

Spec: `e2e/weave/render.spec.ts` (`@regression`) — seeds `e2e-weave-render` via `weave/v1` PUT, asserts `/weave/[slug]` section order.

---

## Phase 3 — Weave SDK

| Req ID | Journey / check | Unit | Contract | E2E | Priority wave |
|--------|-----------------|------|----------|-----|---------------|
| WEAVE-SDK-04 | SectionRenderer 5-section page | ✅ | — | ✅ | 4 |
| WEAVE-SDK-05 | 15 input types render with defaults | ✅ | — | ✅ | 5 |

Spec: `e2e/weave/input-matrix.spec.ts` (`@regression`) — static fixture `/e2e-fixtures/weave-inputs`; optional REST seed via `buildWeaveInputMatrixPageConfig()` + slug `e2e-weave-inputs`.
| WEAVE-SDK-09 | Broken section isolated (error boundary) | ✅ | — | ✅ | 5 |

Spec: `e2e/weave/error-boundary.spec.ts` (`@regression`) — static fixture `/e2e-fixtures/weave-errors` with unknown section type; render-throw covered in `@weave/react` unit tests.

---

## Wave 6 — Checkout + payments (minimal-app)

| Req ID | Journey / check | Unit | Contract | E2E | Priority wave |
|--------|-----------------|------|----------|-----|---------------|
| ARC-API-05 | GET `/checkout` draft after cart add | ✅ | ✅ | ✅ | 6 |
| — | `/checkout` page: summary + WC handoff CTA | — | — | ✅ | 6 |
| PILOT-03 | Stripe Payment Intents sandbox checkout | — | — | ⬜ | 6 |

Specs: `e2e/checkout/flow.spec.ts`, `e2e/checkout/api-contract.spec.ts` (`@regression`).  
`e2e/checkout/payment-sandbox.spec.ts` (`@payment`) — env-gated stub only; no Stripe Elements in minimal-app (deferred to Pilot/staging).

**Partial notes (v0.1):** Headless UI is cart review + link to native WooCommerce checkout (`Design-Systems/Arc-Design/references/COMMERCE.md`). No embedded Stripe Elements in minimal-app; `submitCheckout` POST remains contract/E2E for Pilot.

---

## Wave 7 — Account (minimal-app)

| Req ID | Journey / check | Unit | Contract | E2E | Priority wave |
|--------|-----------------|------|----------|-----|---------------|
| — | `getCustomer` session billing/shipping on `/account` | ✅ | ✅ | ✅ | 7 |
| — | `POST /cart/update-customer` → `/account` shows addresses | ✅ | ✅ | ✅ | 7 |
| ADR-0009 | `getCustomerOrders` with JWT on `/account/orders` | ✅ | ✅ (skip) | 🟡 | 7 |
| — | Login / logout / cookie bridge | — | — | ⬜ | 7 |

Specs: `e2e/account/session.spec.ts`, `e2e/account/addresses.spec.ts`, `e2e/account/orders.spec.ts` (`@regression`).  
**Never PR gate** on `TEST_JWT_TOKEN` — orders specs call `test.skip` when unset (JWT plugin not in default wp-env).

**Partial notes (v0.1):** Full customer auth deferred per [ADR-0009](../Architecture/ADR-0009.md). Session scope uses Cart-Token + `getCustomer()`; order history needs `TEST_JWT_TOKEN` from wp-graphql-jwt-authentication spike. No login UI in minimal-app.

---

## Wave 8 — WP Admin editor (scaffold)

| Req ID | Journey / check | E2E | Priority wave |
|--------|-----------------|-----|---------------|
| WEAVE-WP-07 | list / reorder / save smoke | 🟡 | 8 |

Scaffold: `Weave/WordPress/e2e/admin-sidebar.quarantine.spec.ts` (`@quarantine`, skipped). Config: `Weave/WordPress/playwright.config.cjs`. **Blocked:** no production sidebar UI in `admin/src/` (Wave 8 / Phase 4b).

---

## Wave 9 — Visual regression

| Route | E2E | Priority wave |
|-------|-----|---------------|
| home, PLP, PDP, checkout-empty, weave-input-matrix | ✅ | 9 |

Spec: `e2e/visual/routes.spec.ts` (`@visual`). Baselines: `e2e/snapshots/{platform}/` (`win32` on Windows, `linux` in CI) — generate with `pnpm test:e2e:update-snapshots` after `pnpm wp:setup` + build.

---

## Wave 10 — Accessibility

| Rule | E2E | Priority wave |
|------|-----|---------------|
| A11Y-NO-CRITICAL (axe) | ✅ | 10 |
| Keyboard reach checkout CTA | ✅ | 10 |

Spec: `e2e/a11y/routes.spec.ts` (`@a11y`). Helper: `Scripts/e2e-shared/a11y.ts`.

---

## Wave 11 — Performance

| Check | E2E | Priority wave |
|-------|-----|---------------|
| Navigation timing budgets (home, PLP, PDP) | ✅ | 11 |

Spec: `e2e/perf/routes.spec.ts` (`@perf`). Lighthouse (PILOT-06) deferred.

---

## Phase 4a — WordPress plugin

| Req ID | Journey / check | Unit | Contract | E2E | Priority wave |
|--------|-----------------|------|----------|-----|---------------|
| WEAVE-WP-02 | REST GET/PUT page by slug | — | ✅ PHPUnit | 🟡 | 1 |
| WEAVE-WP-06 | Save post → HMAC webhook | — | ✅ PHPUnit | 🟡 | 1 |
| WEAVE-WP-05 | Unauthenticated REST → 401/403 | — | ✅ PHPUnit | — | — |

---

## Phase 4b — Admin + Weave Next (when built)

| Req ID | Journey / check | Unit | Contract | E2E | Priority wave |
|--------|-----------------|------|----------|-----|---------------|
| WEAVE-WP-07 | Admin sidebar add/reorder/save | — | — | 🟡 | 8 |
| WEAVE-WP-08 | Media picker for image input | — | — | ⬜ | 8 |
| WEAVE-NEXT-01 | `loadPageConfig` cached tag | ✅ | — | ✅ | 4 |
| WEAVE-NEXT-03 | Draft preview bypasses cache | — | — | ⬜ | 8 |
| WEAVE-NEXT-04 | WP webhook → `weave:page:{slug}` | — | ✅ | ⬜ | 1 |

---

## Phase 5+ — Pilot (placeholder)

| Req ID | Journey / check | E2E |
|--------|-----------------|-----|
| PILOT-01 | Full route map: home, PLP, PDP, cart, checkout, account, search | 🟡 |
| PILOT-02 | 5–7 Weave sections on home | ⬜ |
| PILOT-03 | Stripe Payment Intents sandbox checkout | ⬜ |
| PILOT-05 | Multi-tab cart sync | ⬜ |
| PILOT-06 | Lighthouse ≥ 90 perf, ≥ 95 a11y | ⬜ |

---

## Adding a new test (checklist)

1. Map to a **REQUIREMENTS.md** ID (or add a new ID in planning first).
2. Choose **wave** from [TESTING.md](./TESTING.md#e2e-priority-order-implement-in-this-sequence).
3. Implement at lowest sufficient layer; add E2E only if user-visible or cross-system.
4. Tag Playwright: `@smoke` | `@regression` | `@quarantine` | `@visual` | `@a11y` | `@perf` | `@payment`.
5. Update this table and run report schema ticket fields (`requirementIds`).
