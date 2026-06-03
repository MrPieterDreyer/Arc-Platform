import { defineProject, mergeConfig } from 'vitest/config';
import { baseConfig } from '../../vitest.base';

export default mergeConfig(
  baseConfig,
  defineProject({
    test: {
      name: 'weave-next',
      environment: 'node',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      setupFiles: ['./vitest.setup.ts'],
    },
  }),
);
