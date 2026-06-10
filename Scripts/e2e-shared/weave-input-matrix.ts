/**
 * Wave 5 — Weave input-type matrix (15 SDK input types, defaults from @weave-platform/react registry).
 * Shared by minimal-app fixture route and Playwright specs.
 */

import type { WeavePageConfigBody } from './wp-weave-page';

/** Slug when matrix config is seeded via weave/v1 REST (optional hybrid path). */
export const E2E_WEAVE_INPUT_MATRIX_SLUG = 'e2e-weave-inputs';

export type WeaveInputMatrixType =
  | 'text'
  | 'richtext'
  | 'number'
  | 'toggle'
  | 'select'
  | 'color'
  | 'image'
  | 'url'
  | 'product-picker'
  | 'collection-picker'
  | 'repeater'
  | 'range'
  | 'datetime'
  | 'code'
  | 'markdown';

export interface WeaveInputMatrixCase {
  type: WeaveInputMatrixType;
  /** Passed to schema `configs` when the input type requires it. */
  configs?: Record<string, unknown>;
  /** Type-registry fallback when section `data` is empty (matches inputs.test.ts). */
  expectedDefault: unknown;
}

/** Registry section type id for a given input type. */
export function weaveInputMatrixSectionType(type: WeaveInputMatrixType): string {
  return `e2e-input-${type}`;
}

/**
 * Expected default markers for empty section data — mirrors Weave/React inputs.test.ts CASES.
 */
export const WEAVE_INPUT_MATRIX_CASES: WeaveInputMatrixCase[] = [
  { type: 'text', expectedDefault: '' },
  { type: 'richtext', expectedDefault: '' },
  { type: 'number', expectedDefault: 0 },
  { type: 'toggle', expectedDefault: false },
  {
    type: 'select',
    configs: { options: [{ label: 'A', value: 'a' }] },
    expectedDefault: 'a',
  },
  { type: 'color', expectedDefault: '' },
  { type: 'image', expectedDefault: { id: null, url: '' } },
  { type: 'url', expectedDefault: '' },
  { type: 'product-picker', expectedDefault: '' },
  { type: 'collection-picker', expectedDefault: '' },
  { type: 'repeater', configs: { inputs: [] }, expectedDefault: [] },
  { type: 'range', configs: { min: 2, max: 10 }, expectedDefault: 2 },
  { type: 'datetime', expectedDefault: '' },
  { type: 'code', expectedDefault: '' },
  { type: 'markdown', expectedDefault: '' },
];

/** Stable DOM text for the applied default (happy-path E2E contract). */
export function formatWeaveInputDefaultMarker(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function matrixSectionId(index: number): string {
  const suffix = String(index).padStart(12, '0');
  return `e2e50000-0000-4000-8000-${suffix}`;
}

/** Page config with one section per input type and empty `data` (defaults applied at render). */
export function buildWeaveInputMatrixPageConfig(
  slug: string = E2E_WEAVE_INPUT_MATRIX_SLUG,
): WeavePageConfigBody {
  return {
    schemaVersion: 1,
    slug,
    sections: WEAVE_INPUT_MATRIX_CASES.map((c, index) => ({
      id: matrixSectionId(index),
      type: weaveInputMatrixSectionType(c.type),
      data: {},
      version: 1,
    })),
    updatedAt: '2000-01-01T00:00:00+00:00',
  };
}
