// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
/**
 * boundary.test.tsx — <SectionErrorBoundary> jsdom tests (WEAVE-SDK-09, Success Criterion #4).
 *
 * This exact path matches Plan 01's vitest.config.ts `environmentMatchGlobs`
 * entry, so it runs under jsdom while the rest of the package stays on node.
 *
 * Proves:
 *   1. A throwing section is isolated — a sibling node survives (page-level resilience).
 *   2. Dev validation card shows type/id/path + the locked validation copy + Zod issues.
 *   3. Dev unknown-type card shows the unknown-type copy and no `path:` row.
 *   4. Prod mode renders null (no error chrome) on a throwing section.
 *   5. Every dev card carries the locked footer hint.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SectionErrorBoundary } from '../client/SectionErrorBoundary';

function Throws(): never {
  throw new Error('boom');
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SectionErrorBoundary', () => {
  it('isolates a throwing section so a sibling still renders (dev)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <div>
        <SectionErrorBoundary mode="dev" sectionType="bad" sectionId="1">
          <Throws />
        </SectionErrorBoundary>
        <div>sibling-ok</div>
      </div>,
    );

    // Sibling survived the throw — the page did not crash.
    expect(screen.getByText('sibling-ok')).toBeInTheDocument();
    // The boundary rendered its dev card in the failed section's slot.
    expect(screen.getByText('⚠ Weave section error')).toBeInTheDocument();
    expect(screen.getByText(/Section threw during render:/)).toBeInTheDocument();
    // Footer hint present on the dev card.
    expect(
      screen.getByText(
        'This card renders in development only. In production this section is skipped.',
      ),
    ).toBeInTheDocument();

    spy.mockRestore();
  });

  it('renders the dev validation card with type, id, path and Zod issues', () => {
    render(
      <SectionErrorBoundary
        mode="dev"
        kind="validation"
        sectionType="hero"
        sectionId="abc"
        issues={[{ path: 'data.cta.url', message: 'Invalid url' }]}
      />,
    );

    expect(screen.getByText('hero')).toBeInTheDocument();
    expect(screen.getByText('abc')).toBeInTheDocument();
    expect(screen.getByText('Section data failed validation.')).toBeInTheDocument();
    expect(screen.getByText('data.cta.url: Invalid url')).toBeInTheDocument();
    // The `path:` label row is present for a Zod failure.
    expect(screen.getByText('path:')).toBeInTheDocument();
    // Footer hint present.
    expect(
      screen.getByText(
        'This card renders in development only. In production this section is skipped.',
      ),
    ).toBeInTheDocument();
  });

  it('renders the dev unknown-type card with no path row', () => {
    render(
      <SectionErrorBoundary mode="dev" kind="unknown-type" sectionType="mystery" sectionId="x" />,
    );

    expect(screen.getByText('Unknown section type: mystery')).toBeInTheDocument();
    // No `path:` row for an unknown-type failure.
    expect(screen.queryByText('path:')).not.toBeInTheDocument();
  });

  it('renders null in prod when a section throws (graceful skip)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(
      <SectionErrorBoundary mode="prod" sectionType="bad" sectionId="1">
        <Throws />
      </SectionErrorBoundary>,
    );

    // No error chrome, no DOM — silent skip.
    expect(screen.queryByText('⚠ Weave section error')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();

    spy.mockRestore();
  });

  it('renders children unchanged when there is no failure', () => {
    render(
      <SectionErrorBoundary mode="dev" sectionType="hero" sectionId="ok">
        <div>healthy-section</div>
      </SectionErrorBoundary>,
    );

    expect(screen.getByText('healthy-section')).toBeInTheDocument();
    expect(screen.queryByText('⚠ Weave section error')).not.toBeInTheDocument();
  });
});
