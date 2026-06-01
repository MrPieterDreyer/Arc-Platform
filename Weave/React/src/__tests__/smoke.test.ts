import { describe, expect, it } from 'vitest';
import { __WEAVE_REACT_VERSION } from '../index';

describe('@weave/react smoke', () => {
  it('exports a version sentinel', () => {
    expect(__WEAVE_REACT_VERSION).toBe('0.0.1');
  });

  it('runs under the node default environment (no DOM)', () => {
    // The package default env is `node` (mirrors @arc/core). jsdom is scoped
    // to the boundary test glob only — see vitest.config.ts.
    expect(typeof document).toBe('undefined');
  });
});
