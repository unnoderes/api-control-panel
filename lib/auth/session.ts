import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getNewApiConfig } from "@/lib/api/config";
import { BffError } from "@/lib/api/errors";

type SessionPayload = {
  accessToken: string;
  userId: string | null;
  username: string | null;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function serializeSession(payload: SessionPayload, secret: string) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

function parseSessionValue(value: string, secret: string): SessionPayload | null {
  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload, secret);
  const valid =
    Buffer.byteLength(signature) === Buffer.byteLength(expectedSignature) &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!valid) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    if (!parsed.accessToken) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function getCookieOptions() {
  const config = getNewApiConfig();
  return {
    name: config.cookieName,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: config.secureCookies,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  };
}

export async function getSession() {
  const config = getNewApiConfig();
  const store = await cookies();
  const value = store.get(config.cookieName)?.value;

  if (!value) {
    return null;
  }

  return parseSessionValue(value, config.cookieSecret);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new BffError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
  }
  return session;
}

export function writeSessionCookie(
  response: NextResponse,
  payload: { accessToken: string; userId?: string | null; username?: string | null },
) {
  const config = getNewApiConfig();
  const { name, options } = getCookieOptions();
  response.cookies.set(name, serializeSession(
    {
      accessToken: payload.accessToken,
      userId: payload.userId ?? null,
      username: payload.username ?? null,
    },
    config.cookieSecret,
  ), options);
}

export function clearSessionCookie(response: NextResponse) {
  const { name, options } = getCookieOptions();
  response.cookies.set(name, "", { ...options, maxAge: 0 });
}
