import { describe, expect, it } from 'vitest';
import type { WeaveInputType } from '../../schema/types';
import { inputRegistry } from '../../inputs/input-registry';

/**
 * Table-driven coverage of all 15 input types (SDK-05 / SC#5). For each type we assert:
 *   (a) `.zod()` returns a parseable Zod schema for a representative valid value;
 *   (b) `.default()` with no declared `defaultValue` returns the type fallback;
 *   (c) `.default()` with a declared `defaultValue` returns that declared value.
 */

/** The 15 WeaveInputType literals — the registry must key off exactly these. */
const ALL_TYPES: WeaveInputType[] = [
  'text',
  'richtext',
  'number',
  'toggle',
  'select',
  'color',
  'image',
  'url',
  'product-picker',
  'collection-picker',
  'repeater',
  'range',
  'datetime',
  'code',
  'markdown',
];

interface TypeCase {
  type: WeaveInputType;
  /** A value the type's zod() schema must accept. */
  validValue: unknown;
  /** configs passed to zod()/default() (select options, range bounds, …). */
  configs?: unknown;
  /** The fallback default when no `defaultValue` is declared. */
  fallback: unknown;
  /** A declared `defaultValue` that must win over the fallback. */
  declared: unknown;
}

const CASES: TypeCase[] = [
  { type: 'text', validValue: 'hi', fallback: '', declared: 'hello' },
  { type: 'richtext', validValue: '<p>x</p>', fallback: '', declared: '<b>b</b>' },
  { type: 'number', validValue: 42, fallback: 0, declared: 7 },
  { type: 'toggle', validValue: true, fallback: false, declared: true },
  {
    type: 'select',
    validValue: 'a',
    configs: { options: [{ label: 'A', value: 'a' }] },
    fallback: 'a',
    declared: 'a',
  },
  { type: 'color', validValue: '#0369a1', fallback: '', declared: '#fff' },
  // OQ2: image is a { id, url } object, not a bare string (D-11).
  {
    type: 'image',
    validValue: { id: 7, url: 'https://x/y.png' },
    fallback: { id: null, url: '' },
    declared: { id: 9, url: 'a.png' },
  },
  { type: 'url', validValue: 'https://x', fallback: '', declared: 'https://y' },
  { type: 'product-picker', validValue: 'driver-1', fallback: '', declared: 'putter-2' },
  { type: 'collection-picker', validValue: 'drivers', fallback: '', declared: 'putters' },
  { type: 'repeater', validValue: [{ a: 1 }], fallback: [], declared: [{ b: 2 }] },
  { type: 'range', validValue: 5, configs: { min: 2, max: 10 }, fallback: 2, declared: 8 },
  {
    type: 'datetime',
    validValue: '2026-06-01T00:00:00Z',
    fallback: '',
    declared: '2026-01-01T00:00:00Z',
  },
  { type: 'code', validValue: 'const x = 1', fallback: '', declared: 'let y = 2' },
  { type: 'markdown', validValue: '# H', fallback: '', declared: '## H2' },
];

describe('inputRegistry — structure', () => {
  it('has exactly 15 entries keyed by the 15 WeaveInputType literals', () => {
    const keys = Object.keys(inputRegistry).sort();
    expect(keys.length).toBe(15);
    expect(keys).toEqual([...ALL_TYPES].sort());
  });

  it('every entry exposes a zod factory and a default rule', () => {
    for (const type of ALL_TYPES) {
      expect(typeof inputRegistry[type].zod).toBe('function');
      expect(typeof inputRegistry[type].default).toBe('function');
    }
  });
});

describe('inputRegistry — zod factories accept valid values', () => {
  for (const c of CASES) {
    it(`${c.type}.zod() parses a valid value`, () => {
      const schema = inputRegistry[c.type].zod(c.configs);
      expect(schema.safeParse(c.validValue).success).toBe(true);
    });
  }
});

describe('inputRegistry — type fallback defaults (no declared defaultValue)', () => {
  for (const c of CASES) {
    it(`${c.type}.default() with no declared value returns the type fallback`, () => {
      const result = inputRegistry[c.type].default({ configs: c.configs });
      expect(result).toEqual(c.fallback);
    });
  }
});

describe('inputRegistry — declared defaultValue wins over fallback', () => {
  for (const c of CASES) {
    it(`${c.type}.default({ defaultValue }) returns the declared value`, () => {
      const result = inputRegistry[c.type].default({
        defaultValue: c.declared,
        configs: c.configs,
      });
      expect(result).toEqual(c.declared);
    });
  }
});

describe('inputRegistry — spot-check Zod sub-schema kinds', () => {
  it('text.zod() is a ZodString', () => {
    expect(inputRegistry.text.zod(undefined).constructor.name).toBe('ZodString');
  });
  it('number.zod() is a ZodNumber', () => {
    expect(inputRegistry.number.zod(undefined).constructor.name).toBe('ZodNumber');
  });
  it('toggle.zod() is a ZodBoolean', () => {
    expect(inputRegistry.toggle.zod(undefined).constructor.name).toBe('ZodBoolean');
  });
  it('repeater.zod() is a ZodArray', () => {
    expect(inputRegistry.repeater.zod(undefined).constructor.name).toBe('ZodArray');
  });
  it('select.zod({options}) rejects a value outside the options', () => {
    const schema = inputRegistry.select.zod({ options: [{ label: 'A', value: 'a' }] });
    expect(schema.safeParse('a').success).toBe(true);
    expect(schema.safeParse('zzz').success).toBe(false);
  });
  it('select.zod() with no options falls back to a permissive string', () => {
    expect(inputRegistry.select.zod(undefined).safeParse('anything').success).toBe(true);
  });
  it('range.zod({min,max}) clamps out-of-bounds values', () => {
    const schema = inputRegistry.range.zod({ min: 2, max: 10 });
    expect(schema.safeParse(5).success).toBe(true);
    expect(schema.safeParse(99).success).toBe(false);
    expect(schema.safeParse(0).success).toBe(false);
  });
  it('range.default() falls back to configs.min when no declared value', () => {
    expect(inputRegistry.range.default({ configs: { min: 3, max: 9 } })).toBe(3);
  });
  it('select.default() falls back to the first option when no declared value', () => {
    expect(
      inputRegistry.select.default({ configs: { options: [{ label: 'B', value: 'b' }] } }),
    ).toBe('b');
  });
});
