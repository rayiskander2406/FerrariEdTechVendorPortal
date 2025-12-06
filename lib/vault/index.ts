/**
 * Token Vault Module
 *
 * This module provides secure token management for the SchoolDay Vendor Portal.
 * Tokens are stored in a separate, hardened database with:
 * - All access logged to immutable audit trail
 * - Rate limiting to prevent bulk extraction
 * - Detokenization requires explicit reason
 * - Security alerts for suspicious activity
 *
 * @module lib/vault
 *
 * @example
 * ```typescript
 * import { tokenize, detokenize, getVaultClient } from '@/lib/vault';
 *
 * // Tokenize a real identifier
 * const result = await tokenize(
 *   {
 *     realIdentifier: '123456789',
 *     identifierType: 'sis_id',
 *     userRole: 'student',
 *     token: 'TKN_STU_ABCD1234',
 *   },
 *   {
 *     requestorId: 'api_key_123',
 *     requestorType: 'vendor',
 *     requestorIp: '192.168.1.1',
 *   }
 * );
 *
 * // Detokenize (requires reason)
 * const detokenized = await detokenize(
 *   'TKN_STU_ABCD1234',
 *   'sis_sync_reconciliation', // Required reason
 *   {
 *     requestorId: 'sync_job_456',
 *     requestorType: 'sync_job',
 *     requestorIp: '10.0.0.1',
 *   }
 * );
 * ```
 */

// Client
export {
  getVaultClient,
  disconnectVault,
  createMockVaultClient,
  VALID_DETOKENIZATION_REASONS,
  isValidDetokenizationReason,
  type VaultPrismaClient,
  type TokenAccessType,
  type RequestorType,
  type DetokenizationReason,
  type AlertType,
  type AlertSeverity,
  type AlertStatus,
  type ApprovalStatus,
} from './client';

// Operations
export {
  tokenize,
  detokenize,
  lookupByRealIdentifier,
  bulkTokenize,
  type RequestorContext,
  type TokenizeInput,
  type TokenizeResult,
  type DetokenizeResult,
  type LookupResult,
} from './operations';

// Rate Limiting
export {
  checkRateLimit,
  incrementRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  clearRateLimitCache,
  type OperationType,
  type RateLimitCheck,
  type RateLimitConfig,
} from './rate-limit';

// Alerts
export {
  triggerSecurityAlert,
  acknowledgeAlert,
  resolveAlert,
  markAlertFalsePositive,
  getOpenAlerts,
  getAlertsForRequestor,
  getAlertStats,
  type TriggerAlertInput,
  type SecurityAlert,
} from './alerts';
