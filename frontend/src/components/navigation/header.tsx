'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Rocket, ShieldCheck, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="border-border/40 bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur-md">
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="focus-visible:ring-ring flex items-center gap-2 rounded-sm text-sm font-semibold uppercase tracking-wider transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
        >
          <Rocket className="text-primary h-5 w-5" aria-hidden="true" />
          <span>NASA Space Apps Experience</span>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main Navigation" className="hidden md:flex md:items-center md:gap-6">
          <div className="text-muted-foreground border-border/50 flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            <span>Phase 02 — Application Shell Active</span>
          </div>
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
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div
          id="mobile-menu"
          className="border-border/40 bg-background border-b px-4 py-4 shadow-lg md:hidden"
        >
          <nav aria-label="Mobile Navigation" className="flex flex-col gap-3">
            <div className="text-muted-foreground border-border/30 flex items-center gap-2 border-b py-2 text-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              <span>Phase 02 — Application Shell Active</span>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
