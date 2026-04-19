import { requestNewApiWithSession } from "@/lib/api/newapi-server";
import { ok, withErrorHandling } from "@/lib/api/route";
import { requireSession } from "@/lib/auth/session";

export async function PUT(request: Request) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const body = await request.json();
    const data = await requestNewApiWithSession<Record<string, unknown>>({
      method: "PUT",
      path: "/api/user/setting",
      body,
      accessToken: session.accessToken,
      userId: session.userId,
    });

    return ok(data);
  });
}
