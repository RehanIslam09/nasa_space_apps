'use client';

import { useEffect, useRef } from 'react';
import type { SonicTrackConfig } from '@/config/earth-song.config';

interface ConsoleVisualizerProps {
  activeTrack: SonicTrackConfig;
  isPlaying: boolean;
  isMuted: boolean;
  getFrequencyData: (data: Uint8Array<ArrayBuffer>) => void;
  customMixActive?: boolean;
  spaceX?: number;
  spaceY?: number;
}

export function ConsoleVisualizer({
  activeTrack,
  isPlaying,
  isMuted,
  getFrequencyData,
  customMixActive = false,
  spaceX = 0,
  spaceY = 0,
}: ConsoleVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate plain-language description for screen readers and low-vision users
  const getNowHearingDescription = () => {
    if (!isPlaying) {
      return `Resting state · ${activeTrack.title} ready to sonify (${activeTrack.frequency})`;
    }
    if (isMuted) {
      return `Soundscape muted · Planetary telemetry active`;
    }
    const spatialDesc =
      Math.abs(spaceX) > 0.3
        ? spaceX < 0
          ? 'panned west'
          : 'panned east'
        : 'centered orbit';
    const altitudeDesc = spaceY > 0.5 ? 'upper atmospheric filter' : 'surface troposphere';
    return `${activeTrack.frequency} resonance · ${spatialDesc} · ${altitudeDesc}${
      customMixActive ? ' · custom synthesized cadence' : ''
    }`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;
    const freqData = new Uint8Array(64);

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const isAudible = isPlaying && !isMuted;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width === 0 || height === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Read real audio frequency data if audible
      if (isAudible) {
        getFrequencyData(freqData);
      } else {
        freqData.fill(0);
      }

      // Compute average volume / energy
      const avgVol = isAudible
        ? freqData.reduce((acc, v) => acc + v, 0) / freqData.length
        : 0;

      // ─────────────────────────────────────────────────────────────
      // 1. CELESTIAL BACKGROUND GRID & POLAR COORDINATE RINGS
      // ─────────────────────────────────────────────────────────────
      const centerX = width * 0.38;
      const centerY = height * 0.5;
      const baseRadius = Math.min(width * 0.32, height * 0.38);

      // Faint orbital rings
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.45, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // ─────────────────────────────────────────────────────────────
      // 2. RADIAL ORBITAL FREQUENCY SPOKES (Planetary Harmonic Ring)
      // ─────────────────────────────────────────────────────────────
      const spokes = 56;
      const angleStep = (Math.PI * 2) / spokes;

      for (let i = 0; i < spokes; i++) {
        const angle = i * angleStep + phase * 0.12;
        const freqVal = freqData[i % freqData.length] || 0;

        // Idle harmonic breathing when paused/muted vs active audio height
        const idleBreathingSpoke = Math.sin(phase * 1.5 + i * 0.2) * 5 + 6;
        const spokeLen = isAudible
          ? (freqVal / 255) * (baseRadius * 0.9) + 4
          : idleBreathingSpoke;

        const x1 = centerX + Math.cos(angle) * (baseRadius * 0.65);
        const y1 = centerY + Math.sin(angle) * (baseRadius * 0.65);
        const x2 = centerX + Math.cos(angle) * (baseRadius * 0.65 + spokeLen);
        const y2 = centerY + Math.sin(angle) * (baseRadius * 0.65 + spokeLen);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = isAudible
          ? activeTrack.color.accent
          : 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = isAudible ? 1.6 : 1.0;
        ctx.shadowColor = activeTrack.color.glow;
        ctx.shadowBlur = isAudible ? 8 : 4;
        ctx.stroke();
      }

      // Inner Core Planetary Ring
      const corePulse = isAudible
        ? (avgVol / 255) * 8
        : Math.sin(phase * 1.2) * 2.5;

      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.52 + corePulse, 0, Math.PI * 2);
      ctx.strokeStyle = isAudible
        ? 'rgba(255, 255, 255, 0.65)'
        : 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1.4;
      ctx.shadowBlur = isAudible ? 10 : 3;
      ctx.shadowColor = activeTrack.color.glow;
      ctx.stroke();

      // ─────────────────────────────────────────────────────────────
      // 3. CONTINUOUS PHOSPHOR WAVEFORM RIBBON (Oscilloscope Stream)
      // ─────────────────────────────────────────────────────────────
      const waveStartX = width * 0.68;
      const waveWidth = width * 0.28;
      const waveMidY = height * 0.5;
      const waveSteps = 48;

      ctx.beginPath();
      for (let i = 0; i <= waveSteps; i++) {
        const wx = waveStartX + (i / waveSteps) * waveWidth;
        const sampleIdx = Math.floor((i / waveSteps) * 32);
        const sampleVal = (freqData[sampleIdx] || 0) / 255;

        // Continuous subtle wave motion when idle so screen never feels dead
        const idleWave = Math.sin(phase * 2.2 + i * 0.3) * (height * 0.08);
        const activeWave =
          Math.sin(phase * 3.5 + i * 0.4) * (sampleVal * (height * 0.34));

        const wy = isAudible ? waveMidY + activeWave : waveMidY + idleWave;

        if (i === 0) {
          ctx.moveTo(wx, wy);
        } else {
          ctx.lineTo(wx, wy);
        }
      }

      ctx.strokeStyle = isAudible ? activeTrack.color.accent : 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = isAudible ? 2.0 : 1.2;
      ctx.shadowColor = activeTrack.color.glow;
      ctx.shadowBlur = isAudible ? 10 : 4;
      ctx.stroke();

      // Reset shadow blur
      ctx.shadowBlur = 0;

      phase += isAudible ? 0.045 : 0.02;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTrack, isPlaying, isMuted, getFrequencyData]);

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-black/60 p-4 shadow-xl backdrop-blur-xl">
      {/* Top telemetry status indicators */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 font-mono text-[10px] tracking-wider text-slate-400">
        <div className="flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${
              isPlaying && !isMuted
                ? 'animate-pulse bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : 'bg-sky-400/70'
            }`}
          />
          <span className="font-semibold uppercase text-slate-200">
            {isPlaying && !isMuted ? 'Real-Time DSP Analyser' : 'Standing Orbit Monitor'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sky-300">{activeTrack.frequency}</span>
          {customMixActive && (
            <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-bold text-sky-300 border border-sky-400/30">
              CUSTOM MIX
            </span>
          )}
        </div>
      </div>

      {/* High-DPI Phosphor Canvas */}
      <div className="relative my-3 flex-1 min-h-[190px] w-full overflow-hidden rounded-xl bg-gradient-to-b from-sky-950/20 via-black/80 to-black/90">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
        />
        {/* Subtle grid line overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Accessible "Now Hearing" Plain-Language Caption for Screen Readers & Visual Display */}
      <div className="rounded-lg border border-white/[0.06] bg-black/40 px-3 py-2">
        <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-sky-400">
          <span className="font-bold">Now Hearing:</span>
        </div>
        <p
          aria-label="Current acoustic soundscape description"
          className="mt-0.5 text-xs text-slate-300 leading-snug line-clamp-2"
        >
          {getNowHearingDescription()}
        </p>
      </div>
    </div>
  );
}
