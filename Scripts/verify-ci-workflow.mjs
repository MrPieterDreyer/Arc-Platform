#!/usr/bin/env node
// TOOL-06 contract: ci.yml and release.yml MUST contain the required jobs and tokens.
// Source: .planning/phases/00-tooling-foundations/00-RESEARCH.md (Validation Architecture — TOOL-06 row)
// Source: .planning/phases/00-tooling-foundations/00-VALIDATION.md (Task 0-06-01)
import { existsSync, readFileSync } from 'node:fs';

const CI_PATH = '.github/workflows/ci.yml';
const RELEASE_PATH = '.github/workflows/release.yml';

const REQUIRED_JOBS = [
  'install:',
  'lint:',
  'no-next-in-core:',
  'test:',
  'license-check:',
  'changesets-no-major:',
];

const REQUIRED_CI_TOKENS = [
  'pnpm install --frozen-lockfile',
  'pnpm lint',
  'pnpm test',
  'pnpm license-check',
  'bash Scripts/check-no-next-in-core.sh',
  'node Scripts/verify-changesets-no-major.mjs',
  'matrix:',
  'node: [20, 22]',
];

const REQUIRED_RELEASE_TOKENS = [
  'changesets/action@v1',
  'id-token: write',
  'NPM_TOKEN',
  'pnpm build',
];

let failed = 0;

function check(path, tokens, label) {
  if (!existsSync(path)) {
    console.error(`[verify-ci-workflow] MISSING file: ${path}`);
    failed += 1;
    return;
  }
  const body = readFileSync(path, 'utf8');
  for (const t of tokens) {
    if (!body.includes(t)) {
      console.error(`[verify-ci-workflow] ${label}: MISSING token ${JSON.stringify(t)}`);
      failed += 1;
    }
  }
}

check(CI_PATH, REQUIRED_JOBS, 'ci.yml jobs');
check(CI_PATH, REQUIRED_CI_TOKENS, 'ci.yml content');
check(RELEASE_PATH, REQUIRED_RELEASE_TOKENS, 'release.yml content');

if (failed > 0) {
  console.error(`\n[verify-ci-workflow] ${failed} issue(s). See above.`);
  process.exit(1);
}
console.log('[verify-ci-workflow] OK — ci.yml and release.yml satisfy TOOL-06 contract');
