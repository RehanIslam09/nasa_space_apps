import { NextResponse } from 'next/server';
import { getFastApiBackendUrl } from '@/lib/validation/env';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * BFF Endpoint: GET /api/datasets/:id/image
 * Proxies the real NASA scientific visualization frame from Python FastAPI.
 */
export async function GET(request: Request, props: RouteParams) {
  const { id } = await props.params;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period');

  try {
    const fastApiUrl = getFastApiBackendUrl();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const queryString = period ? `?period=${encodeURIComponent(period)}` : '';
    const upstreamUrl = `${fastApiUrl}/api/datasets/${encodeURIComponent(id)}/image${queryString}`;
    const res = await fetch(upstreamUrl, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok && res.body) {
      const headers = new Headers();
      headers.set('Content-Type', res.headers.get('content-type') || 'image/png');
      const contentLength = res.headers.get('content-length');
      if (contentLength) {
        headers.set('Content-Length', contentLength);
      }
      headers.set('Cache-Control', 'public, max-age=86400');

      return new Response(res.body, {
        status: 200,
        headers,
      });
    }
  } catch {
    // Upstream image offline or unreachable
  }

  return new NextResponse('NASA Image Not Found', { status: 404 });
}
