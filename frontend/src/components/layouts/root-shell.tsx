'use client';

import { useLenis } from '@/hooks/use-lenis';
import { useEffect, type ReactNode } from 'react';

interface RootShellProps {
  children: ReactNode;
}

export function RootShell({ children }: RootShellProps) {
  // Initialize Lenis smooth scroll engine
  useLenis(true);

  // Ensure refresh starts cleanly from the top
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return <div className="relative flex min-h-screen flex-col">{children}</div>;
}
