/**
 * `useEditorStore` — the WP Admin editor's local UI state (WEAVE-WP-07, D-08).
 *
 * Implements the locked UI-SPEC §State Management Architecture shape EXACTLY: the ordered
 * `sections` array plus `dirty`/`saving`/`notice` slices and the eight mutators. This is the
 * Zustand half of the D-08 split — TanStack Query owns server state (load/save); this store owns
 * the in-session edit buffer with no cross-load persistence.
 *
 * Dirty semantics (UI-SPEC §States): every content mutation
 * (`updateField`/`moveSection`/`addSection`/`removeSection`) flips `dirty = true`. `setSections`
 * is the server-load sink → it clears `dirty`. `setDirty` is the explicit override (save success
 * sets it false). `setSaving`/`setNotice` touch only their own slice.
 *
 * `addSection` mirrors UI-SPEC §Interaction Contract: a new section is `{ id: crypto.randomUUID(),
 * type, data: applyDefaults(schema, {}), version: 1 }`. The schema is resolved via the `@weave-platform/react`
 * registry; an unregistered type fails soft to `data: {}` (no throw) so a stale picker option can't
 * crash the editor.
 */

import { applyDefaults, getSection, type WeaveSection } from '@weave-platform/react';
import { create } from 'zustand';

/** A status notice (UI-SPEC §Component Inventory `<Notice>`): WP semantic status + message. */
export interface EditorNotice {
  status: string;
  message: string;
}

/** Canonical editor store contract — UI-SPEC §State Management Architecture (implement exactly). */
export interface WeaveEditorStore {
  sections: WeaveSection[];
  dirty: boolean;
  saving: boolean;
  notice: EditorNotice | null;
  /** Replace all sections from a server load — clears `dirty`. */
  setSections: (sections: WeaveSection[]) => void;
  /** Patch one field of one section's `data` — sets `dirty`. */
  updateField: (sectionId: string, field: string, value: unknown) => void;
  /** Move a section from `fromIndex` to `toIndex` (splice + reinsert) — sets `dirty`. */
  moveSection: (fromIndex: number, toIndex: number) => void;
  /** Append a new section of `type` with defaults-seeded data — sets `dirty`. */
  addSection: (type: string) => void;
  /** Remove the section with `id` — sets `dirty`. */
  removeSection: (id: string) => void;
  /** Explicit dirty override (e.g. save-success → false). */
  setDirty: (dirty: boolean) => void;
  /** Toggle the save-in-flight slice. */
  setSaving: (saving: boolean) => void;
  /** Set or clear the current status notice. */
  setNotice: (notice: EditorNotice | null) => void;
}

/**
 * Seed a new section's `data` from its registered schema's defaults. Unregistered types fail soft
 * to `{}` — `getSection` returns `undefined` for unknown types and never throws.
 */
function initialData(type: string): Record<string, unknown> {
  const entry = getSection(type);
  return entry ? applyDefaults(entry.schema, {}) : {};
}

export const useEditorStore = create<WeaveEditorStore>((set) => ({
  sections: [],
  dirty: false,
  saving: false,
  notice: null,

  setSections: (sections) => set({ sections, dirty: false }),

  updateField: (sectionId, field, value) =>
    set((state) => ({
      dirty: true,
      sections: state.sections.map((section) =>
        section.id === sectionId
          ? { ...section, data: { ...section.data, [field]: value } }
          : section,
      ),
    })),

  moveSection: (fromIndex, toIndex) =>
    set((state) => {
      const next = [...state.sections];
      const [moved] = next.splice(fromIndex, 1);
      if (moved === undefined) return {}; // out-of-range from-index: no-op, no dirty
      next.splice(toIndex, 0, moved);
      return { sections: next, dirty: true };
    }),

  addSection: (type) =>
    set((state) => ({
      dirty: true,
      sections: [
        ...state.sections,
        { id: crypto.randomUUID(), type, data: initialData(type), version: 1 },
      ],
    })),

  removeSection: (id) =>
    set((state) => ({
      dirty: true,
      sections: state.sections.filter((section) => section.id !== id),
    })),

  setDirty: (dirty) => set({ dirty }),
  setSaving: (saving) => set({ saving }),
  setNotice: (notice) => set({ notice }),
}));
