import { WeaveInputMatrixSections } from '../../../components/weave-input-matrix-sections';
import { buildStaticErrorBoundaryConfig } from '../../../lib/weave-e2e/error-boundary-config';

/** Wave 5 fixture — unknown section type must not crash sibling sections (WEAVE-SDK-09). */
export default function WeaveErrorsFixturePage() {
  const config = buildStaticErrorBoundaryConfig();

  return (
    <article data-testid="weave-error-boundary-page">
      <WeaveInputMatrixSections config={config} />
    </article>
  );
}
