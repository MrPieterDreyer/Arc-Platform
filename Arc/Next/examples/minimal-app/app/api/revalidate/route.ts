import { createRevalidateHandler, WEAVE_WEBHOOK_SECRET_ENV } from '@arc/next/server';

const DEV_PLACEHOLDER_SECRET = 'dev-placeholder-secret-min-32-chars!!';
const configured = process.env[WEAVE_WEBHOOK_SECRET_ENV];
const hasRealSecret = Boolean(configured && configured.length > 0);

// Warn once at module load in non-production when no secret is configured.
// We do NOT throw here: a top-level throw would break `next build` (page-data
// collection evaluates this module) in any environment that hasn't set the
// secret, e.g. CI. Failing closed happens at request time instead (see POST).
if (!hasRealSecret && process.env.NODE_ENV !== 'production') {
  console.warn(
    `[revalidate] ${WEAVE_WEBHOOK_SECRET_ENV} is not set — using an insecure dev ` +
      'placeholder secret. This must never be used in production.',
  );
}

const handler = createRevalidateHandler({
  secret: hasRealSecret ? (configured as string) : DEV_PLACEHOLDER_SECRET,
  revalidatePathForTag: (tag) =>
    tag.startsWith('arc:product:') ? `/products/${tag.slice('arc:product:'.length)}` : undefined,
});

export async function POST(request: Request): Promise<Response> {
  // Fail closed at request time: never process a real webhook with the public
  // placeholder secret in production. The build still succeeds with no secret;
  // only an actual request is rejected.
  if (!hasRealSecret && process.env.NODE_ENV === 'production') {
    return new Response(
      JSON.stringify({
        error: `${WEAVE_WEBHOOK_SECRET_ENV} is not configured. Refusing to process webhooks with a public placeholder secret. Generate one with: openssl rand -hex 32`,
      }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    );
  }
  return handler(request);
}
