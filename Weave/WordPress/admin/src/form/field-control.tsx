/**
 * `<FieldControl>` — the schema-driven form widget (WEAVE-WP-07, D-10).
 *
 * Given one `WeaveInput` declaration, its current `value`, an `onChange`, and the section's full
 * `data`, this renders the mapped `@wordpress/components` control per UI-SPEC §Input-Type to
 * Control Mapping. It is the pure switch the editor shell (Plan 08) renders once per input inside
 * each inspector group's `<PanelBody>`.
 *
 * Conditional visibility (UI-SPEC §Condition evaluation): if `input.condition` is present and
 * `evaluateCondition(condition, data)` is false, the control is NOT mounted (returns `null`).
 * `evaluateCondition` fails OPEN on a malformed predicate, so a typo never silently hides a field.
 *
 * `image` renders a placeholder `<BaseControl>` here to keep the 15-case switch exhaustive and
 * unit-testable without a cross-plan dependency. Plan 07 (WEAVE-WP-08) swaps in the real
 * `<ImageControl>` (MediaUpload picker) and owns its test.
 */

import { type WeaveInput, evaluateCondition } from '@weave/react';
import {
  BaseControl,
  ColorPalette,
  __experimentalNumberControl as NumberControl,
  RangeControl,
  SelectControl,
  TextareaControl,
  TextControl,
  ToggleControl,
} from '@wordpress/components';

/** Props: one input declaration + its value + change handler + the section's full data record. */
export interface FieldControlProps {
  input: WeaveInput;
  value: unknown;
  onChange: (value: unknown) => void;
  /** Full section data — read by `evaluateCondition` for conditional visibility. */
  data: Record<string, unknown>;
}

/**
 * Render the mapped WP control for `input.type`, gated first by `input.condition`. Unknown types
 * and conditioned-out fields render `null` (fail soft — never throws).
 */
export function FieldControl({ input, value, onChange, data }: FieldControlProps) {
  // Condition gate FIRST — a false predicate means the field is not mounted at all.
  if (input.condition && !evaluateCondition(input.condition, data)) {
    return null;
  }

  switch (input.type) {
    // String family → single-line TextControl (UI-SPEC: url/datetime/pickers are plain text in v0.1).
    case 'text':
    case 'url':
    case 'datetime':
    case 'product-picker':
    case 'collection-picker':
      return (
        <TextControl
          label={input.label}
          value={(value as string) ?? ''}
          onChange={(v: unknown) => onChange(v)}
        />
      );

    // Multi-line string family → TextareaControl (markdown/code are plain textareas in v0.1).
    case 'richtext':
    case 'markdown':
    case 'code':
      return (
        <TextareaControl
          label={input.label}
          value={(value as string) ?? ''}
          onChange={(v: unknown) => onChange(v)}
        />
      );

    case 'number':
      return (
        <NumberControl
          label={input.label}
          value={(value as number) ?? 0}
          onChange={(v: unknown) => onChange(v)}
        />
      );

    case 'range':
      return (
        <RangeControl
          label={input.label}
          value={(value as number) ?? 0}
          min={input.configs.min}
          max={input.configs.max}
          step={input.configs.step ?? 1}
          onChange={(v: unknown) => onChange(v)}
        />
      );

    case 'toggle':
      return (
        <ToggleControl
          label={input.label}
          checked={(value as boolean) ?? false}
          onChange={(v: unknown) => onChange(v)}
        />
      );

    case 'select':
      return (
        <SelectControl
          label={input.label}
          value={(value as string) ?? ''}
          options={input.configs.options.map((o) => ({ label: o.label, value: o.value }))}
          onChange={(v: unknown) => onChange(v)}
        />
      );

    case 'color':
      return (
        <ColorPalette
          value={(value as string) ?? ''}
          colors={[]}
          onChange={(v: unknown) => onChange(v ?? '')}
        />
      );

    // Plan 07 (WEAVE-WP-08) swaps in <ImageControl> (MediaUpload picker). Placeholder keeps the
    // switch exhaustive + testable here without a cross-plan import.
    case 'image':
      return <BaseControl label={input.label}>{null}</BaseControl>;

    // Raw JSON editing in v0.1 (UI-SPEC: structured repeater UI is v0.2).
    case 'repeater':
      return (
        <TextareaControl
          label={input.label}
          value={JSON.stringify((value as unknown[]) ?? [], null, 2)}
          onChange={(v: unknown) => onChange(v)}
        />
      );

    default:
      // Fail soft — unknown/unhandled type renders nothing, never throws.
      return null;
  }
}
