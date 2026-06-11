import 'server-only';

/**
 * @arc-platform/payment-stripe/server — server-only barrel
 *
 * Import via `@arc-platform/payment-stripe/server` from Server Components
 * and Server Actions only. Never import from client components.
 */

// Settlement poller (Task 3 fills this in)
export type { OrderSettlement } from './settlement';
export { resolveOrderSettlement, resolveOrderSettlementWithClient } from './settlement';
