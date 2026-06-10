import { type Mock, vi } from 'vitest';

/** Spy for `cacheTag` — verify export names against `next/cache` when upgrading Next. */
export const cacheTagMock: Mock = vi.fn();

/** Spy for `revalidateTag` — must support two-arg `(tag, 'max')` per Pitfall 5. */
export const revalidateTagMock: Mock = vi.fn();

export const revalidatePathMock: Mock = vi.fn();

// NOTE: never wrap `vi.mock` in an exported helper here. Vitest hoists vi.mock
// calls to the top of THIS module on import, so a helper-scoped factory closes
// over parameters that don't exist at hoisted position and silently overrides
// every test file's own next/* registration. Each test file declares its own
// top-level `vi.mock('next/cache', …)` using these spies.
