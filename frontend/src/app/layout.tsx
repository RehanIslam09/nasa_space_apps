import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Earth Song — The Living Breath of Earth',
  description:
    'Listen to the living Earth. Explore NASA Earth science visualizations transformed into immersive soundscapes through PRANA.',
  metadataBase: new URL('http://localhost:3000'),
  applicationName: 'Earth Song',
  keywords: [
    'NASA Space Apps Challenge',
    'Earth Information Jukebox',
    'Earth Song',
    'PRANA',
    'Data Sonification',
    'NASA Earth Science',
    'GEOS Aerosols',
    'Ocean Currents',
    'Black Marble',
  ],
  authors: [{ name: 'Earth Song Team' }],
  openGraph: {
    title: 'Earth Song — The Living Breath of Earth',
    description:
      'Listen to the living Earth. Explore NASA Earth science visualizations transformed into immersive soundscapes through PRANA.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Earth Song',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Earth Song — The Living Breath of Earth',
    description:
      'Listen to the living Earth. Explore NASA Earth science visualizations transformed into immersive soundscapes through PRANA.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/images/favicon.ico.jpeg', type: 'image/jpeg' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/images/favicon.ico.jpeg',
    apple: '/images/favicon.ico.jpeg',
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
