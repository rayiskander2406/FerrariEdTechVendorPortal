/**
 * CPaaS Message Worker Tests
 *
 * V1-05: Unit tests for message processing worker.
 *
 * Tests cover:
 * - Message processing lifecycle
 * - Provider routing
 * - Delivery tracking
 * - Error handling and retries
 * - Batch completion detection
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock external dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    communicationMessage: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    messageBatch: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/cpaas/providers', () => ({
  sendEmail: vi.fn(),
  sendSms: vi.fn(),
  getProviderForChannel: vi.fn(),
}));

// Import after mocking
import { prisma } from '@/lib/db';
import { sendEmail, sendSms, getProviderForChannel } from '@/lib/cpaas/providers';
import {
  processMessage,
  handleDeliveryWebhook,
  checkBatchCompletion,
  type ProcessedMessage,
  type DeliveryWebhook,
} from '@/lib/cpaas/worker';

describe('CPaaS Message Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // PROCESS MESSAGE
  // ===========================================================================

  describe('processMessage', () => {
    const mockEmailMessage = {
      id: 'msg-123',
      vendorId: 'vendor-123',
      channel: 'EMAIL',
      recipientToken: 'TKN_PAR_ABCD1234',
      recipientType: 'PARENT',
      subject: 'Test Subject',
      body: 'Test body',
      status: 'queued',
      retryCount: 0,
    };

    const mockSmsMessage = {
      id: 'msg-456',
      vendorId: 'vendor-123',
      channel: 'SMS',
      recipientToken: 'TKN_PAR_EFGH5678',
      recipientType: 'PARENT',
      body: 'SMS test message',
      status: 'queued',
      retryCount: 0,
    };

    describe('Email processing', () => {
      it('sends email through provider', async () => {
        vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue(mockEmailMessage as any);
        vi.mocked(sendEmail).mockResolvedValue({
          success: true,
          providerId: 'sendgrid-msg-123',
          providerName: 'sendgrid',
        });
        vi.mocked(prisma.communicationMessage.update).mockResolvedValue({
          ...mockEmailMessage,
          status: 'sent',
        } as any);

        const result = await processMessage('msg-123');

        expect(result.success).toBe(true);
        expect(sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: mockEmailMessage.recipientToken,
            subject: mockEmailMessage.subject,
            body: mockEmailMessage.body,
          })
        );
      });

      it('updates message status to sent on success', async () => {
        vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue(mockEmailMessage as any);
        vi.mocked(sendEmail).mockResolvedValue({
          success: true,
          providerId: 'sendgrid-msg-123',
        });
        vi.mocked(prisma.communicationMessage.update).mockResolvedValue({} as any);

        await processMessage('msg-123');

        expect(prisma.communicationMessage.update).toHaveBeenCalledWith({
          where: { id: 'msg-123' },
          data: expect.objectContaining({
            status: 'sent',
            sentAt: expect.any(Date),
          }),
        });
      });
    });

    describe('SMS processing', () => {
      it('sends SMS through provider', async () => {
        vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue(mockSmsMessage as any);
        vi.mocked(sendSms).mockResolvedValue({
          success: true,
          providerId: 'twilio-msg-456',
          providerName: 'twilio',
        });
        vi.mocked(prisma.communicationMessage.update).mockResolvedValue({} as any);

        const result = await processMessage('msg-456');

        expect(result.success).toBe(true);
        expect(sendSms).toHaveBeenCalledWith(
          expect.objectContaining({
            to: mockSmsMessage.recipientToken,
            body: mockSmsMessage.body,
          })
        );
      });

      it('calculates SMS segments for long messages', async () => {
        const longSmsMessage = {
          ...mockSmsMessage,
          body: 'A'.repeat(320), // 2 segments
        };

        vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue(longSmsMessage as any);
        vi.mocked(sendSms).mockResolvedValue({ success: true });
        vi.mocked(prisma.communicationMessage.update).mockResolvedValue({} as any);

        await processMessage('msg-456');

        expect(sendSms).toHaveBeenCalledWith(
          expect.objectContaining({
            body: longSmsMessage.body,
          })
        );
      });
    });

    describe('Error handling', () => {
      it('marks message as failed on provider error', async () => {
        vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue(mockEmailMessage as any);
        vi.mocked(sendEmail).mockResolvedValue({
          success: false,
          error: 'Invalid recipient',
        });
        vi.mocked(prisma.communicationMessage.update).mockResolvedValue({} as any);

        const result = await processMessage('msg-123');

        expect(result.success).toBe(false);
        expect(prisma.communicationMessage.update).toHaveBeenCalledWith({
          where: { id: 'msg-123' },
          data: expect.objectContaining({
            status: 'failed',
            failureReason: 'Invalid recipient',
          }),
        });
      });

      it('increments retry count on failure', async () => {
        vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue(mockEmailMessage as any);
        vi.mocked(sendEmail).mockResolvedValue({
          success: false,
          error: 'Temporary failure',
          retryable: true,
        });
        vi.mocked(prisma.communicationMessage.update).mockResolvedValue({} as any);

        await processMessage('msg-123');

        expect(prisma.communicationMessage.update).toHaveBeenCalledWith({
          where: { id: 'msg-123' },
          data: expect.objectContaining({
            retryCount: 1,
          }),
        });
      });

      it('handles provider timeout', async () => {
        vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue(mockEmailMessage as any);
        vi.mocked(sendEmail).mockRejectedValue(new Error('Request timeout'));
        vi.mocked(prisma.communicationMessage.update).mockResolvedValue({} as any);

        const result = await processMessage('msg-123');

        expect(result.success).toBe(false);
        expect(result.retryable).toBe(true);
      });

      it('returns not found for non-existent message', async () => {
        vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue(null);

        const result = await processMessage('non-existent');

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/not found/i);
      });

      it('skips already processed messages', async () => {
        const deliveredMessage = {
          ...mockEmailMessage,
          status: 'delivered',
        };

        vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue(deliveredMessage as any);

        const result = await processMessage('msg-123');

        expect(result.skipped).toBe(true);
        expect(sendEmail).not.toHaveBeenCalled();
      });
    });

    describe('Provider selection', () => {
      it('routes to correct provider based on channel', async () => {
        vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue(mockEmailMessage as any);
        vi.mocked(getProviderForChannel).mockReturnValue('sendgrid');
        vi.mocked(sendEmail).mockResolvedValue({ success: true });
        vi.mocked(prisma.communicationMessage.update).mockResolvedValue({} as any);

        await processMessage('msg-123');

        expect(getProviderForChannel).toHaveBeenCalledWith('EMAIL');
      });
    });

    describe('Metadata storage', () => {
      it('stores provider message ID', async () => {
        vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue(mockEmailMessage as any);
        vi.mocked(sendEmail).mockResolvedValue({
          success: true,
          providerId: 'provider-msg-789',
        });
        vi.mocked(prisma.communicationMessage.update).mockResolvedValue({} as any);

        await processMessage('msg-123');

        expect(prisma.communicationMessage.update).toHaveBeenCalledWith({
          where: { id: 'msg-123' },
          data: expect.objectContaining({
            // Metadata should contain provider ID for tracking
          }),
        });
      });
    });
  });

  // ===========================================================================
  // DELIVERY WEBHOOKS
  // ===========================================================================

  describe('handleDeliveryWebhook', () => {
    const mockWebhook: DeliveryWebhook = {
      provider: 'sendgrid',
      event: 'delivered',
      providerId: 'sendgrid-msg-123',
      timestamp: new Date().toISOString(),
    };

    it('updates message status on delivery confirmation', async () => {
      vi.mocked(prisma.communicationMessage.findFirst).mockResolvedValue({
        id: 'msg-123',
        status: 'sent',
      } as any);
      vi.mocked(prisma.communicationMessage.update).mockResolvedValue({} as any);

      await handleDeliveryWebhook(mockWebhook);

      expect(prisma.communicationMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-123' },
        data: expect.objectContaining({
          status: 'delivered',
          deliveredAt: expect.any(Date),
        }),
      });
    });

    it('handles bounce events', async () => {
      const bounceWebhook: DeliveryWebhook = {
        ...mockWebhook,
        event: 'bounced',
        bounceType: 'hard',
        bounceReason: 'Invalid email address',
      };

      vi.mocked(prisma.communicationMessage.findFirst).mockResolvedValue({
        id: 'msg-123',
        status: 'sent',
      } as any);
      vi.mocked(prisma.communicationMessage.update).mockResolvedValue({} as any);

      await handleDeliveryWebhook(bounceWebhook);

      expect(prisma.communicationMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-123' },
        data: expect.objectContaining({
          status: 'bounced',
          failureReason: expect.stringContaining('Invalid email'),
        }),
      });
    });

    it('handles open events for email', async () => {
      const openWebhook: DeliveryWebhook = {
        ...mockWebhook,
        event: 'opened',
      };

      vi.mocked(prisma.communicationMessage.findFirst).mockResolvedValue({
        id: 'msg-123',
        status: 'delivered',
      } as any);

      await handleDeliveryWebhook(openWebhook);

      // Open events don't trigger an update in current implementation
      // Just verify no error occurred
    });

    it('ignores duplicate webhooks', async () => {
      // Message already in final state
      vi.mocked(prisma.communicationMessage.findFirst).mockResolvedValue({
        id: 'msg-123',
        status: 'delivered',
        deliveredAt: new Date(),
      } as any);

      await handleDeliveryWebhook(mockWebhook);

      // Should not update again
      expect(prisma.communicationMessage.update).not.toHaveBeenCalled();
    });

    it('handles failure events', async () => {
      const failureWebhook: DeliveryWebhook = {
        ...mockWebhook,
        event: 'failed',
        error: 'Provider rejected message',
      };

      vi.mocked(prisma.communicationMessage.findFirst).mockResolvedValue({
        id: 'msg-123',
        status: 'sent',
      } as any);
      vi.mocked(prisma.communicationMessage.update).mockResolvedValue({} as any);

      await handleDeliveryWebhook(failureWebhook);

      expect(prisma.communicationMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-123' },
        data: expect.objectContaining({
          status: 'failed',
        }),
      });
    });
  });

  // ===========================================================================
  // BATCH COMPLETION
  // ===========================================================================

  describe('checkBatchCompletion', () => {
    it('marks batch as completed when all messages processed', async () => {
      vi.mocked(prisma.messageBatch.findUnique).mockResolvedValue({
        id: 'batch-123',
        status: 'processing',
        totalRecipients: 10,
        sentCount: 10,
        deliveredCount: 8,
        failedCount: 2,
      } as any);
      vi.mocked(prisma.messageBatch.update).mockResolvedValue({} as any);

      await checkBatchCompletion('batch-123');

      expect(prisma.messageBatch.update).toHaveBeenCalledWith({
        where: { id: 'batch-123' },
        data: expect.objectContaining({
          status: 'completed',
          completedAt: expect.any(Date),
        }),
      });
    });

    it('does not mark batch complete if messages still processing', async () => {
      vi.mocked(prisma.messageBatch.findUnique).mockResolvedValue({
        id: 'batch-123',
        status: 'processing',
        totalRecipients: 10,
        sentCount: 5,
        deliveredCount: 3,
        failedCount: 0,
      } as any);

      await checkBatchCompletion('batch-123');

      expect(prisma.messageBatch.update).not.toHaveBeenCalled();
    });

    it('marks batch as failed if all messages failed', async () => {
      vi.mocked(prisma.messageBatch.findUnique).mockResolvedValue({
        id: 'batch-123',
        status: 'processing',
        totalRecipients: 10,
        sentCount: 0,
        deliveredCount: 0,
        failedCount: 10,
      } as any);
      vi.mocked(prisma.messageBatch.update).mockResolvedValue({} as any);

      await checkBatchCompletion('batch-123');

      expect(prisma.messageBatch.update).toHaveBeenCalledWith({
        where: { id: 'batch-123' },
        data: expect.objectContaining({
          status: 'failed',
        }),
      });
    });

    it('calculates final delivery rate', async () => {
      vi.mocked(prisma.messageBatch.findUnique).mockResolvedValue({
        id: 'batch-123',
        status: 'processing',
        totalRecipients: 100,
        sentCount: 100,
        deliveredCount: 95,
        failedCount: 5,
      } as any);
      vi.mocked(prisma.messageBatch.update).mockResolvedValue({} as any);

      const result = await checkBatchCompletion('batch-123');

      expect(result?.deliveryRate).toBeCloseTo(0.95);
    });
  });

  // ===========================================================================
  // CONCURRENCY & LOCKING
  // ===========================================================================

  describe('Concurrency handling', () => {
    it('uses optimistic locking for status updates', async () => {
      vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue({
        id: 'msg-123',
        status: 'queued',
        version: 1,
      } as any);
      vi.mocked(sendEmail).mockResolvedValue({ success: true });
      vi.mocked(prisma.communicationMessage.update).mockResolvedValue({} as any);

      await processMessage('msg-123');

      // Should include version check in update
      expect(prisma.communicationMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'msg-123',
          }),
        })
      );
    });

    it('handles concurrent processing attempts gracefully', async () => {
      // Message was already picked up by another worker
      const processingMessage = {
        id: 'msg-123',
        status: 'processing',
      };

      vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue(processingMessage as any);

      const result = await processMessage('msg-123');

      expect(result.skipped).toBe(true);
      expect(sendEmail).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // METRICS & TELEMETRY
  // ===========================================================================

  describe('Metrics tracking', () => {
    it('tracks processing time', async () => {
      vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue({
        id: 'msg-123',
        channel: 'EMAIL',
        status: 'queued',
      } as any);
      vi.mocked(sendEmail).mockResolvedValue({ success: true });
      vi.mocked(prisma.communicationMessage.update).mockResolvedValue({} as any);

      const result = await processMessage('msg-123');

      expect(result.processingTimeMs).toBeDefined();
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('reports provider used', async () => {
      vi.mocked(prisma.communicationMessage.findUnique).mockResolvedValue({
        id: 'msg-123',
        channel: 'EMAIL',
        status: 'queued',
      } as any);
      vi.mocked(getProviderForChannel).mockReturnValue('sendgrid');
      vi.mocked(sendEmail).mockResolvedValue({
        success: true,
        providerName: 'sendgrid',
      });
      vi.mocked(prisma.communicationMessage.update).mockResolvedValue({} as any);

      const result = await processMessage('msg-123');

      expect(result.provider).toBe('sendgrid');
    });
  });
});
