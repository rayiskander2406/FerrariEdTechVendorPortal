/**
 * HARD-01: Test Fixtures and Utilities
 *
 * Shared fixtures, mock data, and helper functions for HARD-01 tests.
 */

import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// CONSTANTS
// =============================================================================

export const PROJECT_ROOT = path.resolve(__dirname, '../..');

export const FILE_PATHS = {
  dockerCompose: path.join(PROJECT_ROOT, 'docker-compose.yml'),
  envExample: path.join(PROJECT_ROOT, '.env.example'),
  envTest: path.join(PROJECT_ROOT, '.env.test'),
  mainSchema: path.join(PROJECT_ROOT, 'prisma/schema.prisma'),
  vaultSchema: path.join(PROJECT_ROOT, 'prisma/vault.schema.prisma'),
  dbIndex: path.join(PROJECT_ROOT, 'lib/db/index.ts'),
  gitignore: path.join(PROJECT_ROOT, '.gitignore'),
} as const;

export const EXPECTED_CONFIG = {
  postgresVersion: '15',
  mainDbName: 'schoolday_dev',
  vaultDbName: 'schoolday_vault',
  mainDbPort: 5434,
  vaultDbPort: 5433,
  defaultUser: 'schoolday',
  composeVersion: '3.8',
  mainModelCount: 36,
  vaultModelCount: 6,
} as const;

// =============================================================================
// FILE UTILITIES
// =============================================================================

/**
 * Read a file and return its contents
 */
export function readFile(filePath: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

// =============================================================================
// ENV FILE UTILITIES
// =============================================================================

/**
 * Parse a .env file into a Record
 */
export function parseEnvFile(filePath: string): Record<string, string> {
  const content = readFile(filePath);
  if (!content) return {};

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
export function parsePostgresUrl(url: string): {
  protocol: string;
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
  params?: Record<string, string>;
} | null {
  try {
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
// DOCKER COMPOSE UTILITIES
// =============================================================================

/**
 * Extract services from docker-compose.yml content
 */
export function extractDockerServices(content: string): string[] {
  const serviceMatches = content.match(/^\s{2}(\w[-\w]*):/gm) || [];
  return serviceMatches.map((s) => s.trim().replace(':', ''));
}

/**
 * Extract port mappings from docker-compose.yml content
 */
export function extractPortMappings(content: string): Array<{
  external: number;
  internal: number;
}> {
  const portMatches = content.match(/["']?(\d+):(\d+)["']?/g) || [];
  return portMatches.map((p) => {
    const [external, internal] = p.replace(/["']/g, '').split(':').map(Number);
    return { external, internal };
  });
}

// =============================================================================
// PRISMA SCHEMA UTILITIES
// =============================================================================

/**
 * Extract model names from Prisma schema content
 */
export function extractPrismaModels(content: string): string[] {
  const modelMatches = content.match(/^model\s+(\w+)\s*\{/gm) || [];
  return modelMatches.map((m) => m.replace(/^model\s+/, '').replace(/\s*\{$/, ''));
}

/**
 * Extract index definitions from Prisma schema content
 */
export function extractPrismaIndexes(content: string): string[] {
  const indexMatches = content.match(/@@index\(\[([^\]]+)\]\)/g) || [];
  return indexMatches.map((i) =>
    i.replace(/@@index\(\[/, '').replace(/\]\)/, '')
  );
}

// =============================================================================
// MOCK DATA
// =============================================================================

/**
 * Sample docker-compose.yml content for testing
 */
export const MOCK_DOCKER_COMPOSE = `
version: "3.8"

services:
  postgres-main:
    image: postgres:15-alpine
    container_name: schoolday-postgres-main
    ports:
      - "5434:5432"
    environment:
      POSTGRES_DB: schoolday_dev
      POSTGRES_USER: schoolday
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-schoolday_dev_password}
    volumes:
      - postgres-main-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U schoolday -d schoolday_dev"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  postgres-vault:
    image: postgres:15-alpine
    container_name: schoolday-postgres-vault
    ports:
      - "5433:5432"
    environment:
      POSTGRES_DB: schoolday_vault
      POSTGRES_USER: vault
      POSTGRES_PASSWORD: \${VAULT_POSTGRES_PASSWORD:-schoolday_vault_password}
    volumes:
      - postgres-vault-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vault -d schoolday_vault"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres-main-data:
  postgres-vault-data:
`;

/**
 * Sample .env.example content for testing
 */
export const MOCK_ENV_EXAMPLE = `
# Database Configuration
DATABASE_URL=postgresql://schoolday:schoolday_password@localhost:5434/schoolday_dev
VAULT_DATABASE_URL=postgresql://vault:vault_password@localhost:5433/schoolday_vault

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# Environment
NODE_ENV=development
`;

// =============================================================================
// TEST ASSERTIONS
// =============================================================================

/**
 * Assert that a file contains expected patterns
 */
export function assertFileContains(
  filePath: string,
  patterns: string[]
): { missing: string[] } {
  const content = readFile(filePath);
  if (!content) {
    return { missing: patterns };
  }

  const missing = patterns.filter((p) => !content.includes(p));
  return { missing };
}

/**
 * Assert that environment variables match expected format
 */
export function assertEnvFormat(
  filePath: string,
  requiredVars: string[]
): { missing: string[] } {
  const env = parseEnvFile(filePath);
  const missing = requiredVars.filter((v) => !(v in env));
  return { missing };
}
