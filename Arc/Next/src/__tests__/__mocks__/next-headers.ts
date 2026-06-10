import { vi } from 'vitest';

export type MockCookieOptions = {
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;
  path?: string;
  maxAge?: number;
};

export type MockCookieEntry = {
  name: string;
  value: string;
  options?: MockCookieOptions;
};

export function createMockCookieJar() {
  const store = new Map<string, MockCookieEntry>();

  const get = vi.fn((name: string) => {
    const entry = store.get(name);
    if (!entry) return undefined;
    return { name: entry.name, value: entry.value };
  });

  const set = vi.fn((name: string, value: string, options?: MockCookieOptions) => {
    store.set(name, { name, value, options });
  });

  const del = vi.fn((name: string) => {
    store.delete(name);
  });

  return { get, set, delete: del, store };
}

export type MockCookieJar = ReturnType<typeof createMockCookieJar>;

// NOTE: never wrap `vi.mock` in an exported helper here. Vitest hoists vi.mock
// calls to the top of THIS module on import — the factory then references the
// `jar` parameter at a position where it doesn't exist (ReferenceError) and
// overrides every test file's own next/headers registration. Each test file
// declares its own top-level `vi.mock('next/headers', …)` around its jar.
