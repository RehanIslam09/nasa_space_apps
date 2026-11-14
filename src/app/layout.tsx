import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NASA Space Apps Experience',
  description: 'Production-ready engineering foundation for NASA Space Apps Hackathon.',
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: 'NASA Space Apps Experience',
    description: 'Production-ready engineering foundation for NASA Space Apps Hackathon.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NASA Space Apps Experience',
    description: 'Production-ready engineering foundation for NASA Space Apps Hackathon.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="selection:bg-primary selection:text-primary-foreground bg-background text-foreground min-h-screen font-sans antialiased">
        <a
          href="#main-content"
          className="focus:bg-background focus:text-foreground focus:ring-ring border-border sr-only rounded-md border shadow-md focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:ring-2 focus:outline-none"
        >
          Skip to main content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
