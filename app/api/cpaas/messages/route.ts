/**
 * CPaaS Messages API
 *
 * V1-05: API endpoint for sending and tracking messages.
 *
 * ## Endpoints
 *
 * - POST /api/cpaas/messages - Send message(s)
 * - GET /api/cpaas/messages - Get message status or list
 *
 * @module app/api/cpaas/messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, type AuthContext } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/db';
import {
  enqueueMessage,
  enqueueBatch,
  getMessageStatus,
  getBatchStatus,
  type EnqueueMessageInput,
  type EnqueueBatchInput,
} from '@/lib/cpaas/queue';
import { isValidChannelId, ALL_CHANNEL_IDS } from '@/lib/config/cpaas';

// =============================================================================
// SCHEMAS
// =============================================================================

/** Recipient schema */
const RecipientSchema = z.object({
  token: z.string().regex(/^TKN_(PAR|STU|TCH)_[A-Z0-9]{8}$/, 'Invalid recipient token format'),
  type: z.enum(['PARENT', 'STUDENT', 'TEACHER']),
});

/** Single message schema */
const SingleMessageSchema = z.object({
  channel: z.enum(['EMAIL', 'SMS']),
  recipient: z.string().regex(/^TKN_(PAR|STU|TCH)_[A-Z0-9]{8}$/, 'Invalid recipient token format'),
  recipientType: z.enum(['PARENT', 'STUDENT', 'TEACHER']),
  subject: z.string().optional(),
  body: z.string().min(1, 'Body is required'),
  priority: z.enum(['HIGH', 'NORMAL', 'LOW']).default('NORMAL'),
  scheduledAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
}).refine(
  (data) => data.channel !== 'EMAIL' || data.subject,
  { message: 'Subject is required for EMAIL channel', path: ['subject'] }
);

/** Batch message schema */
const BatchMessageSchema = z.object({
  channel: z.enum(['EMAIL', 'SMS']),
  recipients: z.array(RecipientSchema).min(1, 'At least one recipient is required').max(10000, 'Maximum 10,000 recipients per batch'),
  subject: z.string().optional(),
  body: z.string().min(1, 'Body is required'),
  priority: z.enum(['HIGH', 'NORMAL', 'LOW']).default('NORMAL'),
  scheduledAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
}).refine(
  (data) => data.channel !== 'EMAIL' || data.subject,
  { message: 'Subject is required for EMAIL channel', path: ['subject'] }
);

/** Combined schema that accepts either single or batch */
const SendMessageSchema = z.union([
  SingleMessageSchema,
  BatchMessageSchema,
]);

// =============================================================================
// POST - SEND MESSAGE
// =============================================================================

/**
 * Send a message or batch of messages
 *
 * @param request - Request with message payload
 * @returns Response with message ID(s) and status
 */
export async function POST(request: NextRequest): Promise<Response> {
  return withAuth(request, async (req, ctx: AuthContext) => {
    try {
      // Check rate limit
      const rateLimit = await checkRateLimit(ctx.vendorId, 'PRIVACY_SAFE');

      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            retryAfter: rateLimit.retryAfter,
            requestId: ctx.requestId,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(rateLimit.limit),
              'X-RateLimit-Remaining': '0',
              'Retry-After': String(rateLimit.retryAfter || 60),
            },
          }
        );
      }

      // Parse request body
      let body;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json(
          { error: 'Invalid JSON body', requestId: ctx.requestId },
          { status: 400 }
        );
      }

      // Check idempotency key
      const idempotencyKey = request.headers.get('Idempotency-Key');

      // Determine if single or batch
      const isBatch = 'recipients' in body && Array.isArray(body.recipients);

      if (isBatch) {
        // Validate batch schema
        const parseResult = BatchMessageSchema.safeParse(body);
        if (!parseResult.success) {
          const issues = parseResult.error.issues;
          return NextResponse.json(
            {
              error: issues[0]?.message || 'Invalid request',
              details: issues,
              requestId: ctx.requestId,
            },
            { status: 400 }
          );
        }

        const input = parseResult.data;

        // Validate scheduled time is in the future
        if (input.scheduledAt) {
          const scheduledDate = new Date(input.scheduledAt);
          if (scheduledDate < new Date()) {
            return NextResponse.json(
              {
                error: 'Scheduled time must be in the future',
                requestId: ctx.requestId,
              },
              { status: 400 }
            );
          }
        }

        // Enqueue batch
        const batchInput: EnqueueBatchInput = {
          vendorId: ctx.vendorId,
          channel: input.channel,
          recipients: input.recipients,
          subject: input.subject,
          body: input.body,
          priority: input.priority,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
          metadata: input.metadata,
        };

        const result = await enqueueBatch(batchInput);

        return NextResponse.json(
          {
            batchId: result.batchId,
            messageCount: result.messageCount,
            status: result.status,
            scheduledAt: result.scheduledAt,
            estimatedCost: result.estimatedCost,
            requestId: ctx.requestId,
          },
          {
            status: 201,
            headers: {
              'X-RateLimit-Limit': String(rateLimit.limit),
              'X-RateLimit-Remaining': String(rateLimit.remaining),
            },
          }
        );
      } else {
        // Validate single message schema
        const parseResult = SingleMessageSchema.safeParse(body);
        if (!parseResult.success) {
          const issues = parseResult.error.issues;
          return NextResponse.json(
            {
              error: issues[0]?.message || 'Invalid request',
              details: issues,
              requestId: ctx.requestId,
            },
            { status: 400 }
          );
        }

        const input = parseResult.data;

        // Enqueue single message
        const messageInput: EnqueueMessageInput = {
          vendorId: ctx.vendorId,
          channel: input.channel,
          recipientToken: input.recipient,
          recipientType: input.recipientType,
          subject: input.subject,
          body: input.body,
          priority: input.priority,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
          idempotencyKey: idempotencyKey || undefined,
          metadata: input.metadata,
        };

        const result = await enqueueMessage(messageInput);

        // Return 200 for duplicate, 201 for new
        const status = result.isDuplicate ? 200 : 201;

        return NextResponse.json(
          {
            messageId: result.id,
            status: result.status,
            duplicate: result.isDuplicate || false,
            estimatedCost: result.estimatedCost,
            requestId: ctx.requestId,
          },
          {
            status,
            headers: {
              'X-RateLimit-Limit': String(rateLimit.limit),
              'X-RateLimit-Remaining': String(rateLimit.remaining),
            },
          }
        );
      }
    } catch (error) {
      console.error('[CPaaS] Error sending message:', error);

      const message = error instanceof Error ? error.message : 'Internal server error';

      // Check for known error types
      if (message.includes('Recipient not found')) {
        return NextResponse.json(
          { error: message, requestId: ctx.requestId },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to send message', requestId: ctx.requestId },
        { status: 500 }
      );
    }
  });
}

// =============================================================================
// GET - MESSAGE STATUS
// =============================================================================

/**
 * Get message status, batch status, or list messages
 *
 * @param request - Request with query params
 * @returns Response with message/batch status or list
 */
export async function GET(request: NextRequest): Promise<Response> {
  return withAuth(request, async (req, ctx: AuthContext) => {
    try {
      const { searchParams } = new URL(request.url);

      // Get by message ID
      const messageId = searchParams.get('id');
      if (messageId) {
        const status = await getMessageStatus(messageId);

        if (!status) {
          return NextResponse.json(
            { error: 'Message not found', requestId: ctx.requestId },
            { status: 404 }
          );
        }

        return NextResponse.json({
          ...status,
          requestId: ctx.requestId,
        });
      }

      // Get by batch ID
      const batchId = searchParams.get('batchId');
      if (batchId) {
        const status = await getBatchStatus(batchId);

        if (!status) {
          return NextResponse.json(
            { error: 'Batch not found', requestId: ctx.requestId },
            { status: 404 }
          );
        }

        return NextResponse.json({
          ...status,
          requestId: ctx.requestId,
        });
      }

      // List messages with filters
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
      const offset = parseInt(searchParams.get('offset') || '0');
      const status = searchParams.get('status');
      const channel = searchParams.get('channel');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      const where: Record<string, unknown> = {
        vendorId: ctx.vendorId,
      };

      if (status) {
        where.status = status;
      }

      if (channel && isValidChannelId(channel)) {
        where.channel = channel;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          (where.createdAt as Record<string, Date>).gte = new Date(startDate);
        }
        if (endDate) {
          (where.createdAt as Record<string, Date>).lte = new Date(endDate);
        }
      }

      const messages = await prisma.communicationMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          channel: true,
          recipientToken: true,
          recipientType: true,
          status: true,
          sentAt: true,
          deliveredAt: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        messages,
        limit,
        offset,
        requestId: ctx.requestId,
      });
    } catch (error) {
      console.error('[CPaaS] Error getting message status:', error);

      return NextResponse.json(
        { error: 'Failed to get message status', requestId: ctx.requestId },
        { status: 500 }
      );
    }
  });
}
