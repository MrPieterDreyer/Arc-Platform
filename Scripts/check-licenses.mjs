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
  'BlueOak-1.0.0', // pnpm and a few others use this
  'Python-2.0', // used by `argparse` transitively in some chains
  'CC-BY-4.0', // caniuse-lite (browser compat data — data license, not code license)
  'Apache-2.0 AND LGPL-3.0-or-later', // @img/sharp-* platform binaries (LGPL covers bundled libvips native binary, not Arc code)
  'MIT-0', // MIT No Attribution — strictly more permissive than MIT; @csstools/* transitives of @wordpress/*
]);

// Accept a license string, resolving common SPDX compound expressions:
//  - "(A OR B)"      → permitted if ANY disjunct is permitted (consumer may pick it)
//  - "A WITH except"  → exceptions only ADD permissions, so check the base license
// This keeps the gate stable as transitive deps shift between equivalent permissive
// SPDX spellings (e.g. type-fest's "(MIT OR CC0-1.0)", mousetrap's
// "Apache-2.0 WITH LLVM-exception") without re-listing every variant by hand.
function isAllowed(license) {
  if (ALLOWED.has(license)) return true;
  const disjuncts = license.replace(/[()]/g, '').split(/\s+OR\s+/i);
  if (disjuncts.length > 1 && disjuncts.some((l) => ALLOWED.has(l.trim()))) return true;
  const base = license.split(/\s+WITH\s+/i)[0].trim();
  if (base !== license && ALLOWED.has(base)) return true;
  return false;
}

const raw = execSync('pnpm licenses list --prod --json', { encoding: 'utf8' });
const data = JSON.parse(raw);

// Shape: { "MIT": [ { name, version, path, license, ... }, ... ], "GPL-3.0": [...] }
const violations = [];
for (const [license, pkgs] of Object.entries(data)) {
  if (isAllowed(license)) continue;
  for (const p of pkgs) {
    // Skip our own workspace packages (they live under the repo root)
    if (
      p.paths?.some(
        (path) =>
          path.includes('/Arc/') || path.includes('/Weave/') || path.includes('/Templates/'),
      )
    ) {
      continue;
    }
    // Also handle Windows path separators
    if (
      p.paths?.some(
        (path) =>
          path.includes('\\Arc\\') || path.includes('\\Weave\\') || path.includes('\\Templates\\'),
      )
    ) {
      continue;
    }
    // Platform-specific native binaries pulled in transitively by Next.js's image
    // optimizer (sharp → libvips). The LGPL covers the bundled libvips native
    // binary, not Arc's MIT code, and Arc's PUBLISHED packages (@arc-platform/core,
    // @arc-platform/next) do not depend on sharp — it arrives via the consumer's `next`
    // install / the private example app. See ADR-0003.
    if (p.name?.startsWith('@img/sharp')) {
      continue;
    }
    // WordPress ecosystem packages (@wordpress/*) are GPL-2.0-or-later by design —
    // WordPress itself is GPL, so its packages must be. They are deps of the
    // GPL-licensed Weave WP-admin editor + WP plugin ONLY, and are externalized at
    // runtime by @wordpress/scripts (provided by the WP host, not bundled). The
    // PUBLISHED MIT packages (@arc-platform/core, @arc-platform/next, @weave-platform/react, @weave-platform/next)
    // never depend on them, so this copyleft does not reach Arc's MIT code. Same
    // boundary rationale as @img/sharp above. See ADR-0003.
    if (p.name?.startsWith('@wordpress/')) {
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
