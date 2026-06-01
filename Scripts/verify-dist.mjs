#!/usr/bin/env node
// TOOL-04 contract: every package produces dist/index.{mjs,js,d.ts}
// Source: .planning/phases/00-tooling-foundations/00-RESEARCH.md (Validation Architecture)
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const PACKAGES = ['Arc/Core', 'Arc/Next', 'Weave/React', 'Weave/Next'];

const REQUIRED_FILES = ['dist/index.mjs', 'dist/index.js', 'dist/index.d.ts'];

// Subpath exports that ship their own dist artifacts beyond the index barrel.
const SUBPATH_FILES = { 'Weave/React': ['dist/client.mjs', 'dist/client.js', 'dist/client.d.ts'] };

let failed = 0;
for (const pkg of PACKAGES) {
  for (const f of REQUIRED_FILES) {
    const path = join(ROOT, pkg, f);
    const rel = `${pkg}/${f}`;
    if (!existsSync(path)) {
      console.error(`[verify-dist] MISSING: ${rel}`);
      failed += 1;
    }
  }
}

for (const [pkg, files] of Object.entries(SUBPATH_FILES)) {
  for (const f of files) {
    const path = join(ROOT, pkg, f);
    const rel = `${pkg}/${f}`;
    if (!existsSync(path)) {
      console.error(`[verify-dist] MISSING: ${rel}`);
      failed += 1;
    }
  }
}

if (failed > 0) {
  console.error(`\n[verify-dist] ${failed} missing artifact(s). Run \`pnpm build\` first.`);
  process.exit(1);
}
console.log(
  `[verify-dist] OK — all ${PACKAGES.length} packages have ${REQUIRED_FILES.join(', ')}` +
    ` (+ @weave/react client subpath dist/client.*)`,
);
