import { describe, expect, it } from 'vitest';
import { weaveTag } from '../cache-tags';

describe('weaveTag (ADR-0004 cache tag taxonomy)', () => {
  it('page(slug) returns weave:page:{slug}', () => {
    expect(weaveTag.page('home')).toBe('weave:page:home');
  });

  it('page(slug) preserves hyphenated slugs', () => {
    expect(weaveTag.page('about-us')).toBe('weave:page:about-us');
  });

  it('pageList() returns weave:page:list', () => {
    expect(weaveTag.pageList()).toBe('weave:page:list');
  });

  it('is a pure module — imports nothing from next/server-only/client-only', async () => {
    // The cache-tags module must be barrel-safe: importing it must not pull in
    // any framework runtime. This import resolves with no next/* mock present.
    const mod = await import('../cache-tags');
    expect(typeof mod.weaveTag.page).toBe('function');
    expect(typeof mod.weaveTag.pageList).toBe('function');
  });
});
