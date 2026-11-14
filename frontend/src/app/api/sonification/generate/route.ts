import { apiSuccess, apiError } from '@/lib/api/response';
import { getFastApiBackendUrl } from '@/lib/validation/env';
import type { GenerateSonificationRequest, GenerateSonificationResponse } from '@nasa-experience/contracts';

export const dynamic = 'force-dynamic';

/**
 * BFF Endpoint: POST /api/sonification/generate
 * Triggers customized 16-bit PCM Stereo WAV synthesis on the Python PRANA engine.
 */
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as GenerateSonificationRequest;
    const fastApiUrl = getFastApiBackendUrl();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000); // 12s timeout for audio DSP synthesis

    const res = await fetch(`${fastApiUrl}/api/sonification/generate`, {
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
      const data = (await res.json()) as GenerateSonificationResponse;
      // Remap audio URL to our Next.js BFF download route
      const remapped: GenerateSonificationResponse = {
        ...data,
        audio_url: `/api/sonification/${data.audio_id}/download`,
        download_url: `/api/sonification/${data.audio_id}/download`,
      };
      return apiSuccess(remapped);
    }

    const errText = await res.text();
    return apiError(`Sonification generation failed: ${errText}`, 'INTERNAL_ERROR', res.status);
  } catch {
    // If Python backend is offline, return synthetic mock fallback
    const mockId = `mock_audio_${Date.now()}`;
    const fallbackResponse: GenerateSonificationResponse = {
      audio_id: mockId,
      dataset_id: 'geos-aerosols',
      title: 'GEOS Aerosols — Atmospheric Particulate Dynamics',
      duration: 10.0,
      sample_rate: 44100,
      audio_url: `/audio/loop.mp3`,
      download_url: `/audio/loop.mp3`,
      layers_active: ['Dust Storm Resonance (Custom Mix)', 'Oceanic Sea Salt Shimmer'],
      accessibility_narrative:
        'A customized multi-layer soundscape emphasizing mineral dust transport and marine wind textures.',
      musical_key: 'A Aeolian / Pentatonic (Warm Earth Frequency)',
    };
    return apiSuccess(fallbackResponse, 200, { source: 'mock_fallback' });
  }
}
