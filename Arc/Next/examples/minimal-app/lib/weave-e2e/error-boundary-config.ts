import type { WeavePageConfig } from '@weave/react/schemas';

const HEADING = 'E2E Weave heading marker';
const BODY = 'E2E weave body marker';

/** Static fixture — unknown type + render-throw between good sections (WEAVE-SDK-09). */
export function buildStaticErrorBoundaryConfig(): WeavePageConfig {
  return {
    schemaVersion: 1,
    slug: 'e2e-weave-errors-fixture',
    sections: [
      {
        id: 'e2e1111-1111-4111-8111-111111111111',
        type: 'e2e-heading',
        data: { text: HEADING },
        version: 1,
      },
      {
        id: 'e2e9999-9999-4999-8999-999999999999',
        type: 'e2e-unknown-section-type',
        data: {},
        version: 1,
      },
      {
        id: 'e2e2222-2222-4222-8222-222222222222',
        type: 'e2e-body',
        data: { body: BODY },
        version: 1,
      },
    ],
    updatedAt: '2000-01-01T00:00:00+00:00',
  };
}
