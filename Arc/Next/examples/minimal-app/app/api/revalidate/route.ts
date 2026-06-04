import { createRevalidateHandler, WEAVE_WEBHOOK_SECRET_ENV } from '@arc/next/server';

const DEV_PLACEHOLDER_SECRET = 'dev-placeholder-secret-min-32-chars!!';
const configured = process.env[WEAVE_WEBHOOK_SECRET_ENV];

/**
 * Resolve the webhook secret, failing closed in production.
 *
 * A missing secret must never silently fall back to a public placeholder in a
 * deployed environment — that would accept any webhook signed with a known
 * string. In production we throw; in local dev we warn loudly and allow the
 * placeholder so the example app stays runnable.
 */
function resolveSecret(): string {
  if (configured && configured.length > 0) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `${WEAVE_WEBHOOK_SECRET_ENV} is not set. Refusing to start the revalidate route ` +
        'with a public placeholder secret in production. Generate one with: openssl rand -hex 32',
    );
  }
  console.warn(
    `[revalidate] ${WEAVE_WEBHOOK_SECRET_ENV} is not set — using an insecure dev placeholder ` +
      'secret. This must never be used in production.',
  );
  return DEV_PLACEHOLDER_SECRET;
}

const secret = resolveSecret();

export const POST = createRevalidateHandler({
  secret,
  revalidatePathForTag: (tag) =>
    tag.startsWith('arc:product:') ? `/products/${tag.slice('arc:product:'.length)}` : undefined,
});
