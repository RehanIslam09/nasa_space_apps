import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  EnvironmentalSonificationEngine,
} from './environmental-audio-engine';
import { NASA_ANCHOR_STATIONS } from './environmental-data';

describe('Environmental Sonification Engine', () => {
  let engine: EnvironmentalSonificationEngine;

  beforeEach(() => {
    engine = new EnvironmentalSonificationEngine();
  });

  afterEach(() => {
    engine.dispose();
  });

  it('initializes in an idle, non-playing state', () => {
    expect(engine.isPlaying).toBe(false);
    expect(engine.currentLocation).toBeNull();
    expect(engine.volume).toBe(0.75);
    expect(engine.currentTemporalMode).toBe('2023');
  });

  it('clamps volume safely within [0.0, 1.0]', () => {
    engine.setVolume(1.5);
    expect(engine.volume).toBe(1.0);

    engine.setVolume(-0.5);
    expect(engine.volume).toBe(0.0);

    engine.setVolume(0.42);
    expect(engine.volume).toBe(0.42);
  });

  it('updates temporal mode and stores state', () => {
    engine.setTemporalMode('2012');
    expect(engine.currentTemporalMode).toBe('2012');

    engine.setTemporalMode('diff');
    expect(engine.currentTemporalMode).toBe('diff');
  });

  it('handles zeroed frequency and waveform buffers when idle', () => {
    const freq = new Uint8Array(32);
    const time = new Uint8Array(32);

    engine.getByteFrequencyData(freq);
    engine.getByteTimeDomainData(time);

    expect(freq.every((v) => v === 0)).toBe(true);
    expect(time.every((v) => v === 128)).toBe(true);
  });

  it('notifies subscribers on state changes', () => {
    const listener = vi.fn();
    const unsubscribe = engine.subscribe(listener);

    // Call private notify or trigger state change
    (engine as unknown as { notifyListeners: (s: boolean) => void }).notifyListeners(true);
    expect(listener).toHaveBeenCalledWith(true);

    unsubscribe();
    (engine as unknown as { notifyListeners: (s: boolean) => void }).notifyListeners(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('handles play calls with mock Web Audio API gracefully', async () => {
    const mockAmazon = NASA_ANCHOR_STATIONS[0]!;

    // Mock AudioContext constructor for jsdom
    function MockAudioContext() {
      return {
        currentTime: 0,
        state: 'running',
        sampleRate: 44100,
        destination: {},
        createGain: () => ({
          gain: {
            value: 1,
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        }),
        createAnalyser: () => ({
          fftSize: 64,
          smoothingTimeConstant: 0.8,
          connect: vi.fn(),
          getByteFrequencyData: vi.fn(),
          getByteTimeDomainData: vi.fn(),
        }),
        createOscillator: () => ({
          type: 'sine',
          frequency: { setValueAtTime: vi.fn() },
          detune: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        }),
        createBiquadFilter: () => ({
          type: 'lowpass',
          frequency: { setValueAtTime: vi.fn() },
          Q: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
        }),
        createBuffer: () => ({
          getChannelData: () => new Float32Array(100),
        }),
        createBufferSource: () => ({
          buffer: null,
          loop: true,
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        }),
        resume: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };
    }

    (window as unknown as { AudioContext: unknown }).AudioContext = MockAudioContext;

    const played = await engine.play(mockAmazon, '2023');
    expect(played).toBe(true);
    expect(engine.isPlaying).toBe(true);
    expect(engine.currentLocation?.id).toBe('amazon-basin');

    engine.pause();
    expect(engine.isPlaying).toBe(false);

    engine.resume();
    expect(engine.isPlaying).toBe(true);

    engine.stop();
    expect(engine.isPlaying).toBe(false);
    expect(engine.currentLocation).toBeNull();
  });
});
