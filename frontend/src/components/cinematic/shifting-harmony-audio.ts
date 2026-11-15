'use client';

import { useAppStore } from '@/stores/app-store';

/**
 * Procedural harmonic drone synthesizer for planetary sonification telemetry.
 * Generates an artistic acoustic representation of planetary frequencies (e.g. 432 Hz, 528 Hz).
 * 
 * Rules:
 * - Lazily initializes AudioContext on explicit user gesture.
 * - Respects global mute state from useAppStore.
 * - Skips/ducks if the main Jukebox console is playing to avoid conflicting audio.
 * - Uses smooth exponential ramps (zero clicks or pops).
 * - Connects to an AnalyserNode so the canvas waveform visualizes the live physical tone.
 * - Fully cleans up Web Audio nodes when done or on unmount.
 */

class ShiftingHarmonyAudioService {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private activeNodes: {
    osc1: OscillatorNode;
    osc2: OscillatorNode;
    gain: GainNode;
    filter: BiquadFilterNode;
  } | null = null;
  private isAuditioning = false;
  private stopTimer: number | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /**
   * Check if main audio console or any media element is actively playing
   */
  private isMainAudioPlaying(): boolean {
    if (typeof document === 'undefined') return false;
    const audios = document.querySelectorAll('audio');
    for (const audio of audios) {
      if (!audio.paused && audio.currentTime > 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns the live AnalyserNode during an audition, or null when idle.
   */
  public getAnalyser(): AnalyserNode | null {
    return this.isAuditioning ? this.analyser : null;
  }

  public getIsAuditioning(): boolean {
    return this.isAuditioning;
  }

  /**
   * Audition a planetary frequency (e.g. 432 Hz).
   */
  public playAudition(
    frequencyInput: string | number,
    duration = 1.8,
    peakGain = 0.18,
    onStateChange?: (isPlaying: boolean) => void
  ): boolean {
    const isMuted = useAppStore.getState().isMuted;
    if (isMuted) {
      return false;
    }

    // Duck or skip if main jukebox is actively streaming
    if (this.isMainAudioPlaying()) {
      return false;
    }

    const freq =
      typeof frequencyInput === 'number'
        ? frequencyInput
        : parseFloat(frequencyInput.replace(/[^\d.]/g, '')) || 432;

    const ctx = this.getContext();
    if (!ctx) return false;

    // Stop any existing audition cleanly
    this.stopAudition();

    const now = ctx.currentTime;
    const attack = 0.15;
    const release = 0.20;
    const sustainEnd = Math.max(attack + 0.1, duration - release);

    try {
      // 1. Fundamental tone (Sine)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      // 2. Harmonic overtone (Triangle, octave higher for warm musical timbre)
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, now);

      // Sub-gain for the harmonic overtone (-12 dB)
      const overtoneGain = ctx.createGain();
      overtoneGain.gain.setValueAtTime(0.25, now);
      osc2.connect(overtoneGain);

      // 3. Lowpass filter for smooth, warm body
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(freq * 3, 3200), now);
      filter.Q.setValueAtTime(1.0, now);

      // 4. Envelope Gain Node (Click-free exponential curves)
      const envGain = ctx.createGain();
      envGain.gain.setValueAtTime(0.0001, now);
      envGain.gain.exponentialRampToValueAtTime(peakGain, now + attack);
      envGain.gain.setValueAtTime(peakGain, now + sustainEnd);
      envGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      // 5. Analyser Node for live canvas visualization
      if (!this.analyser) {
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.85;
      }

      // Graph wiring:
      // [osc1] -------------> [filter] -> [envGain] -> [analyser] -> [destination]
      // [osc2] -> [overtone] -> [filter]
      osc1.connect(filter);
      overtoneGain.connect(filter);
      filter.connect(envGain);
      envGain.connect(this.analyser);
      this.analyser.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration + 0.05);
      osc2.stop(now + duration + 0.05);

      this.activeNodes = { osc1, osc2, gain: envGain, filter };
      this.isAuditioning = true;
      onStateChange?.(true);

      if (this.stopTimer !== null) {
        window.clearTimeout(this.stopTimer);
      }

      this.stopTimer = window.setTimeout(() => {
        this.cleanupNodes();
        this.isAuditioning = false;
        onStateChange?.(false);
      }, (duration + 0.1) * 1000);

      return true;
    } catch {
      this.cleanupNodes();
      this.isAuditioning = false;
      onStateChange?.(false);
      return false;
    }
  }

  /**
   * Stop audition immediately with micro-fadeout
   */
  public stopAudition(onStateChange?: (isPlaying: boolean) => void): void {
    if (this.stopTimer !== null) {
      window.clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }

    if (this.activeNodes && this.ctx && this.ctx.state === 'running') {
      try {
        const now = this.ctx.currentTime;
        this.activeNodes.gain.gain.cancelScheduledValues(now);
        this.activeNodes.gain.gain.setValueAtTime(this.activeNodes.gain.gain.value, now);
        this.activeNodes.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        window.setTimeout(() => {
          this.cleanupNodes();
        }, 60);
      } catch {
        this.cleanupNodes();
      }
    } else {
      this.cleanupNodes();
    }

    this.isAuditioning = false;
    onStateChange?.(false);
  }

  private cleanupNodes(): void {
    if (this.activeNodes) {
      try {
        this.activeNodes.osc1.disconnect();
        this.activeNodes.osc2.disconnect();
        this.activeNodes.gain.disconnect();
        this.activeNodes.filter.disconnect();
      } catch {}
      this.activeNodes = null;
    }
  }

  /**
   * Dispose on unmount
   */
  public dispose(): void {
    this.stopAudition();
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
    this.analyser = null;
  }
}

export const shiftingHarmonyAudio = new ShiftingHarmonyAudioService();
