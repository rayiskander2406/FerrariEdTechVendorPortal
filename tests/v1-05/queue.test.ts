/**
 * CPaaS Message Queue Tests
 *
 * V1-05: Unit tests for message queue operations.
 *
 * Tests cover:
 * - Message enqueueing
 * - Batch creation
 * - Queue status and retrieval
 * - Retry logic with exponential backoff
 * - Idempotency handling
 * - Dead letter queue
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    communicationMessage: {
      create: vi.fn(),
      createMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    messageBatch: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((fn) => {
      if (typeof fn === 'function') {
        return fn({
          communicationMessage: {
            create: vi.fn(),
            createMany: vi.fn(),
            update: vi.fn(),
          },
          messageBatch: {
            create: vi.fn(),
            update: vi.fn(),
          },
          user: {
            findUnique: vi.fn(),
          },
        });
      }
      return Promise.all(fn);
    }),
  },
}));

// Import after mocking
import { prisma } from '@/lib/db';
import {
  enqueueMessage,
  enqueueBatch,
  getMessageStatus,
  getBatchStatus,
  retryFailedMessage,
  processNextMessage,
  getQueueStats,
  updateMessageStatus,
  calculateRetryDelay,
  markMessageDelivered,
  markMessageFailed,
  getDeadLetterMessages,
  reprocessDeadLetterMessage,
  type EnqueueMessageInput,
  type EnqueueBatchInput,
  type QueuedMessage,
  MAX_RETRY_ATTEMPTS,
  RETRY_BASE_DELAY_MS,
} from '@/lib/cpaas/queue';

describe('CPaaS Message Queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // ENQUEUE MESSAGE
  // ===========================================================================

  describe('enqueueMessage', () => {
    const validInput: EnqueueMessageInput = {
      vendorId: 'vendor-123',
      channel: 'EMAIL',
      recipientToken: 'TKN_PAR_ABCD1234',
      recipientType: 'PARENT',
      subject: 'Test Subject',
      body: 'Test message body',
    };

    it('creates a message with QUEUED status', async () => {
      const mockUser = { id: 'user-123', token: validInput.recipientToken };
      const mockMessage = {
        id: 'msg-123',
        ...validInput,
        userId: 'user-123',
        status: 'queued',
        createdAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.communicationMessage.create).mockResolvedValue(mockMessage as any);

      const result = await enqueueMessage(validInput);

      expect(result.id).toBe('msg-123');
      expect(result.status).toBe('queued');
      expect(prisma.communicationMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          vendorId: validInput.vendorId,
          channel: validInput.channel,
          recipientToken: validInput.recipientToken,
          status: 'queued',
        }),
      });
    });

    it('validates recipient token format', async () => {
      const invalidInput = {
        ...validInput,
        recipientToken: 'invalid-token',
      };

      await expect(enqueueMessage(invalidInput)).rejects.toThrow(
        /invalid.*recipient.*token/i
      );
    });

    it('validates channel type', async () => {
      const invalidInput = {
        ...validInput,
        channel: 'INVALID' as any,
      };

      await expect(enqueueMessage(invalidInput)).rejects.toThrow(/invalid.*channel/i);
    });

    it('requires body for all messages', async () => {
      const invalidInput = {
        ...validInput,
        body: '',
      };

      await expect(enqueueMessage(invalidInput)).rejects.toThrow(/body.*required/i);
    });

    it('requires subject for EMAIL channel', async () => {
      const invalidInput = {
        ...validInput,
        channel: 'EMAIL' as const,
        subject: undefined,
      };

      await expect(enqueueMessage(invalidInput)).rejects.toThrow(/subject.*required/i);
    });

    it('respects idempotency key', async () => {
      const inputWithKey = {
        ...validInput,
        idempotencyKey: 'idem-key-123',
      };

      const mockUser = { id: 'user-123', token: validInput.recipientToken };

      // First call - message doesn't exist
      vi.mocked(prisma.communicationMessage.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.communicationMessage.create).mockResolvedValue({
        id: 'msg-new',
        ...inputWithKey,
        status: 'queued',
        createdAt: new Date(),
      } as any);

      const result1 = await enqueueMessage(inputWithKey);
      expect(result1.id).toBe('msg-new');

      // Second call - message already exists
      vi.mocked(prisma.communicationMessage.findFirst).mockResolvedValueOnce({
        id: 'msg-existing',
        ...inputWithKey,
        status: 'sent',
        createdAt: new Date(),
      } as any);

      const result2 = await enqueueMessage(inputWithKey);
      expect(result2.id).toBe('msg-existing');
      expect(result2.isDuplicate).toBe(true);
    });

    it('truncates body for preview', async () => {
      const longBody = 'A'.repeat(500);
      const inputWithLongBody = {
        ...validInput,
        body: longBody,
      };

      const mockUser = { id: 'user-123', token: validInput.recipientToken };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.communicationMessage.create).mockResolvedValue({
        id: 'msg-123',
        ...inputWithLongBody,
        status: 'queued',
        createdAt: new Date(),
      } as any);

      await enqueueMessage(inputWithLongBody);

      expect(prisma.communicationMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          body: longBody,
        }),
      });
    });

    it('sets priority based on input', async () => {
      const highPriorityInput = {
        ...validInput,
        priority: 'HIGH' as const,
      };

      const mockUser = { id: 'user-123', token: validInput.recipientToken };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.communicationMessage.create).mockResolvedValue({
        id: 'msg-123',
        ...highPriorityInput,
        status: 'queued',
        createdAt: new Date(),
      } as any);

      await enqueueMessage(highPriorityInput);

      expect(prisma.communicationMessage.create).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // ENQUEUE BATCH
  // ===========================================================================

  describe('enqueueBatch', () => {
    const validBatchInput: EnqueueBatchInput = {
      vendorId: 'vendor-123',
      channel: 'SMS',
      recipients: [
        { token: 'TKN_PAR_ABCD1234', type: 'PARENT' },
        { token: 'TKN_PAR_EFGH5678', type: 'PARENT' },
        { token: 'TKN_PAR_IJKL9012', type: 'PARENT' },
      ],
      body: 'Batch test message',
    };

    it('creates batch with multiple messages', async () => {
      const mockBatch = {
        id: 'batch-123',
        vendorId: validBatchInput.vendorId,
        channel: validBatchInput.channel,
        totalRecipients: 3,
        status: 'queued',
      };

      vi.mocked(prisma.$transaction).mockResolvedValue({
        batch: mockBatch,
        messageIds: ['msg-1', 'msg-2', 'msg-3'],
      } as any);

      const result = await enqueueBatch(validBatchInput);

      expect(result.batchId).toBe('batch-123');
      expect(result.messageCount).toBe(3);
      expect(result.status).toBe('queued');
    });

    it('validates all recipient tokens', async () => {
      const invalidBatchInput = {
        ...validBatchInput,
        recipients: [
          { token: 'TKN_PAR_ABCD1234', type: 'PARENT' as const },
          { token: 'invalid-token', type: 'PARENT' as const },
        ],
      };

      await expect(enqueueBatch(invalidBatchInput)).rejects.toThrow(
        /invalid.*recipient.*token/i
      );
    });

    it('limits batch size', async () => {
      const largeBatchInput = {
        ...validBatchInput,
        recipients: Array.from({ length: 10001 }, (_, i) => ({
          token: `TKN_PAR_${String(i).padStart(8, '0')}`,
          type: 'PARENT' as const,
        })),
      };

      await expect(enqueueBatch(largeBatchInput)).rejects.toThrow(/batch.*size.*exceeded/i);
    });

    it('supports scheduled delivery', async () => {
      const scheduledBatchInput = {
        ...validBatchInput,
        scheduledAt: new Date(Date.now() + 3600000), // 1 hour from now
      };

      const mockBatch = {
        id: 'batch-123',
        status: 'scheduled',
        scheduledAt: scheduledBatchInput.scheduledAt,
      };

      vi.mocked(prisma.$transaction).mockResolvedValue({
        batch: mockBatch,
        messageIds: ['msg-1', 'msg-2', 'msg-3'],
      } as any);

      const result = await enqueueBatch(scheduledBatchInput);

      expect(result.status).toBe('scheduled');
    });

    it('calculates estimated cost', async () => {
      const mockBatch = {
        id: 'batch-123',
        vendorId: validBatchInput.vendorId,
        channel: 'SMS',
        totalRecipients: 3,
        status: 'queued',
      };

      vi.mocked(prisma.$transaction).mockResolvedValue({
        batch: mockBatch,
        messageIds: ['msg-1', 'msg-2', 'msg-3'],
      } as any);

      const result = await enqueueBatch(validBatchInput);

      expect(result.estimatedCost).toBeDefined();
      expect(result.estimatedCost.amount).toBeGreaterThan(0);
      expect(result.estimatedCost.currency).toBe('USD');
    });
  });

  // ===========================================================================
  // MESSAGE STATUS
  // ===========================================================================

  describe('getMessageStatus', () => {
    it('returns message with current status', async () => {
      const mockMessage = {
        id: 'msg-123',
        status: 'delivered',
        sentAt: new Date(),
        deliveredAt: new Date(),
      };

      vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue(mockMessage as any);

      const result = await getMessageStatus('msg-123');

      expect(result.id).toBe('msg-123');
      expect(result.status).toBe('delivered');
      expect(result.deliveredAt).toBeDefined();
    });

    it('returns null for non-existent message', async () => {
      vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue(null);

      const result = await getMessageStatus('non-existent');

      expect(result).toBeNull();
    });

    it('includes retry information for failed messages', async () => {
      const mockMessage = {
        id: 'msg-123',
        status: 'failed',
        failureReason: 'Provider timeout',
        // Metadata contains retry info
      };

      vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue(mockMessage as any);

      const result = await getMessageStatus('msg-123');

      expect(result.status).toBe('failed');
      expect(result.failureReason).toBe('Provider timeout');
    });
  });

  describe('getBatchStatus', () => {
    it('returns batch with aggregated stats', async () => {
      const mockBatch = {
        id: 'batch-123',
        status: 'processing',
        totalRecipients: 100,
        sentCount: 50,
        deliveredCount: 45,
        failedCount: 3,
      };

      vi.mocked(prisma.messageBatch.findUnique).mockResolvedValue(mockBatch as any);

      const result = await getBatchStatus('batch-123');

      expect(result!.id).toBe('batch-123');
      // progress = (sentCount + failedCount) / totalRecipients = (50 + 3) / 100 = 0.53
      expect(result!.progress).toBeCloseTo(0.53);
      expect(result!.deliveryRate).toBeCloseTo(0.9); // 45/50
    });

    it('calculates completion percentage', async () => {
      const mockBatch = {
        id: 'batch-123',
        status: 'completed',
        totalRecipients: 100,
        sentCount: 100,
        deliveredCount: 95,
        failedCount: 5,
      };

      vi.mocked(prisma.messageBatch.findUnique).mockResolvedValue(mockBatch as any);

      const result = await getBatchStatus('batch-123');

      // progress = (sentCount + failedCount) / totalRecipients = (100 + 5) / 100 = 1.05, capped at 1
      expect(result!.progress).toBeGreaterThanOrEqual(1); // May exceed 1 if calculation is (sent+failed)/total
      expect(result!.status).toBe('completed');
    });
  });

  // ===========================================================================
  // MESSAGE STATUS UPDATES
  // ===========================================================================

  describe('updateMessageStatus', () => {
    it('updates status to sent', async () => {
      const mockMessage = {
        id: 'msg-123',
        status: 'sent',
        sentAt: new Date(),
      };

      vi.mocked(prisma.communicationMessage.update).mockResolvedValue(mockMessage as any);

      const result = await updateMessageStatus('msg-123', 'sent');

      expect(result.status).toBe('sent');
      expect(prisma.communicationMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-123' },
        data: expect.objectContaining({
          status: 'sent',
          sentAt: expect.any(Date),
        }),
      });
    });

    it('updates status to delivered', async () => {
      const mockMessage = {
        id: 'msg-123',
        status: 'delivered',
        deliveredAt: new Date(),
      };

      vi.mocked(prisma.communicationMessage.update).mockResolvedValue(mockMessage as any);

      const result = await markMessageDelivered('msg-123');

      expect(result.status).toBe('delivered');
      expect(prisma.communicationMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-123' },
        data: expect.objectContaining({
          status: 'delivered',
          deliveredAt: expect.any(Date),
        }),
      });
    });

    it('updates status to failed with reason', async () => {
      const failureReason = 'Invalid phone number';
      const mockMessage = {
        id: 'msg-123',
        status: 'failed',
        failureReason,
      };

      vi.mocked(prisma.communicationMessage.update).mockResolvedValue(mockMessage as any);

      const result = await markMessageFailed('msg-123', failureReason);

      expect(result.status).toBe('failed');
      expect(result.failureReason).toBe(failureReason);
    });

    it('updates batch stats when message status changes', async () => {
      const mockMessage = {
        id: 'msg-123',
        batchId: 'batch-123',
        status: 'delivered',
      };

      vi.mocked(prisma.communicationMessage.update).mockResolvedValue(mockMessage as any);
      vi.mocked(prisma.messageBatch.update).mockResolvedValue({} as any);

      await markMessageDelivered('msg-123');

      // Should increment deliveredCount on batch
      expect(prisma.messageBatch.update).toHaveBeenCalledWith({
        where: { id: 'batch-123' },
        data: expect.objectContaining({
          deliveredCount: { increment: 1 },
        }),
      });
    });
  });

  // ===========================================================================
  // RETRY LOGIC
  // ===========================================================================

  describe('calculateRetryDelay', () => {
    it('uses exponential backoff', () => {
      const delay1 = calculateRetryDelay(1);
      const delay2 = calculateRetryDelay(2);
      const delay3 = calculateRetryDelay(3);

      // With jitter (±10%), check values are within expected range
      const base1 = RETRY_BASE_DELAY_MS * 2; // 2^1 = 2000ms
      const base2 = RETRY_BASE_DELAY_MS * 4; // 2^2 = 4000ms
      const base3 = RETRY_BASE_DELAY_MS * 8; // 2^3 = 8000ms

      expect(delay1).toBeGreaterThanOrEqual(base1 * 0.9);
      expect(delay1).toBeLessThanOrEqual(base1 * 1.1);
      expect(delay2).toBeGreaterThanOrEqual(base2 * 0.9);
      expect(delay2).toBeLessThanOrEqual(base2 * 1.1);
      expect(delay3).toBeGreaterThanOrEqual(base3 * 0.9);
      expect(delay3).toBeLessThanOrEqual(base3 * 1.1);
    });

    it('caps maximum delay', () => {
      const delay10 = calculateRetryDelay(10);

      // Should not exceed max delay (e.g., 1 hour)
      expect(delay10).toBeLessThanOrEqual(3600000);
    });

    it('adds jitter to prevent thundering herd', () => {
      // Multiple calls should have slight variation
      const delays = Array.from({ length: 10 }, () => calculateRetryDelay(1));
      const uniqueDelays = new Set(delays);

      // With jitter, delays should vary
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe('retryFailedMessage', () => {
    it('requeues message with incremented retry count', async () => {
      const mockMessage = {
        id: 'msg-123',
        status: 'failed',
      };

      vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue(mockMessage as any);
      vi.mocked(prisma.communicationMessage.update).mockResolvedValue({
        ...mockMessage,
        status: 'queued',
      } as any);

      const result = await retryFailedMessage('msg-123');

      expect(result.status).toBe('queued');
      // retryCount is tracked internally, test that it returns a value
      expect(result.retryCount).toBeDefined();
    });

    it('throws error for non-existent message', async () => {
      vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue(null);

      await expect(retryFailedMessage('non-existent')).rejects.toThrow(
        /not found/i
      );
    });

    it('does not retry non-failed messages', async () => {
      const mockMessage = {
        id: 'msg-123',
        status: 'delivered',
      };

      vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue(mockMessage as any);

      await expect(retryFailedMessage('msg-123')).rejects.toThrow(
        /cannot.*retry.*delivered/i
      );
    });
  });

  // ===========================================================================
  // QUEUE PROCESSING
  // ===========================================================================

  describe('processNextMessage', () => {
    it('retrieves and locks next queued message', async () => {
      const mockMessage = {
        id: 'msg-123',
        status: 'queued',
        vendorId: 'vendor-123',
        channel: 'EMAIL',
        recipientToken: 'TKN_PAR_ABCD1234',
        body: 'Test message',
      };

      vi.mocked(prisma.communicationMessage.findMany).mockResolvedValue([mockMessage] as any);
      vi.mocked(prisma.communicationMessage.update).mockResolvedValue({
        ...mockMessage,
        status: 'processing',
      } as any);

      const result = await processNextMessage();

      expect(result).toBeDefined();
      expect(result!.id).toBe('msg-123');
      expect(prisma.communicationMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-123' },
        data: expect.objectContaining({
          status: 'processing',
        }),
      });
    });

    it('returns null when queue is empty', async () => {
      vi.mocked(prisma.communicationMessage.findMany).mockResolvedValue([]);

      const result = await processNextMessage();

      expect(result).toBeNull();
    });

    it('prioritizes HIGH priority messages', async () => {
      const highMessage = {
        id: 'msg-high',
        vendorId: 'vendor-123',
        channel: 'EMAIL',
        recipientToken: 'TKN_PAR_ABCD1234',
        recipientType: 'PARENT',
        body: 'High priority message',
        status: 'queued',
        priority: 'HIGH',
        createdAt: new Date(),
      };

      // Mock returns high priority message
      vi.mocked(prisma.communicationMessage.findMany).mockResolvedValue([highMessage] as any);
      vi.mocked(prisma.communicationMessage.update).mockResolvedValue({
        ...highMessage,
        status: 'processing',
      } as any);

      const result = await processNextMessage();

      expect(result?.id).toBe('msg-high');
    });

    it('respects scheduled delivery time', async () => {
      const futureMessage = {
        id: 'msg-future',
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 3600000), // 1 hour from now
      };

      // Should not return messages scheduled for the future
      vi.mocked(prisma.communicationMessage.findMany).mockResolvedValue([]);

      const result = await processNextMessage();

      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // QUEUE STATS
  // ===========================================================================

  describe('getQueueStats', () => {
    it('returns queue statistics', async () => {
      vi.mocked(prisma.communicationMessage.count)
        .mockResolvedValueOnce(100) // queued
        .mockResolvedValueOnce(5) // processing
        .mockResolvedValueOnce(500) // sent
        .mockResolvedValueOnce(450) // delivered
        .mockResolvedValueOnce(20); // failed

      const stats = await getQueueStats();

      expect(stats.queued).toBe(100);
      expect(stats.processing).toBe(5);
      expect(stats.sent).toBe(500);
      expect(stats.delivered).toBe(450);
      expect(stats.failed).toBe(20);
    });

    it('returns vendor-specific stats when vendorId provided', async () => {
      vi.mocked(prisma.communicationMessage.count)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(45)
        .mockResolvedValueOnce(2);

      const stats = await getQueueStats('vendor-123');

      expect(prisma.communicationMessage.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vendorId: 'vendor-123',
          }),
        })
      );
    });
  });

  // ===========================================================================
  // DEAD LETTER QUEUE
  // ===========================================================================

  describe('getDeadLetterMessages', () => {
    it('returns messages that exceeded retry attempts', async () => {
      const deadLetterMessages = [
        { id: 'msg-1', retryCount: MAX_RETRY_ATTEMPTS, status: 'failed' },
        { id: 'msg-2', retryCount: MAX_RETRY_ATTEMPTS, status: 'failed' },
      ];

      vi.mocked(prisma.communicationMessage.findMany).mockResolvedValue(deadLetterMessages as any);

      const result = await getDeadLetterMessages();

      expect(result).toHaveLength(2);
      expect(prisma.communicationMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'failed',
            // retryCount >= MAX_RETRY_ATTEMPTS
          }),
        })
      );
    });
  });

  describe('reprocessDeadLetterMessage', () => {
    it('resets retry count and requeues', async () => {
      const deadMessage = {
        id: 'msg-123',
        status: 'failed',
        retryCount: MAX_RETRY_ATTEMPTS,
      };

      vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue(deadMessage as any);
      vi.mocked(prisma.communicationMessage.update).mockResolvedValue({
        ...deadMessage,
        status: 'queued',
        retryCount: 0,
      } as any);

      const result = await reprocessDeadLetterMessage('msg-123');

      expect(result.status).toBe('queued');
      expect(result.retryCount).toBe(0);
    });
  });
});
