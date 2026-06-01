import { describe, expect, it } from 'vitest';
import type { ComponentType } from 'react';
import {
  type WeaveComponentEntry,
  getSection,
  listSections,
  registerSection,
  registry,
} from '../../registry/registry';
import type { WeaveComponentSchema } from '../../schema/types';

/**
 * SDK-03: the registry is a `globalThis`-keyed `Map` shared across module instances so a
 * section registered in one bundler chunk is visible to a `<SectionRenderer>` in another
 * (RESEARCH §Pattern 2, §Pitfall 3). The Map is keyed by `Symbol.for('@weave/react.registry')`.
 */

const REG_KEY = Symbol.for('@weave/react.registry');

/** A trivial component + schema entry for registration assertions. */
function makeEntry(type: string): WeaveComponentEntry {
  const Component: ComponentType<Record<string, unknown>> = () => null;
  const schema: WeaveComponentSchema = { type, title: type, inspector: [] };
  return { component: Component, schema };
}

describe('registry', () => {
  it('registerSection then getSection returns the same entry', () => {
    const entry = makeEntry('hero');
    registerSection('hero', entry);
    expect(getSection('hero')).toBe(entry);
  });

  it('getSection returns undefined for an unknown type (never throws)', () => {
    expect(getSection('does-not-exist')).toBeUndefined();
  });

  it('listSections returns all registered types', () => {
    registerSection('alpha', makeEntry('alpha'));
    registerSection('beta', makeEntry('beta'));
    const types = listSections();
    expect(types).toContain('alpha');
    expect(types).toContain('beta');
  });

  it('is the SAME Map instance keyed on globalThis (singleton across chunks)', () => {
    expect(registry).toBe((globalThis as Record<symbol, unknown>)[REG_KEY]);
  });
});
