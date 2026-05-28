import { defineProject, mergeConfig } from 'vitest/config';
import { baseConfig } from '../../vitest.base';

export default mergeConfig(
  baseConfig,
  defineProject({
    test: {
      name: 'arc-core',
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  }),
);
