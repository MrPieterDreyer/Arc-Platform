/**
 * E2E / demo section registry for Wave 4–5 — imported for side effects before render.
 */
import type { ComponentType } from 'react';
import { defineSection, type WeaveComponentSchema } from '@weave/react';

import './weave-e2e/register-input-matrix-sections';

interface E2eHeadingProps extends Record<string, unknown> {
  text: string;
}

const E2eHeading: ComponentType<E2eHeadingProps> = ({ text }) => (
  <h2 data-testid="weave-section-heading" style={{ fontFamily: 'var(--font-display)' }}>
    {text}
  </h2>
);

const e2eHeadingSchema: WeaveComponentSchema<E2eHeadingProps> = {
  type: 'e2e-heading',
  title: 'E2E Heading',
  inspector: [{ group: 'Content', inputs: [{ type: 'text', name: 'text', label: 'Text' }] }],
};

defineSection(E2eHeading, e2eHeadingSchema);

interface E2eBodyProps extends Record<string, unknown> {
  body: string;
}

const E2eBody: ComponentType<E2eBodyProps> = ({ body }) => (
  <p data-testid="weave-section-body" style={{ color: 'var(--color-text-primary)' }}>
    {body}
  </p>
);

const e2eBodySchema: WeaveComponentSchema<E2eBodyProps> = {
  type: 'e2e-body',
  title: 'E2E Body',
  inspector: [{ group: 'Content', inputs: [{ type: 'richtext', name: 'body', label: 'Body' }] }],
};

defineSection(E2eBody, e2eBodySchema);
