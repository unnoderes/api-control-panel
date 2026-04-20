import { BffError } from '@/lib/api/errors';
import { mapTopupInfo, mapTopupOrder } from '@/lib/api/mappers';
import { requestNewApiWithSession } from '@/lib/api/newapi-server';
import { ok, withErrorHandling } from '@/lib/api/route';
import { requireSession } from '@/lib/auth/session';
import type { NewApiTopupInfo, NewApiTopupOrderResponse } from '@/types/newapi';

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const { amount } = (await request.json()) as { amount: number };
    const origin = new URL(request.url).origin;

    const info = await requestNewApiWithSession<NewApiTopupInfo>({
      path: '/api/user/self/topup/info',
      accessToken: session.accessToken,
      userId: session.userId,
    });
    const topupInfo = mapTopupInfo(info);

    let raw: NewApiTopupOrderResponse;

    if (topupInfo.availableProviders.includes('epay')) {
      raw = await requestNewApiWithSession<NewApiTopupOrderResponse>({
        method: 'POST',
        path: '/api/user/self/pay',
        body: { amount, payment_method: 'zfb' },
        accessToken: session.accessToken,
        userId: session.userId,
      });
    } else if (topupInfo.availableProviders.includes('stripe')) {
      raw = await requestNewApiWithSession<NewApiTopupOrderResponse>({
        method: 'POST',
        path: '/api/user/self/stripe/pay',
        body: { amount, payment_method: 'card', success_url: `${origin}/`, cancel_url: `${origin}/` },
        accessToken: session.accessToken,
        userId: session.userId,
      });
    } else if (topupInfo.availableProviders.includes('waffo')) {
      raw = await requestNewApiWithSession<NewApiTopupOrderResponse>({
        method: 'POST',
        path: '/api/user/self/waffo/pay',
        body: { amount },
        accessToken: session.accessToken,
        userId: session.userId,
      });
    } else {
      throw new BffError('No payment provider is enabled', { status: 503, code: 'NO_PAYMENT_PROVIDER' });
    }

    return ok(mapTopupOrder(raw));
  });
}
