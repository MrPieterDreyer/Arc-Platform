import { expect, test as base } from '@playwright/test';

import {
  hasStripeSandboxEnv,
  stripeSandboxSkipMessage,
} from '../../../../../../Scripts/e2e-shared/store-api-checkout';

import { test as backendTest } from '../fixtures/backend';

base.describe('Wave 6 — payment sandbox env @payment', () => {
  // biome-ignore lint/correctness/noEmptyPattern: Playwright requires fixture object destructuring
  base.beforeEach(({}, testInfo) => {
    if (!hasStripeSandboxEnv()) {
      testInfo.skip(true, stripeSandboxSkipMessage());
    }
  });

  base('Stripe sandbox keys are configured @payment', async () => {
    expect(hasStripeSandboxEnv()).toBe(true);
  });
});

backendTest.describe('Wave 6 — payment sandbox (staging backend) @payment', () => {
  backendTest.beforeEach(({ backendReady }, testInfo) => {
    if (!hasStripeSandboxEnv()) {
      testInfo.skip(true, stripeSandboxSkipMessage());
    }
    expect(backendReady.storeApi).toBe(true);
  });

  backendTest.skip(
    'complete Stripe Payment Intent checkout on staging — requires WC Stripe gateway + Pilot UI',
    () => {
      // Full card flow ships with Pilot (PILOT-03). wp-env uses COD/cheque by default.
    },
  );
});
