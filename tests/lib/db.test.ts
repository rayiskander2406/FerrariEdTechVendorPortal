/**
 * Database Layer Unit Tests
 *
 * Tests for the in-memory mock database layer.
 *
 * @module tests/lib/db
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  createVendor,
  getVendor,
  getVendorByEmail,
  updateVendor,
  listVendors,
  createSandbox,
  getSandbox,
  updateSandboxLastUsed,
  updateSandboxEndpoints,
  revokeSandbox,
  logAuditEvent,
  getAuditLogs,
  getAllAuditLogs,
  clearAllStores,
  getDbStats,
  isMockMode,
  seedDatabase,
} from '@/lib/db';
import type { PodsLiteInput } from '@/lib/types';

// Clean database before each test for isolation
beforeEach(async () => {
  await clearAllStores();
});

// Clean database after all tests complete
afterAll(async () => {
  await clearAllStores();
});

// =============================================================================
// FIXTURES
// =============================================================================

// Generate unique email for each test to avoid unique constraint violations
let testEmailCounter = 0;
function uniqueEmail(): string {
  return `test-${Date.now()}-${++testEmailCounter}@vendor.com`;
}

function createMockPodsLiteInput(overrides: Partial<PodsLiteInput> = {}): PodsLiteInput {
  return {
    vendorName: 'Test Vendor',
    contactEmail: overrides.contactEmail ?? uniqueEmail(),
    contactName: 'Test User',
    contactPhone: '555-0100',
    applicationName: 'Test App',
    applicationDescription: 'Test description',
    dataElementsRequested: ['STUDENT_ID', 'FIRST_NAME', 'GRADE_LEVEL'],
    dataPurpose: 'Testing',
    dataRetentionDays: 365,
    integrationMethod: 'ONEROSTER_API',
    thirdPartySharing: false,
    thirdPartyDetails: undefined,
    hasSOC2: true,
    hasFERPACertification: true,
    encryptsDataAtRest: true,
    encryptsDataInTransit: true,
    breachNotificationHours: 24,
    coppaCompliant: true,
    acceptsTerms: true,
    acceptsDataDeletion: true,
    ...overrides,
  };
}

// =============================================================================
// CONFIGURATION TESTS
// =============================================================================

describe('Database Configuration', () => {
  it('should not be in mock mode (using real Prisma)', () => {
    // isMockMode() always returns false now that we use Prisma
    expect(isMockMode()).toBe(false);
  });
});

// =============================================================================
// VENDOR TESTS
// =============================================================================

describe('Vendor Operations', () => {
  describe('createVendor', () => {
    it('should create vendor with PRIVACY_SAFE tier for non-sensitive data', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      expect(vendor.id).toBeDefined();
      expect(vendor.name).toBe('Test Vendor');
      expect(vendor.contactEmail).toMatch(/@vendor\.com$/);  // Unique emails
      expect(vendor.accessTier).toBe('PRIVACY_SAFE');
      expect(vendor.podsStatus).toBe('APPROVED');
    });

    it('should create vendor with SELECTIVE tier for sensitive data', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput({
          dataElementsRequested: ['STUDENT_ID', 'EMAIL', 'PHONE'],
        }),
      });

      expect(vendor.accessTier).toBe('SELECTIVE');
      expect(vendor.podsStatus).toBe('PENDING_REVIEW');
    });

    it('should allow overriding access tier', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
        accessTier: 'FULL_ACCESS',
      });

      expect(vendor.accessTier).toBe('FULL_ACCESS');
    });

    it('should generate unique IDs', async () => {
      const vendor1 = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const vendor2 = await createVendor({
        podsLiteInput: createMockPodsLiteInput({ vendorName: 'Vendor 2' }),
      });

      expect(vendor1.id).not.toBe(vendor2.id);
    });

    it('should generate PoDS application ID', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      expect(vendor.podsApplicationId).toMatch(/^PODS-\d{4}-\d{3}$/);
    });

    it('should set timestamps', async () => {
      const before = new Date();
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const after = new Date();

      expect(vendor.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(vendor.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(vendor.updatedAt).toEqual(vendor.createdAt);
    });

    it('should detect sensitive data elements correctly', async () => {
      type DataElementType = "STUDENT_ID" | "FIRST_NAME" | "LAST_NAME" | "EMAIL" | "GRADE_LEVEL" | "SCHOOL_ID" | "CLASS_ROSTER" | "TEACHER_ID" | "PHONE" | "ADDRESS" | "DEMOGRAPHICS" | "SPECIAL_ED" | "ATTENDANCE" | "GRADES";
      const sensitiveElements: DataElementType[] = ['LAST_NAME', 'EMAIL', 'PHONE', 'ADDRESS', 'DEMOGRAPHICS', 'SPECIAL_ED'];

      for (const element of sensitiveElements) {
        await clearAllStores();
        const vendor = await createVendor({
          podsLiteInput: createMockPodsLiteInput({
            dataElementsRequested: ['STUDENT_ID', element],
          }),
        });
        expect(vendor.accessTier).toBe('SELECTIVE');
      }
    });
  });

  describe('getVendor', () => {
    it('should return vendor by ID', async () => {
      const created = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      const retrieved = await getVendor(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return null for non-existent ID', async () => {
      const result = await getVendor('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getVendorByEmail', () => {
    it('should return vendor by email', async () => {
      await createVendor({
        podsLiteInput: createMockPodsLiteInput({
          contactEmail: 'unique@vendor.com',
        }),
      });

      const retrieved = await getVendorByEmail('unique@vendor.com');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.contactEmail).toBe('unique@vendor.com');
    });

    it('should return null for non-existent email', async () => {
      const result = await getVendorByEmail('nonexistent@vendor.com');
      expect(result).toBeNull();
    });
  });

  describe('updateVendor', () => {
    it('should update vendor fields', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      const updated = await updateVendor(vendor.id, {
        name: 'Updated Name',
        podsStatus: 'PENDING_REVIEW',
      });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.podsStatus).toBe('PENDING_REVIEW');
    });

    it('should update updatedAt timestamp', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await updateVendor(vendor.id, { name: 'New Name' });

      expect(updated?.updatedAt.getTime()).toBeGreaterThan(vendor.updatedAt.getTime());
    });

    it('should return null for non-existent vendor', async () => {
      const result = await updateVendor('non-existent', { name: 'Test' });
      expect(result).toBeNull();
    });

    it('should preserve unchanged fields', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput({
          vendorName: 'Original Name',
          contactEmail: 'original@test.com',
        }),
      });

      await updateVendor(vendor.id, { name: 'New Name' });
      const retrieved = await getVendor(vendor.id);

      expect(retrieved?.name).toBe('New Name');
      expect(retrieved?.contactEmail).toBe('original@test.com');
    });
  });

  describe('listVendors', () => {
    it('should return empty array when no vendors', async () => {
      const vendors = await listVendors();
      expect(vendors).toEqual([]);
    });

    it('should return all vendors', async () => {
      await createVendor({
        podsLiteInput: createMockPodsLiteInput({ vendorName: 'Vendor 1' }),
      });
      await createVendor({
        podsLiteInput: createMockPodsLiteInput({ vendorName: 'Vendor 2' }),
      });

      const vendors = await listVendors();

      expect(vendors).toHaveLength(2);
    });
  });
});

// =============================================================================
// SANDBOX TESTS
// =============================================================================

describe('Sandbox Operations', () => {
  describe('createSandbox', () => {
    it('should create sandbox for approved vendor', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      const sandbox = await createSandbox(vendor.id);

      expect(sandbox.id).toBeDefined();
      expect(sandbox.vendorId).toBe(vendor.id);
      expect(sandbox.apiKey).toMatch(/^sbox_test_/);
      expect(sandbox.apiSecret.length).toBe(64);
      expect(sandbox.status).toBe('ACTIVE');
      expect(sandbox.environment).toBe('sandbox');
    });

    it('should throw for non-existent vendor', async () => {
      await expect(createSandbox('non-existent')).rejects.toThrow('Vendor not found');
    });

    it('should throw for non-approved vendor', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput({
          dataElementsRequested: ['EMAIL'], // Triggers SELECTIVE tier
        }),
      });

      await expect(createSandbox(vendor.id)).rejects.toThrow('must be approved');
    });

    it('should set 90-day expiration', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const before = new Date();

      const sandbox = await createSandbox(vendor.id);

      const expectedExpiry = new Date(before.getTime() + 90 * 24 * 60 * 60 * 1000);
      expect(sandbox.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry.getTime() - 1000);
      expect(sandbox.expiresAt.getTime()).toBeLessThanOrEqual(expectedExpiry.getTime() + 1000);
    });

    it('should set allowed endpoints', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      const sandbox = await createSandbox(vendor.id);

      expect(sandbox.allowedEndpoints).toContain('/users');
      expect(sandbox.allowedEndpoints).toContain('/orgs');
      expect(sandbox.allowedEndpoints).toContain('/classes');
    });

    it('should set rate limit', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      const sandbox = await createSandbox(vendor.id);

      expect(sandbox.rateLimitPerMinute).toBe(60);
    });
  });

  describe('getSandbox', () => {
    it('should return sandbox by vendor ID', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const sandbox = await getSandbox(vendor.id);

      expect(sandbox).not.toBeNull();
      expect(sandbox?.vendorId).toBe(vendor.id);
    });

    it('should return null for vendor without sandbox', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      const sandbox = await getSandbox(vendor.id);

      expect(sandbox).toBeNull();
    });
  });

  describe('updateSandboxLastUsed', () => {
    it('should update lastUsedAt timestamp', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      await updateSandboxLastUsed(vendor.id);

      const sandbox = await getSandbox(vendor.id);
      expect(sandbox?.lastUsedAt).toBeDefined();
    });

    it('should handle non-existent sandbox gracefully', async () => {
      await expect(updateSandboxLastUsed('non-existent')).resolves.not.toThrow();
    });
  });

  describe('revokeSandbox', () => {
    it('should revoke sandbox', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const revoked = await revokeSandbox(vendor.id);

      expect(revoked?.status).toBe('REVOKED');
    });

    it('should return null for non-existent sandbox', async () => {
      const result = await revokeSandbox('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('updateSandboxEndpoints', () => {
    it('should add new endpoints in add mode', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const originalSandbox = await getSandbox(vendor.id);
      const originalCount = originalSandbox?.allowedEndpoints.length ?? 0;

      const updated = await updateSandboxEndpoints(
        vendor.id,
        ['/academicSessions'],
        'add'
      );

      expect(updated).not.toBeNull();
      expect(updated?.allowedEndpoints).toContain('/academicSessions');
      expect(updated?.allowedEndpoints.length).toBeGreaterThanOrEqual(originalCount);
    });

    it('should replace all endpoints in replace mode', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const newEndpoints = ['/users', '/classes'];
      const updated = await updateSandboxEndpoints(
        vendor.id,
        newEndpoints,
        'replace'
      );

      expect(updated).not.toBeNull();
      expect(updated?.allowedEndpoints).toEqual(newEndpoints);
    });

    it('should default to add mode', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const originalSandbox = await getSandbox(vendor.id);
      const originalEndpoints = originalSandbox?.allowedEndpoints ?? [];

      const updated = await updateSandboxEndpoints(vendor.id, ['/demographics']);

      expect(updated).not.toBeNull();
      // Should have all original endpoints plus /demographics
      for (const ep of originalEndpoints) {
        expect(updated?.allowedEndpoints).toContain(ep);
      }
      expect(updated?.allowedEndpoints).toContain('/demographics');
    });

    it('should deduplicate endpoints in add mode', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      // Try to add an endpoint that already exists
      const updated = await updateSandboxEndpoints(
        vendor.id,
        ['/users', '/users', '/classes'],
        'add'
      );

      expect(updated).not.toBeNull();
      // Count occurrences of /users - should only appear once
      const usersCount = updated?.allowedEndpoints.filter(ep => ep === '/users').length;
      expect(usersCount).toBe(1);
    });

    it('should validate and normalize endpoint paths', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      // Test with endpoints without leading slash
      const updated = await updateSandboxEndpoints(
        vendor.id,
        ['users', 'classes'],
        'replace'
      );

      expect(updated).not.toBeNull();
      expect(updated?.allowedEndpoints).toContain('/users');
      expect(updated?.allowedEndpoints).toContain('/classes');
    });

    it('should return null for non-existent vendor', async () => {
      const result = await updateSandboxEndpoints(
        'non-existent-vendor',
        ['/users'],
        'add'
      );

      expect(result).toBeNull();
    });

    it('should return null for vendor without sandbox', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      // Don't create sandbox

      const result = await updateSandboxEndpoints(
        vendor.id,
        ['/users'],
        'add'
      );

      expect(result).toBeNull();
    });

    it('should log audit event when endpoints updated', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      await updateSandboxEndpoints(vendor.id, ['/demographics'], 'add');

      const logs = await getAuditLogs(vendor.id);
      const endpointUpdateLog = logs.find(
        log => log.action === 'SANDBOX_ENDPOINTS_UPDATED'
      );

      expect(endpointUpdateLog).toBeDefined();
      expect(endpointUpdateLog?.details).toHaveProperty('mode', 'add');
      expect(endpointUpdateLog?.details).toHaveProperty('previousEndpoints');
      expect(endpointUpdateLog?.details).toHaveProperty('newEndpoints');
    });

    it('should fall back to defaults for invalid endpoints', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      // Try to set only invalid endpoints
      const updated = await updateSandboxEndpoints(
        vendor.id,
        ['/invalid', '/not-real'],
        'replace'
      );

      expect(updated).not.toBeNull();
      // Should fall back to default endpoints since all provided were invalid
      expect(updated?.allowedEndpoints.length).toBeGreaterThan(0);
      expect(updated?.allowedEndpoints).toContain('/users');
    });
  });
});

// =============================================================================
// AUDIT LOG TESTS
// =============================================================================

describe('Audit Log Operations', () => {
  describe('logAuditEvent', () => {
    it('should log audit event', async () => {
      // Create a vendor first (FK constraint)
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      const log = await logAuditEvent({
        vendorId: vendor.id,
        action: 'TEST_ACTION',
        resourceType: 'test',
        resourceId: 'resource-456',
        details: { key: 'value' },
      });

      expect(log.id).toBeDefined();
      expect(log.vendorId).toBe(vendor.id);
      expect(log.action).toBe('TEST_ACTION');
      expect(log.resourceType).toBe('test');
      expect(log.resourceId).toBe('resource-456');
      expect(log.details).toEqual({ key: 'value' });
      expect(log.timestamp).toBeInstanceOf(Date);
    });

    it('should include optional IP and user agent', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      const log = await logAuditEvent({
        vendorId: vendor.id,
        action: 'LOGIN',
        resourceType: 'session',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(log.ipAddress).toBe('192.168.1.1');
      expect(log.userAgent).toBe('Mozilla/5.0');
    });
  });

  describe('getAuditLogs', () => {
    it('should return logs for vendor', async () => {
      const vendor1 = await createVendor({
        podsLiteInput: createMockPodsLiteInput({ vendorName: 'Vendor 1' }),
      });
      const vendor2 = await createVendor({
        podsLiteInput: createMockPodsLiteInput({ vendorName: 'Vendor 2' }),
      });

      await logAuditEvent({
        vendorId: vendor1.id,
        action: 'ACTION_1',
        resourceType: 'test',
      });
      await logAuditEvent({
        vendorId: vendor1.id,
        action: 'ACTION_2',
        resourceType: 'test',
      });
      await logAuditEvent({
        vendorId: vendor2.id,
        action: 'ACTION_3',
        resourceType: 'test',
      });

      const logs = await getAuditLogs(vendor1.id);

      // Vendor creation also logs, so we check for at least our 2 actions
      const testLogs = logs.filter((l) => l.action.startsWith('ACTION_'));
      expect(testLogs).toHaveLength(2);
      expect(logs.every((l) => l.vendorId === vendor1.id)).toBe(true);
    });

    it('should return logs in reverse chronological order', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      await logAuditEvent({
        vendorId: vendor.id,
        action: 'FIRST',
        resourceType: 'test',
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
      await logAuditEvent({
        vendorId: vendor.id,
        action: 'SECOND',
        resourceType: 'test',
      });

      const logs = await getAuditLogs(vendor.id);
      const testLogs = logs.filter((l) => ['FIRST', 'SECOND'].includes(l.action));

      expect(testLogs[0]?.action).toBe('SECOND');
      expect(testLogs[1]?.action).toBe('FIRST');
    });

    it('should respect limit parameter', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      for (let i = 0; i < 10; i++) {
        await logAuditEvent({
          vendorId: vendor.id,
          action: `ACTION_${i}`,
          resourceType: 'test',
        });
      }

      const logs = await getAuditLogs(vendor.id, 5);

      expect(logs).toHaveLength(5);
    });

    it('should return empty array for vendor with no logs', async () => {
      // Create a vendor but don't log anything manually
      // (createVendor logs automatically, so we need a different approach)
      // Query for a non-existent vendor ID
      const logs = await getAuditLogs('non-existent-vendor-id');
      expect(logs).toEqual([]);
    });
  });

  describe('getAllAuditLogs', () => {
    it('should return all logs', async () => {
      const vendor1 = await createVendor({
        podsLiteInput: createMockPodsLiteInput({ vendorName: 'V1' }),
      });
      const vendor2 = await createVendor({
        podsLiteInput: createMockPodsLiteInput({ vendorName: 'V2' }),
      });

      await logAuditEvent({
        vendorId: vendor1.id,
        action: 'ACTION_1',
        resourceType: 'test',
      });
      await logAuditEvent({
        vendorId: vendor2.id,
        action: 'ACTION_2',
        resourceType: 'test',
      });

      const logs = await getAllAuditLogs();

      expect(logs.length).toBeGreaterThanOrEqual(2);
    });

    it('should respect limit parameter', async () => {
      const logs = await getAllAuditLogs(3);
      expect(logs.length).toBeLessThanOrEqual(3);
    });
  });
});

// =============================================================================
// UTILITY TESTS
// =============================================================================

describe('Database Utilities', () => {
  describe('clearAllStores', () => {
    it('should clear all data', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await logAuditEvent({
        vendorId: vendor.id,  // Use actual vendor ID for FK constraint
        action: 'TEST',
        resourceType: 'test',
      });

      await clearAllStores();

      const vendors = await listVendors();
      const stats = await getDbStats();

      expect(vendors).toEqual([]);
      expect(stats.vendors).toBe(0);
      expect(stats.sandboxes).toBe(0);
      expect(stats.auditLogs).toBe(0);
    });
  });

  describe('getDbStats', () => {
    it('should return accurate counts', async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const stats = await getDbStats();

      expect(stats.vendors).toBe(1);
      expect(stats.sandboxes).toBe(1);
      expect(stats.auditLogs).toBeGreaterThan(0);
    });
  });

  describe('seedDatabase', () => {
    it('should seed with sample data', async () => {
      await seedDatabase();

      const vendors = await listVendors();
      expect(vendors.length).toBeGreaterThan(0);
    });

    it('should not seed if already has data', async () => {
      await createVendor({
        podsLiteInput: createMockPodsLiteInput({ vendorName: 'Existing' }),
      });

      await seedDatabase();

      const vendors = await listVendors();
      // Should still have only one vendor
      expect(vendors.find((v) => v.name === 'Demo EdTech Vendor')).toBeUndefined();
    });
  });
});
