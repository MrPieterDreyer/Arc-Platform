import { defineProject, mergeConfig } from 'vitest/config';
import { baseConfig } from '../../vitest.base';

export default mergeConfig(
  baseConfig,
  defineProject({
    test: {
      name: 'arc-next',
      environment: 'node',
      include: ['src/**/*.test.ts', 'src/**/*.contract.ts'],
      environmentMatchGlobs: [['src/**/use-optimistic-cart.test.ts', 'jsdom']],
      setupFiles: ['./vitest.setup.ts', '@testing-library/jest-dom/vitest'],
    },
  }),
);
