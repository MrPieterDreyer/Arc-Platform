import { isAuthenticated } from '@arc/next/server';
import Link from 'next/link';
import { Suspense } from 'react';

import { loginFormAction, logoutFormAction } from '../../actions/auth';

const fieldStyle = {
  display: 'block',
  width: '100%',
  maxWidth: '20rem',
  padding: 'var(--space-2)',
  marginBottom: 'var(--space-3)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
} as const;

// Auth state is uncached request data (cookies), so it must resolve INSIDE a
// <Suspense> boundary — the page shell stays static (same pattern as /account).
export default function AccountLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<p data-testid="account-login-loading">Loading sign-in…</p>}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginContent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const authenticated = await isAuthenticated();

  return (
    <article data-testid="account-login-page">
      <h1 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Sign in</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        <Link href="/account">← Account</Link>
      </p>

      {authenticated ? (
        <div data-testid="account-login-authenticated">
          <p>You are signed in.</p>
          <form action={logoutFormAction}>
            <button type="submit" data-testid="logout-submit">
              Sign out
            </button>
          </form>
        </div>
      ) : (
        <form action={loginFormAction} data-testid="account-login-form">
          {error ? (
            <p role="alert" data-testid="login-error" style={{ color: 'var(--color-danger)' }}>
              Sign-in failed. Check your username and password.
            </p>
          ) : null}
          <label htmlFor="login-username">Username or email</label>
          <input
            id="login-username"
            name="username"
            type="text"
            autoComplete="username"
            required
            data-testid="login-username"
            style={fieldStyle}
          />
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="login-password"
            style={fieldStyle}
          />
          <button type="submit" data-testid="login-submit">
            Sign in
          </button>
        </form>
      )}
    </article>
  );
}
