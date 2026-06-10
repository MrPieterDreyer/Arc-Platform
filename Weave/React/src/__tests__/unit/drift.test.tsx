import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentType } from 'react';
import { getSection } from '../../registry/registry';
import { __resetDriftWarnings, defineSection, warnOnDrift } from '../../schema/define-section';
import type { WeaveComponentSchema } from '../../schema/types';

/**
 * SDK-02 / D-03: `defineSection<TProps>(component, schema)` registers `type -> component` and
 * returns the component UNCHANGED (D-03b). `warnOnDrift` is the dev-only, warn-once drift check
 * the renderer calls; it emits the LOCKED `[@weave-platform/react]` strings from UI-SPEC §Console Contract.
 */

interface HeroProps extends Record<string, unknown> {
  heading: string;
}

/** Schema declaring exactly one input (`heading`) for the `hero` type. */
const heroSchema: WeaveComponentSchema<HeroProps> = {
  type: 'hero',
  title: 'Hero',
  inspector: [{ group: 'Content', inputs: [{ type: 'text', name: 'heading', label: 'Heading' }] }],
};

const Hero: ComponentType<HeroProps> = () => null;

beforeEach(() => {
  __resetDriftWarnings();
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.NODE_ENV;
});

describe('defineSection', () => {
  it('returns the SAME component reference (unchanged, D-03b)', () => {
    const out = defineSection(Hero, heroSchema);
    expect(out).toBe(Hero);
  });

  it('registers schema.type -> component', () => {
    defineSection(Hero, heroSchema);
    expect(getSection('hero')?.component).toBe(Hero);
  });
});

describe('warnOnDrift — locked console contract', () => {
  it('warns (verbatim) when a rendered prop has no matching schema input', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnOnDrift('hero', ['heading', 'extra'], heroSchema as WeaveComponentSchema);
    expect(spy).toHaveBeenCalledWith(
      '[@weave-platform/react] Section "hero": prop "extra" is rendered but has no matching schema input.',
    );
  });

  it('warns (verbatim) when a schema input has no matching component prop', () => {
    const driftSchema: WeaveComponentSchema = {
      type: 'hero',
      title: 'Hero',
      inspector: [
        {
          group: 'Content',
          inputs: [
            { type: 'text', name: 'heading', label: 'Heading' },
            { type: 'text', name: 'missingProp', label: 'Missing' },
          ],
        },
      ],
    };
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnOnDrift('hero', ['heading'], driftSchema);
    expect(spy).toHaveBeenCalledWith(
      '[@weave-platform/react] Section "hero": schema input "missingProp" has no matching component prop.',
    );
  });

  it('warns once per type — a second call for the same type is silent', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnOnDrift('hero', ['heading', 'extra'], heroSchema as WeaveComponentSchema);
    const afterFirst = spy.mock.calls.length;
    expect(afterFirst).toBeGreaterThan(0);
    warnOnDrift('hero', ['heading', 'extra'], heroSchema as WeaveComponentSchema);
    expect(spy.mock.calls.length).toBe(afterFirst);
  });

  it('emits nothing in production', () => {
    process.env.NODE_ENV = 'production';
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnOnDrift('hero', ['heading', 'extra'], heroSchema as WeaveComponentSchema);
    expect(spy).not.toHaveBeenCalled();
  });
});
