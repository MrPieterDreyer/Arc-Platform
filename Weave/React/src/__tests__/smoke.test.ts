import { describe, expect, it } from 'vitest';
import { __WEAVE_REACT_VERSION } from '../index';

describe('@weave/react smoke', () => {
  it('exports a version sentinel', () => {
    expect(__WEAVE_REACT_VERSION).toBe('0.0.1');
  });

  it('has access to a DOM (jsdom env)', () => {
    expect(typeof document).toBe('object');
    expect(typeof window).toBe('object');
  });
});
