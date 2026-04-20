import { mapTopupHistory } from '@/lib/api/mappers';
import { requestNewApiWithSession } from '@/lib/api/newapi-server';
import { ok, withErrorHandling } from '@/lib/api/route';
import { requireSession } from '@/lib/auth/session';
import type { NewApiTopupRecord } from '@/types/newapi';

export async function GET() {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const data = await requestNewApiWithSession<NewApiTopupRecord[]>({
      path: '/api/user/self/topup/self',
      accessToken: session.accessToken,
      userId: session.userId,
    });

    return ok(mapTopupHistory(Array.isArray(data) ? data : []));
  });
}
