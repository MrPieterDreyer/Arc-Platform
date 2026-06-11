/**
 * @arc-platform/payment-stripe — resolveOrderSettlement unit tests (D-09)
 *
 * All tests use an injected `readStatus` and a no-op `sleep` so they run
 * instantly — no real timers. The `sleep` injection also proves D-09:
 * the function signature takes no Request / searchParams / redirect_status.
 */
import { describe, expect, it, vi } from 'vitest';
import { resolveOrderSettlement } from './settlement';

/** No-op sleep — resolves immediately so tests don't wait. */
const noSleep = (_ms: number): Promise<void> => Promise.resolve();

describe('resolveOrderSettlement', () => {
  it('returns settled:true when readStatus returns "processing"', async () => {
    const readStatus = vi.fn().mockResolvedValue('processing');
    const result = await resolveOrderSettlement(readStatus, {
      orderId: 42,
      timeoutMs: 5_000,
      sleep: noSleep,
    });
    expect(result.settled).toBe(true);
    expect(result.status).toBe('processing');
    expect(result.orderId).toBe(42);
  });

  it('returns settled:true when readStatus returns "completed"', async () => {
    const readStatus = vi.fn().mockResolvedValue('completed');
    const result = await resolveOrderSettlement(readStatus, {
      orderId: 99,
      timeoutMs: 5_000,
      sleep: noSleep,
    });
    expect(result.settled).toBe(true);
    expect(result.status).toBe('completed');
  });

  it('returns settled:false when status stays "pending" until timeout', async () => {
    // readStatus always returns 'pending' — the poller should give up and
    // return settled:false with the last-read status.
    const readStatus = vi.fn().mockResolvedValue('pending');
    const result = await resolveOrderSettlement(readStatus, {
      orderId: 7,
      timeoutMs: 100, // tiny timeout so the loop exits quickly
      sleep: noSleep,
    });
    expect(result.settled).toBe(false);
    expect(result.status).toBe('pending');
  });

  it('never throws — returns settled:false on persistent non-settled status', async () => {
    const readStatus = vi.fn().mockResolvedValue('on-hold');
    await expect(
      resolveOrderSettlement(readStatus, {
        orderId: 1,
        timeoutMs: 50,
        sleep: noSleep,
      }),
    ).resolves.toMatchObject({ settled: false });
  });

  it('settles immediately on first poll without sleeping when status is settled', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const readStatus = vi.fn().mockResolvedValue('processing');
    await resolveOrderSettlement(readStatus, {
      orderId: 5,
      timeoutMs: 10_000,
      sleep,
    });
    // Sleep should NOT have been called — we settled on the first read.
    expect(sleep).not.toHaveBeenCalled();
  });

  it('polls multiple times before settling', async () => {
    // First two reads return 'pending', third returns 'processing'.
    const readStatus = vi
      .fn()
      .mockResolvedValueOnce('pending')
      .mockResolvedValueOnce('pending')
      .mockResolvedValue('processing');
    const result = await resolveOrderSettlement(readStatus, {
      orderId: 3,
      timeoutMs: 30_000,
      sleep: noSleep,
    });
    expect(result.settled).toBe(true);
    expect(readStatus).toHaveBeenCalledTimes(3);
  });

  it('D-09: signature accepts no Request / searchParams / redirect_status parameter', () => {
    // This is a compile-time guarantee enforced by TypeScript.
    // At runtime we verify by inspecting the function's length (parameter count).
    // resolveOrderSettlement takes exactly 2 parameters: readStatus + args.
    expect(resolveOrderSettlement.length).toBe(2);
  });
});
