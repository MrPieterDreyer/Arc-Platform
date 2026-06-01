/**
 * `applyDefaults` — fill missing section data from each input's default BEFORE validation (D-07, SDK-08).
 *
 * When a section's `data` is partial, every declared input name that is `undefined` is filled
 * from the input-type registry's `default()` rule (declared `defaultValue` wins, else the type
 * fallback). This explicit pre-merge runs BEFORE `schemaToZod().safeParse` — the defaults-then-
 * validate ordering. Defaults live here, NOT as a Zod union `.default()`, which sidesteps the
 * Zod-4 discriminated-union-default footgun (RESEARCH §Pitfall 1, Zod issue #5264).
 *
 * Only missing keys are filled — a falsy-but-present value (e.g. `false`, `0`, `''`) is kept.
 */

import { inputRegistry } from '../inputs/input-registry';
import type { WeaveComponentSchema } from '../schema/types';

/** Merge declared/fallback defaults into `data` for every missing input name. */
export function applyDefaults(
  schema: WeaveComponentSchema,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  for (const group of schema.inspector) {
    for (const input of group.inputs) {
      if (out[input.name] === undefined) {
        out[input.name] = inputRegistry[input.type].default(input);
      }
    }
  }
  return out;
}
