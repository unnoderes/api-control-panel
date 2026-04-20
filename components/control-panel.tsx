'use client';

import { type LucideIcon, Bell, BookOpen, Cpu, CreditCard, FileText, Key, LayoutDashboard, Loader2, Menu, MoreHorizontal, Moon, PanelLeftClose, PauseCircle, PlayCircle, Search, Settings, Sun, Trash2, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Button,
  EmptyState,
  ErrorState,
  InfoList,
  SectionCard,
  SidebarItem,
  SkeletonCard,
  SkeletonTable,
  StatCard,
  StatusBadge,
} from '@/components/UIComponents';
import { useIsMobile } from '@/hooks/use-mobile';
import type {
  ApiKeySummary,
  ControlPanelPageData,
  ControlPanelPageKey,
  DashboardStat,
  TokenCreateDraft,
  UsageLogRecord,
} from '@/hooks/use-control-panel-data';
import { bffClient } from '@/lib/api/bff-client';

type NavItem = {
  icon: LucideIcon;
  label: string;
  tab: ControlPanelPageKey;
  group: 'primary' | 'system';
};

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', tab: 'dashboard', group: 'primary' },
  { icon: Key, label: 'API Keys', tab: 'keys', group: 'primary' },
  { icon: FileText, label: 'Usage Logs', tab: 'logs', group: 'primary' },
  { icon: Cpu, label: 'Models', tab: 'models', group: 'system' },
  { icon: CreditCard, label: 'Plans', tab: 'plans', group: 'system' },
  { icon: BookOpen, label: 'Docs', tab: 'docs', group: 'system' },
  { icon: Settings, label: 'Settings', tab: 'settings', group: 'system' },
];

const pageTitles: Record<ControlPanelPageKey, string> = {
  dashboard: 'Dashboard',
  keys: 'API Keys',
  logs: 'Usage Logs',
  models: 'Models',
  plans: 'Plans',
  docs: 'Docs',
  settings: 'Settings',
};

type ShellProps = {
  activeTab: ControlPanelPageKey;
  searchText: string;
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  sidebarWidth: number;
  showMoreMenu: boolean;
  showNotifMenu: boolean;
  data: ControlPanelPageData;
  createTokenPending: boolean;
  onTabChange: (tab: ControlPanelPageKey) => void;
  onSearchTextChange: (value: string) => void;
  onDarkModeToggle: () => void;
  onSidebarToggle: (isOpen: boolean) => void;
  onSidebarResizeStart: () => void;
  onMoreMenuToggle: () => void;
  onNotifMenuToggle: () => void;
  onCreateToken: (draft: TokenCreateDraft) => Promise<void>;
  onDeleteToken: (id: string) => Promise<void>;
  onBatchDeleteTokens: (ids: string[]) => Promise<void>;
  onRefreshKeys: () => Promise<void>;
};

export function ControlPanelShell({
  activeTab,
  searchText,
  isDarkMode,
  isSidebarOpen,
  sidebarWidth,
  showMoreMenu,
  showNotifMenu,
  data,
  createTokenPending,
  onTabChange,
  onSearchTextChange,
  onDarkModeToggle,
  onSidebarToggle,
  onSidebarResizeStart,
  onMoreMenuToggle,
  onNotifMenuToggle,
  onCreateToken,
  onDeleteToken,
  onBatchDeleteTokens,
  onRefreshKeys,
}: ShellProps) {
  const isMobile = useIsMobile();
  const filteredNav = navItems.filter((item) => item.label.toLowerCase().includes(searchText.toLowerCase()));
  const currentPage = data.pages[activeTab];

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors">
      {isSidebarOpen && (
        <aside
          className="relative flex shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 p-6 py-6 dark:border-zinc-800/60 dark:bg-zinc-950 transition-colors"
          style={{ width: isMobile ? '100%' : `${sidebarWidth}px` }}
        >
          {!isMobile && (
            <button
              onClick={() => onSidebarToggle(false)}
              onMouseDown={(event) => {
                event.stopPropagation();
                onSidebarResizeStart();
              }}
              className="absolute -right-3 top-20 rounded-full border border-zinc-200 bg-white p-0.5 text-zinc-500 shadow-sm transition hover:text-zinc-900 cursor-col-resize dark:border-zinc-700/80 dark:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <PanelLeftClose className="size-4" />
            </button>
          )}

          <div className="mb-4 flex items-center gap-2.5 px-2 text-lg font-bold tracking-tight dark:text-zinc-100">
            <div className="size-6 rounded bg-zinc-950 dark:bg-zinc-100" />
            New API
          </div>

          <div className="relative mb-6 px-2">
            <Search className="absolute left-5 top-2.5 size-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Find..."
              value={searchText}
              onChange={(event) => onSearchTextChange(event.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white py-2 pl-9 pr-8 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
            />
            <div className="absolute right-3.5 top-2 flex size-5 items-center justify-center rounded border border-zinc-200 text-[10px] text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
              F
            </div>
          </div>

          <nav className="space-y-1">
            <div className="space-y-1">
              {filteredNav
                .filter((item) => item.group === 'primary')
                .map((item) => (
                  <SidebarItem
                    key={item.tab}
                    icon={item.icon}
                    label={item.label}
                    active={activeTab === item.tab}
                    onClick={() => onTabChange(item.tab)}
                  />
                ))}
            </div>
            <div className="px-2 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">System</div>
            <div className="space-y-1">
              {filteredNav
                .filter((item) => item.group === 'system')
                .map((item) => (
                  <SidebarItem
                    key={item.tab}
                    icon={item.icon}
                    label={item.label}
                    active={activeTab === item.tab}
                    onClick={() => onTabChange(item.tab)}
                  />
                ))}
            </div>
          </nav>

          <div className="mt-auto space-y-4 border-t border-zinc-200/60 px-2 pt-6 dark:border-zinc-800">
            <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800/60 dark:bg-[#0a0a0a]">
              <div className="mb-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Future session source</div>
              <div className="text-sm font-medium text-zinc-950 dark:text-zinc-100">{data.viewer.username}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">{data.viewer.groupLabel}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                  {data.viewer.username.slice(0, 1).toUpperCase()}
                </div>
                <div className="text-sm font-medium dark:text-zinc-200">{data.viewer.username}</div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={onMoreMenuToggle}
                  className="relative rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  <MoreHorizontal className="size-4" />
                  {showMoreMenu && (
                    <div className="absolute bottom-full left-0 z-10 mb-2 w-44 rounded-lg border border-zinc-200 bg-white p-1 text-sm shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                      <button
                        onClick={() => onTabChange('settings')}
                        className="w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/50"
                      >
                        Account settings
                      </button>
                      <button
                        className="w-full rounded-md px-3 py-2 text-left text-red-600 transition-colors hover:bg-zinc-50 dark:text-red-400 dark:hover:bg-zinc-800/50"
                      >
                        Future logout action
                      </button>
                    </div>
                  )}
                </button>
                <button
                  onClick={onNotifMenuToggle}
                  className="relative rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  <Bell className="size-4" />
                  {showNotifMenu && (
                    <div className="absolute bottom-full right-0 z-10 mb-2 w-52 rounded-lg border border-zinc-200 bg-white p-2 text-sm text-zinc-500 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                      Future notifications feed from BFF.
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      <main className="flex-1 overflow-y-auto">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 transition-colors dark:border-zinc-800/60 dark:bg-zinc-950 md:px-8">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => onSidebarToggle(true)}
                className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              >
                <Menu className="size-4" />
              </button>
            )}
            <div>
              <h2 className="text-sm font-medium capitalize text-zinc-600 dark:text-zinc-300">{pageTitles[activeTab]}</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">{currentPage.contract.summary}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onDarkModeToggle}
              className="text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {isDarkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
            <Bell className="size-5 text-zinc-400 dark:text-zinc-500" />
            <User className="size-5 text-zinc-400 dark:text-zinc-500" />
          </div>
        </header>

        <section className="p-6 md:p-8">
          <PageSectionRenderer
            tab={activeTab}
            page={currentPage}
            darkMode={isDarkMode}
            contractCard={<DataContractPanel contract={currentPage.contract} />}
            createTokenPending={createTokenPending}
            onCreateToken={onCreateToken}
            onDeleteToken={onDeleteToken}
            onBatchDeleteTokens={onBatchDeleteTokens}
            onRefreshKeys={onRefreshKeys}
          />
        </section>
      </main>
    </div>
  );
}

type RendererProps = {
  tab: ControlPanelPageKey;
  page: ControlPanelPageData['pages'][ControlPanelPageKey];
  darkMode: boolean;
  contractCard: React.ReactNode;
  createTokenPending: boolean;
  onCreateToken: (draft: TokenCreateDraft) => Promise<void>;
  onDeleteToken: (id: string) => Promise<void>;
  onBatchDeleteTokens: (ids: string[]) => Promise<void>;
  onRefreshKeys: () => Promise<void>;
};

function PageSectionRenderer({ tab, page, darkMode, contractCard, createTokenPending, onCreateToken, onDeleteToken, onBatchDeleteTokens, onRefreshKeys }: RendererProps) {
  if (page.status === 'loading') {
    return (
      <div className="space-y-6">
        {tab === 'dashboard' ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : (
          <SkeletonTable rows={6} />
        )}
        {contractCard}
      </div>
    );
  }

  if (page.status === 'error') {
    return (
      <div className="space-y-6">
        <ErrorState title={page.errorTitle ?? 'Load failed'} message={page.errorMessage ?? 'Unknown error'} />
        {contractCard}
      </div>
    );
  }

  switch (tab) {
    case 'dashboard':
      return <DashboardSection page={page} darkMode={darkMode} contractCard={contractCard} />;
    case 'keys':
      return <ApiKeysSection page={page} contractCard={contractCard} createTokenPending={createTokenPending} onCreateToken={onCreateToken} onDeleteToken={onDeleteToken} onBatchDeleteTokens={onBatchDeleteTokens} onRefreshKeys={onRefreshKeys} />;
    case 'logs':
      return <UsageLogsSection page={page} contractCard={contractCard} />;
    case 'models':
      return <ModelsSection page={page} contractCard={contractCard} />;
    case 'settings':
      return <SettingsSection page={page} contractCard={contractCard} />;
    case 'plans':
      return <PlansSection page={page} contractCard={contractCard} />;
    case 'docs':
      return <DocsSection page={page} contractCard={contractCard} />;
    default:
      return contractCard;
  }
}

function DashboardSection({ page, darkMode, contractCard }: { page: RendererProps['page']; darkMode: boolean; contractCard: React.ReactNode }) {
  if (!page.dashboard || page.dashboard.stats.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState title="No dashboard metrics yet" message="Connect future BFF aggregates for balance, usage, and trend data." />
        {contractCard}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {page.dashboard.stats.map((stat) => (
          <DashboardStatCard key={stat.title} stat={stat} />
        ))}
      </div>

      <SectionCard title="Token Consumption (Last 7 Days)" description="BFF-backed chart data from dashboard overview.">
        <ResponsiveContainer width="100%" height={256}>
          <AreaChart data={page.dashboard.chart}>
            <defs>
              <linearGradient id="dashboardFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={darkMode ? '#fafafa' : '#09090b'} stopOpacity={darkMode ? 0.2 : 0.1} />
                <stop offset="95%" stopColor={darkMode ? '#fafafa' : '#09090b'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" stroke={darkMode ? '#71717a' : '#a1a1aa'} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={darkMode ? '#71717a' : '#a1a1aa'} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#18181b' : '#ffffff',
                borderColor: darkMode ? '#27272a' : '#e4e4e7',
                color: darkMode ? '#fafafa' : '#09090b',
              }}
            />
            <Area type="monotone" dataKey="value" stroke={darkMode ? '#fafafa' : '#09090b'} fillOpacity={1} fill="url(#dashboardFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </SectionCard>

      {contractCard}
    </div>
  );
}

function ApiKeysSection({
  page,
  contractCard,
  createTokenPending,
  onCreateToken,
  onDeleteToken,
  onBatchDeleteTokens,
  onRefreshKeys,
}: {
  page: RendererProps['page'];
  contractCard: React.ReactNode;
  createTokenPending: boolean;
  onCreateToken: (draft: TokenCreateDraft) => Promise<void>;
  onDeleteToken: (id: string) => Promise<void>;
  onBatchDeleteTokens: (ids: string[]) => Promise<void>;
  onRefreshKeys: () => Promise<void>;
}) {
  const keys = page.keys ?? [];
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<TokenCreateDraft>({
    name: '',
    remainingQuota: '',
    unlimitedQuota: true,
    expiresAt: '',
    group: '',
    modelLimits: '',
    allowIps: '',
  });

  async function submitCreate() {
    setError(null);
    try {
      await onCreateToken(draft);
      setDraft({ name: '', remainingQuota: '', unlimitedQuota: true, expiresAt: '', group: '', modelLimits: '', allowIps: '' });
      setShowCreateForm(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create token.');
    }
  }

  useEffect(() => {
    setSelectedIds((current) => {
      const next = new Set(keys.map((key) => key.id));
      const filtered = new Set(Array.from(current).filter((id) => next.has(id)));
      return filtered.size === current.size ? current : filtered;
    });
  }, [keys]);

  const allSelected = keys.length > 0 && selectedIds.size === keys.length;

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(keys.map((key) => key.id)) : new Set());
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this key?')) {
      return;
    }
    await onDeleteToken(id);
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  async function handleBatchDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || !window.confirm(`Delete selected (${ids.length}) keys?`)) {
      return;
    }
    await onBatchDeleteTokens(ids);
    setSelectedIds(new Set());
  }

  async function handleToggleStatus(item: ApiKeySummary) {
    await bffClient.tokens.update({ status: item.statusTone === 'success' ? 0 : 1 }, `?id=${item.id}`);
    await onRefreshKeys();
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="API key inventory"
        description="Rows are fed by the token list DTO. Creation now calls the local BFF and refreshes this table on success."
        action={<Button onClick={() => setShowCreateForm(true)}>Create new secret key</Button>}
      >
        {showCreateForm ? (
          <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800/60 dark:bg-zinc-900/40">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">Create API key</div>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Use the minimum stable fields first; optional constraints stay instance-dependent.</p>
              </div>
              <button className="rounded-md p-1 text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800" onClick={() => setShowCreateForm(false)}>
                <X className="size-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Token name" required>
                <input value={draft.name} onChange={(e) => setDraft((c) => ({ ...c, name: e.target.value }))} className={inputClassName} placeholder="Primary Service Key" />
              </Field>
              <Field label="Group">
                <input value={draft.group} onChange={(e) => setDraft((c) => ({ ...c, group: e.target.value }))} className={inputClassName} placeholder="default" />
              </Field>
              <Field label="Unlimited quota">
                <label className="flex h-10 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-[#0a0a0a] dark:text-zinc-200">
                  <input type="checkbox" checked={draft.unlimitedQuota} onChange={(e) => setDraft((c) => ({ ...c, unlimitedQuota: e.target.checked }))} />
                  Do not cap remaining quota
                </label>
              </Field>
              <Field label="Remaining quota">
                <input value={draft.remainingQuota} disabled={draft.unlimitedQuota} onChange={(e) => setDraft((c) => ({ ...c, remainingQuota: e.target.value }))} className={inputClassName} placeholder="84000" />
              </Field>
              <Field label="Expires at">
                <input type="datetime-local" value={draft.expiresAt} onChange={(e) => setDraft((c) => ({ ...c, expiresAt: e.target.value }))} className={inputClassName} />
              </Field>
              <Field label="Allowed IPs">
                <input value={draft.allowIps} onChange={(e) => setDraft((c) => ({ ...c, allowIps: e.target.value }))} className={inputClassName} placeholder="127.0.0.1,10.0.0.0/24" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Model limits">
                  <textarea value={draft.modelLimits} onChange={(e) => setDraft((c) => ({ ...c, modelLimits: e.target.value }))} className={`${inputClassName} min-h-24 py-3`} placeholder="gpt-4.1-mini,claude-3.7-sonnet" />
                </Field>
              </div>
            </div>

            {error ? <ErrorState title="Create token failed" message={error} /> : null}

            <div className="mt-4 flex gap-3">
              <Button onClick={submitCreate} disabled={createTokenPending}>
                {createTokenPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Create token
              </Button>
              <Button className="bg-white text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800" onClick={() => setShowCreateForm(false)} type="button">
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {keys.length === 0 ? (
          <EmptyState title="No API keys" message="Create your first key through the BFF-backed form above." />
        ) : (
          <div className="space-y-4">
            {selectedIds.size > 0 ? (
              <div className="flex justify-end">
                <Button onClick={handleBatchDelete} className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600">
                  Delete selected ({selectedIds.size})
                </Button>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm transition-colors dark:border-zinc-800/60 dark:bg-[#0a0a0a]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800/60 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider">
                    <input type="checkbox" checked={allSelected} onChange={(event) => toggleSelectAll(event.target.checked)} aria-label="Select all keys" />
                  </th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider">Secret</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider">Quota</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-600 dark:divide-zinc-800/60 dark:text-zinc-300">
                {keys.map((item) => (
                  <ApiKeysRow
                    key={item.id}
                    item={item}
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={toggleSelected}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </SectionCard>
      {contractCard}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}{required ? ' *' : ''}</div>
      {children}
    </label>
  );
}

const inputClassName = 'w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-[#0a0a0a] dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600';

function UsageLogsSection({ page, contractCard }: { page: RendererProps['page']; contractCard: React.ReactNode }) {
  type LogFilter = {
    keyword: string;
    modelName: string;
    startDate: string;
    endDate: string;
    page: number;
    pageSize: number;
  };

  const initialFilter: LogFilter = {
    keyword: '',
    modelName: '',
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: 20,
  };

  const [filter, setFilter] = useState<LogFilter>(initialFilter);
  const [logs, setLogs] = useState<UsageLogRecord[]>(page.logs ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLogs(page.logs ?? []);
  }, [page.logs]);

  async function fetchLogs(nextFilter: LogFilter) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (nextFilter.keyword) params.set('keyword', nextFilter.keyword);
      if (nextFilter.modelName) params.set('model_name', nextFilter.modelName);
      if (nextFilter.startDate) params.set('start_timestamp', String((new Date(nextFilter.startDate).getTime() / 1000) | 0));
      if (nextFilter.endDate) params.set('end_timestamp', String((new Date(nextFilter.endDate).getTime() / 1000) | 0));
      params.set('p', String(nextFilter.page));
      params.set('page_size', String(nextFilter.pageSize));
      const result = await bffClient.logs.list(`?${params.toString()}`);
      setLogs(result.items.map((item) => ({
        id: item.id,
        timeText: item.createdAtText,
        model: item.modelName ?? '-',
        tokenText: new Intl.NumberFormat('en-US').format(item.totalTokens ?? 0),
        quotaText: item.quota === null ? '-' : `${new Intl.NumberFormat('en-US').format(item.quota)} quota`,
        latencyText: item.latencyMs === null ? '-' : `${new Intl.NumberFormat('en-US').format(item.latencyMs)}ms`,
      })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    const nextFilter = { ...filter, page: 1 };
    setFilter(nextFilter);
    await fetchLogs(nextFilter);
  }

  async function handleReset() {
    setFilter(initialFilter);
    await fetchLogs(initialFilter);
  }

  async function handlePageChange(pageNumber: number) {
    const nextFilter = { ...filter, page: pageNumber };
    setFilter(nextFilter);
    await fetchLogs(nextFilter);
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Usage log stream" description="Query BFF-backed usage logs with keyword, model, date range, and pagination filters.">
        <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            type="text"
            placeholder="Keyword"
            value={filter.keyword}
            onChange={(event) => setFilter((current) => ({ ...current, keyword: event.target.value }))}
            className={inputClassName}
          />
          <input
            type="text"
            placeholder="Model"
            value={filter.modelName}
            onChange={(event) => setFilter((current) => ({ ...current, modelName: event.target.value }))}
            className={inputClassName}
          />
          <input
            type="date"
            value={filter.startDate}
            onChange={(event) => setFilter((current) => ({ ...current, startDate: event.target.value }))}
            className={inputClassName}
          />
          <input
            type="date"
            value={filter.endDate}
            onChange={(event) => setFilter((current) => ({ ...current, endDate: event.target.value }))}
            className={inputClassName}
          />
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading} className="flex-1">
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Search
            </Button>
            <Button
              onClick={handleReset}
              disabled={loading}
              className="bg-white text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Reset
            </Button>
          </div>
        </div>

        {error ? <ErrorState title="Load logs failed" message={error} /> : null}

        {loading ? (
          <SkeletonTable rows={6} />
        ) : logs.length === 0 ? (
          <EmptyState title="No usage logs" message="Keep this empty state when the user has no requests in the selected range." />
        ) : (
          <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm transition-colors dark:border-zinc-800/60 dark:bg-[#0a0a0a]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800/60 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium">Tokens</th>
                  <th className="px-4 py-3 font-medium">Quota</th>
                  <th className="px-4 py-3 font-medium">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-600 dark:divide-zinc-800/60 dark:text-zinc-300">
                {logs.map((record) => (
                  <UsageLogRow key={record.id} record={record} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 text-sm text-zinc-500 dark:text-zinc-400">
          <div>Page {filter.page}</div>
          <div className="flex gap-2">
            {filter.page > 1 ? (
              <Button
                onClick={() => handlePageChange(filter.page - 1)}
                disabled={loading}
                className="bg-white text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Prev
              </Button>
            ) : null}
            {logs.length === filter.pageSize ? (
              <Button
                onClick={() => handlePageChange(filter.page + 1)}
                disabled={loading}
                className="bg-white text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Next
              </Button>
            ) : null}
          </div>
        </div>
      </SectionCard>
      {contractCard}
    </div>
  );
}

function ModelsSection({ page, contractCard }: { page: RendererProps['page']; contractCard: React.ReactNode }) { const items = page.models ?? []; return <div className="space-y-6"><SectionCard title="Visible models" description="Prepared for `/api/user/models` and optional BFF-enriched metadata.">{items.length === 0 ? <EmptyState title="No visible models" message="Render this when the user has no accessible models in the selected group." /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <div key={item.id} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-colors dark:border-zinc-800/60 dark:bg-[#0a0a0a]"><div className="mb-2 flex items-center justify-between"><div className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">{item.name}</div><StatusBadge tone={item.status === 'available' ? 'success' : 'neutral'}>{item.statusLabel}</StatusBadge></div><p className="mb-4 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{item.description}</p><InfoList items={[{ label: 'Context window', value: item.contextWindow },{ label: 'Access group', value: item.groupLabel },{ label: 'Pricing source', value: item.pricingNote }]} /></div>)}</div>}</SectionCard>{contractCard}</div>; }
function SettingsSection({ page, contractCard }: { page: RendererProps['page']; contractCard: React.ReactNode }) { const settings = page.settings; return <div className="space-y-6"><SectionCard title="Account settings" description="Prepared for profile fetch/update and preference mutation.">{!settings ? <EmptyState title="Settings unavailable" message="Show an error or empty state if profile payload is missing." /> : <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]"><div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800/60 dark:bg-[#0a0a0a]"><div className="mb-4 text-sm font-semibold text-zinc-950 dark:text-zinc-100">Profile snapshot</div><InfoList items={[{ label: 'Username', value: settings.username },{ label: 'Display name', value: settings.displayName },{ label: 'Email', value: settings.email },{ label: 'Default group', value: settings.groupLabel }]} /><div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">Future actions: update profile, rotate password, toggle preferences.</div></div><div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900/40"><div className="mb-3 text-sm font-semibold text-zinc-950 dark:text-zinc-100">Preference placeholders</div><div className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400"><div className="flex items-center justify-between"><span>Email notices</span><span>On</span></div><div className="flex items-center justify-between"><span>2FA flow</span><span>Reserved</span></div><div className="flex items-center justify-between"><span>Theme sync</span><span>UI only</span></div></div></div></div>}</SectionCard>{contractCard}</div>; }
function PlansSection({ page, contractCard }: { page: RendererProps['page']; contractCard: React.ReactNode }) { const plan = page.plan; return <div className="space-y-6"><SectionCard title="Billing and quota" description="Read-only until payment and recharge decisions are confirmed.">{!plan ? <EmptyState title="Billing data unavailable" message="Keep a neutral read-only state until BFF wiring is ready." /> : <div className="grid gap-4 lg:grid-cols-3"><div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800/60 dark:bg-[#0a0a0a]"><div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Current plan</div><div className="mt-2 text-xl font-semibold text-zinc-950 dark:text-zinc-100">{plan.name}</div><p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{plan.description}</p></div><div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800/60 dark:bg-[#0a0a0a]"><div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Remaining quota</div><div className="mt-2 text-xl font-semibold text-zinc-950 dark:text-zinc-100">{plan.remainingQuota}</div><p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Distinguish quota units from USD when the real backend arrives.</p></div><div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800/60 dark:bg-[#0a0a0a]"><div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Top-up action</div><div className="mt-2 text-xl font-semibold text-zinc-950 dark:text-zinc-100">Reserved</div><p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Future BFF action can branch to recharge or payment order flows.</p></div></div>}</SectionCard>{contractCard}</div>; }
function DocsSection({ page, contractCard }: { page: RendererProps['page']; contractCard: React.ReactNode }) { const docs = page.docs ?? []; return <div className="space-y-6"><SectionCard title="Platform notices and docs" description="Prepared for notice/about/home content endpoints or external links.">{docs.length === 0 ? <EmptyState title="No docs content" message="Use this state if content endpoints are disabled or empty." /> : <div className="grid gap-4 md:grid-cols-2">{docs.map((item) => <div key={item.id} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800/60 dark:bg-[#0a0a0a]"><div className="mb-2 text-sm font-semibold text-zinc-950 dark:text-zinc-100">{item.title}</div><p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">{item.description}</p><div className="mt-4 text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{item.sourceLabel}</div></div>)}</div>}</SectionCard>{contractCard}</div>; }
function DashboardStatCard({ stat }: { stat: DashboardStat }) { return <StatCard title={stat.title} value={stat.value} trend={stat.trend} meta={stat.meta} />; }
function ApiKeysRow({
  item,
  checked,
  onCheckedChange,
  onDelete,
  onToggleStatus,
}: {
  item: ApiKeySummary;
  checked: boolean;
  onCheckedChange: (id: string, checked: boolean) => void;
  onDelete: (id: string) => Promise<void>;
  onToggleStatus: (item: ApiKeySummary) => Promise<void>;
}) {
  return (
    <tr className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
      <td className="px-4 py-3">
        <input type="checkbox" checked={checked} onChange={(event) => onCheckedChange(item.id, event.target.checked)} aria-label={`Select ${item.name}`} />
      </td>
      <td className="px-4 py-3 font-semibold text-zinc-950 dark:text-zinc-100">{item.name}</td>
      <td className="px-4 py-3 font-mono text-zinc-500 dark:text-zinc-500">{item.maskedKey}</td>
      <td className="px-4 py-3">{item.remainingQuotaText}</td>
      <td className="px-4 py-3"><StatusBadge tone={item.statusTone}>{item.statusLabel}</StatusBadge></td>
      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-500">{item.createdAtText}</td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => onToggleStatus(item)} className="text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100" aria-label={`Toggle ${item.name} status`}>
            {item.statusTone === 'success' ? <PauseCircle className="size-4" /> : <PlayCircle className="size-4" />}
          </button>
          <button type="button" onClick={() => onDelete(item.id)} className="text-red-600 transition hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" aria-label={`Delete ${item.name}`}>
            <Trash2 className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
function UsageLogRow({ record }: { record: UsageLogRecord }) { return <tr className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"><td className="px-4 py-3 text-zinc-500 dark:text-zinc-500">{record.timeText}</td><td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{record.model}</td><td className="px-4 py-3">{record.tokenText}</td><td className="px-4 py-3 text-zinc-500 dark:text-zinc-500">{record.quotaText}</td><td className="px-4 py-3 text-zinc-500 dark:text-zinc-500">{record.latencyText}</td></tr>; }
function DataContractPanel({ contract }: { contract: ControlPanelPageData['pages'][ControlPanelPageKey]['contract'] }) { return <SectionCard title="Integration contract" description="This panel documents what the future BFF hook needs to provide for the page." action={contract.mockSource ? <StatusBadge tone="warning">Mock-backed</StatusBadge> : undefined}><div className="grid gap-4 lg:grid-cols-2"><InfoList items={contract.dataNeeds.map((item) => ({ label: 'Needs', value: item }))} /><InfoList items={contract.actions.map((item) => ({ label: 'Action', value: item }))} /></div><div className="mt-4 grid gap-4 lg:grid-cols-3"><StateCard title="Loading" body={contract.states.loading} /><StateCard title="Empty" body={contract.states.empty} /><StateCard title="Error" body={contract.states.error} /></div>{contract.mockSource && <div className="mt-4 rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">Replace point: {contract.mockSource}</div>}</SectionCard>; }
function StateCard({ title, body }: { title: string; body: string }) { return <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800/60 dark:bg-[#0a0a0a]"><div className="mb-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{title}</div><div className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">{body}</div></div>; }
export function InlineLoadingNotice({ label }: { label: string }) { return <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500 dark:border-zinc-800/60 dark:bg-[#0a0a0a] dark:text-zinc-400"><Loader2 className="size-4 animate-spin" />{label}</div>; }
