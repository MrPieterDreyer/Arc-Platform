/**
 * `<Editor>` — the WP Admin editor shell wiring TanStack Query (load/save) to the zustand store
 * and the section list UI (WEAVE-WP-07, D-08).
 *
 * api-fetch is the alias-stubbed `vi.fn()`; the Editor is wrapped in a REAL QueryClientProvider
 * (TanStack Query is bundled, not a WP external, so it runs in jsdom). The mock is driven through
 * the UI-SPEC §States: loading → Spinner; load error → error Notice + Retry; resolved config →
 * sections synced to the store + rendered as cards; Save → PUT with the assembled WeavePageConfig
 * and dirty cleared.
 *
 * Section-list interaction cases (empty state, ordered cards, up/down reorder, remove, add) live in
 * the `SectionList` describe block below (Task 2).
 */

import { defineSection } from '@weave/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEditorStore } from '../store/editor-store';
import apiFetch from '@wordpress/api-fetch';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, type vi } from 'vitest';
import { Editor } from '../editor/Editor';
import { SectionList } from '../editor/SectionList';

const mockApiFetch = apiFetch as unknown as ReturnType<typeof vi.fn>;

// A trivial registered section so addSection('hero') + getSection('hero') resolve a schema.
function HeroStub() {
  return createElement('div', { 'data-hero': true });
}
defineSection(HeroStub, {
  type: 'hero',
  title: 'Hero',
  inspector: [{ group: 'Content', inputs: [{ type: 'text', name: 'title', label: 'Title' }] }],
});

function resetStore() {
  useEditorStore.setState({ sections: [], dirty: false, saving: false, notice: null });
}

function wrap(node: ReactNode) {
  // A fresh non-retrying client per render so error states surface immediately.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    createElement(QueryClientProvider, { client }, node),
  );
}

beforeEach(() => {
  mockApiFetch.mockReset();
  resetStore();
});
afterEach(cleanup);

const config = (sectionCount: number) => ({
  schemaVersion: 1,
  slug: 'home',
  sections: Array.from({ length: sectionCount }, (_, i) => ({
    id: `s${i}`,
    type: 'hero',
    data: { title: `Hero ${i}` },
    version: 1,
  })),
  updatedAt: '2026-06-03T00:00:00.000Z',
});

describe('Editor — load flow', () => {
  it('renders a Spinner while the query is pending', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = wrap(createElement(Editor, { slug: 'home' }));
    expect(container.querySelector('[data-wp-control="Spinner"]')).not.toBeNull();
  });

  it('on success syncs sections into the store and renders the cards', async () => {
    mockApiFetch.mockResolvedValueOnce(config(2));
    wrap(createElement(Editor, { slug: 'home' }));
    await waitFor(() => {
      expect(useEditorStore.getState().sections).toHaveLength(2);
    });
    expect(useEditorStore.getState().dirty).toBe(false);
    expect(screen.getAllByText('Hero')).toHaveLength(2); // two PanelBody titles
  });

  it('on error renders an error Notice with the message + a Retry affordance', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('boom'));
    wrap(createElement(Editor, { slug: 'home' }));
    const notice = await screen.findByRole('status');
    expect(notice).toHaveAttribute('data-status', 'error');
    expect(notice.textContent).toContain('boom');
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});

describe('Editor — save flow', () => {
  it('Save PUTs the assembled WeavePageConfig and clears dirty', async () => {
    mockApiFetch.mockResolvedValueOnce(config(2)); // initial load
    wrap(createElement(Editor, { slug: 'home' }));
    await waitFor(() => expect(useEditorStore.getState().sections).toHaveLength(2));

    mockApiFetch.mockResolvedValueOnce({ ok: true }); // the PUT
    fireEvent.click(screen.getByText('Save Page'));

    await waitFor(() => {
      const putCall = mockApiFetch.mock.calls.find((c) => c[0]?.method === 'PUT');
      expect(putCall).toBeDefined();
    });
    const putCall = mockApiFetch.mock.calls.find((c) => c[0]?.method === 'PUT');
    expect(putCall?.[0].path).toBe('/weave/v1/pages/home');
    expect(putCall?.[0].data.slug).toBe('home');
    expect(putCall?.[0].data.sections).toHaveLength(2);
    expect(putCall?.[0].data.schemaVersion).toBe(1);
    expect(typeof putCall?.[0].data.updatedAt).toBe('string');

    await waitFor(() => expect(useEditorStore.getState().dirty).toBe(false));
  });
});

describe('SectionList — empty state', () => {
  it("renders 'No sections yet' + the empty-state body + the Add picker", () => {
    resetStore();
    render(createElement(SectionList));
    expect(screen.getByText('No sections yet')).toBeInTheDocument();
    expect(
      screen.getByText('Add your first section to start building this page.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Add Section')).toBeInTheDocument();
  });
});

describe('SectionList — populated list + interactions', () => {
  it('renders N cards in order with up/down disabled at the ends', () => {
    useEditorStore.setState({
      sections: [
        { id: 'a', type: 'hero', data: {}, version: 1 },
        { id: 'b', type: 'hero', data: {}, version: 1 },
      ],
      dirty: false,
    });
    render(createElement(SectionList));
    expect(screen.getAllByText('Hero')).toHaveLength(2);
    const ups = screen.getAllByLabelText('Move section up');
    const downs = screen.getAllByLabelText('Move section down');
    expect((ups[0] as HTMLButtonElement).disabled).toBe(true); // first: up disabled
    expect((downs[1] as HTMLButtonElement).disabled).toBe(true); // last: down disabled
  });

  it('Down on the first card swaps order (moveSection)', () => {
    useEditorStore.setState({
      sections: [
        { id: 'a', type: 'hero', data: {}, version: 1 },
        { id: 'b', type: 'hero', data: {}, version: 1 },
      ],
      dirty: false,
    });
    render(createElement(SectionList));
    const downs = screen.getAllByLabelText('Move section down');
    fireEvent.click(downs[0]); // move index 0 down
    expect(useEditorStore.getState().sections.map((s) => s.id)).toEqual(['b', 'a']);
    expect(useEditorStore.getState().dirty).toBe(true);
  });

  it('Remove deletes the card (removeSection)', () => {
    useEditorStore.setState({
      sections: [{ id: 'a', type: 'hero', data: {}, version: 1 }],
      dirty: false,
    });
    render(createElement(SectionList));
    fireEvent.click(screen.getByText('Remove'));
    expect(useEditorStore.getState().sections).toHaveLength(0);
  });

  it('Add via the picker appends a new section', () => {
    resetStore();
    const { container } = render(createElement(SectionList));
    const select = container.querySelector('[data-wp-control="SelectControl"]') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'hero' } });
    fireEvent.click(screen.getByText('Add Section'));
    expect(useEditorStore.getState().sections).toHaveLength(1);
    expect(useEditorStore.getState().sections[0].type).toBe('hero');
  });

  it('an unregistered section type renders a fail-soft notice, no crash', () => {
    useEditorStore.setState({
      sections: [{ id: 'x', type: 'does-not-exist', data: {}, version: 1 }],
      dirty: false,
    });
    render(createElement(SectionList));
    expect(screen.getByText('Unknown section type')).toBeInTheDocument();
  });
});
