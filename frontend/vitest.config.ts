import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@nasa-experience/contracts': path.resolve(__dirname, '../packages/contracts/src'),
      '@nasa-experience/backend': path.resolve(__dirname, '../backend/src'),
    },
  },
});
