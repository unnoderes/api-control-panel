import { mapUsageStat } from "@/lib/api/mappers";
import { requestNewApiWithSession } from "@/lib/api/newapi-server";
import { ok, withErrorHandling } from "@/lib/api/route";
import { requireSession } from "@/lib/auth/session";
import type { NewApiLogStat } from "@/types/newapi";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const query = new URL(request.url).searchParams;
    const data = await requestNewApiWithSession<NewApiLogStat>({
      path: "/api/log/self/stat",
      query,
      accessToken: session.accessToken,
      userId: session.userId,
    });

    return ok(mapUsageStat(data));
  });
}
