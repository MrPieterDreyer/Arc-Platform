// Vitest 4 workspace: test.projects replaces the removed defineWorkspace API
// See: https://vitest.dev/guide/projects
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'Arc/*/vitest.config.ts',
      'Weave/*/vitest.config.ts',
      'Templates/*/vitest.config.ts',
    ],
  },
});
