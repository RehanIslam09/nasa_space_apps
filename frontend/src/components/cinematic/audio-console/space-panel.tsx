'use client';

import { useState, useRef, useCallback } from 'react';
import { Compass, Wind, RotateCcw } from 'lucide-react';
import type { SonicTrackConfig } from '@/config/earth-song.config';

/**
 * TUNING CONSTANTS — Space & Spatial Audio Field
 */
export const TUNING = {
  keyboardStep: 0.1,
  padHeight: '180px',
};

interface SpacePanelProps {
  activeTrack?: SonicTrackConfig;
  spaceX: number;
  setSpaceX: (val: number) => void;
  spaceY: number;
  setSpaceY: (val: number) => void;
  atmosphereReverb: number;
  setAtmosphereReverb: (val: number) => void;
  onDetentTick?: () => void;
  onAnnounce?: (msg: string) => void;
  accentColor?: string;
}

export function SpacePanel({
  activeTrack,
  spaceX,
  setSpaceX,
  spaceY,
  setSpaceY,
  atmosphereReverb,
  setAtmosphereReverb,
  onDetentTick,
  onAnnounce,
  accentColor: accentColorProp,
}: SpacePanelProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Convert click or touch position to [-1, 1] for X, [0, 1] for Y
  const updateFromCoords = useCallback(
    (clientX: number, clientY: number) => {
      const pad = padRef.current;
      if (!pad) return;
      const rect = pad.getBoundingClientRect();
      const rawX = (clientX - rect.left) / rect.width;
      const rawY = (clientY - rect.top) / rect.height;

      const clampedX = Math.max(-1, Math.min(1, (rawX - 0.5) * 2));
      const clampedY = Math.max(0, Math.min(1, rawY));

      setSpaceX(parseFloat(clampedX.toFixed(2)));
      setSpaceY(parseFloat(clampedY.toFixed(2)));
      onDetentTick?.();
    },
    [setSpaceX, setSpaceY, onDetentTick]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateFromCoords(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      updateFromCoords(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onAnnounce?.(
        `Positioned at pan ${Math.round(spaceX * 100)}%, altitude filter ${Math.round((1 - spaceY) * 100)}%.`
      );
    }
  };

  // Keyboard navigation for XY Pad (Arrow keys & Home)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    let newX = spaceX;
    let newY = spaceY;
    const step = TUNING.keyboardStep;

    if (e.key === 'ArrowLeft') {
      newX = Math.max(-1, spaceX - step);
    } else if (e.key === 'ArrowRight') {
      newX = Math.min(1, spaceX + step);
    } else if (e.key === 'ArrowUp') {
      newY = Math.max(0, spaceY - step); // Up = higher altitude
    } else if (e.key === 'ArrowDown') {
      newY = Math.min(1, spaceY + step); // Down = surface
    } else if (e.key === 'Home') {
      newX = 0;
      newY = 0.5;
    } else {
      return;
    }

    e.preventDefault();
    setSpaceX(parseFloat(newX.toFixed(2)));
    setSpaceY(parseFloat(newY.toFixed(2)));
    onDetentTick?.();
    onAnnounce?.(
      `Pan ${Math.round(newX * 100)}%, altitude filter ${Math.round((1 - newY) * 100)}%`
    );
  };

  const resetSpace = () => {
    setSpaceX(0);
    setSpaceY(0.5);
    setAtmosphereReverb(0.2);
    onDetentTick?.();
    onAnnounce?.('Reset spatial sound field to nadir center.');
  };

  const accentColor = accentColorProp || activeTrack?.color?.accent || '#38bdf8';

  return (
    <div
      id="space-audio-panel"
      role="region"
      aria-label="Spatial Audio and Atmospheric Reverb Field"
      className="space-y-4 text-white"
    >
      {/* ─────────────────────────────────────────────────────────────
          HEADER & INSTRUCTION
          ───────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="size-4" style={{ color: accentColor }} />
            <h4 className="font-semibold text-sm tracking-wide text-white uppercase">
              Move the sound
            </h4>
          </div>
          <p className="mt-1 text-xs text-slate-300 leading-snug">
            Drag the glowing dot. Left and right moves it between your ears; up and down changes
            how bright it sounds.
          </p>
        </div>
        <button
          type="button"
          onClick={resetSpace}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:border-white/30 hover:bg-white/10 hover:text-white transition-colors"
          title="Reset spatial positioning to center"
        >
          <RotateCcw className="size-3" style={{ color: accentColor }} />
          <span>Center</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* ─────────────────────────────────────────────────────────────
            2D INTERACTIVE SOUND PAD
            ───────────────────────────────────────────────────────────── */}
        <div className="md:col-span-7 flex flex-col">
          <div className="w-full flex justify-between font-mono text-[9px] text-slate-400 uppercase tracking-wider mb-1 px-1">
            <span>Stratosphere (Filtered)</span>
            <span>Altitude Axis</span>
          </div>

          <div
            ref={padRef}
            role="slider"
            tabIndex={0}
            aria-label="2D Planetary Spatial Position"
            aria-valuenow={Math.round(((spaceX + 1) / 2) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`Pan ${
              spaceX > 0
                ? `${Math.round(spaceX * 100)}% East`
                : spaceX < 0
                ? `${Math.round(-spaceX * 100)}% West`
                : 'Center'
            }, Altitude ${Math.round((1 - spaceY) * 100)}%`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onKeyDown={handleKeyDown}
            className="relative h-44 sm:h-48 w-full cursor-crosshair overflow-hidden rounded-2xl border p-2 shadow-inner focus:outline-none focus:ring-2 focus:ring-white/40 select-none transition-colors duration-500"
            style={{
              borderColor: `${accentColor}4d`,
              background: `linear-gradient(to bottom, ${accentColor}15, rgba(0, 0, 0, 0.85) 45%, rgba(0, 0, 0, 0.95))`,
            }}
          >
            {/* Center crosshair lines */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10" />

            {/* Concentric orbital rings */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-20 sm:size-24 rounded-full border pointer-events-none transition-colors duration-500"
              style={{ borderColor: `${accentColor}26` }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-36 sm:size-40 rounded-full border pointer-events-none transition-colors duration-500"
              style={{ borderColor: `${accentColor}33` }}
            />

            {/* Subtle quadrant coordinate labels */}
            <span className="absolute top-2 left-3 font-mono text-[8px] sm:text-[9px] text-slate-500 uppercase pointer-events-none">
              WEST LIMB
            </span>
            <span className="absolute top-2 right-3 font-mono text-[8px] sm:text-[9px] text-slate-500 uppercase pointer-events-none">
              EAST LIMB
            </span>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[8px] sm:text-[9px] text-slate-500 uppercase pointer-events-none">
              SURFACE TROPOSPHERE
            </span>

            {/* Draggable Puck with Reticle */}
            <div
              style={{
                left: `${((spaceX + 1) / 2) * 100}%`,
                top: `${spaceY * 100}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-75"
            >
              <div
                className="size-6 sm:size-7 rounded-full border-2 backdrop-blur-sm flex items-center justify-center transition-colors duration-300"
                style={{
                  borderColor: accentColor,
                  backgroundColor: `${accentColor}33`,
                  boxShadow: `0 0 18px ${accentColor}`,
                }}
              >
                <div className="size-2 rounded-full bg-white shadow-sm" />
              </div>
              <span
                className="absolute top-full left-1/2 -translate-x-1/2 mt-1 rounded bg-black/90 px-1.5 py-0.5 font-mono text-[8px] border whitespace-nowrap shadow-md"
                style={{
                  borderColor: `${accentColor}4d`,
                  color: accentColor,
                }}
              >
                {spaceX > 0 ? `+${Math.round(spaceX * 100)}` : Math.round(spaceX * 100)} /{' '}
                {Math.round((1 - spaceY) * 100)}%
              </span>
            </div>
          </div>

          <div className="mt-1.5 flex justify-between font-mono text-[9px] text-slate-500">
            <span>Arrow keys navigate pad</span>
            <span>Home centers</span>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            REVERB & QUICK PRESETS
            ───────────────────────────────────────────────────────────── */}
        <div className="md:col-span-5 space-y-3">
          {/* Echo (Atmospheric Reverb) Slider */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 backdrop-blur-md">
            <div className="flex items-baseline justify-between mb-1.5">
              <div>
                <span className="text-sm font-bold text-white tracking-wide">Echo</span>
                <span className="ml-2 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                  Atmospheric Reverb
                </span>
              </div>
              <span className="font-mono text-xs font-bold" style={{ color: accentColor }}>
                {Math.round(atmosphereReverb * 100)}%
              </span>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-0 right-0 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.round(atmosphereReverb * 100)}%`,
                    backgroundColor: accentColor,
                    boxShadow: `0 0 10px ${accentColor}`,
                  }}
                />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(atmosphereReverb * 100)}
                onChange={(e) => {
                  const val = Number(e.target.value) / 100;
                  setAtmosphereReverb(val);
                  onDetentTick?.();
                }}
                aria-label="Atmospheric reverb diffusion"
                aria-valuenow={Math.round(atmosphereReverb * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={`${Math.round(atmosphereReverb * 100)} percent atmospheric reverb`}
                className="relative z-10 h-4 w-full cursor-pointer appearance-none bg-transparent accent-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              />
            </div>
            <div className="mt-1 flex justify-between font-mono text-[9px] text-slate-500">
              <span>Dry (Vacuum)</span>
              <span>Spacious Atmosphere</span>
            </div>
          </div>

          {/* 4 Soundstage Preset Chips */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-3 backdrop-blur-md">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-slate-400 tracking-wider mb-2">
              <Wind className="size-3" style={{ color: accentColor }} />
              <span>Soundstage Presets:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setSpaceX(0);
                  setSpaceY(0.7);
                  setAtmosphereReverb(0.15);
                  onDetentTick?.();
                  onAnnounce?.('Ground Station Center');
                }}
                className={`rounded-xl border px-2.5 py-1.5 text-center transition-all ${
                  spaceX === 0 && spaceY === 0.7
                    ? 'font-bold'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:text-white'
                }`}
                style={
                  spaceX === 0 && spaceY === 0.7
                    ? {
                        borderColor: accentColor,
                        backgroundColor: `${accentColor}26`,
                        color: '#ffffff',
                        boxShadow: `0 0 10px ${accentColor}33`,
                      }
                    : undefined
                }
              >
                Ground Station
              </button>
              <button
                type="button"
                onClick={() => {
                  setSpaceX(-0.75);
                  setSpaceY(0.3);
                  setAtmosphereReverb(0.4);
                  onDetentTick?.();
                  onAnnounce?.('West Limb Orbit');
                }}
                className={`rounded-xl border px-2.5 py-1.5 text-center transition-all ${
                  spaceX === -0.75 && spaceY === 0.3
                    ? 'font-bold'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:text-white'
                }`}
                style={
                  spaceX === -0.75 && spaceY === 0.3
                    ? {
                        borderColor: accentColor,
                        backgroundColor: `${accentColor}26`,
                        color: '#ffffff',
                        boxShadow: `0 0 10px ${accentColor}33`,
                      }
                    : undefined
                }
              >
                West Limb
              </button>
              <button
                type="button"
                onClick={() => {
                  setSpaceX(0.75);
                  setSpaceY(0.3);
                  setAtmosphereReverb(0.4);
                  onDetentTick?.();
                  onAnnounce?.('East Limb Orbit');
                }}
                className={`rounded-xl border px-2.5 py-1.5 text-center transition-all ${
                  spaceX === 0.75 && spaceY === 0.3
                    ? 'font-bold'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:text-white'
                }`}
                style={
                  spaceX === 0.75 && spaceY === 0.3
                    ? {
                        borderColor: accentColor,
                        backgroundColor: `${accentColor}26`,
                        color: '#ffffff',
                        boxShadow: `0 0 10px ${accentColor}33`,
                      }
                    : undefined
                }
              >
                East Limb
              </button>
              <button
                type="button"
                onClick={() => {
                  setSpaceX(0);
                  setSpaceY(0.1);
                  setAtmosphereReverb(0.65);
                  onDetentTick?.();
                  onAnnounce?.('Exosphere High Orbit');
                }}
                className={`rounded-xl border px-2.5 py-1.5 text-center transition-all ${
                  spaceX === 0 && spaceY === 0.1
                    ? 'font-bold'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:text-white'
                }`}
                style={
                  spaceX === 0 && spaceY === 0.1
                    ? {
                        borderColor: accentColor,
                        backgroundColor: `${accentColor}26`,
                        color: '#ffffff',
                        boxShadow: `0 0 10px ${accentColor}33`,
                      }
                    : undefined
                }
              >
                Exosphere
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
