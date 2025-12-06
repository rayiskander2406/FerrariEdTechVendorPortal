/**
 * Pricing Engine Tests
 *
 * V1-06: Unit tests for pricing calculations.
 *
 * Tests cover:
 * - Tier definitions and pricing structure
 * - Single message cost calculation
 * - Batch cost calculation with volume discounts
 * - Cost estimation for planned sends
 * - Channel-specific pricing (EMAIL vs SMS)
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
import {
  PRICING_TIERS,
  EMAIL_BASE_PRICE,
  SMS_BASE_PRICE,
  getTierForVolume,
  getDiscountRate,
  calculateMessageCost,
  calculateBatchCost,
  estimateMonthlyCost,
  type PricingTier,
} from '@/lib/pricing';

describe('Pricing Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // PRICING TIERS
  // ===========================================================================

  describe('Pricing Tiers', () => {
    it('defines correct tier structure', () => {
      expect(PRICING_TIERS).toBeDefined();
      expect(PRICING_TIERS.length).toBeGreaterThanOrEqual(4);

      // Each tier should have required fields
      PRICING_TIERS.forEach((tier: PricingTier) => {
        expect(tier).toHaveProperty('name');
        expect(tier).toHaveProperty('minVolume');
        expect(tier).toHaveProperty('maxVolume');
        expect(tier).toHaveProperty('discountPercent');
      });
    });

    it('has starter tier with no discount', () => {
      const starterTier = PRICING_TIERS.find((t: PricingTier) => t.name === 'STARTER');
      expect(starterTier).toBeDefined();
      expect(starterTier!.minVolume).toBe(0);
      expect(starterTier!.discountPercent).toBe(0);
    });

    it('has growth tier with 10% discount', () => {
      const growthTier = PRICING_TIERS.find((t: PricingTier) => t.name === 'GROWTH');
      expect(growthTier).toBeDefined();
      expect(growthTier!.discountPercent).toBe(10);
    });

    it('has scale tier with 20% discount', () => {
      const scaleTier = PRICING_TIERS.find((t: PricingTier) => t.name === 'SCALE');
      expect(scaleTier).toBeDefined();
      expect(scaleTier!.discountPercent).toBe(20);
    });

    it('has enterprise tier with 30% discount', () => {
      const enterpriseTier = PRICING_TIERS.find((t: PricingTier) => t.name === 'ENTERPRISE');
      expect(enterpriseTier).toBeDefined();
      expect(enterpriseTier!.discountPercent).toBe(30);
    });

    it('tiers are ordered by volume', () => {
      for (let i = 1; i < PRICING_TIERS.length; i++) {
        expect(PRICING_TIERS[i].minVolume).toBeGreaterThan(PRICING_TIERS[i - 1].minVolume);
      }
    });
  });

  // ===========================================================================
  // BASE PRICES
  // ===========================================================================

  describe('Base Prices', () => {
    it('defines email base price', () => {
      expect(EMAIL_BASE_PRICE).toBeDefined();
      expect(EMAIL_BASE_PRICE).toBeGreaterThan(0);
      expect(EMAIL_BASE_PRICE).toBeLessThan(0.01); // Less than 1 cent
    });

    it('defines SMS base price', () => {
      expect(SMS_BASE_PRICE).toBeDefined();
      expect(SMS_BASE_PRICE).toBeGreaterThan(0);
      expect(SMS_BASE_PRICE).toBeGreaterThan(EMAIL_BASE_PRICE); // SMS more expensive
    });

    it('SMS is at least 10x more expensive than email', () => {
      expect(SMS_BASE_PRICE / EMAIL_BASE_PRICE).toBeGreaterThanOrEqual(10);
    });
  });

  // ===========================================================================
  // GET TIER FOR VOLUME
  // ===========================================================================

  describe('getTierForVolume', () => {
    it('returns starter tier for 0 messages', () => {
      const tier = getTierForVolume(0);
      expect(tier.name).toBe('STARTER');
    });

    it('returns starter tier for 500 messages', () => {
      const tier = getTierForVolume(500);
      expect(tier.name).toBe('STARTER');
    });

    it('returns growth tier for 5,000 messages', () => {
      const tier = getTierForVolume(5000);
      expect(tier.name).toBe('GROWTH');
    });

    it('returns scale tier for 50,000 messages', () => {
      const tier = getTierForVolume(50000);
      expect(tier.name).toBe('SCALE');
    });

    it('returns enterprise tier for 500,000 messages', () => {
      const tier = getTierForVolume(500000);
      expect(tier.name).toBe('ENTERPRISE');
    });

    it('handles edge cases at tier boundaries', () => {
      // At exactly 1000 (boundary)
      const tier1000 = getTierForVolume(1000);
      expect(tier1000.name).toBe('STARTER');

      // At exactly 1001 (boundary)
      const tier1001 = getTierForVolume(1001);
      expect(tier1001.name).toBe('GROWTH');
    });
  });

  // ===========================================================================
  // GET DISCOUNT RATE
  // ===========================================================================

  describe('getDiscountRate', () => {
    it('returns 0 discount for starter tier', () => {
      const discount = getDiscountRate(500);
      expect(discount).toBe(0);
    });

    it('returns 0.10 discount for growth tier', () => {
      const discount = getDiscountRate(5000);
      expect(discount).toBe(0.10);
    });

    it('returns 0.20 discount for scale tier', () => {
      const discount = getDiscountRate(50000);
      expect(discount).toBe(0.20);
    });

    it('returns 0.30 discount for enterprise tier', () => {
      const discount = getDiscountRate(500000);
      expect(discount).toBe(0.30);
    });
  });

  // ===========================================================================
  // CALCULATE MESSAGE COST
  // ===========================================================================

  describe('calculateMessageCost', () => {
    it('calculates email cost at starter tier', () => {
      const cost = calculateMessageCost('EMAIL', 0);
      expect(cost).toBe(EMAIL_BASE_PRICE);
    });

    it('calculates SMS cost at starter tier', () => {
      const cost = calculateMessageCost('SMS', 0);
      expect(cost).toBe(SMS_BASE_PRICE);
    });

    it('applies 10% discount for growth tier email', () => {
      const cost = calculateMessageCost('EMAIL', 5000);
      expect(cost).toBe(EMAIL_BASE_PRICE * 0.90);
    });

    it('applies 20% discount for scale tier SMS', () => {
      const cost = calculateMessageCost('SMS', 50000);
      expect(cost).toBe(SMS_BASE_PRICE * 0.80);
    });

    it('applies 30% discount for enterprise tier', () => {
      const emailCost = calculateMessageCost('EMAIL', 500000);
      expect(emailCost).toBe(EMAIL_BASE_PRICE * 0.70);

      const smsCost = calculateMessageCost('SMS', 500000);
      expect(smsCost).toBe(SMS_BASE_PRICE * 0.70);
    });

    it('throws for invalid channel', () => {
      expect(() => calculateMessageCost('INVALID' as any, 0)).toThrow('Invalid channel');
    });
  });

  // ===========================================================================
  // CALCULATE BATCH COST
  // ===========================================================================

  describe('calculateBatchCost', () => {
    it('calculates cost for small email batch at starter tier', () => {
      const result = calculateBatchCost('EMAIL', 100, 0);

      expect(result.messageCount).toBe(100);
      expect(result.unitCost).toBe(EMAIL_BASE_PRICE);
      expect(result.totalCost).toBe(EMAIL_BASE_PRICE * 100);
      expect(result.tier).toBe('STARTER');
      expect(result.discountPercent).toBe(0);
    });

    it('calculates cost for medium SMS batch at growth tier', () => {
      const result = calculateBatchCost('SMS', 500, 2000);

      expect(result.messageCount).toBe(500);
      expect(result.unitCost).toBe(SMS_BASE_PRICE * 0.90);
      expect(result.totalCost).toBe(SMS_BASE_PRICE * 0.90 * 500);
      expect(result.tier).toBe('GROWTH');
      expect(result.discountPercent).toBe(10);
    });

    it('calculates cost for large batch at scale tier', () => {
      const result = calculateBatchCost('EMAIL', 5000, 20000);

      expect(result.messageCount).toBe(5000);
      expect(result.tier).toBe('SCALE');
      expect(result.discountPercent).toBe(20);
      expect(result.totalCost).toBe(EMAIL_BASE_PRICE * 0.80 * 5000);
    });

    it('calculates cost for enterprise batch', () => {
      // ENTERPRISE tier starts at 100001 messages
      const result = calculateBatchCost('SMS', 10000, 100001);

      expect(result.tier).toBe('ENTERPRISE');
      expect(result.discountPercent).toBe(30);
      expect(result.totalCost).toBe(SMS_BASE_PRICE * 0.70 * 10000);
    });

    it('uses currentVolume to determine tier', () => {
      // Same batch size, different current volumes
      const starterResult = calculateBatchCost('EMAIL', 100, 0);
      const enterpriseResult = calculateBatchCost('EMAIL', 100, 500000);

      expect(starterResult.tier).toBe('STARTER');
      expect(enterpriseResult.tier).toBe('ENTERPRISE');
      expect(enterpriseResult.totalCost).toBeLessThan(starterResult.totalCost);
    });

    it('includes savings calculation', () => {
      const result = calculateBatchCost('EMAIL', 1000, 50000);

      expect(result.savings).toBeDefined();
      const baseCost = EMAIL_BASE_PRICE * 1000;
      const expectedSavings = baseCost - result.totalCost;
      expect(result.savings).toBeCloseTo(expectedSavings, 6);
    });

    it('returns zero savings at starter tier', () => {
      const result = calculateBatchCost('EMAIL', 100, 0);
      expect(result.savings).toBe(0);
    });
  });

  // ===========================================================================
  // ESTIMATE MONTHLY COST
  // ===========================================================================

  describe('estimateMonthlyCost', () => {
    it('estimates cost for email-only usage', () => {
      const result = estimateMonthlyCost({
        emailCount: 10000,
        smsCount: 0,
      });

      expect(result.emailCost).toBeGreaterThan(0);
      expect(result.smsCost).toBe(0);
      expect(result.totalCost).toBe(result.emailCost);
      expect(result.totalMessages).toBe(10000);
    });

    it('estimates cost for SMS-only usage', () => {
      const result = estimateMonthlyCost({
        emailCount: 0,
        smsCount: 5000,
      });

      expect(result.emailCost).toBe(0);
      expect(result.smsCost).toBeGreaterThan(0);
      expect(result.totalCost).toBe(result.smsCost);
      expect(result.totalMessages).toBe(5000);
    });

    it('estimates cost for mixed usage', () => {
      const result = estimateMonthlyCost({
        emailCount: 10000,
        smsCount: 5000,
      });

      expect(result.emailCost).toBeGreaterThan(0);
      expect(result.smsCost).toBeGreaterThan(0);
      expect(result.totalCost).toBe(result.emailCost + result.smsCost);
      expect(result.totalMessages).toBe(15000);
    });

    it('applies volume discount based on total messages', () => {
      // 15000 total messages should get growth tier discount
      const result = estimateMonthlyCost({
        emailCount: 10000,
        smsCount: 5000,
      });

      expect(result.tier).toBe('SCALE');
      expect(result.discountPercent).toBe(20);
    });

    it('calculates total savings', () => {
      const result = estimateMonthlyCost({
        emailCount: 50000,
        smsCount: 10000,
      });

      expect(result.savings).toBeGreaterThan(0);
      // Savings = what it would cost at starter tier - actual cost
      const starterEmailCost = EMAIL_BASE_PRICE * 50000;
      const starterSmsCost = SMS_BASE_PRICE * 10000;
      const expectedSavings = (starterEmailCost + starterSmsCost) - result.totalCost;
      expect(result.savings).toBeCloseTo(expectedSavings, 4);
    });

    it('returns breakdown by channel', () => {
      const result = estimateMonthlyCost({
        emailCount: 5000,
        smsCount: 2000,
      });

      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.email).toEqual({
        count: 5000,
        unitCost: expect.any(Number),
        totalCost: result.emailCost,
      });
      expect(result.breakdown.sms).toEqual({
        count: 2000,
        unitCost: expect.any(Number),
        totalCost: result.smsCost,
      });
    });

    it('handles zero messages', () => {
      const result = estimateMonthlyCost({
        emailCount: 0,
        smsCount: 0,
      });

      expect(result.totalCost).toBe(0);
      expect(result.totalMessages).toBe(0);
      expect(result.tier).toBe('STARTER');
    });

    it('handles very large volumes', () => {
      const result = estimateMonthlyCost({
        emailCount: 1000000,
        smsCount: 500000,
      });

      expect(result.tier).toBe('ENTERPRISE');
      expect(result.discountPercent).toBe(30);
      expect(result.totalMessages).toBe(1500000);
    });
  });
});
