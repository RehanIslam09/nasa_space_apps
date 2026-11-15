import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AudioDockConsole } from './audio-dock-console';
import { insightsService, sonificationService } from '@/services/api';
import type { SonicTrackConfig } from '@/config/earth-song.config';

vi.mock('@/services/api', () => ({
  sonificationService: {
    generateSonification: vi.fn().mockResolvedValue({
      success: true,
      data: {
        audio_id: 'custom-mix-432',
        download_url: '/api/sonification/custom-mix-432/download',
      },
    }),
  },
  insightsService: {
    getAccessibility: vi.fn().mockResolvedValue({
      success: true,
      data: {
        dataset_id: 'geos-aerosols',
        title: 'GEOS Atmospheric Aerosols',
        plain_language_summary:
          'Atmospheric simulation of global aerosols from NASA Goddard Earth Observing System.',
        screen_reader_legend: [
          {
            layer_name: 'Desert Dust Layer',
            scientific_variable: 'Aerosol Optical Depth (Dust)',
            audio_characteristic: 'Low frequency sawtooth drone',
            pitch_range: '110–220 Hz',
            synthesis_timbre: 'Analog saw drone',
            scientific_reasoning: 'Transatlantic mineral dust transport creates deep resonance.',
          },
          {
            layer_name: 'Marine Sea Salt',
            scientific_variable: 'Aerosol Optical Depth (Sea Salt)',
            audio_characteristic: 'Airy noise shimmer and high bell',
            pitch_range: '950–1350 Hz',
            synthesis_timbre: 'Resonant bandpass noise',
            scientific_reasoning: 'Ocean surface wind shear lifts particulate salt spray.',
          },
        ],
        audio_guide: 'Listen for four distinct sonic constituent layers.',
        tactile_equivalent_guidance:
          'Sub-bass pressure waves (50–120 Hz) physically vibrate through external bass transducers to convey heavy mineral dust concentration.',
      },
    }),
  },
}));

const mockTrack: SonicTrackConfig = {
  id: 'geos-aerosols',
  title: 'GEOS Atmospheric Aerosols',
  category: 'Atmospheric Physics',
  frequency: '432 Hz Planetary Breath',
  description: 'Global aerosol simulation tracking optical depth across dust, sea salt, smoke, and sulfate.',
  videoSrc: '/videos/aerosols.mp4',
  audioSrc: '/api/sonification/geos-aerosols/download',
  color: {
    accent: '#38bdf8',
    glow: 'rgba(56,189,248,0.4)',
    nebula: 'rgba(56,189,248,0.1)',
  },
};

describe('AudioDockConsole Accessibility & Science Communication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a screen-reader live region announcing dataset exploration', () => {
    render(
      <AudioDockConsole
        activeTrack={mockTrack}
        isPlaying={false}
        onTogglePlay={vi.fn()}
      />
    );

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    expect(liveRegion).toHaveTextContent(
      'Now exploring GEOS Atmospheric Aerosols, Atmospheric Physics sonification.'
    );
  });

  it('has accessible sliders with correct ARIA attributes and labels', () => {
    render(
      <AudioDockConsole
        activeTrack={mockTrack}
        isPlaying={false}
        onTogglePlay={vi.fn()}
      />
    );

    // Timeline slider
    const timeline = screen.getByRole('slider', { name: /audio timeline position/i });
    expect(timeline).toBeInTheDocument();
    expect(timeline).toHaveAttribute('aria-valuemin', '0');
    expect(timeline).toHaveAttribute('aria-valuenow', '0');

    // Equalizer sliders
    const bass = screen.getByRole('slider', { name: /bass equalizer/i });
    expect(bass).toBeInTheDocument();
    expect(bass).toHaveAttribute('aria-valuenow', '65');
    expect(bass).toHaveAttribute('aria-valuetext', '65 percent bass');

    const mid = screen.getByRole('slider', { name: /midrange resonance equalizer/i });
    expect(mid).toBeInTheDocument();
    expect(mid).toHaveAttribute('aria-valuenow', '75');
    expect(mid).toHaveAttribute('aria-valuetext', '75 percent midrange');

    const high = screen.getByRole('slider', { name: /high shimmer equalizer/i });
    expect(high).toBeInTheDocument();
    expect(high).toHaveAttribute('aria-valuenow', '60');
    expect(high).toHaveAttribute('aria-valuetext', '60 percent treble shimmer');
  });

  it('provides accessible constituent layer sliders inside the synthesizer mixer', () => {
    render(
      <AudioDockConsole
        activeTrack={mockTrack}
        isPlaying={false}
        onTogglePlay={vi.fn()}
      />
    );

    const mixerTab = screen.getByRole('tab', {
      name: /mix|toggle constituent layer synthesizer mixer/i,
    });
    expect(mixerTab).toHaveAttribute('aria-selected', 'true');
    expect(mixerTab).toHaveAttribute('aria-controls', 'constituent-mixer-panel');

    // Expand the "Build your own mix" accordion
    const accordionBtn = screen.getByRole('button', { name: /build your own mix/i });
    fireEvent.click(accordionBtn);

    // Verify constituent sliders
    const dustSlider = screen.getByRole('slider', { name: /dust layer volume/i });
    expect(dustSlider).toBeInTheDocument();
    expect(dustSlider).toHaveAttribute('aria-valuenow', '80');
    expect(dustSlider).toHaveAttribute('aria-valuetext', '80 percent dust layer');

    const saltSlider = screen.getByRole('slider', { name: /sea salt layer volume/i });
    expect(saltSlider).toBeInTheDocument();
    expect(saltSlider).toHaveAttribute('aria-valuenow', '70');

    const smokeSlider = screen.getByRole('slider', { name: /smoke layer volume/i });
    expect(smokeSlider).toBeInTheDocument();
    expect(smokeSlider).toHaveAttribute('aria-valuenow', '65');

    const sulfateSlider = screen.getByRole('slider', { name: /sulfate layer volume/i });
    expect(sulfateSlider).toBeInTheDocument();
    expect(sulfateSlider).toHaveAttribute('aria-valuenow', '50');
  });

  it('opens Science Learn tab and loads accessibility narrative', async () => {
    render(
      <AudioDockConsole
        activeTrack={mockTrack}
        isPlaying={false}
        onTogglePlay={vi.fn()}
      />
    );

    const learnTab = screen.getByRole('tab', {
      name: /learn|toggle scientific interpretation & audio legend/i,
    });
    expect(learnTab).toHaveAttribute('aria-selected', 'false');
    expect(learnTab).toHaveAttribute('aria-controls', 'science-legend-panel');

    // Click to switch to Learn Tab
    fireEvent.click(learnTab);
    expect(learnTab).toHaveAttribute('aria-selected', 'true');

    await waitFor(() => {
      expect(insightsService.getAccessibility).toHaveBeenCalledWith('geos-aerosols');
    });

    // Verify structured variable-to-sound mappings render
    await waitFor(() => {
      expect(screen.getByText('Desert Dust Layer')).toBeInTheDocument();
      expect(screen.getByText('Marine Sea Salt')).toBeInTheDocument();
    });
  });

  it('triggers custom DSP synthesis and announces progress', async () => {
    render(
      <AudioDockConsole
        activeTrack={mockTrack}
        isPlaying={false}
        onTogglePlay={vi.fn()}
      />
    );

    // Expand the "Build your own mix" accordion
    const accordionBtn = screen.getByRole('button', { name: /build your own mix/i });
    fireEvent.click(accordionBtn);

    // Click synthesize
    const synthBtn = screen.getByRole('button', {
      name: /synthesize custom cadence 16-bit wav/i,
    });
    fireEvent.click(synthBtn);

    await waitFor(() => {
      expect(sonificationService.generateSonification).toHaveBeenCalled();
    });

    const liveRegion = screen.getByRole('status');
    await waitFor(() => {
      expect(liveRegion).toHaveTextContent(
        'Custom sonification mix generated successfully and active.'
      );
    });
  });

  it('opens 2D Spatial Audio Move tab and adjusts atmospheric reverb', () => {
    render(
      <AudioDockConsole
        activeTrack={mockTrack}
        isPlaying={false}
        onTogglePlay={vi.fn()}
      />
    );

    const moveTab = screen.getByRole('tab', {
      name: /move|toggle spatial audio and planetary field/i,
    });
    expect(moveTab).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(moveTab);
    expect(moveTab).toHaveAttribute('aria-selected', 'true');

    // 2D Spatial Position slider pad
    const spatialPad = screen.getByRole('slider', {
      name: /2d planetary spatial position/i,
    });
    expect(spatialPad).toBeInTheDocument();

    // Atmospheric reverb slider
    const reverbSlider = screen.getByRole('slider', {
      name: /atmospheric reverb diffusion/i,
    });
    expect(reverbSlider).toBeInTheDocument();
    expect(reverbSlider).toHaveAttribute('aria-valuenow', '20');

    // Adjust reverb
    fireEvent.change(reverbSlider, { target: { value: '65' } });
    expect(reverbSlider).toHaveAttribute('aria-valuenow', '65');
  });

  it('opens Accessibility & Sensory panel and toggles tactile bass shaker', () => {
    render(
      <AudioDockConsole
        activeTrack={mockTrack}
        isPlaying={false}
        onTogglePlay={vi.fn()}
      />
    );

    const accessTab = screen.getByRole('tab', {
      name: /access|toggle accessibility & sensory settings/i,
    });
    expect(accessTab).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(accessTab);
    expect(accessTab).toHaveAttribute('aria-selected', 'true');

    // Verify Earcon options
    expect(screen.getByRole('button', { name: /^full$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^minimal$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^off$/i })).toBeInTheDocument();

    // Verify Tactile Bass Shaker toggle
    const tactileToggle = screen.getByRole('button', { name: /muted/i });
    fireEvent.click(tactileToggle);
    expect(screen.getByRole('button', { name: /active/i })).toBeInTheDocument();
  });

  it('applies acoustic sound presets in console', () => {
    render(
      <AudioDockConsole
        activeTrack={mockTrack}
        isPlaying={false}
        onTogglePlay={vi.fn()}
      />
    );

    // Click "Deep Ocean" mood preset
    const deepOceanPreset = screen.getByRole('button', { name: /deep ocean/i });
    fireEvent.click(deepOceanPreset);

    // Verify live EQ sliders updated
    const bass = screen.getByRole('slider', { name: /bass equalizer/i });
    expect(bass).toHaveAttribute('aria-valuenow', '85');
  });
});
