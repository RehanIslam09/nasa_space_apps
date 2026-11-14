'use client';

import { useLenis } from '@/hooks/use-lenis';
import type { ReactNode } from 'react';

interface RootShellProps {
  children: ReactNode;
}

export function RootShell({ children }: RootShellProps) {
  // Initialize Lenis smooth scroll engine
  useLenis(true);

  return <div className="relative flex min-h-screen flex-col">{children}</div>;
}
