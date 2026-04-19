import { mapCurrentUser } from "@/lib/api/mappers";
import { requestNewApiWithSession } from "@/lib/api/newapi-server";
import { ok, withErrorHandling } from "@/lib/api/route";
import { requireSession } from "@/lib/auth/session";
import type { NewApiUser } from "@/types/newapi";

export async function GET() {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const data = await requestNewApiWithSession<NewApiUser>({
      path: "/api/user/self",
      accessToken: session.accessToken,
      userId: session.userId,
    });

    return ok(mapCurrentUser(data));
  });
}

export async function PUT(request: Request) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const body = await request.json();
    const data = await requestNewApiWithSession<NewApiUser>({
      method: "PUT",
      path: "/api/user/self",
      body,
      accessToken: session.accessToken,
      userId: session.userId,
    });

    return ok(mapCurrentUser(data));
  });
}
