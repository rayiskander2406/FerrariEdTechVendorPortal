/**
 * Usage Tracking Tests
 *
 * V1-06: Unit tests for usage tracking.
 *
 * Tests cover:
 * - Recording message usage per vendor
 * - Getting current month usage
 * - Usage history queries
 * - Usage aggregation by channel
 * - Billing period calculations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    vendorUsage: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      aggregate: vi.fn(),
    },
    vendor: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      vendorUsage: {
        findFirst: vi.fn(),
        upsert: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    })),
  },
}));

import { prisma } from '@/lib/db';
import {
  recordUsage,
  getCurrentMonthUsage,
  getUsageHistory,
  getUsageByChannel,
  getBillingPeriod,
  resetMonthlyUsage,
  type UsageRecord,
  type UsageSummary,
} from '@/lib/pricing/usage';

describe('Usage Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // RECORD USAGE
  // ===========================================================================

  describe('recordUsage', () => {
    it('creates usage record for new vendor/month', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const txPrisma = {
          vendorUsage: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({
              id: 'usage-123',
              vendorId: 'vendor-123',
              month: '2024-01',
              emailCount: 100,
              smsCount: 0,
              totalCost: 0.50,
            }),
          },
        };
        return callback(txPrisma);
      });

      const result = await recordUsage({
        vendorId: 'vendor-123',
        channel: 'EMAIL',
        messageCount: 100,
        cost: 0.50,
      });

      expect(result.emailCount).toBe(100);
      expect(result.smsCount).toBe(0);
      expect(result.totalCost).toBe(0.50);
    });

    it('updates existing usage record', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const txPrisma = {
          vendorUsage: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'usage-123',
              vendorId: 'vendor-123',
              month: '2024-01',
              emailCount: 500,
              smsCount: 100,
              totalCost: 15.00,
            }),
            update: vi.fn().mockResolvedValue({
              id: 'usage-123',
              vendorId: 'vendor-123',
              month: '2024-01',
              emailCount: 600,
              smsCount: 100,
              totalCost: 15.50,
            }),
          },
        };
        return callback(txPrisma);
      });

      const result = await recordUsage({
        vendorId: 'vendor-123',
        channel: 'EMAIL',
        messageCount: 100,
        cost: 0.50,
      });

      expect(result.emailCount).toBe(600);
      expect(result.totalCost).toBe(15.50);
    });

    it('increments SMS count for SMS channel', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const txPrisma = {
          vendorUsage: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'usage-123',
              vendorId: 'vendor-123',
              month: '2024-01',
              emailCount: 500,
              smsCount: 100,
              totalCost: 15.00,
            }),
            update: vi.fn().mockResolvedValue({
              id: 'usage-123',
              vendorId: 'vendor-123',
              month: '2024-01',
              emailCount: 500,
              smsCount: 150,
              totalCost: 17.50,
            }),
          },
        };
        return callback(txPrisma);
      });

      const result = await recordUsage({
        vendorId: 'vendor-123',
        channel: 'SMS',
        messageCount: 50,
        cost: 2.50,
      });

      expect(result.smsCount).toBe(150);
      expect(result.emailCount).toBe(500);
    });

    it('handles batch recording', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const txPrisma = {
          vendorUsage: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({
              id: 'usage-123',
              vendorId: 'vendor-123',
              month: '2024-01',
              emailCount: 5000,
              smsCount: 0,
              totalCost: 22.50,
            }),
          },
        };
        return callback(txPrisma);
      });

      const result = await recordUsage({
        vendorId: 'vendor-123',
        channel: 'EMAIL',
        messageCount: 5000,
        cost: 22.50,
        batchId: 'batch-123',
      });

      expect(result.emailCount).toBe(5000);
    });
  });

  // ===========================================================================
  // GET CURRENT MONTH USAGE
  // ===========================================================================

  describe('getCurrentMonthUsage', () => {
    it('returns current month usage for vendor', async () => {
      const mockUsage = {
        id: 'usage-123',
        vendorId: 'vendor-123',
        month: '2024-01',
        emailCount: 5000,
        smsCount: 1000,
        totalCost: 75.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.vendorUsage.findFirst).mockResolvedValue(mockUsage);

      const result = await getCurrentMonthUsage('vendor-123');

      expect(result).toBeDefined();
      expect(result!.emailCount).toBe(5000);
      expect(result!.smsCount).toBe(1000);
      expect(result!.totalMessages).toBe(6000);
      expect(result!.totalCost).toBe(75.00);
    });

    it('returns null for vendor with no usage', async () => {
      vi.mocked(prisma.vendorUsage.findFirst).mockResolvedValue(null);

      const result = await getCurrentMonthUsage('new-vendor');

      expect(result).toBeNull();
    });

    it('includes tier information', async () => {
      const mockUsage = {
        id: 'usage-123',
        vendorId: 'vendor-123',
        month: '2024-01',
        emailCount: 50000,
        smsCount: 10000,
        totalCost: 450.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.vendorUsage.findFirst).mockResolvedValue(mockUsage);

      const result = await getCurrentMonthUsage('vendor-123');

      expect(result!.tier).toBe('SCALE');
      expect(result!.discountPercent).toBe(20);
    });

    it('calculates days remaining in billing period', async () => {
      const mockUsage = {
        id: 'usage-123',
        vendorId: 'vendor-123',
        month: '2024-01',
        emailCount: 1000,
        smsCount: 500,
        totalCost: 30.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.vendorUsage.findFirst).mockResolvedValue(mockUsage);

      const result = await getCurrentMonthUsage('vendor-123');

      expect(result!.daysRemaining).toBeDefined();
      expect(result!.daysRemaining).toBeGreaterThanOrEqual(0);
      expect(result!.daysRemaining).toBeLessThanOrEqual(31);
    });
  });

  // ===========================================================================
  // GET USAGE HISTORY
  // ===========================================================================

  describe('getUsageHistory', () => {
    it('returns usage history for vendor', async () => {
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
        {
          id: 'usage-1',
          vendorId: 'vendor-123',
          month: '2023-11',
          emailCount: 4000,
          smsCount: 600,
          totalCost: 55.00,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.vendorUsage.findMany).mockResolvedValue(mockHistory);

      const result = await getUsageHistory('vendor-123', 3);

      expect(result.length).toBe(3);
      expect(result[0].month).toBe('2024-01');
      expect(result[2].month).toBe('2023-11');
    });

    it('limits results to specified months', async () => {
      vi.mocked(prisma.vendorUsage.findMany).mockResolvedValue([]);

      await getUsageHistory('vendor-123', 6);

      expect(prisma.vendorUsage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 6,
        })
      );
    });

    it('returns empty array for vendor with no history', async () => {
      vi.mocked(prisma.vendorUsage.findMany).mockResolvedValue([]);

      const result = await getUsageHistory('new-vendor', 12);

      expect(result).toEqual([]);
    });

    it('includes month-over-month growth rate', async () => {
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

      const result = await getUsageHistory('vendor-123', 2);

      expect(result[0].growthRate).toBeDefined();
      // 7200 vs 6000 = 20% growth
      expect(result[0].growthRate).toBeCloseTo(0.20, 2);
    });
  });

  // ===========================================================================
  // GET USAGE BY CHANNEL
  // ===========================================================================

  describe('getUsageByChannel', () => {
    it('aggregates usage by channel', async () => {
      const mockUsage = {
        id: 'usage-123',
        vendorId: 'vendor-123',
        month: '2024-01',
        emailCount: 10000,
        smsCount: 2000,
        totalCost: 150.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.vendorUsage.findFirst).mockResolvedValue(mockUsage);

      const result = await getUsageByChannel('vendor-123');

      expect(result.email.count).toBe(10000);
      expect(result.sms.count).toBe(2000);
      expect(result.email.percentage).toBeCloseTo(83.33, 1);
      expect(result.sms.percentage).toBeCloseTo(16.67, 1);
    });

    it('returns zero for vendor with no usage', async () => {
      vi.mocked(prisma.vendorUsage.findFirst).mockResolvedValue(null);

      const result = await getUsageByChannel('new-vendor');

      expect(result.email.count).toBe(0);
      expect(result.sms.count).toBe(0);
      expect(result.email.percentage).toBe(0);
      expect(result.sms.percentage).toBe(0);
    });

    it('handles email-only usage', async () => {
      const mockUsage = {
        id: 'usage-123',
        vendorId: 'vendor-123',
        month: '2024-01',
        emailCount: 5000,
        smsCount: 0,
        totalCost: 25.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.vendorUsage.findFirst).mockResolvedValue(mockUsage);

      const result = await getUsageByChannel('vendor-123');

      expect(result.email.count).toBe(5000);
      expect(result.email.percentage).toBe(100);
      expect(result.sms.count).toBe(0);
      expect(result.sms.percentage).toBe(0);
    });
  });

  // ===========================================================================
  // GET BILLING PERIOD
  // ===========================================================================

  describe('getBillingPeriod', () => {
    it('returns current billing period', () => {
      const period = getBillingPeriod();

      expect(period.startDate).toBeInstanceOf(Date);
      expect(period.endDate).toBeInstanceOf(Date);
      expect(period.month).toMatch(/^\d{4}-\d{2}$/);
    });

    it('start date is first of month', () => {
      const period = getBillingPeriod();

      expect(period.startDate.getDate()).toBe(1);
    });

    it('end date is last day of month', () => {
      const period = getBillingPeriod();

      const nextMonth = new Date(period.endDate);
      nextMonth.setDate(nextMonth.getDate() + 1);

      expect(nextMonth.getDate()).toBe(1);
    });

    it('calculates days remaining correctly', () => {
      const period = getBillingPeriod();

      const today = new Date();
      const endOfMonth = period.endDate;
      const expectedDays = Math.ceil(
        (endOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(period.daysRemaining).toBeGreaterThanOrEqual(0);
      expect(period.daysRemaining).toBeLessThanOrEqual(31);
    });

    it('returns specific month when provided', () => {
      const period = getBillingPeriod('2024-06');

      expect(period.month).toBe('2024-06');
      expect(period.startDate.getMonth()).toBe(5); // June is month 5
      expect(period.startDate.getFullYear()).toBe(2024);
    });
  });

  // ===========================================================================
  // RESET MONTHLY USAGE
  // ===========================================================================

  describe('resetMonthlyUsage', () => {
    it('creates new month record with zero counts', async () => {
      vi.mocked(prisma.vendorUsage.create).mockResolvedValue({
        id: 'usage-new',
        vendorId: 'vendor-123',
        month: '2024-02',
        emailCount: 0,
        smsCount: 0,
        totalCost: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await resetMonthlyUsage('vendor-123', '2024-02');

      expect(result.emailCount).toBe(0);
      expect(result.smsCount).toBe(0);
      expect(result.totalCost).toBe(0);
    });

    it('preserves previous month data', async () => {
      const previousMonth = {
        id: 'usage-old',
        vendorId: 'vendor-123',
        month: '2024-01',
        emailCount: 10000,
        smsCount: 2000,
        totalCost: 150.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.vendorUsage.findFirst).mockResolvedValue(previousMonth);
      vi.mocked(prisma.vendorUsage.create).mockResolvedValue({
        id: 'usage-new',
        vendorId: 'vendor-123',
        month: '2024-02',
        emailCount: 0,
        smsCount: 0,
        totalCost: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await resetMonthlyUsage('vendor-123', '2024-02');

      // Previous month should not be modified
      expect(prisma.vendorUsage.update).not.toHaveBeenCalled();
    });
  });
});
