import { mapDashboardOverview } from "@/lib/api/mappers";
import { requestNewApiWithSession } from "@/lib/api/newapi-server";
import { ok, withErrorHandling } from "@/lib/api/route";
import { requireSession } from "@/lib/auth/session";
import type {
  NewApiBillingSubscription,
  NewApiBillingUsage,
  NewApiLogStat,
  NewApiSelfDataPoint,
  NewApiUser,
} from "@/types/newapi";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const query = new URL(request.url).searchParams;

    const [user, subscription, usage, stat, trend] = await Promise.all([
      requestNewApiWithSession<NewApiUser>({
        path: "/api/user/self",
        accessToken: session.accessToken,
        userId: session.userId,
      }),
      requestNewApiWithSession<NewApiBillingSubscription>({
        path: "/dashboard/billing/subscription",
        accessToken: session.accessToken,
        userId: session.userId,
      }).catch(() => null),
      requestNewApiWithSession<NewApiBillingUsage>({
        path: "/dashboard/billing/usage",
        accessToken: session.accessToken,
        userId: session.userId,
      }).catch(() => null),
      requestNewApiWithSession<NewApiLogStat>({
        path: "/api/log/self/stat",
        query,
        accessToken: session.accessToken,
        userId: session.userId,
      }).catch(() => null),
      requestNewApiWithSession<NewApiSelfDataPoint[]>({
        path: "/api/data/self",
        query,
        accessToken: session.accessToken,
        userId: session.userId,
      }).catch(() => null),
    ]);

    return ok(
      mapDashboardOverview({
        user,
        subscription,
        usage,
        stat,
        trend,
      }),
    );
  });
}
