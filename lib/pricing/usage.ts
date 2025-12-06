/**
 * Usage Tracking
 *
 * V1-06: Track message usage per vendor for billing.
 *
 * ## Features
 *
 * - Record usage per message/batch
 * - Get current month usage
 * - Usage history queries
 * - Channel breakdown
 * - Billing period calculations
 *
 * @module lib/pricing/usage
 */

import { prisma } from '@/lib/db';
import { getTierForVolume } from './tiers';

// =============================================================================
// TYPES
// =============================================================================

export interface UsageRecord {
  id: string;
  vendorId: string;
  month: string;
  emailCount: number;
  smsCount: number;
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageSummary {
  emailCount: number;
  smsCount: number;
  totalMessages: number;
  totalCost: number;
  tier: string;
  discountPercent: number;
  daysRemaining: number;
}

export interface RecordUsageInput {
  vendorId: string;
  channel: 'EMAIL' | 'SMS';
  messageCount: number;
  cost: number;
  batchId?: string;
}

export interface ChannelBreakdown {
  email: {
    count: number;
    percentage: number;
  };
  sms: {
    count: number;
    percentage: number;
  };
}

export interface UsageHistoryEntry extends UsageRecord {
  totalMessages: number;
  growthRate?: number;
}

export interface BillingPeriod {
  month: string;
  startDate: Date;
  endDate: Date;
  daysRemaining: number;
}

// =============================================================================
// RECORD USAGE
// =============================================================================

/**
 * Record message usage for a vendor
 *
 * @param input - Usage record input
 * @returns Updated usage record
 */
export async function recordUsage(input: RecordUsageInput): Promise<UsageRecord> {
  const { vendorId, channel, messageCount, cost } = input;
  const month = getCurrentMonth();

  return prisma.$transaction(async (tx) => {
    // Find existing usage record for this month
    const existing = await tx.vendorUsage.findFirst({
      where: {
        vendorId,
        month,
      },
    });

    if (existing) {
      // Update existing record
      const updateData =
        channel === 'EMAIL'
          ? {
              emailCount: existing.emailCount + messageCount,
              totalCost: existing.totalCost + cost,
            }
          : {
              smsCount: existing.smsCount + messageCount,
              totalCost: existing.totalCost + cost,
            };

      return tx.vendorUsage.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      // Create new record
      return tx.vendorUsage.create({
        data: {
          vendorId,
          month,
          emailCount: channel === 'EMAIL' ? messageCount : 0,
          smsCount: channel === 'SMS' ? messageCount : 0,
          totalCost: cost,
        },
      });
    }
  });
}

// =============================================================================
// GET CURRENT MONTH USAGE
// =============================================================================

/**
 * Get current month usage for a vendor
 *
 * @param vendorId - Vendor ID
 * @returns Usage summary or null if no usage
 */
export async function getCurrentMonthUsage(
  vendorId: string
): Promise<UsageSummary | null> {
  const month = getCurrentMonth();

  const usage = await prisma.vendorUsage.findFirst({
    where: {
      vendorId,
      month,
    },
  });

  if (!usage) {
    return null;
  }

  const totalMessages = usage.emailCount + usage.smsCount;
  const tier = getTierForVolume(totalMessages);
  const billingPeriod = getBillingPeriod();

  return {
    emailCount: usage.emailCount,
    smsCount: usage.smsCount,
    totalMessages,
    totalCost: usage.totalCost,
    tier: tier.name,
    discountPercent: tier.discountPercent,
    daysRemaining: billingPeriod.daysRemaining,
  };
}

// =============================================================================
// GET USAGE HISTORY
// =============================================================================

/**
 * Get usage history for a vendor
 *
 * @param vendorId - Vendor ID
 * @param months - Number of months to retrieve
 * @returns Usage history with growth rates
 */
export async function getUsageHistory(
  vendorId: string,
  months: number
): Promise<UsageHistoryEntry[]> {
  const history = await prisma.vendorUsage.findMany({
    where: { vendorId },
    orderBy: { month: 'desc' },
    take: months,
  });

  // Calculate growth rates
  return history.map((record, index) => {
    const totalMessages = record.emailCount + record.smsCount;
    let growthRate: number | undefined;

    if (index < history.length - 1) {
      const previousRecord = history[index + 1];
      const previousTotal = previousRecord.emailCount + previousRecord.smsCount;

      if (previousTotal > 0) {
        growthRate = (totalMessages - previousTotal) / previousTotal;
      }
    }

    return {
      ...record,
      totalMessages,
      growthRate,
    };
  });
}

// =============================================================================
// GET USAGE BY CHANNEL
// =============================================================================

/**
 * Get usage breakdown by channel
 *
 * @param vendorId - Vendor ID
 * @returns Channel breakdown with percentages
 */
export async function getUsageByChannel(
  vendorId: string
): Promise<ChannelBreakdown> {
  const month = getCurrentMonth();

  const usage = await prisma.vendorUsage.findFirst({
    where: {
      vendorId,
      month,
    },
  });

  if (!usage) {
    return {
      email: { count: 0, percentage: 0 },
      sms: { count: 0, percentage: 0 },
    };
  }

  const total = usage.emailCount + usage.smsCount;

  if (total === 0) {
    return {
      email: { count: 0, percentage: 0 },
      sms: { count: 0, percentage: 0 },
    };
  }

  return {
    email: {
      count: usage.emailCount,
      percentage: (usage.emailCount / total) * 100,
    },
    sms: {
      count: usage.smsCount,
      percentage: (usage.smsCount / total) * 100,
    },
  };
}

// =============================================================================
// BILLING PERIOD
// =============================================================================

/**
 * Get billing period information
 *
 * @param month - Optional month (YYYY-MM format)
 * @returns Billing period with dates and days remaining
 */
export function getBillingPeriod(month?: string): BillingPeriod {
  const targetMonth = month || getCurrentMonth();
  const [year, monthNum] = targetMonth.split('-').map(Number);

  // Start date is first of month
  const startDate = new Date(year, monthNum - 1, 1);

  // End date is last day of month
  const endDate = new Date(year, monthNum, 0);

  // Calculate days remaining
  const today = new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    month: targetMonth,
    startDate,
    endDate,
    daysRemaining,
  };
}

// =============================================================================
// RESET MONTHLY USAGE
// =============================================================================

/**
 * Reset usage for a new month (creates fresh record)
 *
 * @param vendorId - Vendor ID
 * @param month - Month to reset (YYYY-MM format)
 * @returns New usage record
 */
export async function resetMonthlyUsage(
  vendorId: string,
  month: string
): Promise<UsageRecord> {
  return prisma.vendorUsage.create({
    data: {
      vendorId,
      month,
      emailCount: 0,
      smsCount: 0,
      totalCost: 0,
    },
  });
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
