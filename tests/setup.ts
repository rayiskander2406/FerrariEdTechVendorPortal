/**
 * Vitest Test Setup
 *
 * This file runs before all tests and sets up the test environment.
 * Uses a separate test database (configured in vitest.config.ts).
 */

import { beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { clearAllStores } from '@/lib/db';
import { clearSessionPodsSubmissions } from '@/lib/data/synthetic';

// Mock localStorage for Node.js environment
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
  get length() {
    return Object.keys(localStorageMock.store).length;
  },
  key: vi.fn((index: number) => Object.keys(localStorageMock.store)[index] || null),
};

// Apply localStorage mock globally
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

/**
 * Safely try to clear database stores
 * Returns true if successful, false if database is not available
 */
async function safeClearDatabase(): Promise<boolean> {
  try {
    await clearAllStores();
    return true;
  } catch (error) {
    // Database cleanup failed - this is OK for file-based tests
    // that don't need database operations (e.g., HARD-01 config tests)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('postgresql://') || errorMessage.includes('postgres://') ||
        errorMessage.includes('Error validating datasource')) {
      // PostgreSQL/SQLite mismatch - database not available for this test
      return false;
    }
    // Re-throw unexpected errors
    throw error;
  }
}

// Clear all state between tests (before each individual test)
// Note: clearAllStores may fail for file-based tests that don't need database
// We catch the error to allow file-only tests to run
beforeEach(async () => {
  const dbAvailable = await safeClearDatabase();

  // Only try to clear PoDS submissions if DB is available
  // clearSessionPodsSubmissions calls an async function that will fail if DB unavailable
  if (dbAvailable) {
    try {
      clearSessionPodsSubmissions();
    } catch {
      // Ignore - database not available
    }
  }

  localStorageMock.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

// Mock environment variables
process.env.USE_MOCK_DB = 'true';
// NODE_ENV is already set by vitest
