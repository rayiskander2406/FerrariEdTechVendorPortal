/**
 * Pricing Endpoint Contract Schemas
 *
 * TEST-03: Defines the API contract for pricing endpoints.
 */

import { z } from 'zod';

// =============================================================================
// PRICING TIERS
// =============================================================================

/**
 * Pricing tier names
 */
export const TierNameSchema = z.enum(['STARTER', 'GROWTH', 'SCALE', 'ENTERPRISE']);

/**
 * Individual pricing tier
 */
export const PricingTierSchema = z.object({
  name: TierNameSchema,
  minVolume: z.number().int().nonnegative(),
  maxVolume: z.number().int().positive().nullable(),
  discountPercent: z.number().min(0).max(100),
  description: z.string().min(1),
});

// =============================================================================
// GET /api/pricing
// =============================================================================

/**
 * GET /api/pricing - 200 OK Response
 */
export const PricingResponseSchema = z.object({
  tiers: z.array(PricingTierSchema).length(4), // Exactly 4 tiers
  basePrices: z.object({
    email: z.number().positive(),
    sms: z.number().positive(),
  }),
  requestId: z.string().min(1),
});

export type PricingResponse = z.infer<typeof PricingResponseSchema>;

// =============================================================================
// POST /api/pricing (Batch Estimate)
// =============================================================================

/**
 * POST /api/pricing - Batch Estimate Request
 */
export const BatchEstimateRequestSchema = z.object({
  channel: z.enum(['EMAIL', 'SMS']),
  messageCount: z.number().int().positive(),
});

/**
 * Batch cost estimate (matches BatchCostResult from lib/pricing/calculator.ts)
 */
export const BatchCostEstimateSchema = z.object({
  messageCount: z.number().int().positive(),
  unitCost: z.number().nonnegative(),
  totalCost: z.number().nonnegative(),
  tier: TierNameSchema,
  discountPercent: z.number().min(0).max(100),
  savings: z.number().nonnegative(),
});

/**
 * POST /api/pricing - Batch Estimate Response
 */
export const BatchEstimateResponseSchema = z.object({
  estimate: BatchCostEstimateSchema,
  currentVolume: z.number().int().nonnegative(),
  requestId: z.string().min(1),
});

export type BatchEstimateResponse = z.infer<typeof BatchEstimateResponseSchema>;

// =============================================================================
// POST /api/pricing (Monthly Estimate)
// =============================================================================

/**
 * POST /api/pricing - Monthly Estimate Request
 */
export const MonthlyEstimateRequestSchema = z.object({
  type: z.literal('monthly'),
  emailCount: z.number().int().nonnegative(),
  smsCount: z.number().int().nonnegative(),
});

/**
 * Monthly cost estimate
 */
export const MonthlyCostEstimateSchema = z.object({
  emailCost: z.number().nonnegative(),
  smsCost: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  total: z.number().nonnegative(),
  tier: z.string(),
  totalMessages: z.number().int().nonnegative(),
});

/**
 * POST /api/pricing - Monthly Estimate Response
 */
export const MonthlyEstimateResponseSchema = z.object({
  estimate: MonthlyCostEstimateSchema,
  requestId: z.string().min(1),
});

export type MonthlyEstimateResponse = z.infer<typeof MonthlyEstimateResponseSchema>;
