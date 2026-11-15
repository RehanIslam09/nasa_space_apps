'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { earthSongConfig, type SonicTrackConfig } from '@/config/earth-song.config';
import { Play, ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';
import { getGalleryMedia } from './sonic-gallery.media';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  (window as Window & { ScrollTrigger?: typeof ScrollTrigger }).ScrollTrigger = ScrollTrigger;
}

/**
 * TUNING CONFIGURATION
 * Quick design and animation adjustments for the Sonic Gallery carousel.
 */
export const TUNING = {
  /** Snap easing duration in seconds for power3.out weighty transition */
  snapDuration: 0.7,
  /** Scale factor for inactive neighbor cards peek */
  sideScale: 0.9,
  /** Opacity for inactive neighbor cards (55%) */
  sideDim: 0.55,
  /** Slight blur applied to neighbor cards */
  sideBlur: '4px',
  /** Ken Burns slow push-in scale for the active card */
  kenBurnsScale: 1.06,
  /** Maximum simultaneous decoding/playing videos (active + 2 neighbors) */
  maxSimultaneousVideos: 3,
  /** Comfortable vertical padding before and after (10-14vh) to un-cramp adjacent sections */
  verticalPadding: '12vh',
} as const;

interface SonicGalleryProps {
  tracks?: SonicTrackConfig[];
  activeTrack: SonicTrackConfig;
  isPlaying: boolean;
  onSelectTrack: (track: SonicTrackConfig) => void;
  onTogglePlay: () => void;
}

/**
 * Formats frequency strings ensuring authentic units (e.g. "110" -> "110 Hz")
 */
function formatFrequency(freq: string | undefined): string {
  if (!freq) return '432 Hz';
  const trimmed = freq.trim();
  if (/hz$/i.test(trimmed)) return trimmed;
  return `${trimmed} Hz`;
}

export function SonicGallery({
  tracks: incomingTracks,
  activeTrack,
  onSelectTrack,
}: SonicGalleryProps) {
  const containerRef = useRef<HTMLElement>(null);
  const scrollRailRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorXTo = useRef<((val: number) => void) | null>(null);
  const cursorYTo = useRef<((val: number) => void) | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isOverInteractive, setIsOverInteractive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredDashIndex, setHoveredDashIndex] = useState<number | null>(null);
  const [isSectionVisible, setIsSectionVisible] = useState(true);
  const [isTabActive, setIsTabActive] = useState(true);

  const prefersReducedMotion = useReducedMotion();
  const tracks = useMemo(
    () => (incomingTracks && incomingTracks.length > 0 ? incomingTracks : earthSongConfig.sonicTracks),
    [incomingTracks]
  );

  // Stable parent callback ref
  const onSelectTrackRef = useRef(onSelectTrack);
  useEffect(() => {
    onSelectTrackRef.current = onSelectTrack;
  }, [onSelectTrack]);

  const selectDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastActiveIndexRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);

  // Sync activeIndex if activeTrack is updated externally
  useEffect(() => {
    const idx = tracks.findIndex((t) => t.id === activeTrack.id);
    if (idx !== -1 && idx !== activeIndex) {
      setActiveIndex(idx);
      lastActiveIndexRef.current = idx;
    }
  }, [activeTrack.id, tracks, activeIndex]);

  // Track tab visibility to pause decoders
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabActive(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // IntersectionObserver to pause decoders when off-screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsSectionVisible(entry.isIntersecting);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Refresh ScrollTrigger after unpinned layout mount to keep subsequent sections accurate
  useEffect(() => {
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Set up custom cursor spring physics on desktop
  useEffect(() => {
    if (!cursorRef.current || prefersReducedMotion) return;

    cursorXTo.current = gsap.quickTo(cursorRef.current, 'x', {
      duration: 0.2,
      ease: 'power3.out',
    });
    cursorYTo.current = gsap.quickTo(cursorRef.current, 'y', {
      duration: 0.2,
      ease: 'power3.out',
    });
  }, [prefersReducedMotion]);

  // Center target card smoothly with weighty power3.out ease
  const navigateToCard = useCallback(
    (targetIndex: number) => {
      const clampedIndex = Math.max(0, Math.min(tracks.length - 1, targetIndex));
      const targetTrack = tracks[clampedIndex];
      if (targetTrack) {
        onSelectTrackRef.current(targetTrack);
      }

      setActiveIndex(clampedIndex);
      lastActiveIndexRef.current = clampedIndex;

      const rail = scrollRailRef.current;
      const targetCard = cardsRef.current[clampedIndex];
      if (!rail || !targetCard) return;

      const targetScrollLeft =
        targetCard.offsetLeft - (rail.clientWidth - targetCard.offsetWidth) / 2;

      isProgrammaticScrollRef.current = true;
      gsap.to(rail, {
        scrollLeft: targetScrollLeft,
        duration: prefersReducedMotion ? 0.05 : TUNING.snapDuration,
        ease: 'power3.out',
        overwrite: 'auto',
        onComplete: () => {
          isProgrammaticScrollRef.current = false;
        },
      });
    },
    [tracks, prefersReducedMotion]
  );

  // Keyboard navigation when gallery container has focus or is in view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateToCard(activeIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateToCard(activeIndex + 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        navigateToCard(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        navigateToCard(tracks.length - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, navigateToCard, tracks.length]);

  // Throttled scroll listener to calculate active card from center offset
  const handleRailScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    const rail = scrollRailRef.current;
    if (!rail) return;

    const railCenter = rail.scrollLeft + rail.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    cardsRef.current.forEach((card, idx) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(railCenter - cardCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    if (closestIndex !== lastActiveIndexRef.current) {
      lastActiveIndexRef.current = closestIndex;
      setActiveIndex(closestIndex);

      if (selectDebounceRef.current) clearTimeout(selectDebounceRef.current);
      selectDebounceRef.current = setTimeout(() => {
        const trk = tracks[closestIndex];
        if (trk) onSelectTrackRef.current(trk);
      }, 90);
    }
  }, [tracks]);

  // Gesture routing on wheel: horizontal swipes handled horizontally; vertical swipes passed to Lenis
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
    if (isHorizontal && scrollRailRef.current) {
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      scrollRailRef.current.scrollLeft += delta;
    }
    // If vertical is dominant, DO NOTHING: event bubbles naturally to Lenis!
  }, []);

  // Desktop click-and-drag implementation
  const dragStartRef = useRef<{ x: number; scrollLeft: number; hasMoved: boolean }>({
    x: 0,
    scrollLeft: 0,
    hasMoved: false,
  });

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only left click and not on interactive buttons/links
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input')) return;

    const rail = scrollRailRef.current;
    if (!rail) return;

    dragStartRef.current = {
      x: e.pageX,
      scrollLeft: rail.scrollLeft,
      hasMoved: false,
    };
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Update custom cursor
      if (cursorXTo.current && cursorYTo.current) {
        cursorXTo.current(e.clientX);
        cursorYTo.current(e.clientY);
      }

      if (!isDragging) return;
      const rail = scrollRailRef.current;
      if (!rail) return;

      const dx = e.pageX - dragStartRef.current.x;
      if (Math.abs(dx) > 6) {
        dragStartRef.current.hasMoved = true;
      }
      rail.scrollLeft = dragStartRef.current.scrollLeft - dx;
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      setIsDragging(false);

      // If dragged, snap to the closest card with GSAP ease
      if (dragStartRef.current.hasMoved) {
        const rail = scrollRailRef.current;
        if (!rail) return;
        const railCenter = rail.scrollLeft + rail.clientWidth / 2;
        let closest = 0;
        let minDist = Infinity;
        cardsRef.current.forEach((c, idx) => {
          if (!c) return;
          const center = c.offsetLeft + c.offsetWidth / 2;
          const dist = Math.abs(railCenter - center);
          if (dist < minDist) {
            minDist = dist;
            closest = idx;
          }
        });
        navigateToCard(closest);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, navigateToCard]);

  // Video decoders management: active + immediate neighbors (max 3), or 1 on mobile/saveData
  useEffect(() => {
    const isSaveData =
      typeof navigator !== 'undefined' &&
      // @ts-expect-error NetworkInformation API check
      Boolean(navigator.connection?.saveData);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const maxActive = isSaveData || isMobile ? 1 : TUNING.maxSimultaneousVideos;

    tracks.forEach((track, idx) => {
      const video = videoRefs.current[track.id];
      if (!video) return;

      const dist = Math.abs(idx - activeIndex);
      const isAllowedToPlay =
        !prefersReducedMotion &&
        isSectionVisible &&
        isTabActive &&
        (maxActive === 1 ? dist === 0 : dist <= 1);

      if (isAllowedToPlay) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay policy prevented playback; remains gracefully paused on frame
          });
        }
      } else {
        video.pause();
      }
    });
  }, [activeIndex, isSectionVisible, isTabActive, prefersReducedMotion, tracks]);

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden select-none"
      style={{
        paddingTop: TUNING.verticalPadding,
        paddingBottom: TUNING.verticalPadding,
      }}
      aria-label="Planetary Sonic Gallery"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsDragging(false);
      }}
    >
      {/* Screen Reader Live Region for Active Card Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Slide {activeIndex + 1} of {tracks.length}: {tracks[activeIndex]?.title}
      </div>

      {/* Custom Spring-Smoothed Desktop "Drag" Cursor Pill */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 z-50 -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-white/20 bg-black/75 px-3 py-1 text-xs font-mono font-semibold tracking-wider text-white shadow-2xl backdrop-blur-md transition-opacity duration-200 hidden md:flex ${
          isHovered && !isOverInteractive ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        } ${isDragging ? 'bg-sky-950/80 border-sky-400/50 text-sky-200' : ''}`}
      >
        <MoveHorizontal className="size-3.5 text-sky-300" />
        <span>{isDragging ? 'DRAGGING' : 'DRAG'}</span>
      </div>

      {/* Cinematic Ambient Edge Feather Gradients */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-20 w-8 sm:w-28 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-20 w-8 sm:w-28 bg-gradient-to-l from-black/90 via-black/40 to-transparent" />

      {/* Ambient Tinted Backlight that morphs with the active card */}
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-96 -z-10 blur-[120px] transition-colors duration-1000 ease-out opacity-40"
        style={{
          background: `radial-gradient(ellipse at center, ${activeTrack.color.accent} 0%, transparent 70%)`,
        }}
      />

      {/* Previous Card Floating Glass Button (Disabled at Index 0) */}
      <button
        type="button"
        onClick={() => navigateToCard(activeIndex - 1)}
        aria-label="Previous dataset card"
        disabled={activeIndex === 0}
        onMouseEnter={() => setIsOverInteractive(true)}
        onMouseLeave={() => setIsOverInteractive(false)}
        className={`apple-glass group absolute left-2 sm:left-6 md:left-8 top-1/2 z-30 flex size-10 sm:size-12 md:size-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
          activeIndex === 0
            ? 'pointer-events-none opacity-20 scale-90'
            : 'opacity-90 hover:scale-110 hover:opacity-100 hover:border-sky-400/60 hover:bg-black/80 hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] active:scale-95'
        }`}
      >
        <ChevronLeft className="size-5 sm:size-6 text-white/90 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:text-sky-300" />
      </button>

      {/* Next Card Floating Glass Button (Disabled at Last Index) */}
      <button
        type="button"
        onClick={() => navigateToCard(activeIndex + 1)}
        aria-label="Next dataset card"
        disabled={activeIndex === tracks.length - 1}
        onMouseEnter={() => setIsOverInteractive(true)}
        onMouseLeave={() => setIsOverInteractive(false)}
        className={`apple-glass group absolute right-2 sm:right-6 md:right-8 top-1/2 z-30 flex size-10 sm:size-12 md:size-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
          activeIndex === tracks.length - 1
            ? 'pointer-events-none opacity-20 scale-90'
            : 'opacity-90 hover:scale-110 hover:opacity-100 hover:border-sky-400/60 hover:bg-black/80 hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] active:scale-95'
        }`}
      >
        <ChevronRight className="size-5 sm:size-6 text-white/90 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-sky-300" />
      </button>

      {/* Native Horizontal Scroll Container with Snap and Gesture Routing */}
      <div
        ref={scrollRailRef}
        onScroll={handleRailScroll}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        style={{
          scrollSnapType: 'x mandatory',
          overscrollBehaviorX: 'contain',
          touchAction: 'pan-y pinch-zoom',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className={`relative flex items-center gap-4 sm:gap-8 md:gap-10 overflow-x-auto overflow-y-hidden py-4 sm:py-6 will-change-scroll ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } [&::-webkit-scrollbar]:hidden`}
      >
        {/* Leading Symmetrical Spacer ensuring first card centers exactly */}
        <div
          aria-hidden="true"
          className="flex-shrink-0 w-[calc((100vw-min(84vw,1100px))/2)] sm:w-[calc((100vw-min(72vw,1100px))/2)] md:w-[calc((100vw-min(62vw,1100px))/2)]"
        />

        {tracks.map((track, index) => {
          const isSelected = activeIndex === index;
          const clip = getGalleryMedia(track.id);

          return (
            <div
              key={track.id}
              ref={(el) => {
                cardsRef.current[index] = el;
              }}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${tracks.length}: Select ${track.title} — ${track.category}`}
              onClick={() => {
                if (!dragStartRef.current.hasMoved && activeIndex !== index) {
                  navigateToCard(index);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigateToCard(index);
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  navigateToCard(index + 1);
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  navigateToCard(index - 1);
                }
              }}
              tabIndex={0}
              style={{
                scrollSnapAlign: 'center',
                boxShadow: isSelected
                  ? `0 0 60px -10px ${track.color.accent}66, 0 25px 50px -12px rgba(0, 0, 0, 0.85)`
                  : '0 10px 30px -10px rgba(0,0,0,0.5)',
              }}
              className={`group/card relative flex-shrink-0 w-[84vw] sm:w-[72vw] md:w-[clamp(440px,62vw,1100px)] aspect-[16/11.5] sm:aspect-[16/10] md:aspect-[16/9.5] min-h-[300px] sm:min-h-0 rounded-[24px] sm:rounded-[36px] overflow-hidden border transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                isSelected
                  ? 'scale-100 opacity-100 border-white/25 z-10'
                  : 'scale-[0.90] opacity-55 hover:opacity-80 border-white/10 blur-[4px] hover:blur-0 z-0'
              }`}
            >
              {/* Top-Edge Translucent Highlight */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

              {/* Full-Bleed Media Container with Slow Ken Burns on Active */}
              <div
                className={`relative h-full w-full overflow-hidden transition-transform duration-1000 ease-out ${
                  isSelected && !prefersReducedMotion ? 'scale-[1.06]' : 'scale-100'
                }`}
              >
                {/* Poster / Satellite Image Element (Supports testing role and reduced-motion fallback) */}
                <img
                  src={track.imageSrc || clip.poster}
                  alt={`${track.title} - NASA SVS Satellite Visualization`}
                  loading={index <= 2 ? 'eager' : 'lazy'}
                  decoding="async"
                  style={{
                    objectPosition: clip.objectPosition || 'center center',
                    transform: `scale(${clip.scale || 1.05})`,
                  }}
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
                />

                {/* Video Loop-Segmented Element */}
                {!prefersReducedMotion && (
                  <video
                    ref={(el) => {
                      videoRefs.current[track.id] = el;
                    }}
                    src={clip.src}
                    poster={clip.poster}
                    muted
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={(e) => {
                      e.currentTarget.currentTime = clip.start;
                    }}
                    onTimeUpdate={(e) => {
                      const v = e.currentTarget;
                      if (v.currentTime >= clip.end - 0.05 || v.currentTime < clip.start - 0.5) {
                        v.currentTime = clip.start;
                      }
                    }}
                    style={{
                      objectPosition: clip.objectPosition || 'center center',
                      transform: `scale(${clip.scale || 1.05})`,
                    }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}

                {/* Subtle Brand Tint Overlay */}
                <div
                  className="pointer-events-none absolute inset-0 mix-blend-color transition-opacity duration-700"
                  style={{ backgroundColor: clip.tint || 'transparent' }}
                />

                {/* Filmic Vignette & Contrast Gradients */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
              </div>

              {/* Top-Left: Frequency & Authenticated NASA SVS Chips */}
              <div className="absolute left-3.5 sm:left-7 top-3.5 sm:top-7 z-20 flex flex-wrap items-center gap-1.5 sm:gap-2">
                {/* Frequency Chip (guarantees Hz unit) */}
                <div className="flex items-center rounded-full border border-white/20 bg-black/60 px-2.5 sm:px-3.5 py-0.5 sm:py-1 backdrop-blur-md shadow-lg">
                  <span className="font-mono text-[11px] sm:text-xs font-semibold text-sky-300">
                    {formatFrequency(track.frequency)}
                  </span>
                </div>

                {/* NASA SVS ID Badge */}
                <div className="flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-950/70 px-2.5 sm:px-3.5 py-0.5 sm:py-1 backdrop-blur-md shadow-lg">
                  <span className="inline-block size-1.5 rounded-full bg-sky-400 animate-pulse" />
                  <span className="font-mono text-[9px] sm:text-xs font-bold uppercase tracking-wider text-sky-200">
                    {track.svsId ? `NASA SVS #${track.svsId}` : 'NASA SATELLITE OBSERVATION'}
                  </span>
                </div>
              </div>

              {/* Bottom-Right: Circular Glass Play/Conversion Button linking to dataset page */}
              <Link
                href={`/dataset/${track.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isSelected) {
                    navigateToCard(index);
                  }
                }}
                onMouseEnter={() => setIsOverInteractive(true)}
                onMouseLeave={() => setIsOverInteractive(false)}
                className="apple-glass group/btn absolute bottom-3.5 sm:bottom-7 right-3.5 sm:right-7 z-20 flex size-11 sm:size-14 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-sky-400/80 hover:bg-black/80 hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                aria-label={`Convert visual to audio — Open ${track.title} experience`}
              >
                <Play className="ml-0.5 size-4 sm:size-6 fill-current text-white transition-colors duration-300 group-hover/btn:text-sky-300" />
              </Link>

              {/* Bottom-Left: Refined Story Typography with Line-by-Line Reveal */}
              <div className="absolute bottom-3.5 sm:bottom-7 left-3.5 sm:left-7 right-16 sm:right-28 z-20 max-w-2xl">
                {/* Category Label: Tiny & Letter-Spaced + Direct Link */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[9px] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-sky-400">
                    {track.category}
                  </span>
                  <Link
                    href={`/dataset/${track.id}`}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={() => setIsOverInteractive(true)}
                    onMouseLeave={() => setIsOverInteractive(false)}
                    className="inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-950/70 px-2 py-0.5 font-mono text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider text-sky-200 transition-colors hover:border-sky-300 hover:bg-sky-900"
                  >
                    <span>Convert Visual to Audio →</span>
                  </Link>
                </div>

                {/* Display Title: Condensed font with clamp sizing and tight leading */}
                <Link
                  href={`/dataset/${track.id}`}
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={() => setIsOverInteractive(true)}
                  onMouseLeave={() => setIsOverInteractive(false)}
                  className="group/title block focus:outline-none overflow-hidden"
                >
                  <h3
                    className={`special-font font-zentry mt-1 sm:mt-2 text-[clamp(1.2rem,2.8vw,3.25rem)] font-black uppercase leading-[0.95] tracking-tight text-white line-clamp-2 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/title:text-sky-300 ${
                      isSelected ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-75'
                    }`}
                  >
                    {track.title}
                  </h3>
                </Link>

                {/* Two-Line Description with Soft Gradient Fade */}
                <p
                  style={{
                    maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
                  }}
                  className="font-circular mt-1 sm:mt-2 text-[11px] sm:text-sm font-light leading-relaxed text-slate-300 line-clamp-1 sm:line-clamp-2"
                >
                  {track.description}
                </p>
              </div>
            </div>
          );
        })}

        {/* Trailing Symmetrical Spacer ensuring last card centers exactly */}
        <div
          aria-hidden="true"
          className="flex-shrink-0 w-[calc((100vw-min(84vw,1100px))/2)] sm:w-[calc((100vw-min(72vw,1100px))/2)] md:w-[calc((100vw-min(62vw,1100px))/2)]"
        />
      </div>

      {/* Apple-Style Segmented Progress Bar with Interactive Hover Tooltip */}
      <div
        className="relative z-30 mt-4 sm:mt-6 flex flex-col items-center justify-center px-4"
        onMouseEnter={() => setIsOverInteractive(true)}
        onMouseLeave={() => setIsOverInteractive(false)}
      >
        {/* Tooltip Displaying Active or Hovered Segment ("04 / 11") */}
        <div className="mb-1.5 sm:mb-2 h-5 text-center">
          <span className="font-mono text-xs font-semibold tracking-wider text-slate-400">
            {String((hoveredDashIndex !== null ? hoveredDashIndex : activeIndex) + 1).padStart(
              2,
              '0'
            )}{' '}
            /{' '}
            <span className="text-slate-500">
              {String(tracks.length).padStart(2, '0')}
            </span>
          </span>
        </div>

        {/* Segmented Dashes Container with 44px Minimum Accessibility Touch Target */}
        <div
          role="tablist"
          aria-label="Carousel slide selectors"
          className="flex items-center gap-1 sm:gap-2.5"
        >
          {tracks.map((t, idx) => {
            const isSel = activeIndex === idx;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isSel}
                aria-label={`Slide ${idx + 1} of ${tracks.length}: ${t.title}`}
                onClick={() => navigateToCard(idx)}
                onMouseEnter={() => setHoveredDashIndex(idx)}
                onMouseLeave={() => setHoveredDashIndex(null)}
                className="group relative flex h-11 items-center px-0.5 sm:px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-full"
              >
                {/* Thin Apple-style horizontal dash */}
                <div
                  className="h-1 rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: isSel ? '36px' : '14px',
                    backgroundColor: isSel
                      ? activeTrack.color.accent
                      : hoveredDashIndex === idx
                      ? 'rgba(255, 255, 255, 0.6)'
                      : 'rgba(255, 255, 255, 0.22)',
                    boxShadow: isSel ? `0 0 12px ${activeTrack.color.accent}` : undefined,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
