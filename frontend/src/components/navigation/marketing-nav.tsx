'use client';

import { usePathname } from 'next/navigation';
import { Header } from './header';

/**
 * MarketingNav acts as a conditional proxy for the landing navbar.
 * It renders the original, untouched Header on the landing page and marketing routes,
 * while cleanly hiding it on the /dataset/[id] studio route where StudioNav takes over.
 */
export function MarketingNav() {
  const pathname = usePathname();

  // Hide the landing nav on /dataset routes
  if (pathname?.startsWith('/dataset')) {
    return null;
  }

  return <Header />;
}
