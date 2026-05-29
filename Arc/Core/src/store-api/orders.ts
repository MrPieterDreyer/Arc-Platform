/**
 * WC Store API — Orders
 *
 * The Store API only supports retrieving a single order by ID for the current session.
 * Attempting to retrieve an order from a different session returns null (404).
 *
 * For customer order HISTORY (listCustomerOrders), use the WPGraphQL customer module:
 * @see src/graphql/customer.ts — getCustomerOrders()
 *
 * This is a Store API architectural limitation, not a bug.
 * Reference: https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/order/
 */
import { WooClient, WooClientError } from '../client/WooClient.js';
import type { WCOrder } from '../types/orders.js';

/**
 * Retrieve a single order by ID for the current Cart-Token session.
 *
 * Returns `null` when the order is not found or does not belong to the current
 * session (the Store API returns 404 in both cases). All other errors are re-thrown.
 *
 * Use this on the order confirmation page after checkout.
 */
export async function getOrder(
  client: WooClient,
  orderId: number,
): Promise<WCOrder | null> {
  try {
    return await client.request<WCOrder>(`/order/${orderId}`);
  } catch (err) {
    if (err instanceof WooClientError && err.status === 404) {
      return null;
    }
    throw err;
  }
}
