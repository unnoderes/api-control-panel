export class BffError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, options?: { status?: number; code?: string; details?: unknown }) {
    super(message);
    this.name = "BffError";
    this.status = options?.status ?? 500;
    this.code = options?.code ?? "BFF_ERROR";
    this.details = options?.details;
  }
}

export class UpstreamApiError extends BffError {
  readonly upstreamStatus: number;

  constructor(message: string, options?: { status?: number; code?: string; details?: unknown; upstreamStatus?: number }) {
    super(message, options);
    this.name = "UpstreamApiError";
    this.upstreamStatus = options?.upstreamStatus ?? options?.status ?? 502;
  }
}

export function normalizeError(error: unknown) {
  if (error instanceof BffError) {
    return error;
  }

  if (error instanceof Error) {
    return new BffError(error.message, { status: 500, code: "INTERNAL_ERROR" });
  }

  return new BffError("Unexpected error", { status: 500, code: "INTERNAL_ERROR", details: error });
}
