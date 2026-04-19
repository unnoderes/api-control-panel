import { mapModels } from "@/lib/api/mappers";
import { requestNewApiWithSession } from "@/lib/api/newapi-server";
import { ok, withErrorHandling } from "@/lib/api/route";
import { requireSession } from "@/lib/auth/session";

export async function GET() {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const data = await requestNewApiWithSession<unknown>({
      path: "/api/user/models",
      accessToken: session.accessToken,
      userId: session.userId,
    });

    return ok(mapModels(data));
  });
}
