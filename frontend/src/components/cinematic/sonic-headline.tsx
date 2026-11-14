'use client';

import { useRef, useEffect, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { earthSongConfig } from '@/config/earth-song.config';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function SonicHeadline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { line1, line2Prefix, line2Highlight, subtitle } = earthSongConfig.copy.sonicHeadline;

  // Split subtitle into words for smooth word-by-word scroll reveal
  const subtitleWords = useMemo(
    () =>
      subtitle.split(' ').map((word, i) => (
        <span key={i} className="sonic-sub-word inline-block opacity-25">
          {word}&nbsp;
        </span>
      )),
    [subtitle]
  );

  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: headlineRef.current,
          start: 'top 85%',
          end: 'bottom 45%',
          scrub: 0.6,
        },
      });

      // Line 1 masked rise
      tl.fromTo(
        '.sonic-line-1',
        { y: '115%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 0.8, ease: 'power3.out' }
      )
        // Line 2 masked rise
        .fromTo(
          '.sonic-line-2',
          { y: '115%', opacity: 0 },
          { y: '0%', opacity: 1, duration: 0.8, ease: 'power3.out' },
          0.15
        )
        // Shimmer letters stagger on "living song."
        .fromTo(
          '.shimmer-char',
          { opacity: 0.3, y: 15 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.03,
            duration: 0.6,
            ease: 'power2.out',
          },
          0.3
        )
        // Subtitle words reveal
        .to(
          '.sonic-sub-word',
          {
            opacity: 1,
            stagger: 0.015,
            duration: 0.5,
            ease: 'power2.out',
          },
          0.35
        );
    }, containerRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  // Split highlight into characters for subtle stagger and shimmer
  const highlightChars = useMemo(
    () =>
      line2Highlight.split('').map((char, index) => (
        <span
          key={index}
          className="shimmer-char inline-block bg-gradient-to-r from-sky-400 via-teal-300 to-sky-300 bg-clip-text font-black text-transparent"
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      )),
    [line2Highlight]
  );

  return (
    <div
      ref={containerRef}
      className="relative z-10 px-6 pb-16 pt-24 text-center sm:pb-24 sm:pt-32"
    >
      <div ref={headlineRef} className="mx-auto max-w-6xl overflow-hidden">
        {/* Line 1: Let's hear her story. */}
        <div className="overflow-hidden">
          <h2 className="sonic-line-1 special-font hero-heading whitespace-nowrap text-3xl uppercase tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4.4rem] xl:text-[5.4rem]">
            {line1}
          </h2>
        </div>

        {/* Line 2: The planet's living song. */}
        <div className="mt-2 overflow-hidden sm:mt-4">
          <h2 className="sonic-line-2 special-font hero-heading whitespace-nowrap text-3xl uppercase tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4.4rem] xl:text-[5.4rem]">
            <span className="whitespace-nowrap">{line2Prefix}</span>
            <span className="whitespace-nowrap">{highlightChars}</span>
          </h2>
        </div>

        {/* Subtitle with word-by-word reveal */}
        <p
          ref={paragraphRef}
          className="font-circular mx-auto mt-8 max-w-2xl text-base font-light leading-relaxed text-slate-300 sm:text-lg md:text-xl"
        >
          {subtitleWords}
        </p>
      </div>
    </div>
  );
}
