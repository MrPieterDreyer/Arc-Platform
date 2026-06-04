import type { WeavePageConfig } from '@weave/react/schemas';

import { INPUT_MATRIX_CASES, inputMatrixSectionType } from './input-matrix-cases';

/** Static fixture config — empty section data so SectionRenderer applies type defaults. */
export function buildStaticInputMatrixConfig(): WeavePageConfig {
  return {
    schemaVersion: 1,
    slug: 'e2e-weave-inputs-fixture',
    sections: INPUT_MATRIX_CASES.map((c, index) => ({
      id: `e2e5-${c.type}-${String(index).padStart(2, '0')}`,
      type: inputMatrixSectionType(c.type),
      data: {},
      version: 1,
    })),
    updatedAt: '2000-01-01T00:00:00+00:00',
  };
}
