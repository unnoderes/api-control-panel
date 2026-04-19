import { requestNewApiWithSession } from "@/lib/api/newapi-server";
import { ok, withErrorHandling } from "@/lib/api/route";
import { requireSession } from "@/lib/auth/session";

export async function GET() {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const data = await requestNewApiWithSession<string[]>({
      path: "/api/user/self/groups",
      accessToken: session.accessToken,
      userId: session.userId,
    });

    return ok(Array.isArray(data) ? data.filter((item): item is string => typeof item === "string") : []);
  });
}
