/**
 * CPaaS Message Worker
 *
 * V1-05: Message processing worker for CPaaS messaging.
 *
 * ## Features
 *
 * - Message processing lifecycle
 * - Provider routing
 * - Delivery tracking
 * - Error handling with retries
 * - Batch completion detection
 *
 * @module lib/cpaas/worker
 */

import { prisma } from '@/lib/db';
import { sendEmail, sendSms, getProviderForChannel } from './providers';
import { MAX_RETRY_ATTEMPTS } from './queue';

// =============================================================================
// TYPES
// =============================================================================

export interface ProcessedMessage {
  success: boolean;
  messageId: string;
  status: string;
  provider?: string;
  providerId?: string;
  error?: string;
  retryable?: boolean;
  skipped?: boolean;
  processingTimeMs?: number;
}

export interface DeliveryWebhook {
  provider: string;
  event: 'delivered' | 'bounced' | 'failed' | 'opened' | 'clicked';
  providerId: string;
  timestamp: string;
  bounceType?: 'hard' | 'soft';
  bounceReason?: string;
  error?: string;
}

export interface BatchCompletionResult {
  batchId: string;
  status: string;
  totalRecipients: number;
  deliveredCount: number;
  failedCount: number;
  deliveryRate: number;
  completedAt?: Date;
}

// =============================================================================
// PROCESS MESSAGE
// =============================================================================

/**
 * Process a single message from the queue
 *
 * @param messageId - Message ID to process
 * @returns Processing result
 */
export async function processMessage(messageId: string): Promise<ProcessedMessage> {
  const startTime = Date.now();

  // Get message
  const message = await prisma.communicationMessage.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    return {
      success: false,
      messageId,
      status: 'not_found',
      error: 'Message not found',
    };
  }

  // Skip already processed messages
  if (['delivered', 'sent', 'processing'].includes(message.status)) {
    return {
      success: true,
      messageId,
      status: message.status,
      skipped: true,
      processingTimeMs: Date.now() - startTime,
    };
  }

  // Get provider for channel
  const provider = getProviderForChannel(message.channel);

  try {
    // Route to appropriate provider
    let result;
    switch (message.channel) {
      case 'EMAIL':
        result = await sendEmail({
          to: message.recipientToken,
          subject: message.subject || '',
          body: message.body,
        });
        break;

      case 'SMS':
        result = await sendSms({
          to: message.recipientToken,
          body: message.body,
        });
        break;

      default:
        throw new Error(`Unsupported channel: ${message.channel}`);
    }

    if (result.success) {
      // Update message status to sent
      await prisma.communicationMessage.update({
        where: { id: messageId },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      // Update batch sent count if applicable
      if (message.batchId) {
        await prisma.messageBatch.update({
          where: { id: message.batchId },
          data: {
            sentCount: { increment: 1 },
          },
        });
      }

      return {
        success: true,
        messageId,
        status: 'sent',
        provider,
        providerId: result.providerId,
        processingTimeMs: Date.now() - startTime,
      };
    } else {
      // Provider returned failure - increment retry count
      const newRetryCount = message.retryCount + 1;
      const isMaxRetries = newRetryCount >= MAX_RETRY_ATTEMPTS;

      await prisma.communicationMessage.update({
        where: { id: messageId },
        data: {
          status: isMaxRetries || !result.retryable ? 'failed' : 'queued',
          retryCount: newRetryCount,
          failureReason: result.error,
        },
      });

      return {
        success: false,
        messageId,
        status: isMaxRetries || !result.retryable ? 'failed' : 'queued',
        provider,
        error: result.error,
        retryable: result.retryable && !isMaxRetries,
        processingTimeMs: Date.now() - startTime,
      };
    }
  } catch (error) {
    // Handle unexpected errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const isRetryable = errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED');

    // Increment retry count for unexpected errors too
    const newRetryCount = message.retryCount + 1;
    const isMaxRetries = newRetryCount >= MAX_RETRY_ATTEMPTS;

    await prisma.communicationMessage.update({
      where: { id: messageId },
      data: {
        status: isMaxRetries || !isRetryable ? 'failed' : 'queued',
        retryCount: newRetryCount,
        failureReason: errorMessage,
      },
    });

    return {
      success: false,
      messageId,
      status: isMaxRetries || !isRetryable ? 'failed' : 'queued',
      provider,
      error: errorMessage,
      retryable: isRetryable && !isMaxRetries,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

// =============================================================================
// DELIVERY WEBHOOKS
// =============================================================================

/**
 * Handle delivery webhook from provider
 *
 * @param webhook - Webhook payload
 */
export async function handleDeliveryWebhook(
  webhook: DeliveryWebhook
): Promise<void> {
  // Find message by provider ID (stored in metadata)
  // For now, we'll search by a pattern - in production this would be indexed
  const message = await prisma.communicationMessage.findFirst({
    where: {
      // Would search metadata for providerId
    },
  });

  if (!message) {
    console.warn('[Worker] Message not found for webhook:', webhook.providerId);
    return;
  }

  // Check if already in final state
  if (['delivered', 'bounced', 'failed'].includes(message.status) && message.deliveredAt) {
    // Already processed, skip duplicate webhook
    return;
  }

  // Update based on event type
  switch (webhook.event) {
    case 'delivered':
      await prisma.communicationMessage.update({
        where: { id: message.id },
        data: {
          status: 'delivered',
          deliveredAt: new Date(webhook.timestamp),
        },
      });

      // Update batch stats
      if (message.batchId) {
        await prisma.messageBatch.update({
          where: { id: message.batchId },
          data: {
            deliveredCount: { increment: 1 },
          },
        });
      }
      break;

    case 'bounced':
      await prisma.communicationMessage.update({
        where: { id: message.id },
        data: {
          status: 'bounced',
          failureReason: `${webhook.bounceType}: ${webhook.bounceReason}`,
        },
      });

      if (message.batchId) {
        await prisma.messageBatch.update({
          where: { id: message.batchId },
          data: {
            failedCount: { increment: 1 },
          },
        });
      }
      break;

    case 'failed':
      await prisma.communicationMessage.update({
        where: { id: message.id },
        data: {
          status: 'failed',
          failureReason: webhook.error,
        },
      });

      if (message.batchId) {
        await prisma.messageBatch.update({
          where: { id: message.batchId },
          data: {
            failedCount: { increment: 1 },
          },
        });
      }
      break;

    case 'opened':
    case 'clicked':
      // Track engagement but don't change status
      // Would store in message events/metadata
      break;
  }
}

// =============================================================================
// BATCH COMPLETION
// =============================================================================

/**
 * Check if batch is complete and update status
 *
 * @param batchId - Batch ID
 * @returns Batch completion result or null if not complete
 */
export async function checkBatchCompletion(
  batchId: string
): Promise<BatchCompletionResult | null> {
  const batch = await prisma.messageBatch.findUnique({
    where: { id: batchId },
  });

  if (!batch) {
    return null;
  }

  // Check if all messages are processed
  const processedCount = batch.sentCount + batch.failedCount;
  const isComplete = processedCount >= batch.totalRecipients;

  if (!isComplete) {
    return null;
  }

  // Determine final status
  const allFailed = batch.failedCount === batch.totalRecipients;
  const finalStatus = allFailed ? 'failed' : 'completed';

  // Calculate delivery rate
  const deliveryRate =
    batch.sentCount > 0 ? batch.deliveredCount / batch.sentCount : 0;

  // Update batch status
  await prisma.messageBatch.update({
    where: { id: batchId },
    data: {
      status: finalStatus,
      completedAt: new Date(),
    },
  });

  return {
    batchId,
    status: finalStatus,
    totalRecipients: batch.totalRecipients,
    deliveredCount: batch.deliveredCount,
    failedCount: batch.failedCount,
    deliveryRate,
    completedAt: new Date(),
  };
}
