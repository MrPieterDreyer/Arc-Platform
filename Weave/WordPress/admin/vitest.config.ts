import { fileURLToPath } from 'node:url';
import { defineProject, mergeConfig } from 'vitest/config';
import { baseConfig } from '../../../vitest.base';

/**
 * weave-admin test harness (04B Wave-0). The WP Admin editor imports `@wordpress/*`
 * modules that are externalized at build (provided by WP at runtime) and absent under
 * jsdom. Every `@wordpress/*` specifier is aliased to ONE stub module so the form
 * components render in jsdom without the real WP runtime. Tests run in jsdom with
 * Vitest globals + the jest-dom matchers (mirrors the Weave/React boundary harness).
 */
const wpStub = fileURLToPath(
  new URL('./src/__tests__/__mocks__/wordpress.ts', import.meta.url),
);

export default mergeConfig(
  baseConfig,
  defineProject({
    test: {
      name: 'weave-admin',
      environment: 'jsdom',
      globals: true,
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: ['@testing-library/jest-dom/vitest'],
      passWithNoTests: true,
      alias: {
        '@wordpress/components': wpStub,
        '@wordpress/element': wpStub,
        '@wordpress/api-fetch': wpStub,
        '@wordpress/media-utils': wpStub,
        '@wordpress/icons': wpStub,
        '@wordpress/i18n': wpStub,
      },
    },
  }),
);
