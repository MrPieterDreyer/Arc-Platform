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
import { type WooClient, WooClientError } from '../client/WooClient.js';
import type { WCOrder } from '../types/orders.js';

/**
 * Retrieve a single order by ID for the current Cart-Token session.
 *
 * Returns `null` when the order is not found or does not belong to the current
 * session (the Store API returns 404, `woocommerce_rest_invalid_order`, or a 403
 * `woocommerce_rest_invalid_user` for a different customer). All other errors are re-thrown.
 *
 * Use this on the order confirmation page after checkout.
 */
export async function getOrder(client: WooClient, orderId: number): Promise<WCOrder | null> {
  try {
    return await client.request<WCOrder>(`/order/${orderId}`);
  } catch (err) {
    // The Store API rejects a non-retrievable order three ways, all of which
    // mean "not available to this session":
    //   - 404                              → order does not exist
    //   - woocommerce_rest_invalid_order   → wrong/missing order key for the session
    //   - woocommerce_rest_invalid_user    → order belongs to a different customer (403)
    if (
      err instanceof WooClientError &&
      (err.status === 404 ||
        err.code === 'woocommerce_rest_invalid_order' ||
        err.code === 'woocommerce_rest_invalid_user')
    ) {
      return null;
    }
    throw err;
  }
}
