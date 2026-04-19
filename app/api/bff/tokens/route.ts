import { mapToken, mapTokenList } from "@/lib/api/mappers";
import { requestNewApiWithSession } from "@/lib/api/newapi-server";
import { ok, withErrorHandling } from "@/lib/api/route";
import { requireSession } from "@/lib/auth/session";
import type { NewApiToken, NewApiTokenList } from "@/types/newapi";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const query = new URL(request.url).searchParams;
    const isSearch = query.has("keyword") || query.has("token");
    const data = await requestNewApiWithSession<NewApiTokenList | NewApiToken[]>({
      path: isSearch ? "/api/token/search" : "/api/token/",
      query,
      accessToken: session.accessToken,
      userId: session.userId,
    });

    return ok(mapTokenList(data));
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const body = await request.json();
    const data = await requestNewApiWithSession<NewApiToken>({
      method: "POST",
      path: "/api/token/",
      body,
      accessToken: session.accessToken,
      userId: session.userId,
    });

    return ok(mapToken(data), { status: 201 });
  });
}

export async function PUT(request: Request) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const url = new URL(request.url);
    const body = await request.json();
    const data = await requestNewApiWithSession<NewApiToken>({
      method: "PUT",
      path: "/api/token/",
      query: url.searchParams,
      body,
      accessToken: session.accessToken,
      userId: session.userId,
    });

    return ok(mapToken(data));
  });
}
