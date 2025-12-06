/**
 * Pricing Usage History API
 *
 * V1-06: API endpoint for usage history.
 *
 * ## Endpoints
 *
 * - GET /api/pricing/usage/history - Get usage history
 *
 * @module app/api/pricing/usage/history
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getUsageHistory } from '@/lib/pricing';

// =============================================================================
// GET - USAGE HISTORY
// =============================================================================

/**
 * Get usage history for vendor
 *
 * @param request - Request object
 * @returns Usage history with summary
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

      // Get months parameter (default 12, max 24)
      const { searchParams } = new URL(request.url);
      const monthsParam = searchParams.get('months');
      let months = 12;

      if (monthsParam) {
        const parsed = parseInt(monthsParam, 10);
        if (!isNaN(parsed) && parsed > 0) {
          months = Math.min(parsed, 24);
        }
      }

      // Get usage history
      const history = await getUsageHistory(ctx.vendorId, months);

      // Calculate summary statistics
      const totalMessages = history.reduce(
        (sum, entry) => sum + entry.totalMessages,
        0
      );
      const totalCost = history.reduce((sum, entry) => sum + entry.totalCost, 0);
      const averageMonthlyMessages =
        history.length > 0 ? totalMessages / history.length : 0;
      const averageMonthlyCost =
        history.length > 0 ? totalCost / history.length : 0;

      return NextResponse.json(
        {
          history,
          summary: {
            totalMessages,
            totalCost,
            averageMonthlyMessages,
            averageMonthlyCost,
            monthsIncluded: history.length,
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
      console.error('[Pricing] Error getting usage history:', error);

      return NextResponse.json(
        { error: 'Failed to get usage history', requestId: ctx.requestId },
        { status: 500 }
      );
    }
  });
}
