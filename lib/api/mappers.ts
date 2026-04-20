import type {
  CurrentUserDto,
  DashboardOverviewDto,
  DashboardTrendPointDto,
  ModelDto,
  PaginatedTokensDto,
  PaginatedUsageLogsDto,
  PublicContentDto,
  TokenDto,
  TopupHistoryDto,
  TopupInfoDto,
  TopupOrderDto,
  TopupRecordDto,
  UsageLogDto,
  UsageStatDto,
} from "@/types/bff";
import type {
  NewApiBillingSubscription,
  NewApiBillingUsage,
  NewApiLog,
  NewApiLogList,
  NewApiLogStat,
  NewApiPublicContent,
  NewApiSelfDataPoint,
  NewApiToken,
  NewApiTokenList,
  NewApiTopupInfo,
  NewApiTopupOrderResponse,
  NewApiTopupRecord,
  NewApiUser,
} from "@/types/newapi";

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function asNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return asNumber(value, 0);
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asStringId(value: unknown) {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
}

function formatTimestamp(timestamp: number | null) {
  if (!timestamp || timestamp <= 0) {
    return "-";
  }
  return new Date(timestamp * 1000).toISOString();
}

function maskToken(token: string | undefined) {
  if (!token) {
    return "-";
  }
  if (token.length <= 10) {
    return token;
  }
  return `${token.slice(0, 5)}...${token.slice(-4)}`;
}

function mapTokenStatus(status: unknown): Pick<TokenDto, "status" | "statusText"> {
  if (status === 1 || status === true || status === "1" || status === "enabled") {
    return { status: "active", statusText: "Active" };
  }
  if (status === 0 || status === false || status === "0" || status === "disabled") {
    return { status: "disabled", statusText: "Disabled" };
  }
  return { status: "unknown", statusText: "Unknown" };
}

export function mapCurrentUser(raw: NewApiUser): CurrentUserDto {
  const quota = asNumber(raw.quota);
  const usedQuota = asNumber(raw.used_quota);

  return {
    id: asStringId(raw.id),
    username: asString(raw.username, "unknown"),
    displayName: asString(raw.display_name || raw.username, "unknown"),
    email: asNullableString(raw.email),
    group: asString(raw.group, "default"),
    quota,
    usedQuota,
    remainingQuota: Math.max(quota - usedQuota, 0),
    requestCount: asNumber(raw.request_count),
    permissions: typeof raw.permissions === "object" && raw.permissions ? raw.permissions : {},
  };
}

export function mapToken(raw: NewApiToken): TokenDto {
  const tokenStatus = mapTokenStatus(raw.status);
  const remainingQuota = raw.unlimited_quota ? null : asNullableNumber(raw.remain_quota);

  return {
    id: asStringId(raw.id),
    name: asString(raw.name, "Unnamed token"),
    maskedKey: maskToken(raw.key),
    rawKey: asNullableString(raw.key),
    status: tokenStatus.status,
    statusText: tokenStatus.statusText,
    remainingQuota,
    remainingQuotaText: raw.unlimited_quota ? "Unlimited" : String(remainingQuota ?? 0),
    unlimitedQuota: Boolean(raw.unlimited_quota),
    expiresAt: asNullableNumber(raw.expired_time),
    expiresAtText: formatTimestamp(asNullableNumber(raw.expired_time)),
    createdAt: asNullableNumber(raw.created_time),
    createdAtText: formatTimestamp(asNullableNumber(raw.created_time)),
    lastUsedAt: asNullableNumber(raw.accessed_time),
    lastUsedAtText: formatTimestamp(asNullableNumber(raw.accessed_time)),
    group: asNullableString(raw.group),
    modelLimits: Array.isArray(raw.model_limits) ? raw.model_limits.filter((item): item is string => typeof item === "string") : [],
  };
}

export function mapTokenList(raw: NewApiTokenList | NewApiToken[]): PaginatedTokensDto {
  const list = Array.isArray(raw) ? raw : raw.items ?? [];
  const page = Array.isArray(raw) ? 1 : asNumber(raw.page, 1);
  const pageSize = Array.isArray(raw) ? list.length : asNumber(raw.page_size, list.length || 20);
  const total = Array.isArray(raw) ? list.length : asNumber(raw.total, list.length);

  return {
    items: list.map(mapToken),
    total,
    page,
    pageSize,
  };
}

export function mapUsageLog(raw: NewApiLog): UsageLogDto {
  return {
    id: asStringId(raw.id),
    createdAt: asNullableNumber(raw.created_at),
    createdAtText: formatTimestamp(asNullableNumber(raw.created_at)),
    type: asString(raw.type, "unknown"),
    content: asString(raw.content),
    modelName: asNullableString(raw.model_name),
    tokenName: asNullableString(raw.token_name),
    quota: asNullableNumber(raw.quota),
    promptTokens: asNullableNumber(raw.prompt_tokens),
    completionTokens: asNullableNumber(raw.completion_tokens),
    totalTokens: asNullableNumber(raw.total_tokens),
    latencyMs: asNullableNumber(raw.use_time),
    group: asNullableString(raw.group),
  };
}

export function mapUsageLogList(raw: NewApiLogList | NewApiLog[]): PaginatedUsageLogsDto {
  const list = Array.isArray(raw) ? raw : raw.items ?? [];
  const page = Array.isArray(raw) ? 1 : asNumber(raw.page, 1);
  const pageSize = Array.isArray(raw) ? list.length : asNumber(raw.page_size, list.length || 20);
  const total = Array.isArray(raw) ? list.length : asNumber(raw.total, list.length);

  return {
    items: list.map(mapUsageLog),
    total,
    page,
    pageSize,
  };
}

export function mapUsageStat(raw: NewApiLogStat | null | undefined): UsageStatDto {
  return {
    quota: asNumber(raw?.quota),
    rpm: asNumber(raw?.rpm),
    tpm: asNumber(raw?.tpm),
  };
}

export function mapTrend(raw: NewApiSelfDataPoint[] | null | undefined): DashboardTrendPointDto[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => ({
    label: asString(item.date || item.day, "unknown"),
    quota: asNumber(item.quota),
    tokenUsed: asNumber(item.token_used),
    requestCount: asNumber(item.request_count || item.count),
  }));
}

export function mapDashboardOverview(input: {
  user: NewApiUser;
  subscription?: NewApiBillingSubscription | null;
  usage?: NewApiBillingUsage | null;
  stat?: NewApiLogStat | null;
  trend?: NewApiSelfDataPoint[] | null;
}): DashboardOverviewDto {
  return {
    user: mapCurrentUser(input.user),
    subscription: {
      plan: asNullableString(input.subscription?.plan),
      status: asNullableString(input.subscription?.status),
      currentPeriodStart: asNullableNumber(input.subscription?.current_period_start),
      currentPeriodEnd: asNullableNumber(input.subscription?.current_period_end),
      cancelAtPeriodEnd: Boolean(input.subscription?.cancel_at_period_end),
    },
    usage: {
      totalUsage: asNullableNumber(input.usage?.total_usage),
      currentUsage: asNullableNumber(input.usage?.current_usage),
      quota: asNullableNumber(input.usage?.quota),
      usedQuota: asNullableNumber(input.usage?.used_quota),
      remainingQuota: asNullableNumber(
        input.usage?.remaining_quota ?? (asNumber(input.usage?.quota) - asNumber(input.usage?.used_quota)),
      ),
    },
    stat: mapUsageStat(input.stat),
    trend: mapTrend(input.trend),
  };
}

export function mapModels(raw: unknown): ModelDto[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      if (typeof item === "string") {
        return { id: item, name: item };
      }
      if (item && typeof item === "object") {
        const id = asStringId((item as Record<string, unknown>).id ?? (item as Record<string, unknown>).name);
        const name = asString((item as Record<string, unknown>).name ?? id, id);
        return { id, name };
      }
      return null;
    })
    .filter((item): item is ModelDto => Boolean(item && item.id));
}

export function mapPublicContent(raw: NewApiPublicContent | string | null | undefined): PublicContentDto {
  if (typeof raw === "string") {
    return {
      title: null,
      content: raw,
      updatedAt: null,
    };
  }

  return {
    title: asNullableString(raw?.title),
    content: asNullableString(raw?.content),
    updatedAt: asNullableNumber(raw?.updated_at),
  };
}

export function mapTopupInfo(raw: NewApiTopupInfo): TopupInfoDto {
  const providers: TopupInfoDto["availableProviders"] = [];
  if (raw.enable_epay_topup) providers.push("epay");
  if (raw.enable_stripe_topup) providers.push("stripe");
  if (raw.enable_waffo_topup) providers.push("waffo");

  return {
    minAmount: asNumber(raw.min_topup, 1),
    amountOptions: Array.isArray(raw.amount_options) ? raw.amount_options.map((v) => asNumber(v)) : [],
    availableProviders: providers,
  };
}

export function mapTopupOrder(raw: NewApiTopupOrderResponse): TopupOrderDto {
  return {
    paymentUrl: asString(raw.payment_url ?? raw.url),
    orderId: asNullableString(raw.order_id),
  };
}

function mapTopupRecordStatus(status: unknown): Pick<TopupRecordDto, "status" | "statusText"> {
  const s = typeof status === "string" ? status : "";
  if (s === "success") return { status: "success", statusText: "Success" };
  if (s === "pending") return { status: "pending", statusText: "Pending" };
  if (s === "failed") return { status: "failed", statusText: "Failed" };
  if (s === "expired") return { status: "expired", statusText: "Expired" };
  return { status: "unknown", statusText: "Unknown" };
}

export function mapTopupHistory(raw: NewApiTopupRecord[]): TopupHistoryDto {
  return {
    items: raw.map((item) => {
      const statusResult = mapTopupRecordStatus(item.status);
      return {
        id: asStringId(item.id),
        amount: asNumber(item.amount),
        money: asNumber(item.money),
        tradeNo: asString(item.trade_no),
        paymentMethod: asString(item.payment_method, "—"),
        status: statusResult.status,
        statusText: statusResult.statusText,
        createdAtText: formatTimestamp(asNullableNumber(item.create_time)),
        completedAtText: item.complete_time ? formatTimestamp(asNullableNumber(item.complete_time)) : null,
      };
    }),
  };
}
