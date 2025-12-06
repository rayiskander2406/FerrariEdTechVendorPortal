/**
 * Pricing API Tests
 *
 * V1-06: Integration tests for pricing API endpoints.
 *
 * Tests cover:
 * - GET /api/pricing - Get pricing tiers
 * - POST /api/pricing/estimate - Estimate costs
 * - GET /api/pricing/usage - Get current usage
 * - GET /api/pricing/usage/history - Get usage history
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth middleware
vi.mock('@/lib/auth', () => ({
  withAuth: vi.fn((req, handler) => {
    return handler(req, {
      vendorId: 'vendor-123',
      apiKeyId: 'key-123',
      permissions: ['messages:send', 'usage:read'],
      tier: 'PRIVACY_SAFE',
      requestId: 'req-123',
    });
  }),
}));

// Mock rate limiting
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 99,
    limit: 100,
  }),
}));

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    vendorUsage: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    vendor: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      vendorUsage: {
        findFirst: vi.fn(),
        upsert: vi.fn(),
      },
    })),
  },
}));

import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

// Import handlers after mocks
import { GET as getPricing, POST as postEstimate } from '@/app/api/pricing/route';
import { GET as getUsage } from '@/app/api/pricing/usage/route';
import { GET as getUsageHistory } from '@/app/api/pricing/usage/history/route';

describe('Pricing API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // GET /api/pricing - Get Pricing Tiers
  // ===========================================================================

  describe('GET /api/pricing', () => {
    it('returns pricing tiers', async () => {
      const request = new NextRequest('http://localhost/api/pricing');
      const response = await getPricing(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.tiers).toBeDefined();
      expect(data.tiers.length).toBeGreaterThanOrEqual(4);
    });

    it('includes base prices', async () => {
      const request = new NextRequest('http://localhost/api/pricing');
      const response = await getPricing(request);

      const data = await response.json();
      expect(data.basePrices).toBeDefined();
      expect(data.basePrices.email).toBeGreaterThan(0);
      expect(data.basePrices.sms).toBeGreaterThan(0);
    });

    it('includes tier details', async () => {
      const request = new NextRequest('http://localhost/api/pricing');
      const response = await getPricing(request);

      const data = await response.json();
      const tier = data.tiers[0];

      expect(tier).toHaveProperty('name');
      expect(tier).toHaveProperty('minVolume');
      expect(tier).toHaveProperty('maxVolume');
      expect(tier).toHaveProperty('discountPercent');
    });

    it('includes request ID in response', async () => {
      const request = new NextRequest('http://localhost/api/pricing');
      const response = await getPricing(request);

      const data = await response.json();
      expect(data.requestId).toBe('req-123');
    });
  });

  // ===========================================================================
  // POST /api/pricing/estimate - Estimate Costs
  // ===========================================================================

  describe('POST /api/pricing/estimate', () => {
    it('estimates cost for email batch', async () => {
      const request = new NextRequest('http://localhost/api/pricing/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'EMAIL',
          messageCount: 1000,
        }),
      });

      const response = await postEstimate(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.estimate).toBeDefined();
      expect(data.estimate.messageCount).toBe(1000);
      expect(data.estimate.totalCost).toBeGreaterThan(0);
      expect(data.estimate.tier).toBeDefined();
    });

    it('estimates cost for SMS batch', async () => {
      const request = new NextRequest('http://localhost/api/pricing/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'SMS',
          messageCount: 500,
        }),
      });

      const response = await postEstimate(request);

      const data = await response.json();
      expect(data.estimate.totalCost).toBeGreaterThan(0);
    });

    it('uses current volume for tier calculation', async () => {
      vi.mocked(prisma.vendorUsage.findFirst).mockResolvedValue({
        id: 'usage-123',
        vendorId: 'vendor-123',
        month: '2024-01',
        emailCount: 50000,
        smsCount: 10000,
        totalCost: 450.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost/api/pricing/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'EMAIL',
          messageCount: 1000,
        }),
      });

      const response = await postEstimate(request);

      const data = await response.json();
      // With 60k total messages, should be in SCALE tier
      expect(data.estimate.tier).toBe('SCALE');
      expect(data.estimate.discountPercent).toBe(20);
    });

    it('estimates monthly cost for mixed usage', async () => {
      const request = new NextRequest('http://localhost/api/pricing/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'monthly',
          emailCount: 10000,
          smsCount: 5000,
        }),
      });

      const response = await postEstimate(request);

      const data = await response.json();
      expect(data.estimate.emailCost).toBeGreaterThan(0);
      expect(data.estimate.smsCost).toBeGreaterThan(0);
      expect(data.estimate.totalCost).toBe(
        data.estimate.emailCost + data.estimate.smsCost
      );
    });

    it('validates required fields', async () => {
      const request = new NextRequest('http://localhost/api/pricing/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await postEstimate(request);

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('validates channel type', async () => {
      const request = new NextRequest('http://localhost/api/pricing/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'INVALID',
          messageCount: 100,
        }),
      });

      const response = await postEstimate(request);

      expect(response.status).toBe(400);
    });

    it('validates message count is positive', async () => {
      const request = new NextRequest('http://localhost/api/pricing/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'EMAIL',
          messageCount: -100,
        }),
      });

      const response = await postEstimate(request);

      expect(response.status).toBe(400);
    });

    it('includes savings compared to starter tier', async () => {
      vi.mocked(prisma.vendorUsage.findFirst).mockResolvedValue({
        id: 'usage-123',
        vendorId: 'vendor-123',
        month: '2024-01',
        emailCount: 100000,
        smsCount: 50000,
        totalCost: 1000.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost/api/pricing/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'EMAIL',
          messageCount: 10000,
        }),
      });

      const response = await postEstimate(request);

      const data = await response.json();
      expect(data.estimate.savings).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // GET /api/pricing/usage - Get Current Usage
  // ===========================================================================

  describe('GET /api/pricing/usage', () => {
    it('returns current month usage', async () => {
      vi.mocked(prisma.vendorUsage.findFirst).mockResolvedValue({
        id: 'usage-123',
        vendorId: 'vendor-123',
        month: '2024-01',
        emailCount: 5000,
        smsCount: 1000,
        totalCost: 75.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost/api/pricing/usage');
      const response = await getUsage(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.usage).toBeDefined();
      expect(data.usage.emailCount).toBe(5000);
      expect(data.usage.smsCount).toBe(1000);
      expect(data.usage.totalMessages).toBe(6000);
      expect(data.usage.totalCost).toBe(75.00);
    });

    it('returns zero usage for new vendor', async () => {
      vi.mocked(prisma.vendorUsage.findFirst).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/pricing/usage');
      const response = await getUsage(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.usage.emailCount).toBe(0);
      expect(data.usage.smsCount).toBe(0);
      expect(data.usage.totalCost).toBe(0);
    });

    it('includes current tier information', async () => {
      vi.mocked(prisma.vendorUsage.findFirst).mockResolvedValue({
        id: 'usage-123',
        vendorId: 'vendor-123',
        month: '2024-01',
        emailCount: 50000,
        smsCount: 10000,
        totalCost: 450.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost/api/pricing/usage');
      const response = await getUsage(request);

      const data = await response.json();
      expect(data.usage.tier).toBe('SCALE');
      expect(data.usage.discountPercent).toBe(20);
    });

    it('includes billing period information', async () => {
      vi.mocked(prisma.vendorUsage.findFirst).mockResolvedValue({
        id: 'usage-123',
        vendorId: 'vendor-123',
        month: '2024-01',
        emailCount: 1000,
        smsCount: 500,
        totalCost: 30.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost/api/pricing/usage');
      const response = await getUsage(request);

      const data = await response.json();
      expect(data.billingPeriod).toBeDefined();
      expect(data.billingPeriod.month).toMatch(/^\d{4}-\d{2}$/);
      expect(data.billingPeriod.daysRemaining).toBeGreaterThanOrEqual(0);
    });

    it('includes channel breakdown', async () => {
      vi.mocked(prisma.vendorUsage.findFirst).mockResolvedValue({
        id: 'usage-123',
        vendorId: 'vendor-123',
        month: '2024-01',
        emailCount: 8000,
        smsCount: 2000,
        totalCost: 100.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost/api/pricing/usage');
      const response = await getUsage(request);

      const data = await response.json();
      expect(data.breakdown).toBeDefined();
      expect(data.breakdown.email.count).toBe(8000);
      expect(data.breakdown.email.percentage).toBe(80);
      expect(data.breakdown.sms.count).toBe(2000);
      expect(data.breakdown.sms.percentage).toBe(20);
    });
  });

  // ===========================================================================
  // GET /api/pricing/usage/history - Get Usage History
  // ===========================================================================

  describe('GET /api/pricing/usage/history', () => {
    it('returns usage history', async () => {
      const mockHistory = [
        {
          id: 'usage-3',
          vendorId: 'vendor-123',
          month: '2024-01',
          emailCount: 5000,
          smsCount: 1000,
          totalCost: 75.00,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'usage-2',
          vendorId: 'vendor-123',
          month: '2023-12',
          emailCount: 4500,
          smsCount: 800,
          totalCost: 65.00,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.vendorUsage.findMany).mockResolvedValue(mockHistory);

      const request = new NextRequest('http://localhost/api/pricing/usage/history');
      const response = await getUsageHistory(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.history).toBeDefined();
      expect(data.history.length).toBe(2);
    });

    it('respects months query parameter', async () => {
      vi.mocked(prisma.vendorUsage.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/pricing/usage/history?months=6');
      await getUsageHistory(request);

      expect(prisma.vendorUsage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 6,
        })
      );
    });

    it('defaults to 12 months', async () => {
      vi.mocked(prisma.vendorUsage.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/pricing/usage/history');
      await getUsageHistory(request);

      expect(prisma.vendorUsage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 12,
        })
      );
    });

    it('limits to max 24 months', async () => {
      vi.mocked(prisma.vendorUsage.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/pricing/usage/history?months=36');
      await getUsageHistory(request);

      expect(prisma.vendorUsage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 24,
        })
      );
    });

    it('returns empty array for new vendor', async () => {
      vi.mocked(prisma.vendorUsage.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/pricing/usage/history');
      const response = await getUsageHistory(request);

      const data = await response.json();
      expect(data.history).toEqual([]);
    });

    it('includes growth rate for each month', async () => {
      const mockHistory = [
        {
          id: 'usage-2',
          vendorId: 'vendor-123',
          month: '2024-01',
          emailCount: 6000,
          smsCount: 1200,
          totalCost: 90.00,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'usage-1',
          vendorId: 'vendor-123',
          month: '2023-12',
          emailCount: 5000,
          smsCount: 1000,
          totalCost: 75.00,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.vendorUsage.findMany).mockResolvedValue(mockHistory);

      const request = new NextRequest('http://localhost/api/pricing/usage/history');
      const response = await getUsageHistory(request);

      const data = await response.json();
      expect(data.history[0].growthRate).toBeDefined();
    });

    it('includes summary statistics', async () => {
      const mockHistory = [
        {
          id: 'usage-2',
          vendorId: 'vendor-123',
          month: '2024-01',
          emailCount: 6000,
          smsCount: 1200,
          totalCost: 90.00,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'usage-1',
          vendorId: 'vendor-123',
          month: '2023-12',
          emailCount: 5000,
          smsCount: 1000,
          totalCost: 75.00,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.vendorUsage.findMany).mockResolvedValue(mockHistory);

      const request = new NextRequest('http://localhost/api/pricing/usage/history');
      const response = await getUsageHistory(request);

      const data = await response.json();
      expect(data.summary).toBeDefined();
      expect(data.summary.totalMessages).toBe(13200);
      expect(data.summary.totalCost).toBe(165.00);
      expect(data.summary.averageMonthlyMessages).toBe(6600);
    });
  });

  // ===========================================================================
  // RATE LIMITING
  // ===========================================================================

  describe('Rate Limiting', () => {
    it('returns 429 when rate limited', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        limit: 100,
        retryAfter: 60,
      });

      const request = new NextRequest('http://localhost/api/pricing/usage');
      const response = await getUsage(request);

      expect(response.status).toBe(429);

      const data = await response.json();
      expect(data.error).toBe('Rate limit exceeded');
    });

    it('includes rate limit headers', async () => {
      // Reset rate limit mock to default (allowed)
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 99,
        limit: 100,
      });
      vi.mocked(prisma.vendorUsage.findFirst).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/pricing/usage');
      const response = await getUsage(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('99');
    });
  });

  // ===========================================================================
  // AUTHENTICATION
  // ===========================================================================

  describe('Authentication', () => {
    it('requires authentication for usage endpoint', async () => {
      vi.mocked(withAuth).mockImplementation((req, handler) => {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      });

      const request = new NextRequest('http://localhost/api/pricing/usage');
      const response = await getUsage(request);

      expect(response.status).toBe(401);
    });

    it('requires authentication for estimate endpoint', async () => {
      vi.mocked(withAuth).mockImplementation((req, handler) => {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      });

      const request = new NextRequest('http://localhost/api/pricing/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'EMAIL', messageCount: 100 }),
      });

      const response = await postEstimate(request);

      expect(response.status).toBe(401);
    });
  });
});

// Need to import NextResponse for auth mock
import { NextResponse } from 'next/server';
