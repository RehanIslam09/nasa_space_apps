import type { ReactNode } from 'react';
import { Header } from '@/components/navigation/header';
import { Footer } from '@/components/navigation/footer';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex flex-1 flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}
