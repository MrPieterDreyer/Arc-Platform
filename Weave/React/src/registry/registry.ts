/**
 * Module-scoped section registry (SDK-03, D-03a).
 *
 * `defineSection` registers `schema.type -> { component, schema }` here; `<SectionRenderer>`
 * resolves a section's `type` against it. The registry is a `globalThis`-keyed singleton
 * `Map` so that bundler chunk duplication (webpack/Turbopack can evaluate a module in more
 * than one chunk) does NOT produce multiple Map instances — all chunks share one
 * (RESEARCH §Pattern 2, §Pitfall 3; verified Next.js discussion #68572).
 *
 * RSC-safe: no `next/*`, no `'use client'`, no React hooks — this module must import cleanly
 * inside a Server Component (Success Criterion #3, D-13/D-14).
 */

import type { ComponentType } from 'react';
import type { WeaveComponentSchema } from '../schema/types';

/** A registered section: the React component plus its declarative schema. */
export interface WeaveComponentEntry {
  component: ComponentType<Record<string, unknown>>;
  schema: WeaveComponentSchema;
}

/** Symbol-keyed so the singleton survives chunk duplication and accidental re-evaluation. */
const KEY = Symbol.for('@weave-platform/react.registry');

type Reg = Map<string, WeaveComponentEntry>;

const g = globalThis as unknown as { [KEY]?: Reg };

/** The one shared registry Map. `??=` keeps the first instance across re-imports. */
g[KEY] ??= new Map();
export const registry: Reg = g[KEY] as Reg;

/** Register (or replace) the entry for a section `type`. Called inside `defineSection`. */
export function registerSection(type: string, entry: WeaveComponentEntry): void {
  registry.set(type, entry);
}

/** Resolve a section `type`. Returns `undefined` for unknown types — the renderer never throws. */
export function getSection(type: string): WeaveComponentEntry | undefined {
  return registry.get(type);
}

/** All registered section types (for tooling / introspection). */
export function listSections(): string[] {
  return [...registry.keys()];
}
