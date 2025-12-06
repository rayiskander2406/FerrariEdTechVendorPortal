/**
 * Pricing Calculator
 *
 * V1-06: Cost calculation functions for CPaaS messaging.
 *
 * ## Features
 *
 * - Single message cost calculation
 * - Batch cost calculation with volume discounts
 * - Monthly cost estimation
 * - Savings calculations
 *
 * @module lib/pricing/calculator
 */

import {
  EMAIL_BASE_PRICE,
  SMS_BASE_PRICE,
  getTierForVolume,
  getDiscountRate,
} from './tiers';

// =============================================================================
// TYPES
// =============================================================================

export type Channel = 'EMAIL' | 'SMS';

export interface BatchCostResult {
  messageCount: number;
  unitCost: number;
  totalCost: number;
  tier: string;
  discountPercent: number;
  savings: number;
}

export interface MonthlyCostEstimate {
  emailCount: number;
  smsCount: number;
  emailCost: number;
  smsCost: number;
  totalCost: number;
  totalMessages: number;
  tier: string;
  discountPercent: number;
  savings: number;
  breakdown: {
    email: {
      count: number;
      unitCost: number;
      totalCost: number;
    };
    sms: {
      count: number;
      unitCost: number;
      totalCost: number;
    };
  };
}

export interface MonthlyEstimateInput {
  emailCount: number;
  smsCount: number;
}

// =============================================================================
// BASE PRICE LOOKUP
// =============================================================================

/**
 * Get base price for a channel
 *
 * @param channel - Message channel
 * @returns Base price per message
 */
export function getBasePrice(channel: Channel): number {
  switch (channel) {
    case 'EMAIL':
      return EMAIL_BASE_PRICE;
    case 'SMS':
      return SMS_BASE_PRICE;
    default:
      throw new Error(`Invalid channel: ${channel}`);
  }
}

// =============================================================================
// SINGLE MESSAGE COST
// =============================================================================

/**
 * Calculate cost for a single message
 *
 * @param channel - Message channel (EMAIL or SMS)
 * @param currentVolume - Current monthly message volume (for tier calculation)
 * @returns Cost in USD
 */
export function calculateMessageCost(
  channel: Channel,
  currentVolume: number
): number {
  const basePrice = getBasePrice(channel);
  const discountRate = getDiscountRate(currentVolume);

  return basePrice * (1 - discountRate);
}

// =============================================================================
// BATCH COST
// =============================================================================

/**
 * Calculate cost for a batch of messages
 *
 * @param channel - Message channel (EMAIL or SMS)
 * @param messageCount - Number of messages in batch
 * @param currentVolume - Current monthly message volume (for tier calculation)
 * @returns Batch cost breakdown
 */
export function calculateBatchCost(
  channel: Channel,
  messageCount: number,
  currentVolume: number
): BatchCostResult {
  const tier = getTierForVolume(currentVolume);
  const discountRate = tier.discountPercent / 100;
  const basePrice = getBasePrice(channel);

  const unitCost = basePrice * (1 - discountRate);
  const totalCost = unitCost * messageCount;

  // Calculate savings compared to starter tier
  const starterCost = basePrice * messageCount;
  const savings = starterCost - totalCost;

  return {
    messageCount,
    unitCost,
    totalCost,
    tier: tier.name,
    discountPercent: tier.discountPercent,
    savings,
  };
}

// =============================================================================
// MONTHLY COST ESTIMATION
// =============================================================================

/**
 * Estimate monthly cost for projected usage
 *
 * @param input - Email and SMS counts
 * @returns Monthly cost estimate with breakdown
 */
export function estimateMonthlyCost(
  input: MonthlyEstimateInput
): MonthlyCostEstimate {
  const { emailCount, smsCount } = input;
  const totalMessages = emailCount + smsCount;

  // Get tier based on total volume
  const tier = getTierForVolume(totalMessages);
  const discountRate = tier.discountPercent / 100;

  // Calculate unit costs with discount
  const emailUnitCost = EMAIL_BASE_PRICE * (1 - discountRate);
  const smsUnitCost = SMS_BASE_PRICE * (1 - discountRate);

  // Calculate total costs per channel
  const emailCost = emailUnitCost * emailCount;
  const smsCost = smsUnitCost * smsCount;
  const totalCost = emailCost + smsCost;

  // Calculate savings compared to starter tier
  const starterEmailCost = EMAIL_BASE_PRICE * emailCount;
  const starterSmsCost = SMS_BASE_PRICE * smsCount;
  const savings = starterEmailCost + starterSmsCost - totalCost;

  return {
    emailCount,
    smsCount,
    emailCost,
    smsCost,
    totalCost,
    totalMessages,
    tier: tier.name,
    discountPercent: tier.discountPercent,
    savings,
    breakdown: {
      email: {
        count: emailCount,
        unitCost: emailUnitCost,
        totalCost: emailCost,
      },
      sms: {
        count: smsCount,
        unitCost: smsUnitCost,
        totalCost: smsCost,
      },
    },
  };
}

// =============================================================================
// COST FORMATTING
// =============================================================================

/**
 * Format cost for display
 *
 * @param cost - Cost in USD
 * @returns Formatted string (e.g., "$12.50")
 */
export function formatCost(cost: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(cost);
}

/**
 * Format large numbers for display
 *
 * @param count - Number to format
 * @returns Formatted string (e.g., "1,234,567")
 */
export function formatCount(count: number): string {
  return new Intl.NumberFormat('en-US').format(count);
}
