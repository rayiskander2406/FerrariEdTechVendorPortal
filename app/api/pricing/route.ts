/**
 * Pricing API
 *
 * V1-06: API endpoints for pricing information and cost estimation.
 *
 * ## Endpoints
 *
 * - GET /api/pricing - Get pricing tiers and base prices
 * - POST /api/pricing - Estimate costs for messages (alias for /api/pricing/estimate)
 *
 * @module app/api/pricing
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, type AuthContext } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/db';
import {
  PRICING_TIERS,
  EMAIL_BASE_PRICE,
  SMS_BASE_PRICE,
  calculateBatchCost,
  estimateMonthlyCost,
  getCurrentMonthUsage,
} from '@/lib/pricing';

// =============================================================================
// SCHEMAS
// =============================================================================

/** Single batch estimate schema */
const BatchEstimateSchema = z.object({
  channel: z.enum(['EMAIL', 'SMS']),
  messageCount: z.number().int().positive(),
});

/** Monthly estimate schema */
const MonthlyEstimateSchema = z.object({
  type: z.literal('monthly'),
  emailCount: z.number().int().min(0),
  smsCount: z.number().int().min(0),
});

/** Combined estimate schema */
const EstimateSchema = z.union([BatchEstimateSchema, MonthlyEstimateSchema]);

// =============================================================================
// GET - PRICING TIERS
// =============================================================================

/**
 * Get pricing tiers and base prices
 *
 * @param request - Request object
 * @returns Pricing information
 */
export async function GET(request: NextRequest): Promise<Response> {
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

      return NextResponse.json(
        {
          tiers: PRICING_TIERS,
          basePrices: {
            email: EMAIL_BASE_PRICE,
            sms: SMS_BASE_PRICE,
          },
          requestId: ctx.requestId,
        },
        {
          status: 200,
          headers: {
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        }
      );
    } catch (error) {
      console.error('[Pricing] Error getting pricing:', error);

      return NextResponse.json(
        { error: 'Failed to get pricing', requestId: ctx.requestId },
        { status: 500 }
      );
    }
  });
}

// =============================================================================
// POST - ESTIMATE COSTS
// =============================================================================

/**
 * Estimate costs for messages
 *
 * @param request - Request with estimate parameters
 * @returns Cost estimate
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

      // Validate request
      const parseResult = EstimateSchema.safeParse(body);
      if (!parseResult.success) {
        const issues = parseResult.error.issues || [];
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

      // Get current usage for tier calculation
      const currentUsage = await getCurrentMonthUsage(ctx.vendorId);
      const currentVolume = currentUsage?.totalMessages || 0;

      // Calculate estimate based on type
      if ('type' in input && input.type === 'monthly') {
        // Monthly estimate
        const estimate = estimateMonthlyCost({
          emailCount: input.emailCount,
          smsCount: input.smsCount,
        });

        return NextResponse.json(
          {
            estimate,
            requestId: ctx.requestId,
          },
          {
            status: 200,
            headers: {
              'X-RateLimit-Limit': String(rateLimit.limit),
              'X-RateLimit-Remaining': String(rateLimit.remaining),
            },
          }
        );
      } else {
        // Batch estimate
        const batchInput = input as z.infer<typeof BatchEstimateSchema>;
        const estimate = calculateBatchCost(
          batchInput.channel,
          batchInput.messageCount,
          currentVolume
        );

        return NextResponse.json(
          {
            estimate,
            currentVolume,
            requestId: ctx.requestId,
          },
          {
            status: 200,
            headers: {
              'X-RateLimit-Limit': String(rateLimit.limit),
              'X-RateLimit-Remaining': String(rateLimit.remaining),
            },
          }
        );
      }
    } catch (error) {
      console.error('[Pricing] Error estimating costs:', error);

      return NextResponse.json(
        { error: 'Failed to estimate costs', requestId: ctx.requestId },
        { status: 500 }
      );
    }
  });
}
