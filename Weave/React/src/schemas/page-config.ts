/**
 * Page-config Zod schema (D-15) — validates the exact ADR-0005 JSON shape.
 *
 * This is the schema Phase 4b's `loadPageConfig` will `.parse()` the WP REST response against.
 * `sections[].data` is left as an open record here; per-type prop validation happens later in
 * `schemaToZod` (Plan 03) / the section renderer (Plan 06) once a section type is resolved.
 *
 * @see Documentation/Architecture/ADR-0005-page-config-json-shape.md §Decision + §Field contracts
 */
import { z } from 'zod';

/** One section entry — ADR-0005 `sections[]` shape. */
export const WeaveSectionSchema = z
  .object({
    /** Stable UUIDv4 generated at section create-time. */
    id: z.string().min(1),
    /** Registry key; matched to a registered section in the renderer (not validated here). */
    type: z.string().min(1),
    /** Per-type props — validated later by the section's own Zod schema. */
    data: z.record(z.string(), z.unknown()),
    /** Per-section schema version; enables per-section migrations (integer). */
    version: z.number().int(),
  })
  .strict();

/** Top-level page config — ADR-0005 root shape (strict — matches PHP Weave_Validator D-07). */
export const WeavePageConfigSchema = z
  .object({
    /** Root schema version (integer). */
    schemaVersion: z.number().int(),
    /** URL slug of the page. */
    slug: z.string().min(1),
    /** Ordered sections; render order = array order. */
    sections: z.array(WeaveSectionSchema),
    /** ISO8601 timestamp of last save (string, not over-constrained). */
    updatedAt: z.string(),
  })
  .strict();

/** Inferred type for a single section. */
export type WeaveSection = z.infer<typeof WeaveSectionSchema>;

/** Inferred type for a full page config (ADR-0005 shape). */
export type WeavePageConfig = z.infer<typeof WeavePageConfigSchema>;
