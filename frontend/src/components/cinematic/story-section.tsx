'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Snowflake, Flame, Waves } from 'lucide-react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { Starfield } from './starfield';
import { earthSongConfig } from '@/config/earth-song.config';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function StorySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { line1, line2, paragraph } = earthSongConfig.copy.chapter01;

  useEffect(() => {
    if (!sectionRef.current || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // 1. Masked line-by-line reveal for Keynote headline
      const headlineTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: headlineRef.current,
          start: 'top 85%',
          end: 'bottom 50%',
          scrub: 0.6,
        },
      });

      headlineTimeline
        .fromTo(
          '.keynote-line-1',
          { y: '100%', opacity: 0 },
          { y: '0%', opacity: 1, duration: 0.8, ease: 'power3.out' }
        )
        .fromTo(
          '.keynote-line-2',
          { y: '100%', opacity: 0 },
          { y: '0%', opacity: 1, duration: 0.8, ease: 'power3.out' },
          0.2
        );

      // 2. Word-by-word reveal for the supporting paragraph
      if (paragraphRef.current) {
        const words = paragraphRef.current.querySelectorAll('.story-word');
        gsap.fromTo(
          words,
          { opacity: 0.25, y: 10 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.04,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: paragraphRef.current,
              start: 'top 85%',
              end: 'bottom 60%',
              scrub: 0.7,
            },
          }
        );
      }

      // 3. Pinned expanding viewport to planetary depth with tight pacing
      const clipAnimation = gsap.timeline({
        scrollTrigger: {
          trigger: '#story-clip',
          start: 'center center',
          end: '+=450 center',
          scrub: 0.5,
          pin: true,
          pinSpacing: true,
        },
      });

      clipAnimation.fromTo(
        '#expanding-clip-box',
        {
          scale: 0.88,
          borderRadius: '36px',
        },
        {
          scale: 1,
          borderRadius: '0px',
          ease: 'power1.inOut',
        }
      );

      // 4. Crisis metrics stagger reveal
      gsap.from('.crisis-metric-card', {
        opacity: 0,
        y: 35,
        stagger: 0.12,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#crisis-metrics',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  // Split supporting paragraph into words, highlighting 'rhythm' and 'listen'
  const paragraphWords = paragraph.split(' ').map((word, index) => {
    const isRhythm = word.toLowerCase().includes('rhythm');
    const isListen = word.toLowerCase().includes('listen');

    if (isRhythm || isListen) {
      return (
        <span
          key={index}
          className="story-word inline-block bg-gradient-to-r from-sky-400 via-teal-300 to-sky-300 bg-clip-text font-medium text-transparent"
        >
          {word}&nbsp;
        </span>
      );
    }

    return (
      <span key={index} className="story-word inline-block text-white/70">
        {word}&nbsp;
      </span>
    );
  });

  return (
    <section
      id="chapter-01"
      ref={sectionRef}
      className="relative min-h-screen w-full bg-gradient-to-b from-[#000000] via-[#030616] to-[#04081c] text-white selection:bg-sky-400 selection:text-black"
      aria-label="Earth Story Narrative"
    >
      {/* Immersive 3-Layer Atmospheric Starfield */}
      <Starfield />

      {/* Main Apple Keynote Typography Presentation */}
      <div className="relative z-10 px-6 pb-20 pt-28 text-center sm:pb-28 sm:pt-36">
        <div ref={headlineRef} className="mx-auto max-w-5xl overflow-hidden">
          {/* Line 1: Four billion years. */}
          <div className="overflow-hidden">
            <h2 className="keynote-line-1 special-font hero-heading text-5xl uppercase tracking-tight text-white sm:text-7xl md:text-8xl lg:text-9xl">
              {line1}
            </h2>
          </div>

          {/* Line 2: One unbroken rhythm. */}
          <div className="mt-2 overflow-hidden sm:mt-4">
            <h2 className="keynote-line-2 special-font hero-heading text-5xl uppercase tracking-tight text-sky-300/90 sm:text-7xl md:text-8xl lg:text-9xl">
              {line2}
            </h2>
          </div>
        </div>

        {/* Supporting Paragraph with Word-by-Word Scroll Reveal */}
        <p
          ref={paragraphRef}
          className="font-circular mx-auto mt-10 max-w-3xl text-lg font-light leading-relaxed tracking-wide sm:text-xl md:text-2xl"
        >
          {paragraphWords}
        </p>
      </div>

      {/* Pinned Expandable Clip Viewport */}
      <div
        id="story-clip"
        className="relative z-10 flex h-[85vh] w-full items-center justify-center overflow-hidden"
      >
        <div
          id="expanding-clip-box"
          className="relative h-[70vh] w-[92vw] max-w-5xl transform-gpu overflow-hidden rounded-3xl border border-sky-500/20 shadow-[0_0_60px_rgba(56,189,248,0.15)] will-change-[transform,border-radius] md:w-[78vw]"
        >
          {/* Authentic Earth Video Texture */}
          <video
            src={earthSongConfig.media.heroVideo}
            loop
            muted
            playsInline
            autoPlay
            preload="metadata"
            className="h-full w-full object-cover object-center brightness-90 filter"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

          {/* Foreground Story Label */}
          <div className="absolute bottom-10 left-8 right-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="font-general text-xs font-semibold uppercase tracking-widest text-sky-400">
                Planetary Vulnerability
              </span>
              <h3 className="special-font font-zentry mt-1 text-3xl font-black uppercase text-white sm:text-5xl">
                A B<b>A</b>LANCE DISRUPTED
              </h3>
            </div>
            <p className="font-circular max-w-md text-xs text-slate-300 sm:text-sm">
              Rising temperatures, rapid cryosphere melt, and intensified atmospheric shifts are
              transforming the planet&apos;s natural cadence into an urgent cry.
            </p>
          </div>
        </div>
      </div>

      {/* Planetary Telemetry Metrics */}
      <div id="crisis-metrics" className="container relative z-10 mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <h3 className="special-font font-zentry text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">
            THE SH<b>I</b>FTING HARMONY
          </h3>
          <p className="font-circular text-muted-foreground mx-auto mt-2 max-w-xl text-sm sm:text-base">
            NASA satellite observations document undeniable alterations in Earth&apos;s biological
            and meteorological rhythms.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Cryosphere */}
          <div className="crisis-metric-card apple-glass group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:border-sky-400/40">
            <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-950/70 text-sky-400">
              <Snowflake className="h-5 w-5" />
            </div>
            <div className="font-general text-xs font-bold uppercase tracking-wider text-sky-400">
              Cryosphere Dissolution
            </div>
            <div className="special-font font-zentry mt-2 text-4xl font-black text-white">
              -12.6%
            </div>
            <p className="text-muted-foreground font-circular mt-2 text-xs leading-relaxed">
              Arctic sea ice extent loss per decade since 1979, recorded by passive microwave
              satellite sensors.
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-slate-400">
              <span>Sensor: NASA AMSR2</span>
              <span className="font-mono text-sky-400">CRITICAL</span>
            </div>
          </div>

          {/* Card 2: Wildfires & Atmosphere */}
          <div className="crisis-metric-card apple-glass group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:border-amber-400/40">
            <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-950/70 text-amber-400">
              <Flame className="h-5 w-5" />
            </div>
            <div className="font-general text-xs font-bold uppercase tracking-wider text-amber-400">
              Thermal Biomass Stress
            </div>
            <div className="special-font font-zentry mt-2 text-4xl font-black text-white">
              +423 ppm
            </div>
            <p className="text-muted-foreground font-circular mt-2 text-xs leading-relaxed">
              Global atmospheric carbon concentration index accelerating wildfire frequency and
              boreal forest decay.
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-slate-400">
              <span>Telemetry: MODIS & VIIRS</span>
              <span className="font-mono text-amber-400">ELEVATED</span>
            </div>
          </div>

          {/* Card 3: Oceanic Heat */}
          <div className="crisis-metric-card apple-glass group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:border-emerald-400/40 sm:col-span-2 lg:col-span-1">
            <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-950/70 text-emerald-400">
              <Waves className="h-5 w-5" />
            </div>
            <div className="font-general text-xs font-bold uppercase tracking-wider text-emerald-400">
              Ocean Heat Content
            </div>
            <div className="special-font font-zentry mt-2 text-4xl font-black text-white">
              +384 ZJ
            </div>
            <p className="text-muted-foreground font-circular mt-2 text-xs leading-relaxed">
              Total excess heat absorbed by upper oceans, destabilizing thermohaline circulation and
              marine life.
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-slate-400">
              <span>Platform: Jason-3 / SWOT</span>
              <span className="font-mono text-emerald-400">RECORD HIGH</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
