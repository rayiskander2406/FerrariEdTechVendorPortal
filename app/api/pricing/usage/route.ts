/**
 * Pricing Usage API
 *
 * V1-06: API endpoint for current month usage.
 *
 * ## Endpoints
 *
 * - GET /api/pricing/usage - Get current month usage
 *
 * @module app/api/pricing/usage
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  getCurrentMonthUsage,
  getUsageByChannel,
  getBillingPeriod,
  getTierForVolume,
} from '@/lib/pricing';

// =============================================================================
// GET - CURRENT USAGE
// =============================================================================

/**
 * Get current month usage for vendor
 *
 * @param request - Request object
 * @returns Current usage summary
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

      // Get current usage
      const usage = await getCurrentMonthUsage(ctx.vendorId);
      const breakdown = await getUsageByChannel(ctx.vendorId);
      const billingPeriod = getBillingPeriod();

      // Build response
      const response = {
        usage: usage || {
          emailCount: 0,
          smsCount: 0,
          totalMessages: 0,
          totalCost: 0,
          tier: 'STARTER',
          discountPercent: 0,
          daysRemaining: billingPeriod.daysRemaining,
        },
        breakdown,
        billingPeriod: {
          month: billingPeriod.month,
          startDate: billingPeriod.startDate.toISOString(),
          endDate: billingPeriod.endDate.toISOString(),
          daysRemaining: billingPeriod.daysRemaining,
        },
        requestId: ctx.requestId,
      };

      return NextResponse.json(response, {
        status: 200,
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      });
    } catch (error) {
      console.error('[Pricing] Error getting usage:', error);

      return NextResponse.json(
        { error: 'Failed to get usage', requestId: ctx.requestId },
        { status: 500 }
      );
    }
  });
}
