/**
 * Pricing Module
 *
 * V1-06: Volume-based tiered pricing and usage tracking for CPaaS.
 *
 * ## Features
 *
 * - 4-tier pricing structure with volume discounts
 * - Single message and batch cost calculations
 * - Monthly cost estimation
 * - Usage tracking per vendor
 * - Billing period management
 *
 * @module lib/pricing
 */

// Tier definitions and base prices
export {
  PRICING_TIERS,
  EMAIL_BASE_PRICE,
  SMS_BASE_PRICE,
  getTierForVolume,
  getDiscountRate,
  getTierName,
  type PricingTier,
} from './tiers';

// Cost calculations
export {
  calculateMessageCost,
  calculateBatchCost,
  estimateMonthlyCost,
  getBasePrice,
  formatCost,
  formatCount,
  type Channel,
  type BatchCostResult,
  type MonthlyCostEstimate,
  type MonthlyEstimateInput,
} from './calculator';

// Usage tracking
export {
  recordUsage,
  getCurrentMonthUsage,
  getUsageHistory,
  getUsageByChannel,
  getBillingPeriod,
  resetMonthlyUsage,
  type UsageRecord,
  type UsageSummary,
  type RecordUsageInput,
  type ChannelBreakdown,
  type UsageHistoryEntry,
  type BillingPeriod,
} from './usage';
