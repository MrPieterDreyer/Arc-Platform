import path from 'node:path';

import {
  getE2eEnv,
  repoRootFromPlaywrightConfig,
} from '../../../../../../Scripts/e2e-shared/e2e-env';
import {
  getWebhookSecret,
  signRevalidateWebhook,
} from '../../../../../../Scripts/e2e-shared/webhook-sign';
import { updateProductTitleViaWpCli } from '../../../../../../Scripts/e2e-shared/wp-cli-product';

import { expect, test } from '../fixtures/backend';

const configDir = path.resolve(__dirname, '../..');
const repoRoot = process.env.ARC_E2E_REPO_ROOT ?? repoRootFromPlaywrightConfig(configDir);
function testProductSlug(): string {
  return process.env.TEST_PRODUCT_SLUG ?? 'test-product';
}

function testProductId(): string {
  return process.env.TEST_PRODUCT_ID ?? '';
}

test.describe('Wave 1 — webhook → revalidateTag → PDP @integration', () => {
  test('rejects webhook without HMAC headers @integration', async ({ request }) => {
    const { storefrontUrl } = getE2eEnv();
    const res = await request.post(`${storefrontUrl}/api/revalidate`, {
      data: {
        event: 'product.updated',
        tag: 'arc:product:noop',
        timestamp: new Date().toISOString(),
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('signed webhook refreshes PDP after WP product rename @integration', async ({
    page,
    backendReady,
  }) => {
    test.setTimeout(90_000);
    const productId = testProductId();
    const productSlug = testProductSlug();
    test.skip(!productId, 'TEST_PRODUCT_ID required — run pnpm wp:setup');

    expect(backendReady.wp).toBe(true);
    expect(backendReady.graphql).toBe(true);

    const { storefrontUrl } = getE2eEnv();
    const secret = getWebhookSecret();
    const tag = `arc:product:${productSlug}`;
    const pdpPath = `/products/${productSlug}`;

    await page.goto(pdpPath);
    await expect(page.getByTestId('pdp-title')).toBeVisible();
    const baselineTitle = (await page.getByTestId('pdp-title').textContent())?.trim() ?? '';

    const freshName = `Arc E2E Revalidate ${Date.now()}`;
    updateProductTitleViaWpCli(repoRoot, productId, freshName);

    try {
      await page.reload();
      const titleAfterWpUpdate = (await page.getByTestId('pdp-title').textContent())?.trim();
      if (titleAfterWpUpdate !== freshName) {
        expect(titleAfterWpUpdate).toBe(baselineTitle);
      }

      const { body, signature, timestamp } = signRevalidateWebhook(secret, tag);
      const revalidateRes = await fetch(`${storefrontUrl}/api/revalidate`, {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
          'x-weave-signature': signature,
          'x-weave-timestamp': timestamp,
        },
      });
      const revalidateBody = await revalidateRes.text();
      expect(
        revalidateRes.ok,
        `revalidate POST ${revalidateRes.status}: ${revalidateBody}`,
      ).toBeTruthy();
      const json = JSON.parse(revalidateBody) as { revalidated?: boolean };
      expect(json.revalidated).toBe(true);

      await page.reload();
      await expect
        .poll(async () => (await page.getByTestId('pdp-title').textContent())?.trim(), {
          timeout: 30_000,
        })
        .toBe(freshName);
    } finally {
      updateProductTitleViaWpCli(repoRoot, productId, baselineTitle || 'Arc Test Simple Product');
    }
  });
});
