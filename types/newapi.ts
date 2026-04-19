export type NewApiEnvelope<T = unknown> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export type NewApiLoginResponse = {
  token?: string;
  user?: NewApiUser;
  [key: string]: unknown;
};

export type NewApiRegisterResponse = {
  token?: string;
  user?: NewApiUser;
  [key: string]: unknown;
};

export type NewApiUser = {
  id?: number | string;
  username?: string;
  display_name?: string;
  email?: string | null;
  group?: string;
  quota?: number;
  used_quota?: number;
  request_count?: number;
  permissions?: Record<string, boolean>;
  setting?: Record<string, unknown>;
  sidebar_modules?: string[];
  created_at?: number;
  updated_at?: number;
  access_token?: string;
  [key: string]: unknown;
};

export type NewApiToken = {
  id?: number | string;
  name?: string;
  key?: string;
  status?: number | string | boolean;
  remain_quota?: number;
  unlimited_quota?: boolean;
  expired_time?: number;
  created_time?: number;
  accessed_time?: number;
  group?: string;
  model_limits?: string[];
  allow_ips?: string;
  [key: string]: unknown;
};

export type NewApiTokenList = {
  items?: NewApiToken[];
  total?: number;
  page?: number;
  page_size?: number;
  [key: string]: unknown;
};

export type NewApiLog = {
  id?: number | string;
  user_id?: number | string;
  created_at?: number;
  type?: number | string;
  content?: string;
  username?: string;
  token_name?: string;
  model_name?: string;
  quota?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  use_time?: number;
  channel?: number | string;
  group?: string;
  [key: string]: unknown;
};

export type NewApiLogList = {
  items?: NewApiLog[];
  total?: number;
  page?: number;
  page_size?: number;
  [key: string]: unknown;
};

export type NewApiLogStat = {
  quota?: number;
  rpm?: number;
  tpm?: number;
  [key: string]: unknown;
};

export type NewApiSelfDataPoint = {
  date?: string;
  day?: string;
  quota?: number;
  token_used?: number;
  request_count?: number;
  count?: number;
  [key: string]: unknown;
};

export type NewApiBillingSubscription = {
  plan?: string;
  status?: string;
  current_period_start?: number;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  [key: string]: unknown;
};

export type NewApiBillingUsage = {
  total_usage?: number;
  current_usage?: number;
  quota?: number;
  used_quota?: number;
  remaining_quota?: number;
  [key: string]: unknown;
};

export type NewApiPublicContent = {
  title?: string;
  content?: string;
  updated_at?: number;
  [key: string]: unknown;
};
