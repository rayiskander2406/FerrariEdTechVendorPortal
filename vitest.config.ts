import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Use separate test database to avoid polluting dev data
    env: {
      DATABASE_URL: 'file:./prisma/test.db',
      NODE_ENV: 'test',
      SHADOW_MODE: 'true',  // Enable shadow mode verification tests
    },
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
    exclude: ['node_modules', '.next'],
    // Run each test file in its own process for database isolation
    // This prevents cross-file pollution with SQLite + Prisma
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,  // Each file gets its own fork
        maxForks: 1,        // Run one file at a time to avoid connection conflicts
      },
    },
    // Sequential file execution for predictable behavior
    fileParallelism: false,
    sequence: {
      shuffle: false,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      include: ['lib/**/*.ts', 'app/api/**/*.ts'],
      exclude: [
        'lib/types/**',
        'lib/hooks/**',       // React hooks - require component testing
        'lib/demo/**',        // Demo scenarios - future testing
        'lib/features/**',    // Feature flags - future testing
        'app/api/oneroster/**', // OneRoster API - future testing
        'lib/ai/system-prompt.ts', // Static prompt - no logic to test
        '**/*.d.ts',
        '**/index.ts',
      ],
      thresholds: {
        // Per-file thresholds for critical AI tools
        'lib/ai/tools.ts': {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90,
        },
        'lib/ai/handlers.ts': {
          statements: 85,
          branches: 75,
          functions: 90,
          lines: 85,
        },
        'lib/db/index.ts': {
          statements: 80,
          branches: 70,
          functions: 80,
          lines: 80,
        },
      },
    },
    globalSetup: ['./tests/globalSetup.ts'],
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
