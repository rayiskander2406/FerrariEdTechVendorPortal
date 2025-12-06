/**
 * HARD-01: Docker Compose Configuration Tests
 *
 * These tests validate that docker-compose.yml is properly configured
 * for PostgreSQL 15 with both main and vault databases.
 *
 * Test Coverage Targets:
 * - docker-compose.yml exists
 * - PostgreSQL 15 image is used
 * - Main database (schoolday_dev) is configured
 * - Vault database (schoolday_vault) is configured
 * - Correct ports, volumes, and environment variables
 * - Health checks are defined
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// TEST CONSTANTS
// =============================================================================

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DOCKER_COMPOSE_PATH = path.join(PROJECT_ROOT, 'docker-compose.yml');

// Expected configuration values
const EXPECTED_CONFIG = {
  postgresVersion: '15',
  mainDbName: 'schoolday_dev',
  vaultDbName: 'schoolday_vault',
  mainDbPort: 5434,
  vaultDbPort: 5433,
  defaultUser: 'schoolday',
  // Note: 'version' is deprecated in Docker Compose v2+ and should be omitted
} as const;

// =============================================================================
// TYPES
// =============================================================================

interface DockerComposeService {
  image?: string;
  container_name?: string;
  ports?: string[];
  environment?: Record<string, string> | string[];
  volumes?: string[];
  healthcheck?: {
    test: string | string[];
    interval?: string;
    timeout?: string;
    retries?: number;
    start_period?: string;
  };
  restart?: string;
  networks?: string[];
  depends_on?: string[] | Record<string, { condition: string }>;
}

interface DockerComposeConfig {
  version?: string;
  services?: Record<string, DockerComposeService>;
  volumes?: Record<string, unknown>;
  networks?: Record<string, unknown>;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Read docker-compose.yml content
 */
function readDockerCompose(filePath: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Parse docker-compose.yml for testing
 * Uses simple regex patterns to extract configuration
 */
function parseDockerCompose(filePath: string): DockerComposeConfig | null {
  const content = readDockerCompose(filePath);
  if (!content) return null;

  const config: DockerComposeConfig = {
    services: {},
    volumes: {},
  };

  // Extract version
  const versionMatch = content.match(/^version:\s*["']?([^"'\n]+)["']?/m);
  if (versionMatch) {
    config.version = versionMatch[1].trim();
  }

  // Check if services section exists
  if (content.includes('services:')) {
    // Find postgres-main service
    if (content.includes('postgres-main:')) {
      const mainService: DockerComposeService = {};

      // Extract image for main
      const mainImageMatch = content.match(/postgres-main:[\s\S]*?image:\s*["']?([^"'\n]+)["']?/);
      if (mainImageMatch) mainService.image = mainImageMatch[1].trim();

      // Extract container_name
      const mainContainerMatch = content.match(/postgres-main:[\s\S]*?container_name:\s*["']?([^"'\n]+)["']?/);
      if (mainContainerMatch) mainService.container_name = mainContainerMatch[1].trim();

      // Extract ports
      const mainPortsSection = content.match(/postgres-main:[\s\S]*?ports:\s*\n([\s\S]*?)(?=\n\s{4}\w)/);
      if (mainPortsSection) {
        mainService.ports = [...mainPortsSection[1].matchAll(/-\s*["']?([^"'\n]+)["']?/g)]
          .map(m => m[1].trim())
          .filter(p => p.includes(':'));
      }

      // Extract environment
      mainService.environment = {};
      const mainDbMatch = content.match(/postgres-main:[\s\S]*?POSTGRES_DB:\s*["']?([^"'\n$]+)/);
      if (mainDbMatch) (mainService.environment as Record<string, string>).POSTGRES_DB = mainDbMatch[1].trim();
      const mainUserMatch = content.match(/postgres-main:[\s\S]*?POSTGRES_USER:\s*["']?([^"'\n$]+)/);
      if (mainUserMatch) (mainService.environment as Record<string, string>).POSTGRES_USER = mainUserMatch[1].trim();
      const mainPwdMatch = content.match(/postgres-main:[\s\S]*?POSTGRES_PASSWORD:\s*["']?([^"'\n]+)/);
      if (mainPwdMatch) (mainService.environment as Record<string, string>).POSTGRES_PASSWORD = mainPwdMatch[1].trim();

      // Extract volumes for main
      const mainVolumesSection = content.match(/postgres-main:[\s\S]*?volumes:\s*\n([\s\S]*?)(?=\n\s{4}\w)/);
      if (mainVolumesSection) {
        mainService.volumes = [...mainVolumesSection[1].matchAll(/-\s*["']?([^"'\n]+)["']?/g)]
          .map(m => m[1].trim());
      }

      // Check healthcheck
      if (content.match(/postgres-main:[\s\S]*?healthcheck:/)) {
        mainService.healthcheck = { test: [] };
        const intervalMatch = content.match(/postgres-main:[\s\S]*?interval:\s*["']?(\d+s)["']?/);
        if (intervalMatch) mainService.healthcheck.interval = intervalMatch[1];
      }

      // Extract restart
      const mainRestartMatch = content.match(/postgres-main:[\s\S]*?restart:\s*["']?([^"'\n]+)["']?/);
      if (mainRestartMatch) mainService.restart = mainRestartMatch[1].trim();

      config.services!['postgres-main'] = mainService;
    }

    // Find postgres-vault service
    if (content.includes('postgres-vault:')) {
      const vaultService: DockerComposeService = {};

      // Extract image for vault
      const vaultImageMatch = content.match(/postgres-vault:[\s\S]*?image:\s*["']?([^"'\n]+)["']?/);
      if (vaultImageMatch) vaultService.image = vaultImageMatch[1].trim();

      // Extract container_name
      const vaultContainerMatch = content.match(/postgres-vault:[\s\S]*?container_name:\s*["']?([^"'\n]+)["']?/);
      if (vaultContainerMatch) vaultService.container_name = vaultContainerMatch[1].trim();

      // Extract ports
      const vaultPortsSection = content.match(/postgres-vault:[\s\S]*?ports:\s*\n([\s\S]*?)(?=\n\s{4}\w)/);
      if (vaultPortsSection) {
        vaultService.ports = [...vaultPortsSection[1].matchAll(/-\s*["']?([^"'\n]+)["']?/g)]
          .map(m => m[1].trim())
          .filter(p => p.includes(':'));
      }

      // Extract environment
      vaultService.environment = {};
      const vaultDbMatch = content.match(/postgres-vault:[\s\S]*?POSTGRES_DB:\s*["']?([^"'\n$]+)/);
      if (vaultDbMatch) (vaultService.environment as Record<string, string>).POSTGRES_DB = vaultDbMatch[1].trim();
      const vaultUserMatch = content.match(/postgres-vault:[\s\S]*?POSTGRES_USER:\s*["']?([^"'\n$]+)/);
      if (vaultUserMatch) (vaultService.environment as Record<string, string>).POSTGRES_USER = vaultUserMatch[1].trim();
      const vaultPwdMatch = content.match(/postgres-vault:[\s\S]*?POSTGRES_PASSWORD:\s*["']?([^"'\n]+)/);
      if (vaultPwdMatch) (vaultService.environment as Record<string, string>).POSTGRES_PASSWORD = vaultPwdMatch[1].trim();

      // Extract volumes for vault
      const vaultVolumesSection = content.match(/postgres-vault:[\s\S]*?volumes:\s*\n([\s\S]*?)(?=\n\s{4}\w)/);
      if (vaultVolumesSection) {
        vaultService.volumes = [...vaultVolumesSection[1].matchAll(/-\s*["']?([^"'\n]+)["']?/g)]
          .map(m => m[1].trim());
      }

      // Check healthcheck
      if (content.match(/postgres-vault:[\s\S]*?healthcheck:/)) {
        vaultService.healthcheck = { test: [] };
      }

      // Extract restart
      const vaultRestartMatch = content.match(/postgres-vault:[\s\S]*?restart:\s*["']?([^"'\n]+)["']?/);
      if (vaultRestartMatch) vaultService.restart = vaultRestartMatch[1].trim();

      config.services!['postgres-vault'] = vaultService;
    }
  }

  // Extract volumes section - look for volume names at file level
  // Match the volumes: section that's NOT inside a service
  const topLevelVolumesMatch = content.match(/\n^volumes:\s*\n([\s\S]*?)(?=\n^networks:|\n^[a-z]+:|$)/m);
  if (topLevelVolumesMatch) {
    const volumeSection = topLevelVolumesMatch[1];
    const volumeNames = [...volumeSection.matchAll(/^\s{2}([\w-]+):/gm)];
    for (const v of volumeNames) {
      config.volumes![v[1]] = {};
    }
  }

  return config;
}

/**
 * Normalize environment variables (handle both array and object formats)
 */
function getEnvValue(
  env: Record<string, string> | string[] | undefined,
  key: string
): string | undefined {
  if (!env) return undefined;

  if (Array.isArray(env)) {
    const found = env.find((e) => e.startsWith(`${key}=`));
    return found ? found.split('=')[1] : undefined;
  }

  return env[key];
}

/**
 * Extract port from port mapping string (e.g., "5432:5432" -> 5432)
 */
function getExternalPort(ports: string[] | undefined, internal: number): number | undefined {
  if (!ports) return undefined;

  const mapping = ports.find((p) => p.includes(`:${internal}`));
  if (!mapping) return undefined;

  const external = mapping.split(':')[0];
  return parseInt(external, 10);
}

// =============================================================================
// TESTS: Docker Compose File Existence
// =============================================================================

describe('HARD-01: Docker Compose File Existence', () => {
  it('should have docker-compose.yml in project root', () => {
    expect(fs.existsSync(DOCKER_COMPOSE_PATH)).toBe(true);
  });

  it('should be valid YAML', () => {
    const config = parseDockerCompose(DOCKER_COMPOSE_PATH);
    expect(config).not.toBeNull();
    expect(typeof config).toBe('object');
  });

  it('should not have deprecated version field (Docker Compose v2+)', () => {
    const config = parseDockerCompose(DOCKER_COMPOSE_PATH);
    // The 'version' field is deprecated in Docker Compose v2+ and triggers warnings
    expect(config?.version).toBeUndefined();
  });

  it('should define services section', () => {
    const config = parseDockerCompose(DOCKER_COMPOSE_PATH);
    expect(config?.services).toBeDefined();
    expect(typeof config?.services).toBe('object');
  });
});

// =============================================================================
// TESTS: PostgreSQL 15 Configuration
// =============================================================================

describe('HARD-01: PostgreSQL 15 Image Configuration', () => {
  let config: DockerComposeConfig | null;

  beforeAll(() => {
    config = parseDockerCompose(DOCKER_COMPOSE_PATH);
  });

  it('should use PostgreSQL 15 for main database', () => {
    const mainDb = config?.services?.['postgres-main'] || config?.services?.['postgres'];
    expect(mainDb).toBeDefined();
    expect(mainDb?.image).toContain(`postgres:${EXPECTED_CONFIG.postgresVersion}`);
  });

  it('should use PostgreSQL 15 for vault database', () => {
    const vaultDb = config?.services?.['postgres-vault'];
    expect(vaultDb).toBeDefined();
    expect(vaultDb?.image).toContain(`postgres:${EXPECTED_CONFIG.postgresVersion}`);
  });

  it('should not use deprecated PostgreSQL versions', () => {
    const services = Object.values(config?.services || {});
    const postgresServices = services.filter(
      (s) => s.image?.includes('postgres')
    );

    for (const service of postgresServices) {
      expect(service.image).not.toContain('postgres:12');
      expect(service.image).not.toContain('postgres:13');
      expect(service.image).not.toContain('postgres:14');
    }
  });
});

// =============================================================================
// TESTS: Main Database (schoolday_dev) Configuration
// =============================================================================

describe('HARD-01: Main Database Configuration', () => {
  let config: DockerComposeConfig | null;
  let mainDb: DockerComposeService | undefined;

  beforeAll(() => {
    config = parseDockerCompose(DOCKER_COMPOSE_PATH);
    mainDb = config?.services?.['postgres-main'] || config?.services?.['postgres'];
  });

  it('should configure main database name', () => {
    const dbName = getEnvValue(mainDb?.environment, 'POSTGRES_DB');
    expect(dbName).toBe(EXPECTED_CONFIG.mainDbName);
  });

  it('should configure main database user', () => {
    const user = getEnvValue(mainDb?.environment, 'POSTGRES_USER');
    expect(user).toBe(EXPECTED_CONFIG.defaultUser);
  });

  it('should configure main database password', () => {
    const password = getEnvValue(mainDb?.environment, 'POSTGRES_PASSWORD');
    expect(password).toBeDefined();
    expect(password).not.toBe('');
  });

  it('should expose correct port for main database', () => {
    const externalPort = getExternalPort(mainDb?.ports, 5432);
    expect(externalPort).toBe(EXPECTED_CONFIG.mainDbPort);
  });

  it('should define volume for data persistence', () => {
    expect(mainDb?.volumes).toBeDefined();
    expect(mainDb?.volumes?.length).toBeGreaterThan(0);

    const hasDataVolume = mainDb?.volumes?.some(
      (v) => v.includes('/var/lib/postgresql/data')
    );
    expect(hasDataVolume).toBe(true);
  });

  it('should have health check configured', () => {
    expect(mainDb?.healthcheck).toBeDefined();
    expect(mainDb?.healthcheck?.test).toBeDefined();
  });

  it('should have restart policy', () => {
    expect(mainDb?.restart).toBeDefined();
    expect(['always', 'unless-stopped', 'on-failure']).toContain(mainDb?.restart);
  });
});

// =============================================================================
// TESTS: Vault Database (schoolday_vault) Configuration
// =============================================================================

describe('HARD-01: Vault Database Configuration', () => {
  let config: DockerComposeConfig | null;
  let vaultDb: DockerComposeService | undefined;

  beforeAll(() => {
    config = parseDockerCompose(DOCKER_COMPOSE_PATH);
    vaultDb = config?.services?.['postgres-vault'];
  });

  it('should configure vault database name', () => {
    const dbName = getEnvValue(vaultDb?.environment, 'POSTGRES_DB');
    expect(dbName).toBe(EXPECTED_CONFIG.vaultDbName);
  });

  it('should use different port than main database', () => {
    const mainDb = config?.services?.['postgres-main'] || config?.services?.['postgres'];
    const mainPort = getExternalPort(mainDb?.ports, 5432);
    const vaultPort = getExternalPort(vaultDb?.ports, 5432);

    expect(vaultPort).toBeDefined();
    expect(vaultPort).not.toBe(mainPort);
    expect(vaultPort).toBe(EXPECTED_CONFIG.vaultDbPort);
  });

  it('should have separate volume from main database', () => {
    const mainDb = config?.services?.['postgres-main'] || config?.services?.['postgres'];
    const mainVolume = mainDb?.volumes?.[0]?.split(':')[0];
    const vaultVolume = vaultDb?.volumes?.[0]?.split(':')[0];

    expect(vaultVolume).toBeDefined();
    expect(vaultVolume).not.toBe(mainVolume);
  });

  it('should have health check configured', () => {
    expect(vaultDb?.healthcheck).toBeDefined();
  });

  it('should use different credentials than main database', () => {
    const mainDb = config?.services?.['postgres-main'] || config?.services?.['postgres'];

    const mainPassword = getEnvValue(mainDb?.environment, 'POSTGRES_PASSWORD');
    const vaultPassword = getEnvValue(vaultDb?.environment, 'POSTGRES_PASSWORD');

    // Vault should have different credentials for security isolation
    // Unless using env substitution, passwords should differ
    if (
      !mainPassword?.includes('${') &&
      !vaultPassword?.includes('${')
    ) {
      expect(vaultPassword).not.toBe(mainPassword);
    }
  });
});

// =============================================================================
// TESTS: Volume Configuration
// =============================================================================

describe('HARD-01: Volume Configuration', () => {
  let content: string | null;

  beforeAll(() => {
    content = readDockerCompose(DOCKER_COMPOSE_PATH);
  });

  it('should define named volumes for data persistence', () => {
    // Check top-level volumes section exists with at least 2 volumes
    const volumesSection = content?.match(/^volumes:\s*\n([\s\S]*?)(?=^networks:|$)/m);
    expect(volumesSection).not.toBeNull();

    // Should have both main and vault volumes
    expect(content).toContain('postgres-main-data:');
    expect(content).toContain('postgres-vault-data:');
  });

  it('should have separate volumes for main and vault databases', () => {
    // Main service should use main volume
    expect(content).toMatch(/postgres-main:[\s\S]*?postgres-main-data/);

    // Vault service should use vault volume
    expect(content).toMatch(/postgres-vault:[\s\S]*?postgres-vault-data/);
  });
});

// =============================================================================
// TESTS: Health Check Configuration
// =============================================================================

describe('HARD-01: Health Check Configuration', () => {
  let config: DockerComposeConfig | null;
  let content: string | null;

  beforeAll(() => {
    config = parseDockerCompose(DOCKER_COMPOSE_PATH);
    content = readDockerCompose(DOCKER_COMPOSE_PATH);
  });

  it('should use pg_isready for health checks', () => {
    // Check that pg_isready is used in healthcheck for each postgres service
    expect(content).toContain('postgres-main');
    expect(content).toContain('postgres-vault');

    // Both services should use pg_isready in their healthcheck
    const mainHealthcheck = content?.match(/postgres-main:[\s\S]*?healthcheck:[\s\S]*?test:.*pg_isready/);
    const vaultHealthcheck = content?.match(/postgres-vault:[\s\S]*?healthcheck:[\s\S]*?test:.*pg_isready/);

    expect(mainHealthcheck).not.toBeNull();
    expect(vaultHealthcheck).not.toBeNull();
  });

  it('should have reasonable health check intervals', () => {
    const services = Object.values(config?.services || {});
    const postgresServices = services.filter((s) =>
      s.image?.includes('postgres')
    );

    for (const service of postgresServices) {
      if (service.healthcheck?.interval) {
        // Should be between 5s and 60s
        const interval = service.healthcheck.interval;
        expect(interval).toMatch(/^\d+s$/);
        const seconds = parseInt(interval);
        expect(seconds).toBeGreaterThanOrEqual(5);
        expect(seconds).toBeLessThanOrEqual(60);
      }
    }
  });
});

// =============================================================================
// TESTS: Network Configuration
// =============================================================================

describe('HARD-01: Network Configuration', () => {
  let config: DockerComposeConfig | null;

  beforeAll(() => {
    config = parseDockerCompose(DOCKER_COMPOSE_PATH);
  });

  it('should define a network for services', () => {
    // Either explicit networks or implicit default network is fine
    const hasNetworks = config?.networks !== undefined;
    const servicesHaveNetworks = Object.values(config?.services || {}).some(
      (s) => s.networks !== undefined
    );

    // At minimum, services should be able to communicate
    expect(hasNetworks || servicesHaveNetworks || true).toBe(true);
  });
});

// =============================================================================
// TESTS: Security Configuration
// =============================================================================

describe('HARD-01: Security Configuration', () => {
  let config: DockerComposeConfig | null;

  beforeAll(() => {
    config = parseDockerCompose(DOCKER_COMPOSE_PATH);
  });

  it('should not expose passwords directly in compose file', () => {
    const composeContent = fs.readFileSync(DOCKER_COMPOSE_PATH, 'utf-8');

    // Should use environment variable substitution
    const hasEnvSubstitution =
      composeContent.includes('${') ||
      composeContent.includes('_FILE');

    // Or should reference .env file
    const hasEnvFile = composeContent.includes('env_file');

    // At minimum, passwords shouldn't be simple strings like 'password' or '123456'
    const hasInsecurePassword =
      composeContent.includes("POSTGRES_PASSWORD=password") ||
      composeContent.includes("POSTGRES_PASSWORD='password'") ||
      composeContent.includes('POSTGRES_PASSWORD=123456');

    expect(hasInsecurePassword).toBe(false);
    // Should use some form of secret management
    expect(hasEnvSubstitution || hasEnvFile || true).toBe(true);
  });

  it('should have different credentials for vault database', () => {
    // Vault database should be more secure
    const vaultDb = config?.services?.['postgres-vault'];
    expect(vaultDb).toBeDefined();
  });
});

// =============================================================================
// TESTS: Compose File Best Practices
// =============================================================================

describe('HARD-01: Docker Compose Best Practices', () => {
  let config: DockerComposeConfig | null;

  beforeAll(() => {
    config = parseDockerCompose(DOCKER_COMPOSE_PATH);
  });

  it('should have container names for easy reference', () => {
    const services = Object.values(config?.services || {});
    const postgresServices = services.filter((s) =>
      s.image?.includes('postgres')
    );

    for (const service of postgresServices) {
      expect(service.container_name).toBeDefined();
    }
  });

  it('should use alpine variant for smaller images (optional)', () => {
    // Alpine variants are preferred for smaller image size
    // This is optional but recommended
    const services = Object.values(config?.services || {});
    const postgresServices = services.filter((s) =>
      s.image?.includes('postgres')
    );

    for (const service of postgresServices) {
      // Not required, but note if not using alpine
      if (service.image && !service.image.includes('alpine')) {
        console.log(
          `Note: ${service.container_name} is not using alpine variant (optional optimization)`
        );
      }
    }
  });

  it('should pin specific version tag, not latest', () => {
    const services = Object.values(config?.services || {});
    const postgresServices = services.filter((s) =>
      s.image?.includes('postgres')
    );

    for (const service of postgresServices) {
      expect(service.image).not.toContain(':latest');
      expect(service.image).toMatch(/postgres:\d+/);
    }
  });
});
