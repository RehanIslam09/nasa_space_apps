import { apiSuccess, apiError } from '@/lib/api/response';
import { getFastApiBackendUrl } from '@/lib/validation/env';
import type { CompareRequest, CompareResponse } from '@nasa-experience/contracts';

export const dynamic = 'force-dynamic';

/**
 * BFF Endpoint: POST /api/sonification/compare
 * Generates dual-phase comparative soundscape (Then vs Now).
 */
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CompareRequest;
    const fastApiUrl = getFastApiBackendUrl();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${fastApiUrl}/api/sonification/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as CompareResponse;
      const sanitizeUrl = (url?: string) => {
        if (!url) return '/audio/loop.mp3';
        if (url.startsWith('/api/sonification/') && url.endsWith('/download')) {
          return url;
        }
        const parts = url.split('/').filter(Boolean);
        const last = parts[parts.length - 1];
        const audioId = last === 'download' ? parts[parts.length - 2] : last;
        return audioId ? `/api/sonification/${audioId}/download` : '/audio/loop.mp3';
      };

      return apiSuccess({
        ...data,
        audio_a_url: sanitizeUrl(data.audio_a_url),
        audio_b_url: sanitizeUrl(data.audio_b_url),
        audio_diff_url: sanitizeUrl(data.audio_diff_url),
      });
    }

    const errText = await res.text();
    return apiError(`Comparison failed: ${errText}`, 'INTERNAL_ERROR', res.status);
  } catch {
    // Upstream offline fallback
    const fallbackComparison: CompareResponse = {
      comparison_id: `comp_mock_${Date.now()}`,
      dataset_id: 'night-lights',
      period_a: '2012 Baseline',
      period_b: '2023 Current',
      audio_a_url: '/audio/loop.mp3',
      audio_b_url: '/audio/loop.mp3',
      audio_diff_url: '/audio/loop.mp3',
      metrics: {
        radiance_delta_percent: '+18.4%',
        urban_growth_index: 'High Expansion',
        temporal_continuity: 0.92,
      },
      insights: [
        'Urban illumination increased substantially across Southeast Asia and India over the 11-year baseline.',
        'Rural electrification projects in South Asia manifest as newly audible mid-frequency chime clusters.',
      ],
      accessibility_summary:
        'Dual-phase sonification: Period A plays early decadal radiance; Period B shifts into higher-frequency urban cluster tones.',
    };
    return apiSuccess(fallbackComparison, 200, { source: 'mock_fallback' });
  }
}
