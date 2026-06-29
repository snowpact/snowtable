import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

/**
 * Dedicated config for the perf harness — NOT run in CI.
 *
 *   pnpm perf            measure + delta vs baseline
 *   pnpm perf:baseline   measure + (re)write the baseline reference
 *
 * The default `pnpm test` only matches the src test files (`.test.tsx`), so the
 * perf files (`.perf.tsx`, under perf/) are never picked up by the normal run.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.tsx'],
    include: ['perf/**/*.perf.tsx'],
    // Sequential execution → less timing noise.
    fileParallelism: false,
    pool: 'forks',
  },
});
