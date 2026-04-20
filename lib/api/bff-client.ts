import type {
  CurrentUserDto,
  DashboardOverviewDto,
  ModelDto,
  PaginatedTokensDto,
  PaginatedUsageLogsDto,
  PublicContentDto,
  SessionDto,
  TokenDto,
  TopupHistoryDto,
  TopupInfoDto,
  TopupOrderDto,
  UsageStatDto,
} from "@/types/bff";

type BffResponse<T> =
  | { ok: true; data: T; meta?: Record<string, unknown> }
  | { ok: false; error: { code: string; message: string; status: number; details?: unknown } };

async function bffFetch<T>(input: string, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json()) as BffResponse<T>;
  if (!payload.ok) {
    throw Object.assign(new Error(payload.error.message), payload.error);
  }
  return payload.data;
}

export const bffClient = {
  auth: {
    login: (body: Record<string, unknown>) => bffFetch<SessionDto>("/api/bff/auth/login", { method: "POST", body: JSON.stringify(body) }),
    register: (body: Record<string, unknown>) => bffFetch<SessionDto | { registered: true }>("/api/bff/auth/register", { method: "POST", body: JSON.stringify(body) }),
    logout: () => bffFetch<{ loggedOut: true }>("/api/bff/auth/logout", { method: "POST" }),
    session: () => bffFetch<SessionDto>("/api/bff/auth/session"),
  },
  user: {
    me: () => bffFetch<CurrentUserDto>("/api/bff/user/me"),
    models: () => bffFetch<ModelDto[]>("/api/bff/user/models"),
    updateMe: (body: Record<string, unknown>) => bffFetch<CurrentUserDto>("/api/bff/user/me", { method: "PUT", body: JSON.stringify(body) }),
    settings: (body: Record<string, unknown>) => bffFetch<Record<string, unknown>>("/api/bff/user/settings", { method: "PUT", body: JSON.stringify(body) }),
  },
  dashboard: {
    overview: (query = "") => bffFetch<DashboardOverviewDto>(`/api/bff/dashboard/overview${query}`),
  },
  tokens: {
    list: (query = "") => bffFetch<PaginatedTokensDto>(`/api/bff/tokens${query}`),
    create: (body: Record<string, unknown>) => bffFetch<TokenDto>("/api/bff/tokens", { method: "POST", body: JSON.stringify(body) }),
    update: (body: Record<string, unknown>, query = "") => bffFetch<TokenDto>(`/api/bff/tokens${query}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteOne: (id: string) => bffFetch<{ deleted: true; id: string }>(`/api/bff/tokens/${id}`, { method: "DELETE" }),
    batchDelete: (ids: string[]) =>
      bffFetch<{ deleted: true }>("/api/bff/tokens/batch-delete", {
        method: "POST",
        body: JSON.stringify({ ids: ids.map(Number) }),
      }),
  },
  logs: {
    list: (query = "") => bffFetch<PaginatedUsageLogsDto>(`/api/bff/logs${query}`),
    stat: (query = "") => bffFetch<UsageStatDto>(`/api/bff/logs/stat${query}`),
  },
  content: {
    notice: () => bffFetch<PublicContentDto>("/api/bff/content/notice"),
    about: () => bffFetch<PublicContentDto>("/api/bff/content/about"),
    home: () => bffFetch<PublicContentDto>("/api/bff/content/home"),
  },
  plans: {
    topupInfo: () => bffFetch<TopupInfoDto>("/api/bff/plans/topup-info"),
    createTopup: (amount: number) =>
      bffFetch<TopupOrderDto>("/api/bff/plans/topup", {
        method: "POST",
        body: JSON.stringify({ amount }),
      }),
    history: () => bffFetch<TopupHistoryDto>("/api/bff/plans/history"),
  },
};
