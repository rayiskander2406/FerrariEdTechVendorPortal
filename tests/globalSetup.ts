/**
 * Vitest Global Setup
 *
 * This file runs BEFORE any test files are loaded.
 * Sets up the test database connection.
 */

export async function setup() {
  // Set test database URL before Prisma loads
  process.env.DATABASE_URL = 'file:./prisma/test.db';
  process.env.NODE_ENV = 'test';

  console.log('[Test Setup] Using test database: ./prisma/test.db');
}

export async function teardown() {
  // Cleanup after all tests complete
  console.log('[Test Teardown] Tests complete');
}
