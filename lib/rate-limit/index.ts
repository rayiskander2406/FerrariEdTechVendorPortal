/**
 * Rate Limiting Module
 *
 * V1-03: Implements tier-based rate limiting with Upstash Redis.
 *
 * ## Tiers
 *
 * - PRIVACY_SAFE: 100 requests/minute (default)
 * - SELECTIVE: 500 requests/minute
 * - FULL_ACCESS: 1000 requests/minute
 *
 * ## Usage
 *
 * ```typescript
 * import { checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';
 *
 * const result = await checkRateLimit(vendorId, 'PRIVACY_SAFE');
 * if (!result.allowed) {
 *   return new Response('Too Many Requests', {
 *     status: 429,
 *     headers: createRateLimitHeaders(result),
 *   });
 * }
 * ```
 *
 * @module lib/rate-limit
 */

import { Redis } from '@upstash/redis';

// =============================================================================
// TYPES
// =============================================================================

export type RateLimitTier = 'PRIVACY_SAFE' | 'SELECTIVE' | 'FULL_ACCESS';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  retryAfter?: number;
  vendorId: string;
  tier: RateLimitTier;
}

export interface RateLimitStatus {
  currentCount: number;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Rate limit tiers based on vendor access level
 */
export const RATE_LIMIT_TIERS: Record<RateLimitTier, RateLimitConfig> = {
  PRIVACY_SAFE: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  SELECTIVE: {
    maxRequests: 500,
    windowMs: 60 * 1000,
  },
  FULL_ACCESS: {
    maxRequests: 1000,
    windowMs: 60 * 1000,
  },
};

const WINDOW_SECONDS = 60;
const KEY_PREFIX = 'ratelimit:';

// =============================================================================
// REDIS CLIENT
// =============================================================================

interface RedisLike {
  get<T>(key: string): Promise<T | null>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  del(key: string): Promise<number>;
  ttl(key: string): Promise<number>;
}

let redisClient: RedisLike | null = null;
let mockClient: RedisLike | null = null;

/**
 * Set a mock Redis client (for testing)
 */
export function setMockRedisClient(client: RedisLike | null): void {
  mockClient = client;
}

/**
 * Get or create Redis client
 */
function getRedisClient(): RedisLike | null {
  // Use mock client if set (for testing)
  if (mockClient) {
    return mockClient;
  }

  if (redisClient) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[RateLimit] Upstash Redis not configured - rate limiting disabled');
    return null;
  }

  try {
    redisClient = new Redis({ url, token });
    return redisClient;
  } catch (error) {
    console.error('[RateLimit] Failed to create Redis client:', error);
    return null;
  }
}

/**
 * Reset Redis client (for testing)
 */
export function resetRedisClient(): void {
  redisClient = null;
  mockClient = null;
}

// =============================================================================
// RATE LIMIT CONFIGURATION
// =============================================================================

/**
 * Get rate limit configuration for a tier
 *
 * @param tier - The rate limit tier
 * @returns Rate limit configuration
 */
export function getRateLimitConfig(tier: RateLimitTier): RateLimitConfig {
  // Handle case-insensitive tier names
  const normalizedTier = (typeof tier === 'string' ? tier.toUpperCase() : 'PRIVACY_SAFE') as RateLimitTier;

  return RATE_LIMIT_TIERS[normalizedTier] || RATE_LIMIT_TIERS.PRIVACY_SAFE;
}

// =============================================================================
// RATE LIMIT CHECKING
// =============================================================================

/**
 * Check if a request is allowed under rate limits
 *
 * @param vendorId - The vendor ID
 * @param tier - The rate limit tier
 * @returns Rate limit result
 */
export async function checkRateLimit(
  vendorId: string,
  tier: RateLimitTier
): Promise<RateLimitResult> {
  const config = getRateLimitConfig(tier || 'PRIVACY_SAFE');
  const effectiveTier = (tier || 'PRIVACY_SAFE') as RateLimitTier;
  const key = `${KEY_PREFIX}${vendorId}`;
  const now = Date.now();
  const resetAt = new Date(now + WINDOW_SECONDS * 1000);

  const redis = getRedisClient();

  // If Redis not available, fail open (allow request)
  if (!redis) {
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      limit: config.maxRequests,
      resetAt,
      vendorId,
      tier: effectiveTier,
    };
  }

  try {
    // Increment counter and get current value
    const count = await redis.incr(key);

    // Set expiry on first request in window
    if (count === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    const allowed = count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - count);

    // Get TTL for reset time
    let ttl = WINDOW_SECONDS;
    try {
      const redisTtl = await redis.ttl(key);
      if (redisTtl > 0) {
        ttl = redisTtl;
      }
    } catch {
      // Use default TTL
    }

    const result: RateLimitResult = {
      allowed,
      remaining,
      limit: config.maxRequests,
      resetAt: new Date(now + ttl * 1000),
      vendorId,
      tier: effectiveTier,
    };

    if (!allowed) {
      result.retryAfter = ttl;
    }

    return result;
  } catch (error) {
    console.error('[RateLimit] Redis error:', error);

    // Fail open - allow request if Redis is down
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      limit: config.maxRequests,
      resetAt,
      vendorId,
      tier: effectiveTier,
    };
  }
}

// =============================================================================
// RATE LIMIT HEADERS
// =============================================================================

/**
 * Create rate limit headers for a response
 *
 * @param result - The rate limit result
 * @returns Headers object with rate limit headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers();

  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.resetAt.toISOString());

  if (result.retryAfter !== undefined) {
    headers.set('Retry-After', result.retryAfter.toString());
  }

  return headers;
}

// =============================================================================
// RATE LIMIT MANAGEMENT
// =============================================================================

/**
 * Reset rate limit for a vendor
 *
 * @param vendorId - The vendor ID
 */
export async function resetRateLimit(vendorId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  const key = `${KEY_PREFIX}${vendorId}`;

  try {
    await redis.del(key);
  } catch (error) {
    console.error('[RateLimit] Failed to reset rate limit:', error);
  }
}

/**
 * Get current rate limit status for a vendor
 *
 * @param vendorId - The vendor ID
 * @param tier - The rate limit tier
 * @returns Rate limit status
 */
export async function getRateLimitStatus(
  vendorId: string,
  tier: RateLimitTier
): Promise<RateLimitStatus> {
  const config = getRateLimitConfig(tier);
  const key = `${KEY_PREFIX}${vendorId}`;

  const redis = getRedisClient();

  if (!redis) {
    return {
      currentCount: 0,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetInSeconds: WINDOW_SECONDS,
    };
  }

  try {
    const [countValue, ttl] = await Promise.all([
      redis.get<string | number>(key),
      redis.ttl(key),
    ]);

    // Handle both string and number returns from Redis
    const currentCount = countValue !== null && countValue !== undefined
      ? (typeof countValue === 'number' ? countValue : parseInt(countValue, 10))
      : 0;
    const resetInSeconds = ttl > 0 ? ttl : WINDOW_SECONDS;

    return {
      currentCount,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - currentCount),
      resetInSeconds,
    };
  } catch (error) {
    console.error('[RateLimit] Failed to get status:', error);

    return {
      currentCount: 0,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetInSeconds: WINDOW_SECONDS,
    };
  }
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

/**
 * Check Redis health for observability
 *
 * @returns True if Redis is healthy, false otherwise
 */
export async function checkRedisHealth(): Promise<boolean> {
  const redis = getRedisClient();

  if (!redis) {
    return false;
  }

  try {
    // Simple ping-like operation
    const testKey = `health:${Date.now()}`;
    await redis.incr(testKey);
    await redis.del(testKey);
    return true;
  } catch (error) {
    console.error('[RateLimit] Health check failed:', error);
    return false;
  }
}
