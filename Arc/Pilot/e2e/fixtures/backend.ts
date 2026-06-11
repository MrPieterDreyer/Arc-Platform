import { test as base } from '@playwright/test';

import { getE2eEnv } from '../../../../Scripts/e2e-shared/e2e-env';
import {
  formatBackendProbeFailure,
  probeWave0Backends,
} from '../../../../Scripts/e2e-shared/wp-health';

type BackendProbe = Awaited<ReturnType<typeof probeWave0Backends>>;

type BackendFixtures = {
  backendReady: BackendProbe;
};

export const test = base.extend<BackendFixtures>({
  backendReady: [
    async ({ request }, use, testInfo) => {
      const env = getE2eEnv();
      const probe = await probeWave0Backends(request, env);
      const allUp = probe.wp && probe.graphql && probe.storeApi;

      const ci = process.env.CI === 'true' || process.env.CI === '1';
      const gated = Boolean(process.env.CI_WP_ENV);

      if (!allUp && !ci && !gated) {
        testInfo.skip(
          true,
          `Backends unavailable (${formatBackendProbeFailure(probe)}). Run: pnpm wp:setup`,
        );
      }

      if (!allUp && (ci || gated)) {
        throw new Error(
          `E2E backends required but down: ${formatBackendProbeFailure(probe)}. Check wp-env and seed.`,
        );
      }

      await use(probe);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
