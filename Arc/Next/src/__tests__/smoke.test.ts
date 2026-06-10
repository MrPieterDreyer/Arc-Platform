import { describe, expect, it } from 'vitest';
import { arcTag, ARC_CART_TOKEN_COOKIE } from '../index.js';

describe('@arc-platform/next smoke', () => {
  it('exports barrel-safe cache helpers', () => {
    expect(arcTag.product('demo')).toBe('arc:product:demo');
    expect(ARC_CART_TOKEN_COOKIE).toBe('arc_cart_token');
  });
});
