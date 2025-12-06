/**
 * Audit Logging Tests
 *
 * V1-08: Unit tests for audit logging module.
 *
 * Tests cover:
 * - Audit event logging
 * - Action types and resource types
 * - Query and filtering
 * - Retention policies
 * - PII protection in audit logs
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Use vi.hoisted for mock functions to avoid hoisting issues
const { mockCreate, mockFindMany, mockFindUnique, mockCount, mockDeleteMany } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindMany: vi.fn(),
  mockFindUnique: vi.fn(),
  mockCount: vi.fn(),
  mockDeleteMany: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    auditLog: {
      create: mockCreate,
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      count: mockCount,
      deleteMany: mockDeleteMany,
    },
  },
}));

import {
  logAudit,
  getAuditLogs,
  getAuditLog,
  deleteExpiredAuditLogs,
  AuditAction,
  AuditResourceType,
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
  DEFAULT_RETENTION_DAYS,
  type AuditLogEntry,
  type AuditLogFilter,
  type AuditLogInput,
} from '@/lib/audit';

describe('Audit Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // CONSTANTS
  // ===========================================================================

  describe('Constants', () => {
    it('defines all audit actions', () => {
      expect(AUDIT_ACTIONS).toContain('CREATE');
      expect(AUDIT_ACTIONS).toContain('READ');
      expect(AUDIT_ACTIONS).toContain('UPDATE');
      expect(AUDIT_ACTIONS).toContain('DELETE');
      expect(AUDIT_ACTIONS).toContain('LOGIN');
      expect(AUDIT_ACTIONS).toContain('LOGOUT');
      expect(AUDIT_ACTIONS).toContain('API_KEY_CREATE');
      expect(AUDIT_ACTIONS).toContain('API_KEY_REVOKE');
      expect(AUDIT_ACTIONS).toContain('API_KEY_ROTATE');
      expect(AUDIT_ACTIONS).toContain('RATE_LIMIT_EXCEEDED');
      expect(AUDIT_ACTIONS).toContain('MESSAGE_SENT');
      expect(AUDIT_ACTIONS).toContain('MESSAGE_FAILED');
    });

    it('defines all resource types', () => {
      expect(AUDIT_RESOURCE_TYPES).toContain('VENDOR');
      expect(AUDIT_RESOURCE_TYPES).toContain('INTEGRATION');
      expect(AUDIT_RESOURCE_TYPES).toContain('CREDENTIAL');
      expect(AUDIT_RESOURCE_TYPES).toContain('API_KEY');
      expect(AUDIT_RESOURCE_TYPES).toContain('SESSION');
      expect(AUDIT_RESOURCE_TYPES).toContain('MESSAGE');
      expect(AUDIT_RESOURCE_TYPES).toContain('SYNC_JOB');
    });

    it('has default retention period', () => {
      expect(DEFAULT_RETENTION_DAYS).toBeGreaterThan(0);
      expect(DEFAULT_RETENTION_DAYS).toBe(90); // 90 days default
    });
  });

  // ===========================================================================
  // LOG AUDIT
  // ===========================================================================

  describe('logAudit', () => {
    it('logs audit event with required fields', async () => {
      const mockEntry = {
        id: 'audit-123',
        vendorId: 'vendor-456',
        action: 'CREATE',
        resourceType: 'INTEGRATION',
        resourceId: 'int-789',
        details: null,
        ipAddress: null,
        userAgent: null,
        timestamp: new Date(),
        retainUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      };
      mockCreate.mockResolvedValue(mockEntry);

      const result = await logAudit({
        vendorId: 'vendor-456',
        action: 'CREATE',
        resourceType: 'INTEGRATION',
        resourceId: 'int-789',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          vendorId: 'vendor-456',
          action: 'CREATE',
          resourceType: 'INTEGRATION',
          resourceId: 'int-789',
        }),
      });
      expect(result.id).toBe('audit-123');
    });

    it('logs audit event with optional details', async () => {
      const mockEntry = {
        id: 'audit-123',
        vendorId: 'vendor-456',
        action: 'UPDATE',
        resourceType: 'VENDOR',
        resourceId: 'vendor-456',
        details: JSON.stringify({ changes: { name: 'New Name' } }),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        retainUntil: new Date(),
      };
      mockCreate.mockResolvedValue(mockEntry);

      await logAudit({
        vendorId: 'vendor-456',
        action: 'UPDATE',
        resourceType: 'VENDOR',
        resourceId: 'vendor-456',
        details: { changes: { name: 'New Name' } },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          details: JSON.stringify({ changes: { name: 'New Name' } }),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      });
    });

    it('allows null vendorId for system events', async () => {
      const mockEntry = {
        id: 'audit-123',
        vendorId: null,
        action: 'DELETE',
        resourceType: 'SESSION',
        resourceId: null,
        details: JSON.stringify({ reason: 'expired' }),
        ipAddress: null,
        userAgent: null,
        timestamp: new Date(),
        retainUntil: new Date(),
      };
      mockCreate.mockResolvedValue(mockEntry);

      const result = await logAudit({
        vendorId: null,
        action: 'DELETE',
        resourceType: 'SESSION',
        details: { reason: 'expired' },
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          vendorId: null,
          action: 'DELETE',
          resourceType: 'SESSION',
        }),
      });
      expect(result.vendorId).toBeNull();
    });

    it('sets retention date based on default retention days', async () => {
      const mockEntry = {
        id: 'audit-123',
        vendorId: 'vendor-456',
        action: 'CREATE',
        resourceType: 'MESSAGE',
        resourceId: 'msg-123',
        details: null,
        ipAddress: null,
        userAgent: null,
        timestamp: new Date(),
        retainUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      };
      mockCreate.mockResolvedValue(mockEntry);

      await logAudit({
        vendorId: 'vendor-456',
        action: 'CREATE',
        resourceType: 'MESSAGE',
        resourceId: 'msg-123',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          retainUntil: expect.any(Date),
        }),
      });
    });

    it('allows custom retention period', async () => {
      const customRetention = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
      const mockEntry = {
        id: 'audit-123',
        vendorId: 'vendor-456',
        action: 'CREATE',
        resourceType: 'VENDOR',
        resourceId: 'vendor-456',
        details: null,
        ipAddress: null,
        userAgent: null,
        timestamp: new Date(),
        retainUntil: customRetention,
      };
      mockCreate.mockResolvedValue(mockEntry);

      await logAudit({
        vendorId: 'vendor-456',
        action: 'CREATE',
        resourceType: 'VENDOR',
        resourceId: 'vendor-456',
        retainUntil: customRetention,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          retainUntil: customRetention,
        }),
      });
    });

    it('redacts sensitive data from details', async () => {
      const mockEntry = {
        id: 'audit-123',
        vendorId: 'vendor-456',
        action: 'API_KEY_CREATE',
        resourceType: 'API_KEY',
        resourceId: 'key-123',
        details: JSON.stringify({ keyPrefix: 'vk_test', scopes: ['read'] }),
        ipAddress: null,
        userAgent: null,
        timestamp: new Date(),
        retainUntil: new Date(),
      };
      mockCreate.mockResolvedValue(mockEntry);

      await logAudit({
        vendorId: 'vendor-456',
        action: 'API_KEY_CREATE',
        resourceType: 'API_KEY',
        resourceId: 'key-123',
        details: {
          keyPrefix: 'vk_test',
          fullKey: 'vk_test_secret123', // Should be redacted
          scopes: ['read'],
          password: 'secret', // Should be redacted
        },
      });

      const createCall = mockCreate.mock.calls[0][0];
      const details = JSON.parse(createCall.data.details);
      expect(details.fullKey).toBeUndefined();
      expect(details.password).toBeUndefined();
      expect(details.keyPrefix).toBe('vk_test');
      expect(details.scopes).toEqual(['read']);
    });
  });

  // ===========================================================================
  // GET AUDIT LOGS
  // ===========================================================================

  describe('getAuditLogs', () => {
    const mockLogs = [
      {
        id: 'audit-1',
        vendorId: 'vendor-456',
        action: 'CREATE',
        resourceType: 'INTEGRATION',
        resourceId: 'int-1',
        details: null,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date('2024-01-15'),
        retainUntil: new Date('2024-04-15'),
      },
      {
        id: 'audit-2',
        vendorId: 'vendor-456',
        action: 'UPDATE',
        resourceType: 'INTEGRATION',
        resourceId: 'int-1',
        details: JSON.stringify({ changes: { status: 'active' } }),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date('2024-01-16'),
        retainUntil: new Date('2024-04-16'),
      },
    ];

    it('returns all logs for a vendor', async () => {
      mockFindMany.mockResolvedValue(mockLogs);
      mockCount.mockResolvedValue(2);

      const result = await getAuditLogs({ vendorId: 'vendor-456' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { vendorId: 'vendor-456' },
        })
      );
      expect(result.logs).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('filters by action', async () => {
      mockFindMany.mockResolvedValue([mockLogs[0]]);
      mockCount.mockResolvedValue(1);

      await getAuditLogs({
        vendorId: 'vendor-456',
        action: 'CREATE',
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vendorId: 'vendor-456',
            action: 'CREATE',
          }),
        })
      );
    });

    it('filters by resource type', async () => {
      mockFindMany.mockResolvedValue(mockLogs);
      mockCount.mockResolvedValue(2);

      await getAuditLogs({
        vendorId: 'vendor-456',
        resourceType: 'INTEGRATION',
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            resourceType: 'INTEGRATION',
          }),
        })
      );
    });

    it('filters by resource ID', async () => {
      mockFindMany.mockResolvedValue([mockLogs[0]]);
      mockCount.mockResolvedValue(1);

      await getAuditLogs({
        vendorId: 'vendor-456',
        resourceId: 'int-1',
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            resourceId: 'int-1',
          }),
        })
      );
    });

    it('filters by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockFindMany.mockResolvedValue(mockLogs);
      mockCount.mockResolvedValue(2);

      await getAuditLogs({
        vendorId: 'vendor-456',
        startDate,
        endDate,
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });

    it('supports pagination with limit and offset', async () => {
      mockFindMany.mockResolvedValue([mockLogs[0]]);
      mockCount.mockResolvedValue(100);

      const result = await getAuditLogs({
        vendorId: 'vendor-456',
        limit: 10,
        offset: 20,
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
      expect(result.total).toBe(100);
      expect(result.hasMore).toBe(true);
    });

    it('orders by timestamp descending by default', async () => {
      mockFindMany.mockResolvedValue(mockLogs);
      mockCount.mockResolvedValue(2);

      await getAuditLogs({ vendorId: 'vendor-456' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { timestamp: 'desc' },
        })
      );
    });

    it('returns empty array when no logs found', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      const result = await getAuditLogs({ vendorId: 'vendor-456' });

      expect(result.logs).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('combines multiple filters', async () => {
      mockFindMany.mockResolvedValue([mockLogs[1]]);
      mockCount.mockResolvedValue(1);

      await getAuditLogs({
        vendorId: 'vendor-456',
        action: 'UPDATE',
        resourceType: 'INTEGRATION',
        resourceId: 'int-1',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-17'),
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vendorId: 'vendor-456',
            action: 'UPDATE',
            resourceType: 'INTEGRATION',
            resourceId: 'int-1',
          }),
        })
      );
    });
  });

  // ===========================================================================
  // GET SINGLE AUDIT LOG
  // ===========================================================================

  describe('getAuditLog', () => {
    it('returns single audit log by ID', async () => {
      const mockLog = {
        id: 'audit-123',
        vendorId: 'vendor-456',
        action: 'CREATE',
        resourceType: 'INTEGRATION',
        resourceId: 'int-789',
        details: null,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        retainUntil: new Date(),
      };
      mockFindUnique.mockResolvedValue(mockLog);

      const result = await getAuditLog('audit-123');

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'audit-123' },
      });
      expect(result).toEqual(mockLog);
    });

    it('returns null for non-existent log', async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await getAuditLog('non-existent');

      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // RETENTION / CLEANUP
  // ===========================================================================

  describe('deleteExpiredAuditLogs', () => {
    it('deletes logs past retention date', async () => {
      mockDeleteMany.mockResolvedValue({ count: 50 });

      const result = await deleteExpiredAuditLogs();

      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: {
          retainUntil: {
            lt: expect.any(Date),
          },
        },
      });
      expect(result.deleted).toBe(50);
    });

    it('returns 0 when no expired logs', async () => {
      mockDeleteMany.mockResolvedValue({ count: 0 });

      const result = await deleteExpiredAuditLogs();

      expect(result.deleted).toBe(0);
    });
  });

  // ===========================================================================
  // TYPE SAFETY
  // ===========================================================================

  describe('Type Safety', () => {
    it('AuditAction type includes all actions', () => {
      const actions: AuditAction[] = [
        'CREATE',
        'READ',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'API_KEY_CREATE',
        'API_KEY_REVOKE',
        'API_KEY_ROTATE',
        'RATE_LIMIT_EXCEEDED',
        'MESSAGE_SENT',
        'MESSAGE_FAILED',
      ];
      expect(actions).toBeDefined();
    });

    it('AuditResourceType type includes all resources', () => {
      const resources: AuditResourceType[] = [
        'VENDOR',
        'INTEGRATION',
        'CREDENTIAL',
        'API_KEY',
        'SESSION',
        'MESSAGE',
        'SYNC_JOB',
      ];
      expect(resources).toBeDefined();
    });
  });
});
