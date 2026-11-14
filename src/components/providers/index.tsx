'use client';

import React from 'react';
import { QueryProvider } from '@/lib/query/provider';
import { useLenis } from '@/hooks/use-lenis';

function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useLenis(true);
  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
    </QueryProvider>
  );
}
