import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { weaveTag } from '../cache-tags.js';
import { revalidatePathMock, revalidateTagMock } from './__mocks__/next-cache.js';

vi.mock('next/cache', () => ({
  revalidateTag: revalidateTagMock,
  revalidatePath: revalidatePathMock,
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

/** Sign the EXACT string POSTed (byte parity with the 4a signer — Pitfall 4). */
function sign(secret: string, body: string): string {
  return `sha256=${createHmac('sha256', secret).update(body, 'utf8').digest('hex')}`;
}

describe('WEAVE-NEXT-04 — createWeaveRevalidateHandler (pins weave: prefix)', () => {
  const secret = 'weave-test-secret-32-bytes-min!!';

  beforeEach(() => {
    revalidateTagMock.mockClear();
    revalidatePathMock.mockClear();
  });

  it('valid signature + weave: tag calls revalidateTag(weave:page:home, max) and returns 200', async () => {
    const { createWeaveRevalidateHandler } = await import('../revalidate.js');
    const POST = createWeaveRevalidateHandler({ secret });
    const timestamp = new Date().toISOString();
    const body = JSON.stringify({
      event: 'page.updated',
      tag: weaveTag.page('home'),
      timestamp,
    });

    const res = await POST(
      new Request('http://localhost/api/revalidate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-weave-signature': sign(secret, body),
          'x-weave-timestamp': timestamp,
        },
        body,
      }),
    );

    expect(res.status).toBe(200);
    expect(revalidateTagMock).toHaveBeenCalledWith('weave:page:home', 'max');
  });

  it('rejects an arc: prefix (allowed by @arc/next defaults, NOT by our pin) with 400', async () => {
    const { createWeaveRevalidateHandler } = await import('../revalidate.js');
    const POST = createWeaveRevalidateHandler({ secret });
    const timestamp = new Date().toISOString();
    const body = JSON.stringify({
      event: 'product.updated',
      tag: 'arc:product:foo',
      timestamp,
    });

    const res = await POST(
      new Request('http://localhost/api/revalidate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-weave-signature': sign(secret, body),
          'x-weave-timestamp': timestamp,
        },
        body,
      }),
    );

    expect(res.status).toBe(400);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('rejects a tampered signature with 401', async () => {
    const { createWeaveRevalidateHandler } = await import('../revalidate.js');
    const POST = createWeaveRevalidateHandler({ secret });
    const timestamp = new Date().toISOString();
    const body = JSON.stringify({
      event: 'page.updated',
      tag: weaveTag.page('home'),
      timestamp,
    });

    const res = await POST(
      new Request('http://localhost/api/revalidate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-weave-signature': sign(secret, '{"tag":"evil"}'),
          'x-weave-timestamp': timestamp,
        },
        body,
      }),
    );

    expect(res.status).toBe(401);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('rejects missing signature/timestamp headers with 401', async () => {
    const { createWeaveRevalidateHandler } = await import('../revalidate.js');
    const POST = createWeaveRevalidateHandler({ secret });
    const timestamp = new Date().toISOString();
    const body = JSON.stringify({
      event: 'page.updated',
      tag: weaveTag.page('home'),
      timestamp,
    });

    const res = await POST(
      new Request('http://localhost/api/revalidate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      }),
    );

    expect(res.status).toBe(401);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });
});
