import { describe, expect, it } from 'vitest';
import { __WEAVE_NEXT_VERSION } from '../index';

describe('@weave/next smoke', () => {
  it('exports a version sentinel', () => {
    expect(__WEAVE_NEXT_VERSION).toBe('0.0.1');
  });
});
