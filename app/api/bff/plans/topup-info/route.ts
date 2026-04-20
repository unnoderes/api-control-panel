import { mapTopupInfo } from '@/lib/api/mappers';
import { requestNewApiWithSession } from '@/lib/api/newapi-server';
import { ok, withErrorHandling } from '@/lib/api/route';
import { requireSession } from '@/lib/auth/session';
import type { NewApiTopupInfo } from '@/types/newapi';

export async function GET() {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const data = await requestNewApiWithSession<NewApiTopupInfo>({
      path: '/api/user/self/topup/info',
      accessToken: session.accessToken,
      userId: session.userId,
    });

    return ok(mapTopupInfo(data));
  });
}
