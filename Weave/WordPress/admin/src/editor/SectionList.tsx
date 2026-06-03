/**
 * `<SectionList>` — the ordered section editor list + Add picker (WEAVE-WP-07, UI-SPEC §Section List).
 *
 * Reads the zustand store's `sections`. Empty → the 'No sections yet' empty state + the Add picker.
 * Otherwise → one `<SectionCard>` per section in array order, with up/down reorder disabled at the
 * ends (D-09: up/down BUTTONS only, no drag-and-drop) and Remove. Below the list, an Add picker —
 * a `<SelectControl>` of `listSections()` registry types + an 'Add Section' button — appends a new
 * section via `addSection(type)`.
 */

import { listSections } from '@weave/react';
import { Button, SelectControl } from '@wordpress/components';
import { useState } from 'react';
import { useEditorStore } from '../store/editor-store';
import { SectionCard } from './SectionCard';

export function SectionList() {
  const sections = useEditorStore((s) => s.sections);
  const addSection = useEditorStore((s) => s.addSection);

  const types = listSections();
  const [selectedType, setSelectedType] = useState<string>(types[0] ?? '');

  function handleAdd() {
    if (selectedType) {
      addSection(selectedType);
    }
  }

  const options = [
    { label: '— Section type —', value: '' },
    ...types.map((type) => ({ label: type, value: type })),
  ];

  return (
    <div>
      {sections.length === 0 ? (
        <div data-weave-empty>
          <p>No sections yet</p>
          <p>Add your first section to start building this page.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sections.map((section, index) => (
            <SectionCard
              key={section.id}
              section={section}
              index={index}
              isFirst={index === 0}
              isLast={index === sections.length - 1}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <SelectControl
          label="Section type"
          value={selectedType}
          options={options}
          onChange={(value: string) => setSelectedType(value)}
        />
        <Button variant="secondary" onClick={handleAdd}>
          Add Section
        </Button>
      </div>
    </div>
  );
}
