import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { revalidatePathMock, revalidateTagMock } from './__mocks__/next-cache.js';

vi.mock('next/cache', () => ({
  revalidateTag: revalidateTagMock,
  revalidatePath: revalidatePathMock,
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

function sign(secret: string, body: string): string {
  return `sha256=${createHmac('sha256', secret).update(body, 'utf8').digest('hex')}`;
}

describe('ARC-NEXT-05 — revalidate webhook handler', () => {
  const secret = 'test-secret-32-bytes-minimum!!!!';

  beforeEach(() => {
    revalidateTagMock.mockClear();
    revalidatePathMock.mockClear();
  });

  it('valid signature calls revalidateTag(tag, max)', async () => {
    const { createRevalidateHandler } = await import('../revalidate.js');
    const POST = createRevalidateHandler({ secret });
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

    expect(res.status).toBe(200);
    expect(revalidateTagMock).toHaveBeenCalledWith('arc:product:foo', 'max');
  });

  it('revalidatePathForTag runs after tag revalidation', async () => {
    const { createRevalidateHandler } = await import('../revalidate.js');
    const POST = createRevalidateHandler({
      secret,
      revalidatePathForTag: (tag) =>
        tag.startsWith('arc:product:')
          ? `/products/${tag.slice('arc:product:'.length)}`
          : undefined,
    });
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

    expect(res.status).toBe(200);
    expect(revalidatePathMock).toHaveBeenCalledWith('/products/foo');
  });

  it('rejects tampered body with 401', async () => {
    const { createRevalidateHandler } = await import('../revalidate.js');
    const POST = createRevalidateHandler({ secret });
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
          'x-weave-signature': sign(secret, '{"tag":"evil"}'),
          'x-weave-timestamp': timestamp,
        },
        body,
      }),
    );

    expect(res.status).toBe(401);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('rejects disallowed tag prefix with 400', async () => {
    const { createRevalidateHandler } = await import('../revalidate.js');
    const POST = createRevalidateHandler({ secret });
    const timestamp = new Date().toISOString();
    const body = JSON.stringify({
      event: 'evil',
      tag: 'evil:foo',
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
});
