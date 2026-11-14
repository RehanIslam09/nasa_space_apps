'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  X,
  Radio,
  Activity,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  formatCoordinates,
  formatCoordinatesDMS,
} from './geographic-picking';
import type { GeographicLocationIntelligence } from './environmental-data';
import {
  environmentalAudioEngine,
  type TemporalSonificationMode,
} from './environmental-audio-engine';

export interface LocationIntelligencePanelProps {
  location: GeographicLocationIntelligence;
  onClose: () => void;
  selectedPhase: 'a' | 'b' | 'diff';
  onPhaseChange?: (phase: 'a' | 'b' | 'diff') => void;
  className?: string;
}

/**
 * Compact Tactical Location Intelligence Panel
 *
 * Inspired by NASA Mission Control telemetry and Call of Duty tactical interfaces.
 * Displays genuine satellite observation metrics, provenance, and integrates
 * interactive Web Audio sonification with live frequency visualization.
 */
export function LocationIntelligencePanel({
  location,
  onClose,
  selectedPhase,
  onPhaseChange,
  className = '',
}: LocationIntelligencePanelProps) {
  const [isPlaying, setIsPlaying] = useState(environmentalAudioEngine.isPlaying);
  const [volume, setVolume] = useState(environmentalAudioEngine.volume);
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef(volume);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Map parent selectedPhase to temporal audio mode
  const currentMode: TemporalSonificationMode =
    selectedPhase === 'a' ? '2012' : selectedPhase === 'b' ? '2023' : 'diff';

  // Subscribe to audio engine state changes
  useEffect(() => {
    const unsub = environmentalAudioEngine.subscribe((playing) => {
      setIsPlaying(playing);
    });
    return unsub;
  }, []);

  // Synchronize audio engine with selectedPhase or location changes
  useEffect(() => {
    if (isPlaying) {
      environmentalAudioEngine.play(location, currentMode);
    }
  }, [location, currentMode, isPlaying]);

  // Handle Play/Pause toggle
  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      environmentalAudioEngine.pause();
    } else {
      await environmentalAudioEngine.play(location, currentMode);
    }
  }, [isPlaying, location, currentMode]);

  // Handle Volume change
  const handleVolumeChange = useCallback((newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    environmentalAudioEngine.setVolume(newVol);
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      const restored = prevVolumeRef.current > 0 ? prevVolumeRef.current : 0.75;
      setVolume(restored);
      setIsMuted(false);
      environmentalAudioEngine.setVolume(restored);
    } else {
      prevVolumeRef.current = volume;
      setVolume(0);
      setIsMuted(true);
      environmentalAudioEngine.setVolume(0);
    }
  }, [isMuted, volume]);

  // Handle Temporal Mode Selection
  const handleModeSelect = useCallback((mode: TemporalSonificationMode) => {
    const nextPhase: 'a' | 'b' | 'diff' =
      mode === '2012' ? 'a' : mode === '2023' ? 'b' : 'diff';
    if (onPhaseChange) {
      onPhaseChange(nextPhase);
    }
    environmentalAudioEngine.setTemporalMode(mode);
  }, [onPhaseChange]);

  // Live Canvas Audio Waveform / Spectrum Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const buffer = new Uint8Array(32);

    const render = () => {
      environmentalAudioEngine.getByteFrequencyData(buffer);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / 32;
      const accent = currentMode === 'diff' ? '#fbbf24' : '#38bdf8';

      for (let i = 0; i < 32; i++) {
        const rawByte = buffer[i] ?? 0;
        const val = isPlaying ? rawByte / 255.0 : 0.05 + Math.sin(i * 0.4) * 0.03;
        const barHeight = Math.max(2, val * canvas.height);
        const x = i * barWidth;
        const y = canvas.height - barHeight;

        ctx.fillStyle = isPlaying ? accent : 'rgba(148, 163, 184, 0.35)';
        ctx.fillRect(x, y, barWidth - 1, barHeight);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, currentMode]);

  const { lat, lon } = location.coordinates;
  const coordsFormatted = formatCoordinates(lat, lon);
  const coordsDms = formatCoordinatesDMS(lat, lon);
  const m = location.metrics;

  return (
    <div
      role="region"
      aria-label={`Planetary Intelligence: ${location.name}`}
      className={`pointer-events-auto absolute right-3.5 bottom-3.5 top-auto z-30 w-[calc(100%-28px)] max-w-sm sm:max-w-md md:bottom-auto md:top-3.5 rounded-2xl border border-cyan-500/25 bg-black/85 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-300 ${className}`}
    >
      {/* 1. Tactical Header */}
      <div className="flex items-start justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-cyan-500" />
          </span>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-300">
            Target Acquired // {coordsDms}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss Location Intelligence Panel"
          className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* 2. Target Name & Geodesic Meta */}
      <div className="mt-2.5">
        <h4 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
          {location.name}
        </h4>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[10px] text-slate-400">
          <span>{location.region}</span>
          <span>•</span>
          <span className="text-cyan-400">{coordsFormatted}</span>
        </div>
      </div>

      {/* 3. Scientific Observation Signal */}
      <div className="mt-2.5 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
        <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-amber-400">
          <Activity className="size-3" />
          <span>Status: {location.environmentalStatus}</span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">
          {location.environmentalSignal}
        </p>
      </div>

      {/* 4. Telemetry Metrics Matrix */}
      <div className="mt-2.5 grid grid-cols-3 gap-1.5 font-mono text-center">
        <div className="rounded-lg border border-white/5 bg-black/40 p-1.5">
          <div className="text-[8px] uppercase tracking-widest text-slate-400">
            2012 Radiance
          </div>
          <div className="mt-0.5 text-xs font-bold text-sky-300">
            {m.nightlightRadiance2012.toFixed(1)} <span className="text-[8px]">nW</span>
          </div>
        </div>

        <div className="rounded-lg border border-white/5 bg-black/40 p-1.5">
          <div className="text-[8px] uppercase tracking-widest text-slate-400">
            2023 Radiance
          </div>
          <div className="mt-0.5 text-xs font-bold text-amber-300">
            {m.nightlightRadiance2023.toFixed(1)} <span className="text-[8px]">nW</span>
          </div>
        </div>

        <div className="rounded-lg border border-white/5 bg-black/40 p-1.5">
          <div className="text-[8px] uppercase tracking-widest text-slate-400">
            Decadal Shift
          </div>
          <div
            className={`mt-0.5 text-xs font-bold ${
              m.nightlightDeltaPercent > 0 ? 'text-amber-400' : 'text-cyan-400'
            }`}
          >
            {m.nightlightDeltaPercent > 0 ? '+' : ''}
            {m.nightlightDeltaPercent}%
          </div>
        </div>
      </div>

      {/* 5. Live Environmental Sonification Console */}
      <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-cyan-300">
            <Radio className={`size-3 ${isPlaying ? 'animate-pulse text-cyan-400' : ''}`} />
            <span>Sonic Signature: {location.sonification.biome}</span>
          </div>

          {/* Temporal Period Toggles */}
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/60 p-0.5 font-mono text-[9px]">
            <button
              type="button"
              onClick={() => handleModeSelect('2012')}
              aria-label="Sonify 2012 Baseline"
              className={`rounded-full px-2 py-0.5 transition-all ${
                currentMode === '2012'
                  ? 'bg-sky-500/40 text-sky-200 shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2012
            </button>
            <button
              type="button"
              onClick={() => handleModeSelect('2023')}
              aria-label="Sonify 2023 Modern"
              className={`rounded-full px-2 py-0.5 transition-all ${
                currentMode === '2023'
                  ? 'bg-amber-500/40 text-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2023
            </button>
            <button
              type="button"
              onClick={() => handleModeSelect('diff')}
              aria-label="Sonify Dual-Phase Comparative Delta"
              className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 transition-all ${
                currentMode === 'diff'
                  ? 'bg-emerald-500/40 text-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="size-2 text-emerald-300" />
              <span>Diff</span>
            </button>
          </div>
        </div>

        {/* Real-time Waveform Canvas */}
        <div className="mt-2 h-7 w-full overflow-hidden rounded bg-black/50">
          <canvas
            ref={canvasRef}
            width={280}
            height={28}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Playback & Volume Strip */}
        <div className="mt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause Sonification' : 'Play Sonification'}
            className="flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-3.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-200 transition-all hover:bg-cyan-500/30 hover:border-cyan-300 active:scale-95 shadow-[0_0_12px_rgba(56,189,248,0.2)]"
          >
            {isPlaying ? (
              <>
                <Pause className="size-3 fill-current text-cyan-300" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="size-3 fill-current text-cyan-300" />
                <span>Sonify Location</span>
              </>
            )}
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="size-3.5 text-slate-500" />
              ) : (
                <Volume2 className="size-3.5 text-slate-300" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              aria-label="Sonification Volume"
              className="h-1 w-16 cursor-pointer appearance-none rounded-lg bg-white/20 accent-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* 6. Scientific Provenance Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-1.5 font-mono text-[8px] text-slate-500">
        <div className="flex items-center gap-1 truncate">
          <ShieldCheck className="size-2.5 text-emerald-400" />
          <span className="truncate">{location.provenance.primaryDataset}</span>
        </div>
        <span className="shrink-0 text-slate-400">{location.provenance.spatialResolution}</span>
      </div>
    </div>
  );
}

export default LocationIntelligencePanel;
