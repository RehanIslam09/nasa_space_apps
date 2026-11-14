'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import {
  earthSongConfig,
  type TelemetryPoint,
  type TelemetryPanelConfig,
} from '@/config/earth-song.config';
import { insightsService } from '@/services/api';
import { Radio } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  (window as unknown as { ScrollTrigger: typeof ScrollTrigger }).ScrollTrigger = ScrollTrigger;
}

// Tunable animation and layout constants
const TUNING = {
  // Pinning & scroll distance
  pinDuration: '+=220%',
  pinTop: 'clamp(6rem, 9vh, 11rem)',              // Pinned card top offset from viewport ceiling

  // Spacing & Layout
  gapSubtitleToCard: 'clamp(1.5rem, 6vh, 2.5rem)', // Scaled gap to ensure <= 18vh space across all viewports
  cardEnterY: 48,                                  // px initial translateY for handoff
  headingExitY: -40,                               // px drift upwards on exit
  scaleFactor: 0.96,                               // scale transition factor
  headingExitOpacity: 0.3,                         // target opacity for scrolled-out heading

  // Sound ripple depth rings
  rippleMinOpacity: 0.06,
  rippleMaxOpacity: 0.12,

  ease: 'expo.out',
} as const;

export function ShiftingHarmony() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingSectionRef = useRef<HTMLDivElement>(null);
  const pinWrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const nebulaRef = useRef<HTMLDivElement>(null);
  const ripplesRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activePanelIndex, setActivePanelIndex] = useState(0);
  const [displayValue, setDisplayValue] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState<TelemetryPoint | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [isSectionVisible, setIsSectionVisible] = useState(true);

  const prefersReducedMotion = useReducedMotion();
  const [panels, setPanels] = useState<TelemetryPanelConfig[]>(earthSongConfig.telemetryPanels);
  const [telemetrySynced, setTelemetrySynced] = useState(false);
  const activePanel = panels[activePanelIndex] ?? panels[0]!;

  // Asynchronously enrich telemetry panels with real NASA scientific insights
  useEffect(() => {
    let isMounted = true;
    async function loadTelemetry() {
      try {
        const [aerosolsRes, oceanRes] = await Promise.all([
          insightsService.getInsights('geos-aerosols'),
          insightsService.getInsights('ocean-currents-temp'),
        ]);

        if (!isMounted) return;

        setPanels((prev) =>
          prev.map((panel) => {
            if (panel.id === 'atmosphere' && aerosolsRes.success && aerosolsRes.data) {
              const d = aerosolsRes.data;
              return {
                ...panel,
                caption: d.scientific_interpretation,
                sonicStatus: `${d.dominant_layer} (${Math.round(d.mean_intensity * 100)}% Depth)`,
              };
            }
            if (panel.id === 'ocean' && oceanRes.success && oceanRes.data) {
              const d = oceanRes.data;
              return {
                ...panel,
                caption: d.scientific_interpretation,
                sonicStatus: `${d.dominant_layer} (${Math.round(d.mean_intensity * 100)}% Flux)`,
              };
            }
            return panel;
          })
        );
        setTelemetrySynced(true);
      } catch {
        // Fallback maintained smoothly
      }
    }

    loadTelemetry();
    return () => {
      isMounted = false;
    };
  }, []);

  const { titleWord1, titleWord2, titleWord3, subtitle } = earthSongConfig.copy.shiftingHarmony;

  // Split subtitle into words for word-by-word reveal
  const subtitleWords = useMemo(
    () =>
      subtitle.split(' ').map((word, i) => (
        <span key={i} className="harmony-subtitle-word inline-block opacity-25">
          {word}&nbsp;
        </span>
      )),
    [subtitle]
  );

  // Pause GPU animations when offscreen
  useEffect(() => {
    const el = ripplesRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSectionVisible(entry?.isIntersecting ?? false);
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Coordinated GSAP ScrollTriggers in strict document order:
  // 1. Heading slide-in -> 2. Handoff scrub (Heading out / Card in) -> 3. Pinned Data Stage
  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const headingSection = headingSectionRef.current;
      const pinWrapper = pinWrapperRef.current;
      const card = cardRef.current;
      if (!headingSection || !pinWrapper || !card) return;

      // 1. Heading masked word-slide-in and subtitle reveal
      const headingTl = gsap.timeline({
        scrollTrigger: {
          trigger: headingSection,
          start: 'top 85%',
          end: 'bottom 45%',
          scrub: 0.6,
          refreshPriority: 2,
        },
      });

      headingTl
        .fromTo(
          '.harmony-word-the',
          { y: '100%', opacity: 0 },
          { y: '0%', opacity: 1, duration: 0.6, ease: 'power3.out' }
        )
        .fromTo(
          '.harmony-word-shifting',
          { x: -110, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
          0.1
        )
        .fromTo(
          '.harmony-word-harmony',
          { x: 110, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
          0.1
        )
        .to(
          '.harmony-subtitle-word',
          {
            opacity: 1,
            stagger: 0.02,
            duration: 0.5,
            ease: 'power2.out',
          },
          0.3
        );

      // 2. Coordinated Handoff: Heading drifts out & fades while Card rises in smoothly
      const handoffTl = gsap.timeline({
        scrollTrigger: {
          trigger: headingSection,
          start: 'bottom 85%',
          end: 'bottom 25%',
          scrub: 1,
          refreshPriority: 1,
        },
      });

      handoffTl
        .to(
          headingSection,
          {
            y: TUNING.headingExitY,
            scale: TUNING.scaleFactor,
            opacity: TUNING.headingExitOpacity,
            ease: 'power2.out',
          },
          0
        )
        .fromTo(
          card,
          {
            y: TUNING.cardEnterY,
            scale: TUNING.scaleFactor,
            opacity: 0,
          },
          {
            y: 0,
            scale: 1,
            opacity: 1,
            ease: TUNING.ease,
          },
          0
        );

      // 3. Sequential Pinned Stage: pins pinWrapper at top: 0
      ScrollTrigger.create({
        trigger: pinWrapper,
        start: 'top top',
        end: TUNING.pinDuration,
        pin: true,
        pinSpacing: true,
        scrub: 0.4,
        refreshPriority: 0,
        onUpdate: (self) => {
          const progress = self.progress;

          // Apple-style handoff at final 16%: card, nebula, and ripples dissolve into pure cosmic starfield
          if (progress > 0.84) {
            const fadeRatio = Math.min(1, (progress - 0.84) / 0.14); // 0 to 1
            const remainingOpacity = Math.max(0, 1 - fadeRatio);
            gsap.set(card, {
              scale: 1 - fadeRatio * 0.1,
              opacity: remainingOpacity,
            });
            if (nebulaRef.current) {
              gsap.set(nebulaRef.current, { opacity: remainingOpacity });
            }
            if (ripplesRef.current) {
              gsap.set(ripplesRef.current, { opacity: remainingOpacity });
            }
          } else {
            gsap.set(card, {
              scale: 1,
              opacity: 1,
            });
            if (nebulaRef.current) {
              gsap.set(nebulaRef.current, { opacity: 1 });
            }
            if (ripplesRef.current) {
              gsap.set(ripplesRef.current, { opacity: 1 });
            }
          }

          // Active panel indexing across progress (scaled over first 84% so panel 4 settles nicely)
          const panelProgress = Math.min((progress / 0.84) * panels.length, panels.length - 0.001);
          const index = Math.floor(panelProgress);
          setActivePanelIndex(index);

          // Animate numeric counter proportionally within the active panel slice
          const targetConfig = panels[index]!;
          const sliceFraction = panelProgress - index; // 0 to 1 inside current panel
          const interpolated = targetConfig.numericTarget * Math.min(sliceFraction * 1.5, 1);
          setDisplayValue(interpolated);
        },
      });

      // Refresh math after fonts and video metadata settle
      if (typeof document !== 'undefined' && 'fonts' in document) {
        document.fonts.ready.then(() => {
          ScrollTrigger.refresh();
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [panels, prefersReducedMotion]);

  // 3. Audio-Waveform Canvas tied to active panel frequency and telemetry
  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;
    let isVisible = true;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry?.isIntersecting ?? false;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const render = () => {
      if (isVisible) {
        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        ctx.clearRect(0, 0, width, height);

        const currentWf = activePanel.waveform;
        const midY = height / 2;
        const steps = Math.min(Math.floor(width / 2), 240);

        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const x = (i / steps) * width;
          const nx = i / steps;

          // Panel specific frequency vibration
          const wave1 =
            Math.sin(nx * currentWf.frequency * 8 + time * 3.2) * currentWf.amplitude * 0.5;
          const wave2 =
            Math.sin(nx * currentWf.frequency * 16 - time * 4.5) * currentWf.amplitude * 0.3;

          // Jaggedness noise injected based on telemetry severity
          const jagged =
            Math.sin(nx * 60 + time * 8) *
            Math.cos(nx * 30) *
            (currentWf.amplitude * currentWf.jaggedness * 0.7);

          const y = midY + wave1 + wave2 + jagged;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.strokeStyle = activePanel.color.accent;
        ctx.lineWidth = 1.75;
        ctx.shadowColor = activePanel.color.glow;
        ctx.shadowBlur = 10;
        ctx.stroke();

        time += 0.03;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [activePanel, prefersReducedMotion]);

  // Compute SVG sparkline path for active panel's chart dataset
  const chartSvgPath = useMemo(() => {
    const data = activePanel.chart;
    if (!data.length) return { path: '', area: '', points: [] };

    const width = 420;
    const height = 130;
    const padding = 16;

    const values = data.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const coords = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((d.value - minVal) / range) * (height - 2 * padding);
      return { x, y, point: d };
    });

    // Smooth Bezier Curve
    let pathD = `M ${coords[0]!.x} ${coords[0]!.y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i]!;
      const p1 = coords[i + 1]!;
      const cx = (p0.x + p1.x) / 2;
      pathD += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const lastCoord = coords[coords.length - 1]!;
    const areaD = `${pathD} L ${lastCoord.x} ${height - padding} L ${coords[0]!.x} ${height - padding} Z`;

    return { path: pathD, area: areaD, points: coords };
  }, [activePanel]);

  // Handle interactive hover on chart
  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relativeX = (mouseX / rect.width) * 420;
    setHoverX(relativeX);

    // Find closest point
    let closest = chartSvgPath.points[0]?.point ?? null;
    let minDist = Infinity;
    chartSvgPath.points.forEach((pt) => {
      const dist = Math.abs(pt.x - relativeX);
      if (dist < minDist) {
        minDist = dist;
        closest = pt.point;
      }
    });
    setHoveredPoint(closest);
  };

  const handleChartMouseLeave = () => {
    setHoverX(null);
    setHoveredPoint(null);
  };

  // Format tabular display number and sign without wrapping
  const { displaySign, displayNumber } = useMemo(() => {
    const dec = activePanel.decimals ?? 0;
    const sign = displayValue > 0 && activePanel.prefix ? '+' : '';
    const num = displayValue.toFixed(dec);
    return { displaySign: sign, displayNumber: num };
  }, [activePanel, displayValue]);

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-transparent text-white"
      aria-label="Section B: Planetary Telemetry — The Shifting Harmony"
    >
      {/* ─────────────────────────────────────────────────────────────
          1. HEADING SECTION: MASKED REVEAL WITH SLIDING WORDS
      ───────────────────────────────────────────────────────────── */}
      <div
        ref={headingSectionRef}
        className="relative z-10 px-6 pb-1 pt-16 text-center sm:pb-2 sm:pt-24 will-change-transform"
      >
        <div className="mx-auto max-w-5xl overflow-hidden">
          {/* Masked Line: THE SHIFTING HARMONY */}
          <div className="flex flex-wrap items-center justify-center gap-3 overflow-hidden sm:gap-6">
            <span className="harmony-word-the special-font hero-heading text-4xl uppercase tracking-tight text-white/70 sm:text-7xl md:text-8xl lg:text-9xl">
              {titleWord1}
            </span>
            <span className="harmony-word-shifting special-font hero-heading text-4xl uppercase tracking-tight text-white sm:text-7xl md:text-8xl lg:text-9xl">
              {titleWord2}
            </span>
            <span className="harmony-word-harmony special-font hero-heading text-4xl uppercase tracking-tight text-sky-400 sm:text-7xl md:text-8xl lg:text-9xl">
              {titleWord3}
            </span>
          </div>

          {/* Subtitle Word-by-Word Scroll Reveal */}
          <p className="font-circular mx-auto mt-4 max-w-2xl text-base font-light text-slate-300 sm:text-lg">
            {subtitleWords}
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. PINNED "DATA AS MUSIC" SEQUENTIAL STAGE (APPLE KEYNOTE PACING)
      ───────────────────────────────────────────────────────────── */}
      <div
        ref={pinWrapperRef}
        style={{ ['--pin-top' as string]: TUNING.pinTop } as React.CSSProperties}
        className="relative flex min-h-screen w-full flex-col items-center justify-start px-4 pt-[var(--pin-top)] -mt-[var(--pin-top)] pb-12 sm:px-6 overflow-hidden"
      >
        {/* Dynamic Stacked Ambient Nebula Glow layers crossfading across panels */}
        <div ref={nebulaRef} className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {panels.map((p, idx) => (
            <div
              key={p.id}
              className="pointer-events-none absolute inset-0 transition-opacity duration-700 ease-out"
              style={{
                opacity: idx === activePanelIndex ? 1 : 0,
                background: `radial-gradient(circle at 50% 45%, ${p.color.nebula} 0%, rgba(3,6,22,0.4) 50%, transparent 80%)`,
              }}
            />
          ))}
        </div>

        {/* Faint Concentric Sound Ripple Rings Expanding Behind Card */}
        <div
          ref={ripplesRef}
          className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10 overflow-hidden"
          aria-hidden="true"
        >
          {!prefersReducedMotion && (
            <>
              <div
                className="absolute rounded-full border transition-colors duration-700 will-change-transform"
                style={{
                  width: '360px',
                  height: '360px',
                  borderColor: activePanel.color.accent,
                  animation: isSectionVisible
                    ? 'sound-ripple 5s cubic-bezier(0.2, 0.8, 0.4, 1) infinite'
                    : 'none',
                }}
              />
              <div
                className="absolute rounded-full border transition-colors duration-700 will-change-transform"
                style={{
                  width: '540px',
                  height: '540px',
                  borderColor: activePanel.color.accent,
                  animation: isSectionVisible
                    ? 'sound-ripple 7s cubic-bezier(0.2, 0.8, 0.4, 1) infinite 1.5s'
                    : 'none',
                }}
              />
              <div
                className="absolute rounded-full border transition-colors duration-700 will-change-transform"
                style={{
                  width: '720px',
                  height: '720px',
                  borderColor: activePanel.color.accent,
                  animation: isSectionVisible
                    ? 'sound-ripple 9s cubic-bezier(0.2, 0.8, 0.4, 1) infinite 3s'
                    : 'none',
                }}
              />
            </>
          )}
        </div>

        {/* Active Telemetry Panel Viewport (Properly centered, no void, no wrapping) */}
        <div ref={cardRef} className="relative z-10 mx-auto w-full max-w-5xl will-change-transform max-sm:origin-top max-sm:scale-[0.92]">
          <div className="apple-glass relative overflow-hidden rounded-3xl border border-white/10 p-6 shadow-2xl backdrop-blur-2xl transition-all duration-500 sm:p-10">
            {/* Header: Category + Frequency Badge */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <span
                  className="size-2 animate-ping rounded-full"
                  style={{ backgroundColor: activePanel.color.accent }}
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-300 sm:text-xs">
                  {activePanel.topic}
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs">
                <Radio
                  className="size-3.5 animate-pulse"
                  style={{ color: activePanel.color.accent }}
                />
                <span className="font-mono text-[10px] text-slate-200 sm:text-[11px]">
                  {activePanel.frequency} • {activePanel.sonicStatus}
                </span>
                {telemetrySynced && (
                  <span className="ml-1 inline-flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
                    <span className="size-1 rounded-full bg-emerald-400" />
                    LIVE
                  </span>
                )}
              </div>
            </div>

            {/* Main Stage Grid: Giant Number + Interactive Sparkline Chart */}
            <div className="mt-6 grid grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-8">
              {/* Left Column: Giant Number + One-Line Restrained Caption */}
              <div className="lg:col-span-6">
                <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  {activePanel.label}
                </div>

                {/* Giant Condensed Tabular Counter — STRICTLY ONE LINE, NO WRAPPING */}
                <div
                  className="mt-1 flex flex-nowrap items-baseline gap-2 whitespace-nowrap leading-none transition-all"
                  style={{ textShadow: `0 0 35px ${activePanel.color.glow}` }}
                >
                  <span className="special-font font-zentry shrink-0 text-[clamp(2.75rem,7vw,6.5rem)] font-black tabular-nums tracking-tight text-white">
                    {displaySign}
                    {displayNumber}
                  </span>
                  <span className="font-zentry shrink-0 whitespace-nowrap text-[clamp(1.15rem,2.8vw,2.5rem)] font-bold uppercase text-slate-300">
                    {activePanel.suffix}
                  </span>
                </div>


                <div className="mt-1 font-mono text-[11px] uppercase tracking-widest text-slate-500">
                  {activePanel.unitDecade}
                </div>

                {/* One-line soft caption */}
                <p className="font-circular mt-4 max-w-md text-xs font-light leading-relaxed text-slate-300/90 sm:text-sm">
                  {activePanel.caption}
                </p>

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-mono text-[10px] text-slate-500">Sensor:</span>
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-white/90">
                    {activePanel.sensor}
                  </span>
                </div>
              </div>

              {/* Right Column: Minimal Self-Drawing Chart & Audio Waveform Visual */}
              <div className="flex flex-col gap-4 lg:col-span-6">
                {/* 1. Self-Drawing SVG Chart with Interactive Cursor Scrub */}
                <div className="relative rounded-2xl border border-white/[0.08] bg-black/50 p-3.5 backdrop-blur-md">
                  <div className="flex items-center justify-between pb-1.5 font-mono text-[10px] text-slate-400">
                    <span>OBSERVATIONAL TIME-SERIES</span>
                    <span className="text-sky-300">
                      {hoveredPoint
                        ? `${hoveredPoint.year}: ${hoveredPoint.value}${activePanel.suffix}`
                        : 'SCRUB TO INSPECT'}
                    </span>
                  </div>

                  <svg
                    viewBox="0 0 420 130"
                    className="h-28 w-full cursor-crosshair overflow-visible"
                    onMouseMove={handleChartMouseMove}
                    onMouseLeave={handleChartMouseLeave}
                  >
                    <defs>
                      <linearGradient
                        id={`area-grad-${activePanel.id}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={activePanel.color.accent} stopOpacity="0.3" />
                        <stop
                          offset="100%"
                          stopColor={activePanel.color.accent}
                          stopOpacity="0.0"
                        />
                      </linearGradient>
                    </defs>

                    {/* Gradient Area Fill */}
                    <path d={chartSvgPath.area} fill={`url(#area-grad-${activePanel.id})`} />

                    {/* Main Line with Stroke Glow */}
                    <path
                      d={chartSvgPath.path}
                      fill="none"
                      stroke={activePanel.color.accent}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      style={{
                        filter: `drop-shadow(0 0 6px ${activePanel.color.glow})`,
                      }}
                    />

                    {/* Interactive Vertical Scrub Line */}
                    {hoverX !== null && (
                      <line
                        x1={hoverX}
                        y1="8"
                        x2={hoverX}
                        y2="115"
                        stroke="rgba(255,255,255,0.4)"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                    )}

                    {/* Leading Edge / Hover Pulsing Dot */}
                    {chartSvgPath.points.map((pt, idx) => {
                      const isHovered = hoveredPoint?.year === pt.point.year;
                      const isLast = idx === chartSvgPath.points.length - 1;
                      if (!isHovered && !isLast) return null;

                      return (
                        <g key={idx}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 5 : 4}
                            fill="#ffffff"
                            stroke={activePanel.color.accent}
                            strokeWidth="2"
                          />
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 9 : 7}
                            fill="none"
                            stroke={activePanel.color.accent}
                            strokeWidth="1"
                            className="animate-ping"
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* 2. Audio-Waveform Visualizer for Earth Song Telemetry */}
                <div className="relative rounded-2xl border border-white/[0.08] bg-black/50 p-3.5 backdrop-blur-md">
                  <div className="flex items-center justify-between pb-1 font-mono text-[10px] text-slate-400">
                    <span>TELEMETRY SONIC WAVEFORM</span>
                    <span className="text-sky-300">VIBRATION HARMONIC</span>
                  </div>
                  <div className="h-12 w-full">
                    <canvas ref={canvasRef} className="h-full w-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stepper Indicator at Bottom of Card */}
            <div className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-3.5">
              <span className="font-mono text-[10px] text-slate-400">
                SCROLL TO ADVANCE TELEMETRY STAGE
              </span>
              <div className="flex items-center gap-2">
                {panels.map((p, idx) => (
                  <div
                    key={p.id}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: idx === activePanelIndex ? '28px' : '8px',
                      backgroundColor:
                        idx === activePanelIndex
                          ? activePanel.color.accent
                          : 'rgba(255,255,255,0.2)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Soft Bottom Exit Fade into Sonic Section */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[10vh] bg-gradient-to-t from-black to-transparent"
        aria-hidden="true"
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes sound-ripple {
              0% {
                transform: scale(0.85);
                opacity: ${TUNING.rippleMaxOpacity};
              }
              50% {
                opacity: ${(TUNING.rippleMinOpacity + TUNING.rippleMaxOpacity) / 2};
              }
              100% {
                transform: scale(1.3);
                opacity: ${TUNING.rippleMinOpacity};
              }
            }
          `,
        }}
      />
    </section>
  );
}
