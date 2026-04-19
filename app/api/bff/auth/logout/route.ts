import { NextResponse } from "next/server";
import { ok, withErrorHandling } from "@/lib/api/route";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  return withErrorHandling(async () => {
    const response = ok({ loggedOut: true });
    clearSessionCookie(response as NextResponse);
    return response;
  });
}
