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

// Clear all state between tests (before each individual test)
beforeEach(async () => {
  await clearAllStores();
  clearSessionPodsSubmissions();
  localStorageMock.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

// Mock environment variables
process.env.USE_MOCK_DB = 'true';
// NODE_ENV is already set by vitest
