'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { bffClient } from '@/lib/api/bff-client';
import type { CurrentUserDto, DashboardOverviewDto, ModelDto, PaginatedTokensDto, PaginatedUsageLogsDto, PublicContentDto } from '@/types/bff';

export type ControlPanelPageKey = 'dashboard' | 'keys' | 'logs' | 'models' | 'settings' | 'docs' | 'plans';
export type DataStatus = 'loading' | 'ready' | 'error';
export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

export type DashboardStat = {
  title: string;
  value: string;
  trend: string;
  meta: string;
};

export type DashboardPoint = {
  label: string;
  value: number;
};

export type ApiKeySummary = {
  id: string;
  name: string;
  maskedKey: string;
  remainingQuotaText: string;
  statusLabel: string;
  statusTone: StatusTone;
  createdAtText: string;
};

export type UsageLogRecord = {
  id: string;
  timeText: string;
  model: string;
  tokenText: string;
  quotaText: string;
  latencyText: string;
};

export type ModelSummary = {
  id: string;
  name: string;
  description: string;
  contextWindow: string;
  groupLabel: string;
  pricingNote: string;
  status: 'available' | 'coming_soon' | 'deprecated';
  statusLabel: string;
};

export type SettingsSnapshot = {
  username: string;
  displayName: string;
  email: string;
  groupLabel: string;
};

export type PlanSnapshot = {
  name: string;
  description: string;
  remainingQuota: string;
};

export type DocsSummary = {
  id: string;
  title: string;
  description: string;
  sourceLabel: string;
};

export type PageContract = {
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

export type ControlPanelPageState = {
  status: DataStatus;
  errorTitle?: string;
  errorMessage?: string;
  contract: PageContract;
  dashboard?: {
    stats: DashboardStat[];
    chart: DashboardPoint[];
  };
  keys?: ApiKeySummary[];
  logs?: UsageLogRecord[];
  models?: ModelSummary[];
  settings?: SettingsSnapshot;
  plan?: PlanSnapshot;
  docs?: DocsSummary[];
};

export type TokenCreateDraft = {
  name: string;
  remainingQuota: string;
  unlimitedQuota: boolean;
  expiresAt: string;
  group: string;
  modelLimits: string;
  allowIps: string;
};

export type ControlPanelPageData = {
  viewer: {
    username: string;
    groupLabel: string;
  };
  pages: Record<ControlPanelPageKey, ControlPanelPageState>;
};

type DashboardUiState = {
  activeTab: ControlPanelPageKey;
  isDarkMode: boolean;
  searchText: string;
  isSidebarOpen: boolean;
  sidebarWidth: number;
  showMoreMenu: boolean;
  showNotifMenu: boolean;
};

const loadingDurations: Record<ControlPanelPageKey, number> = {
  dashboard: 500,
  keys: 350,
  logs: 350,
  models: 250,
  settings: 250,
  docs: 250,
  plans: 250,
};

export function useDashboardUiState() {
  const [state, setState] = useState<DashboardUiState>({
    activeTab: 'dashboard',
    isDarkMode: false,
    searchText: '',
    isSidebarOpen: true,
    sidebarWidth: 240,
    showMoreMenu: false,
    showNotifMenu: false,
  });
  const resizeHandler = useRef<((event: MouseEvent) => void) | null>(null);
  const upHandler = useRef<(() => void) | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.isDarkMode);
  }, [state.isDarkMode]);

  useEffect(() => {
    resizeHandler.current = (event: MouseEvent) => {
      const nextWidth = Math.max(220, Math.min(400, event.clientX));
      setState((current) => ({ ...current, sidebarWidth: nextWidth }));
    };
    upHandler.current = () => {
      if (resizeHandler.current) {
        window.removeEventListener('mousemove', resizeHandler.current);
      }
      if (upHandler.current) {
        window.removeEventListener('mouseup', upHandler.current);
      }
    };
  }, []);

  return {
    ...state,
    setActiveTab: (tab: ControlPanelPageKey) =>
      setState((current) => ({ ...current, activeTab: tab, showMoreMenu: false, showNotifMenu: false })),
    setSearchText: (searchText: string) => setState((current) => ({ ...current, searchText })),
    toggleDarkMode: () => setState((current) => ({ ...current, isDarkMode: !current.isDarkMode })),
    setSidebarOpen: (isSidebarOpen: boolean) => setState((current) => ({ ...current, isSidebarOpen })),
    startSidebarResize: () => {
      if (!resizeHandler.current || !upHandler.current) {
        return;
      }
      window.addEventListener('mousemove', resizeHandler.current);
      window.addEventListener('mouseup', upHandler.current);
    },
    toggleMoreMenu: () => setState((current) => ({ ...current, showMoreMenu: !current.showMoreMenu, showNotifMenu: false })),
    toggleNotifMenu: () => setState((current) => ({ ...current, showNotifMenu: !current.showNotifMenu, showMoreMenu: false })),
  };
}

export function useControlPanelData(activeTab: ControlPanelPageKey) {
  const baseData = useMemo(() => createMockControlPanelData(), []);
  const [data, setData] = useState<ControlPanelPageData>({
    viewer: baseData.viewer,
    pages: Object.fromEntries(
      (Object.keys(baseData.pages) as ControlPanelPageKey[]).map((key) => [
        key,
        {
          ...baseData.pages[key],
          status: 'loading',
        },
      ]),
    ) as ControlPanelPageData['pages'],
  });
  const loadedTabs = useRef<Set<ControlPanelPageKey>>(new Set());
  const userFetched = useRef(false);
  const [createTokenPending, setCreateTokenPending] = useState(false);

  async function reloadTab(tab: ControlPanelPageKey) {
    setData((current) => ({
      ...current,
      pages: {
        ...current.pages,
        [tab]: {
          ...current.pages[tab],
          status: 'loading',
          errorTitle: undefined,
          errorMessage: undefined,
        },
      },
    }));

    try {
      const patch = await loadPageFromBff(tab);
      loadedTabs.current.add(tab);
      setData((current) => ({
        ...current,
        viewer: patch.viewer ?? current.viewer,
        pages: {
          ...current.pages,
          [tab]: {
            ...current.pages[tab],
            ...patch.page,
            status: 'ready',
            errorTitle: undefined,
            errorMessage: undefined,
            contract: markContractLive(current.pages[tab].contract),
          },
          ...(patch.settingsPage
            ? {
                settings: {
                  ...current.pages.settings,
                  ...patch.settingsPage,
                  status: 'ready',
                  errorTitle: undefined,
                  errorMessage: undefined,
                  contract: markContractLive(current.pages.settings.contract),
                },
              }
            : {}),
        },
      }));
    } catch (error) {
      setData((current) => ({
        ...current,
        pages: {
          ...current.pages,
          [tab]: {
            ...current.pages[tab],
            status: 'error',
            errorTitle: `Failed to load ${tab}` ,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        },
      }));
      throw error;
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadViewer() {
      try {
        const user = await bffClient.user.me();
        if (cancelled) {
          return;
        }

        setData((current) => ({
          ...current,
          viewer: mapViewer(user),
          pages: {
            ...current.pages,
            settings: {
              ...current.pages.settings,
              status: current.pages.settings.status === 'loading' ? 'ready' : current.pages.settings.status,
              contract: markContractLive(current.pages.settings.contract),
              settings: mapSettings(user),
            },
          },
        }));
        userFetched.current = true;
      } catch {
        if (cancelled) {
          return;
        }
      }
    }

    if (!userFetched.current) {
      loadViewer();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loadedTabs.current.has(activeTab)) {
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      reloadTab(activeTab).catch(() => {
        if (cancelled) {
          return;
        }
      });
    }, loadingDurations[activeTab]);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [activeTab]);

  async function createToken(draft: TokenCreateDraft) {
    const name = draft.name.trim();
    if (!name) {
      throw new Error('Token name is required.');
    }

    const remainingQuota = draft.remainingQuota.trim();
    const group = draft.group.trim();
    const allowIps = draft.allowIps.trim();
    const modelLimits = draft.modelLimits
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);

    const body: Record<string, unknown> = {
      name,
      unlimited_quota: draft.unlimitedQuota,
    };

    if (!draft.unlimitedQuota && remainingQuota) {
      const parsed = Number(remainingQuota);
      if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error('Remaining quota must be a non-negative number.');
      }
      body.remain_quota = parsed;
    }

    if (draft.expiresAt) {
      body.expired_time = Math.floor(new Date(draft.expiresAt).getTime() / 1000);
    }
    if (group) {
      body.group = group;
    }
    if (modelLimits.length > 0) {
      body.model_limits = modelLimits;
    }
    if (allowIps) {
      body.allow_ips = allowIps;
    }

    setCreateTokenPending(true);
    try {
      await bffClient.tokens.create(body);
      await reloadTab('keys');
    } finally {
      setCreateTokenPending(false);
    }
  }

  return {
    data,
    createToken,
    createTokenPending,
    refreshTab: reloadTab,
  };
}

export function createMockControlPanelData(): ControlPanelPageData {
  return {
    viewer: {
      username: 'unitserow-1029',
      groupLabel: 'default group',
    },
    pages: {
      dashboard: {
        status: 'ready',
        contract: {
          summary: 'Aggregate user, billing, and recent usage into dashboard-ready cards and chart points.',
          dataNeeds: [
            'Current user summary: quota, used quota, request count, permissions.',
            'Billing summary: active subscription, available balance or quota, billing cycle.',
            'Usage aggregate: daily quota or token consumption trend for the last 7 days.',
          ],
          actions: [
            'Refresh dashboard summary.',
            'Open drill-downs for API keys or usage logs from stat cards.',
          ],
          states: {
            loading: 'Show stat card skeletons and a chart placeholder while aggregate requests are pending.',
            empty: 'Render neutral cards with zero values if the account is new and has no usage yet.',
            error: 'Show a page-level error card and keep contract notes visible if aggregate fetch fails.',
          },
          mockSource: 'hooks/use-control-panel-data.ts:createMockControlPanelData().pages.dashboard',
        },
        dashboard: {
          stats: [
            { title: 'Remaining Quota', value: '128,400', trend: '+12.5%', meta: 'quota points' },
            { title: '7d Usage', value: '42,800', trend: '+2.1%', meta: 'quota points' },
            { title: 'Active Keys', value: '3', trend: '+1', meta: 'token inventory' },
            { title: 'Request Count', value: '18,290', trend: 'Stable', meta: 'lifetime requests' },
          ],
          chart: [
            { label: 'Mon', value: 4000 },
            { label: 'Tue', value: 3200 },
            { label: 'Wed', value: 5100 },
            { label: 'Thu', value: 2780 },
            { label: 'Fri', value: 6890 },
            { label: 'Sat', value: 4390 },
            { label: 'Sun', value: 7490 },
          ],
        },
      },
      keys: {
        status: 'ready',
        contract: {
          summary: 'Consume token list DTOs and expose create/edit/toggle/delete actions from a future hook.',
          dataNeeds: [
            'Token list with id, name, masked key, quota state, status, created time.',
            'Search and pagination params from the page container.',
            'Optional model limits, group, and expiry display fields.',
          ],
          actions: [
            'Create key.',
            'Edit key metadata.',
            'Toggle key status.',
            'Delete one or many keys.',
          ],
          states: {
            loading: 'Keep the table header visible and replace rows with skeleton rows.',
            empty: 'Render a create-first-key empty state when the token list is empty.',
            error: 'Show a retry-oriented error state without losing current filters.',
          },
          mockSource: 'hooks/use-control-panel-data.ts:createMockControlPanelData().pages.keys',
        },
        keys: [
          {
            id: 'key-1',
            name: 'Primary Service Key',
            maskedKey: 'sk-live-....a81p',
            remainingQuotaText: '84,000 quota',
            statusLabel: 'Active',
            statusTone: 'success',
            createdAtText: '2026-04-12',
          },
          {
            id: 'key-2',
            name: 'Analytics Worker',
            maskedKey: 'sk-live-....g53z',
            remainingQuotaText: '18,500 quota',
            statusLabel: 'Paused',
            statusTone: 'warning',
            createdAtText: '2026-04-05',
          },
        ],
      },
      logs: {
        status: 'ready',
        contract: {
          summary: 'Receive filtered usage records plus stats from BFF-facing hooks.',
          dataNeeds: [
            'Usage log rows with timestamp, model, token count, quota charge, latency.',
            'Filter options for model, token name, time range, and pagination.',
            'Optional summary stats for total quota, request count, and error count.',
          ],
          actions: [
            'Change filters and refetch.',
            'Paginate through results.',
            'Open request-level details in a future drawer or panel.',
          ],
          states: {
            loading: 'Keep filters interactive while replacing rows with skeleton rows.',
            empty: 'Explain that no requests matched the chosen time range or filters.',
            error: 'Preserve filter controls and show a recoverable list-level error.',
          },
          mockSource: 'hooks/use-control-panel-data.ts:createMockControlPanelData().pages.logs',
        },
        logs: [
          {
            id: 'log-1',
            timeText: '2026-04-19 14:01',
            model: 'gpt-4.1-mini',
            tokenText: '2,048',
            quotaText: '420 quota',
            latencyText: '320ms',
          },
          {
            id: 'log-2',
            timeText: '2026-04-19 13:42',
            model: 'claude-3.7-sonnet',
            tokenText: '1,264',
            quotaText: '315 quota',
            latencyText: '280ms',
          },
          {
            id: 'log-3',
            timeText: '2026-04-19 12:10',
            model: 'gemini-2.5-pro',
            tokenText: '4,890',
            quotaText: '690 quota',
            latencyText: '410ms',
          },
        ],
      },
      models: {
        status: 'ready',
        contract: {
          summary: 'Render the models visible to the current user, optionally enriched with group and pricing notes.',
          dataNeeds: [
            'List of visible model ids or names.',
            'Optional group, context size, and pricing annotations from BFF.',
            'Feature flags for hidden or coming soon models.',
          ],
          actions: [
            'Refresh model visibility.',
            'Open docs or quota guidance for a model.',
          ],
          states: {
            loading: 'Show model cards as skeletons.',
            empty: 'Explain that the user has no models in their assigned group.',
            error: 'Show a read-only error card and preserve page navigation.',
          },
          mockSource: 'hooks/use-control-panel-data.ts:createMockControlPanelData().pages.models',
        },
        models: [
          {
            id: 'model-1',
            name: 'gpt-4.1-mini',
            description: 'Balanced latency and reasoning profile for general API workloads.',
            contextWindow: '128k tokens',
            groupLabel: 'default',
            pricingNote: '—',
            status: 'available',
            statusLabel: 'Available',
          },
          {
            id: 'model-2',
            name: 'claude-3.7-sonnet',
            description: 'Reserved for higher-context analysis tasks and internal tools.',
            contextWindow: '200k tokens',
            groupLabel: 'premium',
            pricingNote: '—',
            status: 'coming_soon',
            statusLabel: 'Soon',
          },
        ],
      },
      settings: {
        status: 'ready',
        contract: {
          summary: 'Split profile fields and preferences so BFF can map `/api/user/self` and `/api/user/setting` separately.',
          dataNeeds: [
            'Current profile: username, display name, email, group.',
            'Current preference payload or toggles supported by the instance.',
            'Feature flags for 2FA, email verification, and password change availability.',
          ],
          actions: [
            'Update profile.',
            'Update preferences.',
            'Rotate password or trigger 2FA flow.',
          ],
          states: {
            loading: 'Show a static profile shell with placeholder values.',
            empty: 'Rare; only show if the instance has no editable settings for the user.',
            error: 'Keep read-only values if possible and surface a save/fetch error clearly.',
          },
          mockSource: 'hooks/use-control-panel-data.ts:createMockControlPanelData().pages.settings',
        },
        settings: {
          username: 'unitserow-1029',
          displayName: 'Unit Serow',
          email: 'unit@example.com',
          groupLabel: 'default group',
        },
      },
      docs: {
        status: 'ready',
        contract: {
          summary: 'Support either internal content blocks or external documentation links.',
          dataNeeds: [
            'Notice/about/home content blocks or a curated docs link list.',
            'Optional publish date and visibility flags.',
          ],
          actions: [
            'Open doc target.',
            'Refresh public content blocks.',
          ],
          states: {
            loading: 'Show content cards as placeholders.',
            empty: 'Explain that the instance has not published platform notices yet.',
            error: 'Render a docs-specific error while leaving other pages unaffected.',
          },
          mockSource: 'hooks/use-control-panel-data.ts:createMockControlPanelData().pages.docs',
        },
        docs: [
          {
            id: 'doc-1',
            title: 'Platform onboarding',
            description: 'Explain how this console maps to the future BFF and where key actions will land.',
            sourceLabel: 'Static placeholder',
          },
          {
            id: 'doc-2',
            title: 'Usage policy notice',
            description: 'Reserved for notice/about/home content returned from the server.',
            sourceLabel: 'Future /api/notice',
          },
        ],
      },
      plans: {
        status: 'ready',
        contract: {
          summary: 'Read-only billing surface, ready for subscription and usage endpoints but not payment plumbing.',
          dataNeeds: [
            'Subscription summary or plan name.',
            'Remaining quota or balance.',
            'Recent billing usage summary.',
          ],
          actions: [
            'Refresh billing summary.',
            'Future top-up or pay action once the product decision is stable.',
          ],
          states: {
            loading: 'Show summary cards as skeletons.',
            empty: 'Use a neutral no-plan state for free-tier users.',
            error: 'Show billing-specific failure copy without breaking the rest of the dashboard.',
          },
          mockSource: 'hooks/use-control-panel-data.ts:createMockControlPanelData().pages.plans',
        },
        plan: {
          name: 'Developer Trial',
          description: 'Read-only plan surface until recharge and online payment paths are confirmed.',
          remainingQuota: '128,400 quota',
        },
      },
    },
  };
}

function markContractLive(contract: PageContract): PageContract {
  return {
    ...contract,
    mockSource: undefined,
  };
}

function mapViewer(user: CurrentUserDto) {
  return {
    username: user.displayName || user.username,
    groupLabel: user.group,
  };
}

function mapSettings(user: CurrentUserDto): SettingsSnapshot {
  return {
    username: user.username,
    displayName: user.displayName,
    email: user.email ?? '-',
    groupLabel: user.group,
  };
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('en-US').format(value ?? 0);
}

function statusToneFromTokenStatus(status: string): StatusTone {
  if (status === 'active') {
    return 'success';
  }
  if (status === 'disabled') {
    return 'warning';
  }
  return 'neutral';
}

function mapDashboardPage(overview: DashboardOverviewDto): ControlPanelPageState['dashboard'] {
  const remainingQuota = overview.usage.remainingQuota ?? overview.user.remainingQuota;
  const currentUsage = overview.usage.currentUsage ?? overview.stat.quota;

  return {
    stats: [
      { title: 'Remaining Quota', value: formatNumber(remainingQuota), trend: overview.subscription.plan ?? 'Account', meta: 'quota points' },
      { title: 'Current Usage', value: formatNumber(currentUsage), trend: overview.subscription.status ?? 'usage window', meta: 'quota points' },
      { title: 'RPM', value: formatNumber(overview.stat.rpm), trend: 'Realtime', meta: 'requests / min' },
      { title: 'Request Count', value: formatNumber(overview.user.requestCount), trend: 'Lifetime', meta: 'all requests' },
    ],
    chart: overview.trend.map((item) => ({
      label: item.label,
      value: item.quota || item.tokenUsed || item.requestCount,
    })),
  };
}

function mapKeysPage(tokens: PaginatedTokensDto): ApiKeySummary[] {
  return tokens.items.map((item) => ({
    id: item.id,
    name: item.name,
    maskedKey: item.maskedKey,
    remainingQuotaText: item.unlimitedQuota ? 'Unlimited quota' : `${formatNumber(item.remainingQuota)} quota`,
    statusLabel: item.statusText,
    statusTone: statusToneFromTokenStatus(item.status),
    createdAtText: item.createdAtText,
  }));
}

function mapLogsPage(logs: PaginatedUsageLogsDto): UsageLogRecord[] {
  return logs.items.map((item) => ({
    id: item.id,
    timeText: item.createdAtText,
    model: item.modelName ?? '-',
    tokenText: formatNumber(item.totalTokens),
    quotaText: item.quota === null ? '-' : `${formatNumber(item.quota)} quota`,
    latencyText: item.latencyMs === null ? '-' : `${formatNumber(item.latencyMs)}ms`,
  }));
}

type EnrichedModelDto = ModelDto & {
  description?: string | null;
  context_window?: number | string | null;
  owned_by?: string | null;
  pricing?: string | number | null;
  deprecated?: boolean | null;
  enabled?: boolean | null;
  status?: string | null;
};

function formatContextWindow(value: EnrichedModelDto['context_window']): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return typeof value === 'string' ? value : '—';
  }

  if (numericValue >= 1_000_000) {
    return `${Number((numericValue / 1_000_000).toFixed(Number.isInteger(numericValue / 1_000_000) ? 0 : 1))}M tokens`;
  }

  if (numericValue >= 1_000) {
    return `${Number((numericValue / 1_000).toFixed(Number.isInteger(numericValue / 1_000) ? 0 : 1))}k tokens`;
  }

  return `${numericValue} tokens`;
}

function inferModelGroupLabel(item: EnrichedModelDto): string {
  if (item.owned_by?.trim()) {
    return item.owned_by.trim();
  }

  const modelKey = (item.id || item.name).toLowerCase();

  if (modelKey.startsWith('gpt-') || modelKey.startsWith('o1') || modelKey.startsWith('o3') || modelKey.startsWith('o4')) {
    return 'OpenAI';
  }

  if (modelKey.startsWith('claude-')) {
    return 'Anthropic';
  }

  if (modelKey.startsWith('gemini-')) {
    return 'Google';
  }

  if (modelKey.startsWith('qwen-')) {
    return 'Alibaba Cloud';
  }

  if (modelKey.startsWith('deepseek-')) {
    return 'DeepSeek';
  }

  if (modelKey.startsWith('llama-')) {
    return 'Meta';
  }

  return '—';
}

function mapModelStatus(item: EnrichedModelDto): Pick<ModelSummary, 'status' | 'statusLabel'> {
  if (item.deprecated) {
    return { status: 'deprecated', statusLabel: 'Deprecated' };
  }

  if (item.enabled === false) {
    return { status: 'coming_soon', statusLabel: 'Unavailable' };
  }

  if (item.status?.toLowerCase() === 'deprecated') {
    return { status: 'deprecated', statusLabel: 'Deprecated' };
  }

  if (item.status?.toLowerCase() === 'disabled') {
    return { status: 'coming_soon', statusLabel: 'Unavailable' };
  }

  return { status: 'available', statusLabel: 'Available' };
}

function mapModelsPage(models: ModelDto[]): ModelSummary[] {
  return models.map((rawItem) => {
    const item = rawItem as EnrichedModelDto;
    const status = mapModelStatus(item);

    return {
      id: item.id,
      name: item.name,
      description: item.description?.trim() || 'Available via your access group',
      contextWindow: formatContextWindow(item.context_window),
      groupLabel: inferModelGroupLabel(item),
      pricingNote: item.pricing === null || item.pricing === undefined || item.pricing === '' ? '—' : String(item.pricing),
      status: status.status,
      statusLabel: status.statusLabel,
    };
  });
}

function mapDocsPage(notice: PublicContentDto, about: PublicContentDto, home: PublicContentDto): DocsSummary[] {
  return [
    { id: 'notice', title: notice.title ?? 'Notice', description: notice.content ?? 'No notice content.', sourceLabel: 'GET /api/bff/content/notice' },
    { id: 'about', title: about.title ?? 'About', description: about.content ?? 'No about content.', sourceLabel: 'GET /api/bff/content/about' },
    { id: 'home', title: home.title ?? 'Home', description: home.content ?? 'No home content.', sourceLabel: 'GET /api/bff/content/home' },
  ];
}

function mapPlanPage(overview: DashboardOverviewDto): PlanSnapshot {
  return {
    name: overview.subscription.plan ?? 'Current plan unavailable',
    description: overview.subscription.status ?? 'Billing status unavailable',
    remainingQuota: `${formatNumber(overview.usage.remainingQuota ?? overview.user.remainingQuota)} quota`,
  };
}

async function loadPageFromBff(activeTab: ControlPanelPageKey): Promise<{
  viewer?: ControlPanelPageData['viewer'];
  page: Partial<ControlPanelPageState>;
  settingsPage?: Partial<ControlPanelPageState>;
}> {
  switch (activeTab) {
    case 'dashboard': {
      const overview = await bffClient.dashboard.overview();
      return {
        viewer: mapViewer(overview.user),
        page: { dashboard: mapDashboardPage(overview) },
        settingsPage: { settings: mapSettings(overview.user) },
      };
    }
    case 'keys': {
      const tokens = await bffClient.tokens.list();
      return { page: { keys: mapKeysPage(tokens) } };
    }
    case 'logs': {
      const logs = await bffClient.logs.list();
      return { page: { logs: mapLogsPage(logs) } };
    }
    case 'models': {
      const models = await bffClient.user.models();
      return { page: { models: mapModelsPage(models) } };
    }
    case 'settings': {
      const user = await bffClient.user.me();
      return {
        viewer: mapViewer(user),
        page: { settings: mapSettings(user) },
      };
    }
    case 'docs': {
      const [notice, about, home] = await Promise.all([
        bffClient.content.notice(),
        bffClient.content.about(),
        bffClient.content.home(),
      ]);
      return { page: { docs: mapDocsPage(notice, about, home) } };
    }
    case 'plans': {
      const overview = await bffClient.dashboard.overview();
      return { page: { plan: mapPlanPage(overview) } };
    }
    default:
      return { page: {} };
  }
}

export type AuthFormState = {
  values: Record<string, string>;
  pending: boolean;
  error: string | null;
};

export function useMockAuthForm(initialValues: Record<string, string>) {
  const [state, setState] = useState<AuthFormState>({
    values: initialValues,
    pending: false,
    error: null,
  });

  return {
    ...state,
    setField: (name: string, value: string) =>
      setState((current) => ({
        ...current,
        values: {
          ...current.values,
          [name]: value,
        },
      })),
    submit: () => {
      const username = state.values.username?.trim();
      const password = state.values.password?.trim();
      if (!username || !password) {
        setState((current) => ({ ...current, error: 'Username and password are required for the future newapi auth flow.' }));
        return;
      }
      setState((current) => ({ ...current, pending: true, error: null }));
      window.setTimeout(() => {
        setState((current) => ({
          ...current,
          pending: false,
          error: 'Mock submit only. Replace this handler with a BFF action when auth wiring starts.',
        }));
      }, 500);
    },
  };
}
