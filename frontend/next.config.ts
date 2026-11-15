import type { NextConfig } from 'next';
import path from 'path';
import * as dotenv from 'dotenv';

// Explicitly load root environment files preserving Next.js precedence:
// .env.local takes precedence over .env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three', '@nasa-experience/contracts'],
  outputFileTracingRoot: path.resolve(__dirname, '../'),
  async rewrites() {
    return [
      {
        source: '/videos/Recording%202026-11-14%20165733.mp4',
        destination: '/videos/recording-volcano.mp4',
      },
      {
        source: '/videos/Recording 2026-11-14 165733.mp4',
        destination: '/videos/recording-volcano.mp4',
      },
    ];
  },
};

export default nextConfig;
