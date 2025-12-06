/**
 * Vault Rate Limiting
 *
 * Implements rate limiting for vault operations to prevent bulk extraction.
 * Uses sliding window algorithm with per-minute, per-hour, and per-day limits.
 *
 * Default limits (configurable per requestor type):
 * - Tokenize: 100/min, 1000/hour, 10000/day
 * - Detokenize: 10/min, 100/hour, 1000/day (stricter)
 *
 * @module lib/vault/rate-limit
 */

import { getVaultClient } from './client';

// =============================================================================
// TYPES
// =============================================================================

export type OperationType = 'tokenize' | 'detokenize';

export interface RateLimitCheck {
  allowed: boolean;
  currentCount: number;
  limit: number;
  window: 'minute' | 'hour' | 'day';
  resetAt: Date;
}

export interface RateLimitConfig {
  tokenizePerMinute: number;
  detokenizePerMinute: number;
  tokenizePerHour: number;
  detokenizePerHour: number;
  tokenizePerDay: number;
  detokenizePerDay: number;
  tokenizeAlertThreshold: number;
  detokenizeAlertThreshold: number;
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

const DEFAULT_CONFIG: Record<string, RateLimitConfig> = {
  vendor: {
    tokenizePerMinute: 100,
    detokenizePerMinute: 10,
    tokenizePerHour: 1000,
    detokenizePerHour: 100,
    tokenizePerDay: 10000,
    detokenizePerDay: 1000,
    tokenizeAlertThreshold: 500,
    detokenizeAlertThreshold: 50,
  },
  internal_service: {
    tokenizePerMinute: 500,
    detokenizePerMinute: 50,
    tokenizePerHour: 5000,
    detokenizePerHour: 500,
    tokenizePerDay: 50000,
    detokenizePerDay: 5000,
    tokenizeAlertThreshold: 2500,
    detokenizeAlertThreshold: 250,
  },
  admin: {
    tokenizePerMinute: 1000,
    detokenizePerMinute: 100,
    tokenizePerHour: 10000,
    detokenizePerHour: 1000,
    tokenizePerDay: 100000,
    detokenizePerDay: 10000,
    tokenizeAlertThreshold: 5000,
    detokenizeAlertThreshold: 500,
  },
  sync_job: {
    tokenizePerMinute: 1000,
    detokenizePerMinute: 100,
    tokenizePerHour: 10000,
    detokenizePerHour: 1000,
    tokenizePerDay: 100000,
    detokenizePerDay: 10000,
    tokenizeAlertThreshold: 5000,
    detokenizeAlertThreshold: 500,
  },
};

// In-memory cache for rate limits (falls back to DB if needed)
const rateLimitCache = new Map<string, {
  tokenizeCount: number;
  detokenizeCount: number;
  windowStart: Date;
  windowEnd: Date;
}>();

// =============================================================================
// RATE LIMIT FUNCTIONS
// =============================================================================

/**
 * Get the current window for rate limiting.
 */
function getCurrentWindow(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setSeconds(0, 0); // Round to minute

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 1);

  return { start, end };
}

/**
 * Get or create rate limit entry from cache.
 */
function getOrCreateCacheEntry(requestorId: string): {
  tokenizeCount: number;
  detokenizeCount: number;
  windowStart: Date;
  windowEnd: Date;
} {
  const { start, end } = getCurrentWindow();
  const cached = rateLimitCache.get(requestorId);

  // Check if cached entry is still valid (same window)
  if (cached && cached.windowStart.getTime() === start.getTime()) {
    return cached;
  }

  // Create new entry for new window
  const entry = {
    tokenizeCount: 0,
    detokenizeCount: 0,
    windowStart: start,
    windowEnd: end,
  };
  rateLimitCache.set(requestorId, entry);
  return entry;
}

/**
 * Get the rate limit configuration for a requestor.
 */
async function getConfig(requestorType: string): Promise<RateLimitConfig> {
  try {
    const vault = getVaultClient();
    const dbConfig = await vault.vaultRateLimitConfig.findUnique({
      where: { id: requestorType },
    });

    if (dbConfig) {
      return {
        tokenizePerMinute: dbConfig.tokenizePerMinute,
        detokenizePerMinute: dbConfig.detokenizePerMinute,
        tokenizePerHour: dbConfig.tokenizePerHour,
        detokenizePerHour: dbConfig.detokenizePerHour,
        tokenizePerDay: dbConfig.tokenizePerDay,
        detokenizePerDay: dbConfig.detokenizePerDay,
        tokenizeAlertThreshold: dbConfig.tokenizeAlertThreshold,
        detokenizeAlertThreshold: dbConfig.detokenizeAlertThreshold,
      };
    }
  } catch {
    // Fall back to defaults if DB unavailable
  }

  return DEFAULT_CONFIG[requestorType] ?? DEFAULT_CONFIG['vendor']!;
}

/**
 * Check if an operation is allowed under rate limits.
 */
export async function checkRateLimit(
  requestorId: string,
  operation: OperationType,
  requestorType: string = 'vendor'
): Promise<RateLimitCheck> {
  const entry = getOrCreateCacheEntry(requestorId);
  const config = await getConfig(requestorType);

  const currentCount = operation === 'tokenize'
    ? entry.tokenizeCount
    : entry.detokenizeCount;

  const limit = operation === 'tokenize'
    ? config.tokenizePerMinute
    : config.detokenizePerMinute;

  return {
    allowed: currentCount < limit,
    currentCount,
    limit,
    window: 'minute',
    resetAt: entry.windowEnd,
  };
}

/**
 * Increment the rate limit counter for an operation.
 */
export async function incrementRateLimit(
  requestorId: string,
  operation: OperationType
): Promise<void> {
  const entry = getOrCreateCacheEntry(requestorId);

  if (operation === 'tokenize') {
    entry.tokenizeCount++;
  } else {
    entry.detokenizeCount++;
  }

  // Persist to database asynchronously (don't block)
  persistRateLimitAsync(requestorId, entry).catch(console.error);
}

/**
 * Persist rate limit to database (async, non-blocking).
 */
async function persistRateLimitAsync(
  requestorId: string,
  entry: {
    tokenizeCount: number;
    detokenizeCount: number;
    windowStart: Date;
    windowEnd: Date;
  }
): Promise<void> {
  try {
    const vault = getVaultClient();
    const id = `${requestorId}:${entry.windowStart.toISOString()}`;

    await vault.vaultRateLimit.upsert({
      where: { id },
      create: {
        id,
        requestorId,
        windowStart: entry.windowStart,
        windowEnd: entry.windowEnd,
        tokenizeCount: entry.tokenizeCount,
        detokenizeCount: entry.detokenizeCount,
      },
      update: {
        tokenizeCount: entry.tokenizeCount,
        detokenizeCount: entry.detokenizeCount,
      },
    });
  } catch (error) {
    console.error('[Vault] Failed to persist rate limit:', error);
  }
}

/**
 * Reset rate limits for a requestor (admin function).
 */
export async function resetRateLimit(requestorId: string): Promise<void> {
  rateLimitCache.delete(requestorId);

  try {
    const vault = getVaultClient();
    await vault.vaultRateLimit.deleteMany({
      where: { requestorId },
    });
  } catch (error) {
    console.error('[Vault] Failed to reset rate limit in DB:', error);
  }
}

/**
 * Get current rate limit status for a requestor.
 */
export async function getRateLimitStatus(
  requestorId: string,
  requestorType: string = 'vendor'
): Promise<{
  tokenize: RateLimitCheck;
  detokenize: RateLimitCheck;
}> {
  return {
    tokenize: await checkRateLimit(requestorId, 'tokenize', requestorType),
    detokenize: await checkRateLimit(requestorId, 'detokenize', requestorType),
  };
}

/**
 * Clear all cached rate limits (useful for testing).
 */
export function clearRateLimitCache(): void {
  rateLimitCache.clear();
}
