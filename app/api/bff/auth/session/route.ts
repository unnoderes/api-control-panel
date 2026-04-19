import { ok, withErrorHandling } from "@/lib/api/route";
import { getSession } from "@/lib/auth/session";
import type { SessionDto } from "@/types/bff";

export async function GET() {
  return withErrorHandling(async () => {
    const session = await getSession();
    return ok<SessionDto>({
      isAuthenticated: Boolean(session),
      userId: session?.userId ?? null,
      username: session?.username ?? null,
    });
  });
}
