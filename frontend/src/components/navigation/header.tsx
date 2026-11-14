'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app-store';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { isMuted, toggleMute } = useAppStore();

  return (
    <header className="fixed inset-x-0 top-5 z-50 mx-auto max-w-4xl px-4 sm:px-6">
      <div className="apple-glass sm:h-13 flex h-12 items-center justify-between rounded-full px-5 sm:px-7">
        {/* Brand - Clean Typography without icon */}
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
        >
          <span className="font-general text-[12px] font-bold uppercase tracking-[0.24em] text-white transition-opacity duration-300 group-hover:opacity-80 sm:text-[13px]">
            Earth Song
          </span>
        </Link>

        {/* Desktop Navigation - Apple-style restrained typography */}
        <nav aria-label="Main Navigation" className="hidden md:flex md:items-center md:gap-8">
          <a
            href="#chapter-01"
            className="font-general text-[11px] font-medium uppercase tracking-[0.14em] text-white/70 transition-colors duration-200 hover:text-white sm:text-xs"
          >
            The Journey
          </a>
          <a
            href="#crisis-metrics"
            className="font-general text-[11px] font-medium uppercase tracking-[0.14em] text-white/70 transition-colors duration-200 hover:text-white sm:text-xs"
          >
            Planetary Pulse
          </a>
          <a
            href="#jukebox"
            className="font-general text-[11px] font-medium uppercase tracking-[0.14em] text-white/70 transition-colors duration-200 hover:text-white sm:text-xs"
          >
            Sonic Console
          </a>
        </nav>

        {/* Right side controls - Clean Audio Toggle */}
        <div className="hidden md:flex md:items-center md:gap-3">
          <button
            type="button"
            onClick={toggleMute}
            className="group flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/80 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            aria-label={isMuted ? 'Unmute experience' : 'Mute experience'}
          >
            {isMuted ? (
              <>
                <VolumeX className="h-3.5 w-3.5 text-white/50 transition-colors group-hover:text-white/80" />
                <span className="font-general text-[10px] uppercase tracking-wider text-white/60">
                  Muted
                </span>
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5 text-sky-400" />
                <span className="font-general text-[10px] uppercase tracking-wider text-sky-300">
                  Live
                </span>
                <div className="ml-0.5 flex items-center gap-0.5">
                  <span className="indicator-line active !bg-sky-400" />
                  <span
                    className="indicator-line active !bg-sky-400"
                    style={{ animationDelay: '0.15s' }}
                  />
                  <span
                    className="indicator-line active !bg-sky-400"
                    style={{ animationDelay: '0.3s' }}
                  />
                </div>
              </>
            )}
          </button>
        </div>

        {/* Mobile Navigation Trigger */}
        <div className="flex md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            className="h-8 w-8 p-0 text-white hover:bg-white/10"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div id="mobile-menu" className="apple-glass mt-2 rounded-2xl p-5 shadow-2xl md:hidden">
          <nav aria-label="Mobile Navigation" className="flex flex-col gap-4">
            <a
              href="#chapter-01"
              onClick={() => setIsOpen(false)}
              className="font-general text-xs font-medium uppercase tracking-wider text-white/80 transition-colors hover:text-white"
            >
              The Journey
            </a>
            <a
              href="#crisis-metrics"
              onClick={() => setIsOpen(false)}
              className="font-general text-xs font-medium uppercase tracking-wider text-white/80 transition-colors hover:text-white"
            >
              Planetary Pulse
            </a>
            <a
              href="#jukebox"
              onClick={() => setIsOpen(false)}
              className="font-general text-xs font-medium uppercase tracking-wider text-white/80 transition-colors hover:text-white"
            >
              Sonic Console
            </a>
            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={toggleMute}
                className="inline-flex items-center gap-2 text-xs text-white/80"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-white/50" />
                ) : (
                  <Volume2 className="h-4 w-4 text-sky-400" />
                )}
                <span>{isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
