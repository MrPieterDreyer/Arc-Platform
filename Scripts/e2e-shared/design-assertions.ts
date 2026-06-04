import type { Page } from '@playwright/test';

/** Arc primary shop accent — #0369a1 */
export const ARC_ACCENT_RGB = 'rgb(3, 105, 161)';
/** Arc body text — #1a2332 (not pure black) */
export const ARC_BODY_TEXT_RGB = 'rgb(26, 35, 50)';

function parseRgb(color: string): [number, number, number] | null {
  const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function rgbClose(actual: string, expected: string, tolerance = 3): boolean {
  const a = parseRgb(actual);
  const e = parseRgb(expected);
  if (!a || !e) return actual === expected;
  return a.every((channel, index) => Math.abs(channel - e[index]) <= tolerance);
}

function colorStringContainsAccent(value: string): boolean {
  const accent = parseRgb(ARC_ACCENT_RGB);
  if (!accent) return false;
  const channels = value.match(/\d+/g)?.map(Number) ?? [];
  for (let i = 0; i + 2 < channels.length; i += 1) {
    const slice = channels.slice(i, i + 3);
    if (slice.every((channel, index) => Math.abs(channel - accent[index]) <= 8)) {
      return true;
    }
  }
  return rgbClose(value, ARC_ACCENT_RGB, 8);
}

export interface CtaStyleSnapshot {
  backgroundColor: string;
  color: string;
}

/**
 * UX-RULES DESIGN-ACCENT-CTA + DESIGN-CTA-TEXT
 */
export async function assertPrimaryCtaAccent(
  page: Page,
  selector: string,
): Promise<CtaStyleSnapshot> {
  const styles = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`Missing element: ${sel}`);
    const computed = getComputedStyle(el);
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
    };
  }, selector);

  if (!rgbClose(styles.backgroundColor, ARC_ACCENT_RGB)) {
    throw new Error(
      `Primary CTA background expected ~${ARC_ACCENT_RGB}, got ${styles.backgroundColor}`,
    );
  }

  if (!rgbClose(styles.color, 'rgb(255, 255, 255)')) {
    throw new Error(`Primary CTA text expected white, got ${styles.color}`);
  }

  return styles;
}

/**
 * UX-RULES DESIGN-BODY-TEXT — body copy uses token, not #000.
 */
export async function assertBodyTextPrimary(
  page: Page,
  selector = 'main p',
): Promise<{ color: string }> {
  const styles = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`Missing element: ${sel}`);
    return { color: getComputedStyle(el).color };
  }, selector);

  if (rgbClose(styles.color, 'rgb(0, 0, 0)')) {
    throw new Error('Body text must not be pure black (#000)');
  }

  if (!rgbClose(styles.color, ARC_BODY_TEXT_RGB, 5)) {
    throw new Error(`Body text expected ~${ARC_BODY_TEXT_RGB}, got ${styles.color}`);
  }

  return styles;
}

export interface FocusStyleSnapshot {
  outlineColor: string;
  outlineWidth: string;
  boxShadow: string;
}

/**
 * UX-RULES DESIGN-FOCUS — visible focus ring uses accent hue.
 */
export async function assertFocusRingUsesAccent(
  page: Page,
  selector?: string,
): Promise<FocusStyleSnapshot> {
  if (selector) {
    await page.locator(selector).focus();
  } else {
    await page.keyboard.press('Tab');
  }

  const styles = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) {
      throw new Error('No focusable element received focus after Tab');
    }
    const computed = getComputedStyle(el);
    return {
      outlineColor: computed.outlineColor,
      outlineWidth: computed.outlineWidth,
      boxShadow: computed.boxShadow,
    };
  });

  const hasAccentOutline =
    styles.outlineWidth !== '0px' && colorStringContainsAccent(styles.outlineColor);
  const hasAccentShadow = colorStringContainsAccent(styles.boxShadow);

  if (!hasAccentOutline && !hasAccentShadow) {
    throw new Error(
      `Focus ring missing accent hue (outline: ${styles.outlineColor} ${styles.outlineWidth}, box-shadow: ${styles.boxShadow})`,
    );
  }

  return styles;
}

/**
 * FORBID-RAW-ERROR — no WooCommerce / GraphQL error strings on screen.
 */
export async function assertNoRawApiErrors(page: Page): Promise<void> {
  const bodyText = (await page.locator('body').innerText()).toLowerCase();
  const forbidden = /woocommerce_rest_|rest_cookie_invalid|graphql error/i;
  if (forbidden.test(bodyText)) {
    throw new Error('Forbidden raw API error text visible on page');
  }
}
