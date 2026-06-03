/**
 * `<SectionList>` / `<SectionCard>` reorder contract (WEAVE-WP-07, D-09, UI-SPEC §Section List).
 *
 * D-09 locks reordering to up/down BUTTONS — no drag-and-drop. This suite drives the rendered list
 * through the zustand store and asserts: one card per section in array order; the first card's Up
 * and the last card's Down are disabled (no wrap-around); clicking Up/Down reorders via
 * `moveSection`; and a reorder flips the store dirty. Section types are intentionally unregistered —
 * the reorder header renders regardless of registry state, which is exactly what we're testing.
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SectionList } from '../editor/SectionList';
import { useEditorStore } from '../store/editor-store';

function seed(n: number): void {
  const sections = Array.from({ length: n }, (_, i) => ({
    id: `s${i + 1}`,
    type: 'demo-section',
    data: {},
    version: 1,
  }));
  // setSections is the server-load sink → also clears dirty, giving each test a clean baseline.
  useEditorStore.getState().setSections(sections);
}

function cardOrder(): string[] {
  return Array.from(document.querySelectorAll('[data-weave-section-card]')).map(
    (el) => el.getAttribute('data-weave-section-card') ?? '',
  );
}

beforeEach(() => {
  useEditorStore.getState().setSections([]);
});
afterEach(cleanup);

describe('SectionList — ordered render', () => {
  it('renders one card per section in array order', () => {
    seed(3);
    render(<SectionList />);
    expect(cardOrder()).toEqual(['s1', 's2', 's3']);
  });

  it('shows the empty state when there are no sections', () => {
    seed(0);
    const { container } = render(<SectionList />);
    expect(container.querySelector('[data-weave-empty]')).not.toBeNull();
    expect(cardOrder()).toEqual([]);
  });
});

describe('SectionList — reorder (D-09: up/down buttons, no DnD)', () => {
  it("disables the first card's Up and the last card's Down (no wrap-around)", () => {
    seed(3);
    render(<SectionList />);
    const up = screen.getAllByLabelText('Move section up') as HTMLButtonElement[];
    const down = screen.getAllByLabelText('Move section down') as HTMLButtonElement[];

    expect(up[0].disabled).toBe(true); // first card: cannot move up
    expect(up[2].disabled).toBe(false);
    expect(down[2].disabled).toBe(true); // last card: cannot move down
    expect(down[0].disabled).toBe(false);
  });

  it('moves a section up when its Up button is clicked', () => {
    seed(3);
    render(<SectionList />);
    const up = screen.getAllByLabelText('Move section up') as HTMLButtonElement[];

    fireEvent.click(up[1]); // s2 moves up → [s2, s1, s3]

    expect(cardOrder()).toEqual(['s2', 's1', 's3']);
  });

  it('moves a section down when its Down button is clicked', () => {
    seed(3);
    render(<SectionList />);
    const down = screen.getAllByLabelText('Move section down') as HTMLButtonElement[];

    fireEvent.click(down[0]); // s1 moves down → [s2, s1, s3]

    expect(cardOrder()).toEqual(['s2', 's1', 's3']);
  });

  it('flips the store dirty after a reorder', () => {
    seed(3);
    render(<SectionList />);
    expect(useEditorStore.getState().dirty).toBe(false); // setSections cleared it

    fireEvent.click((screen.getAllByLabelText('Move section down') as HTMLButtonElement[])[0]);

    expect(useEditorStore.getState().dirty).toBe(true);
  });
});
