'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);

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

  return (
    <header
      className={`pointer-events-auto fixed inset-x-0 top-5 z-[60] mx-auto max-w-4xl px-4 transition-all duration-500 sm:px-6 ${
        isScrolledDown ? 'opacity-30 hover:opacity-100' : 'opacity-100'
      }`}
    >
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
          </nav>
        </div>
      )}
    </header>
  );
}
