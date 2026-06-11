import { describe, expect, it } from 'vitest';

import { validateArcEnv } from './env';

const VALID_ENV = {
  ARC_GRAPHQL_ENDPOINT: 'http://localhost:8888/graphql',
  ARC_WC_URL: 'http://localhost:8888',
};

describe('validateArcEnv', () => {
  it('does not throw when all required vars are present and valid', () => {
    expect(() => validateArcEnv(VALID_ENV)).not.toThrow();
  });

  it('throws when ARC_GRAPHQL_ENDPOINT is missing', () => {
    const env = { ARC_WC_URL: VALID_ENV.ARC_WC_URL };
    expect(() => validateArcEnv(env)).toThrow(/ARC_GRAPHQL_ENDPOINT is missing/);
  });

  it('throws when ARC_WC_URL is missing', () => {
    const env = { ARC_GRAPHQL_ENDPOINT: VALID_ENV.ARC_GRAPHQL_ENDPOINT };
    expect(() => validateArcEnv(env)).toThrow(/ARC_WC_URL is missing/);
  });

  it('throws when both required vars are missing', () => {
    expect(() => validateArcEnv({})).toThrow(/Arc startup check failed/);
  });

  it('lists ALL missing vars in a single error (never partial)', () => {
    let msg = '';
    try {
      validateArcEnv({});
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toMatch(/ARC_GRAPHQL_ENDPOINT/);
    expect(msg).toMatch(/ARC_WC_URL/);
  });

  it('throws when ARC_GRAPHQL_ENDPOINT is a malformed URL', () => {
    const env = {
      ...VALID_ENV,
      ARC_GRAPHQL_ENDPOINT: 'not-a-url',
    };
    expect(() => validateArcEnv(env)).toThrow(/ARC_GRAPHQL_ENDPOINT is not a valid/);
  });

  it('throws when ARC_WC_URL is a malformed URL', () => {
    const env = {
      ...VALID_ENV,
      ARC_WC_URL: 'ftp://not-http',
    };
    expect(() => validateArcEnv(env)).toThrow(/ARC_WC_URL is not a valid/);
  });

  it('throws when a var is present but empty string', () => {
    const env = { ...VALID_ENV, ARC_GRAPHQL_ENDPOINT: '' };
    expect(() => validateArcEnv(env)).toThrow(/ARC_GRAPHQL_ENDPOINT is missing/);
  });

  it('throws when a var is present but whitespace only', () => {
    const env = { ...VALID_ENV, ARC_WC_URL: '   ' };
    expect(() => validateArcEnv(env)).toThrow(/ARC_WC_URL is missing/);
  });

  it('accepts https URLs', () => {
    const env = {
      ARC_GRAPHQL_ENDPOINT: 'https://example.com/graphql',
      ARC_WC_URL: 'https://example.com',
    };
    expect(() => validateArcEnv(env)).not.toThrow();
  });

  it('does not require optional vars (ARC_CART_COOKIE_SECURE, STRIPE etc.)', () => {
    // Omitting all optional vars should still pass with required present
    expect(() => validateArcEnv(VALID_ENV)).not.toThrow();
  });
});
