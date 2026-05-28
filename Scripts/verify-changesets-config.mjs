#!/usr/bin/env node
// TOOL-07 regression: .changeset/config.json must declare fixed groups for @arc/* and @weave/*.
// Source: .planning/phases/00-tooling-foundations/00-RESEARCH.md (Pattern 6) + PITFALLS P13.
import { existsSync, readFileSync } from 'node:fs';

const CONFIG_PATH = '.changeset/config.json';
if (!existsSync(CONFIG_PATH)) {
  console.error(`[verify-changesets-config] MISSING ${CONFIG_PATH}`);
  process.exit(1);
}
const cfg = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));

let failed = 0;

const fixed = cfg.fixed ?? [];
const hasArcGroup = fixed.some((g) => Array.isArray(g) && g.includes('@arc/*'));
const hasWeaveGroup = fixed.some((g) => Array.isArray(g) && g.includes('@weave/*'));
if (!hasArcGroup) {
  console.error('[verify-changesets-config] fixed groups missing ["@arc/*"]');
  failed += 1;
}
if (!hasWeaveGroup) {
  console.error('[verify-changesets-config] fixed groups missing ["@weave/*"]');
  failed += 1;
}

if (cfg.access !== 'public') {
  console.error(
    `[verify-changesets-config] access must be "public" (got ${JSON.stringify(cfg.access)})`,
  );
  failed += 1;
}

const changelog = Array.isArray(cfg.changelog) ? cfg.changelog[0] : cfg.changelog;
if (changelog !== '@changesets/changelog-github') {
  console.error(
    '[verify-changesets-config] changelog plugin must be "@changesets/changelog-github"',
  );
  failed += 1;
}

if (failed > 0) process.exit(1);
console.log('[verify-changesets-config] OK — fixed groups + access + changelog plugin all correct');
