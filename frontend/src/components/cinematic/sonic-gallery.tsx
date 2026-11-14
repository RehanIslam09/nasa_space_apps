'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { earthSongConfig, type SonicTrackConfig } from '@/config/earth-song.config';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  (window as Window & { ScrollTrigger?: typeof ScrollTrigger }).ScrollTrigger = ScrollTrigger;
}

interface SonicGalleryProps {
  tracks?: SonicTrackConfig[];
  activeTrack: SonicTrackConfig;
  isPlaying: boolean;
  onSelectTrack: (track: SonicTrackConfig) => void;
  onTogglePlay: () => void;
}

export function SonicGallery({
  tracks: incomingTracks,
  activeTrack,
  isPlaying,
  onSelectTrack,
  onTogglePlay,
}: SonicGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinWrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const prefersReducedMotion = useReducedMotion();

  const tracks = incomingTracks && incomingTracks.length > 0 ? incomingTracks : earthSongConfig.sonicTracks;

  // Stable ref for parent callbacks to prevent destroying GSAP ScrollTrigger mid-scroll
  const onSelectTrackRef = useRef(onSelectTrack);
  useEffect(() => {
    onSelectTrackRef.current = onSelectTrack;
  }, [onSelectTrack]);

  const lastActiveIndexRef = useRef(0);
  const selectDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync activeIndex if activeTrack is updated externally (e.g. initial load or clicks)
  useEffect(() => {
    const idx = tracks.findIndex((t) => t.id === activeTrack.id);
    if (idx !== -1 && idx !== activeIndex) {
      setActiveIndex(idx);
      lastActiveIndexRef.current = idx;
    }
  }, [activeTrack.id, tracks, activeIndex]);

  // Pinned Horizontal Gallery ScrollTrigger
  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion) return;

    // Check if desktop (pin only on >= 768px screens)
    const isDesktop = window.innerWidth >= 768;
    if (!isDesktop) return;

    const ctx = gsap.context(() => {
      const container = containerRef.current;
      const pinWrapper = pinWrapperRef.current;
      const track = trackRef.current;
      if (!container || !pinWrapper || !track) return;

      const cardCount = tracks.length;

      // Exact geometry calculation matching CSS: w-[72vw] max-w-4xl (896px) and gap-8 (32px)
      const updateTrackGeometry = () => {
        const viewportWidth = window.innerWidth;
        const cardWidth = Math.min(viewportWidth * 0.72, 896);
        const gap = 32;
        // Symmetrical padding ensures Card 0 is centered at progress 0, and Card (N-1) is centered at progress 1.0
        const sidePadding = Math.max(24, (viewportWidth - cardWidth) / 2);
        const totalTravel = (cardCount - 1) * (cardWidth + gap);
        return { cardWidth, gap, sidePadding, totalTravel };
      };

      const applyGeometry = () => {
        const { sidePadding, totalTravel } = updateTrackGeometry();
        track.style.paddingLeft = `${sidePadding}px`;
        track.style.paddingRight = `${sidePadding}px`;
        return totalTravel;
      };

      applyGeometry();

      const galleryTl = gsap.timeline({
        id: 'sonic-gallery-timeline',
        scrollTrigger: {
          id: 'sonic-gallery-trigger',
          trigger: container,
          start: 'top top',
          end: () => `+=${Math.max(window.innerHeight * 2, (cardCount - 1) * 550)}px`,
          pin: pinWrapper,
          pinSpacing: true,
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });

      galleryTl.to(track, {
        x: () => {
          const { totalTravel } = updateTrackGeometry();
          return -totalTravel;
        },
        ease: 'none',
      });

      // Synchronize active card strictly with scrub-interpolated timeline progress
      galleryTl.eventCallback('onUpdate', () => {
        const rawProgress = galleryTl.progress();
        const idx = Math.min(Math.round(rawProgress * (cardCount - 1)), cardCount - 1);
        if (idx !== lastActiveIndexRef.current) {
          lastActiveIndexRef.current = idx;
          setActiveIndex(idx);
          // Debounce updating audio and parent state during rapid scrolling
          if (selectDebounceRef.current) clearTimeout(selectDebounceRef.current);
          selectDebounceRef.current = setTimeout(() => {
            onSelectTrackRef.current(tracks[idx]!);
          }, 80);
        }
      });

      const handleResize = () => {
        applyGeometry();
        ScrollTrigger.refresh();
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        if (selectDebounceRef.current) clearTimeout(selectDebounceRef.current);
      };
    }, containerRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks.length, prefersReducedMotion]);

  // Smooth animated navigation between dataset cards
  const navigateToCard = useCallback(
    (targetIndex: number) => {
      const clampedIndex = Math.max(0, Math.min(tracks.length - 1, targetIndex));
      const targetTrack = tracks[clampedIndex];
      if (targetTrack) {
        onSelectTrackRef.current(targetTrack);
      }

      if (clampedIndex === activeIndex) return;

      setActiveIndex(clampedIndex);
      lastActiveIndexRef.current = clampedIndex;

      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
      if (isDesktop && containerRef.current) {
        const st = ScrollTrigger.getById('sonic-gallery-trigger');
        if (st) {
          const totalCards = tracks.length;
          const targetProgress = clampedIndex / (totalCards - 1);
          const targetScroll = st.start + targetProgress * (st.end - st.start);

          const lenis = (
            window as Window & {
              __lenis?: { scrollTo: (target: number, opts?: Record<string, unknown>) => void };
            }
          ).__lenis;

          if (lenis && typeof lenis.scrollTo === 'function') {
            lenis.scrollTo(targetScroll, {
              duration: 1.0,
              easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            });
          } else {
            window.scrollTo({
              top: targetScroll,
              behavior: 'smooth',
            });
          }
        }
      } else if (trackRef.current) {
        // Mobile snap rail
        const track = trackRef.current;
        const cardWidth = track.scrollWidth / tracks.length;
        track.scrollTo({
          left: clampedIndex * cardWidth,
          behavior: 'smooth',
        });
      }
    },
    [activeIndex, tracks]
  );

  // Keyboard arrow navigation when gallery is in view
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, navigateToCard]);

  return (
    <section
      ref={containerRef}
      className="relative w-full"
      aria-label="Apple-Style Planetary Sonic Gallery"
    >
      <div
        ref={pinWrapperRef}
        className="relative flex h-screen w-full flex-col justify-center overflow-hidden"
      >
        {/* Left & Right Cinematic Edge Vignettes */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-20 w-16 sm:w-28 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-20 w-16 sm:w-28 bg-gradient-to-l from-black/90 via-black/40 to-transparent" />

        {/* Floating Left Animated Navigation Chevron */}
        <button
          type="button"
          onClick={() => navigateToCard(activeIndex - 1)}
          aria-label="Previous dataset card"
          disabled={activeIndex === 0}
          className={`apple-glass group absolute left-3 sm:left-6 top-1/2 z-30 flex size-12 sm:size-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
            activeIndex === 0
              ? 'pointer-events-none opacity-0 scale-75'
              : 'opacity-90 hover:scale-110 hover:opacity-100 hover:border-sky-400/80 hover:bg-black/80 hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] active:scale-95'
          }`}
        >
          <ChevronLeft className="size-6 sm:size-7 text-white/90 transition-transform duration-300 group-hover:-translate-x-1 group-hover:text-sky-300" />
        </button>

        {/* Floating Right Animated Navigation Chevron */}
        <button
          type="button"
          onClick={() => navigateToCard(activeIndex + 1)}
          aria-label="Next dataset card"
          disabled={activeIndex === tracks.length - 1}
          className={`apple-glass group absolute right-3 sm:right-6 top-1/2 z-30 flex size-12 sm:size-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
            activeIndex === tracks.length - 1
              ? 'pointer-events-none opacity-0 scale-75'
              : 'opacity-90 hover:scale-110 hover:opacity-100 hover:border-sky-400/80 hover:bg-black/80 hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] active:scale-95'
          }`}
        >
          <ChevronRight className="size-6 sm:size-7 text-white/90 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-sky-300" />
        </button>

        {/* Gallery Horizontal Rail */}
        <div className="relative w-full overflow-visible">
          <div
            ref={trackRef}
            className="max-md:scrollbar-none flex items-center gap-8 will-change-transform max-md:snap-x max-md:snap-mandatory max-md:overflow-x-auto max-md:px-6"
            style={{
              paddingLeft: 'calc((100vw - min(72vw, 896px)) / 2)',
              paddingRight: 'calc((100vw - min(72vw, 896px)) / 2)',
            }}
          >
            {tracks.map((track, index) => {
              const isCurrent = activeTrack.id === track.id;
              const isSelected = activeIndex === index;

              return (
                <div
                  key={track.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${track.title}: ${track.category}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    navigateToCard(index);
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
                  className={`group relative flex-shrink-0 cursor-pointer overflow-hidden rounded-3xl border border-white/10 transition-all duration-500 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black max-md:w-[85vw] max-md:snap-center ${
                    isSelected
                      ? 'h-[60vh] w-[72vw] max-w-4xl scale-100 opacity-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] z-10 sm:h-[66vh]'
                      : 'h-[60vh] w-[72vw] max-w-4xl scale-[0.93] opacity-50 blur-[0.5px] hover:opacity-85 sm:h-[66vh]'
                  }`}
                  style={{
                    boxShadow: isSelected ? `0 0 50px -10px ${track.color.glow}` : undefined,
                  }}
                >
                  {/* Background NASA Observation Image or Video with Ken Burns on Active */}
                  <div className="relative h-full w-full overflow-hidden">
                    {track.imageSrc && !imageErrors[track.id] ? (
                      <img
                        src={track.imageSrc}
                        alt={`${track.title} - NASA SVS Satellite Visualization`}
                        loading="lazy"
                        decoding="async"
                        className={`h-full w-full object-cover transition-transform duration-1000 ${
                          isSelected ? 'scale-105' : 'scale-100'
                        }`}
                        onError={() => {
                          setImageErrors((prev) => ({ ...prev, [track.id]: true }));
                        }}
                      />
                    ) : (
                      <video
                        src={track.videoSrc}
                        loop
                        muted
                        playsInline
                        autoPlay
                        preload="metadata"
                        className={`h-full w-full object-cover transition-transform duration-1000 ${
                          isSelected ? 'scale-105' : 'scale-100'
                        }`}
                      />
                    )}

                    {/* Filmic Vignette & Bottom Gradients */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/20" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />

                    {/* Top-Left: Frequency Glass Chip & Authentic NASA Badge */}
                    <div className="absolute left-6 top-6 flex flex-wrap items-center gap-2">
                      <div className="rounded-full border border-white/15 bg-black/50 px-3.5 py-1 backdrop-blur-md">
                        <span className="font-mono text-xs font-semibold text-sky-300">
                          {track.frequency}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-950/60 px-3 py-1 backdrop-blur-md">
                        <span className="inline-block size-1.5 rounded-full bg-sky-400 animate-ping" />
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-200">
                          {track.svsId ? `NASA SVS #${track.svsId}` : 'NASA SATELLITE OBSERVATION'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom-Right: Circular Glass Play/Conversion Button linking to independent page */}
                    <Link
                      href={`/dataset/${track.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isSelected) {
                          navigateToCard(index);
                        }
                      }}
                      className="apple-glass group/btn absolute bottom-6 right-6 flex size-14 items-center justify-center rounded-full text-white shadow-xl transition-all hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                      aria-label={`Convert visual to audio — Open ${track.title} experience`}
                    >
                      <Play className="ml-1 size-6 fill-current text-white transition-colors group-hover/btn:text-sky-300" />
                    </Link>

                    {/* Bottom-Left: Minimal Restrained Story Typography */}
                    <div className="absolute bottom-6 left-6 right-24 max-w-xl">
                      {/* Category Label: Tiny & Letter-Spaced + Direct Link */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-sky-400 sm:text-xs">
                          {track.category}
                        </span>
                        <Link
                          href={`/dataset/${track.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-950/70 px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-sky-200 transition-colors hover:border-sky-300 hover:bg-sky-900"
                        >
                          <span>Convert Visual to Audio →</span>
                        </Link>
                      </div>

                      {/* Giant Title */}
                      <Link
                        href={`/dataset/${track.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="group/title block focus:outline-none"
                      >
                        <h3 className="special-font font-zentry mt-1.5 text-3xl font-black uppercase text-white transition-colors group-hover/title:text-sky-300 sm:text-5xl md:text-6xl">
                          {track.title}
                        </h3>
                      </Link>

                      {/* Restrained One-Line Description */}
                      <p className="font-circular mt-2 line-clamp-2 text-xs font-light text-slate-300 sm:text-sm">
                        {track.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Minimal Apple-Style Carousel Indicator */}
        <div className="relative z-20 mt-8 flex flex-wrap items-center justify-center gap-2 max-w-full px-4">
          {tracks.map((t, idx) => {
            const isSel = activeIndex === idx;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  navigateToCard(idx);
                }}
                className="group p-1 focus:outline-none"
                aria-label={`Go to slide ${idx + 1}: ${t.title}`}
              >
                <div
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: isSel ? '40px' : '14px',
                    backgroundColor: isSel ? activeTrack.color.accent : 'rgba(255,255,255,0.25)',
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
