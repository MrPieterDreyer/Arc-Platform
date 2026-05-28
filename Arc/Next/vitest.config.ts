import { defineProject, mergeConfig } from 'vitest/config';
import { baseConfig } from '../../vitest.base';

export default mergeConfig(
  baseConfig,
  defineProject({
    test: {
      name: 'arc-next',
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  }),
);
