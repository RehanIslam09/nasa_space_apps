import { describe, it, expect } from 'vitest';
import {
  NASA_ANCHOR_STATIONS,
  resolveGeographicLocation,
  calculateGreatCircleDistanceKm,
} from './environmental-data';

describe('NASA Environmental Data & Geospatial Resolver', () => {
  it('contains authentic anchor stations with complete provenance and metrics', () => {
    expect(NASA_ANCHOR_STATIONS.length).toBeGreaterThanOrEqual(10);

    NASA_ANCHOR_STATIONS.forEach((station) => {
      expect(station.id).toBeDefined();
      expect(station.name).toBeDefined();
      expect(station.coordinates.lat).toBeGreaterThanOrEqual(-90);
      expect(station.coordinates.lat).toBeLessThanOrEqual(90);
      expect(station.coordinates.lon).toBeGreaterThanOrEqual(-180);
      expect(station.coordinates.lon).toBeLessThanOrEqual(180);

      // Verify metrics
      expect(station.metrics.nightlightRadiance2012).toBeGreaterThanOrEqual(0);
      expect(station.metrics.nightlightRadiance2023).toBeGreaterThanOrEqual(0);
      expect(station.metrics.primaryStressFactor).toBeDefined();

      // Verify provenance documentation
      expect(station.provenance.primaryDataset).toBeDefined();
      expect(station.provenance.satelliteSensor).toBeDefined();
      expect(station.provenance.dataProvider).toBeDefined();
      expect(station.provenance.spatialResolution).toBeDefined();

      // Verify sonification profile
      expect(station.sonification.baseFrequency).toBeGreaterThan(20);
      expect(station.sonification.harmonicDensity).toBeGreaterThanOrEqual(0);
      expect(station.sonification.pulseRate).toBeGreaterThan(0);
    });
  });

  it('correctly calculates Haversine Great-Circle distance', () => {
    // London to Paris: ~344 km
    const dist = calculateGreatCircleDistanceKm(51.5074, -0.1278, 48.8566, 2.3522);
    expect(dist).toBeGreaterThan(330);
    expect(dist).toBeLessThan(360);

    // Identical coordinates must be 0 km
    expect(calculateGreatCircleDistanceKm(10, 20, 10, 20)).toBe(0);
  });

  it('resolves the Amazon Rainforest station when clicking near Rondônia', () => {
    // Click within 200 km of Amazon anchor
    const result = resolveGeographicLocation(-4.0, -62.0);
    expect(result.id).toBe('amazon-basin');
    expect(result.country).toBe('Brazil');
    expect(result.biome).toBe('rainforest');
    expect(result.metrics.vegetationIndex2012).toBeDefined();
    expect(result.provenance.isModelDerived).toBe(false);
  });

  it('resolves the New Delhi station when clicking in Northern India', () => {
    const result = resolveGeographicLocation(28.5, 77.0);
    expect(result.id).toBe('india-indo-gangetic');
    expect(result.country).toBe('India');
    expect(result.biome).toBe('urban');
    expect(result.metrics.nightlightDeltaPercent).toBeGreaterThan(100);
  });

  it('resolves the Arctic Svalbard station when clicking in the high Arctic', () => {
    const result = resolveGeographicLocation(78.0, 15.0);
    expect(result.id).toBe('arctic-svalbard');
    expect(result.biome).toBe('cryosphere');
    expect(result.metrics.temperatureAnomaly).toBeGreaterThan(2.0);
  });

  it('falls back to authentic ocean biome when clicking deep open ocean', () => {
    // Middle of the South Pacific
    const result = resolveGeographicLocation(-35.0, -130.0);
    expect(result.biome).toBe('oceanic');
    expect(result.country).toBe('International Waters');
    expect(result.provenance.isModelDerived).toBe(true);
    expect(result.provenance.primaryDataset).toContain('NASA Global Assimilation');
    expect(result.sonification.baseFrequency).toBeCloseTo(82.41, 1);
  });

  it('falls back to polar cryosphere when clicking near Antarctica outside station', () => {
    const result = resolveGeographicLocation(-82.0, 90.0);
    expect(result.biome).toBe('cryosphere');
    expect(result.name).toContain('Antarctic');
    expect(result.sonification.baseFrequency).toBeCloseTo(55.0, 1);
  });
});
