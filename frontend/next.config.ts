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
};

export default nextConfig;
