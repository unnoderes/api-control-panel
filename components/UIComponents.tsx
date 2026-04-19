import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

export function SidebarItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-zinc-200/50 text-zinc-950 dark:bg-zinc-800/80 dark:text-zinc-100'
          : 'text-zinc-600 hover:bg-zinc-200/40 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
      }`}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

export function Button({ className = '', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300 ${className}`}
    >
      {children}
    </button>
  );
}

export function StatCard({
  title,
  value,
  trend,
  meta,
}: {
  title: string;
  value: string;
  trend: string;
  meta?: string;
}) {
  const trendTone = trend === 'Stable' ? 'neutral' : trend.startsWith('+') ? 'success' : 'danger';

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-colors dark:border-zinc-800/60 dark:bg-[#0a0a0a]">
      <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{title}</p>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold tracking-tighter text-zinc-950 dark:text-zinc-50">{value}</h3>
          {meta ? <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{meta}</p> : null}
        </div>
        <StatusBadge tone={trendTone}>{trend}</StatusBadge>
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-colors dark:border-zinc-800/60 dark:bg-[#0a0a0a]">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-100">{title}</h3>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function StatusBadge({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  const tones: Record<StatusTone, string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400',
    warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    danger: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
    neutral: 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
  };

  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>{children}</span>;
}

export function InfoList({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item.label}-${item.value}-${index}`} className="flex items-start justify-between gap-4 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">{item.label}</span>
          <span className="text-right text-zinc-800 dark:text-zinc-200">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-5 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</div>
      <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{message}</p>
    </div>
  );
}

export function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-8 dark:border-red-500/20 dark:bg-red-500/10">
      <div className="text-sm font-medium text-red-700 dark:text-red-300">{title}</div>
      <p className="mt-2 text-sm leading-6 text-red-600 dark:text-red-200">{message}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-colors dark:border-zinc-800/60 dark:bg-[#0a0a0a]">
      <div className="mb-2 h-3 w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="h-8 w-24 rounded bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white animate-pulse transition-colors dark:border-zinc-800/60 dark:bg-[#0a0a0a]">
      <div className="h-10 border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800/60 dark:bg-zinc-900" />
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-12 border-b border-zinc-100 bg-white dark:border-zinc-800/40 dark:bg-[#0a0a0a]" />
      ))}
    </div>
  );
}
