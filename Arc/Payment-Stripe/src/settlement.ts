/**
 * @arc-platform/payment-stripe — resolveOrderSettlement (D-09)
 *
 * Server-authoritative order-status poll. NEVER trusts client-side redirect
 * params (redirect_status, payment_status, URL query strings). The only
 * source of truth is the WC Store API order read.
 *
 * Designed for injection: the `readStatus` reader and optional `sleep` are
 * injected so unit tests run instantly with a fake clock (no real timers).
 *
 * Called from the /order-confirmation Server Action (Plan 06) after the
 * Stripe return redirect — NOT from any client component.
 */
import type { WooClient } from '@arc-platform/core';
import { getOrder } from '@arc-platform/core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrderSettlement {
  orderId: number;
  /** Last-read WooCommerce order status string (e.g. 'processing', 'pending'). */
  status: string;
  /** True only when status is 'processing' or 'completed'. */
  settled: boolean;
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const SETTLED_STATUSES = new Set(['processing', 'completed']);

// ---------------------------------------------------------------------------
// resolveOrderSettlement — injectable core (pure, testable)
// ---------------------------------------------------------------------------

/**
 * Polls WC order status until it reaches a settled state or the timeout elapses.
 *
 * @param readStatus   - Injected order-status reader. Receives `orderId`, returns
 *                       the current WC order status string. Throw to surface errors.
 * @param args.orderId  - The WooCommerce order ID to poll.
 * @param args.timeoutMs - Maximum polling window in ms (default 30 000).
 * @param args.sleep    - Injected sleep function (default `setTimeout`-based).
 *                        Inject a no-op in tests to keep them instant.
 *
 * @returns OrderSettlement — never throws; returns settled:false on timeout.
 *
 * D-09 contract: the function signature accepts NO Request, searchParams, or
 * redirect_status — client redirect params are untrusted and must not reach here.
 */
export async function resolveOrderSettlement(
  readStatus: (orderId: number) => Promise<string>,
  args: {
    orderId: number;
    timeoutMs?: number;
    sleep?: (ms: number) => Promise<void>;
  },
): Promise<OrderSettlement> {
  const timeout = args.timeoutMs ?? 30_000;
  const sleep = args.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  const start = Date.now();
  let delay = 1_000;
  let status = '';

  do {
    status = await readStatus(args.orderId);

    if (SETTLED_STATUSES.has(status)) {
      return { orderId: args.orderId, status, settled: true };
    }

    // Break if the next sleep would push us past the timeout budget.
    if (Date.now() - start + delay > timeout) {
      break;
    }

    await sleep(delay);
    delay = Math.min(delay * 2, 8_000); // exponential back-off, capped at 8 s
  } while (Date.now() - start < timeout);

  return { orderId: args.orderId, status, settled: false };
}

// ---------------------------------------------------------------------------
// resolveOrderSettlementWithClient — convenience adapter for Plan 06
// ---------------------------------------------------------------------------

/**
 * Adapts `@arc-platform/core`'s `getOrder` into the `readStatus` reader
 * expected by `resolveOrderSettlement`.
 *
 * Plan 06's return-URL Server Action calls this instead of the bare
 * `resolveOrderSettlement` so it doesn't need to wire up `getOrder` itself.
 *
 * @param client    - Configured WooClient (carries Cart-Token session).
 * @param args      - Same args as `resolveOrderSettlement` minus `readStatus`.
 */
export async function resolveOrderSettlementWithClient(
  client: WooClient,
  args: {
    orderId: number;
    timeoutMs?: number;
    sleep?: (ms: number) => Promise<void>;
  },
): Promise<OrderSettlement> {
  const readStatus = async (orderId: number): Promise<string> => {
    const order = await getOrder(client, orderId);
    // getOrder returns null on 404 / session mismatch — treat as 'unknown'
    // so the poller keeps trying until timeout rather than hard-failing.
    return order?.status ?? 'unknown';
  };

  return resolveOrderSettlement(readStatus, args);
}
