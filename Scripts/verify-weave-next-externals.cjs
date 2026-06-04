#!/usr/bin/env node
// OQ1 contract: @weave/next builds three entries and EXTERNALIZES React — the
// server-page bundle must `import` React / @weave/react / @arc/next rather than
// inline a second React copy (which would collide with the host app's React).
// server.mjs must NOT import @weave/react (loader-only graph; Pitfall 5).
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'Weave/Next/dist');

// 1. All entries must exist (three-entry tsup build).
const REQUIRED = [
  'index.mjs',
  'index.js',
  'index.d.ts',
  'server.mjs',
  'server.js',
  'server.d.ts',
  'server-page.mjs',
  'server-page.js',
  'server-page.d.ts',
];
let failed = 0;
for (const f of REQUIRED) {
  if (!existsSync(join(DIST, f))) {
    console.error(`[externals] MISSING: Weave/Next/dist/${f}`);
    failed += 1;
  }
}
if (failed > 0) {
  console.error(
    `\n[externals] ${failed} missing artifact(s). Run \`pnpm --filter @weave/next build\` first.`,
  );
  process.exit(1);
}

const server = readFileSync(join(DIST, 'server.mjs'), 'utf8');
const serverPage = readFileSync(join(DIST, 'server-page.mjs'), 'utf8');

// 2. server.mjs must NOT pull @weave/react (loader-only; avoids client-only in RSC graph).
if (/\bfrom\s*["']@weave\/react["']/.test(server)) {
  console.error(
    '[externals] FAIL: dist/server.mjs imports @weave/react main barrel. ' +
      'Use @weave/react/schemas in load-page-config only; WeavePage belongs in server-page.mjs.',
  );
  process.exit(1);
}

// 3. server-page.mjs must externalize peers (import them, not inline them).
const EXTERNAL_IMPORT =
  /\bfrom\s*["'](react(\/jsx-runtime)?|react-dom|@weave\/react|@arc\/next(\/server)?)["']/;
if (!EXTERNAL_IMPORT.test(serverPage)) {
  console.error(
    '[externals] FAIL: dist/server-page.mjs does not import any externalized peer ' +
      '(react / react-dom / @weave/react / @arc/next). React/peers may have been bundled.',
  );
  process.exit(1);
}

// 4. No inlined React internals in server-page bundle.
const REACT_SENTINELS = [
  'react.production.min',
  '__SECRET_INTERNALS_DO_NOT_USE',
  'react-dom.production.min',
];
for (const sentinel of REACT_SENTINELS) {
  if (serverPage.includes(sentinel)) {
    console.error(`[externals] FAIL: dist/server-page.mjs inlines React (found "${sentinel}").`);
    process.exit(1);
  }
}

console.log(
  '[externals] OK — three entries emitted; server.mjs is loader-only; server-page.mjs externalizes React/peers.',
);
