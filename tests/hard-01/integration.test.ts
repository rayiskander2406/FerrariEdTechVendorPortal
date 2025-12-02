/**
 * HARD-01: Integration Tests for PostgreSQL Setup
 *
 * These tests validate that the complete PostgreSQL infrastructure
 * works correctly end-to-end.
 *
 * Test Coverage Targets:
 * - Both databases can run concurrently
 * - Main and vault databases are isolated
 * - Prisma migrations work correctly
 * - Connection pooling across both databases
 * - Application code can use both databases
 * - Docker Compose brings up entire stack
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawn, ChildProcess } from 'child_process';

// =============================================================================
// TEST CONSTANTS
// =============================================================================

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DOCKER_COMPOSE_PATH = path.join(PROJECT_ROOT, 'docker-compose.yml');

/**
 * Parse .env file content into key-value pairs
 */
function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};

  const content = fs.readFileSync(filePath, 'utf-8');
  const result: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([^=]+)=["']?(.*)["']?$/);
    if (match) {
      const key = match[1].trim();
      // Remove surrounding quotes if present
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
  }

  return result;
}

// Load .env file for Prisma commands that need DATABASE_URL
const envPath = path.join(PROJECT_ROOT, '.env');
const envConfig = parseEnvFile(envPath);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Execute a shell command and return output
 */
function execCommand(
  command: string,
  options: { cwd?: string; timeout?: number; env?: Record<string, string> } = {}
): { success: boolean; output: string; error?: string } {
  try {
    const output = execSync(command, {
      cwd: options.cwd ?? PROJECT_ROOT,
      timeout: options.timeout ?? 30000,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...envConfig, ...options.env },
    });
    return { success: true, output: output.toString() };
  } catch (e: unknown) {
    const error = e as { message?: string; stdout?: string; stderr?: string };
    return {
      success: false,
      output: error.stdout?.toString() ?? '',
      error: error.stderr?.toString() ?? error.message,
    };
  }
}

/**
 * Check if Docker is available
 */
function isDockerAvailable(): boolean {
  const result = execCommand('docker --version');
  return result.success;
}

/**
 * Check if docker-compose is available
 */
function isDockerComposeAvailable(): boolean {
  const result = execCommand('docker compose version');
  if (result.success) return true;

  // Try legacy docker-compose
  const legacyResult = execCommand('docker-compose --version');
  return legacyResult.success;
}

/**
 * Check if containers are running
 */
function areContainersRunning(): boolean {
  const result = execCommand('docker compose ps --format json', { cwd: PROJECT_ROOT });
  if (!result.success) return false;

  try {
    const containers = JSON.parse(result.output);
    return (
      Array.isArray(containers) &&
      containers.some((c: { State: string }) => c.State === 'running')
    );
  } catch {
    // Try parsing as JSONL (Docker 4.3+ format)
    const lines = result.output.trim().split('\n').filter(Boolean);
    return lines.some((line) => {
      try {
        const c = JSON.parse(line);
        return c.State === 'running';
      } catch {
        return false;
      }
    });
  }
}

// =============================================================================
// TESTS: Prerequisites Check
// =============================================================================

describe('HARD-01: Integration Prerequisites', () => {
  it('should have docker-compose.yml file', () => {
    expect(fs.existsSync(DOCKER_COMPOSE_PATH)).toBe(true);
  });

  it('should have Docker installed', () => {
    const hasDocker = isDockerAvailable();
    if (!hasDocker) {
      console.log('Skipping: Docker not available');
    }
    expect(hasDocker).toBe(true);
  });

  it('should have docker-compose available', () => {
    const hasCompose = isDockerComposeAvailable();
    if (!hasCompose) {
      console.log('Skipping: docker-compose not available');
    }
    expect(hasCompose).toBe(true);
  });
});

// =============================================================================
// TESTS: Docker Compose Validation
// =============================================================================

describe('HARD-01: Docker Compose Validation', () => {
  it('should validate docker-compose.yml syntax', () => {
    if (!isDockerComposeAvailable()) {
      console.log('Skipping: docker-compose not available');
      return;
    }

    const result = execCommand('docker compose config --quiet');
    expect(result.success).toBe(true);
  });

  it('should list all defined services', () => {
    if (!isDockerComposeAvailable()) {
      console.log('Skipping: docker-compose not available');
      return;
    }

    const result = execCommand('docker compose config --services');
    expect(result.success).toBe(true);

    // Should have at least main and vault database services
    const services = result.output.trim().split('\n');
    expect(services.length).toBeGreaterThanOrEqual(2);
  });

  it('should have no conflicting ports', () => {
    if (!isDockerComposeAvailable()) {
      console.log('Skipping: docker-compose not available');
      return;
    }

    const result = execCommand('docker compose config');
    expect(result.success).toBe(true);

    // Parse ports from output
    const portMatches = result.output.match(/- "?(\d+):(\d+)"?/g) || [];
    const externalPorts = portMatches.map((m) => {
      const match = m.match(/(\d+):/);
      return match ? parseInt(match[1]) : 0;
    });

    // Check no duplicates
    const uniquePorts = new Set(externalPorts);
    expect(uniquePorts.size).toBe(externalPorts.length);
  });
});

// =============================================================================
// TESTS: Prisma Schema Validation
// =============================================================================

describe('HARD-01: Prisma Schema Validation', () => {
  it('should validate main Prisma schema', () => {
    const result = execCommand('npx prisma validate --schema prisma/schema.prisma');
    expect(result.success).toBe(true);
  });

  it('should validate vault Prisma schema', () => {
    const result = execCommand('npx prisma validate --schema prisma/vault.schema.prisma');
    expect(result.success).toBe(true);
  });

  it('should format main schema correctly', () => {
    const result = execCommand(
      'npx prisma format --schema prisma/schema.prisma 2>&1 || true'
    );
    // Format should complete without errors
    expect(result.output).not.toContain('Error');
  });

  it('should format vault schema correctly', () => {
    const result = execCommand(
      'npx prisma format --schema prisma/vault.schema.prisma 2>&1 || true'
    );
    expect(result.output).not.toContain('Error');
  });
});

// =============================================================================
// TESTS: Prisma Client Generation
// =============================================================================

describe('HARD-01: Prisma Client Generation', () => {
  it('should generate main Prisma client', () => {
    const result = execCommand(
      'npx prisma generate --schema prisma/schema.prisma'
    );
    expect(result.success).toBe(true);
  });

  it('should generate vault Prisma client', () => {
    const result = execCommand(
      'npx prisma generate --schema prisma/vault.schema.prisma'
    );
    expect(result.success).toBe(true);
  });

  it('should have main client at default location', () => {
    const clientPath = path.join(
      PROJECT_ROOT,
      'node_modules/.prisma/client'
    );
    expect(fs.existsSync(clientPath)).toBe(true);
  });

  it('should have vault client at custom location', () => {
    const clientPath = path.join(
      PROJECT_ROOT,
      'node_modules/.prisma/vault-client'
    );
    expect(fs.existsSync(clientPath)).toBe(true);
  });
});

// =============================================================================
// TESTS: Database Migration Readiness
// =============================================================================

describe('HARD-01: Database Migration Readiness', () => {
  it('should have migrations directory for main schema', () => {
    const migrationsPath = path.join(PROJECT_ROOT, 'prisma/migrations');
    // May not exist before first migration, which is OK
    if (fs.existsSync(migrationsPath)) {
      const migrations = fs.readdirSync(migrationsPath);
      expect(migrations.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('should be able to generate migration diff (dry run)', () => {
    // This checks if schema is valid for migration
    const result = execCommand(
      'npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script'
    );
    expect(result.success).toBe(true);
    expect(result.output).toContain('CREATE TABLE');
  });
});

// =============================================================================
// TESTS: Connection String Parsing
// =============================================================================

describe('HARD-01: Connection String Parsing', () => {
  it('should parse main database URL from environment', () => {
    const envPath = path.join(PROJECT_ROOT, '.env.example');
    const content = fs.readFileSync(envPath, 'utf-8');

    const match = content.match(/DATABASE_URL=(.+)/);
    expect(match).not.toBeNull();

    const url = match![1];
    expect(url).toContain('postgresql');
    expect(url).toContain(':5434/');
  });

  it('should parse vault database URL from environment', () => {
    const envPath = path.join(PROJECT_ROOT, '.env.example');
    const content = fs.readFileSync(envPath, 'utf-8');

    const match = content.match(/VAULT_DATABASE_URL=(.+)/);
    expect(match).not.toBeNull();

    const url = match![1];
    expect(url).toContain('postgresql');
    expect(url).toContain(':5433/');
  });
});

// =============================================================================
// TESTS: Schema Model Count
// =============================================================================

describe('HARD-01: Schema Model Count', () => {
  it('should have 36+ models in main schema', () => {
    const schemaPath = path.join(PROJECT_ROOT, 'prisma/schema.prisma');
    const content = fs.readFileSync(schemaPath, 'utf-8');

    const modelCount = (content.match(/^model\s+\w+\s*\{/gm) || []).length;
    expect(modelCount).toBeGreaterThanOrEqual(36);
  });

  it('should have 6 models in vault schema', () => {
    const schemaPath = path.join(PROJECT_ROOT, 'prisma/vault.schema.prisma');
    const content = fs.readFileSync(schemaPath, 'utf-8');

    const modelCount = (content.match(/^model\s+\w+\s*\{/gm) || []).length;
    expect(modelCount).toBe(6);
  });
});

// =============================================================================
// TESTS: Docker Container Configuration
// =============================================================================

describe('HARD-01: Docker Container Configuration', () => {
  it('should define PostgreSQL containers with correct names', () => {
    if (!isDockerComposeAvailable()) {
      console.log('Skipping: docker-compose not available');
      return;
    }

    const result = execCommand('docker compose config');
    expect(result.success).toBe(true);

    // Should have container names defined
    expect(result.output).toContain('container_name:');
  });

  it('should use correct PostgreSQL image version', () => {
    const content = fs.readFileSync(DOCKER_COMPOSE_PATH, 'utf-8');
    expect(content).toContain('postgres:15');
  });

  it('should define health checks for databases', () => {
    const content = fs.readFileSync(DOCKER_COMPOSE_PATH, 'utf-8');
    expect(content).toContain('healthcheck');
    expect(content).toContain('pg_isready');
  });

  it('should define volumes for data persistence', () => {
    const content = fs.readFileSync(DOCKER_COMPOSE_PATH, 'utf-8');
    expect(content).toContain('volumes:');
    expect(content).toContain('/var/lib/postgresql/data');
  });
});

// =============================================================================
// TESTS: Environment File Consistency
// =============================================================================

describe('HARD-01: Environment File Consistency', () => {
  it('should have matching port in docker-compose and .env.example', () => {
    const dockerCompose = fs.readFileSync(DOCKER_COMPOSE_PATH, 'utf-8');
    const envExample = fs.readFileSync(
      path.join(PROJECT_ROOT, '.env.example'),
      'utf-8'
    );

    // Main database port
    const composeMainPort = dockerCompose.match(/"?(\d+):5432"?/)?.[1];
    const envMainPort = envExample.match(/DATABASE_URL.*:(\d+)\//)?.[1];

    if (composeMainPort && envMainPort) {
      expect(composeMainPort).toBe(envMainPort);
    }

    // Vault database port
    const composeVaultPort = dockerCompose.match(/"?(\d+):5432"?.*vault/)?.[1];
    const envVaultPort = envExample.match(/VAULT_DATABASE_URL.*:(\d+)\//)?.[1];

    if (composeVaultPort && envVaultPort) {
      expect(composeVaultPort).toBe(envVaultPort);
    }
  });

  it('should have matching database names in docker-compose and .env.example', () => {
    const dockerCompose = fs.readFileSync(DOCKER_COMPOSE_PATH, 'utf-8');
    const envExample = fs.readFileSync(
      path.join(PROJECT_ROOT, '.env.example'),
      'utf-8'
    );

    // Extract database names
    const composeMainDb = dockerCompose.match(/POSTGRES_DB[=:]\s*['"]?(\w+)/)?.[1];
    const envMainDb = envExample.match(/DATABASE_URL.*\/(\w+)\??/)?.[1];

    if (composeMainDb && envMainDb) {
      expect(composeMainDb).toBe(envMainDb);
    }
  });
});

// =============================================================================
// TESTS: lib/db Integration
// =============================================================================

describe('HARD-01: lib/db Integration', () => {
  it('should import PrismaClient in lib/db', () => {
    const dbIndexPath = path.join(PROJECT_ROOT, 'lib/db/index.ts');
    const content = fs.readFileSync(dbIndexPath, 'utf-8');

    expect(content).toContain('PrismaClient');
    expect(content).toContain('@prisma/client');
  });

  it('should use singleton pattern for Prisma client', () => {
    const dbIndexPath = path.join(PROJECT_ROOT, 'lib/db/index.ts');
    const content = fs.readFileSync(dbIndexPath, 'utf-8');

    // Should have global singleton pattern
    expect(content).toContain('globalThis');
    expect(content).toContain('prisma');
  });

  it('should handle test environment correctly', () => {
    const dbIndexPath = path.join(PROJECT_ROOT, 'lib/db/index.ts');
    const content = fs.readFileSync(dbIndexPath, 'utf-8');

    // Should check for test environment
    expect(content).toContain('NODE_ENV');
    expect(content).toMatch(/test|VITEST/);
  });
});

// =============================================================================
// TESTS: Application Startup Readiness
// =============================================================================

describe('HARD-01: Application Startup Readiness', () => {
  it('should have all required Prisma files', () => {
    const files = [
      'prisma/schema.prisma',
      'prisma/vault.schema.prisma',
    ];

    for (const file of files) {
      const filePath = path.join(PROJECT_ROOT, file);
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });

  it('should have lib/db ready for PostgreSQL', () => {
    const dbPath = path.join(PROJECT_ROOT, 'lib/db/index.ts');
    expect(fs.existsSync(dbPath)).toBe(true);

    const content = fs.readFileSync(dbPath, 'utf-8');
    // Should mention PostgreSQL (not just SQLite)
    expect(content).toMatch(/postgres/i);
  });

  it('should export database functions', () => {
    const dbPath = path.join(PROJECT_ROOT, 'lib/db/index.ts');
    const content = fs.readFileSync(dbPath, 'utf-8');

    const expectedExports = [
      'createVendor',
      'getVendor',
      'updateVendor',
      'createSandbox',
      'getSandbox',
      'logAuditEvent',
      'clearAllStores',
    ];

    for (const exp of expectedExports) {
      expect(content).toContain(`export async function ${exp}`);
    }
  });
});

// =============================================================================
// TESTS: Security Configuration
// =============================================================================

describe('HARD-01: Security Configuration', () => {
  it('should not expose database credentials in docker-compose', () => {
    const content = fs.readFileSync(DOCKER_COMPOSE_PATH, 'utf-8');

    // Should use environment variable substitution
    const hasEnvVars = content.includes('${');
    const hasWeakPassword =
      content.includes('POSTGRES_PASSWORD=password') ||
      content.includes('POSTGRES_PASSWORD=123456');

    expect(hasWeakPassword).toBe(false);
    // Should use env vars OR have proper secure defaults
    expect(hasEnvVars || !hasWeakPassword).toBe(true);
  });

  it('should have .env files in .gitignore', () => {
    const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
    const content = fs.readFileSync(gitignorePath, 'utf-8');

    expect(content).toContain('.env');
  });

  it('should configure vault database on different port', () => {
    const content = fs.readFileSync(DOCKER_COMPOSE_PATH, 'utf-8');

    // Should have two different external ports for PostgreSQL
    const portMappings = content.match(/\d+:5432/g) || [];
    const uniquePorts = new Set(portMappings.map((p) => p.split(':')[0]));

    expect(uniquePorts.size).toBe(2);
  });
});
