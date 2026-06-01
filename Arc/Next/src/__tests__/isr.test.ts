import { describe, expect, it } from 'vitest';
import { ARC_CACHE_PROFILE } from '../isr.js';

describe('ARC-NEXT-06 — ISR cache profiles', () => {
  it('exports stable cacheLife profile names for Pilot', () => {
    expect(ARC_CACHE_PROFILE).toEqual({
      product: 'hours',
      collection: 'hours',
      pageConfig: 'minutes',
    });
  });
});
