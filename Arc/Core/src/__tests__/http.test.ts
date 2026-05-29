import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isWooError, sleep, withRetry } from '../http';

// ---------------------------------------------------------------------------
// isWooError
// ---------------------------------------------------------------------------

describe('isWooError', () => {
  it('returns true for a valid WooApiError shape', () => {
    expect(
      isWooError({ code: 'some_error', message: 'Something went wrong', data: { status: 400 } }),
    ).toBe(true);
  });

  it('returns false when code is missing', () => {
    expect(isWooError({ message: 'oops', data: { status: 400 } })).toBe(false);
  });

  it('returns false when data is missing', () => {
    expect(isWooError({ code: 'err', message: 'oops' })).toBe(false);
  });

  it('returns false when data.status is not a number', () => {
    expect(isWooError({ code: 'err', message: 'oops', data: { status: '400' } })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isWooError(null)).toBe(false);
  });

  it('returns false for a string', () => {
    expect(isWooError('error')).toBe(false);
  });

  it('returns false for a number', () => {
    expect(isWooError(42)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sleep
// ---------------------------------------------------------------------------

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves after the specified delay', async () => {
    let resolved = false;
    const p = sleep(1000).then(() => {
      resolved = true;
    });
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1000);
    await p;
    expect(resolved).toBe(true);
  });

  it('does not resolve before the delay', async () => {
    let resolved = false;
    const p = sleep(1000).then(() => {
      resolved = true;
    });
    await vi.advanceTimersByTimeAsync(500);
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(500);
    await p;
    expect(resolved).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// withRetry
// ---------------------------------------------------------------------------

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the value immediately on success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { maxAttempts: 3, baseDelay: 100 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on 5xx errors and succeeds on the third attempt', async () => {
    const serverError = Object.assign(new Error('Server Error'), { status: 500 });
    const fn = vi
      .fn()
      .mockRejectedValueOnce(serverError)
      .mockRejectedValueOnce(serverError)
      .mockResolvedValueOnce('recovered');

    const promise = withRetry(fn, { maxAttempts: 3, baseDelay: 100 });
    // Advance through both retry delays in one shot
    await vi.advanceTimersByTimeAsync(300);
    const result = await promise;
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after exhausting all attempts on persistent 5xx', async () => {
    const serverError = Object.assign(new Error('Server Error'), { status: 503 });
    const fn = vi.fn().mockRejectedValue(serverError);

    // Attach rejects assertion FIRST, then advance timers
    const assertion = expect(withRetry(fn, { maxAttempts: 3, baseDelay: 100 })).rejects.toMatchObject({ status: 503 });
    await vi.advanceTimersByTimeAsync(300);
    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does NOT retry on 4xx errors', async () => {
    const clientError = Object.assign(new Error('Bad Request'), { status: 400 });
    const fn = vi.fn().mockRejectedValue(clientError);

    await expect(withRetry(fn, { maxAttempts: 3, baseDelay: 100 })).rejects.toMatchObject({
      status: 400,
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry on non-HTTP errors', async () => {
    const fn = vi.fn().mockRejectedValue(new TypeError('Network failure'));
    await expect(withRetry(fn)).rejects.toBeInstanceOf(TypeError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('uses default maxAttempts=3 and baseDelay=1000', async () => {
    const serverError = Object.assign(new Error('err'), { status: 500 });
    const fn = vi.fn().mockRejectedValue(serverError);

    // Attach rejects assertion FIRST, then advance timers
    const assertion = expect(withRetry(fn)).rejects.toBeDefined();
    await vi.advanceTimersByTimeAsync(3000);
    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
