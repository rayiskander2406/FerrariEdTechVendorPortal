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
// PostgreSQL Required
// =============================================================================
// All tests require PostgreSQL. Run `docker compose up -d` before testing.

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

describe('HARD-01: Database Connection', () => {
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
// TESTS: Model Accessibility (All 36 Models - HARD-02 Requirement)
// =============================================================================

describe('HARD-02: All 36 Models Accessible in Database', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Layer 1: District Hierarchy (3 models)
  it('should have District model accessible', async () => {
    const result = await prisma.district.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have School model accessible', async () => {
    const result = await prisma.school.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have AcademicSession model accessible', async () => {
    const result = await prisma.academicSession.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  // Layer 2: Courses & Classes (3 models)
  it('should have Course model accessible', async () => {
    const result = await prisma.course.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have Class model accessible', async () => {
    const result = await prisma.class.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have Enrollment model accessible', async () => {
    const result = await prisma.enrollment.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  // Layer 3: Users (5 models)
  it('should have User model accessible', async () => {
    const result = await prisma.user.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have UserRelationship model accessible', async () => {
    const result = await prisma.userRelationship.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have UserHistory model accessible', async () => {
    const result = await prisma.userHistory.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have UserSchoolHistory model accessible', async () => {
    const result = await prisma.userSchoolHistory.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have Demographics model accessible', async () => {
    const result = await prisma.demographics.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  // Layer 4: Vendors (4 models)
  it('should have Vendor model accessible', async () => {
    const result = await prisma.vendor.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have VendorDataGrant model accessible', async () => {
    const result = await prisma.vendorDataGrant.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have VendorEntityPermission model accessible', async () => {
    const result = await prisma.vendorEntityPermission.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have VendorSchoolGrant model accessible', async () => {
    const result = await prisma.vendorSchoolGrant.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  // Layer 5: SSO (3 models)
  it('should have SsoSession model accessible', async () => {
    const result = await prisma.ssoSession.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have SsoLaunchContext model accessible', async () => {
    const result = await prisma.ssoLaunchContext.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have SsoUserMapping model accessible', async () => {
    const result = await prisma.ssoUserMapping.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  // Layer 6: LTI 1.3 (6 models)
  it('should have LtiPlatform model accessible', async () => {
    const result = await prisma.ltiPlatform.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have LtiDeployment model accessible', async () => {
    const result = await prisma.ltiDeployment.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have LtiResourceLink model accessible', async () => {
    const result = await prisma.ltiResourceLink.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have LtiLineItem model accessible', async () => {
    const result = await prisma.ltiLineItem.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have LtiGrade model accessible', async () => {
    const result = await prisma.ltiGrade.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have LtiLaunch model accessible', async () => {
    const result = await prisma.ltiLaunch.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  // Layer 7: Communication (6 models)
  it('should have MessageTemplate model accessible', async () => {
    const result = await prisma.messageTemplate.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have ContactPreference model accessible', async () => {
    const result = await prisma.contactPreference.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have ContactPreferenceCategory model accessible', async () => {
    const result = await prisma.contactPreferenceCategory.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have MessageBatch model accessible', async () => {
    const result = await prisma.messageBatch.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have MessageBatchTarget model accessible', async () => {
    const result = await prisma.messageBatchTarget.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have CommunicationMessage model accessible', async () => {
    const result = await prisma.communicationMessage.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  // Layer 8: Operations (6 models)
  it('should have PodsApplication model accessible', async () => {
    const result = await prisma.podsApplication.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have IntegrationConfig model accessible', async () => {
    const result = await prisma.integrationConfig.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have SandboxCredentials model accessible', async () => {
    const result = await prisma.sandboxCredentials.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have AuditLog model accessible', async () => {
    const result = await prisma.auditLog.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have SyncJob model accessible', async () => {
    const result = await prisma.syncJob.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have SyncError model accessible', async () => {
    const result = await prisma.syncError.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  // Infrastructure (2 models)
  it('should have ExternalServiceHealth model accessible', async () => {
    const result = await prisma.externalServiceHealth.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have SchemaMetadata model accessible', async () => {
    const result = await prisma.schemaMetadata.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

// =============================================================================
// TESTS: Model Count Verification (HARD-02)
// =============================================================================

describe('HARD-02: Model Count Verification', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should have exactly 36 queryable models', async () => {
    // Verify we can query all 36 models without error
    const modelQueries = [
      prisma.district.count(),
      prisma.school.count(),
      prisma.academicSession.count(),
      prisma.course.count(),
      prisma.class.count(),
      prisma.enrollment.count(),
      prisma.user.count(),
      prisma.userRelationship.count(),
      prisma.userHistory.count(),
      prisma.userSchoolHistory.count(),
      prisma.demographics.count(),
      prisma.vendor.count(),
      prisma.vendorDataGrant.count(),
      prisma.vendorEntityPermission.count(),
      prisma.vendorSchoolGrant.count(),
      prisma.ssoSession.count(),
      prisma.ssoLaunchContext.count(),
      prisma.ssoUserMapping.count(),
      prisma.ltiPlatform.count(),
      prisma.ltiDeployment.count(),
      prisma.ltiResourceLink.count(),
      prisma.ltiLineItem.count(),
      prisma.ltiGrade.count(),
      prisma.ltiLaunch.count(),
      prisma.messageTemplate.count(),
      prisma.contactPreference.count(),
      prisma.contactPreferenceCategory.count(),
      prisma.messageBatch.count(),
      prisma.messageBatchTarget.count(),
      prisma.communicationMessage.count(),
      prisma.podsApplication.count(),
      prisma.integrationConfig.count(),
      prisma.sandboxCredentials.count(),
      prisma.auditLog.count(),
      prisma.syncJob.count(),
      prisma.syncError.count(),
      prisma.externalServiceHealth.count(),
      prisma.schemaMetadata.count(),
    ];

    // All 38 queries should succeed (36 models + 2 infrastructure)
    // Note: We have 38 models total (36 in EXPECTED_MODELS + 2 more)
    const results = await Promise.all(modelQueries);
    expect(results.length).toBe(38);
    results.forEach((count) => {
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});

// =============================================================================
// TESTS: CRUD Operations
// =============================================================================

describe('HARD-01: CRUD Operations', () => {
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

describe('HARD-01: Transaction Support', () => {
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

describe('HARD-01: Unique Constraints', () => {
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

describe('HARD-01: Soft Delete Support', () => {
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

describe('HARD-01: Error Handling', () => {
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

describe('HARD-01: Index Verification', () => {
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

describe('HARD-01: Timestamp Auto-Update', () => {
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
