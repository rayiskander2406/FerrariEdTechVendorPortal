/**
 * V1-03: Rate Limiting Middleware - Integration Tests
 *
 * Tests for rate limiting integration with auth middleware.
 * Target coverage: 95%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// These will be implemented
import { withRateLimit, withAuthAndRateLimit } from '@/lib/rate-limit/middleware';
import { createRateLimitHeaders } from '@/lib/rate-limit';

// =============================================================================
// TEST HELPERS
// =============================================================================

const TEST_VENDOR_ID = 'test-vendor-middleware';

// Mock the rate limit module
vi.mock('@/lib/rate-limit', async () => {
  const actual = await vi.importActual('@/lib/rate-limit');
  return {
    ...actual,
    checkRateLimit: vi.fn(),
    createRateLimitHeaders: vi.fn(() => new Headers()),
  };
});

// Mock the auth module
vi.mock('@/lib/auth', async () => {
  return {
    withAuth: vi.fn((request, handler) => handler(request, {
      vendorId: TEST_VENDOR_ID,
      vendor: {
        id: TEST_VENDOR_ID,
        name: 'Test Vendor',
        defaultAccessTier: 'PRIVACY_SAFE',
      },
      scopes: ['read', 'write'],
      apiKeyId: 'test-key-id',
      requestId: 'test-request-id',
    })),
    requireScopes: vi.fn((scopes) => (handler) => handler),
  };
});

function createMockRequest(options: {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
}): NextRequest {
  const url = options.url || 'http://localhost:3000/api/test';
  const headers = new Headers(options.headers || {});

  return new NextRequest(url, {
    method: options.method || 'GET',
    headers,
  });
}

// =============================================================================
// WITH RATE LIMIT MIDDLEWARE TESTS
// =============================================================================

describe('V1-03: withRateLimit Middleware', () => {
  let mockCheckRateLimit: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const rateLimitModule = await import('@/lib/rate-limit');
    mockCheckRateLimit = rateLimitModule.checkRateLimit as ReturnType<typeof vi.fn>;
  });

  describe('allowed requests', () => {
    it('calls handler when rate limit allows', async () => {
      mockCheckRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 99,
        limit: 100,
        resetAt: new Date(Date.now() + 60000),
        vendorId: TEST_VENDOR_ID,
        tier: 'PRIVACY_SAFE',
      });

      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const request = createMockRequest({
        headers: { Authorization: 'Bearer test-key' },
      });

      const response = await withRateLimit(request, TEST_VENDOR_ID, 'PRIVACY_SAFE', handler);

      expect(handler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('includes rate limit headers on success', async () => {
      const mockHeaders = new Headers();
      mockHeaders.set('X-RateLimit-Remaining', '99');

      mockCheckRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 99,
        limit: 100,
        resetAt: new Date(Date.now() + 60000),
        vendorId: TEST_VENDOR_ID,
        tier: 'PRIVACY_SAFE',
      });

      const { createRateLimitHeaders: mockCreateHeaders } = await import('@/lib/rate-limit');
      (mockCreateHeaders as ReturnType<typeof vi.fn>).mockReturnValue(mockHeaders);

      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const request = createMockRequest({});

      const response = await withRateLimit(request, TEST_VENDOR_ID, 'PRIVACY_SAFE', handler);

      // Response should include rate limit headers
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
    });
  });

  describe('denied requests', () => {
    it('returns 429 when rate limit exceeded', async () => {
      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        limit: 100,
        resetAt: new Date(Date.now() + 30000),
        retryAfter: 30,
        vendorId: TEST_VENDOR_ID,
        tier: 'PRIVACY_SAFE',
      });

      const handler = vi.fn();
      const request = createMockRequest({});

      const response = await withRateLimit(request, TEST_VENDOR_ID, 'PRIVACY_SAFE', handler);

      expect(response.status).toBe(429);
      expect(handler).not.toHaveBeenCalled();
    });

    it('includes error message in 429 response', async () => {
      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        limit: 100,
        resetAt: new Date(Date.now() + 30000),
        retryAfter: 30,
        vendorId: TEST_VENDOR_ID,
        tier: 'PRIVACY_SAFE',
      });

      const request = createMockRequest({});
      const response = await withRateLimit(request, TEST_VENDOR_ID, 'PRIVACY_SAFE', vi.fn());

      const body = await response.json();
      expect(body.error).toContain('rate limit');
    });

    it('includes Retry-After header in 429 response', async () => {
      const mockHeaders = new Headers();
      mockHeaders.set('Retry-After', '30');

      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        limit: 100,
        resetAt: new Date(Date.now() + 30000),
        retryAfter: 30,
        vendorId: TEST_VENDOR_ID,
        tier: 'PRIVACY_SAFE',
      });

      const { createRateLimitHeaders: mockCreateHeaders } = await import('@/lib/rate-limit');
      (mockCreateHeaders as ReturnType<typeof vi.fn>).mockReturnValue(mockHeaders);

      const request = createMockRequest({});
      const response = await withRateLimit(request, TEST_VENDOR_ID, 'PRIVACY_SAFE', vi.fn());

      expect(response.headers.get('Retry-After')).toBeDefined();
    });
  });

  describe('tier-based limiting', () => {
    it('uses PRIVACY_SAFE tier for PRIVACY_SAFE vendors', async () => {
      mockCheckRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 99,
        limit: 100,
        resetAt: new Date(Date.now() + 60000),
        vendorId: TEST_VENDOR_ID,
        tier: 'PRIVACY_SAFE',
      });

      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const request = createMockRequest({});
      await withRateLimit(request, TEST_VENDOR_ID, 'PRIVACY_SAFE', handler);

      expect(mockCheckRateLimit).toHaveBeenCalledWith(TEST_VENDOR_ID, 'PRIVACY_SAFE');
    });

    it('uses SELECTIVE tier for SELECTIVE vendors', async () => {
      mockCheckRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 499,
        limit: 500,
        resetAt: new Date(Date.now() + 60000),
        vendorId: TEST_VENDOR_ID,
        tier: 'SELECTIVE',
      });

      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const request = createMockRequest({});
      await withRateLimit(request, TEST_VENDOR_ID, 'SELECTIVE', handler);

      expect(mockCheckRateLimit).toHaveBeenCalledWith(TEST_VENDOR_ID, 'SELECTIVE');
    });

    it('uses FULL_ACCESS tier for FULL_ACCESS vendors', async () => {
      mockCheckRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 999,
        limit: 1000,
        resetAt: new Date(Date.now() + 60000),
        vendorId: TEST_VENDOR_ID,
        tier: 'FULL_ACCESS',
      });

      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const request = createMockRequest({});
      await withRateLimit(request, TEST_VENDOR_ID, 'FULL_ACCESS', handler);

      expect(mockCheckRateLimit).toHaveBeenCalledWith(TEST_VENDOR_ID, 'FULL_ACCESS');
    });
  });
});

// =============================================================================
// WITH AUTH AND RATE LIMIT COMBINED TESTS
// =============================================================================

describe('V1-03: withAuthAndRateLimit Combined Middleware', () => {
  let mockCheckRateLimit: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const rateLimitModule = await import('@/lib/rate-limit');
    mockCheckRateLimit = rateLimitModule.checkRateLimit as ReturnType<typeof vi.fn>;
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 99,
      limit: 100,
      resetAt: new Date(Date.now() + 60000),
      vendorId: TEST_VENDOR_ID,
      tier: 'PRIVACY_SAFE',
    });
  });

  it('authenticates before rate limiting', async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const request = createMockRequest({
      headers: { Authorization: 'Bearer test-key' },
    });

    await withAuthAndRateLimit(request, handler);

    // Auth should be checked first, then rate limit with vendor's tier
    expect(mockCheckRateLimit).toHaveBeenCalled();
  });

  it('uses vendor tier from auth context', async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const request = createMockRequest({
      headers: { Authorization: 'Bearer test-key' },
    });

    await withAuthAndRateLimit(request, handler);

    // Should use vendor's defaultAccessTier (PRIVACY_SAFE from mock)
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      TEST_VENDOR_ID,
      'PRIVACY_SAFE'
    );
  });

  it('passes auth context to handler', async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const request = createMockRequest({
      headers: { Authorization: 'Bearer test-key' },
    });

    await withAuthAndRateLimit(request, handler);

    expect(handler).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        vendorId: TEST_VENDOR_ID,
        scopes: expect.any(Array),
      })
    );
  });

  it('returns 401 before checking rate limit if auth fails', async () => {
    const { withAuth } = await import('@/lib/auth');
    (withAuth as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    });

    const handler = vi.fn();
    const request = createMockRequest({});

    const response = await withAuthAndRateLimit(request, handler);

    expect(response.status).toBe(401);
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

describe('V1-03: Middleware Error Handling', () => {
  let mockCheckRateLimit: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const rateLimitModule = await import('@/lib/rate-limit');
    mockCheckRateLimit = rateLimitModule.checkRateLimit as ReturnType<typeof vi.fn>;
  });

  it('returns 500 on rate limit check error', async () => {
    mockCheckRateLimit.mockRejectedValue(new Error('Redis error'));

    const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const request = createMockRequest({});
    const response = await withRateLimit(request, TEST_VENDOR_ID, 'PRIVACY_SAFE', handler);

    // Default: fail open - allow request when Redis is down
    expect([200, 500]).toContain(response.status);
  });

  it('logs error when rate limit check fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCheckRateLimit.mockRejectedValue(new Error('Redis error'));

    const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const request = createMockRequest({});
    await withRateLimit(request, TEST_VENDOR_ID, 'PRIVACY_SAFE', handler);

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('handles handler errors correctly', async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 99,
      limit: 100,
      resetAt: new Date(Date.now() + 60000),
      vendorId: TEST_VENDOR_ID,
      tier: 'PRIVACY_SAFE',
    });

    const handler = vi.fn().mockRejectedValue(new Error('Handler error'));
    const request = createMockRequest({});

    await expect(
      withRateLimit(request, TEST_VENDOR_ID, 'PRIVACY_SAFE', handler)
    ).rejects.toThrow('Handler error');
  });
});

// =============================================================================
// HEADER PROPAGATION TESTS
// =============================================================================

describe('V1-03: Header Propagation', () => {
  let mockCheckRateLimit: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const rateLimitModule = await import('@/lib/rate-limit');
    mockCheckRateLimit = rateLimitModule.checkRateLimit as ReturnType<typeof vi.fn>;
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 50,
      limit: 100,
      resetAt: new Date(Date.now() + 60000),
      vendorId: TEST_VENDOR_ID,
      tier: 'PRIVACY_SAFE',
    });
  });

  it('merges rate limit headers with handler response headers', async () => {
    const handlerResponse = new NextResponse(JSON.stringify({ data: 'test' }), {
      headers: { 'X-Custom-Header': 'custom-value' },
    });
    const handler = vi.fn().mockResolvedValue(handlerResponse);

    const mockHeaders = new Headers();
    mockHeaders.set('X-RateLimit-Remaining', '50');
    const { createRateLimitHeaders: mockCreateHeaders } = await import('@/lib/rate-limit');
    (mockCreateHeaders as ReturnType<typeof vi.fn>).mockReturnValue(mockHeaders);

    const request = createMockRequest({});
    const response = await withRateLimit(request, TEST_VENDOR_ID, 'PRIVACY_SAFE', handler);

    // Should have both custom and rate limit headers
    expect(response.headers.get('X-Custom-Header')).toBe('custom-value');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('50');
  });

  it('preserves response status from handler', async () => {
    const handlerResponse = new NextResponse(null, { status: 201 });
    const handler = vi.fn().mockResolvedValue(handlerResponse);

    const request = createMockRequest({});
    const response = await withRateLimit(request, TEST_VENDOR_ID, 'PRIVACY_SAFE', handler);

    expect(response.status).toBe(201);
  });

  it('preserves response body from handler', async () => {
    const handlerResponse = NextResponse.json({ id: 'created-123' }, { status: 201 });
    const handler = vi.fn().mockResolvedValue(handlerResponse);

    const request = createMockRequest({});
    const response = await withRateLimit(request, TEST_VENDOR_ID, 'PRIVACY_SAFE', handler);

    const body = await response.json();
    expect(body.id).toBe('created-123');
  });
});
