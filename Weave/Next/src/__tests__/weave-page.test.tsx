import type { ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineSection } from '@weave-platform/react';
import type { WeaveComponentSchema, WeavePageConfig } from '@weave-platform/react';

// --- Fixture config: 2 sections in a known order (A before B) ---------------------------------
// Mocking the loader keeps this test free of next/cache + fetch concerns (Plan 02 covers those).

const M = { a: 'WP-MARK-alpha', b: 'WP-MARK-beta' } as const;

const CONFIG: WeavePageConfig = {
  schemaVersion: 1,
  slug: 'home',
  sections: [
    { id: 'wp-a', type: 'wp-alpha', data: { text: M.a }, version: 1 },
    { id: 'wp-b', type: 'wp-beta', data: { text: M.b }, version: 1 },
  ],
  updatedAt: '2026-06-01T00:00:00Z',
};

const loadPageConfig = vi.hoisted(() => vi.fn());
vi.mock('../load-page-config.js', () => ({ loadPageConfig }));

// Two trivial sections registered via defineSection (module-scope = "side-effect import" stand-in).
interface AlphaProps extends Record<string, unknown> {
  text: string;
}
const Alpha: ComponentType<AlphaProps> = ({ text }) => <div>{text}</div>;
const alphaSchema: WeaveComponentSchema<AlphaProps> = {
  type: 'wp-alpha',
  title: 'Alpha',
  inspector: [{ group: 'Content', inputs: [{ type: 'text', name: 'text', label: 'Text' }] }],
};
defineSection(Alpha, alphaSchema);

interface BetaProps extends Record<string, unknown> {
  text: string;
}
const Beta: ComponentType<BetaProps> = ({ text }) => <div>{text}</div>;
const betaSchema: WeaveComponentSchema<BetaProps> = {
  type: 'wp-beta',
  title: 'Beta',
  inspector: [{ group: 'Content', inputs: [{ type: 'text', name: 'text', label: 'Text' }] }],
};
defineSection(Beta, betaSchema);

describe('WEAVE-NEXT-02 — <WeavePage>', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadPageConfig.mockResolvedValue(CONFIG);
  });

  it('loads the config for the slug and renders its sections in array order', async () => {
    const { WeavePage } = await import('../weave-page.js');

    const el = await WeavePage({ slug: 'home' });
    const html = renderToStaticMarkup(el);

    expect(loadPageConfig).toHaveBeenCalledTimes(1);
    expect(loadPageConfig).toHaveBeenCalledWith('home');

    expect(html).toContain(M.a);
    expect(html).toContain(M.b);
    // Array order: section A's marker precedes section B's marker in the rendered markup.
    expect(html.indexOf(M.a)).toBeLessThan(html.indexOf(M.b));
  });
});
