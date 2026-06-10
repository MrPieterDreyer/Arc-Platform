/**
 * `defineSection` + dev-mode drift warning (SDK-02, D-03).
 *
 * Authoring a section is: write a component, write a `WeaveComponentSchema<TProps>` (whose
 * `inputs[].name` is constrained to `keyof TProps`), and call `defineSection(component, schema)`.
 * The call:
 *   (a) registers `schema.type -> { component, schema }` (D-03a), and
 *   (b) returns the component UNCHANGED (D-03b).
 *
 * The drift comparison (rendered prop keys vs declared input names) does NOT run at registration
 * — `defineSection` has no rendered props yet. `<SectionRenderer>` calls `warnOnDrift` at render
 * time (RESEARCH §Open Q2), guarded dev-only and warn-once per section type. The emitted strings
 * are a LOCKED contract (UI-SPEC §Console Contract) — match them verbatim.
 *
 * RSC-safe: no `next/*`, no `'use client'`, no hooks.
 */

import type { ComponentType } from 'react';
import { registerSection, type WeaveComponentEntry } from '../registry/registry';
import type { WeaveComponentSchema } from './types';

/** Section types already warned about — keeps drift warnings to once per type per session. */
const warnedTypes = new Set<string>();

/**
 * Register a section and return its component unchanged (D-03a/b).
 *
 * `TProps` is inferred from `component`, so the `schema`'s `inputs[].name`s are checked against
 * the component's real props at the call site (SDK-01 compile guarantee, via `WeaveComponentSchema<TProps>`).
 */
export function defineSection<TProps extends Record<string, unknown>>(
  component: ComponentType<TProps>,
  schema: WeaveComponentSchema<TProps>,
): ComponentType<TProps> {
  const entry: WeaveComponentEntry = {
    component: component as ComponentType<Record<string, unknown>>,
    schema: schema as WeaveComponentSchema,
  };
  registerSection(schema.type, entry);
  return component; // D-03b — unchanged
}

/**
 * Dev-only drift check (SDK-02). Compares a section's actually-rendered prop keys against the
 * declared schema input names and emits a `console.warn` for each direction of drift:
 *   - a rendered prop with no matching schema input, and/or
 *   - a schema input with no matching component prop.
 *
 * Warns at most once per section `type`. In production it is a no-op (the guard is tree-shaken).
 * Called by `<SectionRenderer>` at render time, not by `defineSection`.
 */
export function warnOnDrift(
  type: string,
  renderedPropKeys: string[],
  schema: WeaveComponentSchema,
): void {
  if (process.env.NODE_ENV === 'production') return;
  if (warnedTypes.has(type)) return;

  const schemaNames = schema.inspector.flatMap((group) => group.inputs.map((input) => input.name));
  let warned = false;

  for (const prop of renderedPropKeys) {
    if (!schemaNames.includes(prop)) {
      console.warn(
        `[@weave-platform/react] Section "${type}": prop "${prop}" is rendered but has no matching schema input.`,
      );
      warned = true;
    }
  }

  for (const name of schemaNames) {
    if (!renderedPropKeys.includes(name)) {
      console.warn(
        `[@weave-platform/react] Section "${type}": schema input "${name}" has no matching component prop.`,
      );
      warned = true;
    }
  }

  if (warned) warnedTypes.add(type);
}

/** Test-only: clear the warn-once set so each case starts fresh. Not re-exported from the barrel. */
export function __resetDriftWarnings(): void {
  warnedTypes.clear();
}
