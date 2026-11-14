import type {
  ApiResponse,
  GenerateSonificationRequest,
  GenerateSonificationResponse,
  CompareRequest,
  CompareResponse,
} from '@nasa-experience/contracts';
import { apiClient, isMockMode } from './client';
import { createMockResponse } from './mocks/mock-client';

export class SonificationService {
  /**
   * Triggers customized soundscape synthesis with layer overrides.
   */
  public async generateSonification(
    request: GenerateSonificationRequest,
    options: { forceMock?: boolean } = {}
  ): Promise<ApiResponse<GenerateSonificationResponse>> {
    const fallbackData: GenerateSonificationResponse = {
      audio_id: `audio_custom_${Date.now()}`,
      dataset_id: request.dataset_id,
      title: `${request.dataset_id} Custom Sonification`,
      duration: request.duration_seconds || 10.0,
      sample_rate: request.sample_rate || 44100,
      audio_url: '/audio/loop.mp3',
      download_url: '/audio/loop.mp3',
      layers_active: ['Dust Storm Resonance (Custom Mix)', 'Oceanic Sea Salt Shimmer'],
      accessibility_narrative: 'Acoustic landscape of atmospheric particles.',
      musical_key: 'A Aeolian',
    };

    if (options.forceMock || isMockMode()) {
      return createMockResponse<GenerateSonificationResponse>(fallbackData);
    }

    const res = await apiClient.post<GenerateSonificationResponse>(
      '/api/sonification/generate',
      request
    );
    if (!res.success) {
      return createMockResponse<GenerateSonificationResponse>(fallbackData);
    }
    return res;
  }

  /**
   * Generates a dual-phase comparative soundscape (Then vs Now).
   */
  public async comparePeriods(
    request: CompareRequest,
    options: { forceMock?: boolean } = {}
  ): Promise<ApiResponse<CompareResponse>> {
    const fallbackCompare: CompareResponse = {
      comparison_id: `comp_mock_${Date.now()}`,
      dataset_id: request.dataset_id,
      period_a: request.period_a,
      period_b: request.period_b,
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
        'Rural electrification manifests as audible chime clusters in modern observation.',
      ],
      accessibility_summary: 'Dual phase sonification comparison.',
    };

    if (options.forceMock || isMockMode()) {
      return createMockResponse<CompareResponse>(fallbackCompare);
    }

    const res = await apiClient.post<CompareResponse>('/api/sonification/compare', request);
    if (!res.success) {
      return createMockResponse<CompareResponse>(fallbackCompare);
    }
    return res;
  }

  /**
   * Returns the direct streaming URL for a synthesized audio asset.
   */
  public getAudioStreamUrl(audioId: string): string {
    return `/api/sonification/${encodeURIComponent(audioId)}/download`;
  }
}

export const sonificationService = new SonificationService();
