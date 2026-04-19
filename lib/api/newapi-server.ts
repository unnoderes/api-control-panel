import "server-only";

import { headers } from "next/headers";
import { getNewApiConfig } from "@/lib/api/config";
import { BffError, UpstreamApiError } from "@/lib/api/errors";
import type { NewApiEnvelope } from "@/types/newapi";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  query?: URLSearchParams | Record<string, string | number | boolean | null | undefined>;
  accessToken?: string;
  userId?: string | null;
  includeUserHeader?: boolean;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const config = getNewApiConfig();
  const url = new URL(path, `${config.baseUrl}/`);

  if (!query) {
    return url.toString();
  }

  const searchParams = query instanceof URLSearchParams ? query : new URLSearchParams();
  if (!(query instanceof URLSearchParams)) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        searchParams.set(key, String(value));
      }
    }
  }

  url.search = searchParams.toString();
  return url.toString();
}

async function createForwardHeaders(accessToken?: string, userId?: string | null, includeUserHeader?: boolean) {
  const requestHeaders = await headers();
  const nextHeaders = new Headers({
    Accept: "application/json",
  });
  const requestId = requestHeaders.get("x-request-id");

  if (requestId) {
    nextHeaders.set("x-request-id", requestId);
  }
  if (accessToken) {
    nextHeaders.set("Authorization", `Bearer ${accessToken}`);
  }
  if (includeUserHeader && userId) {
    nextHeaders.set("New-Api-User", userId);
  }

  return nextHeaders;
}

export async function requestNewApi<T>(options: RequestOptions): Promise<T> {
  const config = getNewApiConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const requestHeaders = await createForwardHeaders(
      options.accessToken,
      options.userId,
      options.includeUserHeader ?? config.includeUserHeader,
    );
    if (options.body !== undefined) {
      requestHeaders.set("Content-Type", "application/json");
    }

    const upstreamResponse = await fetch(buildUrl(options.path, options.query), {
      method: options.method ?? "GET",
      headers: requestHeaders,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
      cache: "no-store",
    });

    const contentType = upstreamResponse.headers.get("content-type") ?? "";
    const maybeJson = contentType.includes("application/json")
      ? ((await upstreamResponse.json()) as NewApiEnvelope<T> | T)
      : null;

    if (!upstreamResponse.ok) {
      const message =
        maybeJson && typeof maybeJson === "object" && "message" in maybeJson && typeof maybeJson.message === "string"
          ? maybeJson.message
          : `Upstream request failed with status ${upstreamResponse.status}`;

      throw new UpstreamApiError(message, {
        status: upstreamResponse.status,
        code: upstreamResponse.status === 401 ? "UPSTREAM_UNAUTHORIZED" : "UPSTREAM_ERROR",
        details: maybeJson,
        upstreamStatus: upstreamResponse.status,
      });
    }

    if (maybeJson && typeof maybeJson === "object" && "success" in maybeJson) {
      const envelope = maybeJson as NewApiEnvelope<T>;
      if (envelope.success === false) {
        throw new UpstreamApiError(envelope.message || "Upstream business error", {
          status: 400,
          code: "UPSTREAM_BUSINESS_ERROR",
          details: envelope,
        });
      }
      return (envelope.data as T) ?? ({} as T);
    }

    if (maybeJson !== null) {
      return maybeJson as T;
    }

    throw new BffError("Unexpected upstream response content type", { status: 502, code: "INVALID_UPSTREAM_RESPONSE" });
  } catch (error) {
    if (error instanceof UpstreamApiError || error instanceof BffError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new BffError("Upstream request timed out", { status: 504, code: "UPSTREAM_TIMEOUT" });
    }
    throw new BffError(error instanceof Error ? error.message : "Failed to call upstream API", {
      status: 502,
      code: "UPSTREAM_FETCH_FAILED",
      details: error,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestNewApiWithSession<T>(
  options: Omit<RequestOptions, "accessToken" | "userId"> & { accessToken: string; userId?: string | null },
) {
  return requestNewApi<T>(options);
}
