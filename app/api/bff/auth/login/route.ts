import { NextRequest, NextResponse } from "next/server";
import { requestNewApi } from "@/lib/api/newapi-server";
import { ok, withErrorHandling } from "@/lib/api/route";
import { writeSessionCookie } from "@/lib/auth/session";
import type { SessionDto } from "@/types/bff";
import type { NewApiLoginResponse } from "@/types/newapi";

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const data = await requestNewApi<NewApiLoginResponse>({
      method: "POST",
      path: "/api/user/login",
      body,
    });

    const token = data.token || (typeof data.user?.access_token === "string" ? data.user.access_token : null);
    if (!token) {
      throw new Error("newapi login response does not include a token");
    }

    const response = ok<SessionDto>({
      isAuthenticated: true,
      userId: data.user?.id ? String(data.user.id) : null,
      username: data.user?.username ?? null,
    });

    writeSessionCookie(response as NextResponse, {
      accessToken: token,
      userId: data.user?.id ? String(data.user.id) : null,
      username: data.user?.username ?? null,
    });

    return response;
  });
}
