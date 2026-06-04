import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

export interface AxeScanOptions {
  /** axe tags to include (default: wcag2a, wcag2aa, best-practice) */
  tags?: string[];
  /** Optional selector scope */
  include?: string[];
}

/**
 * UX-RULES A11Y-NO-CRITICAL — zero critical axe violations on the page.
 */
export async function assertNoCriticalAxeViolations(
  page: Page,
  options: AxeScanOptions = {},
): Promise<void> {
  const tags = options.tags ?? ['wcag2a', 'wcag2aa', 'best-practice'];
  let builder = new AxeBuilder({ page }).withTags(tags);
  if (options.include?.length) {
    for (const selector of options.include) {
      builder = builder.include(selector);
    }
  }
  const results = await builder.analyze();
  const critical = results.violations.filter((v) => v.impact === 'critical');
  if (critical.length > 0) {
    const summary = critical.map((v) => `${v.id} (${v.nodes.length} nodes): ${v.help}`).join('\n');
    throw new Error(`Critical axe violations:\n${summary}`);
  }
}

/**
 * UX-RULES A11Y-FOCUS-ORDER — each selector receives focus in tab order before `stopBefore`.
 */
export async function assertTabReachesSelectors(
  page: Page,
  selectors: string[],
  options?: { maxTabs?: number },
): Promise<void> {
  const maxTabs = options?.maxTabs ?? 40;

  for (const sel of selectors) {
    let found = false;
    for (let i = 0; i < maxTabs; i += 1) {
      const focused = await page.evaluate((s) => document.activeElement?.matches(s) ?? false, sel);
      if (focused) {
        found = true;
        break;
      }
      await page.keyboard.press('Tab');
    }
    if (!found) {
      throw new Error(`Tab order did not reach: ${sel}`);
    }
  }
}
