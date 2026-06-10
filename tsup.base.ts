import { defineConfig, type Options } from 'tsup';

export function arcTsup(overrides: Partial<Options> = {}): Options {
  return defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    target: 'es2022',
    splitting: false,
    minify: false,
    external: ['react', 'react-dom', 'next', /^@arc-platform\//, /^@weave-platform\//],
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.js' };
    },
    ...overrides,
  }) as Options;
}
