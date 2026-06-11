import { defineProject, mergeConfig } from 'vitest/config';
import { baseConfig } from '../../vitest.base';

export default mergeConfig(
  baseConfig,
  defineProject({
    test: {
      name: 'arc-payment-stripe',
      environment: 'node',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      passWithNoTests: false,
    },
  }),
);
