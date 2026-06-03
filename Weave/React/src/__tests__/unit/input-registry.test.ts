import { describe, expect, it } from 'vitest';
import { inputRegistry } from '../../inputs/input-registry';
import { schemaToZod } from '../../render/schema-to-zod';
import type { WeaveComponentSchema } from '../../schema/types';

/**
 * OQ2 (Phase 4b, D-11) — the `image` input stores `{ id, url }` from the WP Media Library,
 * not a bare URL string. `id` is the attachment ID (nullable when cleared); `url` is the full
 * media URL. This is the automated proof for the WEAVE-WP-08 image value shape — Plan 07's
 * image control persists exactly this object, and it must round-trip through per-section
 * validation (`schemaToZod`) unchanged.
 */
describe('inputRegistry.image — OQ2 { id, url } object value', () => {
  it('accepts a populated { id, url }', () => {
    const result = inputRegistry.image.zod().safeParse({
      id: 12,
      url: 'https://x/y.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a cleared image { id: null, url: "" }', () => {
    const result = inputRegistry.image.zod().safeParse({ id: null, url: '' });
    expect(result.success).toBe(true);
  });

  it('REJECTS the legacy bare-URL string (migration away from stringEntry)', () => {
    const result = inputRegistry.image.zod().safeParse('https://x/y.jpg');
    expect(result.success).toBe(false);
  });

  it('default() returns { id: null, url: "" } when no declared defaultValue', () => {
    expect(inputRegistry.image.default({})).toEqual({ id: null, url: '' });
  });

  it('declared defaultValue wins over the { id, url } fallback', () => {
    const declared = { id: 5, url: 'https://x/declared.jpg' };
    expect(inputRegistry.image.default({ defaultValue: declared })).toEqual(declared);
  });

  it('round-trips through schemaToZod for a section with one image input', () => {
    const schema: WeaveComponentSchema = {
      type: 'hero',
      title: 'Hero',
      inspector: [
        {
          group: 'Media',
          inputs: [{ type: 'image', name: 'background', label: 'Background image' }],
        },
      ],
    };
    const validator = schemaToZod(schema);
    expect(validator.safeParse({ background: { id: 1, url: 'https://x/bg.jpg' } }).success).toBe(
      true,
    );
    // The old bare-string value no longer round-trips.
    expect(validator.safeParse({ background: 'https://x/bg.jpg' }).success).toBe(false);
  });
});
