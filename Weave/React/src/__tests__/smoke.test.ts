import { describe, expect, it } from 'vitest';
import { SectionRenderer, defineSection, getSection } from '../index';

describe('@weave/react smoke', () => {
  it('exports the public API surface', () => {
    expect(typeof SectionRenderer).toBe('function');
    expect(typeof defineSection).toBe('function');
    expect(typeof getSection).toBe('function');
  });

  it('runs under the node default environment (no DOM)', () => {
    // The package default env is `node` (mirrors @arc/core). jsdom is scoped
    // to the boundary test glob only — see vitest.config.ts.
    expect(typeof document).toBe('undefined');
  });
});
