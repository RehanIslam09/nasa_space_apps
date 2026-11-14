'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { PranaHeadline } from './prana-headline';
import { ScrollCue } from './scroll-cue';
import { earthSongConfig } from '@/config/earth-song.config';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function CinematicHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { isMuted } = useAppStore();
  const prefersReducedMotion = useReducedMotion();

  // Instant video autoplay sync
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.defaultMuted = true;
    vid.muted = isMuted;

    const playVideo = () => {
      vid.play().catch(() => {});
    };

    if (vid.readyState >= 2) {
      playVideo();
    } else {
      vid.addEventListener('canplay', playVideo, { once: true });
    }

    return () => {
      vid.removeEventListener('canplay', playVideo);
    };
  }, [isMuted]);

  // Clean, organic scroll-driven polygon clip & reveal without artificial pinning
  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Contracted polygon state
      gsap.set('#video-frame', {
        clipPath: 'polygon(14% 0%, 74% 0%, 90% 90%, 0% 95%)',
        borderRadius: '0% 0% 36% 12%',
      });

      // Animate from full-screen rectangle on scroll scrub
      gsap.from('#video-frame', {
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        borderRadius: '0% 0% 0% 0%',
        ease: 'power1.inOut',
        scrollTrigger: {
          trigger: '#video-frame',
          start: 'center center',
          end: 'bottom center',
          scrub: 0.6,
        },
      });

      // Smoothly fade typography on scroll
      gsap.to('#hero-lead-group', {
        opacity: 0,
        y: -40,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#video-frame',
          start: 'top top',
          end: 'center center',
          scrub: 0.5,
        },
      });

      gsap.to('#hero-inner-song', {
        opacity: 0,
        y: 40,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#video-frame',
          start: 'top top',
          end: 'center center',
          scrub: 0.5,
        },
      });

      gsap.to('#hero-scroll-cue', {
        opacity: 0,
        scrollTrigger: {
          trigger: '#video-frame',
          start: 'top top',
          end: '30% top',
          scrub: true,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  const scrollToJourney = () => {
    const el = document.getElementById('chapter-01');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={containerRef}
      className="relative h-[100dvh] w-full overflow-hidden bg-black text-white selection:bg-sky-400 selection:text-black"
      aria-label="Cinematic Earth Hero"
    >
      {/* Outer background heading - revealed into midnight cosmos when the video frame morphs */}
      <h1
        id="hero-bg-song"
        aria-hidden="true"
        className="special-font hero-heading pointer-events-none absolute bottom-4 right-4 z-0 select-none text-7xl text-sky-400/80 sm:right-10 sm:text-9xl md:text-[11rem] lg:text-[14rem]"
      >
        {earthSongConfig.copy.bottomWord}
      </h1>

      {/* Main Video Frame */}
      <div
        id="video-frame"
        className="relative z-10 h-full w-full transform-gpu overflow-hidden bg-[#000000] will-change-[clip-path,border-radius]"
      >
        {/* Cinematic Narrative Video */}
        <video
          ref={videoRef}
          src={earthSongConfig.media.heroVideo}
          loop
          muted={isMuted}
          playsInline
          autoPlay
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover object-center brightness-[0.92] contrast-[1.05] filter"
        />

        {/* Atmospheric Gradient Overlays for Depth */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />
        <div className="bg-radial-[circle_at_center] pointer-events-none absolute inset-0 from-transparent via-transparent to-black/70" />

        {/* Content Overlay */}
        <div className="relative z-20 flex h-full flex-col justify-between p-6 sm:p-10 md:p-16">
          {/* Top-Left: PRANA Headline + New Tagline + Apple CTA */}
          <div id="hero-lead-group" className="mt-14 max-w-xl will-change-[opacity,transform]">
            {/* Interactive EARTH to PRANA 3D Flip Headline */}
            <PranaHeadline />

            {/* Tagline: The Living Breath of Earth */}
            <p className="font-circular mt-5 text-lg font-light uppercase tracking-[0.2em] text-white/95 drop-shadow-md sm:text-xl md:text-2xl">
              {earthSongConfig.copy.tagline}
            </p>

            {/* Enter The Journey Button — Restyled Minimal Apple Pill */}
            <div className="mt-8">
              <button
                type="button"
                onClick={scrollToJourney}
                className="group inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-xs font-medium uppercase tracking-[0.16em] text-white shadow-xl backdrop-blur-md transition-all duration-300 hover:border-white/40 hover:bg-white/20 active:scale-95"
              >
                <span>Enter The Journey</span>
                <ArrowDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5" />
              </button>
            </div>
          </div>

          {/* Bottom Row: Minimal Vertical Scroll Cue + Giant Bottom Word SONG */}
          <div className="flex items-end justify-between">
            {/* Minimal Animated Vertical Scroll Cue */}
            <div id="hero-scroll-cue" className="mb-2">
              <ScrollCue />
            </div>

            {/* Giant Bottom-Right Word inside Video Frame */}
            <h1
              id="hero-inner-song"
              aria-hidden="true"
              className="special-font hero-heading select-none text-7xl text-white drop-shadow-2xl will-change-[opacity,transform] sm:text-9xl md:text-[11rem] lg:text-[14rem]"
            >
              {earthSongConfig.copy.bottomWord}
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
}
