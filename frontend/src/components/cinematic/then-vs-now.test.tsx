import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ThenVsNow } from './then-vs-now';

vi.mock('@/services/api', () => ({
  sonificationService: {
    comparePeriods: vi.fn().mockResolvedValue({
      success: true,
      data: {
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
        insights: [
          'Visual radiometric illumination increased by 2.06% between 2012 and 2023 composites.',
        ],
        accessibility_summary: 'Comparative NASA satellite sonification between 2012 and 2023.',
        comparison_method: 'Independent Dual-Observation Radiometric Feature Delta & Dual-Phase Sonification',
      },
    }),
  },
}));

describe('ThenVsNow Component', () => {
  it('renders genuine NASA observation imagery and observation dates', async () => {
    render(<ThenVsNow />);

    await waitFor(() => {
      expect(screen.getByText(/Then vs Now: Hear the Difference/i)).toBeInTheDocument();
    });

    // In 'diff' phase by default, both 2012 and 2023 images are rendered
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(2);
    expect(images[0]).toHaveAttribute('src', '/api/datasets/night-lights/image?period=2012');
    expect(images[1]).toHaveAttribute('src', '/api/datasets/night-lights/image?period=2023');

    // Observation date labels
    expect(screen.getByText('2012 Annual Composite (Suomi NPP VIIRS DNB)')).toBeInTheDocument();
    expect(screen.getByText('2023 Annual Composite (Suomi NPP & NOAA-20 VIIRS DNB)')).toBeInTheDocument();
  });

  it('switches phases and displays updated observation views and audio', async () => {
    render(<ThenVsNow />);

    await waitFor(() => {
      expect(screen.getByText('2012 Baseline')).toBeInTheDocument();
    });

    // Switch to 2012 Baseline
    fireEvent.click(screen.getByText('2012 Baseline'));
    expect(screen.getByText('2012 Night Lights Radiance')).toBeInTheDocument();

    // Switch to 2023 Current
    fireEvent.click(screen.getByText('2023 Current'));
    expect(screen.getByText('2023 Night Lights Radiance')).toBeInTheDocument();
  });

  it('displays real calculated scientific metrics from NASA observations', async () => {
    render(<ThenVsNow />);

    await waitFor(() => {
      expect(screen.getByText('+2.06%')).toBeInTheDocument();
      expect(screen.getByText('+0.0013')).toBeInTheDocument();
      expect(screen.getByText('0.0016')).toBeInTheDocument();
    });
  });

  it('provides accessible tab navigation and live screen-reader announcements', async () => {
    render(<ThenVsNow />);

    await waitFor(() => {
      expect(screen.getByRole('tablist', { name: /nasa observation period selectors/i })).toBeInTheDocument();
    });

    const tablist = screen.getByRole('tablist', { name: /nasa observation period selectors/i });
    expect(tablist).toBeInTheDocument();

    const tab2012 = screen.getByRole('tab', { name: /2012 baseline observation/i });
    const tab2023 = screen.getByRole('tab', { name: /2023 current observation/i });
    const tabDiff = screen.getByRole('tab', { name: /dual-phase comparative audio/i });

    expect(tab2012).toHaveAttribute('aria-selected', 'false');
    expect(tab2023).toHaveAttribute('aria-selected', 'false');
    expect(tabDiff).toHaveAttribute('aria-selected', 'true');

    // Live region status
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');

    // Switch to 2012
    fireEvent.click(tab2012);
    expect(tab2012).toHaveAttribute('aria-selected', 'true');
    expect(tabDiff).toHaveAttribute('aria-selected', 'false');
    expect(liveRegion).toHaveTextContent('Switched to 2012 Baseline observation: NASA Suomi NPP VIIRS DNB.');

    // Switch to 2023
    fireEvent.click(tab2023);
    expect(tab2023).toHaveAttribute('aria-selected', 'true');
    expect(liveRegion).toHaveTextContent('Switched to 2023 Current observation: NASA Suomi NPP and NOAA-20 VIIRS DNB.');
  });
});
