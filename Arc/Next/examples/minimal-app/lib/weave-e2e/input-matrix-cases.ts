import type { WeaveInputType } from '@weave/react';

export interface InputMatrixCase {
  type: WeaveInputType;
  configs?: Record<string, unknown>;
}

/**
 * One section per SDK input type — defaults come from applyDefaults (see inputs.test.ts).
 */
export const INPUT_MATRIX_CASES: InputMatrixCase[] = [
  { type: 'text' },
  { type: 'richtext' },
  { type: 'number' },
  { type: 'toggle' },
  {
    type: 'select',
    configs: { options: [{ label: 'A', value: 'a' }] },
  },
  { type: 'color' },
  { type: 'image' },
  { type: 'url' },
  { type: 'product-picker' },
  { type: 'collection-picker' },
  { type: 'repeater', configs: { inputs: [] } },
  { type: 'range', configs: { min: 2, max: 10 } },
  { type: 'datetime' },
  { type: 'code' },
  { type: 'markdown' },
];

export function inputMatrixSectionType(type: WeaveInputType): string {
  return `e2e-input-${type}`;
}
