'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import type { SonicTrackConfig } from '@/config/earth-song.config';
import { useAppStore } from '@/stores/app-store';

interface StudioNavProps {
  track: SonicTrackConfig;
  currentIndex: number;
  totalCount: number;
  prevTrack?: SonicTrackConfig | null;
  nextTrack?: SonicTrackConfig | null;
}

export function StudioNav({
  track,
  currentIndex,
  totalCount,
  prevTrack,
  nextTrack,
}: StudioNavProps) {
  const router = useRouter();
  const { isMuted, toggleMute } = useAppStore();
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  // Extract clean short title before hyphen or em-dash
  const shortName = track.title.split('—')[0]?.split('-')[0]?.trim() || track.title;

  // Format index e.g. "03" and count "11"
  const formattedIndex = String(currentIndex + 1).padStart(2, '0');
  const formattedTotal = String(totalCount).padStart(2, '0');

  // Announce dataset change to screen readers
  useEffect(() => {
    setAnnouncement(`Dataset ${currentIndex + 1} of ${totalCount}: ${track.title}`);
  }, [currentIndex, totalCount, track.title]);

  // Scroll behavior matching landing navbar
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        setIsScrolledDown(true);
      } else {
        setIsScrolledDown(false);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard navigation: Escape returns to gallery, '[' previous, ']' next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is interacting with an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        window.location.href = '/#jukebox';
      } else if (e.key === '[' && prevTrack) {
        e.preventDefault();
        router.push(`/dataset/${prevTrack.id}`);
      } else if (e.key === ']' && nextTrack) {
        e.preventDefault();
        router.push(`/dataset/${nextTrack.id}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, prevTrack, nextTrack]);

  return (
    <header
      className={`pointer-events-auto fixed inset-x-0 top-5 z-[60] mx-auto max-w-4xl px-4 transition-all duration-500 sm:px-6 ${
        isScrolledDown ? 'opacity-30 hover:opacity-100' : 'opacity-100'
      }`}
    >
      {/* Screen reader live region for dataset changes */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <nav
        aria-label="Dataset studio"
        className="apple-glass sm:h-13 flex h-12 items-center justify-between rounded-full px-3 sm:px-6 shadow-2xl backdrop-blur-2xl"
      >
        {/* Left: Gallery Back Action */}
        <div className="flex items-center">
          <Link
            href="/#jukebox"
            className="group flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-full px-2 sm:px-3 text-xs font-semibold uppercase tracking-wider text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            aria-label="Return to Earth Song Gallery (Esc)"
          >
            <ArrowLeft className="size-4 text-sky-400 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline font-mono text-[11px] font-bold text-white/90">
              Gallery
            </span>
          </Link>
        </div>

        {/* Center: Dataset Position, Name & Adjacent Steppers */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Previous Dataset Arrow */}
          {prevTrack ? (
            <Link
              href={`/dataset/${prevTrack.id}`}
              aria-label={`Previous dataset: ${prevTrack.title} (press [)`}
              className="flex size-8 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:size-9"
            >
              <ChevronLeft className="size-4 sm:size-5" />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              aria-disabled="true"
              aria-label="Previous dataset (disabled at first dataset)"
              className="flex size-8 min-h-[44px] min-w-[44px] cursor-not-allowed items-center justify-center rounded-full text-white/20 sm:size-9"
            >
              <ChevronLeft className="size-4 sm:size-5" />
            </button>
          )}

          {/* Position Indicator & Short Dataset Title */}
          <div
            aria-current="page"
            className="flex items-center gap-1.5 px-1 sm:gap-2 font-mono text-[11px] sm:text-xs select-none"
          >
            <span className="font-bold text-sky-300 tracking-wider">
              {formattedIndex} / {formattedTotal}
            </span>
            <span className="hidden md:inline text-white/30">•</span>
            <span className="hidden md:inline font-bold uppercase tracking-wider text-white truncate max-w-[170px]">
              {shortName}
            </span>
          </div>

          {/* Next Dataset Arrow */}
          {nextTrack ? (
            <Link
              href={`/dataset/${nextTrack.id}`}
              aria-label={`Next dataset: ${nextTrack.title} (press ])`}
              className="flex size-8 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:size-9"
            >
              <ChevronRight className="size-4 sm:size-5" />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              aria-disabled="true"
              aria-label="Next dataset (disabled at last dataset)"
              className="flex size-8 min-h-[44px] min-w-[44px] cursor-not-allowed items-center justify-center rounded-full text-white/20 sm:size-9"
            >
              <ChevronRight className="size-4 sm:size-5" />
            </button>
          )}
        </div>

        {/* Right: Master Audio Mute Toggle */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute experience sound' : 'Mute experience sound'}
            aria-pressed={isMuted}
            className="group flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full px-2 sm:px-3 text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            {isMuted ? (
              <>
                <VolumeX className="size-4 text-slate-400 transition-transform group-hover:scale-110" />
                <span className="hidden sm:inline font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Muted
                </span>
              </>
            ) : (
              <>
                <Volume2 className="size-4 text-sky-400 transition-transform group-hover:scale-110" />
                <span className="hidden sm:inline font-mono text-[10px] font-semibold uppercase tracking-wider text-sky-300">
                  Live
                </span>
              </>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
