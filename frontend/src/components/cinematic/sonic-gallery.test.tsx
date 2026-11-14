import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SonicGallery } from './sonic-gallery';
import type { SonicTrackConfig } from '@/config/earth-song.config';

const mockTracks: SonicTrackConfig[] = [
  {
    id: 'geos-aerosols',
    title: 'GEOS AEROSOL OPTICAL THICKNESS',
    category: 'Atmospheric Composition',
    frequency: '432 Hz',
    description: 'NASA Goddard GEOS model aerosol optical thickness.',
    videoSrc: '/videos/hurricane_video.mp4',
    imageSrc: '/api/datasets/geos-aerosols/image',
    svsId: 5669,
    color: {
      accent: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.4)',
      nebula: 'rgba(14, 165, 233, 0.18)',
    },
    audioSrc: '/api/sonification/geos-aerosols/download',
  },
  {
    id: 'ocean-currents-temp',
    title: 'ECCO OCEAN CIRCULATION',
    category: 'Physical Oceanography',
    frequency: '174 Hz',
    description: 'NASA ECCO ocean circulation and thermal advection.',
    videoSrc: '/videos/deep_ocean_video.mp4',
    imageSrc: '/api/datasets/ocean-currents-temp/image',
    svsId: 3912,
    color: {
      accent: '#2dd4bf',
      glow: 'rgba(45, 212, 191, 0.4)',
      nebula: 'rgba(20, 184, 166, 0.18)',
    },
    audioSrc: '/api/sonification/ocean-currents-temp/download',
  },
];

describe('SonicGallery Component', () => {
  it('renders track cards with authentic NASA SVS badges and image elements', () => {
    const handleSelect = vi.fn();
    const handleTogglePlay = vi.fn();

    render(
      <SonicGallery
        tracks={mockTracks}
        activeTrack={mockTracks[0]!}
        isPlaying={false}
        onSelectTrack={handleSelect}
        onTogglePlay={handleTogglePlay}
      />
    );

    // Verify NASA SVS badge rendering
    expect(screen.getByText('NASA SVS #5669')).toBeInTheDocument();
    expect(screen.getByText('NASA SVS #3912')).toBeInTheDocument();

    // Verify image sources
    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('src', '/api/datasets/geos-aerosols/image');
  });

  it('supports keyboard navigation via Enter and Arrow keys', () => {
    const handleSelect = vi.fn();
    const handleTogglePlay = vi.fn();

    render(
      <SonicGallery
        tracks={mockTracks}
        activeTrack={mockTracks[0]!}
        isPlaying={false}
        onSelectTrack={handleSelect}
        onTogglePlay={handleTogglePlay}
      />
    );

    const firstCard = screen.getByLabelText(/Select GEOS AEROSOL OPTICAL THICKNESS/i);
    expect(firstCard).toBeInTheDocument();

    // ArrowRight selects next track
    fireEvent.keyDown(firstCard, { key: 'ArrowRight' });
    expect(handleSelect).toHaveBeenCalledWith(mockTracks[1]);

    // Enter selects active track
    fireEvent.keyDown(firstCard, { key: 'Enter' });
    expect(handleSelect).toHaveBeenCalledWith(mockTracks[0]);
  });
});
