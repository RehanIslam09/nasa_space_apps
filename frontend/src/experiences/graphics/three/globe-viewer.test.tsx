import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { GlobeViewer } from './globe-viewer';

describe('GlobeViewer Component', () => {
  const mockComparisonData = {
    comparison_id: 'test-comp-1234',
    dataset_id: 'night-lights',
    period_a: '2012',
    period_b: '2023',
    audio_a_url: '/api/sonification/night-lights_2012/download',
    audio_b_url: '/api/sonification/night-lights_2023/download',
    audio_diff_url: '/api/sonification/night-lights_comparison/download',
    image_a_url: '/api/datasets/night-lights/image?period=2012',
    image_b_url: '/api/datasets/night-lights/image?period=2023',
    observation_date_a: '2012 Annual Composite (Suomi NPP VIIRS DNB)',
    observation_date_b: '2023 Annual Composite (Suomi NPP & NOAA-20 VIIRS DNB)',
    source_asset_a_url: 'http://svs.gsfc.nasa.gov/vis/a000000/a005200/a005276/nightlights_flat_series_stills_8k_compare.02012.jpg',
    source_asset_b_url: 'http://svs.gsfc.nasa.gov/vis/a000000/a005200/a005276/nightlights_flat_series_stills_8k_compare.02023.jpg',
    metrics: {
      brightness_percent_change: 2.06,
      density_delta: 0.0013,
      overall_shift_magnitude: 0.0016,
    },
    insights: ['Visual radiometric illumination increased by 2.06%'],
    accessibility_summary: 'Comparative NASA satellite sonification',
    comparison_method: 'Independent Dual-Observation Radiometric Feature Delta',
  };

  it('renders accessible fallback image when WebGL is unavailable in test environment', () => {
    render(<GlobeViewer selectedPhase="a" comparisonData={mockComparisonData} />);

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/api/datasets/night-lights/image?period=2012');
    expect(screen.getByText('2012 Annual Composite (Suomi NPP VIIRS DNB)')).toBeInTheDocument();
  });

  it('renders both 2012 and 2023 fallback images in diff phase', () => {
    render(<GlobeViewer selectedPhase="diff" comparisonData={mockComparisonData} />);

    const images = screen.getAllByRole('img');
    expect(images.length).toBe(2);
    expect(screen.getByText('2012 Annual Composite (Suomi NPP VIIRS DNB)')).toBeInTheDocument();
    expect(screen.getByText('2023 Annual Composite (Suomi NPP & NOAA-20 VIIRS DNB)')).toBeInTheDocument();
  });

  it('renders 2023 observation image when selectedPhase is b', () => {
    render(<GlobeViewer selectedPhase="b" comparisonData={mockComparisonData} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/api/datasets/night-lights/image?period=2023');
    expect(screen.getByText('2023 Annual Composite (Suomi NPP & NOAA-20 VIIRS DNB)')).toBeInTheDocument();
  });

  it('provides NASA SVS attribution banner', () => {
    render(<GlobeViewer selectedPhase="a" comparisonData={mockComparisonData} />);

    expect(screen.getByText(/NASA SVS #5313/i)).toBeInTheDocument();
  });
});
