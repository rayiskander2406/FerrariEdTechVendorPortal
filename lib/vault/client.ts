/**
 * Vault Database Client
 *
 * This module provides the Prisma client for the separate vault database.
 * The vault database is isolated from the main application database for
 * enhanced security of token mappings.
 *
 * Security Features:
 * - Separate database with different credentials
 * - All operations are logged to TokenAccessLog
 * - Rate limiting prevents bulk extraction
 * - Detokenization requires explicit reason
 *
 * @module lib/vault/client
 */

import { PrismaClient } from '../../node_modules/.prisma/vault-client';

// =============================================================================
// TYPES
// =============================================================================

export type VaultPrismaClient = PrismaClient;

export type TokenAccessType = 'tokenize' | 'detokenize' | 'lookup' | 'bulk_tokenize';

export type RequestorType = 'vendor' | 'internal_service' | 'admin' | 'sync_job';

export type DetokenizationReason =
  | 'sis_sync_reconciliation'
  | 'compliance_audit'
  | 'data_subject_request'
  | 'emergency_contact'
  | 'legal_subpoena'
  | 'security_investigation';

export type AlertType =
  | 'rate_limit_exceeded'
  | 'bulk_detokenize_attempt'
  | 'suspicious_pattern'
  | 'access_denied';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AlertStatus =
  | 'open'
  | 'acknowledged'
  | 'investigating'
  | 'resolved'
  | 'false_positive';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

// =============================================================================
// SINGLETON CLIENT
// =============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __vaultPrisma: PrismaClient | undefined;
}

/**
 * Get the vault Prisma client instance.
 * Uses singleton pattern to prevent multiple connections.
 */
export function getVaultClient(): PrismaClient {
  if (!global.__vaultPrisma) {
    global.__vaultPrisma = new PrismaClient({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }
  return global.__vaultPrisma;
}

/**
 * Disconnect the vault client.
 * Should be called during application shutdown.
 */
export async function disconnectVault(): Promise<void> {
  if (global.__vaultPrisma) {
    await global.__vaultPrisma.$disconnect();
    global.__vaultPrisma = undefined;
  }
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Valid detokenization reasons.
 * Detokenization always requires an explicit reason for audit purposes.
 */
export const VALID_DETOKENIZATION_REASONS: readonly DetokenizationReason[] = [
  'sis_sync_reconciliation',
  'compliance_audit',
  'data_subject_request',
  'emergency_contact',
  'legal_subpoena',
  'security_investigation',
] as const;

/**
 * Validate a detokenization reason.
 */
export function isValidDetokenizationReason(
  reason: string
): reason is DetokenizationReason {
  return VALID_DETOKENIZATION_REASONS.includes(reason as DetokenizationReason);
}

// =============================================================================
// MOCK CLIENT FOR TESTING
// =============================================================================

/**
 * Create a mock vault client for testing.
 * This avoids requiring a real vault database in tests.
 */
export function createMockVaultClient(): Partial<PrismaClient> {
  const tokenMappings = new Map<string, {
    token: string;
    realIdentifier: string;
    identifierType: string;
    userRole: string;
    createdAt: Date;
    createdBy: string | null;
    lastAccessedAt: Date | null;
    accessCount: number;
  }>();

  const accessLogs: Array<{
    id: string;
    token: string;
    accessType: string;
    requestorId: string;
    requestorType: string;
    requestorIp: string;
    reason: string | null;
    vendorId: string | null;
    resourceContext: string | null;
    success: boolean;
    errorCode: string | null;
    errorMessage: string | null;
    timestamp: Date;
    durationMs: number | null;
  }> = [];

  return {
    tokenMapping: {
      create: async (args: { data: {
        token: string;
        realIdentifier: string;
        identifierType: string;
        userRole: string;
        createdBy?: string | null;
      }}) => {
        const mapping = {
          ...args.data,
          createdAt: new Date(),
          createdBy: args.data.createdBy ?? null,
          lastAccessedAt: null,
          accessCount: 0,
        };
        tokenMappings.set(args.data.token, mapping);
        return mapping;
      },
      findUnique: async (args: { where: { token?: string; realIdentifier?: string } }) => {
        if (args.where.token) {
          return tokenMappings.get(args.where.token) ?? null;
        }
        if (args.where.realIdentifier) {
          for (const mapping of tokenMappings.values()) {
            if (mapping.realIdentifier === args.where.realIdentifier) {
              return mapping;
            }
          }
        }
        return null;
      },
      update: async (args: { where: { token: string }; data: Record<string, unknown> }) => {
        const existing = tokenMappings.get(args.where.token);
        if (!existing) throw new Error('Not found');
        const updated = { ...existing, ...args.data };
        tokenMappings.set(args.where.token, updated);
        return updated;
      },
      delete: async (args: { where: { token: string } }) => {
        const existing = tokenMappings.get(args.where.token);
        if (!existing) throw new Error('Not found');
        tokenMappings.delete(args.where.token);
        return existing;
      },
    } as unknown as PrismaClient['tokenMapping'],
    tokenAccessLog: {
      create: async (args: { data: {
        token: string;
        accessType: string;
        requestorId: string;
        requestorType: string;
        requestorIp: string;
        reason?: string | null;
        vendorId?: string | null;
        resourceContext?: string | null;
        success: boolean;
        errorCode?: string | null;
        errorMessage?: string | null;
        durationMs?: number | null;
      }}) => {
        const log = {
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          ...args.data,
          reason: args.data.reason ?? null,
          vendorId: args.data.vendorId ?? null,
          resourceContext: args.data.resourceContext ?? null,
          errorCode: args.data.errorCode ?? null,
          errorMessage: args.data.errorMessage ?? null,
          timestamp: new Date(),
          durationMs: args.data.durationMs ?? null,
        };
        accessLogs.push(log);
        return log;
      },
      findMany: async () => accessLogs,
    } as unknown as PrismaClient['tokenAccessLog'],
    $disconnect: async () => {},
  };
}

// Default export for convenience
export default getVaultClient;
