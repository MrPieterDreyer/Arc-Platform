import { describe, expect, it } from 'vitest';
import type { WeaveComponentSchema, WeaveInput } from '../../schema/types';
import { applyDefaults } from '../../render/apply-defaults';
import { schemaToZod } from '../../render/schema-to-zod';

/**
 * `applyDefaults(schema, data)` fills missing input names from each input's `defaultValue`
 * (or the type fallback) BEFORE validation/render (D-07, SDK-08). The defaults-then-validate
 * ordering is the contract that sidesteps the Zod-4 union-default footgun (RESEARCH §Pitfall 1).
 */

/** A schema covering text + number + toggle with declared and fallback defaults. */
const mixedSchema: WeaveComponentSchema = {
  type: 'card',
  title: 'Card',
  inspector: [
    {
      group: 'Content',
      inputs: [
        { type: 'text', name: 'heading', label: 'Heading', defaultValue: 'Default heading' },
        { type: 'number', name: 'limit', label: 'Limit' },
        { type: 'toggle', name: 'showBorder', label: 'Show border', defaultValue: true },
      ],
    },
  ],
};

describe('applyDefaults', () => {
  it('fills every declared input name with its default when data is empty', () => {
    const out = applyDefaults(mixedSchema, {});
    expect(out).toEqual({ heading: 'Default heading', limit: 0, showBorder: true });
  });

  it('keeps provided values and fills only the missing ones (partial merge)', () => {
    const out = applyDefaults(mixedSchema, { heading: 'custom' });
    expect(out.heading).toBe('custom');
    expect(out.limit).toBe(0);
    expect(out.showBorder).toBe(true);
  });

  it('does not overwrite a falsy-but-present value', () => {
    const out = applyDefaults(mixedSchema, { showBorder: false, limit: 0 });
    expect(out.showBorder).toBe(false);
    expect(out.limit).toBe(0);
  });
});

/** One input of every one of the 15 types, with type-appropriate configs. */
const allFifteenSchema: WeaveComponentSchema = {
  type: 'kitchen-sink',
  title: 'Kitchen Sink',
  inspector: [
    {
      group: 'All',
      inputs: [
        { type: 'text', name: 'f_text', label: 'text' },
        { type: 'richtext', name: 'f_richtext', label: 'richtext' },
        { type: 'number', name: 'f_number', label: 'number' },
        { type: 'toggle', name: 'f_toggle', label: 'toggle' },
        {
          type: 'select',
          name: 'f_select',
          label: 'select',
          configs: { options: [{ label: 'A', value: 'a' }] },
        },
        { type: 'color', name: 'f_color', label: 'color' },
        { type: 'image', name: 'f_image', label: 'image' },
        { type: 'url', name: 'f_url', label: 'url' },
        { type: 'product-picker', name: 'f_product', label: 'product' },
        { type: 'collection-picker', name: 'f_collection', label: 'collection' },
        { type: 'repeater', name: 'f_repeater', label: 'repeater', configs: { inputs: [] } },
        { type: 'range', name: 'f_range', label: 'range', configs: { min: 1, max: 10 } },
        { type: 'datetime', name: 'f_datetime', label: 'datetime' },
        { type: 'code', name: 'f_code', label: 'code' },
        { type: 'markdown', name: 'f_markdown', label: 'markdown' },
      ] as WeaveInput[],
    },
  ],
};

describe('defaults-then-validate ordering across all 15 types', () => {
  it('applyDefaults fills all 15 fields and the result validates (SDK-08 -> SDK-07)', () => {
    const merged = applyDefaults(allFifteenSchema, {});
    // Every declared name is present after the pre-merge.
    expect(Object.keys(merged).sort()).toEqual(
      [
        'f_text',
        'f_richtext',
        'f_number',
        'f_toggle',
        'f_select',
        'f_color',
        'f_image',
        'f_url',
        'f_product',
        'f_collection',
        'f_repeater',
        'f_range',
        'f_datetime',
        'f_code',
        'f_markdown',
      ].sort(),
    );
    // The whole merged object passes the derived validator — the locked contract.
    const result = schemaToZod(allFifteenSchema).safeParse(merged);
    expect(result.success).toBe(true);
  });

  it('range default falls back to configs.min', () => {
    const merged = applyDefaults(allFifteenSchema, {});
    expect(merged.f_range).toBe(1);
  });

  it('select default falls back to the first option value', () => {
    const merged = applyDefaults(allFifteenSchema, {});
    expect(merged.f_select).toBe('a');
  });
});
