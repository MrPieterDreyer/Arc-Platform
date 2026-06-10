import { getE2eEnv } from '../../../../../../Scripts/e2e-shared/e2e-env';

import { expect, test } from '../fixtures/backend';

test.describe('Wave 0 — platform health', () => {
  test('WordPress REST index responds @smoke', async ({ request, backendReady }) => {
    const { wpUrl } = getE2eEnv();
    expect(backendReady.wp).toBe(true);
    const res = await request.get(`${wpUrl}/wp-json/`);
    expect(res.ok()).toBeTruthy();
  });

  test('WPGraphQL answers introspection @smoke', async ({ request, backendReady }) => {
    const { graphqlEndpoint } = getE2eEnv();
    expect(backendReady.graphql).toBe(true);
    const res = await request.post(graphqlEndpoint, {
      data: { query: '{ __typename }' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { data?: { __typename?: string } };
    expect(body.data?.__typename).toBe('RootQuery');
  });

  test('WC Store API cart GET succeeds @smoke', async ({ request, backendReady }) => {
    const { storeApiCartUrl } = getE2eEnv();
    expect(backendReady.storeApi).toBe(true);
    const res = await request.get(storeApiCartUrl);
    expect(res.ok()).toBeTruthy();
  });

  test('Next storefront home loads @smoke', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.ok()).toBeTruthy();
    await expect(
      page.getByRole('heading', { name: /@arc-platform\/next minimal app/i }),
    ).toBeVisible();
  });
});
