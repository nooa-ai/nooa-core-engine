import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
    globals: false,
    coverage: {
      enabled: false,
      exclude: [
        'node_modules',
        'tests',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/index.ts',
        '**/index.js',
        'benchmark.js',
        'vitest.config.ts',
        '.eslintrc.js'
      ],
    },
  },
});
