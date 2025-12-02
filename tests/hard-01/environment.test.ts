/**
 * HARD-01: Environment Variable Configuration Tests
 *
 * These tests validate that .env files are properly configured
 * with correct database connection strings for PostgreSQL.
 *
 * Test Coverage Targets:
 * - .env.example exists with correct template
 * - DATABASE_URL format is correct for PostgreSQL
 * - VAULT_DATABASE_URL format is correct
 * - Connection strings have correct components
 * - .env files are not committed to git (.gitignore)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// TEST CONSTANTS
// =============================================================================

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const ENV_EXAMPLE_PATH = path.join(PROJECT_ROOT, '.env.example');
const ENV_PATH = path.join(PROJECT_ROOT, '.env');
const ENV_TEST_PATH = path.join(PROJECT_ROOT, '.env.test');
const GITIGNORE_PATH = path.join(PROJECT_ROOT, '.gitignore');

// Expected format for PostgreSQL connection URLs
const POSTGRES_URL_REGEX =
  /^postgres(ql)?:\/\/[^:]+:[^@]+@[^:]+:\d+\/\w+(\?.*)?$/;

// Expected database names
const EXPECTED_MAIN_DB = 'schoolday_dev';
const EXPECTED_VAULT_DB = 'schoolday_vault';

// Expected ports
const EXPECTED_MAIN_PORT = 5434;
const EXPECTED_VAULT_PORT = 5433;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse a .env file into a Record
 */
function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const result: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex);
        const value = trimmed.substring(eqIndex + 1).replace(/^["']|["']$/g, '');
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * Parse PostgreSQL connection URL into components
 */
function parsePostgresUrl(url: string): {
  protocol: string;
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
  params?: Record<string, string>;
} | null {
  try {
    // Handle postgresql:// prefix
    const normalized = url.replace(/^postgresql:\/\//, 'postgres://');
    const parsed = new URL(normalized);

    const params: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return {
      protocol: parsed.protocol.replace(':', ''),
      user: parsed.username,
      password: parsed.password,
      host: parsed.hostname,
      port: parseInt(parsed.port) || 5432,
      database: parsed.pathname.slice(1),
      params: Object.keys(params).length > 0 ? params : undefined,
    };
  } catch {
    return null;
  }
}

// =============================================================================
// TESTS: .env.example File
// =============================================================================

describe('HARD-01: .env.example File', () => {
  it('should exist in project root', () => {
    expect(fs.existsSync(ENV_EXAMPLE_PATH)).toBe(true);
  });

  it('should contain DATABASE_URL template', () => {
    const env = parseEnvFile(ENV_EXAMPLE_PATH);
    expect(env.DATABASE_URL).toBeDefined();
  });

  it('should contain VAULT_DATABASE_URL template', () => {
    const env = parseEnvFile(ENV_EXAMPLE_PATH);
    expect(env.VAULT_DATABASE_URL).toBeDefined();
  });

  it('should have placeholder values, not real credentials', () => {
    const env = parseEnvFile(ENV_EXAMPLE_PATH);

    // Should contain placeholder text
    const hasPlaceholder =
      env.DATABASE_URL?.includes('your_password') ||
      env.DATABASE_URL?.includes('YOUR_PASSWORD') ||
      env.DATABASE_URL?.includes('<password>') ||
      env.DATABASE_URL?.includes('password_here') ||
      env.DATABASE_URL?.includes('schoolday_password');

    expect(hasPlaceholder).toBe(true);
  });

  it('should document all required environment variables', () => {
    const content = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf-8');

    // Should have comments explaining variables
    const hasComments = content.includes('#');
    expect(hasComments).toBe(true);

    // Should contain required variables
    expect(content).toContain('DATABASE_URL');
    expect(content).toContain('VAULT_DATABASE_URL');
  });

  it('should use PostgreSQL format for DATABASE_URL', () => {
    const env = parseEnvFile(ENV_EXAMPLE_PATH);
    const parsed = parsePostgresUrl(env.DATABASE_URL);

    expect(parsed).not.toBeNull();
    expect(parsed?.protocol).toMatch(/^postgres(ql)?$/);
  });

  it('should use PostgreSQL format for VAULT_DATABASE_URL', () => {
    const env = parseEnvFile(ENV_EXAMPLE_PATH);
    const parsed = parsePostgresUrl(env.VAULT_DATABASE_URL);

    expect(parsed).not.toBeNull();
    expect(parsed?.protocol).toMatch(/^postgres(ql)?$/);
  });
});

// =============================================================================
// TESTS: DATABASE_URL Format
// =============================================================================

describe('HARD-01: DATABASE_URL Format', () => {
  let env: Record<string, string>;

  beforeAll(() => {
    env = parseEnvFile(ENV_EXAMPLE_PATH);
  });

  it('should point to localhost or docker container name', () => {
    const parsed = parsePostgresUrl(env.DATABASE_URL);
    expect(parsed?.host).toMatch(/^(localhost|127\.0\.0\.1|postgres-main|postgres)$/);
  });

  it('should use correct port for main database', () => {
    const parsed = parsePostgresUrl(env.DATABASE_URL);
    expect(parsed?.port).toBe(EXPECTED_MAIN_PORT);
  });

  it('should specify correct database name', () => {
    const parsed = parsePostgresUrl(env.DATABASE_URL);
    expect(parsed?.database).toBe(EXPECTED_MAIN_DB);
  });

  it('should have user specified', () => {
    const parsed = parsePostgresUrl(env.DATABASE_URL);
    expect(parsed?.user).toBeDefined();
    expect(parsed?.user.length).toBeGreaterThan(0);
  });

  it('should have password placeholder', () => {
    const parsed = parsePostgresUrl(env.DATABASE_URL);
    expect(parsed?.password).toBeDefined();
    expect(parsed?.password.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// TESTS: VAULT_DATABASE_URL Format
// =============================================================================

describe('HARD-01: VAULT_DATABASE_URL Format', () => {
  let env: Record<string, string>;

  beforeAll(() => {
    env = parseEnvFile(ENV_EXAMPLE_PATH);
  });

  it('should point to localhost or docker container name', () => {
    const parsed = parsePostgresUrl(env.VAULT_DATABASE_URL);
    expect(parsed?.host).toMatch(
      /^(localhost|127\.0\.0\.1|postgres-vault)$/
    );
  });

  it('should use different port than main database', () => {
    const mainParsed = parsePostgresUrl(env.DATABASE_URL);
    const vaultParsed = parsePostgresUrl(env.VAULT_DATABASE_URL);

    expect(vaultParsed?.port).toBe(EXPECTED_VAULT_PORT);
    expect(vaultParsed?.port).not.toBe(mainParsed?.port);
  });

  it('should specify correct vault database name', () => {
    const parsed = parsePostgresUrl(env.VAULT_DATABASE_URL);
    expect(parsed?.database).toBe(EXPECTED_VAULT_DB);
  });

  it('should have different database name than main', () => {
    const mainParsed = parsePostgresUrl(env.DATABASE_URL);
    const vaultParsed = parsePostgresUrl(env.VAULT_DATABASE_URL);

    expect(vaultParsed?.database).not.toBe(mainParsed?.database);
  });
});

// =============================================================================
// TESTS: .env Security
// =============================================================================

describe('HARD-01: Environment File Security', () => {
  it('should have .env in .gitignore', () => {
    const gitignore = fs.readFileSync(GITIGNORE_PATH, 'utf-8');
    expect(gitignore).toContain('.env');
  });

  it('should have .env.test in .gitignore', () => {
    const gitignore = fs.readFileSync(GITIGNORE_PATH, 'utf-8');
    // Either explicit .env.test or .env* pattern
    const hasEnvTest =
      gitignore.includes('.env.test') ||
      gitignore.includes('.env.local') ||
      gitignore.includes('.env*') ||
      gitignore.includes('.env.*');
    expect(hasEnvTest).toBe(true);
  });

  it('should NOT have .env.example in .gitignore', () => {
    const gitignore = fs.readFileSync(GITIGNORE_PATH, 'utf-8');
    // .env.example should be committed
    const explicitlyIgnoresExample = gitignore
      .split('\n')
      .some((line) => line.trim() === '.env.example');
    expect(explicitlyIgnoresExample).toBe(false);
  });
});

// =============================================================================
// TESTS: .env.test File (for testing)
// =============================================================================

describe('HARD-01: .env.test File', () => {
  it('should exist for test environment', () => {
    expect(fs.existsSync(ENV_TEST_PATH)).toBe(true);
  });

  it('should have DATABASE_URL pointing to test database', () => {
    const env = parseEnvFile(ENV_TEST_PATH);

    // For tests, might use SQLite or separate PostgreSQL
    const dbUrl = env.DATABASE_URL;
    expect(dbUrl).toBeDefined();

    // Should be a test database, not production
    const isTestDb =
      dbUrl.includes('test') ||
      dbUrl.includes('sqlite') ||
      dbUrl.includes(':memory:');
    expect(isTestDb).toBe(true);
  });
});

// =============================================================================
// TESTS: Connection String Validation
// =============================================================================

describe('HARD-01: Connection String Validation', () => {
  it('should produce valid PostgreSQL connection strings', () => {
    const env = parseEnvFile(ENV_EXAMPLE_PATH);

    // Replace placeholder password for validation
    const testUrl = env.DATABASE_URL.replace(
      /:[^:@]+@/,
      ':testpassword@'
    );

    expect(testUrl).toMatch(POSTGRES_URL_REGEX);
  });

  it('should support schema parameter for Prisma', () => {
    const env = parseEnvFile(ENV_EXAMPLE_PATH);

    // Prisma recommends schema=public for explicit schema
    const parsed = parsePostgresUrl(env.DATABASE_URL);

    // This is optional, but good practice
    if (parsed?.params?.schema) {
      expect(parsed.params.schema).toBe('public');
    }
  });

  it('should have different connection strings for main and vault', () => {
    const env = parseEnvFile(ENV_EXAMPLE_PATH);

    expect(env.DATABASE_URL).not.toBe(env.VAULT_DATABASE_URL);

    const mainParsed = parsePostgresUrl(env.DATABASE_URL);
    const vaultParsed = parsePostgresUrl(env.VAULT_DATABASE_URL);

    // At minimum, port or database should differ
    const portsDiffer = mainParsed?.port !== vaultParsed?.port;
    const dbsDiffer = mainParsed?.database !== vaultParsed?.database;

    expect(portsDiffer || dbsDiffer).toBe(true);
  });
});

// =============================================================================
// TESTS: Additional Environment Variables
// =============================================================================

describe('HARD-01: Additional Environment Variables', () => {
  it('should document ANTHROPIC_API_KEY', () => {
    const content = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf-8');
    expect(content).toContain('ANTHROPIC_API_KEY');
  });

  it('should document NODE_ENV', () => {
    const content = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf-8');
    expect(content).toContain('NODE_ENV');
  });

  it('should set reasonable defaults in example file', () => {
    const env = parseEnvFile(ENV_EXAMPLE_PATH);

    // Should have development as default NODE_ENV
    if (env.NODE_ENV) {
      expect(env.NODE_ENV).toBe('development');
    }
  });
});
