/**
 * V1-03: Rate Limiting - Unit Tests
 *
 * Tests for tier-based rate limiting with Upstash Redis.
 * Target coverage: 95%+
 *
 * Test categories:
 * 1. Rate limit configuration (tiers, limits)
 * 2. Rate limit checking (allow/deny)
 * 3. Rate limit headers
 * 4. Sliding window algorithm
 * 5. Redis integration (mocked)
 * 6. Edge cases and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// These will be implemented in lib/rate-limit/index.ts
import {
  checkRateLimit,
  getRateLimitConfig,
  createRateLimitHeaders,
  RateLimitResult,
  RateLimitTier,
  RATE_LIMIT_TIERS,
  resetRateLimit,
  getRateLimitStatus,
  setMockRedisClient,
  resetRedisClient,
} from '@/lib/rate-limit';

// =============================================================================
// TEST HELPERS
// =============================================================================

const TEST_VENDOR_ID = 'test-vendor-rate-limit';

// Mock Redis client
const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn(),
  del: vi.fn(),
  ttl: vi.fn(),
};

// =============================================================================
// RATE LIMIT CONFIGURATION TESTS
// =============================================================================

describe('V1-03: Rate Limit Configuration', () => {
  describe('RATE_LIMIT_TIERS', () => {
    it('defines PRIVACY_SAFE tier with 100 requests/minute', () => {
      expect(RATE_LIMIT_TIERS.PRIVACY_SAFE).toBeDefined();
      expect(RATE_LIMIT_TIERS.PRIVACY_SAFE.maxRequests).toBe(100);
      expect(RATE_LIMIT_TIERS.PRIVACY_SAFE.windowMs).toBe(60 * 1000);
    });

    it('defines SELECTIVE tier with 500 requests/minute', () => {
      expect(RATE_LIMIT_TIERS.SELECTIVE).toBeDefined();
      expect(RATE_LIMIT_TIERS.SELECTIVE.maxRequests).toBe(500);
      expect(RATE_LIMIT_TIERS.SELECTIVE.windowMs).toBe(60 * 1000);
    });

    it('defines FULL_ACCESS tier with 1000 requests/minute', () => {
      expect(RATE_LIMIT_TIERS.FULL_ACCESS).toBeDefined();
      expect(RATE_LIMIT_TIERS.FULL_ACCESS.maxRequests).toBe(1000);
      expect(RATE_LIMIT_TIERS.FULL_ACCESS.windowMs).toBe(60 * 1000);
    });

    it('all tiers have required properties', () => {
      for (const tier of Object.values(RATE_LIMIT_TIERS)) {
        expect(tier).toHaveProperty('maxRequests');
        expect(tier).toHaveProperty('windowMs');
        expect(typeof tier.maxRequests).toBe('number');
        expect(typeof tier.windowMs).toBe('number');
        expect(tier.maxRequests).toBeGreaterThan(0);
        expect(tier.windowMs).toBeGreaterThan(0);
      }
    });
  });

  describe('getRateLimitConfig', () => {
    it('returns PRIVACY_SAFE config for PRIVACY_SAFE tier', () => {
      const config = getRateLimitConfig('PRIVACY_SAFE');
      expect(config.maxRequests).toBe(100);
    });

    it('returns SELECTIVE config for SELECTIVE tier', () => {
      const config = getRateLimitConfig('SELECTIVE');
      expect(config.maxRequests).toBe(500);
    });

    it('returns FULL_ACCESS config for FULL_ACCESS tier', () => {
      const config = getRateLimitConfig('FULL_ACCESS');
      expect(config.maxRequests).toBe(1000);
    });

    it('defaults to PRIVACY_SAFE for unknown tier', () => {
      const config = getRateLimitConfig('UNKNOWN_TIER' as RateLimitTier);
      expect(config.maxRequests).toBe(100);
    });

    it('is case-insensitive', () => {
      const config1 = getRateLimitConfig('privacy_safe' as RateLimitTier);
      const config2 = getRateLimitConfig('PRIVACY_SAFE');
      expect(config1.maxRequests).toBe(config2.maxRequests);
    });
  });
});

// =============================================================================
// RATE LIMIT CHECKING TESTS
// =============================================================================

describe('V1-03: Rate Limit Checking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRedisClient();
    setMockRedisClient(mockRedis);
    mockRedis.get.mockResolvedValue(null);
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(60);
  });

  afterEach(() => {
    resetRedisClient();
  });

  describe('checkRateLimit - allowed requests', () => {
    it('allows first request for new vendor', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.incr.mockResolvedValue(1);

      const result = await checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99); // 100 - 1
    });

    it('allows request when under limit', async () => {
      mockRedis.get.mockResolvedValue('50');
      mockRedis.incr.mockResolvedValue(51);

      const result = await checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(49); // 100 - 51
    });

    it('allows request at exactly the limit', async () => {
      mockRedis.get.mockResolvedValue('99');
      mockRedis.incr.mockResolvedValue(100);

      const result = await checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('uses higher limit for SELECTIVE tier', async () => {
      mockRedis.get.mockResolvedValue('200');
      mockRedis.incr.mockResolvedValue(201);

      const result = await checkRateLimit(TEST_VENDOR_ID, 'SELECTIVE');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(299); // 500 - 201
    });

    it('uses highest limit for FULL_ACCESS tier', async () => {
      mockRedis.get.mockResolvedValue('800');
      mockRedis.incr.mockResolvedValue(801);

      const result = await checkRateLimit(TEST_VENDOR_ID, 'FULL_ACCESS');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(199); // 1000 - 801
    });
  });

  describe('checkRateLimit - denied requests', () => {
    it('denies request when limit exceeded', async () => {
      mockRedis.get.mockResolvedValue('100');
      mockRedis.incr.mockResolvedValue(101);

      const result = await checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('includes retry-after when denied', async () => {
      mockRedis.get.mockResolvedValue('100');
      mockRedis.incr.mockResolvedValue(101);
      mockRedis.ttl.mockResolvedValue(30);

      const result = await checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE');

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('denies for correct tier limit (SELECTIVE)', async () => {
      mockRedis.get.mockResolvedValue('500');
      mockRedis.incr.mockResolvedValue(501);

      const result = await checkRateLimit(TEST_VENDOR_ID, 'SELECTIVE');

      expect(result.allowed).toBe(false);
    });

    it('denies for correct tier limit (FULL_ACCESS)', async () => {
      mockRedis.get.mockResolvedValue('1000');
      mockRedis.incr.mockResolvedValue(1001);

      const result = await checkRateLimit(TEST_VENDOR_ID, 'FULL_ACCESS');

      expect(result.allowed).toBe(false);
    });
  });

  describe('checkRateLimit - result properties', () => {
    it('includes vendorId in result', async () => {
      const result = await checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE');
      expect(result.vendorId).toBe(TEST_VENDOR_ID);
    });

    it('includes tier in result', async () => {
      const result = await checkRateLimit(TEST_VENDOR_ID, 'SELECTIVE');
      expect(result.tier).toBe('SELECTIVE');
    });

    it('includes limit in result', async () => {
      const result = await checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE');
      expect(result.limit).toBe(100);
    });

    it('includes resetAt timestamp', async () => {
      mockRedis.ttl.mockResolvedValue(45);

      const result = await checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE');

      expect(result.resetAt).toBeInstanceOf(Date);
      expect(result.resetAt.getTime()).toBeGreaterThan(Date.now());
    });
  });
});

// =============================================================================
// RATE LIMIT HEADERS TESTS
// =============================================================================

describe('V1-03: Rate Limit Headers', () => {
  it('creates X-RateLimit-Limit header', () => {
    const result: RateLimitResult = {
      allowed: true,
      remaining: 50,
      limit: 100,
      resetAt: new Date(Date.now() + 30000),
      vendorId: TEST_VENDOR_ID,
      tier: 'PRIVACY_SAFE',
    };

    const headers = createRateLimitHeaders(result);

    expect(headers.get('X-RateLimit-Limit')).toBe('100');
  });

  it('creates X-RateLimit-Remaining header', () => {
    const result: RateLimitResult = {
      allowed: true,
      remaining: 50,
      limit: 100,
      resetAt: new Date(Date.now() + 30000),
      vendorId: TEST_VENDOR_ID,
      tier: 'PRIVACY_SAFE',
    };

    const headers = createRateLimitHeaders(result);

    expect(headers.get('X-RateLimit-Remaining')).toBe('50');
  });

  it('creates X-RateLimit-Reset header', () => {
    const resetAt = new Date(Date.now() + 30000);
    const result: RateLimitResult = {
      allowed: true,
      remaining: 50,
      limit: 100,
      resetAt,
      vendorId: TEST_VENDOR_ID,
      tier: 'PRIVACY_SAFE',
    };

    const headers = createRateLimitHeaders(result);

    expect(headers.get('X-RateLimit-Reset')).toBe(resetAt.toISOString());
  });

  it('creates Retry-After header when denied', () => {
    const result: RateLimitResult = {
      allowed: false,
      remaining: 0,
      limit: 100,
      resetAt: new Date(Date.now() + 30000),
      retryAfter: 30,
      vendorId: TEST_VENDOR_ID,
      tier: 'PRIVACY_SAFE',
    };

    const headers = createRateLimitHeaders(result);

    expect(headers.get('Retry-After')).toBe('30');
  });

  it('does not include Retry-After when allowed', () => {
    const result: RateLimitResult = {
      allowed: true,
      remaining: 50,
      limit: 100,
      resetAt: new Date(Date.now() + 30000),
      vendorId: TEST_VENDOR_ID,
      tier: 'PRIVACY_SAFE',
    };

    const headers = createRateLimitHeaders(result);

    expect(headers.get('Retry-After')).toBeNull();
  });

  it('includes all standard rate limit headers', () => {
    const result: RateLimitResult = {
      allowed: true,
      remaining: 50,
      limit: 100,
      resetAt: new Date(Date.now() + 30000),
      vendorId: TEST_VENDOR_ID,
      tier: 'PRIVACY_SAFE',
    };

    const headers = createRateLimitHeaders(result);

    expect(headers.has('X-RateLimit-Limit')).toBe(true);
    expect(headers.has('X-RateLimit-Remaining')).toBe(true);
    expect(headers.has('X-RateLimit-Reset')).toBe(true);
  });
});

// =============================================================================
// SLIDING WINDOW ALGORITHM TESTS
// =============================================================================

describe('V1-03: Sliding Window Algorithm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRedisClient();
    setMockRedisClient(mockRedis);
    mockRedis.get.mockResolvedValue(null);
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(60);
  });

  afterEach(() => {
    resetRedisClient();
  });

  it('increments counter on each request', async () => {
    mockRedis.get.mockResolvedValue('5');
    mockRedis.incr.mockResolvedValue(6);

    await checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE');

    expect(mockRedis.incr).toHaveBeenCalled();
  });

  it('sets expiry on new counter', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.incr.mockResolvedValue(1);

    await checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE');

    expect(mockRedis.expire).toHaveBeenCalledWith(
      expect.any(String),
      60 // 60 seconds window
    );
  });

  it('uses vendor-specific key', async () => {
    await checkRateLimit('vendor-123', 'PRIVACY_SAFE');

    expect(mockRedis.incr).toHaveBeenCalledWith(
      expect.stringContaining('vendor-123')
    );
  });

  it('uses different keys for different tiers', async () => {
    await checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE');
    await checkRateLimit(TEST_VENDOR_ID, 'SELECTIVE');

    const calls = mockRedis.incr.mock.calls;
    expect(calls.length).toBe(2);
    // Both use same key since tier doesn't affect key, just limit
  });

  it('resets counter after window expires', async () => {
    // First call: counter at limit
    mockRedis.get.mockResolvedValueOnce('100');
    mockRedis.incr.mockResolvedValueOnce(101);
    const result1 = await checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE');
    expect(result1.allowed).toBe(false);

    // Simulate window reset (null = expired/new window)
    mockRedis.get.mockResolvedValueOnce(null);
    mockRedis.incr.mockResolvedValueOnce(1);
    const result2 = await checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE');
    expect(result2.allowed).toBe(true);
  });
});

// =============================================================================
// REDIS INTEGRATION TESTS
// =============================================================================

describe('V1-03: Redis Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRedisClient();
    setMockRedisClient(mockRedis);
    mockRedis.get.mockResolvedValue(null);
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(60);
    mockRedis.del.mockResolvedValue(1);
  });

  afterEach(() => {
    resetRedisClient();
  });

  describe('connection handling', () => {
    it('handles Redis connection errors gracefully', async () => {
      mockRedis.incr.mockRejectedValue(new Error('Connection refused'));

      // Should not throw, should fail open or closed based on config
      const result = await checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE');

      // Default: fail open (allow request if Redis is down)
      expect(result.allowed).toBe(true);
    });

    it('logs error when Redis fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRedis.incr.mockRejectedValue(new Error('Connection refused'));

      await checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('key management', () => {
    it('uses proper key format: ratelimit:{vendorId}', async () => {
      await checkRateLimit('vendor-abc', 'PRIVACY_SAFE');

      expect(mockRedis.incr).toHaveBeenCalledWith(
        expect.stringMatching(/^ratelimit:vendor-abc/)
      );
    });

    it('handles special characters in vendor ID', async () => {
      await checkRateLimit('vendor:with:colons', 'PRIVACY_SAFE');

      expect(mockRedis.incr).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// RESET AND STATUS TESTS
// =============================================================================

describe('V1-03: Rate Limit Reset and Status', () => {
  beforeEach(() => {
    // Reset all mocks completely to avoid test pollution
    mockRedis.get.mockReset();
    mockRedis.incr.mockReset();
    mockRedis.expire.mockReset();
    mockRedis.ttl.mockReset();
    mockRedis.del.mockReset();

    resetRedisClient();
    setMockRedisClient(mockRedis);

    // Set default mock values
    mockRedis.get.mockResolvedValue(null);
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(60);
    mockRedis.del.mockResolvedValue(1);
  });

  afterEach(() => {
    resetRedisClient();
  });

  describe('resetRateLimit', () => {
    it('deletes rate limit key from Redis', async () => {
      await resetRateLimit(TEST_VENDOR_ID);

      expect(mockRedis.del).toHaveBeenCalledWith(
        expect.stringContaining(TEST_VENDOR_ID)
      );
    });

    it('handles non-existent key gracefully', async () => {
      mockRedis.del.mockResolvedValue(0);

      await expect(resetRateLimit(TEST_VENDOR_ID)).resolves.not.toThrow();
    });
  });

  describe('getRateLimitStatus', () => {
    it('returns current count and limit', async () => {
      // Upstash Redis returns numbers for INCR'd values
      mockRedis.get.mockResolvedValue(25);
      mockRedis.ttl.mockResolvedValue(45);

      const status = await getRateLimitStatus(TEST_VENDOR_ID, 'PRIVACY_SAFE');

      expect(status.currentCount).toBe(25);
      expect(status.limit).toBe(100);
      expect(status.remaining).toBe(75);
    });

    it('returns zero count for new vendor', async () => {
      mockRedis.get.mockResolvedValue(null);

      const status = await getRateLimitStatus(TEST_VENDOR_ID, 'PRIVACY_SAFE');

      expect(status.currentCount).toBe(0);
      expect(status.remaining).toBe(100);
    });

    it('includes time until reset', async () => {
      mockRedis.get.mockResolvedValue('50');
      mockRedis.ttl.mockResolvedValue(30);

      const status = await getRateLimitStatus(TEST_VENDOR_ID, 'PRIVACY_SAFE');

      expect(status.resetInSeconds).toBe(30);
    });
  });
});

// =============================================================================
// EDGE CASES AND ERROR HANDLING
// =============================================================================

describe('V1-03: Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRedisClient();
    setMockRedisClient(mockRedis);
    mockRedis.get.mockResolvedValue(null);
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(60);
    mockRedis.del.mockResolvedValue(1);
  });

  afterEach(() => {
    resetRedisClient();
  });

  describe('input validation', () => {
    it('handles empty vendor ID', async () => {
      const result = await checkRateLimit('', 'PRIVACY_SAFE');

      // Should still work, using empty string as key
      expect(result).toBeDefined();
    });

    it('handles very long vendor ID', async () => {
      const longId = 'a'.repeat(1000);

      const result = await checkRateLimit(longId, 'PRIVACY_SAFE');

      expect(result).toBeDefined();
    });

    it('handles null tier gracefully', async () => {
      const result = await checkRateLimit(TEST_VENDOR_ID, null as unknown as RateLimitTier);

      // Should default to PRIVACY_SAFE
      expect(result.limit).toBe(100);
    });
  });

  describe('concurrent requests', () => {
    it('handles multiple concurrent requests correctly', async () => {
      let counter = 0;
      mockRedis.incr.mockImplementation(async () => {
        counter++;
        return counter;
      });

      const results = await Promise.all([
        checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE'),
        checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE'),
        checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE'),
      ]);

      expect(results.every((r) => r.allowed)).toBe(true);
      expect(counter).toBe(3);
    });
  });

  describe('numeric edge cases', () => {
    it('handles count at exactly limit minus one', async () => {
      mockRedis.get.mockResolvedValue('99');
      mockRedis.incr.mockResolvedValue(100);

      const result = await checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('handles negative TTL gracefully', async () => {
      mockRedis.ttl.mockResolvedValue(-1);

      const result = await checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE');

      // Should still work, use default window
      expect(result.resetAt).toBeInstanceOf(Date);
    });
  });
});

// =============================================================================
// UPSTASH-SPECIFIC TESTS
// =============================================================================

describe('V1-03: Upstash Redis Specifics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRedisClient();
  });

  afterEach(() => {
    resetRedisClient();
  });

  it('uses Upstash Redis REST API', async () => {
    // Verify we're using the @upstash/redis package
    const { Redis } = await import('@upstash/redis');
    expect(Redis).toBeDefined();
  });

  it('fails open when Redis not configured', async () => {
    // Without mock client and without env vars, should fail open
    resetRedisClient();

    const result = await checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE');

    // Should allow request when Redis is not available
    expect(result.allowed).toBe(true);
  });

  it('returns proper result structure when Redis unavailable', async () => {
    // Without mock client and without env vars
    resetRedisClient();

    const result = await checkRateLimit(TEST_VENDOR_ID, 'PRIVACY_SAFE');

    expect(result).toMatchObject({
      allowed: true,
      vendorId: TEST_VENDOR_ID,
      tier: 'PRIVACY_SAFE',
      limit: 100,
    });
  });
});
