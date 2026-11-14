'use client';

import { useRef, useCallback, useEffect } from 'react';

/**
 * Procedurally generates an impulse response buffer for the ConvolverNode.
 * Simulates a spacious, diffuse planetary atmosphere without requiring external audio assets.
 */
function createAtmosphericImpulseResponse(ctx: AudioContext, duration = 2.4, decay = 2.0): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / length;
    // Exponential decay curve
    const env = Math.exp(-t * decay);
    // Diffuse stereo white noise with subtle low-frequency modulation
    const noiseL = (Math.random() * 2 - 1) * env;
    const noiseR = (Math.random() * 2 - 1) * env;
    left[i] = noiseL;
    right[i] = noiseR;
  }

  return impulse;
}

export interface AudioGraphControls {
  initGraph: (audioElement: HTMLAudioElement) => void;
  resumeContext: () => Promise<void>;
  setEq: (bass: number, mid: number, high: number) => void;
  setSpacePosition: (x: number, y: number) => void;
  setAtmosphere: (reverbAmount: number) => void;
  setTactile: (enabled: boolean, cutoffHz?: number) => void;
  playDetentTick: () => void;
  playEarcon: (type: 'play' | 'pause' | 'tab' | 'success' | 'alert') => void;
  getFrequencyData: (target: Uint8Array<ArrayBuffer>) => void;
  getAnalyser: () => AnalyserNode | null;
  getStreamDestination: () => MediaStreamAudioDestinationNode | null;
  getAudioContext: () => AudioContext | null;
}

export function useAudioGraph(): AudioGraphControls {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Equalizer nodes
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const highFilterRef = useRef<BiquadFilterNode | null>(null);

  // Spatial audio nodes
  const spaceFilterRef = useRef<BiquadFilterNode | null>(null);
  const pannerRef = useRef<StereoPannerNode | PannerNode | null>(null);

  // Atmospheric reverb nodes
  const convolverRef = useRef<ConvolverNode | null>(null);
  const dryGainRef = useRef<GainNode | null>(null);
  const wetGainRef = useRef<GainNode | null>(null);

  // Tactile sub-bass node
  const tactileFilterRef = useRef<BiquadFilterNode | null>(null);
  const tactileGainRef = useRef<GainNode | null>(null);

  // Master & Analyser nodes
  const analyserRef = useRef<AnalyserNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const streamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Initialize Web Audio Graph once connected to an audio element
  const initGraph = useCallback((audioElement: HTMLAudioElement) => {
    if (audioContextRef.current || !audioElement) return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // 1. Source Node from HTMLAudioElement
      const source = ctx.createMediaElementSource(audioElement);
      sourceRef.current = source;

      // 2. 3-Band Equalizer (BiquadFilterNodes)
      const bass = ctx.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = 250;
      bass.gain.value = 6.0; // Default +6dB around 65% slider
      bassFilterRef.current = bass;

      const mid = ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1000;
      mid.Q.value = 1.0;
      mid.gain.value = 10.0; // Default around 75% slider
      midFilterRef.current = mid;

      const high = ctx.createBiquadFilter();
      high.type = 'highshelf';
      high.frequency.value = 4000;
      high.gain.value = 4.0; // Default around 60% slider
      highFilterRef.current = high;

      // 3. Spatial Filters & Panner
      const spaceFilter = ctx.createBiquadFilter();
      spaceFilter.type = 'lowpass';
      spaceFilter.frequency.value = 18000; // Open by default
      spaceFilter.Q.value = 0.7;
      spaceFilterRef.current = spaceFilter;

      let panner: StereoPannerNode | PannerNode;
      if (ctx.createStereoPanner) {
        panner = ctx.createStereoPanner();
        (panner as StereoPannerNode).pan.value = 0;
      } else {
        panner = ctx.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
      }
      pannerRef.current = panner;

      // 4. Procedural Reverb Convolver Node with Dry/Wet mix
      const convolver = ctx.createConvolver();
      convolver.buffer = createAtmosphericImpulseResponse(ctx, 2.2, 1.8);
      convolverRef.current = convolver;

      const dryGain = ctx.createGain();
      dryGain.gain.value = 0.9;
      dryGainRef.current = dryGain;

      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.15; // Subtle spatial room
      wetGainRef.current = wetGain;

      // 5. Tactile Low-pass Sub Filter for Bass Shakers
      const tactileFilter = ctx.createBiquadFilter();
      tactileFilter.type = 'lowpass';
      tactileFilter.frequency.value = 136; // 136.10 Hz Earth Year Tone
      tactileFilterRef.current = tactileFilter;

      const tactileGain = ctx.createGain();
      tactileGain.gain.value = 0.0; // Disabled by default
      tactileGainRef.current = tactileGain;

      // 6. Analyser Node for phosphor oscilloscope
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.85;
      analyserRef.current = analyser;

      // 7. Master Gain & MediaStream Destination (for recording)
      const masterGain = ctx.createGain();
      masterGain.gain.value = 1.0;
      masterGainRef.current = masterGain;

      const streamDest = ctx.createMediaStreamDestination();
      streamDestRef.current = streamDest;

      // Connect Graph:
      // source -> bass -> mid -> high -> spaceFilter -> panner
      source.connect(bass);
      bass.connect(mid);
      mid.connect(high);
      high.connect(spaceFilter);
      spaceFilter.connect(panner);

      // Reverb Parallel split:
      // panner -> dryGain -> masterGain
      // panner -> convolver -> wetGain -> masterGain
      panner.connect(dryGain);
      panner.connect(convolver);
      convolver.connect(wetGain);

      dryGain.connect(masterGain);
      wetGain.connect(masterGain);

      // Tactile sub-bass parallel path:
      high.connect(tactileFilter);
      tactileFilter.connect(tactileGain);
      tactileGain.connect(masterGain);

      // Master output connections:
      masterGain.connect(analyser);
      analyser.connect(ctx.destination);
      masterGain.connect(streamDest);
    } catch {
      // AudioContext unavailable or blocked by autoplay policy
    }
  }, []);

  // Resume context if suspended
  const resumeContext = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  // Smooth EQ parameter updates with zero clicks/pops
  const setEq = useCallback((bass: number, mid: number, high: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;

    if (bassFilterRef.current) {
      const bassGain = (bass - 50) * 0.4; // Matches existing test formula
      bassFilterRef.current.gain.setTargetAtTime(bassGain, now, 0.03);
    }
    if (midFilterRef.current) {
      const midGain = (mid - 50) * 0.4;
      midFilterRef.current.gain.setTargetAtTime(midGain, now, 0.03);
    }
    if (highFilterRef.current) {
      const highGain = (high - 50) * 0.4;
      highFilterRef.current.gain.setTargetAtTime(highGain, now, 0.03);
    }
  }, []);

  // 2D Spatial Positioning (X: -1 to +1 pan, Y: 0 to 1 atmosphere/filter)
  const setSpacePosition = useCallback((x: number, y: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;

    // Stereo Panning
    if (pannerRef.current) {
      if ('pan' in pannerRef.current) {
        (pannerRef.current as StereoPannerNode).pan.setTargetAtTime(
          Math.max(-1, Math.min(1, x)),
          now,
          0.05
        );
      } else {
        const p = pannerRef.current as PannerNode;
        p.positionX.setTargetAtTime(x * 3, now, 0.05);
      }
    }

    // Y Axis controls atmospheric high frequency damping (Surface = 20kHz, Stratosphere = 2.5kHz)
    if (spaceFilterRef.current) {
      const cutoff = 2500 + (1 - y) * 16500;
      spaceFilterRef.current.frequency.setTargetAtTime(cutoff, now, 0.05);
    }
  }, []);

  // Atmosphere Reverb wet/dry mix (0 = dry, 1 = maximum spatial diffusion)
  const setAtmosphere = useCallback((reverbAmount: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const clamped = Math.max(0, Math.min(1, reverbAmount));

    if (wetGainRef.current) {
      wetGainRef.current.gain.setTargetAtTime(clamped * 0.65, now, 0.05);
    }
    if (dryGainRef.current) {
      dryGainRef.current.gain.setTargetAtTime(1.0 - clamped * 0.35, now, 0.05);
    }
  }, []);

  // Tactile sub-bass transducer control
  const setTactile = useCallback((enabled: boolean, cutoffHz = 136) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;

    if (tactileFilterRef.current) {
      tactileFilterRef.current.frequency.setTargetAtTime(cutoffHz, now, 0.05);
    }
    if (tactileGainRef.current) {
      tactileGainRef.current.gain.setTargetAtTime(enabled ? 0.8 : 0.0, now, 0.05);
    }
  }, []);

  // Procedural detent tick sound (subtle click for slider steps and buttons)
  const playDetentTick = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state === 'suspended') return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.015);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.02);
    } catch {
      // Ignore click error
    }
  }, []);

  // Procedural musical earcons for non-visual feedback
  const playEarcon = useCallback((type: 'play' | 'pause' | 'tab' | 'success' | 'alert') => {
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state === 'suspended') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'play') {
        // Ascending harmonic fifth (272.2 Hz -> 408.3 Hz: based on 136.10 Hz Year Tone harmonics)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(272.2, now);
        osc.frequency.exponentialRampToValueAtTime(408.3, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      } else if (type === 'pause') {
        // Descending subtle tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(408.3, now);
        osc.frequency.exponentialRampToValueAtTime(272.2, now + 0.12);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      } else if (type === 'tab') {
        // Crisp clean switch pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      } else if (type === 'success') {
        // Bright major chord chime (544 Hz -> 680 Hz -> 816 Hz)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(544.4, now);
        osc.frequency.setValueAtTime(680.5, now + 0.07);
        osc.frequency.setValueAtTime(816.6, now + 0.14);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      } else {
        // Alert
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Ignore earcon error
    }
  }, []);

  const getFrequencyData = useCallback((target: Uint8Array<ArrayBuffer>) => {
    if (analyserRef.current) {
      analyserRef.current.getByteFrequencyData(target);
    }
  }, []);

  const getAnalyser = useCallback(() => analyserRef.current, []);
  const getStreamDestination = useCallback(() => streamDestRef.current, []);
  const getAudioContext = useCallback(() => audioContextRef.current, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    initGraph,
    resumeContext,
    setEq,
    setSpacePosition,
    setAtmosphere,
    setTactile,
    playDetentTick,
    playEarcon,
    getFrequencyData,
    getAnalyser,
    getStreamDestination,
    getAudioContext,
  };
}
