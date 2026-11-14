'use client';

import { Sparkles, RefreshCw, X } from 'lucide-react';
import type { SonicTrackConfig } from '@/config/earth-song.config';

interface MixerPanelProps {
  activeTrack: SonicTrackConfig;
  setEqBass: (val: number) => void;
  setEqMid: (val: number) => void;
  setEqHigh: (val: number) => void;
  dustVolume: number;
  setDustVolume: (val: number) => void;
  saltVolume: number;
  setSaltVolume: (val: number) => void;
  smokeVolume: number;
  setSmokeVolume: (val: number) => void;
  sulfateVolume: number;
  setSulfateVolume: (val: number) => void;
  onSynthesizeMix: () => void;
  isSynthesizing: boolean;
  onClose?: () => void;
  onApplyPreset?: (presetName: string) => void;
  onDetentTick?: () => void;
}

export function MixerPanel({
  activeTrack,
  setEqBass,
  setEqMid,
  setEqHigh,
  dustVolume,
  setDustVolume,
  saltVolume,
  setSaltVolume,
  smokeVolume,
  setSmokeVolume,
  sulfateVolume,
  setSulfateVolume,
  onSynthesizeMix,
  isSynthesizing,
  onClose,
  onApplyPreset,
  onDetentTick,
}: MixerPanelProps) {
  // Preset definitions
  const presets = [
    { name: 'Calm Earth', bass: 55, mid: 60, high: 50, dust: 40, salt: 60, smoke: 20, sulfate: 30 },
    { name: 'Deep Ocean', bass: 85, mid: 50, high: 45, dust: 20, salt: 90, smoke: 15, sulfate: 25 },
    { name: 'Storm Dynamics', bass: 70, mid: 80, high: 75, dust: 75, salt: 80, smoke: 60, sulfate: 50 },
    { name: 'Planetary Fever', bass: 60, mid: 85, high: 80, dust: 85, salt: 40, smoke: 90, sulfate: 70 },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setEqBass(p.bass);
    setEqMid(p.mid);
    setEqHigh(p.high);
    setDustVolume(p.dust);
    setSaltVolume(p.salt);
    setSmokeVolume(p.smoke);
    setSulfateVolume(p.sulfate);
    onDetentTick?.();
    onApplyPreset?.(p.name);
  };

  // Determine if active track is specifically GEOS aerosols or generic
  const isAerosolTrack =
    activeTrack.id === 'geos-aerosols' ||
    activeTrack.title.toLowerCase().includes('aerosol') ||
    !activeTrack.scientificVariables;

  return (
    <div
      id="constituent-mixer-panel"
      role="region"
      aria-label="Constituent Layer Synthesizer"
      className="space-y-4 rounded-2xl border border-sky-400/20 bg-sky-950/20 p-4 backdrop-blur-md"
    >
      {/* ─────────────────────────────────────────────────────────────
          1. SOUND PRESET CHIPS
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
        <span className="text-slate-400 mr-1 text-[10px] uppercase tracking-wider">Presets:</span>
        {presets.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => handleApplyPreset(preset)}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300 transition-colors hover:border-sky-400/50 hover:bg-sky-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:scale-95"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CONSTITUENT LAYER SYNTHESIZER (Offline DSP 16-Bit WAV)
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-sky-400/20 bg-black/40 p-3.5 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-sky-400" />
            <span className="font-mono font-semibold uppercase tracking-wider text-sky-200">
              Constituent Layer Synthesizer
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-slate-400">
              Pure Mathematical DSP
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Constituent Layer Synthesizer panel"
                className="inline-flex size-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Aerosol Constituent Sliders (Dust / Sea Salt / Smoke / Sulfate) */}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-[11px]">
          <div>
            <div className="flex justify-between text-slate-400">
              <span>{isAerosolTrack ? 'DUST' : 'LAYER 1 (SUB)'}</span>
              <span className="text-amber-300 font-bold">{dustVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={dustVolume}
              onChange={(e) => {
                setDustVolume(Number(e.target.value));
                onDetentTick?.();
              }}
              aria-label="Dust layer volume"
              aria-valuenow={dustVolume}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${dustVolume} percent dust layer`}
              className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400">
              <span>{isAerosolTrack ? 'SEA SALT' : 'LAYER 2 (MID)'}</span>
              <span className="text-cyan-300 font-bold">{saltVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={saltVolume}
              onChange={(e) => {
                setSaltVolume(Number(e.target.value));
                onDetentTick?.();
              }}
              aria-label="Sea salt layer volume"
              aria-valuenow={saltVolume}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${saltVolume} percent sea salt layer`}
              className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400">
              <span>{isAerosolTrack ? 'SMOKE' : 'LAYER 3 (TEXTURE)'}</span>
              <span className="text-emerald-300 font-bold">{smokeVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={smokeVolume}
              onChange={(e) => {
                setSmokeVolume(Number(e.target.value));
                onDetentTick?.();
              }}
              aria-label="Smoke layer volume"
              aria-valuenow={smokeVolume}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${smokeVolume} percent smoke layer`}
              className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-400">
              <span>{isAerosolTrack ? 'SULFATE' : 'LAYER 4 (HIGH)'}</span>
              <span className="text-slate-200 font-bold">{sulfateVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sulfateVolume}
              onChange={(e) => {
                setSulfateVolume(Number(e.target.value));
                onDetentTick?.();
              }}
              aria-label="Sulfate layer volume"
              aria-valuenow={sulfateVolume}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${sulfateVolume} percent sulfate layer`}
              className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            />
          </div>
        </div>

        {/* Synthesize Button */}
        <div className="mt-3 flex items-center justify-between border-t border-white/[0.08] pt-2.5">
          <span className="font-mono text-[10px] text-slate-400">
            Renders customized 16-bit PCM WAV via Python DSP
          </span>
          <button
            type="button"
            onClick={onSynthesizeMix}
            disabled={isSynthesizing}
            aria-label="Synthesize Custom Cadence 16-Bit WAV"
            className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/20 px-4 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-sky-200 transition-colors hover:bg-sky-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:scale-95 disabled:opacity-50"
          >
            {isSynthesizing ? (
              <>
                <RefreshCw className="size-3 animate-spin text-sky-300" />
                <span>Synthesizing 16-Bit WAV...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-3 text-sky-300" />
                <span>Synthesize Custom Cadence</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
