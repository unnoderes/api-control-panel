'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthFormCard, AuthPageShell, type AuthField } from '@/components/auth-pages';
import { bffClient } from '@/lib/api/bff-client';

const signupFields: AuthField[] = [
  {
    name: 'username',
    label: 'Username',
    type: 'text',
    placeholder: 'Choose a username',
    autoComplete: 'username',
    hint: 'Primary account identifier for the newapi-compatible flow.',
    required: true,
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Create a password',
    autoComplete: 'new-password',
    hint: 'Minimum password rules should come from the deployment config.',
    required: true,
  },
  {
    name: 'confirmPassword',
    label: 'Confirm password',
    type: 'password',
    placeholder: 'Repeat your password',
    autoComplete: 'new-password',
    hint: 'UI-only validation; not forwarded upstream.',
    required: true,
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'Optional, depending on instance policy',
    autoComplete: 'email',
    hint: 'Reserve this field for instances that require email binding or verification.',
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [values, setValues] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
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

    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setPending(true);
    setError(null);

    try {
      const result = await bffClient.auth.register({
        username,
        password,
        ...(values.email.trim() ? { email: values.email.trim() } : {}),
      });

      if ('isAuthenticated' in result && result.isAuthenticated) {
        router.replace('/dashboard');
        return;
      }

      router.replace('/login');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Signup failed.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPageShell
      mode="signup"
      title="Create your New API account"
      subtitle="Create your account to get started."
      alternateHref="/login"
      alternateLabel="Already have an account?"
      alternateCta="Log In"
    >
      <AuthFormCard
        title="Create account"
        description="Username, password, and email are required."
        fields={signupFields}
        values={values}
        pending={pending}
        error={error}
        submitLabel="Create Account"
        onFieldChange={(name, value) => setValues((current) => ({ ...current, [name]: value }))}
        onSubmit={submit}
      />
    </AuthPageShell>
  );
}
