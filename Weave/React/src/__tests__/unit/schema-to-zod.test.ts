import { describe, expect, it } from 'vitest';
import type { WeaveComponentSchema } from '../../schema/types';
import { schemaToZod } from '../../render/schema-to-zod';

/**
 * `schemaToZod(schema)` derives a per-section Zod validator from the declarative `inspector`
 * inputs (D-04, SDK-07). Authors never hand-write Zod — the schema is the single source of
 * truth that drives both the TS prop types and this runtime validator.
 */

/** A two-field schema spanning two inspector groups (text + number). */
const headingLimitSchema: WeaveComponentSchema = {
  type: 'featured',
  title: 'Featured',
  inspector: [
    { group: 'Content', inputs: [{ type: 'text', name: 'heading', label: 'Heading' }] },
    { group: 'Layout', inputs: [{ type: 'number', name: 'limit', label: 'Limit' }] },
  ],
};

describe('schemaToZod', () => {
  it('returns a ZodObject with one key per input name across all groups', () => {
    const schema = schemaToZod(headingLimitSchema);
    expect(schema.constructor.name).toBe('ZodObject');
    expect(Object.keys(schema.shape).sort()).toEqual(['heading', 'limit']);
  });

  it('accepts well-typed data', () => {
    const schema = schemaToZod(headingLimitSchema);
    expect(schema.safeParse({ heading: 'x', limit: 4 }).success).toBe(true);
  });

  it('rejects malformed data (number field given a string) — SDK-07 catches it', () => {
    const schema = schemaToZod(headingLimitSchema);
    expect(schema.safeParse({ heading: 'x', limit: 'four' }).success).toBe(false);
  });

  it('honors per-type configs (select enum from options)', () => {
    const selectSchema: WeaveComponentSchema = {
      type: 'banner',
      title: 'Banner',
      inspector: [
        {
          group: 'Style',
          inputs: [
            {
              type: 'select',
              name: 'variant',
              label: 'Variant',
              configs: { options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }] },
            },
          ],
        },
      ],
    };
    const schema = schemaToZod(selectSchema);
    expect(schema.safeParse({ variant: 'a' }).success).toBe(true);
    expect(schema.safeParse({ variant: 'zzz' }).success).toBe(false);
  });
});
