/**
 * Rate Limiting Middleware
 *
 * V1-03: Middleware for integrating rate limiting with API routes.
 *
 * ## Usage
 *
 * ```typescript
 * // Standalone rate limiting
 * import { withRateLimit } from '@/lib/rate-limit/middleware';
 *
 * export async function GET(request: NextRequest) {
 *   return withRateLimit(request, vendorId, 'PRIVACY_SAFE', async (req) => {
 *     return NextResponse.json({ data: 'response' });
 *   });
 * }
 *
 * // Combined auth + rate limiting
 * import { withAuthAndRateLimit } from '@/lib/rate-limit/middleware';
 *
 * export async function GET(request: NextRequest) {
 *   return withAuthAndRateLimit(request, async (req, context) => {
 *     return NextResponse.json({ vendor: context.vendor });
 *   });
 * }
 * ```
 *
 * @module lib/rate-limit/middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  createRateLimitHeaders,
  RateLimitTier,
  RateLimitResult,
} from './index';
import { withAuth, type AuthContext, type AuthenticatedHandler } from '@/lib/auth';

// =============================================================================
// TYPES
// =============================================================================

export type RateLimitedHandler = (request: NextRequest) => Promise<Response>;

// =============================================================================
// STANDALONE RATE LIMIT MIDDLEWARE
// =============================================================================

/**
 * Wrap a handler with rate limiting
 *
 * @param request - The incoming request
 * @param vendorId - The vendor ID
 * @param tier - The rate limit tier
 * @param handler - The handler to call if rate limit allows
 * @returns Response from handler or 429 error
 */
export async function withRateLimit(
  request: NextRequest,
  vendorId: string,
  tier: RateLimitTier,
  handler: RateLimitedHandler
): Promise<Response> {
  let result: RateLimitResult;

  try {
    result = await checkRateLimit(vendorId, tier);
  } catch (error) {
    console.error('[RateLimit] Error checking rate limit:', error);
    // Fail open - allow request if rate limit check fails
    return handler(request);
  }

  if (!result.allowed) {
    const headers = createRateLimitHeaders(result);

    return NextResponse.json(
      {
        error: 'Too many requests - rate limit exceeded',
        retryAfter: result.retryAfter,
        resetAt: result.resetAt.toISOString(),
      },
      {
        status: 429,
        headers,
      }
    );
  }

  // Call handler and merge rate limit headers into response
  const response = await handler(request);
  const rateLimitHeaders = createRateLimitHeaders(result);

  // Clone response with additional headers
  const newHeaders = new Headers(response.headers);
  rateLimitHeaders.forEach((value, key) => {
    newHeaders.set(key, value);
  });

  // Create new response with merged headers
  const body = response.body;
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

// =============================================================================
// COMBINED AUTH + RATE LIMIT MIDDLEWARE
// =============================================================================

/**
 * Wrap a handler with both authentication and rate limiting
 *
 * Authentication is checked first. If successful, rate limiting is applied
 * based on the vendor's access tier.
 *
 * @param request - The incoming request
 * @param handler - The handler to call if auth and rate limit pass
 * @returns Response from handler, 401, 403, or 429 error
 */
export async function withAuthAndRateLimit(
  request: NextRequest,
  handler: AuthenticatedHandler
): Promise<Response> {
  return withAuth(request, async (req, context) => {
    // Get tier from vendor's access tier
    const tier = mapAccessTierToRateLimitTier(context.vendor.defaultAccessTier);

    let result: RateLimitResult;

    try {
      result = await checkRateLimit(context.vendorId, tier);
    } catch (error) {
      console.error('[RateLimit] Error checking rate limit:', error);
      // Fail open - allow request if rate limit check fails
      return handler(req, context);
    }

    if (!result.allowed) {
      const headers = createRateLimitHeaders(result);

      return NextResponse.json(
        {
          error: 'Too many requests - rate limit exceeded',
          retryAfter: result.retryAfter,
          resetAt: result.resetAt.toISOString(),
          requestId: context.requestId,
        },
        {
          status: 429,
          headers,
        }
      );
    }

    // Call handler and merge rate limit headers into response
    const response = await handler(req, context);
    const rateLimitHeaders = createRateLimitHeaders(result);

    // Clone response with additional headers
    const newHeaders = new Headers(response.headers);
    rateLimitHeaders.forEach((value, key) => {
      newHeaders.set(key, value);
    });

    // Create new response with merged headers
    const body = response.body;
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Map vendor access tier to rate limit tier
 */
function mapAccessTierToRateLimitTier(accessTier: string | undefined): RateLimitTier {
  const tier = (accessTier || 'PRIVACY_SAFE').toUpperCase();

  switch (tier) {
    case 'FULL_ACCESS':
      return 'FULL_ACCESS';
    case 'SELECTIVE':
      return 'SELECTIVE';
    case 'PRIVACY_SAFE':
    default:
      return 'PRIVACY_SAFE';
  }
}
