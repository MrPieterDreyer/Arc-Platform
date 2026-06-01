/**
 * `@weave/react` — RSC-safe public barrel (D-13).
 *
 * This entry is Server-Component-safe: it re-exports the schema authoring API, registry,
 * `<SectionRenderer>`, validation/defaults/condition helpers, the input-type registry, and the
 * page-config schema. None of these pull `client-only` or `next/*`.
 *
 * NOTE: `<SectionErrorBoundary>` is intentionally NOT exported here. It is the one client-only
 * piece and lives in `@weave/react/client`. Re-exporting it would pull `client-only` into this
 * RSC-safe barrel and break Server Component consumers (mirrors `@arc/core`'s `./hooks` split —
 * see src/client/index.ts and RESEARCH §Pitfall 4).
 */

// Schema authoring API (Plan 02)
export type {
  WeaveComponentSchema,
  WeaveInput,
  WeaveInputType,
  WeaveInspectorGroup,
} from './schema/types';

// defineSection + dev drift warning (Plan 04)
export { defineSection, warnOnDrift } from './schema/define-section';

// Module-scoped registry (Plan 04)
export { getSection, listSections, registry } from './registry/registry';
export type { WeaveComponentEntry } from './registry/registry';

// Renderer (Plan 06)
export { SectionRenderer } from './render/SectionRenderer';
export type { SectionRendererProps } from './render/SectionRenderer';

// Validation + defaults + condition (Plan 03/04)
export { schemaToZod } from './render/schema-to-zod';
export { applyDefaults } from './render/apply-defaults';
export { evaluateCondition, parseCondition } from './render/condition';
export type { ConditionOp } from './render/condition';

// Input-type registry (Plan 03)
export { inputRegistry } from './inputs/input-registry';

// Page config (Plan 02 / D-15)
export { WeavePageConfigSchema, WeaveSectionSchema } from './schemas/page-config';
export type { WeavePageConfig, WeaveSection } from './schemas/page-config';
