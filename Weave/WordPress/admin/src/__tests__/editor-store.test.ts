/**
 * WeaveEditorStore transitions (WEAVE-WP-07, UI-SPEC §State Management Architecture).
 *
 * Drives the zustand store via `getState()` — no React needed. A trivial 'hero' section is
 * registered through `defineSection` so `addSection('hero')` exercises `applyDefaults` against a
 * real registered schema. Asserts each mutation's effect on `sections` and the `dirty` flag, plus
 * the non-section slices (`saving`/`notice`/`dirty`).
 */

import { createElement } from 'react';
import {
  type WeaveComponentSchema,
  type WeaveSection,
  defineSection,
} from '@weave/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { useEditorStore } from '../store/editor-store';

/** Minimal 'hero' section: one text input with a declared default, so applyDefaults has work. */
interface HeroProps extends Record<string, unknown> {
  title: string;
}
function Hero({ title }: HeroProps) {
  return createElement('div', null, title);
}
const heroSchema: WeaveComponentSchema<HeroProps> = {
  type: 'hero',
  title: 'Hero',
  inspector: [
    { group: 'Content', inputs: [{ type: 'text', name: 'title', label: 'Title', defaultValue: 'Hello' }] },
  ],
};

const section = (id: string, type = 'hero', data: Record<string, unknown> = {}): WeaveSection => ({
  id,
  type,
  data,
  version: 1,
});

beforeAll(() => {
  defineSection(Hero, heroSchema);
});

/** Reset to a known empty/clean baseline before each case. */
function reset(): void {
  useEditorStore.setState({ sections: [], dirty: false, saving: false, notice: null });
}

describe('WeaveEditorStore', () => {
  it('exposes the locked UI-SPEC shape (9 fields/methods)', () => {
    reset();
    const s = useEditorStore.getState();
    expect(s.sections).toEqual([]);
    expect(s.dirty).toBe(false);
    expect(s.saving).toBe(false);
    expect(s.notice).toBeNull();
    expect(typeof s.setSections).toBe('function');
    expect(typeof s.updateField).toBe('function');
    expect(typeof s.moveSection).toBe('function');
    expect(typeof s.addSection).toBe('function');
    expect(typeof s.removeSection).toBe('function');
    expect(typeof s.setDirty).toBe('function');
    expect(typeof s.setSaving).toBe('function');
    expect(typeof s.setNotice).toBe('function');
  });

  it('setSections sets sections and clears dirty (server load)', () => {
    reset();
    useEditorStore.setState({ dirty: true });
    useEditorStore.getState().setSections([section('a'), section('b')]);
    const s = useEditorStore.getState();
    expect(s.sections.map((x) => x.id)).toEqual(['a', 'b']);
    expect(s.dirty).toBe(false);
  });

  it('updateField updates data and sets dirty true', () => {
    reset();
    useEditorStore.getState().setSections([section('a', 'hero', { title: 'old' })]);
    useEditorStore.getState().updateField('a', 'title', 'new');
    const s = useEditorStore.getState();
    expect(s.sections[0].data.title).toBe('new');
    expect(s.dirty).toBe(true);
  });

  it('updateField leaves other sections untouched', () => {
    reset();
    useEditorStore.getState().setSections([section('a', 'hero', { title: 'a' }), section('b', 'hero', { title: 'b' })]);
    useEditorStore.getState().updateField('b', 'title', 'B!');
    const s = useEditorStore.getState();
    expect(s.sections[0].data.title).toBe('a');
    expect(s.sections[1].data.title).toBe('B!');
  });

  it('addSection appends a UUID-id section seeded by applyDefaults and sets dirty', () => {
    reset();
    useEditorStore.getState().addSection('hero');
    const s = useEditorStore.getState();
    expect(s.sections).toHaveLength(1);
    const added = s.sections[0];
    expect(typeof added.id).toBe('string');
    expect(added.id.length).toBeGreaterThan(0);
    expect(added.type).toBe('hero');
    expect(added.version).toBe(1);
    // applyDefaults filled the declared default for 'title'
    expect(added.data.title).toBe('Hello');
    expect(s.dirty).toBe(true);
  });

  it('addSection fails soft on an unregistered type (data {})', () => {
    reset();
    useEditorStore.getState().addSection('does-not-exist');
    const s = useEditorStore.getState();
    expect(s.sections).toHaveLength(1);
    expect(s.sections[0].type).toBe('does-not-exist');
    expect(s.sections[0].data).toEqual({});
    expect(s.dirty).toBe(true);
  });

  it('moveSection reorders and sets dirty', () => {
    reset();
    useEditorStore.getState().setSections([section('a'), section('b'), section('c')]);
    useEditorStore.getState().moveSection(0, 1);
    const s = useEditorStore.getState();
    expect(s.sections.map((x) => x.id)).toEqual(['b', 'a', 'c']);
    expect(s.dirty).toBe(true);
  });

  it('removeSection drops by id and sets dirty', () => {
    reset();
    useEditorStore.getState().setSections([section('a'), section('b')]);
    useEditorStore.getState().removeSection('a');
    const s = useEditorStore.getState();
    expect(s.sections.map((x) => x.id)).toEqual(['b']);
    expect(s.dirty).toBe(true);
  });

  it('setSaving / setNotice / setDirty set their slice without touching sections', () => {
    reset();
    useEditorStore.getState().setSections([section('a')]);
    useEditorStore.getState().setSaving(true);
    expect(useEditorStore.getState().saving).toBe(true);

    useEditorStore.getState().setNotice({ status: 'success', message: 'Page saved.' });
    expect(useEditorStore.getState().notice).toEqual({ status: 'success', message: 'Page saved.' });

    useEditorStore.getState().setDirty(false);
    expect(useEditorStore.getState().dirty).toBe(false);

    // sections untouched across all three
    expect(useEditorStore.getState().sections.map((x) => x.id)).toEqual(['a']);
  });
});
