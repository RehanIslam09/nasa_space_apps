import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@nasa-experience/contracts': path.resolve(__dirname, './src'),
      '@nasa-experience/backend': path.resolve(__dirname, '../../backend/src'),
    },
  },
});
