import type { Page } from '@playwright/test';

/** Documented in TESTING.md — pragmatic nightly gates (Chromium, local wp-env). */
export interface PerfBudgets {
  /** DOMContentLoaded end (ms) — proxy for perceived load */
  domContentLoadedMs: number;
  /** loadEventEnd (ms) */
  loadEventEndMs: number;
}

export const DEFAULT_PERF_BUDGETS: PerfBudgets = {
  domContentLoadedMs: 8_000,
  loadEventEndMs: 12_000,
};

export interface NavigationTimingSnapshot {
  domContentLoadedMs: number;
  loadEventEndMs: number;
}

/**
 * Lightweight perf assertion (Wave 11) — no Lighthouse in CI by default.
 */
export async function readNavigationTiming(page: Page): Promise<NavigationTimingSnapshot> {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (!nav) {
      return { domContentLoadedMs: 0, loadEventEndMs: 0 };
    }
    return {
      domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd),
      loadEventEndMs: Math.round(nav.loadEventEnd),
    };
  });
}

export async function assertNavigationWithinBudget(
  page: Page,
  budgets: PerfBudgets = DEFAULT_PERF_BUDGETS,
): Promise<NavigationTimingSnapshot> {
  const timing = await readNavigationTiming(page);
  if (timing.domContentLoadedMs > budgets.domContentLoadedMs) {
    throw new Error(
      `domContentLoaded ${timing.domContentLoadedMs}ms exceeds budget ${budgets.domContentLoadedMs}ms`,
    );
  }
  if (timing.loadEventEndMs > budgets.loadEventEndMs) {
    throw new Error(
      `loadEventEnd ${timing.loadEventEndMs}ms exceeds budget ${budgets.loadEventEndMs}ms`,
    );
  }
  return timing;
}
