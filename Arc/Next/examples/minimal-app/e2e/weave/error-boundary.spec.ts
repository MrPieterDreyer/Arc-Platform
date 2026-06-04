import {
  E2E_WEAVE_BODY_TEXT,
  E2E_WEAVE_HEADING_TEXT,
} from '../../../../../../Scripts/e2e-shared/wp-weave-page';
import { assertNoRawApiErrors } from '../../../../../../Scripts/e2e-shared/design-assertions';

import { expect, test } from '@playwright/test';

test.describe('Wave 5 — WEAVE-SDK-09 error boundary @regression', () => {
  test('broken sections are isolated; siblings still render @regression', async ({ page }) => {
    const res = await page.goto('/e2e-fixtures/weave-errors');
    expect(res?.ok()).toBeTruthy();

    await expect(page.getByTestId('weave-error-boundary-page')).toBeVisible();
    await expect(page.getByTestId('weave-section-heading')).toHaveText(E2E_WEAVE_HEADING_TEXT);
    await expect(page.getByTestId('weave-section-body')).toHaveText(E2E_WEAVE_BODY_TEXT);

    await assertNoRawApiErrors(page);
  });
});
