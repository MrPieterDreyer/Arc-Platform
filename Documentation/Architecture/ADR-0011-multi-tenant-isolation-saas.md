# ADR-0011 — Multi-Tenant Isolation for Phase-2 Weave SaaS

**Status:** Accepted as design (2026-06-09; proposed 2026-06-08 — surfaced by Hydrogen/Weaverse parity audit). Build is Phase-2 SaaS scope; the object-level-authz Phase-1 win is tracked in `.planning/BACKLOG.md`.
**Date:** 2026-06-08
**Deciders:** Pieter Dreyer

## Context

Weave Phase 1 is a single WordPress install, single editor, single set of `weave_page` configs. Phase 2
turns Weave into a **multi-tenant SaaS** where many merchants edit pages through one hosted editor.

The parity audit (`AUDIT-hydrogen-weaverse-parity-2026-06-08.html`, Editor/SaaS section) confirmed that
**Weave has zero multi-tenant code today** — this is a greenfield design surface, not a regression. The
audit also confirmed two relevant single-tenant facts that become liabilities under multi-tenancy:

- The WP REST layer is capability-only: any `edit_posts` user can read/write **any** `weave_page` slug;
  there is no per-post ownership check (`Weave/WordPress/src/class-weave-rest-controller.php:162-204`,
  finding **E-1**).
- The page-config cache tag is `weave:page:{slug}` (`Weave/Next/src/load-page-config.ts:65`); `slug` is
  **not** globally unique across tenants, so one tenant's revalidation webhook could purge another's cache.

Weaverse (fully open source) solves this with a `projectId`-based model: every API call carries
`projectId`, and the cache key includes it (`references/weaverse/packages/hydrogen/src/weaverse-client.ts:519-526`).
The actual tenant-ownership enforcement lives server-side in Weaverse's SaaS, not in the open SDK — so it
informs the requirement but not the implementation.

## Decision

**Proposed:** Adopt **WordPress Multisite (one sub-site per tenant)** as the isolation primitive, with
tenant identity carried explicitly through the cache and revalidation layers.

1. **Storage isolation via Multisite.** Each merchant tenant is a Multisite sub-site. `register_post_type`
   is per-site, and WP's native `blog_id` partitions the post table. `current_user_can` already scopes to
   the sub-site, so WP's own authz boundary does the heavy lifting rather than a hand-rolled `meta_query`
   tenant filter (which is one forgotten `WHERE` clause away from a cross-tenant leak).

2. **Per-tenant authz at the REST boundary.** Beyond the existing `require_cap()` choke point
   (`class-weave-rest-controller.php:118`), add (a) the object-level `current_user_can('edit_post', $id)`
   check from finding E-1, and (b) a tenant-context guard that validates the authenticated user belongs to
   the requesting sub-site before any post lookup runs.

3. **Tenant-scoped cache tags.** Page-config tags become `weave:tenant:{tenantId}:page:{slug}` (and the
   list tag likewise namespaced). `@weave/next`'s tag allowlist (`Weave/Next/src/revalidate.ts:16`, pinned
   to `weave:`) is extended so a revalidation webhook can only purge tags within its own tenant namespace.

4. **Tenant routing in `loadPageConfig`.** `Weave/Next/src/load-page-config.ts` today fetches from a single
   `WEAVE_WP_BASE_URL`. Phase 2 resolves the tenant's sub-site REST endpoint (or `projectId`-equivalent)
   per request and includes the tenant id in the cache tag.

5. **Editor preview sandboxing.** The Phase-2/Phase-5 Studio preview runs in an iframe with
   `sandbox="allow-scripts allow-same-origin"` and a `postMessage` bridge that validates `event.origin`
   against a trusted-domain allowlist before processing any editor command. No origin-validation code
   exists today; this is a hard requirement before any live-edit bridge ships.

### Rejected alternatives

- **Single site + `tenant_id` post-meta + mandatory `meta_query`** — rejected as the primary model: every
  query path must remember the filter, and a compromised `edit_posts` credential on a shared site can read
  every tenant's configs via `GET /weave/v1/pages`. Acceptable only as a fallback where Multisite is
  impossible, and then only with a centralized query helper that injects the filter.
- **Separate WordPress install per tenant** — strongest isolation but operationally heavy at scale
  (provisioning, updates, backups per install). Multisite gives most of the isolation with one codebase;
  revisit dedicated installs only for enterprise tenants with a contractual isolation requirement.
- **Opaque `projectId` with app-layer enforcement (Weaverse's model)** — Weaverse can do this because
  enforcement lives in its proprietary SaaS. For an open-source WP-hosted plugin, leaning on WP's own
  Multisite authz is more auditable and less bug-prone than a bespoke `projectId` ACL.

## Consequences

- **WP plugin** must be made Multisite-aware: `class-weave-cpt.php` registration per sub-site, and a tenant
  guard layer in the REST controller. (Audit evidence gap: current Multisite compatibility is untested.)
- **Section IDs** are already UUIDv4 (`class-weave-cpt.php` `generate_section_id()`), so they remain
  globally unique under multi-tenancy — no change needed, but Phase 2 must not regress to a sequential id.
- **Cache-tag schema change** (`weave:tenant:{id}:page:{slug}`) is a breaking change to the revalidation
  contract; it must land before any tenant beyond the first, and `@arc/next`/`@weave/next` allowlists
  update together.
- **Studio bridge** gains a non-negotiable origin-validation requirement now, even though the bridge itself
  is Phase 5 — designing the authz boundary late is how preview sandboxes leak.
- Object-level authz (E-1) is worth doing in **Phase 1** already (low cost, removes a latent footgun).

## Validation

- PHPUnit auth-matrix test extended: a user on tenant A cannot read/write tenant B's `weave_page` via REST
  (expect 403/404), mirroring the existing `tests/test-rest-auth.php` discipline.
- Revalidation test: a webhook signed for tenant A cannot purge a `weave:tenant:B:*` tag.

## References

- Audit: `Documentation/Architecture/AUDIT-hydrogen-weaverse-parity-2026-06-08.html` (Editor/SaaS, E-1)
- Weaverse `projectId` model: `references/weaverse/packages/hydrogen/src/weaverse-client.ts:519-526`
- ADR-0004 (cache-tag taxonomy) — the tag schema this extends
- ADR-0007 (webhook auth mechanism) — the revalidation signing this namespaces
