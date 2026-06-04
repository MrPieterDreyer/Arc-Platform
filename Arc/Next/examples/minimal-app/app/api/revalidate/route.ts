import { createRevalidateHandler, WEAVE_WEBHOOK_SECRET_ENV } from '@arc/next/server';

const configured = process.env[WEAVE_WEBHOOK_SECRET_ENV];
const secret =
  configured && configured.length > 0 ? configured : 'dev-placeholder-secret-min-32-chars!!';

export const POST = createRevalidateHandler({
  secret,
  revalidatePathForTag: (tag) =>
    tag.startsWith('arc:product:') ? `/products/${tag.slice('arc:product:'.length)}` : undefined,
});
