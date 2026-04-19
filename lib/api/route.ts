import { NextResponse } from "next/server";
import { normalizeError } from "@/lib/api/errors";
import type { ApiFailure, ApiSuccess } from "@/types/bff";

export function ok<T>(data: T, init?: { status?: number; meta?: Record<string, unknown> }) {
  return NextResponse.json<ApiSuccess<T>>(
    {
      ok: true,
      data,
      meta: init?.meta,
    },
    { status: init?.status ?? 200 },
  );
}

export function fail(error: unknown) {
  const normalized = normalizeError(error);
  return NextResponse.json<ApiFailure>(
    {
      ok: false,
      error: {
        code: normalized.code,
        message: normalized.message,
        status: normalized.status,
        details: normalized.details,
      },
    },
    { status: normalized.status },
  );
}

export async function withErrorHandling(fn: () => Promise<NextResponse>) {
  try {
    return await fn();
  } catch (error) {
    return fail(error);
  }
}
