/**
 * `schemaToZod` — derive a per-section Zod validator from the declarative schema (D-04, SDK-07).
 *
 * The `inspector` inputs are the single source of truth: this walks every input across every
 * group and asks the input-type registry for each field's Zod sub-schema, then assembles them
 * into one `z.object`. Authors never hand-write Zod — they declare inputs, and validation is
 * derived. The renderer runs `applyDefaults` BEFORE `.safeParse` (defaults-then-validate, D-07),
 * so partial section data is filled before it reaches this validator.
 */

import { z } from 'zod';
import { inputRegistry } from '../inputs/input-registry';
import type { WeaveComponentSchema } from '../schema/types';

/** Build a `z.object` whose keys are the section's input names, validated per their type. */
export function schemaToZod(
  schema: WeaveComponentSchema,
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const group of schema.inspector) {
    for (const input of group.inputs) {
      // `configs` exists only on select/range/repeater members of the union; read it
      // structurally (undefined for string-family inputs — the factories tolerate that).
      const configs = (input as { configs?: unknown }).configs;
      shape[input.name] = inputRegistry[input.type].zod(configs);
    }
  }
  return z.object(shape);
}
