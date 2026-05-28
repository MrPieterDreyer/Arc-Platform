import { describe, expect, it } from 'vitest';
import { __ARC_NEXT_VERSION } from '../index';

describe('@arc/next smoke', () => {
  it('exports a version sentinel', () => {
    expect(__ARC_NEXT_VERSION).toBe('0.0.1');
  });
});
