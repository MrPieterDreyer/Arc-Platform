import { createHmac } from 'node:crypto';

/** Matches minimal-app `app/api/revalidate/route.ts` dev fallback when env unset. */
export const DEV_WEBHOOK_SECRET = 'dev-placeholder-secret-min-32-chars!!';

export function getWebhookSecret(): string {
  const secret = process.env.WEAVE_WEBHOOK_SECRET;
  return secret && secret.length > 0 ? secret : DEV_WEBHOOK_SECRET;
}

export interface SignedRevalidateWebhook {
  body: string;
  signature: string;
  timestamp: string;
}

/** Wire format for `createRevalidateHandler` (ADR-0007) — matches Weave WP plugin. */
export function signRevalidateWebhook(
  secret: string,
  tag: string,
  event = 'product.updated',
): SignedRevalidateWebhook {
  const timestamp = new Date().toISOString();
  const body = JSON.stringify({ event, tag, timestamp });
  const signature = `sha256=${createHmac('sha256', secret).update(body, 'utf8').digest('hex')}`;
  return { body, signature, timestamp };
}
