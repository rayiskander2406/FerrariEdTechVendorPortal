/**
 * Pricing Tiers
 *
 * V1-06: Tier definitions and base prices for CPaaS messaging.
 *
 * ## Pricing Structure
 *
 * - STARTER: 0-1,000 messages/month - No discount
 * - GROWTH: 1,001-10,000 messages/month - 10% discount
 * - SCALE: 10,001-100,000 messages/month - 20% discount
 * - ENTERPRISE: 100,001+ messages/month - 30% discount
 *
 * @module lib/pricing/tiers
 */

// =============================================================================
// TYPES
// =============================================================================

export interface PricingTier {
  name: 'STARTER' | 'GROWTH' | 'SCALE' | 'ENTERPRISE';
  minVolume: number;
  maxVolume: number | null;
  discountPercent: number;
  description: string;
}

// =============================================================================
// BASE PRICES
// =============================================================================

/**
 * Base price per email message (in USD)
 * $0.001 per email = $1 per 1,000 emails
 */
export const EMAIL_BASE_PRICE = 0.001;

/**
 * Base price per SMS message (in USD)
 * $0.015 per SMS = $15 per 1,000 SMS
 */
export const SMS_BASE_PRICE = 0.015;

// =============================================================================
// PRICING TIERS
// =============================================================================

/**
 * Pricing tiers with volume discounts
 *
 * Ordered by minVolume ascending
 */
export const PRICING_TIERS: PricingTier[] = [
  {
    name: 'STARTER',
    minVolume: 0,
    maxVolume: 1000,
    discountPercent: 0,
    description: 'Perfect for getting started with small-scale messaging',
  },
  {
    name: 'GROWTH',
    minVolume: 1001,
    maxVolume: 10000,
    discountPercent: 10,
    description: 'For growing applications with moderate messaging needs',
  },
  {
    name: 'SCALE',
    minVolume: 10001,
    maxVolume: 100000,
    discountPercent: 20,
    description: 'For high-volume applications requiring scale',
  },
  {
    name: 'ENTERPRISE',
    minVolume: 100001,
    maxVolume: null,
    discountPercent: 30,
    description: 'Maximum savings for enterprise-scale messaging',
  },
];

// =============================================================================
// TIER HELPERS
// =============================================================================

/**
 * Get the pricing tier for a given volume
 *
 * @param volume - Current monthly message volume
 * @returns The applicable pricing tier
 */
export function getTierForVolume(volume: number): PricingTier {
  // Find the highest tier the volume qualifies for
  for (let i = PRICING_TIERS.length - 1; i >= 0; i--) {
    if (volume >= PRICING_TIERS[i].minVolume) {
      return PRICING_TIERS[i];
    }
  }

  // Default to starter tier
  return PRICING_TIERS[0];
}

/**
 * Get the discount rate for a given volume
 *
 * @param volume - Current monthly message volume
 * @returns Discount rate as decimal (e.g., 0.10 for 10%)
 */
export function getDiscountRate(volume: number): number {
  const tier = getTierForVolume(volume);
  return tier.discountPercent / 100;
}

/**
 * Get tier name for display
 *
 * @param volume - Current monthly message volume
 * @returns Tier name
 */
export function getTierName(volume: number): string {
  return getTierForVolume(volume).name;
}
