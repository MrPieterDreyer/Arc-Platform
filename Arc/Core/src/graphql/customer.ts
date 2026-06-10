// TODO(codegen): Replace inline gql document with typed __generated__ import
// after running: pnpm --filter @arc-platform/core codegen
// Expected import:
//   import { GetCustomerOrdersDocument } from './__generated__/graphql.js'
import { type GraphQLClient, gql } from 'graphql-request';

/** A single line item within a WPGraphQL order. */
export interface WCGQLOrderLineItem {
  productId: number;
  quantity: number;
  total: string;
  product: { node: { name: string; slug: string } } | null;
}

/** An order node returned by the GetCustomerOrders query. */
export interface WCGQLOrder {
  databaseId: number;
  orderNumber: string;
  status: string;
  total: string;
  date: string;
  lineItems: { nodes: WCGQLOrderLineItem[] };
}

/**
 * The full result shape returned by `getCustomerOrders`.
 * Contains customer identity fields and paginated order history.
 */
export interface WCCustomerOrdersResult {
  databaseId: number;
  email: string;
  firstName: string;
  lastName: string;
  billing: Record<string, string>;
  shipping: Record<string, string>;
  orders: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: WCGQLOrder[];
  };
}

const GetCustomerOrdersDocument = gql`
  query GetCustomerOrders($first: Int = 10, $after: String) {
    customer {
      databaseId
      email
      firstName
      lastName
      billing { firstName lastName address1 address2 city state postcode country phone email }
      shipping { firstName lastName address1 address2 city state postcode country }
      orders(first: $first, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          databaseId
          orderNumber
          status
          total
          date
          lineItems {
            nodes {
              productId
              quantity
              total
              product { node { name slug } }
            }
          }
        }
      }
    }
  }
`;

/**
 * Fetches the authenticated customer's order history via WPGraphQL.
 *
 * Requires a GraphQLClient configured with `authToken` returning a valid JWT.
 * Without auth, WPGraphQL returns null for `customer` — this function will
 * throw in that case.
 *
 * Use `createWPGraphQLClient({ authToken: () => yourToken })` from
 * `@arc-platform/next`'s cookie bridge to provide the token server-side.
 *
 * @param client - Authenticated GraphQLClient (must have auth token set)
 * @param vars   - Pagination variables (first: number of orders, after: cursor)
 */
export async function getCustomerOrders(
  client: GraphQLClient,
  vars?: { first?: number; after?: string },
): Promise<WCCustomerOrdersResult> {
  const data = await client.request<{ customer: WCCustomerOrdersResult }>(
    GetCustomerOrdersDocument,
    vars ?? {},
  );
  if (!data.customer) {
    throw new Error(
      'WPGraphQL returned null for customer. Ensure the GraphQLClient is configured with a valid authToken. ' +
        'Use createWPGraphQLClient({ authToken: () => yourToken }) from @arc-platform/next.',
    );
  }
  return data.customer;
}
