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

  return { get, set, store };
}

export type MockCookieJar = ReturnType<typeof createMockCookieJar>;

export function mockNextHeaders(jar: MockCookieJar) {
  vi.mock('next/headers', () => ({
    cookies: vi.fn(async () => jar),
  }));
}
