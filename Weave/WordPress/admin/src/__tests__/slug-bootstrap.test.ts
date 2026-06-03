/**
 * `resolveSlug()` — the `?slug=` editor bootstrap (WEAVE-WP-07, OQ3).
 *
 * The admin editor targets one page, chosen by the `?slug=` query arg, defaulting to `home`. This
 * locks that contract: explicit slug honored, hyphenated slugs preserved, and BOTH a missing and a
 * present-but-empty `?slug=` fall back to `home` (an empty slug is never a valid page target).
 *
 * Importing `../index` runs its `mountEditor()` once at module load; it is a guarded no-op when
 * `#weave-editor-root` is absent (it is, under jsdom), so the import is side-effect-free here.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { resolveSlug } from '../index';

function setSearch(search: string): void {
  window.history.pushState({}, '', `/wp-admin/admin.php?page=weave-editor${search}`);
}

afterEach(() => {
  window.history.pushState({}, '', '/');
});

describe('resolveSlug (OQ3) — ?slug bootstrap', () => {
  it('returns the slug from ?slug=', () => {
    setSearch('&slug=about');
    expect(resolveSlug()).toBe('about');
  });

  it('preserves hyphenated slugs', () => {
    setSearch('&slug=about-us');
    expect(resolveSlug()).toBe('about-us');
  });

  it("defaults to 'home' when ?slug is absent", () => {
    setSearch('');
    expect(resolveSlug()).toBe('home');
  });

  it("defaults to 'home' for a present-but-empty ?slug=", () => {
    setSearch('&slug=');
    expect(resolveSlug()).toBe('home');
  });
});
