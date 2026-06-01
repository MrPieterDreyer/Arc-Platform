/**
 * Conditional-visibility predicate (SDK-06, D-12).
 *
 * Weaverse uses a function-form `condition`; Arc deliberately diverges to a declarative string
 * predicate `'field.op.value'` so the schema stays JSON-serializable and the Phase 4b editor can
 * evaluate it without `eval`/`Function` (RESEARCH §State of the Art — intentional divergence).
 *
 * Operators: eq | ne | gt | gte | lt | lte. The comparison ops (gt/gte/lt/lte) coerce both sides
 * to `Number`; eq/ne compare stringwise.
 *
 * RSC-safe: pure functions, no imports, no DOM, no `next/*`.
 */

/** The 6 supported comparison operators. */
export type ConditionOp = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';

/** A parsed predicate: `field` reads from section data, `op` compares against `value`. */
export interface ParsedCondition {
  field: string;
  op: ConditionOp;
  value: string;
}

const OPS: readonly ConditionOp[] = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'];

/**
 * Parse `'field.op.value'` into its parts. Splits into AT MOST 3 segments so a dotted value
 * survives (`'price.gte.19.99'` → value `'19.99'`, RESEARCH §Pitfall 5).
 *
 * Returns `null` for a malformed predicate (missing op segment or unknown operator).
 */
export function parseCondition(input: string): ParsedCondition | null {
  const first = input.indexOf('.');
  if (first < 0) return null;

  const rest = input.slice(first + 1);
  const second = rest.indexOf('.');
  if (second < 0) return null;

  const field = input.slice(0, first);
  const op = rest.slice(0, second) as ConditionOp;
  const value = rest.slice(second + 1);

  if (!OPS.includes(op)) return null;
  return { field, op, value };
}

/**
 * Evaluate `'field.op.value'` against a section's `data`. A malformed predicate fails open
 * (returns `true` → field visible) so a typo never silently hides a field.
 */
export function evaluateCondition(input: string, data: Record<string, unknown>): boolean {
  const c = parseCondition(input);
  if (!c) return true; // fail-open on malformed predicate

  const actual = data[c.field];
  switch (c.op) {
    case 'eq':
      return String(actual) === c.value;
    case 'ne':
      return String(actual) !== c.value;
    case 'gt':
      return Number(actual) > Number(c.value);
    case 'gte':
      return Number(actual) >= Number(c.value);
    case 'lt':
      return Number(actual) < Number(c.value);
    case 'lte':
      return Number(actual) <= Number(c.value);
  }
}
