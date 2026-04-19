import "server-only";

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_COOKIE_NAME = "newapi_cp_session";

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getNewApiConfig() {
  return {
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? "New API Control Panel",
    baseUrl: getRequiredEnv("NEWAPI_BASE_URL").replace(/\/+$/, ""),
    timeoutMs: Number(process.env.NEWAPI_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS),
    cookieName: process.env.SESSION_COOKIE_NAME ?? DEFAULT_COOKIE_NAME,
    cookieSecret: getRequiredEnv("SESSION_COOKIE_SECRET"),
    includeUserHeader: process.env.NEWAPI_INCLUDE_USER_HEADER === "true",
    secureCookies: process.env.NODE_ENV === "production",
  };
}
