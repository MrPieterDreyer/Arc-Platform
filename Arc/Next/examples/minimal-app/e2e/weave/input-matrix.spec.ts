import {
  formatWeaveInputDefaultMarker,
  WEAVE_INPUT_MATRIX_CASES,
} from '../../../../../../Scripts/e2e-shared/weave-input-matrix';
import { assertNoRawApiErrors } from '../../../../../../Scripts/e2e-shared/design-assertions';

import { expect, test } from '@playwright/test';

const FIXTURE_PATH = '/e2e-fixtures/weave-inputs';

test.describe('Wave 5 — Weave input-type matrix @regression', () => {
  test.beforeEach(async ({ page }) => {
    const res = await page.goto(FIXTURE_PATH);
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByTestId('weave-input-matrix-page')).toBeVisible();
  });

  test('renders all 15 input types with registry defaults @regression', async ({ page }) => {
    expect(WEAVE_INPUT_MATRIX_CASES).toHaveLength(15);

    for (const matrixCase of WEAVE_INPUT_MATRIX_CASES) {
      const { type, expectedDefault } = matrixCase;
      await expect(page.getByTestId(`weave-input-${type}`)).toBeVisible();
      await expect(page.getByTestId(`weave-input-${type}-marker`)).toHaveText(
        formatWeaveInputDefaultMarker(expectedDefault),
      );
    }

    await assertNoRawApiErrors(page);
  });
});
