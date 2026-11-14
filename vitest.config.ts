import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/contracts/vitest.config.ts',
      'backend/vitest.config.ts',
      'frontend/vitest.config.ts',
    ],
  },
});
