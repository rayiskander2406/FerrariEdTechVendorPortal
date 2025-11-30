/**
 * Vitest Test Setup
 *
 * This file runs before all tests and sets up the test environment.
 */

import { beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { clearAllStores } from '@/lib/db';

// Clear database between tests
beforeEach(() => {
  clearAllStores();
});

afterEach(() => {
  vi.clearAllMocks();
});

// Mock environment variables
process.env.USE_MOCK_DB = 'true';
// NODE_ENV is already set by vitest
