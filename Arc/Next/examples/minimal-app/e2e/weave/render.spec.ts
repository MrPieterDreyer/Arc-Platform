import {
  buildE2eWeavePageConfig,
  E2E_WEAVE_BODY_TEXT,
  E2E_WEAVE_HEADING_TEXT,
  E2E_WEAVE_PAGE_SLUG,
  putWeavePageConfig,
} from '../../../../../../Scripts/e2e-shared/wp-weave-page';
import { getE2eEnv } from '../../../../../../Scripts/e2e-shared/e2e-env';
import { assertNoRawApiErrors } from '../../../../../../Scripts/e2e-shared/design-assertions';

import { expect, test } from '../fixtures/backend';

test.describe('Wave 4 — Weave CMS render @regression', () => {
  test.beforeEach(async ({ request, backendReady }) => {
    expect(backendReady.wp).toBe(true);
    const env = getE2eEnv();
    await putWeavePageConfig(request, env, E2E_WEAVE_PAGE_SLUG, buildE2eWeavePageConfig());
  });

  test('renders sections from weave/v1 config in order @regression', async ({ page }) => {
    const res = await page.goto(`/weave/${E2E_WEAVE_PAGE_SLUG}`);
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByTestId('weave-page')).toBeVisible();
    await expect(page.getByTestId('weave-section-heading')).toHaveText(E2E_WEAVE_HEADING_TEXT);
    await expect(page.getByTestId('weave-section-body')).toHaveText(E2E_WEAVE_BODY_TEXT);

    const order = await page.getByTestId('weave-sections').evaluate((root) => {
      const heading = root.querySelector('[data-testid="weave-section-heading"]');
      const body = root.querySelector('[data-testid="weave-section-body"]');
      if (!heading || !body) return false;
      return (
        heading.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING &&
        !(body.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING)
      );
    });
    expect(order).toBe(true);

    await assertNoRawApiErrors(page);
  });

  test('unknown slug shows not-found copy @regression', async ({ page }) => {
    const res = await page.goto('/weave/does-not-exist-arc-weave-e2e');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByTestId('weave-page-not-found')).toBeVisible();
  });
});
