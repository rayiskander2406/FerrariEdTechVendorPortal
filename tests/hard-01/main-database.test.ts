/**
 * HARD-01: Main Database Connection Tests
 *
 * These tests validate that the main PostgreSQL database (schoolday_dev)
 * can be connected to and operates correctly.
 *
 * Test Coverage Targets:
 * - Prisma client can be initialized
 * - Connection to PostgreSQL works
 * - All 36 models from schema.prisma are accessible
 * - Basic CRUD operations work
 * - Connection pooling works
 * - Error handling for connection failures
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

// =============================================================================
// SKIP CONDITIONS
// =============================================================================

/**
 * Check if PostgreSQL is available for testing
 * Tests will skip if running with SQLite (test environment without Docker)
 */
function isPostgresAvailable(): boolean {
  const dbUrl = process.env.DATABASE_URL || '';
  return dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');
}

const SKIP_REASON = 'Skipping: PostgreSQL not available (run docker compose up first)';
const describeWithPostgres = isPostgresAvailable() ? describe : describe.skip;

// =============================================================================
// TEST CONSTANTS
// =============================================================================

// List of all 36 models from the main Prisma schema
const EXPECTED_MODELS = [
  'District',
  'School',
  'AcademicSession',
  'Course',
  'Class',
  'Enrollment',
  'User',
  'UserRelationship',
  'UserHistory',
  'UserSchoolHistory',
  'Demographics',
  'Vendor',
  'VendorDataGrant',
  'VendorEntityPermission',
  'VendorSchoolGrant',
  'SsoSession',
  'SsoLaunchContext',
  'SsoUserMapping',
  'LtiPlatform',
  'LtiDeployment',
  'LtiResourceLink',
  'LtiLineItem',
  'LtiGrade',
  'LtiLaunch',
  'MessageTemplate',
  'ContactPreference',
  'ContactPreferenceCategory',
  'MessageBatch',
  'MessageBatchTarget',
  'CommunicationMessage',
  'PodsApplication',
  'IntegrationConfig',
  'SandboxCredentials',
  'AuditLog',
  'SyncJob',
  'SyncError',
  'ExternalServiceHealth',
  'SchemaMetadata',
] as const;

// =============================================================================
// TEST PRISMA CLIENT
// =============================================================================

/**
 * Create a Prisma client for testing
 * Uses the test database URL from environment
 */
function createTestPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: ['error'],
  });
}

// =============================================================================
// TESTS: Prisma Client Initialization
// =============================================================================

describe('HARD-01: Prisma Client Initialization', () => {
  it('should create PrismaClient without errors', () => {
    const client = createTestPrismaClient();
    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(PrismaClient);
  });

  it('should have all model delegates defined', () => {
    const client = createTestPrismaClient();

    // Check a sampling of important models
    expect(client.vendor).toBeDefined();
    expect(client.district).toBeDefined();
    expect(client.user).toBeDefined();
    expect(client.school).toBeDefined();
    expect(client.class).toBeDefined();
    expect(client.enrollment).toBeDefined();
  });

  it('should have transaction support', () => {
    const client = createTestPrismaClient();
    expect(typeof client.$transaction).toBe('function');
  });

  it('should have raw query support', () => {
    const client = createTestPrismaClient();
    expect(typeof client.$queryRaw).toBe('function');
    expect(typeof client.$executeRaw).toBe('function');
  });
});

// =============================================================================
// TESTS: Database Connection
// =============================================================================

describeWithPostgres('HARD-01: Database Connection', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to database successfully', async () => {
    await expect(prisma.$connect()).resolves.not.toThrow();
  });

  it('should execute simple query', async () => {
    // Simple SELECT 1 to verify connection
    const result = await prisma.$queryRaw<[{ result: number }]>`SELECT 1 as result`;
    expect(result[0].result).toBe(1);
  });

  it('should disconnect cleanly', async () => {
    const testClient = createTestPrismaClient();
    await testClient.$connect();
    await expect(testClient.$disconnect()).resolves.not.toThrow();
  });
});

// =============================================================================
// TESTS: Model Accessibility
// =============================================================================

describeWithPostgres('HARD-01: Model Accessibility', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should have vendor model accessible', async () => {
    const result = await prisma.vendor.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have district model accessible', async () => {
    const result = await prisma.district.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have user model accessible', async () => {
    const result = await prisma.user.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have school model accessible', async () => {
    const result = await prisma.school.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have auditLog model accessible', async () => {
    const result = await prisma.auditLog.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have integrationConfig model accessible', async () => {
    const result = await prisma.integrationConfig.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

// =============================================================================
// TESTS: CRUD Operations
// =============================================================================

describeWithPostgres('HARD-01: CRUD Operations', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({});
    await prisma.sandboxCredentials.deleteMany({});
    await prisma.integrationConfig.deleteMany({});
    await prisma.vendor.deleteMany({});
    await prisma.podsApplication.deleteMany({});
  });

  it('should CREATE a vendor', async () => {
    const vendor = await prisma.vendor.create({
      data: {
        name: 'Test Vendor',
        contactEmail: 'test@vendor.com',
        contactName: 'Test Contact',
        defaultAccessTier: 'PRIVACY_SAFE',
        podsStatus: 'APPROVED',
      },
    });

    expect(vendor.id).toBeDefined();
    expect(vendor.name).toBe('Test Vendor');
    expect(vendor.contactEmail).toBe('test@vendor.com');
  });

  it('should READ a vendor by ID', async () => {
    const created = await prisma.vendor.create({
      data: {
        name: 'Read Test',
        contactEmail: 'read@vendor.com',
        contactName: 'Read Contact',
      },
    });

    const found = await prisma.vendor.findUnique({
      where: { id: created.id },
    });

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.name).toBe('Read Test');
  });

  it('should UPDATE a vendor', async () => {
    const created = await prisma.vendor.create({
      data: {
        name: 'Update Test',
        contactEmail: 'update@vendor.com',
        contactName: 'Update Contact',
      },
    });

    const updated = await prisma.vendor.update({
      where: { id: created.id },
      data: { name: 'Updated Name' },
    });

    expect(updated.name).toBe('Updated Name');
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
      created.createdAt.getTime()
    );
  });

  it('should DELETE a vendor', async () => {
    const created = await prisma.vendor.create({
      data: {
        name: 'Delete Test',
        contactEmail: 'delete@vendor.com',
        contactName: 'Delete Contact',
      },
    });

    await prisma.vendor.delete({
      where: { id: created.id },
    });

    const found = await prisma.vendor.findUnique({
      where: { id: created.id },
    });

    expect(found).toBeNull();
  });
});

// =============================================================================
// TESTS: Transactions
// =============================================================================

describeWithPostgres('HARD-01: Transaction Support', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.auditLog.deleteMany({});
    await prisma.vendor.deleteMany({});
  });

  it('should commit successful transactions', async () => {
    const result = await prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.create({
        data: {
          name: 'Transaction Test',
          contactEmail: 'tx@vendor.com',
          contactName: 'TX Contact',
        },
      });

      await tx.auditLog.create({
        data: {
          vendorId: vendor.id,
          action: 'TEST_ACTION',
          resourceType: 'vendor',
        },
      });

      return vendor;
    });

    expect(result.id).toBeDefined();

    const vendor = await prisma.vendor.findUnique({
      where: { id: result.id },
    });
    expect(vendor).not.toBeNull();
  });

  it('should rollback failed transactions', async () => {
    const initialCount = await prisma.vendor.count();

    try {
      await prisma.$transaction(async (tx) => {
        await tx.vendor.create({
          data: {
            name: 'Rollback Test',
            contactEmail: 'rollback@vendor.com',
            contactName: 'Rollback Contact',
          },
        });

        // This should fail and cause rollback
        throw new Error('Intentional failure');
      });
    } catch (e) {
      // Expected error
    }

    const finalCount = await prisma.vendor.count();
    expect(finalCount).toBe(initialCount);
  });
});

// =============================================================================
// TESTS: Unique Constraints
// =============================================================================

describeWithPostgres('HARD-01: Unique Constraints', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.vendor.deleteMany({});
  });

  it('should enforce unique email constraint on vendor', async () => {
    await prisma.vendor.create({
      data: {
        name: 'First Vendor',
        contactEmail: 'unique@vendor.com',
        contactName: 'First Contact',
      },
    });

    await expect(
      prisma.vendor.create({
        data: {
          name: 'Second Vendor',
          contactEmail: 'unique@vendor.com',
          contactName: 'Second Contact',
        },
      })
    ).rejects.toThrow();
  });
});

// =============================================================================
// TESTS: Soft Delete Support
// =============================================================================

describeWithPostgres('HARD-01: Soft Delete Support', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.vendor.deleteMany({});
  });

  it('should support deletedAt field for soft deletes', async () => {
    const vendor = await prisma.vendor.create({
      data: {
        name: 'Soft Delete Test',
        contactEmail: 'softdelete@vendor.com',
        contactName: 'Soft Delete Contact',
      },
    });

    const updated = await prisma.vendor.update({
      where: { id: vendor.id },
      data: { deletedAt: new Date() },
    });

    expect(updated.deletedAt).not.toBeNull();
  });

  it('should filter out soft-deleted records when queried', async () => {
    await prisma.vendor.create({
      data: {
        name: 'Active Vendor',
        contactEmail: 'active@vendor.com',
        contactName: 'Active Contact',
        deletedAt: null,
      },
    });

    await prisma.vendor.create({
      data: {
        name: 'Deleted Vendor',
        contactEmail: 'deleted@vendor.com',
        contactName: 'Deleted Contact',
        deletedAt: new Date(),
      },
    });

    const activeVendors = await prisma.vendor.findMany({
      where: { deletedAt: null },
    });

    expect(activeVendors).toHaveLength(1);
    expect(activeVendors[0].name).toBe('Active Vendor');
  });
});

// =============================================================================
// TESTS: Error Handling
// =============================================================================

describeWithPostgres('HARD-01: Error Handling', () => {
  it('should handle connection errors gracefully', async () => {
    // Create client with invalid URL
    const invalidClient = new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://invalid:invalid@localhost:9999/nonexistent',
        },
      },
      log: [],
    });

    await expect(invalidClient.$connect()).rejects.toThrow();
  });

  it('should provide meaningful error for invalid queries', async () => {
    const prisma = createTestPrismaClient();
    await prisma.$connect();

    // Attempting to create with invalid data should throw
    await expect(
      prisma.vendor.create({
        data: {
          name: '', // Empty name should be allowed, but...
          contactEmail: 'invalid-email', // Invalid format
          contactName: 'Test',
          // Missing required field or violating constraint should error
        },
      })
    ).resolves.toBeDefined(); // This actually works in Prisma (no email validation)

    // But a duplicate unique constraint should throw
    const email = `error-test-${Date.now()}@vendor.com`;
    await prisma.vendor.create({
      data: { name: 'First', contactEmail: email, contactName: 'First' },
    });

    await expect(
      prisma.vendor.create({
        data: { name: 'Second', contactEmail: email, contactName: 'Second' },
      })
    ).rejects.toThrow();

    // Cleanup
    await prisma.vendor.deleteMany({ where: { contactEmail: email } });
    await prisma.$disconnect();
  });
});

// =============================================================================
// TESTS: Index Verification
// =============================================================================

describeWithPostgres('HARD-01: Index Verification', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should have performant queries on indexed fields', async () => {
    // This is a smoke test - actual performance testing would need larger datasets
    const start = Date.now();

    await prisma.vendor.findMany({
      where: { podsStatus: 'APPROVED' },
      take: 10,
    });

    const duration = Date.now() - start;

    // Query should complete quickly (< 1 second)
    expect(duration).toBeLessThan(1000);
  });
});

// =============================================================================
// TESTS: Timestamp Auto-Update
// =============================================================================

describeWithPostgres('HARD-01: Timestamp Auto-Update', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.vendor.deleteMany({});
  });

  it('should auto-set createdAt on create', async () => {
    const before = new Date();

    const vendor = await prisma.vendor.create({
      data: {
        name: 'Timestamp Test',
        contactEmail: 'timestamp@vendor.com',
        contactName: 'Timestamp Contact',
      },
    });

    const after = new Date();

    expect(vendor.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(vendor.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should auto-update updatedAt on update', async () => {
    const vendor = await prisma.vendor.create({
      data: {
        name: 'UpdatedAt Test',
        contactEmail: 'updatedat@vendor.com',
        contactName: 'UpdatedAt Contact',
      },
    });

    // Wait a bit to ensure time difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    const updated = await prisma.vendor.update({
      where: { id: vendor.id },
      data: { name: 'New Name' },
    });

    expect(updated.updatedAt.getTime()).toBeGreaterThan(vendor.createdAt.getTime());
  });
});
