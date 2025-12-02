/**
 * Vitest Test Setup for PostgreSQL Integration Tests
 *
 * This setup file is used when running tests with vitest.postgres.config.ts.
 * It loads environment variables from .env (PostgreSQL) instead of using SQLite.
 */

import { beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import * as fs from 'fs';
import * as path from 'path';

// Load .env file for PostgreSQL configuration
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex);
        let value = trimmed.substring(eqIndex + 1);
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  }
}

console.log('[PostgreSQL Test Setup] Using DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

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

// For PostgreSQL tests, we don't clear the database between tests
// as the tests manage their own data via transactions
beforeEach(() => {
  localStorageMock.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});
