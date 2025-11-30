/**
 * CPaaS Configuration - Single Source of Truth
 *
 * IMPORTANT: All CPaaS pricing, channels, and delivery status definitions
 * MUST come from this file. Do NOT define these values elsewhere in the codebase.
 *
 * @see tests/config/cpaas-consistency.test.ts
 */

// =============================================================================
// CHANNEL DEFINITIONS
// =============================================================================

export const CPAAS_CHANNELS = {
  EMAIL: {
    id: "EMAIL" as const,
    label: "Email",
    description: "Via relay server",
    icon: "Mail",
    maxLength: null, // No limit for email
    segmentLength: null,
  },
  SMS: {
    id: "SMS" as const,
    label: "SMS",
    description: "Text message",
    icon: "MessageSquare",
    maxLength: 480, // 3 segments max
    segmentLength: 160,
  },
} as const;

export type CpaasChannelKey = keyof typeof CPAAS_CHANNELS;
export type CpaasChannelId = (typeof CPAAS_CHANNELS)[CpaasChannelKey]["id"];

export const ALL_CHANNEL_IDS: CpaasChannelId[] = Object.values(CPAAS_CHANNELS).map(
  (c) => c.id
) as CpaasChannelId[];

export const ALL_CHANNEL_KEYS: CpaasChannelKey[] = Object.keys(
  CPAAS_CHANNELS
) as CpaasChannelKey[];

// =============================================================================
// PRICING TIERS
// =============================================================================

export interface PricingTier {
  minVolume: number;
  maxVolume: number | null; // null means unlimited
  pricePerUnit: number;
  tierName: string;
}

export const EMAIL_PRICING_TIERS: PricingTier[] = [
  { minVolume: 0, maxVolume: 10000, pricePerUnit: 0.003, tierName: "Starter" },
  { minVolume: 10001, maxVolume: 100000, pricePerUnit: 0.002, tierName: "Growth" },
  { minVolume: 100001, maxVolume: 1000000, pricePerUnit: 0.0015, tierName: "Scale" },
  { minVolume: 1000001, maxVolume: null, pricePerUnit: 0.001, tierName: "Enterprise" },
];

export const SMS_PRICING_TIERS: PricingTier[] = [
  { minVolume: 0, maxVolume: 5000, pricePerUnit: 0.015, tierName: "Starter" },
  { minVolume: 5001, maxVolume: 50000, pricePerUnit: 0.012, tierName: "Growth" },
  { minVolume: 50001, maxVolume: 500000, pricePerUnit: 0.009, tierName: "Scale" },
  { minVolume: 500001, maxVolume: null, pricePerUnit: 0.007, tierName: "Enterprise" },
];

export const PRICING_BY_CHANNEL: Record<CpaasChannelId, PricingTier[]> = {
  EMAIL: EMAIL_PRICING_TIERS,
  SMS: SMS_PRICING_TIERS,
};

// Default tier prices for demo/cost preview (Starter tier)
export const DEFAULT_PRICES: Record<CpaasChannelId, number> = {
  EMAIL: 0.002, // Growth tier - most common for demos
  SMS: 0.015, // Starter tier
};

// =============================================================================
// DELIVERY STATUS
// =============================================================================

export const DELIVERY_STATUSES = {
  QUEUED: {
    id: "QUEUED" as const,
    label: "Queued",
    description: "Message accepted and queued for delivery",
    order: 1,
    isFinal: false,
    isError: false,
  },
  SENT: {
    id: "SENT" as const,
    label: "Sent",
    description: "Message sent to provider",
    order: 2,
    isFinal: false,
    isError: false,
  },
  DELIVERED: {
    id: "DELIVERED" as const,
    label: "Delivered",
    description: "Message delivered to recipient",
    order: 3,
    isFinal: true,
    isError: false,
  },
  OPENED: {
    id: "OPENED" as const,
    label: "Opened",
    description: "Recipient opened the message",
    order: 4,
    isFinal: true,
    isError: false,
  },
  FAILED: {
    id: "FAILED" as const,
    label: "Failed",
    description: "Message delivery failed",
    order: 99,
    isFinal: true,
    isError: true,
  },
  BOUNCED: {
    id: "BOUNCED" as const,
    label: "Bounced",
    description: "Message bounced (invalid recipient)",
    order: 98,
    isFinal: true,
    isError: true,
  },
} as const;

export type DeliveryStatusKey = keyof typeof DELIVERY_STATUSES;
export type DeliveryStatusId = (typeof DELIVERY_STATUSES)[DeliveryStatusKey]["id"];

export const ALL_DELIVERY_STATUS_IDS: DeliveryStatusId[] = Object.values(
  DELIVERY_STATUSES
).map((s) => s.id) as DeliveryStatusId[];

export const DELIVERY_STATUS_ORDER: DeliveryStatusId[] = ["QUEUED", "SENT", "DELIVERED", "OPENED"];

// =============================================================================
// LAUSD SCALE CONSTANTS (for demo calculator)
// =============================================================================

export const LAUSD_SCALE = {
  totalFamilies: 670000,
  totalStudents: 670000,
  totalTeachers: 35000,
  totalSchools: 1000,
  districtName: "LAUSD",
  // For scale calculator messaging
  scaleMessage: (cost: number, channel: CpaasChannelId) => {
    const total = LAUSD_SCALE.totalFamilies * cost;
    return {
      familyCount: LAUSD_SCALE.totalFamilies.toLocaleString(),
      totalCost: total.toLocaleString("en-US", { style: "currency", currency: "USD" }),
      channel,
      comparisonMessage: `That's the cost of reaching every LAUSD family with one personalized ${channel.toLowerCase()} - less than the cost of printing and mailing a single letter.`,
    };
  },
} as const;

// =============================================================================
// PRIVACY BADGES
// =============================================================================

export const PRIVACY_BADGES = {
  NO_PII: {
    id: "no_pii",
    label: "No PII Exposed",
    icon: "Shield",
    description: "Parent contact information hidden from vendor",
  },
  SECURE_RELAY: {
    id: "secure_relay",
    label: "Secure Relay",
    icon: "Lock",
    description: "Message routed through secure relay network",
  },
  AUDIT_TRAIL: {
    id: "audit_trail",
    label: "Full Audit Trail",
    icon: "FileText",
    description: "Complete audit trail for district visibility",
  },
  FERPA_COPPA: {
    id: "ferpa_coppa",
    label: "FERPA/COPPA Compliant",
    icon: "CheckCircle",
    description: "Compliant with federal privacy regulations",
  },
} as const;

export type PrivacyBadgeKey = keyof typeof PRIVACY_BADGES;
export const ALL_PRIVACY_BADGE_KEYS: PrivacyBadgeKey[] = Object.keys(
  PRIVACY_BADGES
) as PrivacyBadgeKey[];

// =============================================================================
// DELIVERY SIMULATION (for demo)
// =============================================================================

export const DELIVERY_SIMULATION = {
  // Delays in milliseconds for simulated delivery stages
  queuedDelay: 500,
  sentDelay: 1500,
  deliveredDelay: 2500,
  // Total time for full delivery simulation
  totalDuration: 3000,
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the price per unit for a given channel and volume
 */
export function getPriceForVolume(
  channel: CpaasChannelId,
  monthlyVolume: number
): number {
  const tiers = PRICING_BY_CHANNEL[channel];
  const tier = tiers.find(
    (t) =>
      monthlyVolume >= t.minVolume &&
      (t.maxVolume === null || monthlyVolume <= t.maxVolume)
  );
  return tier?.pricePerUnit ?? tiers[0].pricePerUnit;
}

/**
 * Get the pricing tier for a given channel and volume
 */
export function getTierForVolume(
  channel: CpaasChannelId,
  monthlyVolume: number
): PricingTier | undefined {
  const tiers = PRICING_BY_CHANNEL[channel];
  return tiers.find(
    (t) =>
      monthlyVolume >= t.minVolume &&
      (t.maxVolume === null || monthlyVolume <= t.maxVolume)
  );
}

/**
 * Calculate estimated cost for a message
 */
export function calculateMessageCost(
  channel: CpaasChannelId,
  recipientCount: number,
  monthlyVolume: number = 0
): { unitPrice: number; totalCost: number; tierName: string } {
  const tier = getTierForVolume(channel, monthlyVolume);
  const unitPrice = tier?.pricePerUnit ?? DEFAULT_PRICES[channel];
  const tierName = tier?.tierName ?? "Starter";

  return {
    unitPrice,
    totalCost: unitPrice * recipientCount,
    tierName,
  };
}

/**
 * Calculate SMS segments for a message body
 */
export function calculateSmsSegments(body: string): {
  segments: number;
  charsRemaining: number;
  isOverLimit: boolean;
} {
  const segmentLength = CPAAS_CHANNELS.SMS.segmentLength!;
  const maxLength = CPAAS_CHANNELS.SMS.maxLength!;
  const segments = Math.ceil(body.length / segmentLength) || 0;
  const charsRemaining = segments * segmentLength - body.length;
  const isOverLimit = body.length > maxLength;

  return { segments, charsRemaining, isOverLimit };
}

/**
 * Get monthly projection for daily sends
 */
export function getMonthlyProjection(
  channel: CpaasChannelId,
  dailyCost: number
): { monthlyCost: number; yearlyProjection: number } {
  const monthlyCost = dailyCost * 30;
  const yearlyProjection = dailyCost * 365;
  return { monthlyCost, yearlyProjection };
}

/**
 * Check if a channel ID is valid
 */
export function isValidChannelId(id: string): id is CpaasChannelId {
  return ALL_CHANNEL_IDS.includes(id as CpaasChannelId);
}

/**
 * Check if a delivery status ID is valid
 */
export function isValidDeliveryStatusId(id: string): id is DeliveryStatusId {
  return ALL_DELIVERY_STATUS_IDS.includes(id as DeliveryStatusId);
}

/**
 * Get channel config by ID
 */
export function getChannelById(id: string) {
  return Object.values(CPAAS_CHANNELS).find((c) => c.id === id);
}

/**
 * Get delivery status config by ID
 */
export function getDeliveryStatusById(id: string) {
  return Object.values(DELIVERY_STATUSES).find((s) => s.id === id);
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount < 0.01 ? 4 : 2,
    maximumFractionDigits: amount < 0.01 ? 4 : 2,
  });
}

/**
 * Generate a simulated message ID
 */
export function generateMessageId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "msg_";
  for (let i = 0; i < 12; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/**
 * Mask a real email for privacy display
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "[HIDDEN]";
  const maskedLocal = local[0] + "***" + (local.length > 1 ? local[local.length - 1] : "");
  return `${maskedLocal}@${domain} [HIDDEN]`;
}
