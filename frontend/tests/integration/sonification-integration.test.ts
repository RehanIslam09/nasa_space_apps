import { describe, it, expect } from 'vitest';
import { SonificationService } from '../../src/services/api/sonification.service';
import { GenerateSonificationResponseSchema, CompareResponseSchema } from '@nasa-experience/contracts';

describe('Integration: Sonification Service', () => {
  it('triggers sonification and validates response structure', async () => {
    const service = new SonificationService();
    const response = await service.generateSonification({
      dataset_id: 'geos-aerosols',
      duration_seconds: 10.0,
      sample_rate: 44100,
      preset: 'balanced',
    });

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data.audio_id).toBeDefined();
      expect(response.data.audio_url).toBeDefined();
      expect(GenerateSonificationResponseSchema.safeParse(response.data).success).toBe(true);
    }
  });

  it('triggers decadal period comparison and validates comparative delta', async () => {
    const service = new SonificationService();
    const response = await service.comparePeriods({
      dataset_id: 'night-lights',
      period_a: '2012',
      period_b: '2023',
      duration_seconds: 12.0,
    });

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data.comparison_id).toBeDefined();
      expect(response.data.audio_diff_url).toBeDefined();
      expect(CompareResponseSchema.safeParse(response.data).success).toBe(true);
    }
  });
});
