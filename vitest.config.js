import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        'js/core/storage.js',
        'js/presentation/**',
        'node_modules/**',
        'tests/**'
      ]
    }
  }
});
