export type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    status: number;
    details?: unknown;
  };
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export type SessionDto = {
  isAuthenticated: boolean;
  userId: string | null;
  username: string | null;
};

export type CurrentUserDto = {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  group: string;
  quota: number;
  usedQuota: number;
  remainingQuota: number;
  requestCount: number;
  permissions: Record<string, boolean>;
};

export type TokenDto = {
  id: string;
  name: string;
  maskedKey: string;
  rawKey: string | null;
  status: "active" | "disabled" | "unknown";
  statusText: string;
  remainingQuota: number | null;
  remainingQuotaText: string;
  unlimitedQuota: boolean;
  expiresAt: number | null;
  expiresAtText: string;
  createdAt: number | null;
  createdAtText: string;
  lastUsedAt: number | null;
  lastUsedAtText: string;
  group: string | null;
  modelLimits: string[];
};

export type PaginatedTokensDto = {
  items: TokenDto[];
  total: number;
  page: number;
  pageSize: number;
};

export type UsageLogDto = {
  id: string;
  createdAt: number | null;
  createdAtText: string;
  type: string;
  content: string;
  modelName: string | null;
  tokenName: string | null;
  quota: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  latencyMs: number | null;
  group: string | null;
};

export type PaginatedUsageLogsDto = {
  items: UsageLogDto[];
  total: number;
  page: number;
  pageSize: number;
};

export type UsageStatDto = {
  quota: number;
  rpm: number;
  tpm: number;
};

export type DashboardTrendPointDto = {
  label: string;
  quota: number;
  tokenUsed: number;
  requestCount: number;
};

export type DashboardOverviewDto = {
  user: CurrentUserDto;
  subscription: {
    plan: string | null;
    status: string | null;
    currentPeriodStart: number | null;
    currentPeriodEnd: number | null;
    cancelAtPeriodEnd: boolean;
  };
  usage: {
    totalUsage: number | null;
    currentUsage: number | null;
    quota: number | null;
    usedQuota: number | null;
    remainingQuota: number | null;
  };
  stat: UsageStatDto;
  trend: DashboardTrendPointDto[];
};

export type ModelDto = {
  id: string;
  name: string;
};

export type PublicContentDto = {
  title: string | null;
  content: string | null;
  updatedAt: number | null;
};

export type PlatformStatusDto = {
  systemName: string | null;
  announcements: string[];
  version: string | null;
  startTime: number | null;
};

export type TopupInfoDto = {
  minAmount: number;
  amountOptions: number[];
  availableProviders: Array<'epay' | 'stripe' | 'waffo'>;
};

export type TopupOrderDto = {
  paymentUrl: string;
  orderId: string | null;
};

export type TopupRecordDto = {
  id: string;
  amount: number;
  money: number;
  tradeNo: string;
  paymentMethod: string;
  status: 'pending' | 'success' | 'failed' | 'expired' | 'unknown';
  statusText: string;
  createdAtText: string;
  completedAtText: string | null;
};

export type TopupHistoryDto = {
  items: TopupRecordDto[];
};
