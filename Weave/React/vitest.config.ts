import { defineProject, mergeConfig } from 'vitest/config';
import { baseConfig } from '../../vitest.base';

export default mergeConfig(
  baseConfig,
  defineProject({
    test: {
      name: 'weave-react',
      environment: 'node',
      include: ['src/**/*.test.{ts,tsx}'],
      environmentMatchGlobs: [['src/__tests__/boundary.test.tsx', 'jsdom']],
      setupFiles: ['@testing-library/jest-dom/vitest'],
      passWithNoTests: true,
    },
  }),
);
