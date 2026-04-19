import { requestNewApiWithSession } from "@/lib/api/newapi-server";
import { ok, withErrorHandling } from "@/lib/api/route";
import { requireSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const body = await request.json();
    await requestNewApiWithSession<void>({
      method: "POST",
      path: "/api/token/batch",
      body,
      accessToken: session.accessToken,
      userId: session.userId,
    });

    return ok({ deleted: true });
  });
}
