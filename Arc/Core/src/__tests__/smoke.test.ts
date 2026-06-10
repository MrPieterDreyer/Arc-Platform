import { describe, expect, it } from 'vitest';
import { __ARC_CORE_VERSION } from '../index';

describe('@arc-platform/core smoke', () => {
  it('exports a version sentinel', () => {
    expect(__ARC_CORE_VERSION).toBe('0.0.1');
  });
});
