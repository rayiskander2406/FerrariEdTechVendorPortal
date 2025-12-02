/**
 * Vitest Test Setup
 *
 * This file runs before all tests and sets up the test environment.
 *
 * REQUIREMENT: PostgreSQL must be running via `docker compose up -d`
 */

import { beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// Load .env file for PostgreSQL configuration
// =============================================================================

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
        // Only set if not already set (allow env override)
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

// Verify PostgreSQL is configured
const dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
  console.error('\n❌ PostgreSQL not configured!');
  console.error('   Run: docker compose up -d');
  console.error('   Current DATABASE_URL:', dbUrl.substring(0, 30) + '...\n');
}

console.log('[Test Setup] Using PostgreSQL:', dbUrl.substring(0, 50) + '...');

// =============================================================================
// Mock localStorage for Node.js environment
// =============================================================================

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

// =============================================================================
// Test Lifecycle Hooks
// =============================================================================

beforeEach(() => {
  localStorageMock.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});
