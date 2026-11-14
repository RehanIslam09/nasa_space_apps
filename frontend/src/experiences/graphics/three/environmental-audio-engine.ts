/**
 * NASA Environmental Sonification Engine
 *
 * Implements a procedural Web Audio API synthesizer that translates
 * genuine NASA environmental satellite telemetry into dynamic acoustic soundscapes:
 *
 * Mappings:
 * - Biome & Ecosystem -> Fundamental Root Frequency & Waveform Architecture
 * - Nighttime Radiance (VIIRS DNB) -> Pulse Rate & Harmonic Carrier Brightness
 * - Vegetation Index / Canopy Structure (GEDI / MODIS) -> Harmonic Density & Resonant Filter Q
 * - Temperature Anomaly (MODIS SST / MERRA-2) -> Pitch Modulation & Thermal Tremolo
 * - Aerosol Optical Depth (GEOS-FP) -> Granular Noise Texture & Resonant Bandpass
 * - Temporal Mode (2012 vs 2023 vs Diff) -> Decadal Delta Shift Sonification
 *
 * Lifecycle:
 * - Singleton AudioContext with safe user-gesture unlock.
 * - Anti-pop exponential gain envelopes.
 * - AnalyserNode for real-time frequency spectrum & waveform visualization.
 */

import type { GeographicLocationIntelligence } from './environmental-data';

export type TemporalSonificationMode = '2012' | '2023' | 'diff';

interface ActiveSynthVoice {
  rootOsc: OscillatorNode;
  harmonicOsc1: OscillatorNode;
  harmonicOsc2: OscillatorNode;
  lfoOsc?: OscillatorNode;
  lfoGain?: GainNode;
  filter: BiquadFilterNode;
  noiseSource?: AudioBufferSourceNode;
  noiseFilter?: BiquadFilterNode;
  noiseGain?: GainNode;
  voiceGain: GainNode;
}

export class EnvironmentalSonificationEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private activeVoice: ActiveSynthVoice | null = null;
  private noiseBufferPink: AudioBuffer | null = null;
  private noiseBufferWhite: AudioBuffer | null = null;

  private _isPlaying = false;
  private _currentLocation: GeographicLocationIntelligence | null = null;
  private _temporalMode: TemporalSonificationMode = '2023';
  private _volume = 0.75;
  private onStateChangeListeners: Array<(isPlaying: boolean) => void> = [];

  constructor() {
    // Lazy initialization on first user interaction
  }

  private initAudioContext(): boolean {
    if (typeof window === 'undefined') return false;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtx) return false;

      this.ctx = new AudioCtx();

      // Master Gain Node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this._volume, this.ctx.currentTime);

      // Real-time Analyser Node for Visualizers
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.85;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      // Pre-generate noise buffers
      this.noiseBufferWhite = this.generateWhiteNoiseBuffer(this.ctx);
      this.noiseBufferPink = this.generatePinkNoiseBuffer(this.ctx);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return true;
  }

  private generateWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds looping buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private generatePinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  /**
   * Starts sonifying a given geographical location with authentic parameters.
   */
  public async play(
    location: GeographicLocationIntelligence,
    temporalMode: TemporalSonificationMode = this._temporalMode
  ): Promise<boolean> {
    if (!this.initAudioContext() || !this.ctx || !this.masterGain) return false;

    this._currentLocation = location;
    this._temporalMode = temporalMode;

    const now = this.ctx.currentTime;

    // Smoothly crossfade from existing voice
    if (this.activeVoice) {
      const prevVoice = this.activeVoice;
      prevVoice.voiceGain.gain.setValueAtTime(prevVoice.voiceGain.gain.value, now);
      prevVoice.voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      setTimeout(() => {
        try {
          prevVoice.rootOsc.stop();
          prevVoice.harmonicOsc1.stop();
          prevVoice.harmonicOsc2.stop();
          prevVoice.lfoOsc?.stop();
          prevVoice.noiseSource?.stop();
        } catch {}
      }, 70);
    }

    // Build fresh procedural synth voice for the selected biome and telemetry
    this.activeVoice = this.createVoice(location, temporalMode, now);
    this._isPlaying = true;
    this.notifyListeners(true);

    return true;
  }

  private createVoice(
    location: GeographicLocationIntelligence,
    mode: TemporalSonificationMode,
    startTime: number
  ): ActiveSynthVoice {
    const ctx = this.ctx!;
    const p = location.sonification;
    const m = location.metrics;

    // 1. Calculate Telemetry Modulations
    const is2012 = mode === '2012';
    const isDiff = mode === 'diff';

    // Radiance modulation
    const radiance = is2012 ? m.nightlightRadiance2012 : m.nightlightRadiance2023;
    const radianceFactor = Math.min(2.5, Math.max(0.1, radiance / 10.0));

    // Vegetation modulation
    const vegIndex = is2012
      ? m.vegetationIndex2012 ?? 0.5
      : m.vegetationIndex2023 ?? 0.5;

    // Thermal anomaly modulation
    const tempAnom = m.temperatureAnomaly ?? 0.0;
    const thermalDetune = tempAnom * 14.0; // cents of detune

    // Base Frequency adjustments for temporal mode
    let baseFreq = p.baseFrequency;
    if (isDiff) {
      // In diff mode, frequency reflects the delta magnitude and direction
      const delta = m.nightlightDeltaPercent;
      baseFreq *= delta > 0 ? 1.15 : 0.85;
    } else if (is2012) {
      baseFreq *= 0.98; // slight baseline reference tuning
    }

    // 2. Voice Master Gain
    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, startTime);
    voiceGain.gain.exponentialRampToValueAtTime(0.85, startTime + 0.08);

    // 3. Multi-mode Resonant Filter
    const filter = ctx.createBiquadFilter();
    let filterType: BiquadFilterType = 'lowpass';
    let filterCutoff = baseFreq * (2.5 + p.spectralBrightness * 4.0);

    if (p.biome === 'cryosphere') {
      filterType = 'highpass';
      filterCutoff = is2012 ? 450 : 620; // Ice retreat lifts high-pass floor
    } else if (p.biome === 'rainforest') {
      filterType = 'bandpass';
      filterCutoff = 350 + vegIndex * 900;
    } else if (p.biome === 'desert') {
      filterType = 'bandpass';
      filterCutoff = 220 + (m.aerosolOpticalDepth ?? 0.5) * 450;
    } else if (p.biome === 'oceanic') {
      filterType = 'lowpass';
      filterCutoff = 380 + (m.aerosolOpticalDepth ?? 0.3) * 300;
    }

    filter.type = filterType;
    filter.frequency.setValueAtTime(filterCutoff, startTime);
    filter.Q.setValueAtTime(2.0 + p.filterModulation * 5.0, startTime);

    // 4. Fundamental Root Oscillator
    const rootOsc = ctx.createOscillator();
    rootOsc.type = p.biome === 'urban' ? 'sawtooth' : p.biome === 'desert' ? 'triangle' : 'sine';
    rootOsc.frequency.setValueAtTime(baseFreq, startTime);
    rootOsc.detune.setValueAtTime(thermalDetune, startTime);

    // 5. First Harmonic Partial (Overtone)
    const harmonicOsc1 = ctx.createOscillator();
    harmonicOsc1.type = 'sine';
    harmonicOsc1.frequency.setValueAtTime(baseFreq * 2.0, startTime);
    const harmonicGain1 = ctx.createGain();
    const h1Vol = p.harmonicDensity * (0.2 + vegIndex * 0.4);
    harmonicGain1.gain.setValueAtTime(h1Vol, startTime);

    // 6. Second Harmonic Partial (Fifth / Upper Sparkle)
    const harmonicOsc2 = ctx.createOscillator();
    harmonicOsc2.type = 'sine';
    harmonicOsc2.frequency.setValueAtTime(baseFreq * (isDiff ? 3.14 : 3.0), startTime);
    const harmonicGain2 = ctx.createGain();
    const h2Vol = p.harmonicDensity * 0.18 * radianceFactor;
    harmonicGain2.gain.setValueAtTime(h2Vol, startTime);

    // 7. LFO Pulse / Nightlight Rhythmic Modulation
    let lfoOsc: OscillatorNode | undefined;
    let lfoGain: GainNode | undefined;
    if (p.pulseRate > 0.05) {
      lfoOsc = ctx.createOscillator();
      lfoGain = ctx.createGain();
      const pulseSpeed = isDiff ? p.pulseRate * 1.5 : p.pulseRate * (0.8 + radianceFactor * 0.4);
      lfoOsc.frequency.setValueAtTime(pulseSpeed, startTime);
      lfoGain.gain.setValueAtTime(0.25, startTime);

      lfoOsc.connect(lfoGain);
      lfoGain.connect(voiceGain.gain);
      lfoOsc.start(startTime);
    }

    // Connect oscillators to filter
    rootOsc.connect(filter);
    harmonicOsc1.connect(harmonicGain1);
    harmonicGain1.connect(filter);
    harmonicOsc2.connect(harmonicGain2);
    harmonicGain2.connect(filter);

    // 8. Procedural Noise Channel (Wind, Forest Flutter, Sea Spray)
    let noiseSource: AudioBufferSourceNode | undefined;
    let noiseFilter: BiquadFilterNode | undefined;
    let noiseGain: GainNode | undefined;

    if (p.noiseType !== 'none' && p.noiseGain > 0.01) {
      const buf = p.noiseType === 'pink' ? this.noiseBufferPink : this.noiseBufferWhite;
      if (buf) {
        noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buf;
        noiseSource.loop = true;

        noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = p.biome === 'oceanic' ? 'bandpass' : 'lowpass';
        noiseFilter.frequency.setValueAtTime(600 + (m.aerosolOpticalDepth ?? 0.2) * 800, startTime);

        noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(p.noiseGain * 0.45, startTime);

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(filter);

        noiseSource.start(startTime);
      }
    }

    // Route filter output to voice gain and master gain
    filter.connect(voiceGain);
    voiceGain.connect(this.masterGain!);

    // Start oscillators
    rootOsc.start(startTime);
    harmonicOsc1.start(startTime);
    harmonicOsc2.start(startTime);

    return {
      rootOsc,
      harmonicOsc1,
      harmonicOsc2,
      lfoOsc,
      lfoGain,
      filter,
      noiseSource,
      noiseFilter,
      noiseGain,
      voiceGain,
    };
  }

  public pause(): void {
    if (!this.ctx || !this._isPlaying || !this.activeVoice) return;
    const now = this.ctx.currentTime;
    this.activeVoice.voiceGain.gain.setValueAtTime(this.activeVoice.voiceGain.gain.value, now);
    this.activeVoice.voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    this._isPlaying = false;
    this.notifyListeners(false);
  }

  public resume(): void {
    if (!this.ctx || this._isPlaying || !this._currentLocation) return;
    this.play(this._currentLocation, this._temporalMode);
  }

  public stop(): void {
    this.pause();
    this._currentLocation = null;
  }

  public setVolume(volume: number): void {
    this._volume = Math.max(0.0, Math.min(1.0, volume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this._volume, this.ctx.currentTime);
    }
  }

  public setTemporalMode(mode: TemporalSonificationMode): void {
    if (this._temporalMode === mode) return;
    this._temporalMode = mode;
    if (this._isPlaying && this._currentLocation) {
      this.play(this._currentLocation, mode);
    }
  }

  public getByteFrequencyData(array: Uint8Array): void {
    if (this.analyser && this._isPlaying) {
      // Cast array for compatibility with modern DOM type definitions
      this.analyser.getByteFrequencyData(array as unknown as Uint8Array<ArrayBuffer>);
    } else {
      array.fill(0);
    }
  }

  public getByteTimeDomainData(array: Uint8Array): void {
    if (this.analyser && this._isPlaying) {
      this.analyser.getByteTimeDomainData(array as unknown as Uint8Array<ArrayBuffer>);
    } else {
      array.fill(128); // 128 is center in 8-bit time-domain
    }
  }

  public subscribe(listener: (isPlaying: boolean) => void): () => void {
    this.onStateChangeListeners.push(listener);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(isPlaying: boolean): void {
    this.onStateChangeListeners.forEach((l) => l(isPlaying));
  }

  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  public get currentLocation(): GeographicLocationIntelligence | null {
    return this._currentLocation;
  }

  public get currentTemporalMode(): TemporalSonificationMode {
    return this._temporalMode;
  }

  public get volume(): number {
    return this._volume;
  }

  public dispose(): void {
    this.stop();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.onStateChangeListeners = [];
  }
}

// Global Singleton Instance
export const environmentalAudioEngine = new EnvironmentalSonificationEngine();
