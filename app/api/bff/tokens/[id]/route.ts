import { mapToken } from "@/lib/api/mappers";
import { requestNewApiWithSession } from "@/lib/api/newapi-server";
import { ok, withErrorHandling } from "@/lib/api/route";
import { requireSession } from "@/lib/auth/session";
import type { NewApiToken } from "@/types/newapi";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const { id } = await context.params;
    const data = await requestNewApiWithSession<NewApiToken>({
      path: `/api/token/${id}`,
      accessToken: session.accessToken,
      userId: session.userId,
    });

    return ok(mapToken(data));
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const { id } = await context.params;
    await requestNewApiWithSession<void>({
      method: "DELETE",
      path: `/api/token/${id}`,
      accessToken: session.accessToken,
      userId: session.userId,
    });

    return ok({ deleted: true, id });
  });
}
