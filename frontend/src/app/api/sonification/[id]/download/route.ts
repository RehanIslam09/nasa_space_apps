import { NextResponse } from 'next/server';
import { getFastApiBackendUrl } from '@/lib/validation/env';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * BFF Endpoint: GET /api/sonification/:id/download
 * Streams the 16-bit PCM WAV audio file from Python FastAPI or falls back to local audio loop.
 */
export async function GET(_request: Request, props: RouteParams) {
  const { id } = await props.params;

  try {
    const fastApiUrl = getFastApiBackendUrl();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const upstreamUrl = `${fastApiUrl}/api/sonification/${encodeURIComponent(id)}/download`;
    const res = await fetch(upstreamUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'audio/wav, */*',
      },
    });
    clearTimeout(timer);

    if (res.ok && res.body) {
      const headers = new Headers();
      headers.set('Content-Type', res.headers.get('content-type') || 'audio/wav');
      const contentLength = res.headers.get('content-length');
      if (contentLength) {
        headers.set('Content-Length', contentLength);
      }
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Cache-Control', 'public, max-age=3600');

      return new Response(res.body, {
        status: 200,
        headers,
      });
    }
  } catch {
    // Upstream offline or audio ID missing
  }

  // If upstream sonification is unavailable or not found, return explicit HTTP 404
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'SONIFICATION_NOT_FOUND',
        message: `Synthesized NASA sonification for '${id}' could not be resolved from PRANA audio engine.`,
      },
    },
    { status: 404 }
  );
}
