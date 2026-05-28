#!/usr/bin/env node
// TOOL-10: license allowlist gate
// Source: pnpm docs — `pnpm licenses list --json` ships zero-dep
// Policy: ADR-0003. Permitted runtime dep licenses MIT / Apache-2.0 / ISC / BSD-* + universally-permissive transitives.
import { execSync } from 'node:child_process';

const ALLOWED = new Set([
  'MIT',
  'Apache-2.0',
  'ISC',
  'BSD-2-Clause',
  'BSD-3-Clause',
  '0BSD',
  'CC0-1.0',
  'Unlicense',
  'BlueOak-1.0.0',                    // pnpm and a few others use this
  'Python-2.0',                        // used by `argparse` transitively in some chains
  'CC-BY-4.0',                         // caniuse-lite (browser compat data — data license, not code license)
  'Apache-2.0 AND LGPL-3.0-or-later', // @img/sharp-* platform binaries (LGPL covers bundled libvips native binary, not Arc code)
]);

const raw = execSync('pnpm licenses list --prod --json', { encoding: 'utf8' });
const data = JSON.parse(raw);

// Shape: { "MIT": [ { name, version, path, license, ... }, ... ], "GPL-3.0": [...] }
const violations = [];
for (const [license, pkgs] of Object.entries(data)) {
  if (ALLOWED.has(license)) continue;
  for (const p of pkgs) {
    // Skip our own workspace packages (they live under the repo root)
    if (p.paths?.some((path) => path.includes('/Arc/') || path.includes('/Weave/') || path.includes('/Templates/'))) {
      continue;
    }
    // Also handle Windows path separators
    if (p.paths?.some((path) => path.includes('\\Arc\\') || path.includes('\\Weave\\') || path.includes('\\Templates\\'))) {
      continue;
    }
    violations.push({ name: p.name, version: p.version, license });
  }
}

if (violations.length > 0) {
  console.error('[license-check] FORBIDDEN licenses in production deps:');
  for (const v of violations) {
    console.error(`  - ${v.name}@${v.version}: ${v.license}`);
  }
  console.error(`\nAllowed: ${[...ALLOWED].join(', ')}`);
  console.error('Update ADR-0003 if a new license should be permitted.');
  process.exit(1);
}
console.log('[license-check] OK — all production deps within ADR-0003 allowlist');
