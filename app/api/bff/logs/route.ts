import { mapUsageLogList } from "@/lib/api/mappers";
import { requestNewApiWithSession } from "@/lib/api/newapi-server";
import { ok, withErrorHandling } from "@/lib/api/route";
import { requireSession } from "@/lib/auth/session";
import type { NewApiLog, NewApiLogList } from "@/types/newapi";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const query = new URL(request.url).searchParams;
    const isSearch = query.has("keyword");
    const data = await requestNewApiWithSession<NewApiLogList | NewApiLog[]>({
      path: isSearch ? "/api/log/self/search" : "/api/log/self",
      query,
      accessToken: session.accessToken,
      userId: session.userId,
    });

    return ok(mapUsageLogList(data));
  });
}
