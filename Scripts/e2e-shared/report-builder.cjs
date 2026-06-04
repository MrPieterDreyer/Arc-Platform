const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');

function repoRootFromAppRoot(appRoot) {
  return path.resolve(appRoot, '..', '..', '..', '..');
}

function getE2eEnv() {
  const strip = (url) => (url.endsWith('/') ? url.slice(0, -1) : url);
  const wpUrl = strip(process.env.E2E_WP_URL ?? process.env.WP_URL ?? 'http://localhost:8888');
  const storefrontUrl = strip(process.env.E2E_STOREFRONT_URL ?? 'http://localhost:3000');
  const isCi = process.env.CI === 'true' || process.env.CI === '1';
  return {
    name: isCi ? 'ci-pr-smoke' : process.env.E2E_ENV === 'staging' ? 'staging' : 'local-wp-env',
    wpUrl,
    storefrontUrl,
  };
}

function relRepoPath(repoRoot, absolutePath) {
  if (!absolutePath) return undefined;
  return path.relative(repoRoot, absolutePath).replace(/\\/g, '/');
}

class AgentReportReporter {
  constructor() {
    this.startedAt = new Date().toISOString();
    this.tickets = [];
    this.ticketCounter = 0;
    this.repoRoot = process.cwd();
    this.reportPath = path.join(process.cwd(), 'Artifacts/e2e-reports/latest.json');
    this.total = 0;
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.flaky = 0;
  }

  onBegin(config) {
    const appRoot = config.configDir ?? config.rootDir ?? process.cwd();
    this.repoRoot = process.env.ARC_E2E_REPO_ROOT ?? repoRootFromAppRoot(appRoot);
    this.reportPath = path.join(this.repoRoot, 'Artifacts/e2e-reports/latest.json');
    this.startedAt = new Date().toISOString();
  }

  onTestEnd(test, result) {
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
    const title = test.title.toLowerCase();

    this.tickets.push({
      id,
      severity:
        title.includes('security') || title.includes('webhook')
          ? 'P0'
          : title.includes('health') || title.includes('boot')
            ? 'P1'
            : 'P2',
      category: test.location.file.includes('visual') ? 'visual-regression' : 'functional',
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

  onEnd(result) {
    const env = getE2eEnv();
    const finishedAt = new Date().toISOString();
    const durationMs = Date.parse(finishedAt) - Date.parse(this.startedAt);
    const status =
      result.status === 'passed'
        ? 'passed'
        : result.status === 'interrupted'
          ? 'partial'
          : 'failed';

    const report = {
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
        apps: [{ app: 'minimal-app', passed: this.passed, failed: this.failed }],
      },
      tickets: this.tickets,
      artifacts: {
        playwrightReport: 'Artifacts/e2e-reports/playwright-report',
      },
    };

    try {
      mkdirSync(path.dirname(this.reportPath), { recursive: true });
      writeFileSync(this.reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    } catch (error) {
      console.error('[agent-report] Failed to write latest.json:', error);
      throw error;
    }
  }
}

module.exports = AgentReportReporter;
module.exports.default = AgentReportReporter;
