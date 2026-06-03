/**
 * The 15-entry input-type registry (D-05, D-06, SDK-05).
 *
 * Each `WeaveInputType` maps to:
 *   - `zod(configs)` — a Zod sub-schema validating that field's value (the building block
 *     `schemaToZod` assembles into a per-section `z.object`, SDK-07);
 *   - `default(input)` — the default-coercion rule: the declared `defaultValue` if present,
 *     otherwise the type's fallback (SDK-08, D-07).
 *
 * Defaults are applied as an explicit pre-validation merge (`applyDefaults`), NOT via a
 * Zod union `.default()` — Zod 4 throws "Invalid discriminator value" when `.default()` sits
 * on a discriminated/whole union (RESEARCH §Pitfall 1, Zod issue #5264). Keeping defaults in
 * this plain `default()` function sidesteps that footgun entirely.
 *
 * Phase 4b (WP Admin editor) reads this same registry to render its form widgets.
 */

import { z } from 'zod';
import type { WeaveInputType } from '../schema/types';

/** A registry entry: a Zod factory + a default-coercion rule for one input type. */
export interface InputTypeEntry {
  /** Build the Zod sub-schema for this field. `configs` is per-type — narrowed inside. */
  zod: (configs?: unknown) => z.ZodTypeAny;
  /** Resolve the field default: declared `defaultValue` wins, else the type fallback. */
  default: (input: { defaultValue?: unknown; configs?: unknown }) => unknown;
}

/** Shape of `select` configs we read (full type lives in schema/types.ts). */
interface SelectConfigsLike {
  options?: { value: string }[];
}

/** Shape of `range` configs we read. */
interface RangeConfigsLike {
  min?: number;
  max?: number;
}

/** A string-family entry: `z.string()` value, `''`-or-declared default. */
function stringEntry(): InputTypeEntry {
  return {
    zod: () => z.string(),
    default: (input) => input.defaultValue ?? '',
  };
}

export const inputRegistry: Record<WeaveInputType, InputTypeEntry> = {
  // String family: text/HTML/URL/color/ISO/code/markdown/picker IDs all validate as strings.
  text: stringEntry(),
  richtext: stringEntry(),
  color: stringEntry(),

  // OQ2 (Phase 4b D-11): image stores { id, url } from the WP Media Library, not a bare URL
  // string. `id` is the attachment ID (nullable when cleared); `url` is the full media URL.
  // The WP Admin image control (WEAVE-WP-08) persists exactly this object; it round-trips
  // through schemaToZod because WeaveSectionSchema.data is z.record(z.string(), z.unknown()).
  image: {
    zod: () => z.object({ id: z.number().nullable(), url: z.string() }),
    default: (input) => input.defaultValue ?? { id: null, url: '' },
  },

  url: stringEntry(),
  datetime: stringEntry(),
  code: stringEntry(),
  markdown: stringEntry(),
  // WooCommerce pickers carry a slug/ID string (NOT a Shopify GID).
  'product-picker': stringEntry(),
  'collection-picker': stringEntry(),

  number: {
    zod: () => z.number(),
    default: (input) => input.defaultValue ?? 0,
  },

  toggle: {
    zod: () => z.boolean(),
    default: (input) => input.defaultValue ?? false,
  },

  repeater: {
    zod: () => z.array(z.unknown()),
    default: (input) => input.defaultValue ?? [],
  },

  select: {
    zod: (configs) => {
      const options = (configs as SelectConfigsLike | undefined)?.options;
      if (options && options.length > 0) {
        const values = options.map((o) => o.value) as [string, ...string[]];
        return z.enum(values);
      }
      // No options declared → accept any string (editor will supply options later).
      return z.string();
    },
    default: (input) => {
      if (input.defaultValue !== undefined) return input.defaultValue;
      return (input.configs as SelectConfigsLike | undefined)?.options?.[0]?.value ?? '';
    },
  },

  range: {
    zod: (configs) => {
      const bounds = configs as RangeConfigsLike | undefined;
      let schema = z.number();
      if (typeof bounds?.min === 'number') schema = schema.min(bounds.min);
      if (typeof bounds?.max === 'number') schema = schema.max(bounds.max);
      return schema;
    },
    default: (input) => {
      if (input.defaultValue !== undefined) return input.defaultValue;
      return (input.configs as RangeConfigsLike | undefined)?.min ?? 0;
    },
  },
};
