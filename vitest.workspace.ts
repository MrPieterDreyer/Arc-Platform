// Source: https://vitest.dev/guide/workspace
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'Arc/*/vitest.config.ts',
  'Weave/*/vitest.config.ts',
  'Templates/*/vitest.config.ts',
]);
