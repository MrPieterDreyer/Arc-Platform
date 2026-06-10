#!/usr/bin/env node
// TOOL-09 contract: 8 ADR files exist in Documentation/Architecture/ with required MADR sections.
// Source: .planning/phases/00-tooling-foundations/00-RESEARCH.md (Validation Architecture)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ADR_DIR = 'Documentation/Architecture';

if (!existsSync(ADR_DIR)) {
  console.error(`[verify-adrs] MISSING directory ${ADR_DIR}`);
  process.exit(1);
}

// MADR section/status checks apply to Markdown ADRs only — supporting
// artifacts (e.g. ADR-0009-SPIKE-*.html) share the ADR- prefix but are
// not decision records.
const files = readdirSync(ADR_DIR).filter((f) => /^ADR-\d{4}-/.test(f) && f.endsWith('.md'));
const numbers = new Set(files.map((f) => f.slice(0, 8))); // "ADR-0001"

let failed = 0;
for (let i = 1; i <= 8; i += 1) {
  const id = `ADR-${String(i).padStart(4, '0')}`;
  if (!numbers.has(id)) {
    console.error(`[verify-adrs] MISSING ${id}`);
    failed += 1;
  }
}

const REQUIRED_SECTIONS = ['## Context', '## Decision', '## Consequences'];
for (const f of files) {
  const body = readFileSync(join(ADR_DIR, f), 'utf8');
  for (const sec of REQUIRED_SECTIONS) {
    if (!body.includes(sec)) {
      console.error(`[verify-adrs] ${f}: missing section ${sec}`);
      failed += 1;
    }
  }
  if (!/\*\*Status:\*\*\s+(Accepted|Proposed|Deprecated|Superseded)/.test(body)) {
    console.error(`[verify-adrs] ${f}: missing or invalid **Status:** field`);
    failed += 1;
  }
}

// Also verify the index README references each ADR
const readme = readFileSync(join(ADR_DIR, 'README.md'), 'utf8');
for (let i = 1; i <= 8; i += 1) {
  const id = `ADR-${String(i).padStart(4, '0')}`;
  if (!readme.includes(id)) {
    console.error(`[verify-adrs] README.md does not reference ${id}`);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n[verify-adrs] ${failed} issue(s).`);
  process.exit(1);
}
console.log('[verify-adrs] OK — 8 ADRs exist with required sections; index references all 8');
