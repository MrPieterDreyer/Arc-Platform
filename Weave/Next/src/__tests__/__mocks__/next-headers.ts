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

/**
 * Controllable `draftMode()` double. `isEnabled` is a static boolean (set at
 * creation); `enable`/`disable` are spies so callers can assert toggling.
 */
export function createMockDraftMode(initial = false) {
  return { isEnabled: initial, enable: vi.fn(), disable: vi.fn() };
}

export type MockDraftMode = ReturnType<typeof createMockDraftMode>;

/**
 * Registers a `next/headers` mock exposing `cookies` (backed by `jar`) and an
 * async `draftMode`. Pass a `draft` from `createMockDraftMode` to control the
 * `isEnabled` flag; omit it to default to a disabled draft mode.
 */
export function mockNextHeaders(jar: MockCookieJar, draft?: MockDraftMode) {
  vi.mock('next/headers', () => ({
    cookies: vi.fn(async () => jar),
    draftMode: vi.fn(async () => draft ?? { isEnabled: false, enable: vi.fn(), disable: vi.fn() }),
  }));
}
