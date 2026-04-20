import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { getNewApiConfig } from '@/lib/api/config';
import { BffError, UpstreamApiError } from '@/lib/api/errors';
import { ok, withErrorHandling } from '@/lib/api/route';
import { writeSessionCookie } from '@/lib/auth/session';
import type { SessionDto } from '@/types/bff';
import type { NewApiEnvelope, NewApiRegisterResponse } from '@/types/newapi';

function extractSessionCookie(response: Response) {
  const responseHeaders = response.headers as Headers & { getSetCookie?: () => string[] };
  const setCookieHeaders = typeof responseHeaders.getSetCookie === 'function'
    ? responseHeaders.getSetCookie()
    : (() => {
        const singleHeader = response.headers.get('set-cookie');
        return singleHeader ? [singleHeader] : [];
      })();

  for (const header of setCookieHeaders) {
    const match = header.match(/(?:^|\s|,)session=([^;]+)/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const config = getNewApiConfig();
    const requestHeaders = await headers();
    const upstreamHeaders = new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
    const requestId = requestHeaders.get('x-request-id');

    if (requestId) {
      upstreamHeaders.set('x-request-id', requestId);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const upstreamResponse = await fetch(`${config.baseUrl}/api/user/register`, {
        method: 'POST',
        headers: upstreamHeaders,
        body: JSON.stringify(body),
        signal: controller.signal,
        cache: 'no-store',
      });

      const contentType = upstreamResponse.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        throw new BffError('Unexpected upstream response content type', { status: 502, code: 'INVALID_UPSTREAM_RESPONSE' });
      }

      const payload = (await upstreamResponse.json()) as NewApiEnvelope<NewApiRegisterResponse> | NewApiRegisterResponse;

      if (!upstreamResponse.ok) {
        const message =
          payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
            ? payload.message
            : `Upstream request failed with status ${upstreamResponse.status}`;

        throw new UpstreamApiError(message, {
          status: upstreamResponse.status,
          code: upstreamResponse.status === 401 ? 'UPSTREAM_UNAUTHORIZED' : 'UPSTREAM_ERROR',
          details: payload,
          upstreamStatus: upstreamResponse.status,
        });
      }

      if (payload && typeof payload === 'object' && 'success' in payload && payload.success === false) {
        const message =
          'message' in payload && typeof payload.message === 'string'
            ? payload.message
            : 'Upstream business error';

        throw new BffError(message, {
          status: 400,
          code: 'UPSTREAM_BUSINESS_ERROR',
          details: payload,
        });
      }

      const data = payload && typeof payload === 'object' && 'success' in payload
        ? ((payload.data as NewApiRegisterResponse | undefined) ?? {})
        : (payload as NewApiRegisterResponse);

      const sessionToken = extractSessionCookie(upstreamResponse);
      if (!sessionToken) {
        return ok({ registered: true }, { status: 201 });
      }

      const response = ok<SessionDto>(
        {
          isAuthenticated: true,
          userId: data.user?.id ? String(data.user.id) : null,
          username: data.user?.username ?? null,
        },
        { status: 201 },
      );

      writeSessionCookie(response, {
        accessToken: sessionToken,
        userId: data.user?.id ? String(data.user.id) : null,
        username: data.user?.username ?? null,
      });

      return response;
    } catch (error) {
      if (error instanceof BffError || error instanceof UpstreamApiError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new BffError('Upstream request timed out', { status: 504, code: 'UPSTREAM_TIMEOUT' });
      }
      throw new BffError(error instanceof Error ? error.message : 'Failed to call upstream API', {
        status: 502,
        code: 'UPSTREAM_FETCH_FAILED',
        details: error,
      });
    } finally {
      clearTimeout(timeout);
    }
  });
}
