'use server';

// ADR-0009 customer-auth Server Actions — thin wrappers over @arc/next/server
// (a 'use server' file may only export async functions, not re-exports).
// Tokens never reach the client: they live in the two HttpOnly cookies.
import { loginAction as login, logoutAction as logout } from '@arc/next/server';
import { redirect } from 'next/navigation';

export async function loginFormAction(formData: FormData): Promise<void> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  let authenticated = false;
  if (username && password) {
    try {
      await login({ username, password });
      authenticated = true;
    } catch {
      authenticated = false;
    }
  }

  // redirect() throws NEXT_REDIRECT — must stay OUTSIDE try/catch.
  redirect(authenticated ? '/account' : '/account/login?error=invalid');
}

export async function logoutFormAction(): Promise<void> {
  await logout();
  redirect('/account/login');
}
