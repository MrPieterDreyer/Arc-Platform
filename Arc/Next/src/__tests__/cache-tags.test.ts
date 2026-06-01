import { describe, expect, it } from 'vitest';
import { arcTag } from '../cache-tags.js';

describe('ARC-NEXT-04 — cache tag taxonomy', () => {
  it('matches ADR-0004 literals', () => {
    expect(arcTag.product('foo')).toBe('arc:product:foo');
    expect(arcTag.productList()).toBe('arc:product:list');
    expect(arcTag.collection('shoes')).toBe('arc:collection:shoes');
    expect(arcTag.collectionList()).toBe('arc:collection:list');
    expect(arcTag.cart()).toBe('arc:cart');
  });
});
