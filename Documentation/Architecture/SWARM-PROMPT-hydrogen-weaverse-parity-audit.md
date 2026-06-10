# SWARM TASK: Hydrogen + Weaverse Enterprise Parity & Security Audit for Arc/Weave

> **Usage:** Paste the body of this file as the task prompt for a Ruflo swarm.
> **References are already cloned** (read-only) at `references/hydrogen` and
> `references/weaverse` — both are FULLY OPEN SOURCE. Read source first; web is the fallback.

## Mission
You are a coordinated audit swarm. Benchmark **Shopify Hydrogen** (storefront framework)
and **Weaverse** (visual sections editor) against our platform **Arc + Weave**, then
produce an actionable parity + security report. Goal: ensure Arc/Weave reaches the same
enterprise-grade architecture and security posture *before* we continue the build.

### What Arc/Weave is (the thing being benchmarked)
- **Arc** = open-source headless WooCommerce framework. Packages: `@arc/core`, `@arc/next`.
  Hydrogen-equivalent, but WooCommerce instead of Shopify.
- **Weave** = visual sections editor SDK on top of Arc. Packages: `@weave/react`,
  `@weave/next`, plus a WordPress PHP plugin. Weaverse-equivalent.
- Stack: TypeScript strict, pnpm workspaces, Turborepo, tsup, Biome, Vitest,
  **Next.js 16 App Router + React 19**, WC **Store API v1** (cart/checkout),
  **WPGraphQL** (catalog), **Cart-Token** auth (not nonces) for headless.
- WP plugin: PHP 8.1+, custom post type for page configs, REST API, `@wordpress/scripts`
  admin React app. Phase 1 free; Phase 2 becomes multi-tenant SaaS.

### Verified Arc/Weave inventory (confirm by reading; do not take on faith)
This map is pre-verified to save discovery time — but every finding still needs a `file:line`.
- **Arc/Core** (~2,800 LOC) — `src/client/WooClient.ts` (Cart-Token capture/inject, nonce
  refresh, 5xx backoff, AbortSignal timeout), `src/http.ts`, `src/graphql/client.ts`,
  `src/store-api/{cart,checkout,customer,orders}.ts`, `src/store-api/validate.ts` (Zod, warns
  not throws), `src/graphql/{products,collections,search,customer}.ts`, `src/types/errors.ts`.
- **Arc/Next** (~650 LOC) — `src/loaders.ts` (`'use cache'` + `cacheTag` + `cacheLife`),
  `src/cache-tags.ts` (ADR-0004), `src/revalidate.ts` (HMAC-SHA256 + replay window + tag
  allowlist), `src/cookies.ts`, `src/actions.ts`. Reference app: `examples/minimal-app/`
  (cart drawer, account pages, Playwright e2e). **No `unstable_cache`** (verify this holds).
- **Weave/React** (~1,100 LOC) — `src/schema/types.ts` (15 input types, `WeaveComponentSchema`),
  `src/schemas/page-config.ts` (ADR-0005 Zod, `.strict()`), `src/render/SectionRenderer.tsx`
  (RSC-safe, per-section error boundary, never throws), `src/registry/registry.ts`.
- **Weave/Next** (~400 LOC) — `src/load-page-config.ts` (server-only, WP App-Password Basic
  auth, draft-mode bypass, `'use cache'`), `src/revalidate.ts`, `src/weave-page.tsx`.
- **Weave/WordPress** (~1,200 LOC) — `src/class-weave-rest-controller.php` (5 routes, single
  `require_cap()` choke point, 401/403), `src/class-weave-validator.php` (Zod-mirror, rejects
  unknown keys), `src/class-weave-cpt.php`, `src/class-weave-webhook.php` (HMAC + timestamp),
  `admin/src/` (React editor, Zustand store). PHPUnit auth-matrix test: `tests/test-rest-auth.php`.
- **Weave/Studio** — EMPTY scaffold (Phase 5, not built).
- **Multi-tenant isolation** — NO code exists yet anywhere; this is a Phase-2 design gap, not a
  regression. Treat as greenfield requirements, not a "what we have vs Weaverse" diff.

## Evidence rules (STRICT — no hallucination)
1. **Primary evidence = source code.** Both references are cloned and fully open. Read them:
   - **Hydrogen:** `references/hydrogen/packages/` — esp. `hydrogen/` (framework:
     `src/cache/strategies.ts`, `src/cart/`, `src/customer/`, `src/csp/`) and
     `hydrogen-react/` (primitives: `src/Money.tsx`, `src/Image.tsx`, `src/CartProvider.tsx`,
     `src/storefront-client.ts`). Architecture context: `references/hydrogen/CLAUDE.md`, `docs/`.
   - **Weaverse (FULLY OPEN — not closed-source):** `references/weaverse/packages/` — esp.
     `schema/src/index.ts` (1,173-line Zod schema system, the `WeaveComponentSchema` analogue),
     `core/src/core.ts` (singleton + registry), `react/src/` (hooks, renderer, data-connector),
     `hydrogen/src/weaverse-client.ts` (page-config fetch + cache strategy + preview/studio bridge).
     Architecture context: `references/weaverse/ARCHITECTURE.md`, `AGENTS.md`, `MIGRATION.md`,
     `packages/TYPE_SYSTEM_ARCHITECTURE.md`. Note: `@weaverse/next` and `@weaverse/remix` are
     empty `.gitkeep` stubs (future work); Weaverse multi-tenancy is `projectId`-based isolation.
2. **Secondary evidence = web research:** official docs, GitHub repos/issues/releases,
   CVE/security advisory databases (GitHub Advisory, Shopify security bulletins, npm).
3. Every claim in the final deliverables MUST cite its source: `file:line` for source,
   or URL for web. Mark anything inferred as **[INFERENCE]**. No uncited assertions.
4. Compare against Arc/Weave's **actual** code in this repo (`Arc/`, `Weave/`,
   `Design-Systems/`) — read it; do not assume what we have.

## Swarm setup
- Initialize a swarm with **hierarchical topology** (1 coordinator + specialist workers).
- Use shared memory (memory_store / agentdb) so agents post findings under a common
  namespace `audit:hydrogen-parity` and the synthesizer reads them all.
- Run specialists in parallel; gate the synthesis step until all specialists report.

### Agent roster
Spawn these specialists. Each writes structured findings to shared memory before exit.

1. **Architecture Auditor** — Hydrogen core primitives vs Arc.
   Compare: route/loader model, RSC vs Remix loaders, data fetching, streaming/Suspense,
   error boundaries, `<Money>`/`<Image>`/`<Video>` primitives, env/config handling,
   deploy-target agnosticism. Map each to `@arc/core` / `@arc/next` — have / partial / missing.

2. **Cart & Checkout Auditor** — Hydrogen cart vs Arc cart.
   Cart state sync, optimistic UI, cart persistence (cookie/session), checkout handoff,
   line-item mutations, error recovery. Map to Arc's Cart-Token + WC Store API v1 flow
   and the existing cart drawer / cart-session code in this repo.

3. **Caching & Data-Layer Auditor** — Hydrogen caching vs Arc.
   Sub-request caching, cache strategies (CacheLong/Short/None equivalents), tag-based
   revalidation. Map to Arc's Next 16 `'use cache'` + `cacheTag` + `revalidateTag` model.
   Flag any `unstable_cache` usage as a defect.

4. **Security Auditor — Enterprise Parity** (highest priority, deepest pass).
   Cover the FULL enterprise surface AND the headless-commerce-specific surface:
   - **Auth/session:** Cart-Token issuance/rotation/expiry, Store API auth, customer
     account/session security, JWT/cookie handling, CSRF posture for a headless client.
   - **Headless threat surface:** Cart-Token vs nonce tradeoffs, checkout handoff integrity,
     over-fetch/IDOR on cart/order endpoints, GraphQL query-depth/cost abuse.
   - **Web hardening:** CSP / security headers, XSS (esp. rendered page-config content),
     SSRF (server-side fetches to WP/WC), open-redirect, rate limiting, input validation
     (Zod boundaries on Store API responses).
   - **Secrets:** env handling, webhook secret verification (revalidate routes must
     fail-closed), no secrets in repo.
   - **PII:** customer data handling, logging hygiene.
   For each control: what Hydrogen/Shopify does → Arc's current state (cite code) →
   gap + severity (Critical/High/Med/Low) + concrete fix.

5. **Editor & SaaS-Surface Auditor** — Weaverse vs Weave.
   Read **actual Weaverse source** (it's fully open): `schema/src/index.ts`,
   `core/src/core.ts`, `react/src/renderer.tsx` + `data-connector.ts`,
   `hydrogen/src/weaverse-client.ts` (studio/preview bridge, `projectId` isolation). Compare:
   WP REST permission/capability/nonce checks, page-config storage/injection safety, schema
   validation of section configs (`WeaveComponentSchema` vs `@weaverse/schema`), preview/studio
   bridge security, and **multi-tenant isolation** requirements for Phase 2 SaaS (tenant data
   separation, authz boundaries, editor preview sandboxing — Weave has NO multi-tenant code yet,
   so treat as greenfield, informed by Weaverse's `projectId` model). Map to `@weave/react`,
   `@weave/next`, the WP plugin (`Weave/WordPress/src/*.php`).

6. **Supply-Chain Auditor.**
   Dependency pinning/catalogs, build & publish integrity (Changesets, npm provenance),
   WPGraphQL CVE watch (e.g. CVE-2026-33290 class), `@wordpress/scripts` build trust,
   plugin auto-update security, transitive-dep risk. Compare Shopify/Weaverse practices.

7. **Synthesizer / Coordinator** (runs last).
   Read all specialist memory entries, de-duplicate, resolve conflicts, assign final
   priorities, and assemble the four deliverables below.

## Benchmark dimensions (every specialist scores these)
For each capability/control, record: **Hydrogen/Weaverse approach → Arc/Weave current
state (with citation) → status {Have | Partial | Missing} → severity/priority →
recommended action.**

## Deliverables (Synthesizer produces all four)
1. **Gap-Analysis Matrix** — a table:
   `Domain | Capability/Control | Hydrogen/Weaverse | Arc/Weave today | Status | Priority | Evidence`.
   Separate sections for Architecture, Cart/Checkout, Caching, Security, Editor/SaaS, Supply-chain.

2. **Remediation Backlog** — prioritized, sized work items (epics → tasks), sequenced into
   waves/phases. Each item: problem, proposed fix, affected packages, effort (S/M/L),
   priority, dependencies. Ready to drop into the GSD roadmap.

3. **HTML Audit Report** — a single self-contained styled `.html` file using the
   **Trigger Consulting design system** (dark `#1A2332`, AeonikFono headings weight 400,
   electric-blue + neon-rose accents, embedded CSS only, no external assets). Save to
   `Documentation/Architecture/` (public) or `Artifacts/`. Include exec summary, the gap
   matrix, a security findings section with severities, and the remediation roadmap.

4. **ADR Proposals** — draft ADRs (Markdown) for each major decision the audit surfaces
   (e.g. customer-auth strategy, caching model, CSP/header policy, multi-tenant isolation
   for SaaS, supply-chain hardening). Follow existing `Documentation/Architecture/ADR-*.md`
   format. These stay Markdown (structural docs), not HTML.

## Acceptance criteria
- Every finding cites source (`file:line` or URL); inferences flagged **[INFERENCE]**.
- Security section covers all four focus areas: enterprise parity, headless-commerce,
  editor/SaaS, supply-chain — with severity ratings.
- No generic advice: each recommendation names the specific Arc/Weave package and code path.
- Matrix status counts reconcile with the backlog (every Partial/Missing has a backlog item).
- Note explicitly where evidence was unavailable (repo not cloned, doc not found) rather
  than guessing.

## Guardrails
- Read-only on Hydrogen/Weaverse sources. Do not modify Arc/Weave code in this pass —
  this is an audit; output is reports + backlog + draft ADRs only.
- Respect repo conventions in `CLAUDE.md` / `AGENTS.md` (never commit `.documentation/`,
  `.planning/`, secrets, etc.). Place outputs only in `Documentation/Architecture/` or `Artifacts/`.

---

## Pre-run checklist
- [x] Hydrogen cloned → `references/hydrogen` (full open source, 21 MB).
- [x] Weaverse SDK cloned → `references/weaverse` (FULLY open source incl. `@weaverse/schema`,
      `core`, `react`, `hydrogen`; `next`/`remix` are empty stubs).
- [ ] Each auditor reads the relevant architecture doc before diffing source
      (`references/hydrogen/CLAUDE.md`, `references/weaverse/ARCHITECTURE.md` + `AGENTS.md`).
- [ ] Note: Hydrogen and Weaverse are BOTH fully open — security/editor evidence can come from
      real source on both sides. Multi-tenant SaaS isolation is greenfield for Weave (no code
      yet), informed by Weaverse's open `projectId`-based model.
