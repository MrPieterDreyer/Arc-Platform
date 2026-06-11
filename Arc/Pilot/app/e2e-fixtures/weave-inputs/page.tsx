import { buildStaticInputMatrixConfig } from '../../../lib/weave-e2e/input-matrix-config';
import { WeaveInputMatrixSections } from '../../../components/weave-input-matrix-sections';

/**
 * Wave 5 fixture — all 15 Weave input types with registry defaults (no WP seed required).
 */
export default function WeaveInputsFixturePage() {
  const config = buildStaticInputMatrixConfig();

  return (
    <article data-testid="weave-input-matrix-page">
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-6)',
        }}
      >
        Weave input matrix (E2E)
      </h1>
      <div data-testid="weave-input-matrix-sections">
        <WeaveInputMatrixSections config={config} />
      </div>
    </article>
  );
}
