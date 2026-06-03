#!/usr/bin/env node
// OQ1 contract: @weave/next builds two entries and EXTERNALIZES React — the
// server bundle must `import` React / @weave/react / @arc/next rather than
// inline a second React copy (which would collide with the host app's React).
// Source: .planning/phases/04B-weave-next-wp-admin/04B-04-PLAN.md (<verification>).
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'Weave/Next/dist');

// 1. Both entries must exist (the two-entry tsup build).
const REQUIRED = [
  'index.mjs',
  'index.js',
  'index.d.ts',
  'server.mjs',
  'server.js',
  'server.d.ts',
];
let failed = 0;
for (const f of REQUIRED) {
  if (!existsSync(join(DIST, f))) {
    console.error(`[externals] MISSING: Weave/Next/dist/${f}`);
    failed += 1;
  }
}
if (failed > 0) {
  console.error(`\n[externals] ${failed} missing artifact(s). Run \`pnpm --filter @weave/next build\` first.`);
  process.exit(1);
}

// 2. server.mjs must externalize peers (import them, not inline them).
const server = readFileSync(join(DIST, 'server.mjs'), 'utf8');

// At least one externalized peer import must be present. The server barrel pulls
// @arc/next (revalidate + cache profile) and may pull react/@weave/react.
const EXTERNAL_IMPORT = /\bfrom\s*["'](react(\/jsx-runtime)?|react-dom|@weave\/react|@arc\/next(\/server)?)["']/;
if (!EXTERNAL_IMPORT.test(server)) {
  console.error(
    '[externals] FAIL: dist/server.mjs does not import any externalized peer ' +
      '(react / react-dom / @weave/react / @arc/next). React/peers may have been bundled.',
  );
  process.exit(1);
}

// 3. No inlined React internals (a bundled React copy leaks these sentinels).
const REACT_SENTINELS = ['react.production.min', '__SECRET_INTERNALS_DO_NOT_USE', 'react-dom.production.min'];
for (const sentinel of REACT_SENTINELS) {
  if (server.includes(sentinel)) {
    console.error(`[externals] FAIL: dist/server.mjs inlines React (found "${sentinel}").`);
    process.exit(1);
  }
}

console.log('[externals] OK — two entries emitted; dist/server.mjs externalizes React/peers (no inlined React).');
