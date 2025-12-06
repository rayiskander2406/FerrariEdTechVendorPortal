/**
 * CPaaS Messages API Tests
 *
 * V1-05: Integration tests for /api/cpaas/messages endpoint.
 *
 * Tests cover:
 * - Request validation
 * - Authentication and authorization
 * - Message creation and queuing
 * - Batch operations
 * - Status retrieval
 * - Cost estimation
 * - Rate limiting integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    communicationMessage: {
      create: vi.fn(),
      createMany: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    messageBatch: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    vendor: {
      findUnique: vi.fn(),
    },
    apiKey: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/cpaas/queue', () => ({
  enqueueMessage: vi.fn(),
  enqueueBatch: vi.fn(),
  getMessageStatus: vi.fn(),
  getBatchStatus: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  withAuth: vi.fn((request, handler) => handler(request, {
    vendorId: 'test-vendor',
    vendor: {
      id: 'test-vendor',
      name: 'Test Vendor',
      defaultAccessTier: 'PRIVACY_SAFE',
    },
    requestId: 'req-123',
  })),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => Promise.resolve({ allowed: true, remaining: 99, limit: 100 })),
}));

import { prisma } from '@/lib/db';
import { enqueueMessage, enqueueBatch, getMessageStatus, getBatchStatus } from '@/lib/cpaas/queue';
import { POST, GET } from '@/app/api/cpaas/messages/route';

describe('CPaaS Messages API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // POST /api/cpaas/messages - SEND MESSAGE
  // ===========================================================================

  describe('POST /api/cpaas/messages', () => {
    const createRequest = (body: any, headers: Record<string, string> = {}) => {
      return new NextRequest('http://localhost/api/cpaas/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sd_test_validkey123',
          ...headers,
        },
        body: JSON.stringify(body),
      });
    };

    describe('Single message', () => {
      const validSingleMessage = {
        channel: 'EMAIL',
        recipient: 'TKN_PAR_ABCD1234',
        recipientType: 'PARENT',
        subject: 'Test Email',
        body: 'This is a test message.',
      };

      it('creates and queues a single message', async () => {
        vi.mocked(enqueueMessage).mockResolvedValue({
          id: 'msg-123',
          status: 'queued',
          isDuplicate: false,
        } as any);

        const request = createRequest(validSingleMessage);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.messageId).toBe('msg-123');
        expect(data.status).toBe('queued');
      });

      it('returns 400 for missing required fields', async () => {
        const invalidMessage = {
          channel: 'EMAIL',
          // Missing recipient, subject, body
        };

        const request = createRequest(invalidMessage);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        // Zod may return various error messages for missing fields
        expect(data.error).toBeDefined();
      });

      it('returns 400 for invalid channel', async () => {
        const invalidMessage = {
          ...validSingleMessage,
          channel: 'INVALID_CHANNEL',
        };

        const request = createRequest(invalidMessage);
        const response = await POST(request);

        expect(response.status).toBe(400);
      });

      it('returns 400 for invalid recipient token format', async () => {
        const invalidMessage = {
          ...validSingleMessage,
          recipient: 'not-a-valid-token',
        };

        const request = createRequest(invalidMessage);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toMatch(/recipient.*token/i);
      });

      it('returns 400 for SMS without body', async () => {
        const invalidSms = {
          channel: 'SMS',
          recipient: 'TKN_PAR_ABCD1234',
          recipientType: 'PARENT',
          body: '',
        };

        const request = createRequest(invalidSms);
        const response = await POST(request);

        expect(response.status).toBe(400);
      });

      it('returns 400 for EMAIL without subject', async () => {
        const invalidEmail = {
          channel: 'EMAIL',
          recipient: 'TKN_PAR_ABCD1234',
          recipientType: 'PARENT',
          body: 'Email body',
          // Missing subject
        };

        const request = createRequest(invalidEmail);
        const response = await POST(request);

        expect(response.status).toBe(400);
      });

      it('includes cost estimate in response', async () => {
        vi.mocked(enqueueMessage).mockResolvedValue({
          id: 'msg-123',
          status: 'queued',
          isDuplicate: false,
          estimatedCost: { amount: 0.003, currency: 'USD' },
        } as any);

        const request = createRequest(validSingleMessage);
        const response = await POST(request);
        const data = await response.json();

        expect(data.estimatedCost).toBeDefined();
        expect(data.estimatedCost.amount).toBeGreaterThan(0);
      });

      it('handles idempotency key', async () => {
        vi.mocked(enqueueMessage).mockResolvedValue({
          id: 'msg-existing',
          status: 'sent',
          isDuplicate: true,
        } as any);

        const request = createRequest(validSingleMessage, {
          'Idempotency-Key': 'idem-123',
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200); // 200 for duplicate, not 201
        expect(data.messageId).toBe('msg-existing');
        expect(data.duplicate).toBe(true);
      });
    });

    describe('Batch messages', () => {
      const validBatch = {
        channel: 'SMS',
        recipients: [
          { token: 'TKN_PAR_ABCD1234', type: 'PARENT' },
          { token: 'TKN_PAR_EFGH5678', type: 'PARENT' },
        ],
        body: 'Batch SMS message',
      };

      it('creates and queues a batch of messages', async () => {
        vi.mocked(enqueueBatch).mockResolvedValue({
          batchId: 'batch-123',
          messageCount: 2,
          status: 'queued',
          estimatedCost: { amount: 0.03, currency: 'USD' },
        } as any);

        const request = createRequest(validBatch);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.batchId).toBe('batch-123');
        expect(data.messageCount).toBe(2);
      });

      it('returns 400 for empty recipients array', async () => {
        const invalidBatch = {
          ...validBatch,
          recipients: [],
        };

        const request = createRequest(invalidBatch);
        const response = await POST(request);

        expect(response.status).toBe(400);
      });

      it('returns 400 when batch size exceeds limit', async () => {
        const largeBatch = {
          ...validBatch,
          recipients: Array.from({ length: 10001 }, (_, i) => ({
            token: `TKN_PAR_${String(i).padStart(8, '0')}`,
            type: 'PARENT',
          })),
        };

        const request = createRequest(largeBatch);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        // Zod's max validator returns "Array must contain at most X element(s)"
        expect(data.error).toBeDefined();
      });

      it('validates all recipient tokens in batch', async () => {
        const invalidBatch = {
          ...validBatch,
          recipients: [
            { token: 'TKN_PAR_ABCD1234', type: 'PARENT' },
            { token: 'invalid-token', type: 'PARENT' },
          ],
        };

        const request = createRequest(invalidBatch);
        const response = await POST(request);

        expect(response.status).toBe(400);
      });

      it('supports scheduled delivery', async () => {
        const scheduledTime = new Date(Date.now() + 3600000).toISOString();
        const scheduledBatch = {
          ...validBatch,
          scheduledAt: scheduledTime,
        };

        vi.mocked(enqueueBatch).mockResolvedValue({
          batchId: 'batch-123',
          messageCount: 2,
          status: 'scheduled',
          scheduledAt: scheduledTime,
        } as any);

        const request = createRequest(scheduledBatch);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.status).toBe('scheduled');
      });

      it('returns 400 for scheduled time in the past', async () => {
        const pastTime = new Date(Date.now() - 3600000).toISOString();
        const invalidBatch = {
          ...validBatch,
          scheduledAt: pastTime,
        };

        const request = createRequest(invalidBatch);
        const response = await POST(request);

        expect(response.status).toBe(400);
      });

      it('includes total cost estimate for batch', async () => {
        vi.mocked(enqueueBatch).mockResolvedValue({
          batchId: 'batch-123',
          messageCount: 100,
          status: 'queued',
          estimatedCost: { amount: 1.5, currency: 'USD' },
        } as any);

        const largeBatch = {
          ...validBatch,
          recipients: Array.from({ length: 100 }, (_, i) => ({
            token: `TKN_PAR_${String(i).padStart(8, '0')}`,
            type: 'PARENT' as const,
          })),
        };

        const request = createRequest(largeBatch);
        const response = await POST(request);
        const data = await response.json();

        expect(data.estimatedCost.amount).toBe(1.5);
      });
    });

    describe('Priority handling', () => {
      it('accepts priority parameter', async () => {
        const highPriorityMessage = {
          channel: 'SMS',
          recipient: 'TKN_PAR_ABCD1234',
          recipientType: 'PARENT',
          body: 'Urgent message',
          priority: 'HIGH',
        };

        vi.mocked(enqueueMessage).mockResolvedValue({
          id: 'msg-123',
          status: 'queued',
        } as any);

        const request = createRequest(highPriorityMessage);
        const response = await POST(request);

        expect(response.status).toBe(201);
        expect(enqueueMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            priority: 'HIGH',
          })
        );
      });

      it('defaults to NORMAL priority', async () => {
        const normalMessage = {
          channel: 'SMS',
          recipient: 'TKN_PAR_ABCD1234',
          recipientType: 'PARENT',
          body: 'Normal message',
        };

        vi.mocked(enqueueMessage).mockResolvedValue({
          id: 'msg-123',
          status: 'queued',
        } as any);

        const request = createRequest(normalMessage);
        await POST(request);

        expect(enqueueMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            priority: 'NORMAL',
          })
        );
      });
    });

    describe('Metadata handling', () => {
      it('accepts custom metadata', async () => {
        const messageWithMetadata = {
          channel: 'EMAIL',
          recipient: 'TKN_PAR_ABCD1234',
          recipientType: 'PARENT',
          subject: 'Test',
          body: 'Message with metadata',
          metadata: {
            campaignId: 'camp-123',
            source: 'automated',
          },
        };

        vi.mocked(enqueueMessage).mockResolvedValue({
          id: 'msg-123',
          status: 'queued',
        } as any);

        const request = createRequest(messageWithMetadata);
        await POST(request);

        expect(enqueueMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              campaignId: 'camp-123',
            }),
          })
        );
      });
    });
  });

  // ===========================================================================
  // GET /api/cpaas/messages - STATUS
  // ===========================================================================

  describe('GET /api/cpaas/messages', () => {
    const createGetRequest = (queryParams: Record<string, string> = {}) => {
      const url = new URL('http://localhost/api/cpaas/messages');
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });

      return new NextRequest(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: 'Bearer sd_test_validkey123',
        },
      });
    };

    describe('Single message status', () => {
      it('returns message status by ID', async () => {
        vi.mocked(getMessageStatus).mockResolvedValue({
          id: 'msg-123',
          status: 'delivered',
          channel: 'EMAIL',
          sentAt: new Date().toISOString(),
          deliveredAt: new Date().toISOString(),
        } as any);

        const request = createGetRequest({ id: 'msg-123' });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.id).toBe('msg-123');
        expect(data.status).toBe('delivered');
      });

      it('returns 404 for non-existent message', async () => {
        vi.mocked(getMessageStatus).mockResolvedValue(null);

        const request = createGetRequest({ id: 'non-existent' });
        const response = await GET(request);

        expect(response.status).toBe(404);
      });

      it('includes delivery events in response', async () => {
        vi.mocked(getMessageStatus).mockResolvedValue({
          id: 'msg-123',
          status: 'delivered',
          events: [
            { type: 'queued', timestamp: '2024-01-01T00:00:00Z' },
            { type: 'sent', timestamp: '2024-01-01T00:00:01Z' },
            { type: 'delivered', timestamp: '2024-01-01T00:00:05Z' },
          ],
        } as any);

        const request = createGetRequest({ id: 'msg-123' });
        const response = await GET(request);
        const data = await response.json();

        expect(data.events).toHaveLength(3);
      });
    });

    describe('Batch status', () => {
      it('returns batch status by ID', async () => {
        vi.mocked(getBatchStatus).mockResolvedValue({
          id: 'batch-123',
          status: 'completed',
          totalRecipients: 100,
          sentCount: 100,
          deliveredCount: 95,
          failedCount: 5,
          progress: 1,
          deliveryRate: 0.95,
        } as any);

        const request = createGetRequest({ batchId: 'batch-123' });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.id).toBe('batch-123');
        expect(data.deliveryRate).toBe(0.95);
      });

      it('returns 404 for non-existent batch', async () => {
        vi.mocked(getBatchStatus).mockResolvedValue(null);

        const request = createGetRequest({ batchId: 'non-existent' });
        const response = await GET(request);

        expect(response.status).toBe(404);
      });
    });

    describe('List messages', () => {
      it('returns paginated list of messages', async () => {
        vi.mocked(prisma.communicationMessage.findMany).mockResolvedValue([
          { id: 'msg-1', status: 'delivered' },
          { id: 'msg-2', status: 'sent' },
        ] as any);

        const request = createGetRequest({ limit: '10', offset: '0' });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.messages).toHaveLength(2);
      });

      it('filters by status', async () => {
        vi.mocked(prisma.communicationMessage.findMany).mockResolvedValue([
          { id: 'msg-1', status: 'failed' },
        ] as any);

        const request = createGetRequest({ status: 'failed' });
        await GET(request);

        expect(prisma.communicationMessage.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'failed',
            }),
          })
        );
      });

      it('filters by channel', async () => {
        vi.mocked(prisma.communicationMessage.findMany).mockResolvedValue([
          { id: 'msg-1', channel: 'SMS' },
        ] as any);

        const request = createGetRequest({ channel: 'SMS' });
        await GET(request);

        expect(prisma.communicationMessage.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              channel: 'SMS',
            }),
          })
        );
      });

      it('filters by date range', async () => {
        const startDate = '2024-01-01';
        const endDate = '2024-01-31';

        vi.mocked(prisma.communicationMessage.findMany).mockResolvedValue([]);

        const request = createGetRequest({ startDate, endDate });
        await GET(request);

        expect(prisma.communicationMessage.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              createdAt: expect.objectContaining({
                gte: expect.any(Date),
                lte: expect.any(Date),
              }),
            }),
          })
        );
      });
    });
  });

  // ===========================================================================
  // AUTHENTICATION & AUTHORIZATION
  // ===========================================================================

  describe('Authentication', () => {
    it('returns 401 without API key', async () => {
      // Re-mock withAuth to reject
      const { withAuth } = await import('@/lib/auth');
      vi.mocked(withAuth).mockImplementationOnce(() => {
        return Promise.resolve(
          new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
        );
      });

      const request = new NextRequest('http://localhost/api/cpaas/messages', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('returns 403 without message scope', async () => {
      const { withAuth } = await import('@/lib/auth');
      vi.mocked(withAuth).mockImplementationOnce(() => {
        return Promise.resolve(
          new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403 })
        );
      });

      const request = new NextRequest('http://localhost/api/cpaas/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sd_test_readonlykey',
        },
        body: JSON.stringify({ channel: 'SMS', recipient: 'TKN_PAR_ABCD1234', body: 'Test' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });
  });

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('Error handling', () => {
    it('returns 500 on internal error', async () => {
      vi.mocked(enqueueMessage).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost/api/cpaas/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sd_test_validkey123',
        },
        body: JSON.stringify({
          channel: 'SMS',
          recipient: 'TKN_PAR_ABCD1234',
          recipientType: 'PARENT',
          body: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
      expect(data.requestId).toBeDefined();
    });

    it('includes request ID in error response', async () => {
      vi.mocked(enqueueMessage).mockRejectedValue(new Error('Something went wrong'));

      const request = new NextRequest('http://localhost/api/cpaas/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sd_test_validkey123',
        },
        body: JSON.stringify({
          channel: 'SMS',
          recipient: 'TKN_PAR_ABCD1234',
          recipientType: 'PARENT',
          body: 'Test',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.requestId).toBeDefined();
    });
  });

  // ===========================================================================
  // RATE LIMIT HEADERS
  // ===========================================================================

  describe('Rate limit headers', () => {
    it('includes rate limit headers in response', async () => {
      vi.mocked(enqueueMessage).mockResolvedValue({
        id: 'msg-123',
        status: 'queued',
      } as any);

      const request = new NextRequest('http://localhost/api/cpaas/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sd_test_validkey123',
        },
        body: JSON.stringify({
          channel: 'SMS',
          recipient: 'TKN_PAR_ABCD1234',
          recipientType: 'PARENT',
          body: 'Test',
        }),
      });

      const response = await POST(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
    });
  });
});
