# ADR-0005: Page-Config JSON Shape + Schema Versioning

**Status:** Accepted
**Date:** 2026-05-28
**Deciders:** Arc Platform maintainers
**Phase:** Phase 0
**Related requirements:** TOOL-09 (prep for WEAVE-WP-01, WEAVE-WP-02, WEAVE-SDK-07, WEAVE-NEXT-01)

## Context

The Weave WP plugin stores page configurations inside WordPress. These configs drive what sections appear on a given storefront page, in what order, and with what props. Per PITFALLS P11, the JSON shape must be versioned from day one: section schemas WILL evolve (props renamed, sections added/removed), and existing saved configs must be migrated forward without breaking live pages.

Per ADR-0002, the data model is deliberately independent of Gutenberg. That means the storage format is NOT serialized block markup — it is plain JSON. Two storage options exist in WP: `post_meta` (serialized PHP arrays) and `post_content` (text/JSON). JSON in `post_content` is:

- Human-readable and greppable in the DB
- DB-portable (can be exported via WP exporter or raw SQL without custom tools)
- Parseable from REST without PHP deserialization
- Directly Zod-validatable in JS without PHP-to-JS conversion

The Weave WP plugin uses a custom post type `weave_page` for page configs. Each `weave_page` post stores exactly one page config document.

## Decision Drivers

- Schema evolvability: configs saved today must be readable by future plugin versions
- Simple storage: no custom DB tables; use WP's established CPT + REST pattern
- REST-readable: the Next.js app fetches configs via `GET /wp-json/weave/v1/pages/{slug}` without PHP coupling
- Zod-validatable: `@weave/react` schema types are derived from this JSON shape directly
- PITFALLS P11: undo history must NOT be stored server-side (client-side only); list endpoints must return metadata only to avoid bloat

## Considered Options

1. **Serialized PHP array in `post_meta`** — familiar to WP developers; but PHP-specific, not directly REST-readable as JSON, loses type fidelity in serialization, requires custom PHP deserialization on read
2. **JSON in `post_content` of `weave_page` CPT (chosen)** — plain text/JSON stored in WP's native `post_content` column; REST-readable; DB-portable; Zod-validatable; greppable
3. **Custom DB table** — maximum schema control; but bypasses WP REST, permissions, caching, and CPT tooling; adds migration surface; overkill for v0.1

## Decision

Page configuration is stored as versioned JSON in the `post_content` field of a `weave_page` custom post type. The top-level shape is:

```json
{
  "schemaVersion": 1,
  "slug": "home",
  "sections": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "hero",
      "data": {
        "heading": "Welcome to LOFT Pro Shop",
        "subheading": "Premium golf equipment",
        "ctaLabel": "Shop Now",
        "ctaHref": "/shop"
      },
      "version": 1
    },
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "type": "featured-products",
      "data": {
        "collectionSlug": "featured",
        "limit": 4
      },
      "version": 1
    }
  ],
  "updatedAt": "2026-05-28T14:00:00Z"
}
```

**Field contracts:**

| Field | Type | Description |
|-------|------|-------------|
| `schemaVersion` | `number` (integer) | Root schema version; bumped when the top-level shape changes; currently `1` |
| `slug` | `string` | URL slug of the page; matches the `weave_page` post slug |
| `sections` | `array` | Ordered array of section objects; render order = array insertion order |
| `sections[].id` | `string` (UUIDv4) | Stable identifier generated at section create-time; NEVER reused after deletion |
| `sections[].type` | `string` | Section component type key; matched to a registered `WeaveComponent` in `@weave/react` |
| `sections[].data` | `object` | Section props; shape is per-type and validated by the component's Zod schema |
| `sections[].version` | `number` (integer) | Per-section schema version; allows per-section migrations independent of root `schemaVersion` |
| `updatedAt` | `string` (ISO8601) | Server-set timestamp of last save; written by the WP plugin on every PUT |

**Size limits:**
- Soft limit: 256KB per page config (warns in editor UI)
- Hard limit: 1MB (REST endpoint returns 413 above this threshold)
- `post_content` is `LONGTEXT` in MySQL (4GB ceiling) — practical limit is 1MB to avoid autoload pressure

**Undo history:** NEVER stored server-side. The editor maintains a client-side undo stack (in-memory or `localStorage`) that is discarded on page reload. Server stores only the last-saved state.

**List endpoint:** `GET /wp-json/weave/v1/pages` returns metadata only — `{ id, slug, updatedAt }` per page — never the full `sections` array. This prevents list bloat on installs with many pages.

## Consequences

### Positive

- Schema evolution is traceable: `schemaVersion` at root + `version` per section allow independent migrations forward
- JSON in `post_content` is greppable in MySQL (`SELECT post_content FROM wp_posts WHERE post_type = 'weave_page'`), DB-portable (WP exporter works), and REST-friendly (no PHP deserialization)
- Zod schema in `@weave/react` directly validates this shape; TypeScript types are inferred from the schema — single source of truth

### Negative

- WP MySQL `post_content` is `LONGTEXT` (4GB ceiling) but autoloaded option pressure from the WP options API is unrelated — however, `post_content` is NOT autoloaded, so the practical concern is `post_meta` autoloading, not `post_content`. The hard 1MB REST cap is the operative limit.
- UUIDs generated client-side (in the editor) must be truly random to avoid collision across editors — use `crypto.randomUUID()` (available in all modern browsers + Node 16+)

### Neutral

- Undo history is client-side only — server always stores authoritative last-saved state; no conflict resolution needed
- The list endpoint returning metadata-only is a deliberate tradeoff: full configs are only fetched per-slug, not in bulk

## Implementation Notes

- Phase 3 (`@weave/react`): `src/schemas/page-config.ts` exports `WeavePageConfigSchema` (Zod) and the inferred TypeScript type `WeavePageConfig`. The schema validates this exact shape.
- Phase 4a (Weave WP plugin): `class-weave-cpt.php` registers `weave_page` CPT with `'show_in_rest' => true`, `'supports' => ['title', 'custom-fields']` (no `'editor'` — Gutenberg excluded per ADR-0002). REST controller in `class-weave-rest-controller.php` validates `post_content` against the JSON shape on `PUT`; returns 422 with field-level errors on validation failure.
- Phase 4b (`@weave/next`): `loadPageConfig(slug: string): Promise<WeavePageConfig>` fetches `GET /wp-json/weave/v1/pages/{slug}`, validates response with `WeavePageConfigSchema.parse()`, throws on mismatch.
- Migration strategy: when `schemaVersion` is incremented, ship a PHP migration in the plugin that reads all `weave_page` posts and upgrades stored JSON; per-section `version` bumps are handled by a section-level migration registry in `@weave/react`.
- Section `id` generation: `crypto.randomUUID()` in the editor (browser); `wp_generate_uuid4()` in the WP plugin (PHP side).

## References

- Research: `.planning/research/PITFALLS.md` P11 — page config bloat and undo history anti-pattern
- ADR-0002 — Weave editor independence from Gutenberg (explains why JSON not block markup)
- ADR-0004 — Cache tag taxonomy (`weave:page:{slug}` tag invalidates the cached page config)
- ADR-0007 — Webhook auth mechanism (the WP plugin fires a webhook after saving a page config)
