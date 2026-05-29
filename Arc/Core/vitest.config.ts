import { defineProject, mergeConfig } from 'vitest/config';
import { baseConfig } from '../../vitest.base';

export default mergeConfig(
  baseConfig,
  defineProject({
    test: {
      name: 'arc-core',
      environment: 'node',
      include: ['src/**/*.test.ts', 'src/**/*.contract.ts'],
      environmentMatchGlobs: [['src/__tests__/unit/hooks.test.ts', 'jsdom']],
      setupFiles: ['@testing-library/jest-dom/vitest'],
    },
  }),
);
