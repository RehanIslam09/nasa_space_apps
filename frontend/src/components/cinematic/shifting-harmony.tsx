'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import {
  earthSongConfig,
  type TelemetryPoint,
  type TelemetryPanelConfig,
} from '@/config/earth-song.config';
import { insightsService } from '@/services/api';
import { Radio, Volume2 } from 'lucide-react';
import { shiftingHarmonyAudio } from './shifting-harmony-audio';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  (window as unknown as { ScrollTrigger: typeof ScrollTrigger }).ScrollTrigger = ScrollTrigger;
}

// ============================================================================
// TUNABLE CONSTANTS (Exposed for rapid creative direction & pacing adjustment)
// ============================================================================
export const TUNING = {
  // Pinned Stage & Timeline Pacing (expressed as fractions of 1.0)
  pinDuration: '+=260%',
  scrub: 1,

  // Scene choreography milestones along scrub (0.0 to 1.0)
  headingEntranceStart: 0.0,
  headingEntranceEnd: 0.12,
  subtitleRevealStart: 0.10,
  subtitleRevealEnd: 0.20,
  handoffStart: 0.20,
  handoffEnd: 0.32,
  panelsStart: 0.32,
  panelsEnd: 0.94,
  exitStart: 0.94,
  exitEnd: 1.0,

  // Layout & Transform Anchors
  headingAnchorScale: 0.36,
  headingAnchorY: -24,
  cardEnterY: 48,
  cardExitY: -30,
  cardExitScale: 0.985,

  // Numeric Counter Transitions
  counterTweenDuration: 0.5,
  counterTweenEase: 'power3.out',

  // Audio Audition Parameters
  auditionDuration: 1.8,
  auditionGain: 0.18,
  auditionAttack: 0.15,
  auditionRelease: 0.20,

  // Ripple Background Effects
  rippleMinOpacity: 0.05,
  rippleMaxOpacity: 0.12,
} as const;

export function ShiftingHarmony() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinStageRef = useRef<HTMLDivElement>(null);
  const headingWrapperRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardWrapperRef = useRef<HTMLDivElement>(null);
  const nebulaRef = useRef<HTMLDivElement>(null);
  const ripplesRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active stage & telemetry
  const prefersReducedMotion = useReducedMotion();
  const [panels, setPanels] = useState<TelemetryPanelConfig[]>(earthSongConfig.telemetryPanels);
  const [telemetrySynced, setTelemetrySynced] = useState(false);
  const [activePanelIndex, setActivePanelIndex] = useState(0);

  // Counter & Display state (initialized to first panel's target so it NEVER starts at 0.0%)
  const [displayValue, setDisplayValue] = useState<number>(() => {
    return earthSongConfig.telemetryPanels[0]?.numericTarget ?? -12.6;
  });
  const prevTargetRef = useRef<number>(earthSongConfig.telemetryPanels[0]?.numericTarget ?? -12.6);
  const counterTweenRef = useRef<gsap.core.Tween | null>(null);

  // Interactive Time Scrubbing state
  const [hoveredPoint, setHoveredPoint] = useState<TelemetryPoint | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);

  // Audio Audition state
  const [isAuditioning, setIsAuditioning] = useState(false);
  const [isSectionVisible, setIsSectionVisible] = useState(true);

  // Accessibility screen reader announcement
  const [announcement, setAnnouncement] = useState('');

  const activePanel = panels[activePanelIndex] ?? panels[0]!;

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Asynchronously enrich panels with real NASA scientific insights
  // ──────────────────────────────────────────────────────────────────────────
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
        // Fallback gracefully maintained
      }
    }

    loadTelemetry();
    return () => {
      isMounted = false;
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Announce stage change to screen readers (debounced)
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      const dec = activePanel.decimals ?? 0;
      const valStr = `${activePanel.prefix || ''}${activePanel.numericTarget.toFixed(dec)} ${activePanel.suffix}`;
      setAnnouncement(
        `Stage ${activePanelIndex + 1} of ${panels.length}: ${activePanel.topic}. ${activePanel.label}, ${valStr} ${activePanel.unitDecade}.`
      );
    }, 200);

    return () => clearTimeout(timer);
  }, [activePanelIndex, activePanel, panels.length]);

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Counter State Math: Smooth Tween on Panel Change (No Zero Drops)
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // If user is scrubbing the chart, the scrubbed year takes priority
    if (isScrubbing && hoveredPoint) return;

    const targetVal = activePanel.numericTarget;
    const startVal = prevTargetRef.current;

    // If starting on exact same value, set directly
    if (startVal === targetVal) {
      setDisplayValue(targetVal);
      return;
    }

    if (prefersReducedMotion) {
      prevTargetRef.current = targetVal;
      setDisplayValue(targetVal);
      return;
    }

    // Smoothly tween from previous value to new target over 500ms
    const state = { value: startVal };
    counterTweenRef.current?.kill();
    counterTweenRef.current = gsap.to(state, {
      value: targetVal,
      duration: TUNING.counterTweenDuration,
      ease: TUNING.counterTweenEase,
      onUpdate: () => {
        setDisplayValue(state.value);
      },
      onComplete: () => {
        prevTargetRef.current = targetVal;
        setDisplayValue(targetVal);
      },
    });

    return () => {
      counterTweenRef.current?.kill();
    };
  }, [activePanelIndex, activePanel.numericTarget, isScrubbing, hoveredPoint, prefersReducedMotion]);

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Subtitle Split into Words
  // ──────────────────────────────────────────────────────────────────────────
  const { titleWord1, titleWord2, titleWord3, subtitle } = earthSongConfig.copy.shiftingHarmony;
  const subtitleWords = useMemo(
    () =>
      subtitle.split(' ').map((word, i) => (
        <span key={i} className="harmony-subtitle-word inline-block opacity-25">
          {word}&nbsp;
        </span>
      )),
    [subtitle]
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Section Visibility Observer (Pauses background loops when offscreen)
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
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

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Cleanup Audio Audition on Unmount
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      shiftingHarmonyAudio.dispose();
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Unified Keynote Scene Timeline (Single Pinned Container + Single Scrub)
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !pinStageRef.current) return;

    const ctx = gsap.context(() => {
      const container = containerRef.current!;
      const pinStage = pinStageRef.current!;
      const headingWrapper = headingWrapperRef.current;
      const subtitleEl = subtitleRef.current;
      const cardWrapper = cardWrapperRef.current;

      if (!headingWrapper || !subtitleEl || !cardWrapper) return;

      // When reduced motion is preferred, simplify to clean resting layout
      if (prefersReducedMotion) {
        gsap.set('.harmony-word-the', { y: 0, opacity: 1 });
        gsap.set('.harmony-word-shifting', { x: 0, opacity: 1 });
        gsap.set('.harmony-word-harmony', { x: 0, opacity: 1 });
        gsap.set('.harmony-subtitle-word', { opacity: 1 });
        gsap.set(headingWrapper, { scale: TUNING.headingAnchorScale, y: TUNING.headingAnchorY });
        gsap.set(subtitleEl, { opacity: 0, display: 'none' });
        gsap.set(cardWrapper, { y: 0, scale: 1, opacity: 1 });
        return;
      }

      // Initial visual setup before scroll triggers
      gsap.set('.harmony-word-the', { y: 60, opacity: 0 });
      gsap.set('.harmony-word-shifting', { x: -80, opacity: 0 });
      gsap.set('.harmony-word-harmony', { x: 80, opacity: 0 });
      gsap.set(cardWrapper, { y: TUNING.cardEnterY, scale: 0.96, opacity: 0 });

      // ONE UNIFIED MASTER TIMELINE DRIVEN BY SCROLLTRIGGER
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: TUNING.pinDuration,
          pin: pinStage,
          pinSpacing: true,
          scrub: TUNING.scrub,
          onUpdate: (self) => {
            const p = self.progress;

            // Map progress across active panel stages [panelsStart, panelsEnd]
            if (p < TUNING.panelsStart) {
              setActivePanelIndex(0);
            } else if (p >= TUNING.panelsEnd) {
              setActivePanelIndex(panels.length - 1);
            } else {
              const panelProgress = (p - TUNING.panelsStart) / (TUNING.panelsEnd - TUNING.panelsStart);
              const idx = Math.min(
                Math.floor(panelProgress * panels.length),
                panels.length - 1
              );
              setActivePanelIndex(idx);
            }
          },
        },
      });

      // ----------------------------------------------------------------------
      // PHASE 1: Heading Entrance (0.00 -> 0.12)
      // "THE SHIFTING HARMONY" words slide in masked
      // ----------------------------------------------------------------------
      masterTl
        .to(
          '.harmony-word-the',
          { y: 0, opacity: 1, duration: 0.08, ease: 'power3.out' },
          0.0
        )
        .to(
          '.harmony-word-shifting',
          { x: 0, opacity: 1, duration: 0.10, ease: 'power3.out' },
          0.02
        )
        .to(
          '.harmony-word-harmony',
          { x: 0, opacity: 1, duration: 0.10, ease: 'power3.out' },
          0.02
        );

      // ----------------------------------------------------------------------
      // PHASE 2: Subtitle Reveal (0.10 -> 0.20)
      // Word-by-word staggered reveal
      // ----------------------------------------------------------------------
      masterTl.to(
        '.harmony-subtitle-word',
        {
          opacity: 1,
          stagger: 0.004,
          duration: 0.08,
          ease: 'power2.out',
        },
        0.10
      );

      // ----------------------------------------------------------------------
      // PHASE 3: Coordinated Handoff (0.20 -> 0.32)
      // Heading rises & condenses into top anchor, Subtitle fades, Card rises in
      // ----------------------------------------------------------------------
      masterTl
        .to(
          headingWrapper,
          {
            scale: TUNING.headingAnchorScale,
            y: TUNING.headingAnchorY,
            duration: 0.12,
            ease: 'power2.inOut',
          },
          0.20
        )
        .to(
          subtitleEl,
          {
            opacity: 0,
            y: -12,
            duration: 0.08,
            ease: 'power2.out',
          },
          0.20
        )
        .to(
          cardWrapper,
          {
            y: 0,
            scale: 1,
            opacity: 1,
            duration: 0.12,
            ease: 'expo.out',
          },
          0.20
        );

      // ----------------------------------------------------------------------
      // PHASE 4: Telemetry Stages Hold & Transition (0.32 -> 0.94)
      // Dummy step keeping timeline pacing calibrated for smooth scrubbing
      // ----------------------------------------------------------------------
      masterTl.to(
        cardWrapper,
        {
          y: 0,
          duration: 0.62,
          ease: 'none',
        },
        0.32
      );

      // ----------------------------------------------------------------------
      // PHASE 5: Exit Without Void (0.94 -> 1.00)
      // Card stays fully visible, gently lifts (-30px, scale 0.985), bottom feathers
      // ----------------------------------------------------------------------
      masterTl.to(
        cardWrapper,
        {
          y: TUNING.cardExitY,
          scale: TUNING.cardExitScale,
          duration: 0.06,
          ease: 'power2.inOut',
        },
        0.94
      );

      // Refresh math after web fonts and assets settle
      if (typeof document !== 'undefined' && 'fonts' in document) {
        document.fonts.ready.then(() => {
          ScrollTrigger.refresh();
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [panels.length, prefersReducedMotion]);

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Live Waveform Canvas (Connected to Web Audio Analyser & Telemetry)
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;
    const freqData = new Uint8Array(128);

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      if (isSectionVisible) {
        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        ctx.clearRect(0, 0, width, height);

        const currentWf = activePanel.waveform;
        const midY = height / 2;
        const steps = Math.min(Math.floor(width / 2), 240);

        // Check if an audition is actively playing through the Web Audio Analyser
        const analyser = shiftingHarmonyAudio.getAnalyser();

        if (analyser && isAuditioning) {
          // LIVE PHYSICAL WAVEFORM FROM WEB AUDIO
          analyser.getByteTimeDomainData(freqData);

          ctx.beginPath();
          for (let i = 0; i < steps; i++) {
            const x = (i / steps) * width;
            const dataIndex = Math.floor((i / steps) * freqData.length);
            const v = (freqData[dataIndex] ?? 128) / 128.0; // 0 to 2
            const y = v * midY;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
        } else {
          // IDLE TELEMETRY WAVEFORM FROM PANEL PARAMETERS
          ctx.beginPath();
          for (let i = 0; i <= steps; i++) {
            const x = (i / steps) * width;
            const nx = i / steps;

            const wave1 =
              Math.sin(nx * currentWf.frequency * 7 + time * 3.0) * (currentWf.amplitude * 0.45);
            const wave2 =
              Math.sin(nx * currentWf.frequency * 14 - time * 4.2) * (currentWf.amplitude * 0.25);
            const jagged =
              Math.sin(nx * 50 + time * 6) *
              Math.cos(nx * 25) *
              (currentWf.amplitude * currentWf.jaggedness * 0.6);

            const y = midY + wave1 + wave2 + jagged;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          time += 0.03;
        }

        ctx.strokeStyle = activePanel.color.accent;
        ctx.lineWidth = isAuditioning ? 2.5 : 1.75;
        ctx.shadowColor = activePanel.color.glow;
        ctx.shadowBlur = isAuditioning ? 14 : 8;
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activePanel, isSectionVisible, isAuditioning, prefersReducedMotion]);

  // ──────────────────────────────────────────────────────────────────────────
  // 9. Interactive SVG Sparkline Calculation
  // ──────────────────────────────────────────────────────────────────────────
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
      return { x, y, point: d, index: i };
    });

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

  // ──────────────────────────────────────────────────────────────────────────
  // 10. Scrubbing Handlers (Mouse, Touch, Keyboard)
  // ──────────────────────────────────────────────────────────────────────────
  const handleScrubMove = useCallback(
    (clientX: number, target: SVGSVGElement) => {
      const rect = target.getBoundingClientRect();
      const relativePixelX = clientX - rect.left;
      const relativeX = Math.max(0, Math.min(420, (relativePixelX / rect.width) * 420));
      setHoverX(relativeX);
      setIsScrubbing(true);

      let closest = chartSvgPath.points[0]?.point ?? null;
      let closestIdx = 0;
      let minDist = Infinity;

      chartSvgPath.points.forEach((pt, i) => {
        const dist = Math.abs(pt.x - relativeX);
        if (dist < minDist) {
          minDist = dist;
          closest = pt.point;
          closestIdx = i;
        }
      });

      setHoveredPoint(closest);
      setScrubIndex(closestIdx);

      // Dynamically sync giant headline number with scrubbed year
      if (closest) {
        setDisplayValue(closest.value);
      }
    },
    [chartSvgPath.points]
  );

  const handleScrubEnd = useCallback(() => {
    setHoverX(null);
    setHoveredPoint(null);
    setIsScrubbing(false);
    setScrubIndex(null);

    // Smoothly ease back to the scroll-driven target
    const targetVal = activePanel.numericTarget;
    const state = { value: displayValue };
    counterTweenRef.current?.kill();
    counterTweenRef.current = gsap.to(state, {
      value: targetVal,
      duration: 0.4,
      ease: 'power3.out',
      onUpdate: () => setDisplayValue(state.value),
      onComplete: () => {
        prevTargetRef.current = targetVal;
        setDisplayValue(targetVal);
      },
    });
  }, [activePanel.numericTarget, displayValue]);

  // Keyboard navigation on chart
  const handleChartKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const points = chartSvgPath.points;
    if (!points.length) return;

    let nextIdx = scrubIndex ?? points.length - 1;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIdx = Math.max(0, nextIdx - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIdx = Math.min(points.length - 1, nextIdx + 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIdx = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIdx = points.length - 1;
    } else {
      return;
    }

    const selected = points[nextIdx]!;
    setScrubIndex(nextIdx);
    setHoveredPoint(selected.point);
    setHoverX(selected.x);
    setIsScrubbing(true);
    setDisplayValue(selected.point.value);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 11. Audio Audition Trigger
  // ──────────────────────────────────────────────────────────────────────────
  const handleAudition = () => {
    if (isAuditioning) {
      shiftingHarmonyAudio.stopAudition(setIsAuditioning);
    } else {
      const success = shiftingHarmonyAudio.playAudition(
        activePanel.frequency,
        TUNING.auditionDuration,
        TUNING.auditionGain,
        setIsAuditioning
      );
      if (!success) {
        // If muted or blocked, provide tactile micro-feedback
        setIsAuditioning(false);
      }
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 12. Stepper Button Click: Smooth Scroll to Stage
  // ──────────────────────────────────────────────────────────────────────────
  const scrollToStage = (stageIdx: number) => {
    if (!containerRef.current) return;
    const containerTop = containerRef.current.offsetTop;
    const pinDistancePx = window.innerHeight * 2.6; // Matches +=260%
    const stageSlice = (TUNING.panelsEnd - TUNING.panelsStart) / panels.length;
    const targetProgress = TUNING.panelsStart + stageIdx * stageSlice + stageSlice * 0.5;
    const targetScrollY = containerTop + targetProgress * pinDistancePx;

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth',
    });
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 13. Formatted Value & Unit strings
  // ──────────────────────────────────────────────────────────────────────────
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
      {/* Screen Reader Live Region */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          UNIFIED PINNED STAGE (Apple Keynote Pacing & Choreography)
      ───────────────────────────────────────────────────────────── */}
      <div
        ref={pinStageRef}
        className="relative flex h-[100dvh] min-h-[100dvh] w-full flex-col items-center justify-center px-4 sm:px-6 overflow-hidden select-none"
        style={{
          maskImage: 'linear-gradient(to bottom, black 88%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 88%, transparent 100%)',
        }}
      >
        {/* Dynamic Stacked Ambient Nebula Glow layers */}
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

        {/* Faint Concentric Sound Ripple Rings Expanding Behind Stage */}
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

        {/* ─────────────────────────────────────────────────────────────
            1. UNIFIED SCENE HEADING (Transforms smoothly into Top Anchor)
        ───────────────────────────────────────────────────────────── */}
        <div
          ref={headingWrapperRef}
          className="relative z-20 w-full max-w-5xl px-4 text-center will-change-transform origin-top"
        >
          <div className="mx-auto overflow-hidden">
            {/* Masked Headline: THE SHIFTING HARMONY */}
            <div className="flex flex-wrap items-center justify-center gap-2 overflow-hidden sm:gap-4 md:gap-6">
              <span className="harmony-word-the special-font hero-heading text-3xl uppercase tracking-tight text-white/70 sm:text-6xl md:text-7xl lg:text-8xl">
                {titleWord1}
              </span>
              <span className="harmony-word-shifting special-font hero-heading text-3xl uppercase tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
                {titleWord2}
              </span>
              <span className="harmony-word-harmony special-font hero-heading text-3xl uppercase tracking-tight text-sky-400 sm:text-6xl md:text-7xl lg:text-8xl">
                {titleWord3}
              </span>
            </div>

            {/* Subtitle Word-by-Word Scroll Reveal */}
            <p
              ref={subtitleRef}
              className="font-circular mx-auto mt-2 max-w-2xl text-xs font-light text-slate-300 sm:mt-3 sm:text-sm md:text-base"
            >
              {subtitleWords}
            </p>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. UNIFIED TELEMETRY CARD (Enters smoothly under Anchor)
        ───────────────────────────────────────────────────────────── */}
        <div
          ref={cardWrapperRef}
          className="relative z-10 mx-auto w-full max-w-5xl will-change-transform mt-2 sm:mt-4"
        >
          <div className="apple-glass relative overflow-hidden rounded-3xl border border-white/10 p-4 shadow-2xl backdrop-blur-2xl transition-colors duration-500 sm:p-7 lg:p-9">
            {/* Header: Category + Interactive Frequency Audition Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3 sm:pb-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="size-2 animate-ping rounded-full"
                  style={{ backgroundColor: activePanel.color.accent }}
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-300 sm:text-xs">
                  {activePanel.topic}
                </span>
              </div>

              {/* Interactive Hz Audition Button */}
              <button
                type="button"
                onClick={handleAudition}
                aria-label={`Hear ${activePanel.frequency} planetary harmonic resonance: ${activePanel.sonicStatus}`}
                className="group flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs transition-all hover:border-sky-400/50 hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer"
              >
                {isAuditioning ? (
                  <Volume2 className="size-3.5 animate-pulse text-sky-400" />
                ) : (
                  <Radio
                    className="size-3.5 transition-transform group-hover:scale-110"
                    style={{ color: activePanel.color.accent }}
                  />
                )}
                <span className="font-mono text-[10px] text-slate-200 sm:text-[11px]">
                  {activePanel.frequency} • {activePanel.sonicStatus}
                </span>
                <span
                  className="ml-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase transition-colors"
                  style={{
                    backgroundColor: isAuditioning ? activePanel.color.accent : 'rgba(255,255,255,0.08)',
                    color: isAuditioning ? '#000000' : '#94a3b8',
                  }}
                >
                  {isAuditioning ? 'AUDITION LIVE' : 'HEAR TONE'}
                </span>
                {telemetrySynced && !isAuditioning && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
                    <span className="size-1 rounded-full bg-emerald-400" />
                    LIVE
                  </span>
                )}
              </button>
            </div>

            {/* Main Stage Grid: Giant Number + Interactive Sparkline Chart */}
            <div className="mt-4 grid grid-cols-1 items-center gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-12 lg:gap-8">
              {/* Left Column: Giant Number + Description */}
              <div className="lg:col-span-6">
                <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400 sm:text-[11px]">
                  {activePanel.label}
                </div>

                {/* Giant Condensed Tabular Counter — Strictly No Wrapping */}
                <div
                  className="mt-1 flex flex-nowrap items-baseline gap-2 whitespace-nowrap leading-none transition-all"
                  style={{ textShadow: `0 0 35px ${activePanel.color.glow}` }}
                  aria-label={`${activePanel.label}, ${displaySign}${displayNumber} ${activePanel.suffix} ${activePanel.unitDecade}`}
                >
                  <span className="special-font font-zentry shrink-0 text-[clamp(2.5rem,6.5vw,5.75rem)] font-black tabular-nums tracking-tight text-white">
                    {displaySign}
                    {displayNumber}
                  </span>
                  <span className="font-zentry shrink-0 whitespace-nowrap text-[clamp(1.1rem,2.5vw,2.25rem)] font-bold uppercase text-slate-300">
                    {activePanel.suffix}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-slate-500 sm:text-[11px]">
                  <span>{activePanel.unitDecade}</span>
                  {hoveredPoint && (
                    <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-bold text-sky-300 animate-pulse">
                      OBSERVATION ({hoveredPoint.year})
                    </span>
                  )}
                </div>

                {/* Scientifically interpreted caption */}
                <p className="font-circular mt-3 max-w-md text-xs font-light leading-relaxed text-slate-300/90 sm:mt-4 sm:text-sm">
                  {activePanel.caption}
                </p>

                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 sm:mt-4">
                  <span className="font-mono text-[10px] text-slate-500">Sensor:</span>
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-white/90">
                    {activePanel.sensor}
                  </span>
                </div>
              </div>

              {/* Right Column: Interactive Chart & Waveform Visual */}
              <div className="flex flex-col gap-3 sm:gap-4 lg:col-span-6">
                {/* 1. Time-Series SVG Chart with Touch/Mouse/Keyboard Scrubbing */}
                <div
                  tabIndex={0}
                  role="slider"
                  aria-label="Observational time-series inspection"
                  aria-valuemin={0}
                  aria-valuemax={activePanel.chart.length - 1}
                  aria-valuenow={scrubIndex ?? activePanel.chart.length - 1}
                  aria-valuetext={
                    hoveredPoint
                      ? `${hoveredPoint.year}: ${hoveredPoint.value} ${activePanel.suffix}`
                      : `${activePanel.chart[activePanel.chart.length - 1]?.year}: ${activePanel.chart[activePanel.chart.length - 1]?.value} ${activePanel.suffix}`
                  }
                  onKeyDown={handleChartKeyDown}
                  onBlur={handleScrubEnd}
                  className="relative rounded-2xl border border-white/[0.08] bg-black/50 p-3 backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:p-3.5"
                >
                  <div className="flex items-center justify-between pb-1 font-mono text-[10px] text-slate-400">
                    <span>OBSERVATIONAL TIME-SERIES</span>
                    <span className="text-sky-300 font-bold">
                      {hoveredPoint
                        ? `${hoveredPoint.year}: ${hoveredPoint.value}${activePanel.suffix}`
                        : 'SCRUB TO INSPECT'}
                    </span>
                  </div>

                  <svg
                    viewBox="0 0 420 130"
                    style={{ touchAction: 'none' }}
                    className="h-20 w-full cursor-crosshair overflow-visible sm:h-24 md:h-28"
                    onMouseMove={(e) => handleScrubMove(e.clientX, e.currentTarget)}
                    onMouseLeave={handleScrubEnd}
                    onTouchStart={(e) => {
                      if (e.touches[0]) handleScrubMove(e.touches[0].clientX, e.currentTarget);
                    }}
                    onTouchMove={(e) => {
                      if (e.touches[0]) handleScrubMove(e.touches[0].clientX, e.currentTarget);
                    }}
                    onTouchEnd={handleScrubEnd}
                    onTouchCancel={handleScrubEnd}
                  >
                    <defs>
                      <linearGradient
                        id={`area-grad-${activePanel.id}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={activePanel.color.accent} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={activePanel.color.accent} stopOpacity="0.0" />
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
                        strokeWidth="1.25"
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
                            r={isHovered ? 5.5 : 4}
                            fill="#ffffff"
                            stroke={activePanel.color.accent}
                            strokeWidth="2"
                          />
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 10 : 7}
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
                <div className="relative rounded-2xl border border-white/[0.08] bg-black/50 p-2.5 backdrop-blur-md sm:p-3">
                  <div className="flex items-center justify-between pb-1 font-mono text-[9px] text-slate-400 sm:text-[10px]">
                    <span>TELEMETRY SONIC WAVEFORM</span>
                    <span className="text-sky-300">
                      {isAuditioning ? 'LIVE RESONANCE HARMONIC' : 'MATHEMATICAL CADENCE'}
                    </span>
                  </div>
                  <div className="h-9 w-full sm:h-11">
                    <canvas ref={canvasRef} className="h-full w-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Accessible Stepper at Bottom of Card */}
            <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-3 sm:mt-6 sm:pt-3.5">
              <span className="font-mono text-[9px] text-slate-400 sm:text-[10px]">
                SCROLL TO ADVANCE TELEMETRY STAGE
              </span>
              <div
                role="tablist"
                aria-label="Planetary telemetry stages"
                className="flex items-center gap-1 sm:gap-2"
              >
                {panels.map((p, idx) => (
                  <button
                    key={p.id}
                    role="tab"
                    type="button"
                    aria-selected={idx === activePanelIndex}
                    aria-label={`Stage ${idx + 1} of ${panels.length}: ${p.topic}`}
                    onClick={() => scrollToStage(idx)}
                    className="group relative flex h-10 min-w-[36px] sm:min-w-[44px] items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer"
                  >
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: idx === activePanelIndex ? '28px' : '8px',
                        backgroundColor:
                          idx === activePanelIndex
                            ? activePanel.color.accent
                            : 'rgba(255,255,255,0.2)',
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

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
