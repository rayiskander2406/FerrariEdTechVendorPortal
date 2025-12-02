/**
 * Vitest Global Setup
 *
 * This file runs BEFORE any test files are loaded.
 *
 * REQUIREMENT: PostgreSQL must be running via `docker compose up -d`
 */

import * as fs from 'fs';
import * as path from 'path';

export async function setup() {
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

  process.env.NODE_ENV = 'test';

  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    console.error('\n❌ PostgreSQL not configured!');
    console.error('   Run: docker compose up -d');
    console.error('   Ensure .env has DATABASE_URL with postgresql:// prefix\n');
    process.exit(1);
  }

  console.log('[Test Setup] Using PostgreSQL:', dbUrl.substring(0, 50) + '...');
}

export async function teardown() {
  console.log('[Test Teardown] Tests complete');
}
