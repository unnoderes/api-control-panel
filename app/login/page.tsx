'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthFormCard, AuthPageShell, type AuthField } from '@/components/auth-pages';
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
];

export default function LoginPage() {
  const router = useRouter();
  const [values, setValues] = useState({
    username: '',
    password: '',
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
      });
      router.replace('/dashboard');
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
      subtitle="Enter your credentials to access the dashboard."
      alternateHref="/signup"
      alternateLabel="Need an account?"
      alternateCta="Sign Up"
    >
      <AuthFormCard
        title="Account access"
        description="Username and password are required."
        fields={loginFields}
        values={values}
        pending={pending}
        error={error}
        submitLabel="Log In"
        onFieldChange={(name, value) => setValues((current) => ({ ...current, [name]: value }))}
        onSubmit={submit}
        footer={
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Authenticated target: <Link href="/dashboard" className="font-medium text-zinc-950 hover:underline dark:text-zinc-100">dashboard home</Link>
          </p>
        }
      />
    </AuthPageShell>
  );
}
