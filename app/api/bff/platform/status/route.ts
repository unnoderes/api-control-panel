import { mapPlatformStatus } from '@/lib/api/mappers';
import { requestNewApi } from '@/lib/api/newapi-server';
import { ok, withErrorHandling } from '@/lib/api/route';
import type { NewApiStatusResponse } from '@/types/newapi';

export async function GET() {
  return withErrorHandling(async () => {
    const data = await requestNewApi<NewApiStatusResponse>({
      path: '/api/status',
    });

    return ok(mapPlatformStatus(data));
  });
}
