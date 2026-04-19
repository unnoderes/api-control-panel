import { mapPublicContent } from "@/lib/api/mappers";
import { requestNewApi } from "@/lib/api/newapi-server";
import { ok, withErrorHandling } from "@/lib/api/route";
import type { NewApiPublicContent } from "@/types/newapi";

export async function GET() {
  return withErrorHandling(async () => {
    const data = await requestNewApi<NewApiPublicContent | string>({
      path: "/api/home_page_content",
    });

    return ok(mapPublicContent(data));
  });
}
