/**
 * @arc-platform/core — WooCommerce Store API v1 customer types
 *
 * NOTE: The Store API customer endpoint is SESSION-SCOPED only.
 * It does NOT return a full customer profile or order history.
 * For full customer data, use getCustomerOrders() from graphql/customer.ts.
 */

/** Billing/shipping address attached to the current WC session. */
export interface WCCustomerAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  email: string;
}

/**
 * Session-scoped customer data returned by GET /customer.
 * Contains only the billing/shipping address for the current session.
 * Does NOT contain order history, account details, or full profile.
 */
export interface WCCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  billing: WCCustomerAddress;
  shipping: WCCustomerAddress;
}
