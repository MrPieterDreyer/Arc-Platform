import { describe, expect, it } from 'vitest';
import {
  type ConditionOp,
  evaluateCondition,
  parseCondition,
} from '../../render/condition';

/**
 * SDK-06 / D-12: conditional visibility is a declarative string predicate `'field.op.value'`
 * (ops eq|ne|gt|gte|lt|lte), NOT a function — JSON-serializable + editor-evaluable. The value
 * may itself contain dots (`'price.gte.19.99'`) so parsing splits into AT MOST 3 parts
 * (RESEARCH §Pitfall 5).
 */

describe('parseCondition', () => {
  it('parses a simple field.op.value predicate', () => {
    expect(parseCondition('visible.eq.true')).toEqual({
      field: 'visible',
      op: 'eq',
      value: 'true',
    });
  });

  it('preserves a dotted value (Pitfall 5 — at most 3 parts)', () => {
    expect(parseCondition('price.gte.19.99')).toEqual({
      field: 'price',
      op: 'gte',
      value: '19.99',
    });
  });

  it('returns null for a string with no operator segment', () => {
    expect(parseCondition('visible')).toBeNull();
  });

  it('returns null for an unrecognized operator', () => {
    expect(parseCondition('count.contains.3')).toBeNull();
  });
});

describe('evaluateCondition — all 6 operators', () => {
  it('eq: matches / mismatches', () => {
    expect(evaluateCondition('layout.eq.grid', { layout: 'grid' })).toBe(true);
    expect(evaluateCondition('layout.eq.grid', { layout: 'list' })).toBe(false);
  });

  it('ne: differs / equal', () => {
    expect(evaluateCondition('layout.ne.grid', { layout: 'list' })).toBe(true);
    expect(evaluateCondition('layout.ne.grid', { layout: 'grid' })).toBe(false);
  });

  it('gt: greater / not greater', () => {
    expect(evaluateCondition('count.gt.3', { count: 5 })).toBe(true);
    expect(evaluateCondition('count.gt.3', { count: 2 })).toBe(false);
  });

  it('gte: at-least / below', () => {
    expect(evaluateCondition('count.gte.3', { count: 3 })).toBe(true);
    expect(evaluateCondition('count.gte.3', { count: 2 })).toBe(false);
  });

  it('lt: less / not less', () => {
    expect(evaluateCondition('count.lt.3', { count: 2 })).toBe(true);
    expect(evaluateCondition('count.lt.3', { count: 5 })).toBe(false);
  });

  it('lte: at-most / above', () => {
    expect(evaluateCondition('count.lte.3', { count: 3 })).toBe(true);
    expect(evaluateCondition('count.lte.3', { count: 5 })).toBe(false);
  });

  it('numeric comparison ops coerce the dotted value (price.gte.19.99)', () => {
    expect(evaluateCondition('price.gte.19.99', { price: 20 })).toBe(true);
    expect(evaluateCondition('price.gte.19.99', { price: 19.98 })).toBe(false);
  });

  it('fails open (returns true) for a malformed predicate', () => {
    expect(evaluateCondition('visible', { visible: false })).toBe(true);
  });
});

// type-level guard: ConditionOp covers the 6 ops
const _ops: ConditionOp[] = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'];
void _ops;
