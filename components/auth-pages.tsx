'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button, SectionCard, StatusBadge } from '@/components/UIComponents';

export type AuthFormMode = 'login' | 'signup';

export type AuthField = {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  autoComplete?: string;
  hint?: string;
  required?: boolean;
};

export type AuthContract = {
  title: string;
  summary: string;
  dataNeeds: string[];
  actions: string[];
  states: {
    loading: string;
    empty: string;
    error: string;
  };
  mockSource?: string;
};

type AuthPageShellProps = {
  mode: AuthFormMode;
  title: string;
  subtitle: string;
  alternateHref: string;
  alternateLabel: string;
  alternateCta: string;
  children: ReactNode;
};

export function AuthPageShell({ mode, title, subtitle, alternateHref, alternateLabel, alternateCta, children }: AuthPageShellProps) {
  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-[#0a0a0a]">
      <header className="flex h-16 items-center justify-between border-b border-zinc-100 px-6 dark:border-zinc-800">
        <div className="text-zinc-950 dark:text-white">
          <svg className="size-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2l10 18H2L12 2z" />
          </svg>
        </div>
        <Link
          href={alternateHref}
          className="text-sm font-medium text-zinc-950 transition hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
        >
          {alternateCta}
        </Link>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center gap-10 px-6 py-12 lg:flex-row lg:items-center lg:gap-16">
        <section className="max-w-md">
          <div className="mb-4 inline-flex rounded-full border border-zinc-200 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            {mode === 'login' ? 'Username Login Flow' : 'Username Registration Flow'}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">{title}</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
            {alternateLabel}{' '}
            <Link href={alternateHref} className="font-medium text-zinc-950 hover:underline dark:text-zinc-100">
              {alternateCta}
            </Link>
          </p>
        </section>
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}

type AuthFormCardProps = {
  title: string;
  description: string;
  fields: AuthField[];
  values: Record<string, string>;
  pending?: boolean;
  error?: string | null;
  submitLabel: string;
  onFieldChange: (name: string, value: string) => void;
  onSubmit: () => void;
  footer?: ReactNode;
};

export function AuthFormCard({
  title,
  description,
  fields,
  values,
  pending,
  error,
  submitLabel,
  onFieldChange,
  onSubmit,
  footer,
}: AuthFormCardProps) {
  return (
    <SectionCard title={title} description={description}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {fields.map((field) => (
          <label key={field.name} className="block space-y-2">
            <div className="flex items-center justify-between text-sm font-medium text-zinc-800 dark:text-zinc-200">
              <span>{field.label}</span>
              {field.required ? <StatusBadge tone="neutral">Required</StatusBadge> : null}
            </div>
            <input
              type={field.type}
              placeholder={field.placeholder}
              value={values[field.name] ?? ''}
              onChange={(event) => onFieldChange(field.name, event.target.value)}
              autoComplete={field.autoComplete}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-[#0a0a0a] dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
            />
            {field.hint ? <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">{field.hint}</p> : null}
          </label>
        ))}

        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <Button type="submit" className="w-full justify-center" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </form>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </SectionCard>
  );
}

export function AuthContractPanel({ contract }: { contract: AuthContract }) {
  return (
    <SectionCard
      title="Auth integration contract"
      description={contract.summary}
      action={<StatusBadge tone="warning">Mock-backed</StatusBadge>}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Data needed</div>
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            {contract.dataNeeds.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Actions</div>
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            {contract.actions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ContractState title="Loading" body={contract.states.loading} />
        <ContractState title="Empty" body={contract.states.empty} />
        <ContractState title="Error" body={contract.states.error} />
      </div>
      {contract.mockSource ? (
        <div className="mt-4 rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          Replace point: {contract.mockSource}
        </div>
      ) : null}
    </SectionCard>
  );
}

function ContractState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800/60 dark:bg-[#0a0a0a]">
      <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{title}</div>
      <div className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">{body}</div>
    </div>
  );
}
