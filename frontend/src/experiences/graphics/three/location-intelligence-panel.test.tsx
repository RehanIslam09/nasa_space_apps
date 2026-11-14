import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { LocationIntelligencePanel } from './location-intelligence-panel';
import { NASA_ANCHOR_STATIONS } from './environmental-data';
import { environmentalAudioEngine } from './environmental-audio-engine';

describe('LocationIntelligencePanel', () => {
  const sampleLocation = NASA_ANCHOR_STATIONS[0]!;

  it('renders location name, region, coordinates, and observation signal', () => {
    const handleClose = vi.fn();
    render(
      <LocationIntelligencePanel
        location={sampleLocation}
        onClose={handleClose}
        selectedPhase="b"
      />
    );

    expect(screen.getByText(sampleLocation.name)).toBeInTheDocument();
    expect(screen.getByText(sampleLocation.region)).toBeInTheDocument();
    expect(screen.getByText(/3.4653° S, 62.2159° W/)).toBeInTheDocument();
    expect(screen.getByText(sampleLocation.environmentalSignal)).toBeInTheDocument();
    expect(screen.getByText(/Amazon Basin/)).toBeInTheDocument();
  });

  it('displays authentic 2012 and 2023 radiance metrics with delta percentage', () => {
    render(
      <LocationIntelligencePanel
        location={sampleLocation}
        onClose={vi.fn()}
        selectedPhase="b"
      />
    );

    expect(screen.getByText('2012 Radiance')).toBeInTheDocument();
    expect(screen.getByText('2023 Radiance')).toBeInTheDocument();
    expect(screen.getByText('Decadal Shift')).toBeInTheDocument();
    expect(screen.getByText(/\+216.7%/)).toBeInTheDocument();
  });

  it('toggles sonification play and pause on user button click', () => {
    const playSpy = vi.spyOn(environmentalAudioEngine, 'play').mockResolvedValue(true);
    const pauseSpy = vi.spyOn(environmentalAudioEngine, 'pause');

    render(
      <LocationIntelligencePanel
        location={sampleLocation}
        onClose={vi.fn()}
        selectedPhase="b"
      />
    );

    const playBtn = screen.getByRole('button', { name: /Play Sonification/i });
    fireEvent.click(playBtn);
    expect(playSpy).toHaveBeenCalled();

    playSpy.mockRestore();
    pauseSpy.mockRestore();
  });

  it('triggers temporal mode selection and notifies onPhaseChange', () => {
    const handlePhaseChange = vi.fn();
    render(
      <LocationIntelligencePanel
        location={sampleLocation}
        onClose={vi.fn()}
        selectedPhase="b"
        onPhaseChange={handlePhaseChange}
      />
    );

    const btn2012 = screen.getByRole('button', { name: /Sonify 2012 Baseline/i });
    fireEvent.click(btn2012);
    expect(handlePhaseChange).toHaveBeenCalledWith('a');

    const btnDiff = screen.getByRole('button', { name: /Sonify Dual-Phase Comparative Delta/i });
    fireEvent.click(btnDiff);
    expect(handlePhaseChange).toHaveBeenCalledWith('diff');
  });

  it('calls onClose when clicking the dismiss button', () => {
    const handleClose = vi.fn();
    render(
      <LocationIntelligencePanel
        location={sampleLocation}
        onClose={handleClose}
        selectedPhase="b"
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Dismiss Location Intelligence Panel/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
