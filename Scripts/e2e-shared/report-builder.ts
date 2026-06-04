import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

import { getE2eEnv, repoRootFromPlaywrightConfig } from './e2e-env';

type TicketSeverity = 'P0' | 'P1' | 'P2' | 'P3';

interface AgentTicket {
  id: string;
  severity: TicketSeverity;
  category: string;
  title: string;
  description: string;
  requirementIds: string[];
  reproduction: {
    testFile: string;
    testTitle: string;
    grep?: string;
    steps: string[];
    route?: string;
    browser?: string;
  };
  evidence: {
    screenshot?: string;
    trace?: string;
    video?: string;
    consoleErrors?: string[];
    expected?: string;
    actual?: string;
  };
  suggestedFix: {
    summary: string;
    likelyFiles: string[];
    implementationHints: string[];
  };
  ownerPackage: string;
  quarantine: boolean;
}

interface AgentReport {
  reportVersion: '1.0.0';
  runId: string;
  startedAt: string;
  finishedAt: string;
  status: 'passed' | 'failed' | 'partial';
  environment: {
    name: string;
    wpUrl?: string;
    storefrontUrl?: string;
    gitSha?: string;
    branch?: string;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    flaky: number;
    durationMs: number;
    apps: Array<{ app: string; passed: number; failed: number }>;
  };
  tickets: AgentTicket[];
  artifacts?: {
    htmlReport?: string;
    playwrightReport?: string;
    traceDir?: string;
  };
}

function relRepoPath(repoRoot: string, absolutePath: string | undefined): string | undefined {
  if (!absolutePath) return undefined;
  return path.relative(repoRoot, absolutePath).replace(/\\/g, '/');
}

function inferSeverity(test: TestCase): TicketSeverity {
  const title = test.title.toLowerCase();
  if (title.includes('security') || title.includes('webhook')) return 'P0';
  if (title.includes('health') || title.includes('boot')) return 'P1';
  return 'P2';
}

function inferCategory(test: TestCase): string {
  const file = test.location.file;
  if (file.includes('/visual/')) return 'visual-regression';
  if (file.includes('a11y')) return 'accessibility';
  return 'functional';
}

export default class AgentReportReporter implements Reporter {
  private startedAt = new Date().toISOString();
  private tickets: AgentTicket[] = [];
  private ticketCounter = 0;
  private repoRoot = process.cwd();
  private reportPath = path.join(process.cwd(), 'Artifacts/e2e-reports/latest.json');
  private total = 0;
  private passed = 0;
  private failed = 0;
  private skipped = 0;
  private flaky = 0;

  onBegin(config: FullConfig, _suite: Suite): void {
    const appRoot = config.configDir ?? config.rootDir ?? process.cwd();
    this.repoRoot = repoRootFromPlaywrightConfig(appRoot);
    this.reportPath = path.join(this.repoRoot, 'Artifacts/e2e-reports/latest.json');
    this.startedAt = new Date().toISOString();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.total += 1;
    if (result.status === 'passed') this.passed += 1;
    else if (result.status === 'skipped') this.skipped += 1;
    else if (result.status === 'flaky') this.flaky += 1;
    else this.failed += 1;

    if (result.status === 'passed' || result.status === 'skipped') return;

    this.ticketCounter += 1;
    const id = `E2E-${String(this.ticketCounter).padStart(4, '0')}`;
    const attachment = result.attachments.find((a) => a.name === 'screenshot');
    const trace = result.attachments.find((a) => a.name === 'trace');
    const video = result.attachments.find((a) => a.name === 'video');

    const errors = result.errors.map((e) => e.message ?? String(e)).filter(Boolean);

    this.tickets.push({
      id,
      severity: inferSeverity(test),
      category: inferCategory(test),
      title: test.title.slice(0, 120),
      description: errors.join('\n') || `Test failed with status ${result.status}`,
      requirementIds: [],
      reproduction: {
        testFile: path.relative(this.repoRoot, test.location.file).replace(/\\/g, '/'),
        testTitle: test.title,
        grep: test.title.includes('@') ? test.title.match(/@\w+/)?.[0] : undefined,
        steps: ['pnpm wp:setup', 'pnpm test:e2e:smoke'],
        browser: test.parent?.project()?.name,
      },
      evidence: {
        screenshot: relRepoPath(this.repoRoot, attachment?.path),
        trace: relRepoPath(this.repoRoot, trace?.path),
        video: relRepoPath(this.repoRoot, video?.path),
        consoleErrors: errors.length > 0 ? errors : undefined,
        expected: result.error?.message,
      },
      suggestedFix: {
        summary: 'Fix the failing assertion or underlying service (wp-env / Next / API).',
        likelyFiles: [path.relative(this.repoRoot, test.location.file).replace(/\\/g, '/')],
        implementationHints: ['Re-run: pnpm test:e2e:smoke', 'Check wp-env: pnpm wp:setup'],
      },
      ownerPackage: 'minimal-app',
      quarantine: test.title.includes('@quarantine'),
    });
  }

  onEnd(result: FullResult): void {
    const env = getE2eEnv();
    const finishedAt = new Date().toISOString();
    const durationMs = Date.parse(finishedAt) - Date.parse(this.startedAt);

    const status: AgentReport['status'] =
      result.status === 'passed'
        ? 'passed'
        : result.status === 'interrupted'
          ? 'partial'
          : 'failed';

    const report: AgentReport = {
      reportVersion: '1.0.0',
      runId: process.env.GITHUB_RUN_ID ?? `local-${Date.now()}`,
      startedAt: this.startedAt,
      finishedAt,
      status,
      environment: {
        name: env.name,
        wpUrl: env.wpUrl,
        storefrontUrl: env.storefrontUrl,
        gitSha: process.env.GITHUB_SHA,
        branch: process.env.GITHUB_HEAD_REF ?? process.env.GITHUB_REF_NAME,
      },
      summary: {
        total: this.total,
        passed: this.passed,
        failed: this.failed,
        skipped: this.skipped,
        flaky: this.flaky,
        durationMs: Number.isFinite(durationMs) ? durationMs : 0,
        apps: [
          {
            app: 'minimal-app',
            passed: this.passed,
            failed: this.failed,
          },
        ],
      },
      tickets: this.tickets,
      artifacts: {
        playwrightReport: 'Artifacts/e2e-reports/playwright-report',
      },
    };

    mkdirSync(path.dirname(this.reportPath), { recursive: true });
    writeFileSync(this.reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
}
