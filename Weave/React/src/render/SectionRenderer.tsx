/**
 * `<SectionRenderer>` — the RSC-safe core that wires the SDK together (SDK-04, SDK-09).
 *
 * Flow per page (D-08, D-10, RESEARCH §Pattern 4):
 *   1. `safeParse` the raw `config` against `WeavePageConfigSchema` — a malformed whole config
 *      renders nothing rather than throwing (page-level resilience).
 *   2. For each section in order: resolve `type` via the registry. An unknown type routes to the
 *      boundary's `unknown-type` path (D-10) — no throw.
 *   3. `applyDefaults` (defaults-then-validate, D-07) → `schemaToZod(...).safeParse`. A validation
 *      failure routes to the boundary's `validation` path with mapped Zod issues — no throw.
 *   4. On success, fire the dev-only drift warning with the validated prop keys (RESEARCH §Open Q2)
 *      and render the section component INSIDE `<SectionErrorBoundary>` so a render-time throw is
 *      caught by the boundary (D-08).
 *
 * `mode` is computed ONCE from `process.env.NODE_ENV` and passed to every boundary as a
 * serializable prop — the boundary never reads env itself (RESEARCH §Pattern 7).
 *
 * RSC-safe: NO `'use client'`, NO `import 'client-only'`, NO `next/*`. It imports the
 * `<SectionErrorBoundary>` from the `../client` subpath — a Server Component MAY render a Client
 * Component, but the boundary must never be re-exported from the main barrel (Pitfall 4).
 */

import { Fragment, type ReactElement } from 'react';
import { SectionErrorBoundary } from '../client';
import { getSection } from '../registry/registry';
import { warnOnDrift } from '../schema/define-section';
import { WeavePageConfigSchema, type WeavePageConfig } from '../schemas/page-config';
import { applyDefaults } from './apply-defaults';
import { schemaToZod } from './schema-to-zod';

/** Props for `<SectionRenderer>`. Accepts a raw value and parses it internally. */
export interface SectionRendererProps {
  /** The page config to render. Accepts `unknown`; validated against `WeavePageConfigSchema`. */
  config: WeavePageConfig | unknown;
}

/**
 * Render a `WeavePageConfig`'s sections in order. Never throws: a malformed whole config, an
 * unknown section type, a per-section Zod failure, and a render-time throw all degrade gracefully
 * (the last via the per-section error boundary).
 */
export function SectionRenderer({ config }: SectionRendererProps): ReactElement {
  const mode = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';

  const parsed = WeavePageConfigSchema.safeParse(config);
  if (!parsed.success) {
    // Whole-config malformed → render nothing rather than throw (page-level resilience).
    return <Fragment />;
  }

  return (
    <Fragment>
      {parsed.data.sections.map((section) => {
        const entry = getSection(section.type);

        // Unknown type (D-10) → boundary's unknown-type path, no children, no throw.
        if (!entry) {
          return (
            <SectionErrorBoundary
              key={section.id}
              mode={mode}
              sectionType={section.type}
              sectionId={section.id}
              kind="unknown-type"
            />
          );
        }

        // Defaults-then-validate (D-07): fill missing fields, then Zod-validate the merged data.
        const merged = applyDefaults(entry.schema, section.data);
        const result = schemaToZod(entry.schema).safeParse(merged);

        if (!result.success) {
          return (
            <SectionErrorBoundary
              key={section.id}
              mode={mode}
              sectionType={section.type}
              sectionId={section.id}
              kind="validation"
              issues={result.error.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message,
              }))}
            />
          );
        }

        const props = result.data as Record<string, unknown>;

        // Dev-only drift check at render time, with the validated prop keys (RESEARCH §Open Q2).
        if (mode === 'dev') {
          warnOnDrift(section.type, Object.keys(props), entry.schema);
        }

        const Component = entry.component;
        return (
          <SectionErrorBoundary
            key={section.id}
            mode={mode}
            sectionType={section.type}
            sectionId={section.id}
          >
            <Component {...props} />
          </SectionErrorBoundary>
        );
      })}
    </Fragment>
  );
}
