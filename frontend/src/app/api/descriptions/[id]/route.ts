import { apiSuccess } from '@/lib/api/response';
import { getFastApiBackendUrl } from '@/lib/validation/env';
import { mockAccessibilityDescriptions } from '@/services/api/mocks/fixtures/insights.mock';
import type { AccessibilityResponse } from '@nasa-experience/contracts';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * BFF Endpoint: GET /api/descriptions/:id
 * Fetches accessibility screen reader legends, audio guides, and tactile feedback guidance.
 */
export async function GET(_request: Request, props: RouteParams) {
  const { id } = await props.params;

  try {
    const fastApiUrl = getFastApiBackendUrl();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${fastApiUrl}/api/descriptions/${encodeURIComponent(id)}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as AccessibilityResponse;
      return apiSuccess(data);
    }
  } catch {
    // Upstream offline
  }

  const match = mockAccessibilityDescriptions[id];
  if (match) {
    return apiSuccess(match, 200, { source: 'mock_fallback' });
  }

  const genericAccessibility: AccessibilityResponse = {
    dataset_id: id,
    title: id.replace(/-/g, ' ').toUpperCase(),
    plain_language_summary: `Planetary sonification representation for ${id}. Higher audio pitch represents higher measured intensity; spatial panning indicates geographical orientation.`,
    screen_reader_legend: [
      { layer_name: 'Primary Harmonic', frequency: '220–440 Hz', variable: 'Core Environmental Metric' },
    ],
    audio_guide: 'Listen for foundational pitch changes mapping to satellite telemetry.',
    tactile_equivalent_guidance: 'Haptic vibrations pulsate in direct proportion to measured planetary flux.',
  };

  return apiSuccess(genericAccessibility, 200, { source: 'mock_fallback' });
}
