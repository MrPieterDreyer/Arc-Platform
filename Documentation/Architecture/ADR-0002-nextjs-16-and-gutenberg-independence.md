# ADR-0002: Next.js 16 Baseline + Weave Editor Independent of Gutenberg

**Status:** Accepted
**Date:** 2026-05-28
**Deciders:** Arc Platform maintainers
**Phase:** Phase 0
**Related requirements:** TOOL-09 (prep for ARC-NEXT-*, WEAVE-WP-*, WEAVE-SDK-*)

## Context

Two coupled decisions must be locked before any package code is written, because they determine the base framework peer deps and the fundamental data model for the Weave editor.

**Decision A — Next.js version:**
As of 2026-05-28, `next@latest` resolves to `16.2.6`; Next.js 15 is on the `next-15-3` dist-tag (legacy). Next.js 16 ships four breaking changes relevant to Arc:

1. `params` and `searchParams` in route segments are now **Promises** — synchronous property access is removed
2. `middleware.ts` is **deprecated** in favour of `proxy.ts` with a named `export function proxy`
3. Turbopack configuration moved from `experimental.turbopack` to top-level `turbopack`
4. `'use cache'` + `cacheTag` + `revalidateTag` are the **recommended** (no longer experimental) caching model; `unstable_cache` is explicitly labelled legacy

Building `@arc/next` against Next.js 15 on day one ships one major version behind immediately. Every caching primitive in `@arc/next` would be built against the legacy `unstable_cache` API, creating a mandatory breaking migration at Next 16 adoption — the worst time to impose migration burden on early adopters.

**Decision B — Weave editor model:**
Per PITFALLS P8 (Frontity postmortem), Frontity was a React-on-WordPress framework whose data model was entangled with Gutenberg blocks. When WP core's block editor direction changed, Frontity could not adapt and was eventually abandoned. Weave's defensible differentiation is owning its OWN editor and its OWN data model — specifically JSON stored in a custom post type, not serialized block markup in `post_content`.

If Weave were to build its editor on Gutenberg's `@wordpress/blocks` primitives, it would be permanently downstream of WP core's editor decisions and vulnerable to the same squeeze that ended Frontity.

## Decision Drivers

- Ship on the current Next.js major on day one; avoid legacy API debt from v0.1
- Avoid Frontity's failure mode: own the data model, own the editor
- Clear product differentiation: "headless WooCommerce storefront framework," not "modern WordPress block framework"
- `'use cache'` + `cacheTag` as recommended (not experimental) API available from day one
- Weave editor must be portable to a future SaaS Studio without WP Admin dependency

## Considered Options

1. **Next.js 15 + Gutenberg blocks** — familiar to WP developers; no migration cost at Next 16 time from community perspective; but ships legacy and entangles data model
2. **Next.js 16 + Gutenberg blocks** — correct framework version but still entangles editor with WP block semantics; still vulnerable to Frontity failure mode
3. **Next.js 16 + Weave-owned editor (chosen)** — current framework, independent data model, portable editor; the only option that satisfies both correctness and strategic independence

## Decision

**Arc + Weave target Next.js 16 + React 19 from v0.1.** Peer dependency in `@arc/next` and `@weave/next`: `"next": ">=16.0.0"`, `"react": ">=19.0.0"`.

**Weave ships its OWN editor.** The v0.1 editor is a WP Admin React sidebar with form-based section editing (no drag-and-drop). The v2 Weave Studio is a full SaaS drag-and-drop editor running outside WP Admin. In both versions:

- Weave **NEVER** renders Gutenberg blocks
- Weave **NEVER** imports `@wordpress/blocks` at runtime
- Weave **NEVER** depends on `theme.json` for styling tokens
- The `weave_page` custom post type uses `'supports' => ['title', 'custom-fields']` — the `editor` support key is deliberately absent so Gutenberg NEVER opens a Weave page

The Weave WP plugin stores page configuration as versioned JSON in `post_content` (see ADR-0005 for schema). The WP Admin sidebar editor is a plain React app compiled by `@wordpress/scripts` that reads/writes this JSON via REST — no block grammar involved.

## Consequences

### Positive

- Won't strand the project if WP core changes block editor semantics — Weave's data model is block-agnostic (Frontity's failure mode is avoided by design).
- Ships on the current Next.js major. `'use cache'` + `cacheTag` are available as recommended (not experimental) APIs in `@arc/next` from day one — no legacy migration debt.
- Weave Studio (Phase 2 SaaS) can be built as a standalone React app without any WP Admin dependency, because the data model (JSON CPT) is already framework-agnostic.
- Pilot starter `proxy.ts` (not `middleware.ts`) is correct from v0.1 — no migration required at Next 16 upgrade.

### Negative

- Cannot ride the Gutenberg block ecosystem (themes, block libraries, `@wordpress/components` layout blocks). Weave must build or adopt its own component primitives.
- Marketing positioning must be explicit: Arc + Weave is a **headless WooCommerce storefront framework**, NOT a "modern WordPress framework" or "block-based theme replacement". Messaging that blurs this line attracts the wrong audience.
- Local development requires HTTPS (forced by `SameSite=None` on the cart cookie, per ADR-0006) — developers must use `mkcert` or similar.

### Neutral

- Per-package Next.js peer dep is `"next": "^16.0.0"`. Pilot starter and Templates must list `next@^16.2.0` as a direct dep.
- Every route loader that receives `params` or `searchParams` must use `const { slug } = await params` — synchronous destructuring is a build error in Next 16.
- Pilot starter uses `proxy.ts` with `export function proxy` — not `middleware.ts`. CLAUDE.md already flags this as a forbidden pattern.

## Implementation Notes

- `pnpm-workspace.yaml` catalog entry: `next: "^16.2.0"` (pinned in catalog, bumped by Renovate).
- `Arc/Next/package.json` and `Weave/Next/package.json` list `"next": ">=16.0.0"` as a `peerDependency` only — never a direct dependency in a library package.
- All server components and route handlers in the Pilot starter (Phase 5) `await params` before destructuring — verified by TypeScript strict types (Next 16 makes `params` `Promise<{ slug: string }>`, so synchronous access is a type error).
- The WP plugin (Phase 4a) registers the `weave_page` CPT with `'supports' => ['title', 'custom-fields']` — no `'editor'` in the supports array. This prevents Gutenberg from loading on these posts.
- Phase 4a WP Admin sidebar JS is compiled with `@wordpress/scripts` (webpack + WP externals). `@wordpress/element` is used as the React wrapper — no bundled React.

## References

- Research: `.planning/research/STACK.md` §0.1 — Next.js 15 → 16 upgrade table
- Research: `.planning/research/PITFALLS.md` P8 — Frontity postmortem
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js 16 release notes](https://nextjs.org/blog/next-16)
- [Next.js `cacheTag` API reference](https://nextjs.org/docs/app/api-reference/functions/cacheTag)
- [Frontity postmortem — The New Stack](https://thenewstack.io/frontity-and-the-future-of-wordpress-as-a-dev-platform/)
