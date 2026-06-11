/**
 * Wave 5 — one E2E section per Weave input type (15), used by /e2e-fixtures/weave-inputs.
 */
import type { ComponentType } from 'react';
import { defineSection, type WeaveComponentSchema, type WeaveInput } from '@weave-platform/react';

import { formatDefaultMarker } from './format-default-marker';
import { INPUT_MATRIX_CASES, inputMatrixSectionType } from './input-matrix-cases';

interface InputValueProps extends Record<string, unknown> {
  value: unknown;
}

function InputMarker({ inputType, value }: { inputType: string; value: unknown }) {
  return (
    <section
      data-testid={`weave-input-${inputType}`}
      style={{
        padding: 'var(--space-4) 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <p
        style={{
          margin: '0 0 var(--space-2)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono, monospace)',
        }}
      >
        {inputType}
      </p>
      <output
        data-testid={`weave-input-${inputType}-marker`}
        style={{
          display: 'block',
          fontFamily: 'var(--font-sans)',
          color: 'var(--color-text-primary)',
        }}
      >
        {formatDefaultMarker(value)}
      </output>
    </section>
  );
}

function buildSchema(
  type: string,
  input: WeaveInput<InputValueProps>,
): WeaveComponentSchema<InputValueProps> {
  return {
    type,
    title: `E2E input: ${input.type}`,
    inspector: [{ group: 'Field', inputs: [input] }],
  };
}

for (const matrixCase of INPUT_MATRIX_CASES) {
  const sectionType = inputMatrixSectionType(matrixCase.type);
  const input = {
    type: matrixCase.type,
    name: 'value',
    label: matrixCase.type,
    ...(matrixCase.configs ? { configs: matrixCase.configs } : {}),
  } as WeaveInput<InputValueProps>;

  const Component: ComponentType<InputValueProps> = ({ value }) => (
    <InputMarker inputType={matrixCase.type} value={value} />
  );

  defineSection(Component, buildSchema(sectionType, input));
}
