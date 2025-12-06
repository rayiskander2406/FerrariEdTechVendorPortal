/**
 * Error Tracking (Sentry)
 *
 * V1-07: Error tracking and performance monitoring with Sentry.
 *
 * ## Features
 *
 * - Error capturing with context
 * - User/vendor context
 * - Breadcrumbs
 * - Performance transactions
 *
 * @module lib/observability/errors
 */

import * as Sentry from '@sentry/nextjs';

// =============================================================================
// TYPES
// =============================================================================

export interface ErrorTrackingConfig {
  dsn: string;
  environment?: string;
  sampleRate?: number;
  tracesSampleRate?: number;
  release?: string;
}

export interface VendorContext {
  vendorId: string;
  vendorName?: string;
  tier?: string;
}

export interface Breadcrumb {
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

export interface TransactionConfig {
  name: string;
  op: string;
}

// =============================================================================
// INITIALIZATION
// =============================================================================

let isInitialized = false;

/**
 * Initialize error tracking
 *
 * @param config - Sentry configuration
 */
export function initErrorTracking(config: ErrorTrackingConfig): void {
  Sentry.init({
    dsn: config.dsn,
    environment: config.environment || process.env.NODE_ENV || 'development',
    sampleRate: config.sampleRate ?? 1.0,
    tracesSampleRate: config.tracesSampleRate ?? 0.1,
    release: config.release,
  });

  isInitialized = true;
}

/**
 * Check if error tracking is enabled
 */
export function isErrorTrackingEnabled(): boolean {
  return isInitialized && !!process.env.SENTRY_DSN;
}

// =============================================================================
// ERROR CAPTURING
// =============================================================================

/**
 * Capture an error
 *
 * @param error - Error to capture
 * @param context - Additional context
 * @param tags - Tags for categorization
 * @returns Event ID
 */
export function captureError(
  error: Error,
  context?: Record<string, unknown>,
  tags?: Record<string, string>
): string | undefined {
  const options = context || tags
    ? {
        extra: context,
        tags,
      }
    : undefined;

  return Sentry.captureException(error, options);
}

/**
 * Capture a warning message
 *
 * @param message - Warning message
 * @param context - Additional context
 */
export function captureWarning(
  message: string,
  context?: Record<string, unknown>
): void {
  Sentry.captureMessage(message, {
    level: 'warning',
    extra: context,
  });
}

// =============================================================================
// CONTEXT MANAGEMENT
// =============================================================================

/**
 * Set error context tags and extra data
 *
 * @param tags - Tags to set
 * @param extra - Extra data to set
 */
export function setErrorContext(
  tags: Record<string, string> = {},
  extra: Record<string, unknown> = {}
): void {
  for (const [key, value] of Object.entries(tags)) {
    Sentry.setTag(key, value);
  }

  for (const [key, value] of Object.entries(extra)) {
    Sentry.setExtra(key, value);
  }
}

/**
 * Set vendor context for error tracking
 *
 * @param context - Vendor context or null to clear
 */
export function setVendorContext(context: VendorContext | null): void {
  if (context === null) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: context.vendorId,
    username: context.vendorName,
  });

  if (context.tier) {
    Sentry.setTag('vendor_tier', context.tier);
  }
}

// =============================================================================
// BREADCRUMBS
// =============================================================================

/**
 * Add a breadcrumb
 *
 * @param breadcrumb - Breadcrumb data
 */
export function addErrorBreadcrumb(breadcrumb: Breadcrumb): void {
  Sentry.addBreadcrumb({
    category: breadcrumb.category,
    message: breadcrumb.message,
    level: breadcrumb.level,
    data: breadcrumb.data,
  });
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

/**
 * Start a performance span
 *
 * Note: The old Transaction API is deprecated. This now uses startSpan internally.
 *
 * @param config - Transaction configuration
 * @param callback - Function to execute within the span
 * @returns Result of the callback
 */
export function startPerformanceTransaction<T>(
  config: TransactionConfig,
  callback?: () => T
): T | undefined {
  if (callback) {
    return Sentry.startSpan(
      { name: config.name, op: config.op },
      callback
    );
  }
  // For backward compatibility, just return undefined if no callback
  return undefined;
}

// =============================================================================
// ERROR TRACKING WRAPPER
// =============================================================================

/**
 * Wrap an async function with error tracking
 *
 * @param fn - Function to wrap
 * @param operation - Operation name
 * @param context - Additional context
 * @returns Function result
 */
export async function withErrorTracking<T>(
  fn: () => Promise<T>,
  operation: string,
  context?: Record<string, unknown>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    captureError(error as Error, {
      operation,
      ...context,
    });
    throw error;
  }
}
