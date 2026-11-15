import type { ReactNode } from 'react';
import { MarketingNav } from '@/components/navigation/marketing-nav';
import { Footer } from '@/components/navigation/footer';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <MarketingNav />
      <main id="main-content" className="flex flex-1 flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}
