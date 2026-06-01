/**
 * Server-render integration test (Success Criterion #3, SDK-04 + SDK-09).
 *
 * This file is NOT matched by the jsdom glob in vitest.config.ts (only
 * `src/__tests__/boundary.test.tsx` is), so it runs in the NODE environment — exactly the
 * Server-Component-style harness Success Criterion #3 wants. We render with `react-dom/server`'s
 * `renderToStaticMarkup` (no DOM, no @testing-library).
 *
 * It proves:
 *   - 5 sections registered via `defineSection` (the module-scope side-effect-import stand-in)
 *     render in order from a `WeavePageConfig`.
 *   - An unknown section type does NOT crash the render (other markers still present).
 *   - A section with malformed `data` does NOT crash the render (other markers still present).
 */

import type { ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { WeaveComponentSchema } from '../../schema/types';
import { defineSection } from '../../schema/define-section';
import type { WeavePageConfig } from '../../schemas/page-config';
import { SectionRenderer } from '../../render/SectionRenderer';

// --- 5 tiny section components + schemas, registered via defineSection -------------------------
// Calling defineSection at module scope is the "side-effect import populates the registry" stand-in.

interface HeadingProps extends Record<string, unknown> {
  text: string;
}
const Heading: ComponentType<HeadingProps> = ({ text }) => <h2>{text}</h2>;
const headingSchema: WeaveComponentSchema<HeadingProps> = {
  type: 'sr-heading',
  title: 'Heading',
  inspector: [{ group: 'Content', inputs: [{ type: 'text', name: 'text', label: 'Text' }] }],
};
defineSection(Heading, headingSchema);

interface CountProps extends Record<string, unknown> {
  count: number;
}
const Count: ComponentType<CountProps> = ({ count }) => <span>count={count}</span>;
const countSchema: WeaveComponentSchema<CountProps> = {
  type: 'sr-count',
  title: 'Count',
  inspector: [{ group: 'Content', inputs: [{ type: 'number', name: 'count', label: 'Count' }] }],
};
defineSection(Count, countSchema);

interface FlagProps extends Record<string, unknown> {
  on: boolean;
}
const Flag: ComponentType<FlagProps> = ({ on }) => <span>flag={String(on)}</span>;
const flagSchema: WeaveComponentSchema<FlagProps> = {
  type: 'sr-flag',
  title: 'Flag',
  inspector: [{ group: 'Content', inputs: [{ type: 'toggle', name: 'on', label: 'On' }] }],
};
defineSection(Flag, flagSchema);

interface LinkProps extends Record<string, unknown> {
  href: string;
}
const Link: ComponentType<LinkProps> = ({ href }) => <a href={href}>link</a>;
const linkSchema: WeaveComponentSchema<LinkProps> = {
  type: 'sr-link',
  title: 'Link',
  inspector: [{ group: 'Content', inputs: [{ type: 'url', name: 'href', label: 'Href' }] }],
};
defineSection(Link, linkSchema);

interface BodyProps extends Record<string, unknown> {
  body: string;
}
const Body: ComponentType<BodyProps> = ({ body }) => <p>{body}</p>;
const bodySchema: WeaveComponentSchema<BodyProps> = {
  type: 'sr-body',
  title: 'Body',
  inspector: [{ group: 'Content', inputs: [{ type: 'richtext', name: 'body', label: 'Body' }] }],
};
defineSection(Body, bodySchema);

// Markers — one substring per section, used to assert presence + order in the markup.
const M = {
  heading: 'MARK-heading',
  count: 'count=42',
  flag: 'flag=true',
  link: 'href="https://example.com/marker"',
  body: 'MARK-body',
} as const;

function fiveValidSections(): WeavePageConfig['sections'] {
  return [
    { id: 's1', type: 'sr-heading', data: { text: M.heading }, version: 1 },
    { id: 's2', type: 'sr-count', data: { count: 42 }, version: 1 },
    { id: 's3', type: 'sr-flag', data: { on: true }, version: 1 },
    { id: 's4', type: 'sr-link', data: { href: 'https://example.com/marker' }, version: 1 },
    { id: 's5', type: 'sr-body', data: { body: M.body }, version: 1 },
  ];
}

function pageOf(sections: WeavePageConfig['sections']): WeavePageConfig {
  return { schemaVersion: 1, slug: 'home', sections, updatedAt: '2026-06-01T00:00:00Z' };
}

describe('SectionRenderer — server (node) render', () => {
  const prevEnv = process.env.NODE_ENV;

  beforeAll(() => {
    // Exercise prod mode so unknown/malformed sections silently skip (no dev card chrome in markup).
    process.env.NODE_ENV = 'production';
  });

  afterAll(() => {
    process.env.NODE_ENV = prevEnv;
  });

  it('renders 5 side-effect-registered sections in order', () => {
    const html = renderToStaticMarkup(<SectionRenderer config={pageOf(fiveValidSections())} />);

    for (const marker of Object.values(M)) {
      expect(html).toContain(marker);
    }

    // Order: each marker appears, and the indices are strictly increasing (render order = array order).
    const indices = [M.heading, M.count, M.flag, M.link, M.body].map((m) => html.indexOf(m));
    for (let i = 1; i < indices.length; i += 1) {
      expect(indices[i]).toBeGreaterThan(indices[i - 1]);
    }
  });

  it('does not crash on an unknown section type; sibling markers remain', () => {
    const sections = fiveValidSections();
    // Insert an unknown type between valid sections.
    sections.splice(2, 0, { id: 'sx', type: 'sr-does-not-exist', data: {}, version: 1 });

    const html = renderToStaticMarkup(<SectionRenderer config={pageOf(sections)} />);

    // Render succeeded (returned a string) and all 5 valid markers are still present.
    expect(typeof html).toBe('string');
    for (const marker of Object.values(M)) {
      expect(html).toContain(marker);
    }
    // Prod mode: unknown type renders null (no error chrome leaked into the page).
    expect(html).not.toContain('Unknown section type');
  });

  it('does not crash on a malformed-data section; sibling markers remain', () => {
    const sections = fiveValidSections();
    // sr-count expects a number; give it a string → Zod validation failure routes to the boundary.
    sections.splice(3, 0, { id: 'sbad', type: 'sr-count', data: { count: 'not-a-number' }, version: 1 });

    const html = renderToStaticMarkup(<SectionRenderer config={pageOf(sections)} />);

    expect(typeof html).toBe('string');
    for (const marker of Object.values(M)) {
      expect(html).toContain(marker);
    }
    // Prod mode: validation failure renders null (graceful skip, D-09).
    expect(html).not.toContain('failed validation');
  });

  it('renders nothing (no throw) for a malformed whole config', () => {
    const html = renderToStaticMarkup(<SectionRenderer config={{ not: 'a page config' }} />);
    expect(html).toBe('');
  });
});
