/**
 * `<SectionCard>` — one section row in the editor's ordered list (WEAVE-WP-07, UI-SPEC §Section List).
 *
 * Header row: Up / Down reorder buttons (up/down BUTTONS only — NO drag-and-drop, D-09) with the
 * UI-SPEC aria labels, disabled at the list ends, plus a destructive Remove link. Body: one
 * `<PanelBody>` per the section schema's `inspector` group, each input rendered via `<FieldControl>`
 * wired to `updateField(section.id, name, value)`.
 *
 * Fail-soft: an unregistered section type (no schema in the registry) renders a 'Unknown section
 * type' notice instead of crashing the whole editor.
 */

import { type WeaveInput, getSection } from '@weave/react';
import { Button, Notice, PanelBody, PanelRow } from '@wordpress/components';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { FieldControl } from '../form/field-control';
import { useEditorStore } from '../store/editor-store';

/** Props for one card: the section, its index, and end-of-list flags for reorder disabling. */
export interface SectionCardProps {
  section: { id: string; type: string; data: Record<string, unknown>; version: number };
  index: number;
  isFirst: boolean;
  isLast: boolean;
}

export function SectionCard({ section, index, isFirst, isLast }: SectionCardProps) {
  const moveSection = useEditorStore((s) => s.moveSection);
  const removeSection = useEditorStore((s) => s.removeSection);
  const updateField = useEditorStore((s) => s.updateField);

  const entry = getSection(section.type);

  return (
    <div data-weave-section-card={section.id}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <strong>{entry?.schema.title ?? section.type}</strong>
        <Button
          variant="secondary"
          icon={chevronUp}
          label="Move section up"
          disabled={isFirst}
          onClick={() => moveSection(index, index - 1)}
        />
        <Button
          variant="secondary"
          icon={chevronDown}
          label="Move section down"
          disabled={isLast}
          onClick={() => moveSection(index, index + 1)}
        />
        <Button variant="link" isDestructive onClick={() => removeSection(section.id)}>
          Remove
        </Button>
      </div>

      {entry ? (
        entry.schema.inspector.map((group) => (
          <PanelBody key={group.group} title={group.group} initialOpen={false}>
            {group.inputs.map((input: WeaveInput) => (
              <PanelRow key={input.name}>
                <FieldControl
                  input={input}
                  value={section.data[input.name]}
                  data={section.data}
                  onChange={(value) => updateField(section.id, input.name, value)}
                />
              </PanelRow>
            ))}
          </PanelBody>
        ))
      ) : (
        <Notice status="warning" isDismissible={false}>
          Unknown section type
        </Notice>
      )}
    </div>
  );
}
