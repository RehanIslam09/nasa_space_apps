import { describe, it, expect } from 'vitest';
import {
  ApiErrorResponseSchema,
  ErrorCodes,
  HealthResponseSchema,
  HealthStatusSchema,
  DatasetMetadataSchema,
  GenerateSonificationResponseSchema,
  CompareResponseSchema,
} from '../src';

describe('Shared API Contracts', () => {
  it('validates a valid HealthStatus payload', () => {
    const validHealth = {
      status: 'healthy' as const,
      phase: '02-application-shell',
      services: {
        supabaseAuth: 'configured' as const,
        database: 'configured' as const,
      },
    };

    const parsed = HealthStatusSchema.safeParse(validHealth);
    expect(parsed.success).toBe(true);
  });

  it('rejects an invalid HealthStatus payload', () => {
    const invalidHealth = {
      status: 'broken', // invalid enum
      services: {
        supabaseAuth: 'unknown',
      },
    };

    const parsed = HealthStatusSchema.safeParse(invalidHealth);
    expect(parsed.success).toBe(false);
  });

  it('validates a complete HealthResponse structure', () => {
    const fullResponse = {
      success: true as const,
      data: {
        status: 'healthy' as const,
        phase: '02-application-shell',
        services: {
          supabaseAuth: 'configured' as const,
          database: 'pending_configuration' as const,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };

    const parsed = HealthResponseSchema.safeParse(fullResponse);
    expect(parsed.success).toBe(true);
  });

  it('validates a standardized ApiErrorResponse', () => {
    const errorPayload = {
      success: false as const,
      error: {
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Authentication token is expired',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    const parsed = ApiErrorResponseSchema.safeParse(errorPayload);
    expect(parsed.success).toBe(true);
  });

  it('validates a NASA DatasetMetadata payload', () => {
    const validDataset = {
      id: 'geos-aerosols',
      title: 'GEOS Aerosols — Atmospheric Particulate Dynamics',
      description: 'Atmospheric aerosols simulation',
      category: 'Atmosphere & Air Quality',
      nasa_url: 'https://svs.gsfc.nasa.gov/5669/',
      svs_id: 5669,
      spatial_coverage: 'Global',
      temporal_coverage: '2025-08-19',
      data_provenance: 'NASA GSFC GMAO',
      scientific_variables: [
        {
          name: 'Dust',
          unit: 'AOD',
          description: 'Mineral dust',
          typical_range: [0.0, 2.5],
          is_visual_derived: true,
        },
      ],
      sonification_rules: [
        {
          layer_name: 'Dust Drone',
          variable_mapped: 'Dust',
          audio_parameter: 'Pitch',
          mapping_range: '110 Hz - 220 Hz',
          synthesis_mode: 'Harmonic Pad',
          scientific_rationale: 'Kinetic mass',
        },
      ],
      available_media: ['PNG'],
      processing_status: 'available',
    };

    const parsed = DatasetMetadataSchema.safeParse(validDataset);
    expect(parsed.success).toBe(true);
  });

  it('validates Sonification and Comparison contracts', () => {
    const sonifRes = {
      audio_id: 'test_audio_123',
      dataset_id: 'geos-aerosols',
      title: 'GEOS Aerosols Sonification',
      duration: 10.0,
      sample_rate: 44100,
      audio_url: '/api/sonification/test_audio_123',
      download_url: '/api/sonification/test_audio_123/download',
      layers_active: ['Dust Drone'],
      accessibility_narrative: 'Acoustic landscape of atmospheric dust.',
      musical_key: 'A Aeolian',
    };
    expect(GenerateSonificationResponseSchema.safeParse(sonifRes).success).toBe(true);

    const compRes = {
      comparison_id: 'comp_123',
      dataset_id: 'night-lights',
      period_a: '2012',
      period_b: '2023',
      audio_a_url: '/api/sonification/a/download',
      audio_b_url: '/api/sonification/b/download',
      audio_diff_url: '/api/sonification/diff/download',
      metrics: { brightness_delta: 0.15 },
      insights: ['Urban radiance grew by 15%'],
      accessibility_summary: 'Decadal comparison of night lights.',
    };
    expect(CompareResponseSchema.safeParse(compRes).success).toBe(true);
  });
});
