#!/usr/bin/env node
// TOOL-07: refuse `major` changesets unless ARC_ALLOW_V1_PUBLISH=true.
// ADR-0001 versioning policy: all public packages stay 0.x.y until Customer Zero validation.
// Source: .planning/phases/00-tooling-foundations/00-RESEARCH.md (Pattern 6)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PUBLISH_FLAG = process.env.ARC_ALLOW_V1_PUBLISH === 'true';
if (PUBLISH_FLAG) {
  console.log('[changesets] ARC_ALLOW_V1_PUBLISH=true — major bumps permitted');
  process.exit(0);
}

const dir = '.changeset';
if (!existsSync(dir)) {
  console.log('[changesets] no .changeset directory — nothing to check');
  process.exit(0);
}
const files = readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md');
let failed = false;
for (const f of files) {
  const body = readFileSync(join(dir, f), 'utf8');
  // Frontmatter looks like: ---\n"@arc-platform/core": major\n---
  const matches = body.match(/^"[^"]+":\s*(major|minor|patch)/gm) ?? [];
  for (const m of matches) {
    if (m.includes('major')) {
      console.error(
        `[changesets] ${f} declares a MAJOR bump — refused while ARC_ALLOW_V1_PUBLISH is unset`,
      );
      failed = true;
    }
  }
}
if (failed) {
  console.error(
    '\n[changesets] To intentionally publish a 1.0, set ARC_ALLOW_V1_PUBLISH=true in CI per ADR-0001.',
  );
  process.exit(1);
}
console.log('[changesets] OK — no major bumps in changesets');
process.exit(0);
