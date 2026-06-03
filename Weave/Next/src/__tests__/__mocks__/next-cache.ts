import { type Mock, vi } from 'vitest';

/** Spy for `cacheTag` — verify export names against `next/cache` when upgrading Next. */
export const cacheTagMock: Mock = vi.fn();

/** Spy for `revalidateTag` — must support two-arg `(tag, 'max')` per Pitfall 5. */
export const revalidateTagMock: Mock = vi.fn();

export const revalidatePathMock: Mock = vi.fn();

export function mockNextCache() {
  vi.mock('next/cache', () => ({
    cacheTag: cacheTagMock,
    revalidateTag: revalidateTagMock,
    revalidatePath: revalidatePathMock,
    unstable_cacheTag: cacheTagMock,
    unstable_cacheLife: vi.fn(),
    cacheLife: vi.fn(),
  }));
}
