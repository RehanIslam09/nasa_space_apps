import { describe, it, expect } from 'vitest';
import { DatasetsService } from '../../src/services/api/datasets.service';
import { DatasetMetadataSchema } from '@nasa-experience/contracts';

describe('Integration: NASA Datasets Service', () => {
  it('retrieves datasets and successfully validates against shared contract', async () => {
    const service = new DatasetsService();
    const response = await service.getDatasets();

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data.length).toBeGreaterThan(0);
      const firstDataset = response.data[0];
      const parsed = DatasetMetadataSchema.safeParse(firstDataset);
      expect(parsed.success).toBe(true);

      // Verify adaptation into frontend SonicTrackConfig
      const track = service.adaptDatasetToTrack(firstDataset!, 0);
      expect(track.id).toBe(firstDataset!.id);
      expect(track.audioSrc).toBe(`/api/sonification/${firstDataset!.id}/download`);
      expect(track.imageSrc).toBe(`/api/datasets/${firstDataset!.id}/image`);
      expect(track.color.accent).toBeDefined();
    }
  });

  it('retrieves an individual dataset by ID', async () => {
    const service = new DatasetsService();
    const response = await service.getDataset('geos-aerosols');

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data.id).toBe('geos-aerosols');
      expect(response.data.scientific_variables.length).toBeGreaterThan(0);
    }
  });
});
