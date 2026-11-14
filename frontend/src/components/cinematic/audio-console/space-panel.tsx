'use client';

import { useState, useRef, useCallback } from 'react';
import { Compass, Wind, RotateCcw } from 'lucide-react';
import type { SonicTrackConfig } from '@/config/earth-song.config';

interface SpacePanelProps {
  spaceX: number;
  setSpaceX: (val: number) => void;
  spaceY: number;
  setSpaceY: (val: number) => void;
  atmosphereReverb: number;
  setAtmosphereReverb: (val: number) => void;
  onDetentTick?: () => void;
  onAnnounce?: (msg: string) => void;
}

export function SpacePanel({
  spaceX,
  setSpaceX,
  spaceY,
  setSpaceY,
  atmosphereReverb,
  setAtmosphereReverb,
  onDetentTick,
  onAnnounce,
}: SpacePanelProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Convert click or touch position to [-1, 1] for X, [0, 1] for Y
  const updateFromCoords = useCallback(
    (clientX: number, clientY: number) => {
      const pad = padRef.current;
      if (!pad) return;
      const rect = pad.getBoundingClientRect();
      const rawX = (clientX - rect.left) / rect.width; // 0 to 1
      const rawY = (clientY - rect.top) / rect.height; // 0 to 1

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

  // Keyboard navigation for XY Pad
  const handleKeyDown = (e: React.KeyboardEvent) => {
    let newX = spaceX;
    let newY = spaceY;
    const step = 0.1;

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

  return (
    <div
      id="space-audio-panel"
      role="region"
      aria-label="Spatial Audio and Atmospheric Reverb Field"
      className="space-y-4 rounded-2xl border border-sky-400/20 bg-black/40 p-4.5 backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Compass className="size-4 text-sky-400" />
          <span className="font-semibold uppercase tracking-wider text-slate-200">
            2D Planetary Sound Field & Spatial Dispersion
          </span>
        </div>
        <button
          type="button"
          onClick={resetSpace}
          className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
          title="Reset spatial positioning to center"
        >
          <RotateCcw className="size-3" />
          <span>Center</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 items-center">
        {/* 2D XY Interactive Glass Pad */}
        <div className="md:col-span-7 flex flex-col items-center">
          <div className="w-full flex justify-between font-mono text-[9px] text-slate-400 uppercase tracking-wider mb-1 px-1">
            <span>Stratosphere (Air Filtered)</span>
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
            aria-valuetext={`Pan ${spaceX > 0 ? `${Math.round(spaceX * 100)}% East` : spaceX < 0 ? `${Math.round(-spaceX * 100)}% West` : 'Center'}, Altitude ${Math.round((1 - spaceY) * 100)}%`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onKeyDown={handleKeyDown}
            className="relative h-48 w-full cursor-crosshair overflow-hidden rounded-2xl border border-sky-400/30 bg-gradient-to-b from-sky-950/40 via-black/80 to-black/90 p-2 shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-400 select-none"
          >
            {/* Center crosshair lines */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10" />

            {/* Concentric orbital rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-24 rounded-full border border-sky-400/10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-40 rounded-full border border-sky-400/15 pointer-events-none" />

            {/* Quadrant coordinate labels */}
            <span className="absolute top-2 left-3 font-mono text-[9px] text-slate-400 pointer-events-none">
              WEST LIMB
            </span>
            <span className="absolute top-2 right-3 font-mono text-[9px] text-slate-400 pointer-events-none">
              EAST LIMB
            </span>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[9px] text-slate-400 pointer-events-none">
              SURFACE TROPOSPHERE
            </span>

            {/* Draggable Puck with Reticle */}
            <div
              style={{
                left: `${((spaceX + 1) / 2) * 100}%`,
                top: `${spaceY * 100}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <div className="size-6 rounded-full border-2 border-sky-400 bg-sky-400/30 shadow-[0_0_16px_rgba(56,189,248,0.8)] backdrop-blur-sm flex items-center justify-center">
                <div className="size-1.5 rounded-full bg-white" />
              </div>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 rounded bg-black/80 px-1 py-0.5 font-mono text-[8px] text-sky-300 border border-sky-400/30 whitespace-nowrap">
                {spaceX > 0 ? `+${Math.round(spaceX * 100)}` : Math.round(spaceX * 100)} /{' '}
                {Math.round((1 - spaceY) * 100)}%
              </span>
            </div>
          </div>

          <div className="mt-2 text-center font-mono text-[10px] text-slate-400">
            Use mouse or arrow keys to pan stereo audio and shape atmospheric filter
          </div>
        </div>

        {/* Reverb & Spatial Controls */}
        <div className="md:col-span-5 space-y-4">
          {/* Atmospheric Reverb Slider */}
          <div className="rounded-xl border border-white/5 bg-black/30 p-3.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Wind className="size-3.5 text-sky-400" />
                <span>Atmospheric Reverb</span>
              </div>
              <span className="font-bold text-sky-300">
                {Math.round(atmosphereReverb * 100)}%
              </span>
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
              className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            />
            <div className="mt-1 flex justify-between font-mono text-[9px] text-slate-500">
              <span>Dry (Vacuum)</span>
              <span>Diffusive Atmosphere</span>
            </div>
          </div>

          {/* Quick Spatial Presets */}
          <div className="rounded-xl border border-white/5 bg-black/30 p-3 font-mono text-[11px]">
            <div className="text-[10px] uppercase text-slate-400 tracking-wider mb-2">
              Soundstage Presets:
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSpaceX(0);
                  setSpaceY(0.7);
                  setAtmosphereReverb(0.15);
                  onDetentTick?.();
                  onAnnounce?.('Ground Station Center');
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-300 hover:border-sky-400/40 hover:text-white transition-colors"
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
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-300 hover:border-sky-400/40 hover:text-white transition-colors"
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
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-300 hover:border-sky-400/40 hover:text-white transition-colors"
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
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-300 hover:border-sky-400/40 hover:text-white transition-colors"
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
