import { describe, expect, it } from 'vitest';
import { WeavePageConfigSchema } from '../../schemas/page-config';

/** A valid ADR-0005 §Decision document. */
const validConfig = {
  schemaVersion: 1,
  slug: 'home',
  sections: [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'hero',
      data: {
        heading: 'Welcome to LOFT Pro Shop',
        subheading: 'Premium golf equipment',
        ctaLabel: 'Shop Now',
        ctaHref: '/shop',
      },
      version: 1,
    },
    {
      id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      type: 'featured-products',
      data: { collectionSlug: 'featured', limit: 4 },
      version: 1,
    },
  ],
  updatedAt: '2026-05-28T14:00:00Z',
};

describe('WeavePageConfigSchema', () => {
  it('accepts a valid ADR-0005 document', () => {
    const result = WeavePageConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('rejects a document missing slug, with an issue path including slug', () => {
    const { slug: _slug, ...missingSlug } = validConfig;
    const result = WeavePageConfigSchema.safeParse(missingSlug);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join('.'));
      expect(paths).toContain('slug');
    }
  });

  it('rejects a section whose version is a string (must be integer)', () => {
    const stringVersion = {
      ...validConfig,
      sections: [{ ...validConfig.sections[0], version: '1' }],
    };
    const result = WeavePageConfigSchema.safeParse(stringVersion);
    expect(result.success).toBe(false);
  });

  it('allows an unknown section type string (registry resolution happens in the renderer)', () => {
    const unknownType = {
      ...validConfig,
      sections: [{ ...validConfig.sections[0], type: 'not-a-real-section' }],
    };
    const result = WeavePageConfigSchema.safeParse(unknownType);
    expect(result.success).toBe(true);
  });

  it('rejects unknown top-level keys (parity with PHP Weave_Validator D-07)', () => {
    const withExtra = { ...validConfig, extraField: 'nope' };
    const result = WeavePageConfigSchema.safeParse(withExtra);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) =>
            issue.code === 'unrecognized_keys' &&
            'keys' in issue &&
            (issue.keys as string[]).includes('extraField'),
        ),
      ).toBe(true);
    }
  });

  it('rejects unknown keys inside a section object', () => {
    const withExtraSection = {
      ...validConfig,
      sections: [{ ...validConfig.sections[0], rogue: true }],
    };
    const result = WeavePageConfigSchema.safeParse(withExtraSection);
    expect(result.success).toBe(false);
  });
});
