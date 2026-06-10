// ADR-0009 — customer authentication via wp-graphql-jwt-authentication.
// JWT is the credential FORMAT; storage/transport is @arc/next's HttpOnly cookie
// bridge (auth-cookies.ts). This module stays framework-agnostic: no next/*.
//
// TODO(codegen): Replace inline gql documents with typed __generated__ imports
// after running: pnpm --filter @arc/core codegen (requires the JWT plugin schema).
import { type GraphQLClient, gql } from 'graphql-request';

/** Identity fields returned alongside the tokens at login. */
export interface WCAuthCustomer {
  databaseId: number;
  email: string;
  firstName: string;
  lastName: string;
}

/** Result of a successful `login` mutation. */
export interface WCLoginResult {
  /** Short-lived access JWT — sent as `Authorization: Bearer`. */
  authToken: string;
  /** Long-lived refresh JWT — exchanged via {@link refreshAuthToken}. */
  refreshToken: string;
  customer: WCAuthCustomer;
}

const LoginDocument = gql`
  mutation ArcLoginCustomer($username: String!, $password: String!) {
    login(input: { username: $username, password: $password }) {
      authToken
      refreshToken
      user {
        databaseId
        email
        firstName
        lastName
      }
    }
  }
`;

const RefreshAuthTokenDocument = gql`
  mutation ArcRefreshAuthToken($refreshToken: String!) {
    refreshJwtAuthToken(input: { jwtRefreshToken: $refreshToken }) {
      authToken
    }
  }
`;

interface RawLoginResponse {
  login: {
    authToken: string | null;
    refreshToken: string | null;
    user: WCAuthCustomer | null;
  } | null;
}

interface RawRefreshResponse {
  refreshJwtAuthToken: { authToken: string | null } | null;
}

/**
 * Minimum credible JWT length. A JWT is three base64url segments — even a minimal
 * HS256 token exceeds 100 chars. The floor guards against empty strings, truncated
 * env values, and `"null"`/`"undefined"` string coercions (audit H-2: reject
 * empty/short tokens), without parsing the token server-side.
 */
const MIN_TOKEN_LENGTH = 16;

function assertValidToken(
  token: string | null | undefined,
  label: string,
): asserts token is string {
  if (typeof token !== 'string' || token.trim().length < MIN_TOKEN_LENGTH) {
    throw new Error(`WPGraphQL JWT auth returned an empty or malformed ${label} (ADR-0009)`);
  }
}

/**
 * Authenticates a customer via the wp-graphql-jwt-authentication `login` mutation.
 * Throws on bad credentials (GraphQL error propagates from graphql-request) and on
 * empty/short tokens. Never log the returned tokens.
 */
export async function loginCustomer(
  client: GraphQLClient,
  credentials: { username: string; password: string },
): Promise<WCLoginResult> {
  const data = await client.request<RawLoginResponse>(LoginDocument, credentials);

  const authToken = data.login?.authToken;
  const refreshToken = data.login?.refreshToken;
  assertValidToken(authToken, 'authToken');
  assertValidToken(refreshToken, 'refreshToken');

  const user = data.login?.user;
  if (!user) {
    throw new Error('WPGraphQL login returned tokens without a user payload (ADR-0009)');
  }

  return { authToken, refreshToken, customer: user };
}

/**
 * Exchanges a refresh JWT for a new access token (`refreshJwtAuthToken` mutation).
 * Mirrors the nonce retry-and-rotate loop in `WooClient.request()`: callers rotate
 * the access cookie with the returned token and retry the original query once.
 */
export async function refreshAuthToken(
  client: GraphQLClient,
  refreshToken: string,
): Promise<string> {
  assertValidToken(refreshToken, 'refreshToken');

  const data = await client.request<RawRefreshResponse>(RefreshAuthTokenDocument, {
    refreshToken,
  });

  const authToken = data.refreshJwtAuthToken?.authToken;
  assertValidToken(authToken, 'authToken');
  return authToken;
}
