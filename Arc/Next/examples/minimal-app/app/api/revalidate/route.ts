import { createRevalidateHandler, WEAVE_WEBHOOK_SECRET_ENV } from '@arc/next/server';

const secret = process.env[WEAVE_WEBHOOK_SECRET_ENV];

export const POST = createRevalidateHandler({
  secret: secret ?? 'dev-placeholder-secret-min-32-chars!!',
});
