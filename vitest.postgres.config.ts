import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest configuration for PostgreSQL integration tests
 *
 * Use this config when running tests that require actual PostgreSQL:
 *   npm test -- --config vitest.postgres.config.ts --run tests/hard-01/
 *
 * Prerequisites:
 *   docker compose up -d
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Load DATABASE_URL from .env file (PostgreSQL)
    // Do NOT override with SQLite like the main config
    env: {
      NODE_ENV: 'test',
    },
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['node_modules', '.next'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        maxForks: 1,
      },
    },
    fileParallelism: false,
    sequence: {
      shuffle: false,
    },
    setupFiles: ['./tests/setup.postgres.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
