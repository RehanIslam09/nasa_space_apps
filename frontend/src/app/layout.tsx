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
  title: 'Earth Song — NASA Space Apps Cinematic Experience',
  description:
    'The Living Breath of Earth. An immersive, cinematic exploration of Earth through NASA observation telemetry, visual storytelling, and planetary sonification.',
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: 'Earth Song — NASA Space Apps Cinematic Experience',
    description:
      'The Living Breath of Earth. An immersive, cinematic exploration of Earth through NASA observation telemetry, visual storytelling, and planetary sonification.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Earth Song — NASA Space Apps Cinematic Experience',
    description:
      'The Living Breath of Earth. An immersive, cinematic exploration of Earth through NASA observation telemetry, visual storytelling, and planetary sonification.',
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
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen overflow-x-hidden bg-black font-sans text-white antialiased selection:bg-sky-400 selection:text-black">
        <a
          href="#main-content"
          className="focus:bg-background focus:text-foreground focus:ring-ring border-border sr-only rounded-md border shadow-md focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:px-4 focus:py-2 focus:outline-none focus:ring-2"
        >
          Skip to main content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
