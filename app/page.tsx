'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Loader2, Megaphone, Shield, Sparkles } from 'lucide-react';
import { SectionCard, StatusBadge } from '@/components/UIComponents';
import { bffClient } from '@/lib/api/bff-client';
import type { PlatformStatusDto, PublicContentDto, SessionDto } from '@/types/bff';

type PortalState = {
  session: SessionDto | null;
  home: PublicContentDto | null;
  notice: PublicContentDto | null;
  about: PublicContentDto | null;
  status: PlatformStatusDto | null;
  loading: boolean;
};

const FALLBACK_COPY = {
  homeTitle: 'Open platform portal',
  homeContent: 'Explore the platform overview, latest notices, and system status before signing in.',
  noticeTitle: 'Latest notice',
  noticeContent: 'No announcements have been published yet.',
  aboutTitle: 'About this platform',
  aboutContent: 'This portal provides a public entry point to the New API platform and its authenticated dashboard.',
  systemName: 'New API Platform',
};

function asText(value: string | null | undefined, fallback: string) {
  const text = value?.trim();
  return text ? text : fallback;
}

function formatTimestamp(value: number | null | undefined) {
  if (!value) {
    return 'Unavailable';
  }

  const timestamp = value > 1e12 ? value : value * 1000;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString();
}

function PortalSection({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <SectionCard
      title={title}
      description={eyebrow}
      action={<StatusBadge tone="neutral">Public</StatusBadge>}
    >
      <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-600 dark:text-zinc-300">{body}</p>
    </SectionCard>
  );
}

export default function PublicPortalPage() {
  const [state, setState] = useState<PortalState>({
    session: null,
    home: null,
    notice: null,
    about: null,
    status: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [session, home, notice, about, status] = await Promise.allSettled([
        bffClient.auth.session(),
        bffClient.content.home(),
        bffClient.content.notice(),
        bffClient.content.about(),
        bffClient.platform.status(),
      ]);

      if (cancelled) {
        return;
      }

      setState({
        session: session.status === 'fulfilled' ? session.value : null,
        home: home.status === 'fulfilled' ? home.value : null,
        notice: notice.status === 'fulfilled' ? notice.value : null,
        about: about.status === 'fulfilled' ? about.value : null,
        status: status.status === 'fulfilled' ? status.value : null,
        loading: false,
      });
    }

    load().catch(() => {
      if (!cancelled) {
        setState((current) => ({ ...current, loading: false }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const announcements = useMemo(
    () => state.status?.announcements.filter((item) => item.trim().length > 0) ?? [],
    [state.status?.announcements],
  );

  const isAuthenticated = Boolean(state.session?.isAuthenticated);
  const homeTitle = asText(state.home?.title, FALLBACK_COPY.homeTitle);
  const homeBody = asText(state.home?.content, FALLBACK_COPY.homeContent);
  const noticeTitle = asText(state.notice?.title, FALLBACK_COPY.noticeTitle);
  const noticeBody = asText(state.notice?.content, FALLBACK_COPY.noticeContent);
  const aboutTitle = asText(state.about?.title, FALLBACK_COPY.aboutTitle);
  const aboutBody = asText(state.about?.content, FALLBACK_COPY.aboutContent);
  const systemName = asText(state.status?.systemName, FALLBACK_COPY.systemName);

  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-[#0a0a0a]">
      <header className="flex h-16 items-center justify-between border-b border-zinc-100 px-6 dark:border-zinc-800">
        <div className="flex items-center gap-3 text-zinc-950 dark:text-white">
          <svg className="size-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2l10 18H2L12 2z" />
          </svg>
          <span className="text-sm font-semibold tracking-[0.2em] uppercase">Portal</span>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
            >
              Go to Dashboard
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-950 transition hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] lg:items-start">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full border border-zinc-200 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              Public Platform Home
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">{systemName}</h1>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-500 dark:text-zinc-400">{homeBody}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-800">
                <Sparkles className="size-3.5" />
                {homeTitle}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-800">
                <Shield className="size-3.5" />
                {isAuthenticated ? 'Authenticated session detected' : 'Guest access enabled'}
              </div>
            </div>
          </div>

          <SectionCard
            title="System snapshot"
            description="Public status data synced from the New-API upstream status endpoint."
            action={state.loading ? <Loader2 className="size-4 animate-spin text-zinc-400" /> : <StatusBadge tone="success">Live</StatusBadge>}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">System name</div>
                <div className="mt-2 text-sm font-medium text-zinc-950 dark:text-zinc-100">{systemName}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Version</div>
                <div className="mt-2 text-sm font-medium text-zinc-950 dark:text-zinc-100">{asText(state.status?.version, 'Unavailable')}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Start time</div>
                <div className="mt-2 text-sm font-medium text-zinc-950 dark:text-zinc-100">{formatTimestamp(state.status?.startTime)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Announcements</div>
                <div className="mt-2 text-sm font-medium text-zinc-950 dark:text-zinc-100">{announcements.length || 0}</div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <Megaphone className="size-3.5" />
                Upstream announcements
              </div>
              {announcements.length > 0 ? (
                <ul className="space-y-2">
                  {announcements.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No public announcements are available right now.</p>
              )}
            </div>
          </SectionCard>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <PortalSection eyebrow="Homepage content" title={homeTitle} body={homeBody} />
          <PortalSection eyebrow="Notice board" title={noticeTitle} body={noticeBody} />
          <PortalSection eyebrow="About this service" title={aboutTitle} body={aboutBody} />
        </section>
      </main>
    </div>
  );
}
