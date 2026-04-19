'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthContractPanel, AuthFormCard, AuthPageShell, type AuthContract, type AuthField } from '@/components/auth-pages';
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
  {
    name: 'emailCode',
    label: 'Email verification code',
    type: 'text',
    placeholder: 'Optional if email verification is enabled',
    hint: 'Do not enforce until the deployment confirms email verification is on.',
  },
  {
    name: 'inviteCode',
    label: 'Invite code',
    type: 'text',
    placeholder: 'Optional if invite-only registration is enabled',
    hint: 'Reserve for deployments with invitation or referral policies.',
  },
];

const signupContract: AuthContract = {
  title: 'Signup page contract',
  summary: 'Uses local BFF registration, while preserving optional email verification and invite-code fields for instance-level switches.',
  dataNeeds: [
    'Instance signup policy: open signup, invite-only, email verification, 2FA requirements.',
    'Optional password rule hints and legal copy from the future BFF.',
  ],
  actions: [
    'Submit registration payload to `/api/bff/auth/register`.',
    'Optionally request or verify an email code if enabled by the instance.',
    'Redirect to login or dashboard after successful registration based on session result.',
  ],
  states: {
    loading: 'Disable submit and show spinner while the registration request is in flight.',
    empty: 'No empty state; keep the form visible even without optional policy metadata.',
    error: 'Show inline validation or instance-policy errors without clearing the form.',
  },
  mockSource: undefined,
};

export default function SignupPage() {
  const router = useRouter();
  const [values, setValues] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    emailCode: '',
    inviteCode: '',
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
        ...(values.emailCode.trim() ? { email_code: values.emailCode.trim() } : {}),
        ...(values.inviteCode.trim() ? { invite_code: values.inviteCode.trim() } : {}),
      });

      if ('isAuthenticated' in result && result.isAuthenticated) {
        router.replace('/');
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
      subtitle="The page now calls the local BFF and can either auto-login on success or fall back to the login page, depending on the upstream instance policy."
      alternateHref="/login"
      alternateLabel="Already have an account?"
      alternateCta="Log In"
    >
      <div className="space-y-6">
        <AuthFormCard
          title="Create account"
          description="Registration now goes through the local BFF. Optional email-code and invite-code fields remain deployment-dependent."
          fields={signupFields}
          values={values}
          pending={pending}
          error={error}
          submitLabel="Create Account"
          onFieldChange={(name, value) => setValues((current) => ({ ...current, [name]: value }))}
          onSubmit={submit}
        />
        <AuthContractPanel contract={signupContract} />
      </div>
    </AuthPageShell>
  );
}
