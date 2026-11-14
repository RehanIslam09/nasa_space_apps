'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { earthSongConfig } from '@/config/earth-song.config';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Tunable animation constants
const TUNING = {
  pinDuration: '+=200%',
  startInset: 'inset(14% 18% round 32px)',
  fullInset: 'inset(0% 0% round 0px)',
  exitInset: 'inset(0% 0% 100% 0%)',
  initialVideoScale: 1.3,
  kenBurnsScale: 1.12,
  kenBurnsParallaxY: '-3%',
  exitVideoScale: 1.05,
} as const;

export function BalanceDisrupted() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinWrapperRef = useRef<HTMLDivElement>(null);
  const clipBoxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lavaOverlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  const { label, titleLine1, titleLine2, description } = earthSongConfig.copy.balanceDisrupted;

  // Split description into words for word-by-word scroll reveal
  const descWords = description.split(' ').map((word, index) => (
    <span key={index} className="disrupted-desc-word inline-block opacity-25">
      {word}&nbsp;
    </span>
  ));

  // 1. Tension Detail: High-performance 60fps Heartbeat Dysrhythmia Waveform Canvas
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

    // Pause rendering when offscreen
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

        const currentProgress = progressRef.current;
        const midY = height / 2;
        const segments = Math.min(Math.floor(width / 3), 320);

        ctx.beginPath();

        for (let i = 0; i <= segments; i++) {
          const x = (i / segments) * width;
          const nx = i / segments;

          // Calm sine harmonic baseline (432 Hz rhythm)
          const calmSine = Math.sin(nx * 18 + time * 3.5) * (height * 0.22);

          // Chaotic arrhythmia spikes and ventricular fibrillation noise
          const pulseTrigger = Math.sin(nx * 26 - time * 6);
          const arrhythmiaSpike =
            Math.pow(Math.abs(pulseTrigger), 7) * Math.sign(pulseTrigger) * (height * 0.44);
          const erraticNoise = Math.sin(nx * 85 + time * 14) * Math.cos(nx * 42) * (height * 0.16);

          // Blend from harmonic calm to chaotic dysrhythmia as scroll progresses
          const chaos = Math.pow(Math.min(currentProgress * 1.3, 1), 1.7);
          const y = midY + calmSine * (1 - chaos * 0.6) + (arrhythmiaSpike + erraticNoise) * chaos;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Color grade shift from cool sky-blue (equilibrium) to lava-red (tension)
        const r = Math.round(56 + currentProgress * (248 - 56));
        const g = Math.round(189 - currentProgress * (189 - 100));
        const b = Math.round(248 - currentProgress * (248 - 90));

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.85 + currentProgress * 0.15})`;
        ctx.lineWidth = 1.75;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
        ctx.shadowBlur = 8;
        ctx.stroke();

        time += 0.025;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [prefersReducedMotion]);

  // 2. Pinned GSAP Scroll-Scrubbed Cinematic Sequence
  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const container = containerRef.current;
      const pinWrapper = pinWrapperRef.current;
      const clipBox = clipBoxRef.current;
      const video = videoRef.current;
      const lavaOverlay = lavaOverlayRef.current;

      const masterTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: TUNING.pinDuration,
          pin: pinWrapper,
          pinSpacing: true,
          scrub: 0.75,
          onUpdate: (self) => {
            progressRef.current = self.progress;
          },
        },
      });

      // ─────────────────────────────────────────────────────────────
      // STAGE 1: ENTRANCE (0.00 -> 0.30)
      // Card expands from small rounded window to edge-to-edge full bleed
      // Video scales down from 1.3 -> 1.0 (window opening feel)
      // ─────────────────────────────────────────────────────────────
      masterTimeline
        .fromTo(
          clipBox,
          { clipPath: TUNING.startInset },
          {
            clipPath: TUNING.fullInset,
            duration: 0.3,
            ease: 'power2.inOut',
          },
          0
        )
        .fromTo(
          video,
          { scale: TUNING.initialVideoScale },
          {
            scale: 1.0,
            duration: 0.3,
            ease: 'power2.out',
          },
          0
        );

      // ─────────────────────────────────────────────────────────────
      // STAGE 2: PINNED DRAMA (0.30 -> 0.78)
      // Ken Burns slow push-in (1.0 -> 1.12) + vertical parallax
      // Warm lava color grade creeps in from bottom
      // Masked title line-by-line reveal + word-by-word description
      // ─────────────────────────────────────────────────────────────
      masterTimeline
        .to(
          video,
          {
            scale: TUNING.kenBurnsScale,
            y: TUNING.kenBurnsParallaxY,
            duration: 0.48,
            ease: 'none',
          },
          0.3
        )
        .to(
          lavaOverlay,
          {
            opacity: 0.85,
            duration: 0.48,
            ease: 'power1.inOut',
          },
          0.3
        )
        // Label type/fade
        .fromTo(
          '.disrupted-label',
          { opacity: 0, y: 15, letterSpacing: '0.15em' },
          {
            opacity: 1,
            y: 0,
            letterSpacing: '0.35em',
            duration: 0.2,
            ease: 'power2.out',
          },
          0.32
        )
        // Huge masked title reveal: line 1
        .fromTo(
          '.balance-line-1',
          { y: '115%' },
          { y: '0%', duration: 0.28, ease: 'power3.out' },
          0.34
        )
        // Huge masked title reveal: line 2
        .fromTo(
          '.balance-line-2',
          { y: '115%' },
          { y: '0%', duration: 0.28, ease: 'power3.out' },
          0.4
        )
        // Description words reveal
        .to(
          '.disrupted-desc-word',
          {
            opacity: 1,
            stagger: 0.012,
            duration: 0.28,
            ease: 'power2.out',
          },
          0.38
        );

      // ─────────────────────────────────────────────────────────────
      // STAGE 3: EXIT (0.78 -> 1.00)
      // Video darkens and scales to 1.05
      // Clip path wipes away upward into smooth void
      // Warm overlay fades to deep blue for Section B continuity
      // ─────────────────────────────────────────────────────────────
      masterTimeline
        .to(
          video,
          {
            scale: TUNING.exitVideoScale,
            filter: 'brightness(0.35)',
            duration: 0.22,
            ease: 'power2.in',
          },
          0.78
        )
        .to(
          clipBox,
          {
            clipPath: TUNING.exitInset,
            duration: 0.22,
            ease: 'power2.in',
          },
          0.78
        )
        .to(
          lavaOverlay,
          {
            opacity: 0,
            duration: 0.2,
            ease: 'power2.in',
          },
          0.8
        );
    }, containerRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-black selection:bg-amber-400 selection:text-black"
      aria-label="Section A: Planetary Vulnerability — A Balance Disrupted"
    >
      <div
        ref={pinWrapperRef}
        className="relative flex h-screen w-full items-center justify-center overflow-hidden"
      >
        {/* Full-bleed Expanding Viewport with Hardware-Accelerated Clip Path */}
        <div
          ref={clipBoxRef}
          className="relative h-full w-full overflow-hidden will-change-[clip-path]"
          style={{ clipPath: TUNING.startInset }}
        >
          {/* Authentic Volcano / Planetary Disruption Footage */}
          <video
            ref={videoRef}
            src={earthSongConfig.media.storyVideo}
            loop
            muted
            playsInline
            autoPlay
            preload="metadata"
            className="h-full w-full object-cover object-center will-change-transform"
          />

          {/* Cinematic Vignette */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/30" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />

          {/* Dynamic Lava Color Grade Overlay (creeps in during scroll scrub) */}
          <div
            ref={lavaOverlayRef}
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-red-600/40 via-amber-600/15 to-transparent opacity-0 mix-blend-screen transition-opacity"
          />

          {/* Tension Detail: Heartbeat / Arrhythmia Waveform Line along bottom */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20">
            <canvas ref={canvasRef} className="h-full w-full" />
            <div className="absolute bottom-2.5 right-8 font-mono text-[9px] uppercase tracking-widest text-slate-400/80">
              <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-amber-400" />
              Dysrhythmia Index: Telemetry Divergence
            </div>
          </div>

          {/* Foreground Cinematic Typography Layer */}
          <div className="absolute inset-x-0 bottom-14 z-20 px-8 sm:px-14 md:px-20">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              {/* Left Column: Label + Huge Masked Title */}
              <div className="max-w-3xl">
                <div className="disrupted-label font-mono text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-400/95 sm:text-xs">
                  {label}
                </div>

                <div className="mt-2 space-y-0.5 overflow-hidden">
                  <div className="overflow-hidden">
                    <h2 className="balance-line-1 special-font hero-heading text-6xl uppercase tracking-tight text-white sm:text-8xl md:text-9xl">
                      {titleLine1}
                    </h2>
                  </div>
                  <div className="overflow-hidden">
                    <h2 className="balance-line-2 special-font hero-heading text-6xl uppercase tracking-tight text-white sm:text-8xl md:text-9xl">
                      {titleLine2}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Right Column: Word-by-Word Description */}
              <div className="max-w-md pb-2">
                <p className="font-circular text-sm font-light leading-relaxed text-slate-200 sm:text-base md:text-lg">
                  {descWords}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
