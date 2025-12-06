/**
 * Audit API Tests
 *
 * V1-08: Integration tests for audit endpoints.
 *
 * Tests cover:
 * - GET /api/audit - List audit logs
 * - GET /api/audit/:id - Get single audit log
 * - Authentication requirements
 * - Pagination and filtering
 * - Vendor isolation (can only see own logs)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted for mock functions to avoid hoisting issues
const {
  mockFindMany,
  mockFindUnique,
  mockCount,
} = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFindUnique: vi.fn(),
  mockCount: vi.fn(),
}));

// Store for auth mock state - shared via closure
let authMockResult: { valid: boolean; vendorId?: string; scopes?: string[] } = { valid: false };

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    auditLog: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      count: mockCount,
    },
  },
}));

// Mock auth middleware - properly mock withAuth to call the handler with context
vi.mock('@/lib/auth', () => ({
  withAuth: vi.fn(async (request: Request, handler: Function) => {
    // Check shared auth result
    if (!authMockResult.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    // Create context from mock result
    const context = {
      vendorId: authMockResult.vendorId!,
      scopes: authMockResult.scopes || [],
      requestId: 'test-request-id',
    };
    return handler(request, context);
  }),
}));

// Helper to set auth mock state
function setAuthMock(result: { valid: boolean; vendorId?: string; scopes?: string[] }) {
  authMockResult = result;
}

import { GET as getAuditLogs } from '@/app/api/audit/route';
import { GET as getAuditLog } from '@/app/api/audit/[id]/route';

describe('Audit API', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock: valid auth with audit scope
    setAuthMock({
      valid: true,
      vendorId: 'vendor-456',
      scopes: ['read', 'audit'],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Reset auth mock
    setAuthMock({ valid: false });
  });

  // ===========================================================================
  // GET /api/audit - List Audit Logs
  // ===========================================================================

  describe('GET /api/audit', () => {
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
        timestamp: new Date('2024-01-15T10:00:00Z'),
        retainUntil: new Date('2024-04-15T10:00:00Z'),
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
        timestamp: new Date('2024-01-16T10:00:00Z'),
        retainUntil: new Date('2024-04-16T10:00:00Z'),
      },
    ];

    it('returns audit logs for authenticated vendor', async () => {
      mockFindMany.mockResolvedValue(mockLogs);
      mockCount.mockResolvedValue(2);

      const request = new NextRequest('http://localhost/api/audit', {
        headers: { Authorization: 'Bearer vk_test_123' },
      });
      const response = await getAuditLogs(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.logs).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it('requires authentication', async () => {
      setAuthMock({ valid: false });

      const request = new NextRequest('http://localhost/api/audit');
      const response = await getAuditLogs(request);

      expect(response.status).toBe(401);
    });

    it('requires audit scope', async () => {
      setAuthMock({
        valid: true,
        vendorId: 'vendor-456',
        scopes: ['read'], // No audit scope
      });

      const request = new NextRequest('http://localhost/api/audit', {
        headers: { Authorization: 'Bearer vk_test_123' },
      });
      const response = await getAuditLogs(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('scope');
    });

    it('only returns logs for authenticated vendor', async () => {
      mockFindMany.mockResolvedValue(mockLogs);
      mockCount.mockResolvedValue(2);

      const request = new NextRequest('http://localhost/api/audit', {
        headers: { Authorization: 'Bearer vk_test_123' },
      });
      await getAuditLogs(request);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vendorId: 'vendor-456',
          }),
        })
      );
    });

    it('supports action filter', async () => {
      mockFindMany.mockResolvedValue([mockLogs[0]]);
      mockCount.mockResolvedValue(1);

      const request = new NextRequest(
        'http://localhost/api/audit?action=CREATE',
        { headers: { Authorization: 'Bearer vk_test_123' } }
      );
      await getAuditLogs(request);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'CREATE',
          }),
        })
      );
    });

    it('supports resourceType filter', async () => {
      mockFindMany.mockResolvedValue(mockLogs);
      mockCount.mockResolvedValue(2);

      const request = new NextRequest(
        'http://localhost/api/audit?resourceType=INTEGRATION',
        { headers: { Authorization: 'Bearer vk_test_123' } }
      );
      await getAuditLogs(request);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            resourceType: 'INTEGRATION',
          }),
        })
      );
    });

    it('supports resourceId filter', async () => {
      mockFindMany.mockResolvedValue([mockLogs[0]]);
      mockCount.mockResolvedValue(1);

      const request = new NextRequest(
        'http://localhost/api/audit?resourceId=int-1',
        { headers: { Authorization: 'Bearer vk_test_123' } }
      );
      await getAuditLogs(request);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            resourceId: 'int-1',
          }),
        })
      );
    });

    it('supports date range filter', async () => {
      mockFindMany.mockResolvedValue(mockLogs);
      mockCount.mockResolvedValue(2);

      const request = new NextRequest(
        'http://localhost/api/audit?startDate=2024-01-01&endDate=2024-01-31',
        { headers: { Authorization: 'Bearer vk_test_123' } }
      );
      await getAuditLogs(request);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('supports pagination with limit and offset', async () => {
      mockFindMany.mockResolvedValue([mockLogs[0]]);
      mockCount.mockResolvedValue(100);

      const request = new NextRequest(
        'http://localhost/api/audit?limit=10&offset=20',
        { headers: { Authorization: 'Bearer vk_test_123' } }
      );
      const response = await getAuditLogs(request);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );

      const data = await response.json();
      expect(data.pagination).toBeDefined();
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.offset).toBe(20);
      expect(data.pagination.hasMore).toBe(true);
    });

    it('uses default pagination when not specified', async () => {
      mockFindMany.mockResolvedValue(mockLogs);
      mockCount.mockResolvedValue(2);

      const request = new NextRequest('http://localhost/api/audit', {
        headers: { Authorization: 'Bearer vk_test_123' },
      });
      await getAuditLogs(request);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50, // Default limit
          skip: 0,
        })
      );
    });

    it('enforces maximum limit', async () => {
      mockFindMany.mockResolvedValue(mockLogs);
      mockCount.mockResolvedValue(2);

      const request = new NextRequest(
        'http://localhost/api/audit?limit=1000', // Too high
        { headers: { Authorization: 'Bearer vk_test_123' } }
      );
      await getAuditLogs(request);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Max limit enforced
        })
      );
    });

    it('returns empty array when no logs', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      const request = new NextRequest('http://localhost/api/audit', {
        headers: { Authorization: 'Bearer vk_test_123' },
      });
      const response = await getAuditLogs(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.logs).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('parses details JSON in response', async () => {
      mockFindMany.mockResolvedValue([mockLogs[1]]);
      mockCount.mockResolvedValue(1);

      const request = new NextRequest('http://localhost/api/audit', {
        headers: { Authorization: 'Bearer vk_test_123' },
      });
      const response = await getAuditLogs(request);

      const data = await response.json();
      expect(data.logs[0].details).toEqual({ changes: { status: 'active' } });
    });

    it('handles invalid filter values gracefully', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      const request = new NextRequest(
        'http://localhost/api/audit?action=INVALID_ACTION',
        { headers: { Authorization: 'Bearer vk_test_123' } }
      );
      const response = await getAuditLogs(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid action');
    });
  });

  // ===========================================================================
  // GET /api/audit/:id - Get Single Audit Log
  // ===========================================================================

  describe('GET /api/audit/:id', () => {
    const mockLog = {
      id: 'audit-123',
      vendorId: 'vendor-456',
      action: 'CREATE',
      resourceType: 'INTEGRATION',
      resourceId: 'int-789',
      details: JSON.stringify({ scopes: ['users', 'classes'] }),
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      timestamp: new Date('2024-01-15T10:00:00Z'),
      retainUntil: new Date('2024-04-15T10:00:00Z'),
    };

    it('returns single audit log by ID', async () => {
      mockFindUnique.mockResolvedValue(mockLog);

      const request = new NextRequest('http://localhost/api/audit/audit-123', {
        headers: { Authorization: 'Bearer vk_test_123' },
      });
      const response = await getAuditLog(request, { params: { id: 'audit-123' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe('audit-123');
      expect(data.action).toBe('CREATE');
    });

    it('requires authentication', async () => {
      setAuthMock({ valid: false });

      const request = new NextRequest('http://localhost/api/audit/audit-123');
      const response = await getAuditLog(request, { params: { id: 'audit-123' } });

      expect(response.status).toBe(401);
    });

    it('requires audit scope', async () => {
      setAuthMock({
        valid: true,
        vendorId: 'vendor-456',
        scopes: ['read'], // No audit scope
      });

      const request = new NextRequest('http://localhost/api/audit/audit-123', {
        headers: { Authorization: 'Bearer vk_test_123' },
      });
      const response = await getAuditLog(request, { params: { id: 'audit-123' } });

      expect(response.status).toBe(403);
    });

    it('returns 404 for non-existent log', async () => {
      mockFindUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/audit/non-existent', {
        headers: { Authorization: 'Bearer vk_test_123' },
      });
      const response = await getAuditLog(request, { params: { id: 'non-existent' } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('not found');
    });

    it('returns 403 when accessing another vendor\'s log', async () => {
      const otherVendorLog = { ...mockLog, vendorId: 'other-vendor' };
      mockFindUnique.mockResolvedValue(otherVendorLog);

      const request = new NextRequest('http://localhost/api/audit/audit-123', {
        headers: { Authorization: 'Bearer vk_test_123' },
      });
      const response = await getAuditLog(request, { params: { id: 'audit-123' } });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('not authorized');
    });

    it('parses details JSON in response', async () => {
      mockFindUnique.mockResolvedValue(mockLog);

      const request = new NextRequest('http://localhost/api/audit/audit-123', {
        headers: { Authorization: 'Bearer vk_test_123' },
      });
      const response = await getAuditLog(request, { params: { id: 'audit-123' } });

      const data = await response.json();
      expect(data.details).toEqual({ scopes: ['users', 'classes'] });
    });
  });

  // ===========================================================================
  // RESPONSE FORMAT
  // ===========================================================================

  describe('Response Format', () => {
    const mockLog = {
      id: 'audit-123',
      vendorId: 'vendor-456',
      action: 'CREATE',
      resourceType: 'INTEGRATION',
      resourceId: 'int-789',
      details: null,
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      timestamp: new Date('2024-01-15T10:00:00Z'),
      retainUntil: new Date('2024-04-15T10:00:00Z'),
    };

    it('returns ISO date strings for timestamps', async () => {
      mockFindMany.mockResolvedValue([mockLog]);
      mockCount.mockResolvedValue(1);

      const request = new NextRequest('http://localhost/api/audit', {
        headers: { Authorization: 'Bearer vk_test_123' },
      });
      const response = await getAuditLogs(request);

      const data = await response.json();
      expect(data.logs[0].timestamp).toBe('2024-01-15T10:00:00.000Z');
    });

    it('includes proper cache headers', async () => {
      mockFindMany.mockResolvedValue([mockLog]);
      mockCount.mockResolvedValue(1);

      const request = new NextRequest('http://localhost/api/audit', {
        headers: { Authorization: 'Bearer vk_test_123' },
      });
      const response = await getAuditLogs(request);

      expect(response.headers.get('Cache-Control')).toContain('no-store');
    });
  });
});
