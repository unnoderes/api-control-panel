'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthContractPanel, AuthFormCard, AuthPageShell, type AuthContract, type AuthField } from '@/components/auth-pages';
import { bffClient } from '@/lib/api/bff-client';

const loginFields: AuthField[] = [
  {
    name: 'username',
    label: 'Username',
    type: 'text',
    placeholder: 'Enter your username',
    autoComplete: 'username',
    hint: 'Maps to `/api/bff/auth/login` and then upstream `/api/user/login`.',
    required: true,
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    autoComplete: 'current-password',
    hint: 'Submitted only to the local BFF; browser does not store upstream token.',
    required: true,
  },
  {
    name: 'twoFactorCode',
    label: '2FA Code',
    type: 'text',
    placeholder: 'Optional if enabled by the instance',
    autoComplete: 'one-time-code',
    hint: 'Reserved for instances that enforce a second factor.',
  },
];

const loginContract: AuthContract = {
  title: 'Login page contract',
  summary: 'Uses local BFF login and HttpOnly session cookie, with an optional 2FA field retained for instance differences.',
  dataNeeds: [
    'Instance auth capabilities: whether login is enabled and whether 2FA is required.',
    'Optional notice text for maintenance or auth restrictions.',
  ],
  actions: [
    'Submit username/password login to `/api/bff/auth/login`.',
    'Handle invalid credentials and optional 2FA challenge.',
    'Redirect to the protected dashboard after session creation.',
  ],
  states: {
    loading: 'Disable the submit button and show a pending spinner during login submission.',
    empty: 'No empty list state needed; render a neutral form when there is no prefilled data.',
    error: 'Show inline auth error text for invalid credentials, disabled signup, or missing 2FA code.',
  },
  mockSource: undefined,
};

export default function LoginPage() {
  const router = useRouter();
  const [values, setValues] = useState({
    username: '',
    password: '',
    twoFactorCode: '',
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const username = values.username.trim();
    const password = values.password.trim();

    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }

    setPending(true);
    setError(null);

    try {
      await bffClient.auth.login({
        username,
        password,
        ...(values.twoFactorCode.trim() ? { two_factor_code: values.twoFactorCode.trim() } : {}),
      });
      router.replace('/');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Login failed.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPageShell
      mode="login"
      title="Log in to New API"
      subtitle="This page now submits to the local BFF, which writes the HttpOnly session cookie and then redirects back to the dashboard."
      alternateHref="/signup"
      alternateLabel="Need an account?"
      alternateCta="Sign Up"
    >
      <div className="space-y-6">
        <AuthFormCard
          title="Account access"
          description="Use username and password. Keep 2FA optional until the deployment config confirms it is required."
          fields={loginFields}
          values={values}
          pending={pending}
          error={error}
          submitLabel="Log In"
          onFieldChange={(name, value) => setValues((current) => ({ ...current, [name]: value }))}
          onSubmit={submit}
          footer={
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Authenticated target: <Link href="/" className="font-medium text-zinc-950 hover:underline dark:text-zinc-100">dashboard home</Link>
            </p>
          }
        />
        <AuthContractPanel contract={loginContract} />
      </div>
    </AuthPageShell>
  );
}
