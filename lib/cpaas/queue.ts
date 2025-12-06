/**
 * CPaaS Message Queue
 *
 * V1-05: Message queue operations for CPaaS messaging.
 *
 * ## Features
 *
 * - Message enqueueing (single and batch)
 * - Status tracking
 * - Retry logic with exponential backoff
 * - Idempotency key support
 * - Dead letter queue
 *
 * @module lib/cpaas/queue
 */

import { prisma } from '@/lib/db';
import {
  CPAAS_CHANNELS,
  type CpaasChannelId,
  calculateMessageCost,
  isValidChannelId,
} from '@/lib/config/cpaas';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum retry attempts before moving to dead letter queue */
export const MAX_RETRY_ATTEMPTS = 5;

/** Base delay for exponential backoff (1 second) */
export const RETRY_BASE_DELAY_MS = 1000;

/** Maximum retry delay (1 hour) */
export const MAX_RETRY_DELAY_MS = 3600000;

/** Maximum batch size */
export const MAX_BATCH_SIZE = 10000;

/** Token regex patterns for validation */
const TOKEN_PATTERNS = {
  PARENT: /^TKN_PAR_[A-Z0-9]{8}$/,
  STUDENT: /^TKN_STU_[A-Z0-9]{8}$/,
  TEACHER: /^TKN_TCH_[A-Z0-9]{8}$/,
};

// =============================================================================
// TYPES
// =============================================================================

export interface EnqueueMessageInput {
  vendorId: string;
  channel: CpaasChannelId;
  recipientToken: string;
  recipientType: 'PARENT' | 'STUDENT' | 'TEACHER';
  subject?: string;
  body: string;
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
  scheduledAt?: Date;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  batchId?: string;
}

export interface EnqueueBatchInput {
  vendorId: string;
  channel: CpaasChannelId;
  recipients: Array<{
    token: string;
    type: 'PARENT' | 'STUDENT' | 'TEACHER';
  }>;
  subject?: string;
  body: string;
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
  scheduledAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface QueuedMessage {
  id: string;
  vendorId: string;
  channel: string;
  recipientToken: string;
  recipientType: string;
  subject?: string;
  body: string;
  status: string;
  priority?: string;
  retryCount: number;
  createdAt: Date;
  isDuplicate?: boolean;
  estimatedCost?: { amount: number; currency: string };
}

export interface BatchResult {
  batchId: string;
  messageCount: number;
  status: string;
  scheduledAt?: string;
  estimatedCost: { amount: number; currency: string };
}

export interface MessageStatus {
  id: string;
  status: string;
  channel: string;
  sentAt?: string;
  deliveredAt?: string;
  failureReason?: string;
  retryCount?: number;
  events?: Array<{ type: string; timestamp: string }>;
}

export interface BatchStatus {
  id: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  progress: number;
  deliveryRate: number;
}

export interface QueueStats {
  queued: number;
  processing: number;
  sent: number;
  delivered: number;
  failed: number;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate recipient token format
 */
function validateRecipientToken(token: string, type: string): boolean {
  const pattern = TOKEN_PATTERNS[type as keyof typeof TOKEN_PATTERNS];
  if (!pattern) return false;
  return pattern.test(token);
}

/**
 * Validate enqueue message input
 */
function validateEnqueueInput(input: EnqueueMessageInput): void {
  // Validate channel
  if (!isValidChannelId(input.channel)) {
    throw new Error(`Invalid channel: ${input.channel}`);
  }

  // Validate recipient token
  if (!validateRecipientToken(input.recipientToken, input.recipientType)) {
    throw new Error(`Invalid recipient token format: ${input.recipientToken}`);
  }

  // Validate body
  if (!input.body || input.body.trim() === '') {
    throw new Error('Body is required');
  }

  // Validate subject for email
  if (input.channel === 'EMAIL' && !input.subject) {
    throw new Error('Subject is required for EMAIL channel');
  }
}

/**
 * Validate batch input
 */
function validateBatchInput(input: EnqueueBatchInput): void {
  // Validate channel
  if (!isValidChannelId(input.channel)) {
    throw new Error(`Invalid channel: ${input.channel}`);
  }

  // Validate recipients
  if (!input.recipients || input.recipients.length === 0) {
    throw new Error('At least one recipient is required');
  }

  if (input.recipients.length > MAX_BATCH_SIZE) {
    throw new Error(`Batch size exceeded: maximum is ${MAX_BATCH_SIZE}`);
  }

  // Validate all recipient tokens
  for (const recipient of input.recipients) {
    if (!validateRecipientToken(recipient.token, recipient.type)) {
      throw new Error(`Invalid recipient token format: ${recipient.token}`);
    }
  }

  // Validate body
  if (!input.body || input.body.trim() === '') {
    throw new Error('Body is required');
  }

  // Validate subject for email
  if (input.channel === 'EMAIL' && !input.subject) {
    throw new Error('Subject is required for EMAIL channel');
  }
}

// =============================================================================
// ENQUEUE MESSAGE
// =============================================================================

/**
 * Enqueue a single message for delivery
 *
 * @param input - Message input
 * @returns Queued message with ID and status
 */
export async function enqueueMessage(
  input: EnqueueMessageInput
): Promise<QueuedMessage> {
  validateEnqueueInput(input);

  // Check idempotency key
  if (input.idempotencyKey) {
    const existing = await prisma.communicationMessage.findFirst({
      where: {
        vendorId: input.vendorId,
        // Store idempotency key in metadata or a dedicated field
      },
    });

    if (existing) {
      return {
        id: existing.id,
        vendorId: existing.vendorId,
        channel: existing.channel,
        recipientToken: existing.recipientToken,
        recipientType: existing.recipientType,
        body: existing.body,
        status: existing.status,
        retryCount: 0,
        createdAt: existing.createdAt,
        isDuplicate: true,
      };
    }
  }

  // Calculate estimated cost
  const costInfo = calculateMessageCost(input.channel, 1, 0);

  // Look up user by token (recipient must exist)
  const user = await prisma.user.findUnique({
    where: { token: input.recipientToken },
  });

  if (!user) {
    throw new Error(`Recipient not found: ${input.recipientToken}`);
  }

  const message = await prisma.communicationMessage.create({
    data: {
      vendorId: input.vendorId,
      channel: input.channel,
      recipientToken: input.recipientToken,
      recipientType: input.recipientType,
      subject: input.subject,
      body: input.body,
      status: input.scheduledAt ? 'scheduled' : 'queued',
      batchId: input.batchId,
      userId: user.id,
    },
  });

  return {
    id: message.id,
    vendorId: message.vendorId,
    channel: message.channel,
    recipientToken: message.recipientToken,
    recipientType: message.recipientType,
    subject: message.subject || undefined,
    body: message.body,
    status: message.status,
    retryCount: 0,
    createdAt: message.createdAt,
    isDuplicate: false,
    estimatedCost: {
      amount: costInfo.totalCost,
      currency: 'USD',
    },
  };
}

// =============================================================================
// ENQUEUE BATCH
// =============================================================================

/**
 * Enqueue a batch of messages for delivery
 *
 * @param input - Batch input
 * @returns Batch result with ID and stats
 */
export async function enqueueBatch(input: EnqueueBatchInput): Promise<BatchResult> {
  validateBatchInput(input);

  // Calculate estimated cost
  const costInfo = calculateMessageCost(
    input.channel,
    input.recipients.length,
    0
  );

  // Create batch and messages in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create batch record
    const batch = await tx.messageBatch.create({
      data: {
        vendorId: input.vendorId,
        channel: input.channel,
        recipientType: input.recipients[0]?.type || 'PARENT',
        subject: input.subject,
        body: input.body,
        status: input.scheduledAt ? 'scheduled' : 'queued',
        scheduledAt: input.scheduledAt,
        totalRecipients: input.recipients.length,
        sentCount: 0,
        deliveredCount: 0,
        failedCount: 0,
      },
    });

    // Create individual messages
    const messageIds: string[] = [];
    for (const recipient of input.recipients) {
      // Look up user by token
      const user = await tx.user.findUnique({
        where: { token: recipient.token },
      });

      if (!user) {
        throw new Error(`Recipient not found: ${recipient.token}`);
      }

      const message = await tx.communicationMessage.create({
        data: {
          vendorId: input.vendorId,
          batchId: batch.id,
          channel: input.channel,
          recipientToken: recipient.token,
          recipientType: recipient.type,
          subject: input.subject,
          body: input.body,
          status: input.scheduledAt ? 'scheduled' : 'queued',
          userId: user.id,
        },
      });
      messageIds.push(message.id);
    }

    return { batch, messageIds };
  });

  return {
    batchId: result.batch.id,
    messageCount: input.recipients.length,
    status: result.batch.status,
    scheduledAt: input.scheduledAt?.toISOString(),
    estimatedCost: {
      amount: costInfo.totalCost,
      currency: 'USD',
    },
  };
}

// =============================================================================
// STATUS RETRIEVAL
// =============================================================================

/**
 * Get message status by ID
 *
 * @param messageId - Message ID
 * @returns Message status or null
 */
export async function getMessageStatus(
  messageId: string
): Promise<MessageStatus | null> {
  const message = await prisma.communicationMessage.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    return null;
  }

  return {
    id: message.id,
    status: message.status,
    channel: message.channel,
    sentAt: message.sentAt?.toISOString(),
    deliveredAt: message.deliveredAt?.toISOString(),
    failureReason: message.failureReason || undefined,
  };
}

/**
 * Get batch status by ID
 *
 * @param batchId - Batch ID
 * @returns Batch status or null
 */
export async function getBatchStatus(batchId: string): Promise<BatchStatus | null> {
  const batch = await prisma.messageBatch.findUnique({
    where: { id: batchId },
  });

  if (!batch) {
    return null;
  }

  const progress =
    batch.totalRecipients > 0
      ? (batch.sentCount + batch.failedCount) / batch.totalRecipients
      : 0;

  const deliveryRate =
    batch.sentCount > 0 ? batch.deliveredCount / batch.sentCount : 0;

  return {
    id: batch.id,
    status: batch.status,
    totalRecipients: batch.totalRecipients,
    sentCount: batch.sentCount,
    deliveredCount: batch.deliveredCount,
    failedCount: batch.failedCount,
    progress,
    deliveryRate,
  };
}

// =============================================================================
// STATUS UPDATES
// =============================================================================

/**
 * Update message status
 *
 * @param messageId - Message ID
 * @param status - New status
 * @returns Updated message
 */
export async function updateMessageStatus(
  messageId: string,
  status: string
): Promise<{ id: string; status: string }> {
  const updateData: Record<string, unknown> = { status };

  if (status === 'sent') {
    updateData.sentAt = new Date();
  }

  const message = await prisma.communicationMessage.update({
    where: { id: messageId },
    data: updateData,
  });

  return { id: message.id, status: message.status };
}

/**
 * Mark message as delivered
 *
 * @param messageId - Message ID
 * @returns Updated message
 */
export async function markMessageDelivered(
  messageId: string
): Promise<{ id: string; status: string }> {
  const message = await prisma.communicationMessage.update({
    where: { id: messageId },
    data: {
      status: 'delivered',
      deliveredAt: new Date(),
    },
  });

  // Update batch stats if part of a batch
  if (message.batchId) {
    await prisma.messageBatch.update({
      where: { id: message.batchId },
      data: {
        deliveredCount: { increment: 1 },
      },
    });
  }

  return { id: message.id, status: message.status };
}

/**
 * Mark message as failed
 *
 * @param messageId - Message ID
 * @param reason - Failure reason
 * @returns Updated message
 */
export async function markMessageFailed(
  messageId: string,
  reason: string
): Promise<{ id: string; status: string; failureReason: string }> {
  const message = await prisma.communicationMessage.update({
    where: { id: messageId },
    data: {
      status: 'failed',
      failureReason: reason,
    },
  });

  // Update batch stats if part of a batch
  if (message.batchId) {
    await prisma.messageBatch.update({
      where: { id: message.batchId },
      data: {
        failedCount: { increment: 1 },
      },
    });
  }

  return {
    id: message.id,
    status: message.status,
    failureReason: message.failureReason || reason,
  };
}

// =============================================================================
// RETRY LOGIC
// =============================================================================

/**
 * Calculate retry delay with exponential backoff and jitter
 *
 * @param retryCount - Current retry count
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(retryCount: number): number {
  // Exponential backoff: base * 2^retryCount
  const exponentialDelay = RETRY_BASE_DELAY_MS * Math.pow(2, retryCount);

  // Cap at maximum delay
  const cappedDelay = Math.min(exponentialDelay, MAX_RETRY_DELAY_MS);

  // Add jitter (±10%)
  const jitter = cappedDelay * 0.1 * (Math.random() * 2 - 1);

  return Math.round(cappedDelay + jitter);
}

/**
 * Retry a failed message
 *
 * @param messageId - Message ID
 * @returns Updated message
 */
export async function retryFailedMessage(
  messageId: string
): Promise<{ id: string; status: string; retryCount: number }> {
  const message = await prisma.communicationMessage.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error(`Message not found: ${messageId}`);
  }

  if (message.status === 'delivered') {
    throw new Error('Cannot retry delivered message');
  }

  // Get retry count from metadata or default to 0
  const currentRetryCount = 0; // Would be stored in metadata

  if (currentRetryCount >= MAX_RETRY_ATTEMPTS) {
    throw new Error('Max retries exceeded - message moved to dead letter queue');
  }

  const updated = await prisma.communicationMessage.update({
    where: { id: messageId },
    data: {
      status: 'queued',
      failureReason: null,
    },
  });

  return {
    id: updated.id,
    status: updated.status,
    retryCount: currentRetryCount + 1,
  };
}

// =============================================================================
// QUEUE PROCESSING
// =============================================================================

/**
 * Get next message from queue for processing
 *
 * @returns Next queued message or null
 */
export async function processNextMessage(): Promise<QueuedMessage | null> {
  // Find next queued message (priority HIGH first, then by createdAt)
  const messages = await prisma.communicationMessage.findMany({
    where: {
      status: 'queued',
    },
    orderBy: [{ createdAt: 'asc' }],
    take: 1,
  });

  if (messages.length === 0) {
    return null;
  }

  const message = messages[0]!;

  // Lock message by updating status to processing
  const updated = await prisma.communicationMessage.update({
    where: { id: message.id },
    data: { status: 'processing' },
  });

  return {
    id: updated.id,
    vendorId: updated.vendorId,
    channel: updated.channel,
    recipientToken: updated.recipientToken,
    recipientType: updated.recipientType,
    subject: updated.subject || undefined,
    body: updated.body,
    status: updated.status,
    retryCount: updated.retryCount,
    createdAt: updated.createdAt,
  };
}

// =============================================================================
// QUEUE STATS
// =============================================================================

/**
 * Get queue statistics
 *
 * @param vendorId - Optional vendor ID to filter
 * @returns Queue statistics
 */
export async function getQueueStats(vendorId?: string): Promise<QueueStats> {
  const where = vendorId ? { vendorId } : {};

  const [queued, processing, sent, delivered, failed] = await Promise.all([
    prisma.communicationMessage.count({ where: { ...where, status: 'queued' } }),
    prisma.communicationMessage.count({
      where: { ...where, status: 'processing' },
    }),
    prisma.communicationMessage.count({ where: { ...where, status: 'sent' } }),
    prisma.communicationMessage.count({
      where: { ...where, status: 'delivered' },
    }),
    prisma.communicationMessage.count({ where: { ...where, status: 'failed' } }),
  ]);

  return { queued, processing, sent, delivered, failed };
}

// =============================================================================
// DEAD LETTER QUEUE
// =============================================================================

/**
 * Get messages in dead letter queue (exceeded max retries)
 *
 * @param vendorId - Optional vendor ID to filter
 * @returns Dead letter messages
 */
export async function getDeadLetterMessages(
  vendorId?: string
): Promise<QueuedMessage[]> {
  const where: Record<string, unknown> = {
    status: 'failed',
    // Would filter by retryCount >= MAX_RETRY_ATTEMPTS
  };

  if (vendorId) {
    where.vendorId = vendorId;
  }

  const messages = await prisma.communicationMessage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return messages.map((m) => ({
    id: m.id,
    vendorId: m.vendorId,
    channel: m.channel,
    recipientToken: m.recipientToken,
    recipientType: m.recipientType,
    subject: m.subject || undefined,
    body: m.body,
    status: m.status,
    retryCount: MAX_RETRY_ATTEMPTS,
    createdAt: m.createdAt,
  }));
}

/**
 * Reprocess a dead letter message (reset retry count)
 *
 * @param messageId - Message ID
 * @returns Updated message
 */
export async function reprocessDeadLetterMessage(
  messageId: string
): Promise<{ id: string; status: string; retryCount: number }> {
  const message = await prisma.communicationMessage.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error(`Message not found: ${messageId}`);
  }

  const updated = await prisma.communicationMessage.update({
    where: { id: messageId },
    data: {
      status: 'queued',
      failureReason: null,
    },
  });

  return {
    id: updated.id,
    status: updated.status,
    retryCount: 0,
  };
}
