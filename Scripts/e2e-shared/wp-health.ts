import type { APIRequestContext } from '@playwright/test';

import type { E2eEnv } from './e2e-env';

export async function isWordPressUp(request: APIRequestContext, wpUrl: string): Promise<boolean> {
  try {
    const res = await request.get(`${wpUrl}/wp-json/`, { timeout: 10_000 });
    return res.ok();
  } catch {
    return false;
  }
}

export async function isGraphqlUp(
  request: APIRequestContext,
  graphqlEndpoint: string,
): Promise<boolean> {
  try {
    const res = await request.post(graphqlEndpoint, {
      data: { query: '{ __typename }' },
      headers: { 'Content-Type': 'application/json' },
      timeout: 15_000,
    });
    if (!res.ok()) return false;
    const body = (await res.json()) as { data?: { __typename?: string } };
    return body.data?.__typename === 'RootQuery';
  } catch {
    return false;
  }
}

export async function isStoreApiCartUp(
  request: APIRequestContext,
  cartUrl: string,
): Promise<boolean> {
  try {
    const res = await request.get(cartUrl, { timeout: 15_000 });
    return res.ok();
  } catch {
    return false;
  }
}

export async function probeWave0Backends(
  request: APIRequestContext,
  env: E2eEnv,
): Promise<{ wp: boolean; graphql: boolean; storeApi: boolean }> {
  const [wp, graphql, storeApi] = await Promise.all([
    isWordPressUp(request, env.wpUrl),
    isGraphqlUp(request, env.graphqlEndpoint),
    isStoreApiCartUp(request, env.storeApiCartUrl),
  ]);
  return { wp, graphql, storeApi };
}

export function formatBackendProbeFailure(probe: {
  wp: boolean;
  graphql: boolean;
  storeApi: boolean;
}): string {
  const parts: string[] = [];
  if (!probe.wp) parts.push('WordPress (wp-json)');
  if (!probe.graphql) parts.push('WPGraphQL');
  if (!probe.storeApi) parts.push('WC Store API cart');
  return parts.join(', ');
}
