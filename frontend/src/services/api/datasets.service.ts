import type { ApiResponse, DatasetMetadata } from '@nasa-experience/contracts';
import { apiClient, isMockMode } from './client';
import { mockDatasets } from './mocks/fixtures/datasets.mock';
import { createMockResponse } from './mocks/mock-client';
import type { SonicTrackConfig } from '@/config/earth-song.config';

// Aesthetic theme palettes for NASA datasets
const PALETTES = [
  {
    accent: '#38bdf8', // sky-400
    glow: 'rgba(56, 189, 248, 0.4)',
    nebula: 'rgba(14, 165, 233, 0.18)',
    video: '/videos/hurricane_video.mp4',
    frequency: '432 Hz',
  },
  {
    accent: '#2dd4bf', // teal-400
    glow: 'rgba(45, 212, 191, 0.4)',
    nebula: 'rgba(20, 184, 166, 0.18)',
    video: '/videos/deep_ocean_video.mp4',
    frequency: '174 Hz',
  },
  {
    accent: '#fbbf24', // amber-400
    glow: 'rgba(251, 191, 36, 0.4)',
    nebula: 'rgba(245, 158, 11, 0.18)',
    video: '/videos/solar_flares.mp4',
    frequency: '528 Hz',
  },
  {
    accent: '#a78bfa', // violet-400
    glow: 'rgba(167, 139, 250, 0.4)',
    nebula: 'rgba(139, 92, 246, 0.18)',
    video: '/videos/polar_video.mp4',
    frequency: '639 Hz',
  },
  {
    accent: '#34d399', // emerald-400
    glow: 'rgba(52, 211, 153, 0.4)',
    nebula: 'rgba(16, 185, 129, 0.18)',
    video: '/videos/cool_video_happy.mp4',
    frequency: '417 Hz',
  },
];

export class DatasetsService {
  /**
   * Retrieves all registered NASA datasets.
   */
  public async getDatasets(options: { forceMock?: boolean } = {}): Promise<ApiResponse<DatasetMetadata[]>> {
    if (options.forceMock || isMockMode()) {
      return createMockResponse<DatasetMetadata[]>(mockDatasets);
    }
    const res = await apiClient.get<DatasetMetadata[]>('/api/datasets');
    if (!res.success) {
      return createMockResponse<DatasetMetadata[]>(mockDatasets);
    }
    return res;
  }

  /**
   * Retrieves a specific dataset by ID.
   */
  public async getDataset(
    id: string,
    options: { forceMock?: boolean } = {}
  ): Promise<ApiResponse<DatasetMetadata>> {
    if (options.forceMock || isMockMode()) {
      const match = mockDatasets.find((d) => d.id === id);
      if (match) return createMockResponse<DatasetMetadata>(match);
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: `Dataset '${id}' not found.` },
        meta: { timestamp: new Date().toISOString() },
      };
    }
    const res = await apiClient.get<DatasetMetadata>(`/api/datasets/${encodeURIComponent(id)}`);
    if (!res.success) {
      const match = mockDatasets.find((d) => d.id === id);
      if (match) return createMockResponse<DatasetMetadata>(match);
    }
    return res;
  }

  /**
   * Transforms a backend DatasetMetadata record into the SonicTrackConfig model
   * expected by the frontend's SonicGallery and AudioDockConsole.
   */
  public adaptDatasetToTrack(dataset: DatasetMetadata, index: number): SonicTrackConfig {
    const palette = PALETTES[index % PALETTES.length]!;

    // Extract frequency hint from sonification rules if present
    const freqHint = dataset.sonification_rules[0]?.mapping_range.split(' ')[0] || palette.frequency;

    return {
      id: dataset.id,
      title: dataset.title.toUpperCase(),
      category: dataset.category,
      frequency: freqHint,
      description: dataset.description,
      videoSrc: palette.video,
      imageSrc: `/api/datasets/${dataset.id}/image`,
      nasaUrl: dataset.nasa_url,
      svsId: dataset.svs_id,
      color: {
        accent: palette.accent,
        glow: palette.glow,
        nebula: palette.nebula,
      },
      // Backend audio streaming endpoint
      audioSrc: `/api/sonification/${dataset.id}/download`,
      // Additional scientific metadata for UI enhancements
      sonificationRules: dataset.sonification_rules,
      scientificVariables: dataset.scientific_variables,
    };
  }
}

export const datasetsService = new DatasetsService();
