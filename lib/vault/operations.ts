/**
 * Vault Operations
 *
 * High-level operations for the token vault with automatic:
 * - Access logging (every operation is logged)
 * - Rate limiting checks
 * - Security alerts on suspicious activity
 *
 * @module lib/vault/operations
 */

import {
  getVaultClient,
  type TokenAccessType,
  type RequestorType,
  type DetokenizationReason,
  isValidDetokenizationReason,
} from './client';
import { checkRateLimit, incrementRateLimit } from './rate-limit';
import { triggerSecurityAlert } from './alerts';
import type { TokenType } from '../tokens';

// =============================================================================
// TYPES
// =============================================================================

export interface RequestorContext {
  /** Unique identifier for the requestor (API key ID, service account, etc.) */
  requestorId: string;
  /** Type of requestor */
  requestorType: RequestorType;
  /** IP address of the request */
  requestorIp: string;
  /** Vendor ID if vendor-initiated */
  vendorId?: string;
  /** Context about what resource this is for */
  resourceContext?: string;
}

export interface TokenizeInput {
  /** The real identifier to tokenize */
  realIdentifier: string;
  /** Type of identifier */
  identifierType: 'sis_id' | 'state_id' | 'clever_id' | 'classlink_id';
  /** User role */
  userRole: 'student' | 'teacher' | 'parent' | 'administrator';
  /** The token to use (generated externally) */
  token: string;
}

export interface TokenizeResult {
  success: boolean;
  token?: string;
  error?: string;
  isNew: boolean;
}

export interface DetokenizeResult {
  success: boolean;
  realIdentifier?: string;
  error?: string;
}

export interface LookupResult {
  success: boolean;
  token?: string;
  exists: boolean;
  error?: string;
}

// =============================================================================
// CORE OPERATIONS
// =============================================================================

/**
 * Tokenize a real identifier.
 * Creates a new token mapping or returns existing one.
 * All operations are logged and rate-limited.
 */
export async function tokenize(
  input: TokenizeInput,
  context: RequestorContext
): Promise<TokenizeResult> {
  const startTime = Date.now();
  const vault = getVaultClient();

  try {
    // Check rate limit
    const rateLimitCheck = await checkRateLimit(context.requestorId, 'tokenize');
    if (!rateLimitCheck.allowed) {
      await logAccess(vault, {
        token: input.token,
        accessType: 'tokenize',
        context,
        success: false,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        errorMessage: `Rate limit exceeded: ${rateLimitCheck.limit} per ${rateLimitCheck.window}`,
        durationMs: Date.now() - startTime,
      });

      await triggerSecurityAlert({
        alertType: 'rate_limit_exceeded',
        severity: 'medium',
        requestorId: context.requestorId,
        requestorType: context.requestorType,
        requestorIp: context.requestorIp,
        description: `Tokenize rate limit exceeded for ${context.requestorId}`,
        triggerEvent: 'tokenize',
        triggerCount: rateLimitCheck.currentCount,
        triggerThreshold: rateLimitCheck.limit,
      });

      return {
        success: false,
        error: 'Rate limit exceeded',
        isNew: false,
      };
    }

    // Check if token already exists for this real identifier
    const existing = await vault.tokenMapping.findUnique({
      where: { realIdentifier: input.realIdentifier },
    });

    if (existing) {
      // Token already exists - return it
      await logAccess(vault, {
        token: existing.token,
        accessType: 'tokenize',
        context,
        success: true,
        durationMs: Date.now() - startTime,
      });

      return {
        success: true,
        token: existing.token,
        isNew: false,
      };
    }

    // Create new token mapping
    const mapping = await vault.tokenMapping.create({
      data: {
        token: input.token,
        realIdentifier: input.realIdentifier,
        identifierType: input.identifierType,
        userRole: input.userRole,
        createdBy: context.requestorId,
      },
    });

    // Increment rate limit counter
    await incrementRateLimit(context.requestorId, 'tokenize');

    // Log successful tokenization
    await logAccess(vault, {
      token: mapping.token,
      accessType: 'tokenize',
      context,
      success: true,
      durationMs: Date.now() - startTime,
    });

    return {
      success: true,
      token: mapping.token,
      isNew: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await logAccess(vault, {
      token: input.token,
      accessType: 'tokenize',
      context,
      success: false,
      errorCode: 'INTERNAL_ERROR',
      errorMessage,
      durationMs: Date.now() - startTime,
    });

    return {
      success: false,
      error: errorMessage,
      isNew: false,
    };
  }
}

/**
 * Detokenize a token back to its real identifier.
 * REQUIRES an explicit reason for audit purposes (Mitigation #19).
 */
export async function detokenize(
  token: string,
  reason: DetokenizationReason,
  context: RequestorContext
): Promise<DetokenizeResult> {
  const startTime = Date.now();
  const vault = getVaultClient();

  // Validate reason
  if (!isValidDetokenizationReason(reason)) {
    await logAccess(vault, {
      token,
      accessType: 'detokenize',
      context,
      reason,
      success: false,
      errorCode: 'INVALID_REASON',
      errorMessage: `Invalid detokenization reason: ${reason}`,
      durationMs: Date.now() - startTime,
    });

    return {
      success: false,
      error: `Invalid detokenization reason: ${reason}`,
    };
  }

  try {
    // Check rate limit (stricter for detokenization)
    const rateLimitCheck = await checkRateLimit(context.requestorId, 'detokenize');
    if (!rateLimitCheck.allowed) {
      await logAccess(vault, {
        token,
        accessType: 'detokenize',
        context,
        reason,
        success: false,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        errorMessage: `Rate limit exceeded: ${rateLimitCheck.limit} per ${rateLimitCheck.window}`,
        durationMs: Date.now() - startTime,
      });

      await triggerSecurityAlert({
        alertType: 'rate_limit_exceeded',
        severity: 'high', // Higher severity for detokenize
        requestorId: context.requestorId,
        requestorType: context.requestorType,
        requestorIp: context.requestorIp,
        description: `Detokenize rate limit exceeded for ${context.requestorId}`,
        triggerEvent: 'detokenize',
        triggerCount: rateLimitCheck.currentCount,
        triggerThreshold: rateLimitCheck.limit,
      });

      return {
        success: false,
        error: 'Rate limit exceeded',
      };
    }

    // Look up the token
    const mapping = await vault.tokenMapping.findUnique({
      where: { token },
    });

    if (!mapping) {
      await logAccess(vault, {
        token,
        accessType: 'detokenize',
        context,
        reason,
        success: false,
        errorCode: 'NOT_FOUND',
        errorMessage: 'Token not found',
        durationMs: Date.now() - startTime,
      });

      return {
        success: false,
        error: 'Token not found',
      };
    }

    // Update access metadata
    await vault.tokenMapping.update({
      where: { token },
      data: {
        lastAccessedAt: new Date(),
        accessCount: { increment: 1 },
      },
    });

    // Increment rate limit counter
    await incrementRateLimit(context.requestorId, 'detokenize');

    // Log successful detokenization
    await logAccess(vault, {
      token,
      accessType: 'detokenize',
      context,
      reason,
      success: true,
      durationMs: Date.now() - startTime,
    });

    return {
      success: true,
      realIdentifier: mapping.realIdentifier,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await logAccess(vault, {
      token,
      accessType: 'detokenize',
      context,
      reason,
      success: false,
      errorCode: 'INTERNAL_ERROR',
      errorMessage,
      durationMs: Date.now() - startTime,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Look up a token by real identifier (without returning the real value).
 * Used to check if a token exists without detokenizing.
 */
export async function lookupByRealIdentifier(
  realIdentifier: string,
  context: RequestorContext
): Promise<LookupResult> {
  const startTime = Date.now();
  const vault = getVaultClient();

  try {
    const mapping = await vault.tokenMapping.findUnique({
      where: { realIdentifier },
    });

    const token = mapping?.token;

    await logAccess(vault, {
      token: token ?? 'LOOKUP',
      accessType: 'lookup',
      context,
      success: true,
      durationMs: Date.now() - startTime,
    });

    return {
      success: true,
      token: token ?? undefined,
      exists: !!mapping,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await logAccess(vault, {
      token: 'LOOKUP',
      accessType: 'lookup',
      context,
      success: false,
      errorCode: 'INTERNAL_ERROR',
      errorMessage,
      durationMs: Date.now() - startTime,
    });

    return {
      success: false,
      exists: false,
      error: errorMessage,
    };
  }
}

/**
 * Bulk tokenize multiple identifiers.
 * Subject to stricter rate limiting and may require approval.
 */
export async function bulkTokenize(
  inputs: TokenizeInput[],
  context: RequestorContext
): Promise<{ results: TokenizeResult[]; alertTriggered: boolean }> {
  const results: TokenizeResult[] = [];
  let alertTriggered = false;

  // Check if bulk operation needs approval
  if (inputs.length > 100) {
    await triggerSecurityAlert({
      alertType: 'bulk_detokenize_attempt',
      severity: 'medium',
      requestorId: context.requestorId,
      requestorType: context.requestorType,
      requestorIp: context.requestorIp,
      description: `Bulk tokenize attempt: ${inputs.length} tokens`,
      triggerEvent: 'bulk_tokenize',
      triggerCount: inputs.length,
      triggerThreshold: 100,
    });
    alertTriggered = true;
  }

  for (const input of inputs) {
    const result = await tokenize(input, context);
    results.push(result);

    // If rate limited, stop processing
    if (!result.success && result.error === 'Rate limit exceeded') {
      break;
    }
  }

  return { results, alertTriggered };
}

// =============================================================================
// ACCESS LOGGING
// =============================================================================

interface LogAccessParams {
  token: string;
  accessType: TokenAccessType;
  context: RequestorContext;
  reason?: string;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  durationMs: number;
}

async function logAccess(
  vault: ReturnType<typeof getVaultClient>,
  params: LogAccessParams
): Promise<void> {
  try {
    await vault.tokenAccessLog.create({
      data: {
        token: params.token,
        accessType: params.accessType,
        requestorId: params.context.requestorId,
        requestorType: params.context.requestorType,
        requestorIp: params.context.requestorIp,
        reason: params.reason ?? null,
        vendorId: params.context.vendorId ?? null,
        resourceContext: params.context.resourceContext ?? null,
        success: params.success,
        errorCode: params.errorCode ?? null,
        errorMessage: params.errorMessage ?? null,
        durationMs: params.durationMs,
      },
    });
  } catch (error) {
    // Don't fail the main operation if logging fails
    // But log to console for monitoring
    console.error('[Vault] Failed to log access:', error);
  }
}
