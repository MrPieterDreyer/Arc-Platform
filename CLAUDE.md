# Arc Platform — Claude Code Context

> **All agents:** See [AGENTS.md](./AGENTS.md) for git, PR, and boundary rules shared across Cursor, Claude Code, GSD, Trigger, and other tools.

## Project at a glance

Arc is an open-source headless WooCommerce framework (like Shopify Hydrogen, but for WooCommerce).
Weave is a visual sections editor SDK that runs on top of Arc (like Weaverse, but for WooCommerce).

- **Arc** (`@arc-platform/core`, `@arc-platform/next`) — open source, MIT
- **Weave** (`@weave-platform/react`, `@weave-platform/next`, WP plugin) — Phase 1 free, Phase 2 SaaS
- **First client site:** LOFT Pro Shop — private repo at `D:\09. LOFT Pro Shop\loft-pro-shop\`

## Folder structure

```
D:\00. Arc Platform\
├── Arc/                  Framework packages (@arc-platform/core, @arc-platform/next, Pilot starter)
├── Weave/                Editor packages (@weave-platform/react, @weave-platform/next, WP plugin, Studio)
├── Templates/            Community starter themes (Arc-Commerce, Arc-Golf)
├── Design-Systems/       Arc design tokens + component reference
├── Documentation/        PUBLIC: ADRs, architecture decisions, contributor guides
├── Scripts/              Monorepo tooling
├── Artifacts/            Generated outputs — gitignored
└── .documentation/       GITIGNORED: GSD planning, design docs, brainstorming
    ├── .planning/        GSD state (STATE.md, ROADMAP.md, phases/)
    ├── Brainstorming/    Design sessions
    └── Design-Docs/      Approved architecture specs
```

## Technology stack

- **Language:** TypeScript strict throughout
- **Package manager:** pnpm workspaces
- **Build:** tsup per package
- **Linting:** Biome
- **Testing:** Vitest
- **Framework:** Next.js 16 App Router
- **WooCommerce API:** WC Store API v1 (cart + checkout) + WPGraphQL (catalog)
- **PHP plugin:** Weave/WordPress — page config storage + REST API

## GSD workflow

- GSD state lives in **`.documentation/.planning/`** (gitignored — not shipped to GitHub)
- Design docs live in `.documentation/Design-Docs/`
- Public ADRs live in `Documentation/Architecture/`
- **Do not commit** root `.planning/` — it was historically tracked by mistake and is now gitignored; use `.documentation/.planning/` only

Use `/gsd:new-project` to initialize `.documentation/.planning/` before first phase.

## Never commit (agents)

Mirrors [`.gitignore`](./.gitignore) — see [AGENTS.md](./AGENTS.md) for full rules:

- `.documentation/`, `.planning/`, `.claude/`, `.claude-flow/`, `.swarm/`, `.cursor/`, `.trigger/`
- `.mcp.json`, `HANDOFF.html`, `.env*`, `Artifacts/`

## Design system

All storefront, Pilot, Template, and Weave section UI uses **`Design-Systems/Arc-Design/`**:

- **Agents:** read `Design-Systems/Arc-Design/SKILL.md` before writing CSS or JSX
- **Tokens:** import `Design-Systems/Arc-Design/tokens/arc-tokens.css` once at app root (do not duplicate hex values)
- **Commerce patterns:** `Design-Systems/Arc-Design/references/COMMERCE.md`
- **Weave sections:** `Design-Systems/Arc-Design/references/WEAVE-SECTIONS.md`

Primary shop accent is **`#0369a1`** (CTAs, cart badge, focus, links). v0.1 is **light theme only**.

## Conventions

- **Files under 500 lines.** Split before crossing.
- **No secrets in repo.** `.env.example` only.
- **ADRs for architectural choices.** `Documentation/Architecture/ADR-*.md`
- **Read before edit.**
- **One commit, one concern.**
- **HTML for informational docs** (reports, summaries, design docs) — use `html-docs` skill.
- **Markdown for structural docs** (README, ADRs, CLAUDE.md, anything under `.documentation/.planning/`).

## Client site — LOFT Pro Shop

Private repo: `D:\09. LOFT Pro Shop\loft-pro-shop\`
Consumes Arc + Weave packages via `file:` references during development.
Switches to real npm references after Arc v0.1 is published.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Arc Platform**

Arc is an **open-source headless WooCommerce framework** — the missing Shopify Hydrogen equivalent for WooCommerce. **Weave** is a visual sections editor SDK that runs on top of Arc — the missing Weaverse for WooCommerce. Together they let developers build fast, headless WooCommerce storefronts in Next.js 16 / React 19, with non-developers editing pages visually through a WordPress-hosted (or future SaaS) editor.

**Core Value:** A developer can ship a production headless WooCommerce storefront on `@arc-platform/core` + `@arc-platform/next` + `@weave-platform/react` with the same productivity Shopify Hydrogen + Weaverse gives Shopify developers — and the page configuration lives inside the merchant's own WordPress, not a vendor SaaS.

### Constraints

- **Tech stack — Language:** TypeScript strict throughout every package. No JS files in source.
- **Tech stack — Package manager:** pnpm workspaces (globs: `Arc/**`, `Weave/**`, `Templates/**`).
- **Tech stack — Build:** tsup per package (esm + cjs + .d.ts outputs).
- **Tech stack — Monorepo:** Turborepo for pipelines.
- **Tech stack — Lint/format:** Biome (single tool, replaces ESLint + Prettier).
- **Tech stack — Test:** Vitest workspace.
- **Tech stack — Framework:** Next.js 16 App Router + React 19. Server Components for catalog/SEO, Client Components for cart/checkout.
- **Tech stack — WC cart/checkout:** WC Store API v1 only (`/wp-json/wc/store/v1`). Free, ships with WC, hands off to native WC payment gateways.
- **Tech stack — WC catalog:** WPGraphQL + WPGraphQL for WooCommerce.
- **Tech stack — WP plugin:** PHP 8.1+, custom post type for page configs, REST API surface, React-based WP Admin sidebar.
- **Code hygiene:** Files under 500 lines — split before crossing.
- **Secrets:** None in repo. `.env.example` only.
- **Commits:** One commit, one concern.
- **Docs:** ADRs for architectural choices (`Documentation/Architecture/ADR-*.md`). HTML for informational docs (Trigger Consulting design system), Markdown for structural docs.
- **Licensing:** Arc + Templates packages are MIT. No proprietary code permitted there.
- **GSD planning:** `.planning/` is gitignored per project convention (matches existing `.documentation/.planning/` policy in CLAUDE.md).
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## TL;DR — Prescriptive Picks
| Concern | Pick | Version | Confidence |
|---|---|---|---|
| Language | TypeScript strict | `^5.9.x` (use `5.9.3` floor) | HIGH |
| Package manager | pnpm | `11.4.x` | HIGH |
| Monorepo | Turborepo | `2.5.x` | HIGH |
| Bundler (libs) | **tsup** for v0.1, plan migration to **tsdown** for v0.2+ | `8.5.x` / `0.x` | HIGH |
| Lint/format | Biome | `2.4.x` | HIGH |
| Test | Vitest | `4.1.x` | HIGH |
| App framework | **Next.js 16** (revise from 15) + React 19.2 | `16.2.x` / `19.2.x` | HIGH |
| HTTP client (`@arc-platform/core`) | native `fetch` + custom retry/timeout wrapper | n/a | HIGH |
| GraphQL client | `graphql-request` + `graphql` peer | `7.4.x` / `16.14.x` | HIGH |
| GraphQL codegen | `@graphql-codegen/cli` + `client-preset` | `6.0.x` | HIGH |
| Validation | **Zod 4** for v0.1; consider `valibot` for `@weave-platform/react` runtime if bundle size becomes an issue | `4.4.x` / `1.4.x` | HIGH |
| Client state (Weave Admin) | **Zustand** (sidebar UI state) + **TanStack Query 5** (server state / REST sync) | `5.0.x` / `5.100.x` | HIGH |
| Cache (`@arc-platform/next`) | Next.js 16 `'use cache'` directive + `cacheTag` + `revalidateTag` (NOT `unstable_cache`) | n/a | HIGH |
| WP plugin JS build | **`@wordpress/scripts`** for v0.1 (stable, conservative); migrate to **`@wordpress/build`** when 1.0 ships | `32.3.x` / `0.15.x` | HIGH / MEDIUM |
| WP plugin PHP | PHP 8.1+ floor, Composer for autoload, PHPCS w/ WPCS | n/a | HIGH |
| Release tooling | Changesets | `2.31.x` | HIGH |
| Auth (WC Store API) | **Cart-Token** flow (NOT nonces for headless) | n/a | HIGH |
## 0. Critical Revisions to PROJECT.md Constraints
### 0.1 — Next.js 15 → Next.js 16 (REVISE)
| Next 16 change | Arc impact |
|---|---|
| `params` / `searchParams` are now **Promises only** — synchronous access removed | `@arc-platform/next` loaders must `await` |
| `middleware.ts` deprecated → renamed `proxy.ts` (named export `proxy`) | Pilot starter must use proxy file |
| `turbopack` config moved out of `experimental` to top level | `next.config.ts` template change |
| `'use cache'` directive + `cacheTag` is the **recommended** model; `unstable_cache` is legacy | `@arc-platform/next` cache helpers should target `'use cache'` from day 1 |
| `next/image` shifted to native browser features / simpler defaults | Pilot/templates need to follow new defaults |
### 0.2 — tsup → tsdown (PHASE, don't switch yet)
### 0.3 — `@wordpress/scripts` → `@wordpress/build` (PHASE)
## 1. Recommended Stack
### 1.1 Core Toolchain (root)
| Technology | Version | Purpose | Why |
|---|---|---|---|
| TypeScript | `5.9.3` | Type system, strict | TS 5.9 stabilized `--erasableSyntaxOnly`, `node20` module, improved isolatedDeclarations — relevant for tsup/tsdown DTS perf. Pin a floor; don't `^` across majors. |
| pnpm | `11.4.x` | Workspace manager | pnpm 11 ships built-in catalog support — eliminates per-package version drift in a monorepo. Use `pnpm-workspace.yaml` catalogs for `react`, `next`, `typescript`, `graphql`. |
| Turborepo | `2.5.x` | Pipeline orchestration | v2 has stable remote cache, watch mode, boundaries. The de-facto monorepo runner for Vercel-stack projects. Vercel maintainership. |
| Biome | `2.4.x` | Lint + format (single tool) | v2 added type-aware lints and import-organizer parity with ESLint. One config (`biome.jsonc`) replaces ESLint + Prettier + import-sort. ~10–100× faster than ESLint. |
| Vitest | `4.1.x` | Unit + integration tests | v4 is workspace-aware, ESM-native, runs on Vite 7 / Rolldown. Replaces both Jest + ts-jest with zero config. |
| tsup | `8.5.x` | Per-package builder (esm + cjs + d.ts) | Zero-config dual publish; well-understood failure modes. The Hydrogen / Remix / tRPC / drizzle-orm baseline. |
| Changesets | `2.31.x` | Versioning + changelog + publish | Designed for pnpm workspaces with independent versioning. Used by Hydrogen, Remix, tRPC, Astro. release-please is a (worse) alternative for non-monorepo. |
### 1.2 `@arc-platform/core` (framework runtime)
| Library | Version | Purpose | Rationale |
|---|---|---|---|
| `graphql` | `16.14.x` | GraphQL types | Peer dep — required by any client. Use as workspace peer. |
| `graphql-request` | `7.4.x` | WPGraphQL HTTP client | ~8kb, fetch-based, supports middleware/interceptors, no Apollo cache complexity. The right tool when caching is delegated to Next.js's data cache (which is exactly Arc's model). |
| `@graphql-codegen/cli` + `@graphql-codegen/client-preset` | `6.0.x` | Typed queries from WPGraphQL schema | Schema introspection → typed `gql` tag with no runtime. Standard in 2026 for typed GraphQL DX. |
| **native `fetch`** + thin retry/timeout wrapper (internal `src/http.ts`) | — | WC Store API v1 client | Node 20.4+ and modern browsers ship stable fetch. Avoid `ky`/`got`/`axios` as runtime deps for a framework package — they add weight, version-skew risk, and patch CVE surface to every consumer. Implement: exponential backoff, AbortSignal, Cart-Token / X-WC-Store-API-Nonce header injection, JSON error normalization. ~100 LOC. |
| `zod` | `4.4.x` | Runtime validation of WC Store API responses + `WeaveComponentSchema` | Zod 4 ships Zod Mini (tree-shakable subset). Mature, ergonomic, the default in TS world. Use `z.input` / `z.output` to drive TS types. |
### 1.3 `@arc-platform/next` (Next.js integration)
| Library | Version | Purpose | Rationale |
|---|---|---|---|
| `next` | `16.2.x` (peer `>=16`) | Host framework | Peer only, never direct dep. |
| `react` / `react-dom` | `19.2.x` (peer `>=19`) | RSC + actions | Peer only. |
| `server-only` / `client-only` | `^0.0.1` | Module-boundary enforcement | Tiny utilities that throw at build if a server-only module is imported in a client component. Use in cache helpers + WC Store API auth code. |
### 1.4 `@weave-platform/react` (sections SDK)
| Library | Version | Purpose | Rationale |
|---|---|---|---|
| `zod` | `4.4.x` | `WeaveComponentSchema` validation | Same as `@arc-platform/core` — share via workspace. Author schemas as `z.object(...)`, infer the TS type. |
| `react` | peer `>=19` | — | — |
### 1.5 `@weave-platform/next` (Next.js section renderer)
| Library | Version | Purpose | Rationale |
|---|---|---|---|
| `@arc-platform/next` | `workspace:*` | Cache helpers reused for page-config fetches | — |
| `@weave-platform/react` | `workspace:*` | Schema types | — |
### 1.6 Weave WP Plugin (PHP + WP Admin React app)
#### PHP side
| Tool | Version | Purpose |
|---|---|---|
| PHP | `>=8.1` | Floor (matches WC 9.x requirement) |
| Composer | `2.x` | Autoload + dev deps |
| `squizlabs/php_codesniffer` + `wp-coding-standards/wpcs` | latest | Lint to WordPress coding standards |
| PHPUnit | `10.x` | Plugin tests via `wp-env` |
| `johnpbloch/wordpress-core` (dev) | — | Local WP stubs for IDE / PHPCS |
#### JS side (WP Admin sidebar editor)
| Tool | Version | Purpose | Rationale |
|---|---|---|---|
| `@wordpress/scripts` | `32.3.x` | Build, lint, test orchestration | Includes webpack config, Babel, WP externals (`@wordpress/*` → globals), eslint config. Battle-tested, what 99% of plugins use. |
| `@wordpress/components` | latest | UI primitives (Panel, TextControl, SelectControl, …) | Match WP Admin's look automatically. Free, themed, accessible, RTL-aware. Don't reinvent admin UI. |
| `@wordpress/element` | latest | React wrapper (WP-provided) | Required — WP de-dupes React across all plugins via this. |
| `@wordpress/api-fetch` | latest | REST client with nonce auto-injection | Handles `X-WP-Nonce` for `/wp-json/weave/v1/*` automatically. Do not import a separate fetch lib. |
| `@wordpress/i18n` | latest | Translation pipeline | `__()`, `_x()`. Mandatory if Weave is going into the WP.org plugin directory. |
| `@tanstack/react-query` | `5.100.x` | Server-state cache for the editor | Page-config loads/saves, optimistic updates, request dedupe, retry. The de-facto Admin-React data layer. |
| `zustand` | `5.0.x` | Local UI state (selected section, drag state, dirty flag) | Tiny (~1kb), no Provider boilerplate, plays well with WP Admin's iframe boundaries. Jotai is the alternative if you want atom-level granularity; Zustand wins for "one editor session, one store." |
### 1.7 LOFT integration (Customer Zero — informational, not a deliverable)
## 2. Installation
### Root
### `@arc-platform/core`
### `@arc-platform/next`
# next + react are peerDeps only — do NOT add as direct deps
### `@weave-platform/react`
### `@weave-platform/next`
### WP plugin (`Weave/WordPress/weave/`)
# PHP
# JS
## 3. Alternatives Considered
| Recommended | Alternative | When the alternative wins |
|---|---|---|
| Next.js 16 App Router | Next.js 15 App Router | Never, for a greenfield 2026-05-28 build. Choose 15 only if forced by hosting constraints. |
| tsup | tsdown | When tsdown hits 1.0 + 1M+ weekly DLs (probably late 2026). Migration is trivial. |
| native fetch + wrapper | `ky` (4kb) | If we end up with >300 LOC of HTTP plumbing. Unlikely for Store API. |
| native fetch + wrapper | `axios` | Never for a framework lib — too heavy, CJS-first, axios CVE history. |
| native fetch + wrapper | `undici` (direct) | Node-only use cases (e.g. a build-time WC importer). Not for runtime where browser fetch is needed. |
| `graphql-request` | `urql` | If we ever want a normalized cache in the client (we don't — Next's data cache owns this). |
| `graphql-request` | `@apollo/client` | Never. Apollo is 40kb+ and brings a cache model that fights Next's cache. |
| Zod 4 | Valibot | When `@weave-platform/react` schema validation lands in a customer-facing bundle and 15kB matters. v0.2 decision. |
| Zustand + TanStack Query | Redux Toolkit | Never for this scope. RTK Query is fine but Zustand+TQ is lighter and the modern default. |
| Zustand | Jotai | If atom-level reactivity becomes a perf bottleneck in the editor. Unlikely. |
| `@wordpress/scripts` | `@wordpress/build` | When `@wordpress/build` 1.0 ships (probably H2 2026). Plan migration in ADR. |
| `@wordpress/scripts` | Vite + plain React | Only outside the WP Admin. Inside WP Admin, you want `@wordpress/scripts`'s WP-externals config — otherwise you'll bundle a 2nd React copy and break Gutenberg. |
| Changesets | release-please | release-please is fine for single-package repos. Worse for pnpm workspaces with independent versions. |
| pnpm catalogs | Manual version pinning | Catalogs are strictly better — adopt from day one. |
## 4. What NOT to Use
| Avoid | Why | Use Instead |
|---|---|---|
| **CoCart** | Paid third-party dep with zero advantage over WC Store API v1. Reduces install conversion. Already excluded in PROJECT.md. | WC Store API v1 (`/wp-json/wc/store/v1`) |
| **Apollo Client** | 40kb+, opinionated normalized cache fights Next.js data cache, slow cold-start. | `graphql-request` |
| **axios** | Heavy, CJS-first, redundant against native fetch in 2026, CVE history. | native `fetch` + wrapper |
| **Jest** | Slower than Vitest, CJS-first, painful with ESM packages. | Vitest 4 |
| **ESLint + Prettier + eslint-plugin-import** | Three tools, slow, config sprawl. | Biome 2 |
| **Lerna** | Effectively abandoned 2022, revived 2023, still inferior to Turbo+pnpm. | Turborepo + pnpm workspaces |
| **Yarn (any variant)** | pnpm is faster, disk-efficient, has catalogs, is what every monorepo in this ecosystem uses. | pnpm 11 |
| **`unstable_cache` for Next 16 code** | Legacy API, Next team explicitly calls it "clunky," being phased out. | `'use cache'` + `cacheTag` |
| **`middleware.ts`** in Pilot starter | Deprecated in Next 16 (renamed `proxy.ts` / named export `proxy`). | `proxy.ts` + `export function proxy` |
| **Synchronous `params` / `searchParams` access** | Removed in Next 16 — they're Promises now. | `const { slug } = await params` |
| **REST API for the catalog (WC core REST)** | Returns over-fetched, untyped JSON; pagination is awkward; variations require N+1 fetches. | WPGraphQL + WPGraphQL for WooCommerce |
| **Nonce auth from a headless Next.js client** | Nonces are tied to a WP login session — they don't exist for an anonymous Next.js visitor. | **Cart-Token** flow: first `GET /cart` returns `Cart-Token` response header; echo it back on subsequent writes. |
| **Bundling React inside the WP Admin plugin** | Will collide with WP's React, break Gutenberg. | `@wordpress/element` (WP's React) + webpack externals (auto-configured by `@wordpress/scripts`) |
| **Direct WP DB queries from PHP for page configs** | Misses CPT cache, REST permissions, post-meta hooks. | `register_post_type` + `WP_REST_Controller` (standard CPT + REST pattern) |
| **Drag-and-drop UI in v0.1 WP Admin sidebar** | Out of scope per Open Questions doc — that's Phase 2 Weave Studio. | Reorder via up/down buttons in v0.1. |
| **`unstable_cache` AND `'use cache'` together** | They have separate cache stores — invalidation will leak / fail silently. | Pick one. We're picking `'use cache'`. |
## 5. Ecosystem Weakness Flags (WooCommerce vs Shopify)
| Hydrogen has | Arc must build | Difficulty |
|---|---|---|
| Storefront API client w/ generated TS types out of the box | WPGraphQL codegen pipeline + Store API hand-typed (no schema) | MEDIUM — Store API has no GraphQL schema, so types must be hand-maintained from WC source. Vitest contract tests against a live `wp-env` are the safety net. |
| Built-in cart state synchronized with cookies | Cart-Token persistence layer (cookie + RSC-readable) | MEDIUM — pattern is documented but no library exists. ~150 LOC. |
| `<Money>`, `<Image>`, `<Video>` primitives | Either build equivalents in `@arc-platform/next` or document `next/image` + Intl.NumberFormat patterns | LOW — recommend "document the pattern, don't ship the component" for v0.1. |
| Oxygen edge runtime + global hosting | Vercel/Cloudflare/Netlify-agnostic by Next.js itself | None — Next.js solves this. |
| Customer Account API w/ session helpers | Build customer auth via WC Store API + JWT or session cookie | HIGH — flag for own ADR. Customer auth + order history is a known pain point in headless WooCommerce. |
| **WPGraphQL for WooCommerce ecosystem**: actively maintained but a one-maintainer-shaped project; CVE-2026-33290 hit WPGraphQL itself this year | Pin minor, watch security advisories, document fallback (REST for any catalog query GraphQL can't handle) | MEDIUM — risk is real but manageable. |
## 6. Version Compatibility Matrix
| Package | Compatible with | Notes |
|---|---|---|
| `next@16.2.x` | `react@19.2.x`, `react-dom@19.2.x` | Hard peer. React 18 not supported. |
| `@wordpress/scripts@32.x` | `react@19.2.x`, `node@>=22` | WP 6.7+ ships React 19. |
| `@wordpress/components@latest` | React 18 OR 19 (current package builds both) | Verify at install. |
| `graphql-request@7.x` | `graphql@16.x` peer | graphql 17 not yet released as stable. |
| `zod@4.x` | TS `>=5.5` | We're on 5.9, fine. |
| `vitest@4.x` | Node `>=20.19` or `>=22.12` | Codify in `engines`. |
| `tsup@8.x` | Node `>=18`, esbuild 0.21+ | Fine. |
| `pnpm@11.x` | Node `>=20.6` | Codify in `engines.pnpm` + `packageManager` field. |
| `turbo@2.x` | Node `>=18` | Fine. |
| WC Store API v1 | WooCommerce `>=9.0` | Lock in plugin readme. |
| WPGraphQL + WPGraphQL for WC | WP `>=6.4`, PHP `>=7.4` (but we floor at 8.1) | — |
## 7. Confidence Per Recommendation
| Area | Confidence | Reason |
|---|---|---|
| Versions of all listed npm packages | HIGH | Pulled live from `npm view <pkg> version` on 2026-05-28 |
| Next.js 16 upgrade rationale | HIGH | Verified against Next.js 16 upgrade guide + 16.1 release notes |
| `'use cache'` over `unstable_cache` | HIGH | Per Next.js team documentation; multiple independent sources confirm |
| WC Store API Cart-Token over nonce for headless | HIGH | WooCommerce dev docs explicit ("when using a Cart-Token a Nonce Token is not required") |
| `graphql-request` over Apollo/urql | HIGH | Pattern matches Hydrogen + drives caching to Next layer; widely used |
| `@wordpress/scripts` over `@wordpress/build` for v0.1 | HIGH | `@wordpress/build` is sub-1.0; conservative choice for a v0.1 platform release |
| tsup over tsdown for v0.1 | HIGH | Same reasoning — tsup is the conservative mature pick; tsdown is the upgrade path |
| Zod over Valibot for v0.1 | HIGH for v0.1; MEDIUM for v0.2 | DX wins now, bundle size may matter later in `@weave-platform/react` |
| Zustand + TanStack Query for editor | HIGH | Standard combination; what Weaverse + most modern WP Admin React apps use |
| WPGraphQL for WC maintenance health | MEDIUM | Actively maintained but small bus factor; recent CVE in WPGraphQL core (CVE-2026-33290) is a watch item |
| `@wordpress/build` migration timing | MEDIUM | 1.0 ETA is speculation; revisit at v0.2 planning |
## 8. Open Questions for the Roadmap (not blockers)
## 9. Sources
- `npm view <pkg> version` for: next, react, turbo, @biomejs/biome, vitest, tsup, typescript, zod, @tanstack/react-query, zustand, graphql-request, @changesets/cli, pnpm, ky, valibot, @graphql-codegen/cli, jotai, @wordpress/scripts, nuqs, @wordpress/build, graphql
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) — HIGH
- [Next.js 16 release notes](https://nextjs.org/blog/next-16) — HIGH
- [Next.js cacheTag function](https://nextjs.org/docs/app/api-reference/functions/cacheTag) — HIGH
- [Next.js unstable_cache (legacy)](https://nextjs.org/docs/app/api-reference/functions/unstable_cache) — HIGH
- [WooCommerce Store API — Cart Tokens](https://developer.woocommerce.com/docs/apis/store-api/cart-tokens/) — HIGH
- [WooCommerce Store API — Nonce Tokens](https://developer.woocommerce.com/docs/apis/store-api/nonce-tokens) — HIGH
- [WooCommerce Store API root](https://developer.woocommerce.com/docs/apis/store-api/) — HIGH
- [WPGraphQL for WooCommerce GitHub](https://github.com/wp-graphql/wp-graphql-woocommerce) — HIGH
- [@wordpress/build announcement (Apr 2026)](https://developer.wordpress.org/news/2026/04/wordpress-build-the-next-generation-of-wordpress-plugin-build-tooling/) — HIGH
- [@wordpress/scripts package handbook](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/) — HIGH
- [Weaverse SDK package layout](https://docs.weaverse.io/developer-tools/weaverse-sdks) — HIGH (pattern reference)
- [tsdown migration guide](https://tsdown.dev/guide/) — MEDIUM
- [tsup vs tsdown vs unbuild 2026 (PkgPulse)](https://www.pkgpulse.com/guides/tsup-vs-tsdown-vs-unbuild-typescript-library-bundling-2026) — MEDIUM
- [Zod v4 vs Valibot benchmarks (dev.to)](https://dev.to/whoffagents/zod-v4-vs-valibot-runtime-validation-in-2026-i-benchmarked-both-3jnc) — MEDIUM
- [Valibot bundle-size analysis (Builder.io)](https://www.builder.io/blog/valibot-bundle-size) — MEDIUM
- [WordPress Security Bulletin CVE-2026-33290 (WPGraphQL)](https://freshysites.com/resources/wordpress-security-bulletin-wpgraphql-vulnerability-cve-2026-33290/) — MEDIUM
- [Headless WooCommerce Store API v1 in Next.js (dev.to)](https://dev.to/admondtamang/using-headless-woo-commerce-store-api-v1-in-nextjs-issue-faced-and-solutions-ieh) — MEDIUM
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
