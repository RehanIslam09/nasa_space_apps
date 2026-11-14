'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { Starfield } from './starfield';
import { BalanceDisrupted } from './balance-disrupted';
import { ShiftingHarmony } from './shifting-harmony';
import { ThenVsNow } from './then-vs-now';
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
    if (!headlineRef.current || prefersReducedMotion) return;

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
      className="relative w-full bg-gradient-to-b from-[#000000] via-[#030616] to-[#04081c] text-white selection:bg-sky-400 selection:text-black"
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

      {/* Section A: Pinned Cinematic Scene — A Balance Disrupted */}
      <BalanceDisrupted />

      {/* Section B: Pinned Planetary Telemetry Showcase — The Shifting Harmony */}
      <div id="crisis-metrics" className="relative w-full">
        <ShiftingHarmony />
      </div>

      {/* Section C: Decadal Temporal Delta — Then vs Now */}
      <ThenVsNow />
    </section>
  );
}
