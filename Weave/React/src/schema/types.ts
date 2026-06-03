/**
 * Weave section schema types — the compile-time contract layer (D-01, D-02, D-06, D-11, D-12).
 *
 * A section is authored as a declarative `WeaveComponentSchema<TProps>` object literal
 * (Weaverse-style). Each input's `name` is constrained to `keyof TProps`, so declaring an
 * input whose name is not a real component prop is a TypeScript compile error (SDK-01).
 *
 * Downstream:
 *   - Plan 03 (input registry) keys off `WeaveInputType`.
 *   - Plan 04 (`defineSection`) infers `<TProps>` through `WeaveComponentSchema`.
 *   - Plan 06 (`<SectionRenderer>`) renders sections declared with these types.
 */

/**
 * The 15 input-type literals (D-06). Each maps to a Zod factory + default-coercion rule
 * (Plan 03) and an editor form widget (Phase 4b).
 */
export type WeaveInputType =
  | 'text'
  | 'richtext'
  | 'number'
  | 'toggle'
  | 'select'
  | 'color'
  | 'image'
  | 'url'
  | 'product-picker'
  | 'collection-picker'
  | 'repeater'
  | 'range'
  | 'datetime'
  | 'code'
  | 'markdown';

/** Per-type configs (D-12 discretion). Only a few input types carry extra config. */

/** `select` choices — editor renders these as a dropdown. */
export interface SelectConfigs {
  options: { label: string; value: string }[];
}

/** `range` bounds — editor renders a slider. */
export interface RangeConfigs {
  min: number;
  max: number;
  step?: number;
}

/** `repeater` child inputs — each repeated item is described by these inputs. */
export interface RepeaterConfigs {
  inputs: WeaveInput<Record<string, unknown>>[];
}

/**
 * Fields shared by every input declaration.
 *
 * `name` is constrained to `Extract<keyof TProps, string>` — this is the SDK-01 mechanism:
 * an input whose `name` is not a real prop of `TProps` is a compile error.
 *
 * `condition` is a declarative string predicate (`'field.op.value'`, D-12), NOT a function —
 * this keeps the schema JSON-serializable and editor-evaluable.
 */
interface WeaveInputBase<TProps> {
  name: Extract<keyof TProps, string>;
  label: string;
  condition?: string;
}

/** `type='text'` — single-line string. */
export interface TextInput<TProps> extends WeaveInputBase<TProps> {
  type: 'text';
  defaultValue?: string;
}

/** `type='richtext'` — multi-line / HTML string. */
export interface RichTextInput<TProps> extends WeaveInputBase<TProps> {
  type: 'richtext';
  defaultValue?: string;
}

/** `type='number'` — numeric value. */
export interface NumberInput<TProps> extends WeaveInputBase<TProps> {
  type: 'number';
  defaultValue?: number;
}

/** `type='toggle'` — boolean switch. */
export interface ToggleInput<TProps> extends WeaveInputBase<TProps> {
  type: 'toggle';
  defaultValue?: boolean;
}

/** `type='select'` — choice from `configs.options`. */
export interface SelectInput<TProps> extends WeaveInputBase<TProps> {
  type: 'select';
  defaultValue?: string;
  configs: SelectConfigs;
}

/** `type='color'` — color string (hex/rgb). */
export interface ColorInput<TProps> extends WeaveInputBase<TProps> {
  type: 'color';
  defaultValue?: string;
}

/**
 * `type='image'` — WP Media Library value: attachment `{ id, url }` (OQ2, D-11).
 * `id` is the attachment ID (null when cleared); `url` is the full media URL.
 */
export interface ImageInput<TProps> extends WeaveInputBase<TProps> {
  type: 'image';
  defaultValue?: { id: number | null; url: string };
}

/** `type='url'` — link string. */
export interface UrlInput<TProps> extends WeaveInputBase<TProps> {
  type: 'url';
  defaultValue?: string;
}

/** `type='product-picker'` — WooCommerce product slug/ID string. */
export interface ProductPickerInput<TProps> extends WeaveInputBase<TProps> {
  type: 'product-picker';
  defaultValue?: string;
}

/** `type='collection-picker'` — WooCommerce collection slug/ID string. */
export interface CollectionPickerInput<TProps> extends WeaveInputBase<TProps> {
  type: 'collection-picker';
  defaultValue?: string;
}

/** `type='repeater'` — array of items described by `configs.inputs`. */
export interface RepeaterInput<TProps> extends WeaveInputBase<TProps> {
  type: 'repeater';
  defaultValue?: unknown[];
  configs: RepeaterConfigs;
}

/** `type='range'` — bounded number from `configs.{min,max,step}`. */
export interface RangeInput<TProps> extends WeaveInputBase<TProps> {
  type: 'range';
  defaultValue?: number;
  configs: RangeConfigs;
}

/** `type='datetime'` — ISO8601 datetime string. */
export interface DateTimeInput<TProps> extends WeaveInputBase<TProps> {
  type: 'datetime';
  defaultValue?: string;
}

/** `type='code'` — raw code/markup string. */
export interface CodeInput<TProps> extends WeaveInputBase<TProps> {
  type: 'code';
  defaultValue?: string;
}

/** `type='markdown'` — markdown source string. */
export interface MarkdownInput<TProps> extends WeaveInputBase<TProps> {
  type: 'markdown';
  defaultValue?: string;
}

/**
 * A single input declaration — discriminated union on `type` (D-02).
 * `name` is `keyof TProps` for every member (SDK-01).
 */
export type WeaveInput<TProps = Record<string, unknown>> =
  | TextInput<TProps>
  | RichTextInput<TProps>
  | NumberInput<TProps>
  | ToggleInput<TProps>
  | SelectInput<TProps>
  | ColorInput<TProps>
  | ImageInput<TProps>
  | UrlInput<TProps>
  | ProductPickerInput<TProps>
  | CollectionPickerInput<TProps>
  | RepeaterInput<TProps>
  | RangeInput<TProps>
  | DateTimeInput<TProps>
  | CodeInput<TProps>
  | MarkdownInput<TProps>;

/**
 * An inspector group (D-11) — Weaverse `inspector` model. Tabbed/collapsible grouping is
 * metadata the Phase 4b editor consumes; Phase 3 only declares and type-checks it.
 */
export interface WeaveInspectorGroup<TProps = Record<string, unknown>> {
  group: string;
  inputs: WeaveInput<TProps>[];
}

/**
 * The declarative section schema (D-01). `type` matches `sections[].type` in the page config;
 * `inspector` is the single source of truth driving both the TS prop types (via `<TProps>`)
 * and the runtime Zod validator (Plan 03, SDK-07).
 */
export interface WeaveComponentSchema<TProps = Record<string, unknown>> {
  type: string;
  title: string;
  inspector: WeaveInspectorGroup<TProps>[];
}
