import { describe, expect, it } from 'vitest';
import { weaveTag } from '../index';

describe('@weave-platform/next smoke', () => {
  it('exports weave cache tags', () => {
    expect(weaveTag.page('about')).toBe('weave:page:about');
  });
});
