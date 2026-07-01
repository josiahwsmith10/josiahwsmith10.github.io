import { defineConfig } from 'vitest/config';

// Unit tests for the pure build-time helpers in src/lib. Kept deliberately light —
// no Astro/Vite plugin pipeline is loaded, so tests import plain .ts modules directly.
export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.ts'],
    environment: 'node',
    passWithNoTests: true,
  },
});
