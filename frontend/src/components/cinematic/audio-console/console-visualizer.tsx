'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import type { SonicTrackConfig } from '@/config/earth-song.config';

/**
 * TUNING CONSTANTS — Console Visualizer & Glowing Earth-Orb
 */
export const TUNING = {
  orb: {
    coreRadiusRatio: 0.32,
    spectrumInnerRatio: 0.36,
    spokeCount: 60,
    idleBreathingSpeed: 1.4,
    orbitDriftSpeed: 0.12,
    activeSpokeScale: 0.55,
  },
  motion: {
    sheenSmoothing: 0.15,
  },
};

interface ConsoleVisualizerProps {
  activeTrack: SonicTrackConfig;
  isPlaying: boolean;
  isMuted: boolean;
  getFrequencyData: (data: Uint8Array<ArrayBuffer>) => void;
  customMixActive?: boolean;
  spaceX?: number;
  spaceY?: number;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onScrub: (val: number) => void;
  formatTime: (sec: number) => string;
  onDetentTick?: () => void;
  themeColor?: {
    accent: string;
    glow: string;
    nebula?: string;
    bgTint?: string;
  };
  moodEffect?: 'calm' | 'ocean' | 'storm' | 'fever';
}

export function ConsoleVisualizer({
  activeTrack,
  isPlaying,
  isMuted,
  getFrequencyData,
  customMixActive = false,
  spaceX = 0,
  spaceY = 0,
  onTogglePlay,
  currentTime,
  duration,
  onScrub,
  formatTime,
  onDetentTick,
  themeColor,
  moodEffect = 'calm',
}: ConsoleVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isHoveredOrb, setIsHoveredOrb] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  // Generate plain-language description for screen readers and visual caption
  const getNowHearingDescription = useCallback(() => {
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
  }, [isPlaying, isMuted, spaceX, spaceY, activeTrack.title, activeTrack.frequency, customMixActive]);

  // Cursor-follow glass sheen
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  };

  const handleMasterPlay = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    setHasInteracted(true);
    onTogglePlay();
  };

  useEffect(() => {
    if (isPlaying) {
      setHasInteracted(true);
    }
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;
    const freqData = new Uint8Array(64);

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.round(width * dpr);
          canvas.height = Math.round(height * dpr);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.scale(dpr, dpr);
        }
      }
    });
    resizeObserver.observe(canvas);

    const isAudible = isPlaying && !isMuted;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width === 0 || height === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.round(width * dpr);
      const targetH = Math.round(height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);

      // Read real audio frequency data if audible
      if (isAudible) {
        getFrequencyData(freqData);
      } else {
        freqData.fill(0);
      }

      const avgVol = isAudible
        ? freqData.reduce((acc, v) => acc + v, 0) / freqData.length
        : 0;

      // ─────────────────────────────────────────────────────────────
      // GLOWING EARTH-ORB (Centered in the upper visual space)
      // ─────────────────────────────────────────────────────────────
      const centerX = width * 0.5;
      const centerY = height * 0.48;
      const minDim = Math.min(width, height);
      const baseRadius = minDim * 0.38;

      const accentColor = themeColor?.accent || activeTrack.color.accent || '#38bdf8';
      const glowColor = themeColor?.glow || activeTrack.color.glow || 'rgba(56, 189, 248, 0.4)';

      // ─────────────────────────────────────────────────────────────
      // 1. ATMOSPHERIC CORONA (Dynamic per mood preset)
      // ─────────────────────────────────────────────────────────────
      let atmosphereRadius = baseRadius * 1.35;
      if (moodEffect === 'ocean') {
        const oceanWave = Math.sin(phase * 1.6) * 6 + Math.cos(phase * 0.8) * 4;
        atmosphereRadius = baseRadius * 1.4 + (isAudible ? (avgVol / 255) * 20 : oceanWave);
      } else if (moodEffect === 'storm') {
        const stormSpike = Math.sin(phase * 4.2) > 0.82 ? 14 : 0;
        atmosphereRadius =
          baseRadius * 1.35 +
          (isAudible ? (avgVol / 255) * 24 : Math.sin(phase * 2.8) * 6 + stormSpike);
      } else if (moodEffect === 'fever') {
        const thermalHaze = Math.sin(phase * 2.6) * 8 + Math.sin(phase * 5.2) * 3;
        atmosphereRadius =
          baseRadius * 1.45 + (isAudible ? (avgVol / 255) * 26 : thermalHaze);
      } else {
        // 'calm' default
        atmosphereRadius =
          baseRadius * 1.35 +
          (isAudible ? (avgVol / 255) * 18 : Math.sin(phase * 1.2) * 4);
      }

      const coronaGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.5,
        centerX,
        centerY,
        atmosphereRadius
      );
      coronaGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      coronaGrad.addColorStop(0.5, glowColor);
      coronaGrad.addColorStop(0.85, `${accentColor}14`);
      coronaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, atmosphereRadius, 0, Math.PI * 2);
      ctx.fill();

      // ─────────────────────────────────────────────────────────────
      // 2. ORBITAL & ATMOSPHERIC RINGS (Dynamic per mood preset)
      // ─────────────────────────────────────────────────────────────
      if (moodEffect === 'ocean') {
        // Deep aquatic ripple rings expanding like sonar waves
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1, 0.44);
        const ring1 = baseRadius * (1.12 + Math.sin(phase * 0.9) * 0.04);
        const ring2 = baseRadius * (1.38 + Math.sin(phase * 0.9 + 1) * 0.05);
        const ring3 = baseRadius * (1.62 + Math.sin(phase * 0.9 + 2) * 0.06);

        ctx.beginPath();
        ctx.arc(0, 0, ring1, 0, Math.PI * 2);
        ctx.strokeStyle = `${accentColor}4d`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, ring2, 0, Math.PI * 2);
        ctx.strokeStyle = `${accentColor}2e`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, ring3, 0, Math.PI * 2);
        ctx.strokeStyle = `${accentColor}17`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      } else if (moodEffect === 'storm') {
        // Gyroscopic dynamic electric storm rings rotating in opposite directions
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(phase * 0.28);
        ctx.scale(1, 0.42);
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius * 1.18, 0, Math.PI * 2);
        ctx.strokeStyle = `${accentColor}55`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-phase * 0.38);
        ctx.scale(0.85, 0.55);
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius * 1.44, 0, Math.PI * 2);
        ctx.strokeStyle = `${accentColor}33`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      } else if (moodEffect === 'fever') {
        // Thermal heat radiation rings oscillating with thermal shimmer
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1, 0.46);
        const heatOsc = Math.sin(phase * 3.2) * 4;
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius * 1.16 + heatOsc, 0, Math.PI * 2);
        ctx.strokeStyle = `${accentColor}4d`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, baseRadius * 1.46 + heatOsc * 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = `${accentColor}2e`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      } else {
        // 'calm' default: Serene concentric circular perspective rings
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1, 0.48);

        ctx.beginPath();
        ctx.arc(0, 0, baseRadius * 1.15, 0, Math.PI * 2);
        ctx.strokeStyle = `${accentColor}33`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, baseRadius * 1.45, 0, Math.PI * 2);
        ctx.strokeStyle = `${accentColor}1a`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // ─────────────────────────────────────────────────────────────
      // 3. RADIAL SPECTRUM SPOKES (Dynamic per mood preset)
      // ─────────────────────────────────────────────────────────────
      const spokes = TUNING.orb.spokeCount;
      const angleStep = (Math.PI * 2) / spokes;
      const innerRingRadius = baseRadius * TUNING.orb.spectrumInnerRatio;

      for (let i = 0; i < spokes; i++) {
        const driftOffset = prefersReducedMotion ? 0 : phase * TUNING.orb.orbitDriftSpeed;
        const angle = i * angleStep + driftOffset;
        const freqVal = freqData[i % freqData.length] || 0;

        let spokeLen = 6;
        let strokeColor = isAudible ? accentColor : `${accentColor}99`;
        let spokeBlur = isAudible ? 8 : 3;
        let spokeShadow = glowColor;

        if (moodEffect === 'ocean') {
          const tidalSwell =
            (Math.sin(phase * 1.8 + i * 0.2) + Math.cos(phase * 0.9 + i * 0.35)) * 4 + 7;
          spokeLen = isAudible
            ? (freqVal / 255) * (baseRadius * 0.56) + 4
            : prefersReducedMotion
            ? 6
            : tidalSwell;
          strokeColor = isAudible ? accentColor : `${accentColor}b3`;
          spokeBlur = isAudible ? 10 : 4;
        } else if (moodEffect === 'storm') {
          // Electric lightning discharge spikes
          const isLightningSpike = (i * 7 + Math.floor(phase * 14)) % 11 === 0;
          const turbulentPulse =
            Math.sin(phase * 3.5 + i * 0.4) * 6 + (isLightningSpike ? 16 : 5);
          spokeLen = isAudible
            ? (freqVal / 255) * (baseRadius * 0.62) + (isLightningSpike ? 14 : 3)
            : prefersReducedMotion
            ? 6
            : turbulentPulse;
          strokeColor = isLightningSpike
            ? '#ffffff'
            : isAudible
            ? accentColor
            : `${accentColor}cc`;
          spokeShadow = isLightningSpike ? '#ffffff' : glowColor;
          spokeBlur = isLightningSpike ? 16 : isAudible ? 10 : 4;
        } else if (moodEffect === 'fever') {
          // Solar corona flare rays
          const solarFlare = Math.sin(phase * 5.0 + i * 0.7) > 0.65 ? 10 : 0;
          const thermalPulse =
            Math.sin(phase * 2.5 + i * 0.28) * 7 + solarFlare + 6;
          spokeLen = isAudible
            ? (freqVal / 255) * (baseRadius * 0.6) + solarFlare + 4
            : prefersReducedMotion
            ? 6
            : thermalPulse;
          strokeColor =
            solarFlare > 0 ? '#ffedd5' : isAudible ? accentColor : `${accentColor}b3`;
          spokeBlur = isAudible ? 12 : 5;
        } else {
          // 'calm' default
          const idlePulse = prefersReducedMotion
            ? 6
            : Math.sin(phase * TUNING.orb.idleBreathingSpeed + i * 0.22) * 5 + 6;
          spokeLen = isAudible
            ? (freqVal / 255) * (baseRadius * TUNING.orb.activeSpokeScale) + 4
            : idlePulse;
          strokeColor = isAudible ? accentColor : 'rgba(255, 255, 255, 0.35)';
          spokeBlur = isAudible ? 8 : 3;
        }

        const x1 = centerX + Math.cos(angle) * innerRingRadius;
        const y1 = centerY + Math.sin(angle) * innerRingRadius;
        const x2 = centerX + Math.cos(angle) * (innerRingRadius + spokeLen);
        const y2 = centerY + Math.sin(angle) * (innerRingRadius + spokeLen);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = isAudible ? 1.8 : 1.1;
        ctx.shadowColor = spokeShadow;
        ctx.shadowBlur = spokeBlur;
        ctx.stroke();
      }

      // ─────────────────────────────────────────────────────────────
      // 4. PLANET-LIKE CORE SPHERE (Toned per mood preset)
      // ─────────────────────────────────────────────────────────────
      const corePulse = isAudible
        ? (avgVol / 255) * 6
        : prefersReducedMotion
        ? 0
        : Math.sin(phase * 1.1) * 2;
      const coreRadius = baseRadius * TUNING.orb.coreRadiusRatio + corePulse;

      const planetGrad = ctx.createRadialGradient(
        centerX - coreRadius * 0.3,
        centerY - coreRadius * 0.35,
        coreRadius * 0.1,
        centerX,
        centerY,
        coreRadius
      );

      if (moodEffect === 'ocean') {
        // Deep cyan / marine abyss
        planetGrad.addColorStop(0, 'rgba(236, 254, 255, 0.75)');
        planetGrad.addColorStop(0.35, accentColor);
        planetGrad.addColorStop(0.72, 'rgba(8, 40, 58, 0.92)');
        planetGrad.addColorStop(1, 'rgba(2, 14, 26, 0.98)');
      } else if (moodEffect === 'storm') {
        // High-voltage electric violet plasma
        planetGrad.addColorStop(0, 'rgba(250, 245, 255, 0.85)');
        planetGrad.addColorStop(0.3, accentColor);
        planetGrad.addColorStop(0.7, 'rgba(40, 14, 80, 0.92)');
        planetGrad.addColorStop(1, 'rgba(14, 3, 30, 0.98)');
      } else if (moodEffect === 'fever') {
        // Blazing molten solar flare amber
        planetGrad.addColorStop(0, 'rgba(255, 251, 235, 0.9)');
        planetGrad.addColorStop(0.32, accentColor);
        planetGrad.addColorStop(0.72, 'rgba(85, 22, 6, 0.94)');
        planetGrad.addColorStop(1, 'rgba(30, 7, 2, 0.98)');
      } else {
        // 'calm' default: Serene emerald/mint core
        planetGrad.addColorStop(0, 'rgba(236, 253, 245, 0.7)');
        planetGrad.addColorStop(0.35, accentColor);
        planetGrad.addColorStop(0.72, 'rgba(6, 44, 33, 0.9)');
        planetGrad.addColorStop(1, 'rgba(2, 20, 15, 0.96)');
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = planetGrad;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = isAudible ? 18 : 8;
      ctx.fill();

      // Core rim highlight
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.strokeStyle = isAudible ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.shadowBlur = 0;

      if (!prefersReducedMotion) {
        if (moodEffect === 'storm') {
          phase += isAudible ? 0.065 : 0.032;
        } else if (moodEffect === 'fever') {
          phase += isAudible ? 0.05 : 0.024;
        } else if (moodEffect === 'ocean') {
          phase += isAudible ? 0.042 : 0.018;
        } else {
          phase += isAudible ? 0.038 : 0.016;
        }
      }
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [activeTrack, isPlaying, isMuted, getFrequencyData, themeColor, moodEffect]);

  // Safely compute percentage for timeline fill track
  const validDuration = duration > 0 && isFinite(duration) ? duration : 12;
  const progressPercent = validDuration > 0 ? Math.min(100, Math.max(0, (currentTime / validDuration) * 100)) : 0;

  const accentColor = themeColor?.accent || activeTrack.color.accent || '#38bdf8';
  const glowColor = themeColor?.glow || activeTrack.color.glow || 'rgba(56, 189, 248, 0.4)';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border p-5 shadow-2xl backdrop-blur-2xl transition-all duration-500 sm:p-6"
      style={{
        background: `linear-gradient(to bottom, ${themeColor?.bgTint || 'rgba(12, 74, 110, 0.2)'}, rgba(0, 0, 0, 0.85) 45%, rgba(0, 0, 0, 0.95))`,
        borderColor: `${accentColor}33`,
        boxShadow: `0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 30px ${glowColor}1a`,
      }}
    >
      {/* Subtle cursor-follow glass sheen */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-300 group-hover:opacity-75"
        style={{
          background: `radial-gradient(circle 320px at ${mousePos.x * 100}% ${
            mousePos.y * 100
          }%, ${accentColor}18, transparent 70%)`,
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          TOP-LEFT OVERLAY: Track Title & Friendly 3-Step Hint
          ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 select-none">
        {/* Small mono label on ONE line */}
        <div className="flex items-center gap-2">
          <span
            className="size-1.5 rounded-full transition-colors duration-500"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 8px ${accentColor}`,
            }}
          />
          <span
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] whitespace-nowrap transition-colors duration-500"
            style={{ color: accentColor }}
          >
            {activeTrack.category || 'Earth Systems Overview'}
          </span>
        </div>

        {/* Track Title in condensed display type on up to 2 lines */}
        <h3
          title={activeTrack.title}
          aria-label={activeTrack.title}
          className="special-font font-zentry mt-1.5 text-xl font-black uppercase text-white tracking-tight sm:text-2xl lg:text-[28px] leading-tight line-clamp-2 drop-shadow-md"
        >
          {activeTrack.title}
        </h3>

        {/* Friendly explanation subtext */}
        <p className="mt-1 text-xs text-slate-300 font-medium">
          Real NASA data, turned into sound.
        </p>

        {/* Small 3-step hint */}
        <p className="mt-0.5 font-mono text-[10px] text-slate-400/90 tracking-wide">
          Press play · Pick a mood · Move the sound
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CENTER: Canvas Visualizer with Centered Master Play Button
          Reveals play/pause control on hover over the orb.
          ───────────────────────────────────────────────────────────── */}
      <div
        onMouseEnter={() => setIsHoveredOrb(true)}
        onMouseLeave={() => setIsHoveredOrb(false)}
        className="group/orb relative my-auto flex flex-1 items-center justify-center min-h-[220px] sm:min-h-[260px] w-full"
      >
        {/* High-DPI Phosphor Canvas */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full pointer-events-none"
        />

        {/* Center Master Play/Pause Button (Revealed only when moving cursor on the orb) */}
        <div
          className={`relative z-20 flex flex-col items-center transition-all duration-300 transform ${
            isHoveredOrb
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={handleMasterPlay}
            onFocus={(e) => {
              if (e.target.matches?.(':focus-visible')) {
                setIsHoveredOrb(true);
              }
            }}
            onBlur={() => setIsHoveredOrb(false)}
            aria-label={
              isPlaying
                ? `Pause soundscape: ${activeTrack.title}`
                : `Play soundscape: ${activeTrack.title}`
            }
            className="group relative flex size-16 sm:size-18 items-center justify-center rounded-full border border-white/30 bg-black/60 text-white shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-white/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 active:scale-95"
            style={{
              borderColor: isPlaying ? accentColor : `${accentColor}80`,
              boxShadow: isPlaying
                ? `0 0 35px ${glowColor}`
                : `0 8px 24px rgba(0, 0, 0, 0.6), 0 0 15px ${glowColor}33`,
            }}
          >
            {/* Gentle pulse ring before first play or while playing */}
            {isPlaying ? (
              <>
                <span
                  className="absolute -inset-1.5 animate-ping rounded-full border opacity-50 pointer-events-none"
                  style={{ borderColor: accentColor }}
                />
                <Pause className="size-6 fill-current text-white transition-transform group-hover:scale-110" />
              </>
            ) : (
              <>
                {!hasInteracted && (
                  <span
                    className="absolute -inset-2 animate-pulse rounded-full border opacity-70 pointer-events-none"
                    style={{ borderColor: `${accentColor}80` }}
                  />
                )}
                <Play className="ml-1 size-7 fill-current text-white transition-transform group-hover:scale-110" />
              </>
            )}
          </button>

          {/* Friendly prompt under button when idle */}
          {!isPlaying && !hasInteracted && (
            <span className="mt-3 rounded-full bg-white/10 px-3 py-1 font-mono text-[10px] font-semibold text-slate-200 backdrop-blur-md animate-pulse border border-white/10">
              Tap to hear the Earth
            </span>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BOTTOM: Timeline Scrubber & Now Hearing Caption
          ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 mt-auto space-y-2.5 pt-2">
        {/* Timeline Scrubber */}
        <div className="space-y-1">
          <div className="relative flex items-center">
            {/* Custom filled progress track */}
            <div className="absolute left-0 right-0 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-75"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: accentColor,
                  boxShadow: `0 0 8px ${accentColor}`,
                }}
              />
            </div>
            <input
              type="range"
              min="0"
              max={validDuration}
              step="0.1"
              value={currentTime}
              onChange={(e) => {
                onScrub(Number(e.target.value));
                onDetentTick?.();
              }}
              aria-label="Audio timeline position"
              aria-valuenow={Math.round(currentTime)}
              aria-valuemin={0}
              aria-valuemax={Math.round(validDuration)}
              aria-valuetext={`${formatTime(currentTime)} of ${formatTime(validDuration)}`}
              className="relative z-10 h-3 w-full cursor-pointer appearance-none bg-transparent accent-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            />
          </div>

          <div className="flex justify-between font-mono text-[10px] text-slate-400 select-none">
            <span>{formatTime(currentTime)}</span>
            <span className="text-slate-300 font-medium">
              {formatTime(validDuration)}
            </span>
          </div>
        </div>

        {/* Accessible "Now Hearing" Plain-Language Caption */}
        <div
          role="region"
          aria-label="Current acoustic soundscape description"
          className="rounded-xl border bg-black/50 px-3.5 py-2 backdrop-blur-md transition-colors duration-500"
          style={{ borderColor: `${accentColor}26` }}
        >
          <div
            className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider transition-colors duration-500"
            style={{ color: accentColor }}
          >
            <span
              className="size-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: accentColor }}
            />
            <span className="font-bold">Now Hearing:</span>
          </div>
          <p
            aria-live="polite"
            className="mt-0.5 text-xs text-slate-300 leading-snug line-clamp-2"
          >
            {getNowHearingDescription()}
          </p>
        </div>
      </div>
    </div>
  );
}
