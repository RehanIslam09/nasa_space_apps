import { apiSuccess } from '@/lib/api/response';
import { getFastApiBackendUrl } from '@/lib/validation/env';
import { mockInsights } from '@/services/api/mocks/fixtures/insights.mock';
import type { InsightsResponse } from '@nasa-experience/contracts';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * BFF Endpoint: GET /api/insights/:id
 * Fetches scientific telemetry metrics, spatial distribution entropy, and regional breakdowns.
 */
export async function GET(_request: Request, props: RouteParams) {
  const { id } = await props.params;

  try {
    const fastApiUrl = getFastApiBackendUrl();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${fastApiUrl}/api/insights/${encodeURIComponent(id)}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as InsightsResponse;
      return apiSuccess(data);
    }
  } catch {
    // Upstream offline
  }

  const match = mockInsights[id];
  if (match) {
    return apiSuccess(match, 200, { source: 'mock_fallback' });
  }

  // Generic fallback if specific ID not pre-mocked
  const genericFallback: InsightsResponse = {
    dataset_id: id,
    title: id.replace(/-/g, ' ').toUpperCase(),
    mean_intensity: 0.48,
    max_intensity: 0.88,
    min_intensity: 0.12,
    dominant_layer: 'Planetary Telemetry Flux',
    spatial_distribution_entropy: 0.65,
    regional_breakdown: [],
    scientific_interpretation: `Observations for '${id}' indicate dynamic seasonal oscillations with continuous atmospheric transport.`,
  };

  return apiSuccess(genericFallback, 200, { source: 'mock_fallback' });
}
