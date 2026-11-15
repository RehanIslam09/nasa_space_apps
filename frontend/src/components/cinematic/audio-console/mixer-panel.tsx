'use client';

import { useState } from 'react';
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, Check, SlidersHorizontal } from 'lucide-react';
import type { SonicTrackConfig } from '@/config/earth-song.config';

/**
 * TUNING CONSTANTS — Mixer Panel & Sliders
 */
export const TUNING = {
  slider: {
    transitionDuration: '150ms',
    glowRadius: '10px',
  },
};

interface MixerPanelProps {
  activeTrack: SonicTrackConfig;
  eqBass: number;
  setEqBass: (val: number) => void;
  eqMid: number;
  setEqMid: (val: number) => void;
  eqHigh: number;
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
  customMixActive?: boolean;
  onDetentTick?: () => void;
}

export function MixerPanel({
  activeTrack,
  eqBass,
  setEqBass,
  eqMid,
  setEqMid,
  eqHigh,
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
  customMixActive = false,
  onDetentTick,
}: MixerPanelProps) {
  const [accordionOpen, setAccordionOpen] = useState(false);

  // Determine if active track is specifically GEOS aerosols or generic
  const isAerosolTrack =
    activeTrack.id === 'geos-aerosols' ||
    activeTrack.title.toLowerCase().includes('aerosol') ||
    !activeTrack.scientificVariables;

  const accentColor = activeTrack.color.accent || '#38bdf8';

  return (
    <div
      id="constituent-mixer-panel"
      role="region"
      aria-label="Constituent Layer Synthesizer"
      className="space-y-4 text-white"
    >
      {/* ─────────────────────────────────────────────────────────────
          1. THREE BIG FRIENDLY SLIDERS (Deep, Body, Sparkle)
          ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-sky-400" />
            <h4 className="font-semibold text-sm tracking-wide text-white uppercase">
              Tone Balance
            </h4>
          </div>
          <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
            Live Web Audio DSP
          </span>
        </div>

        {/* 1. Deep (Bass) */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 backdrop-blur-md transition-all hover:border-white/20">
          <div className="flex items-baseline justify-between mb-1.5">
            <div>
              <span className="text-sm font-bold text-white tracking-wide">Deep</span>
              <span className="ml-2 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                Low / Bass
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-sky-300">{eqBass}%</span>
          </div>
          <div className="relative flex items-center">
            <div className="absolute left-0 right-0 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${eqBass}%`,
                  backgroundColor: accentColor,
                  boxShadow: `0 0 ${TUNING.slider.glowRadius} ${accentColor}`,
                }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={eqBass}
              onChange={(e) => {
                setEqBass(Number(e.target.value));
                onDetentTick?.();
              }}
              aria-label="Bass equalizer"
              aria-valuenow={eqBass}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${eqBass} percent bass`}
              className="relative z-10 h-4 w-full cursor-pointer appearance-none bg-transparent accent-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            />
          </div>
        </div>

        {/* 2. Body (Mid) */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 backdrop-blur-md transition-all hover:border-white/20">
          <div className="flex items-baseline justify-between mb-1.5">
            <div>
              <span className="text-sm font-bold text-white tracking-wide">Body</span>
              <span className="ml-2 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                Mid Resonance
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-sky-300">{eqMid}%</span>
          </div>
          <div className="relative flex items-center">
            <div className="absolute left-0 right-0 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${eqMid}%`,
                  backgroundColor: accentColor,
                  boxShadow: `0 0 ${TUNING.slider.glowRadius} ${accentColor}`,
                }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={eqMid}
              onChange={(e) => {
                setEqMid(Number(e.target.value));
                onDetentTick?.();
              }}
              aria-label="Midrange resonance equalizer"
              aria-valuenow={eqMid}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${eqMid} percent midrange`}
              className="relative z-10 h-4 w-full cursor-pointer appearance-none bg-transparent accent-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            />
          </div>
        </div>

        {/* 3. Sparkle (High) */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 backdrop-blur-md transition-all hover:border-white/20">
          <div className="flex items-baseline justify-between mb-1.5">
            <div>
              <span className="text-sm font-bold text-white tracking-wide">Sparkle</span>
              <span className="ml-2 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                High Shimmer
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-sky-300">{eqHigh}%</span>
          </div>
          <div className="relative flex items-center">
            <div className="absolute left-0 right-0 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${eqHigh}%`,
                  backgroundColor: accentColor,
                  boxShadow: `0 0 ${TUNING.slider.glowRadius} ${accentColor}`,
                }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={eqHigh}
              onChange={(e) => {
                setEqHigh(Number(e.target.value));
                onDetentTick?.();
              }}
              aria-label="High shimmer equalizer"
              aria-valuenow={eqHigh}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${eqHigh} percent treble shimmer`}
              className="relative z-10 h-4 w-full cursor-pointer appearance-none bg-transparent accent-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. COLLAPSED ACCORDION: "Build your own mix (advanced)"
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden backdrop-blur-md transition-all">
        <button
          type="button"
          onClick={() => {
            setAccordionOpen(!accordionOpen);
            onDetentTick?.();
          }}
          aria-expanded={accordionOpen}
          className="flex w-full items-center justify-between p-3.5 text-left text-xs font-medium text-slate-300 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-sky-400" />
            <span className="font-semibold text-white">Build your own mix</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-400">
              Advanced
            </span>
          </div>
          {accordionOpen ? (
            <ChevronUp className="size-4 text-slate-400" />
          ) : (
            <ChevronDown className="size-4 text-slate-400" />
          )}
        </button>

        {accordionOpen && (
          <div className="border-t border-white/[0.08] p-4 space-y-4 bg-black/40">
            <p className="text-xs text-slate-400 leading-relaxed">
              Adjust individual observational constituent layers below. Changing these layers
              re-renders an authentic 16-bit WAV via the NASA mathematical sonification engine.
            </p>

            {/* 4 Constituent Layer Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono text-[11px]">
              {/* Dust Layer */}
              <div className="rounded-xl border border-white/5 bg-black/50 p-2.5">
                <div className="flex justify-between text-slate-400 mb-1">
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
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                />
              </div>

              {/* Sea Salt Layer */}
              <div className="rounded-xl border border-white/5 bg-black/50 p-2.5">
                <div className="flex justify-between text-slate-400 mb-1">
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
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                />
              </div>

              {/* Smoke Layer */}
              <div className="rounded-xl border border-white/5 bg-black/50 p-2.5">
                <div className="flex justify-between text-slate-400 mb-1">
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
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                />
              </div>

              {/* Sulfate Layer */}
              <div className="rounded-xl border border-white/5 bg-black/50 p-2.5">
                <div className="flex justify-between text-slate-400 mb-1">
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
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                />
              </div>
            </div>

            {/* Synthesize Button & Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-3">
              <div className="text-xs text-slate-400">
                {isSynthesizing ? (
                  <span className="text-sky-300 animate-pulse font-medium">
                    Earth is warming up… Synthesizing 16-bit WAV
                  </span>
                ) : customMixActive ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                    <Check className="size-3.5" />
                    <span>Your mix is ready and active</span>
                  </span>
                ) : (
                  <span>Ready to render customized acoustic loop</span>
                )}
              </div>

              <button
                type="button"
                onClick={onSynthesizeMix}
                disabled={isSynthesizing}
                aria-label="Synthesize Custom Cadence 16-Bit WAV"
                className="group inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/20 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-sky-200 shadow-md backdrop-blur-md transition-all hover:bg-sky-500/30 hover:border-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:scale-95 disabled:opacity-50"
              >
                {isSynthesizing ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin text-sky-300" />
                    <span>Earth is warming up…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5 text-sky-300" />
                    <div className="flex flex-col text-left leading-tight">
                      <span>Create my mix</span>
                      <span className="text-[8px] font-normal text-sky-300/80 lowercase">
                        synthesize custom cadence
                      </span>
                    </div>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
