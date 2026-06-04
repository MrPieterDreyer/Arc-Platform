import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';

export interface RevalidateWebhookBody {
  event: string;
  tag: string;
  timestamp: string;
}

export interface CreateRevalidateHandlerOptions {
  secret: string;
  allowedTagPrefixes?: string[];
  /** Optional App Router path to purge when a tag is revalidated (e.g. PDP HTML shell). */
  revalidatePathForTag?: (tag: string) => string | undefined;
}

const SIGNATURE_HEADER = 'x-weave-signature';
const TIMESTAMP_HEADER = 'x-weave-timestamp';
const REPLAY_WINDOW_MS = 5 * 60 * 1000;

function signBody(secret: string, rawBody: string): string {
  const digest = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  return `sha256=${digest}`;
}

function verifySignature(secret: string, rawBody: string, signature: string): boolean {
  const expected = signBody(secret, rawBody);
  const expectedBuf = Buffer.from(expected, 'utf8');
  const actualBuf = Buffer.from(signature, 'utf8');
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}

function parseTimestampMs(value: string): number | null {
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function isTagAllowed(tag: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => tag.startsWith(prefix));
}

/**
 * Factory for a Next.js Route Handler `POST` that validates HMAC webhooks (ADR-0007)
 * and calls `revalidateTag(tag, 'max')`.
 */
export function createRevalidateHandler(options: CreateRevalidateHandlerOptions) {
  const prefixes = options.allowedTagPrefixes ?? ['arc:', 'weave:'];

  return async function POST(req: Request): Promise<Response> {
    const signature = req.headers.get(SIGNATURE_HEADER);
    const headerTimestamp = req.headers.get(TIMESTAMP_HEADER);
    if (!signature || !headerTimestamp) {
      return Response.json({ error: 'Missing signature headers' }, { status: 401 });
    }

    const rawBody = await req.text();
    if (!verifySignature(options.secret, rawBody, signature)) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const headerMs = parseTimestampMs(headerTimestamp);
    if (headerMs === null || Math.abs(Date.now() - headerMs) > REPLAY_WINDOW_MS) {
      return Response.json({ error: 'Timestamp outside replay window' }, { status: 401 });
    }

    let body: RevalidateWebhookBody;
    try {
      body = JSON.parse(rawBody) as RevalidateWebhookBody;
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body.tag || typeof body.tag !== 'string') {
      return Response.json({ error: 'Missing tag' }, { status: 400 });
    }

    if (!body.timestamp || body.timestamp !== headerTimestamp) {
      return Response.json({ error: 'Timestamp mismatch' }, { status: 401 });
    }

    const bodyMs = parseTimestampMs(body.timestamp);
    if (bodyMs === null || Math.abs(Date.now() - bodyMs) > REPLAY_WINDOW_MS) {
      return Response.json({ error: 'Body timestamp outside replay window' }, { status: 401 });
    }

    if (!isTagAllowed(body.tag, prefixes)) {
      return Response.json({ error: 'Tag prefix not allowed' }, { status: 400 });
    }

    revalidateTag(body.tag, 'max');
    const path = options.revalidatePathForTag?.(body.tag);
    if (path) {
      revalidatePath(path);
    }
    return Response.json({ revalidated: true });
  };
}
