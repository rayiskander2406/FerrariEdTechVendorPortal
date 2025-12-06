/**
 * Audit Logging Module
 *
 * V1-08: Implements audit logging for compliance and security.
 *
 * ## Features
 *
 * - Log all mutations (create, update, delete)
 * - Track API key lifecycle events
 * - Record rate limit violations
 * - Message send/fail tracking
 * - Query and filter audit logs
 * - Automatic retention management
 *
 * ## Usage
 *
 * ```typescript
 * import { logAudit, getAuditLogs } from '@/lib/audit';
 *
 * // Log an event
 * await logAudit({
 *   vendorId: 'vendor-123',
 *   action: 'CREATE',
 *   resourceType: 'INTEGRATION',
 *   resourceId: 'int-456',
 *   details: { scopes: ['users', 'classes'] },
 * });
 *
 * // Query logs
 * const { logs, total } = await getAuditLogs({
 *   vendorId: 'vendor-123',
 *   action: 'CREATE',
 *   limit: 50,
 * });
 * ```
 *
 * @module lib/audit
 */

import { prisma } from '@/lib/db';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Audit action types
 */
export const AUDIT_ACTIONS = [
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'API_KEY_CREATE',
  'API_KEY_REVOKE',
  'API_KEY_ROTATE',
  'RATE_LIMIT_EXCEEDED',
  'MESSAGE_SENT',
  'MESSAGE_FAILED',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/**
 * Resource types that can be audited
 */
export const AUDIT_RESOURCE_TYPES = [
  'VENDOR',
  'INTEGRATION',
  'CREDENTIAL',
  'API_KEY',
  'SESSION',
  'MESSAGE',
  'SYNC_JOB',
] as const;

export type AuditResourceType = (typeof AUDIT_RESOURCE_TYPES)[number];

/**
 * Default retention period in days
 */
export const DEFAULT_RETENTION_DAYS = 90;

/**
 * Sensitive fields to redact from audit details
 */
const SENSITIVE_FIELDS = [
  'password',
  'secret',
  'token',
  'apiKey',
  'fullKey',
  'keyHash',
  'credentials',
  'privateKey',
];

/**
 * Audit log entry from database
 */
export interface AuditLogEntry {
  id: string;
  vendorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
  retainUntil: Date | null;
}

/**
 * Input for creating an audit log
 */
export interface AuditLogInput {
  vendorId: string | null;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  retainUntil?: Date;
}

/**
 * Filter options for querying audit logs
 */
export interface AuditLogFilter {
  vendorId: string;
  action?: AuditAction;
  resourceType?: AuditResourceType;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Result of audit log query
 */
export interface AuditLogResult {
  logs: AuditLogEntry[];
  total: number;
  hasMore: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Redact sensitive fields from details object
 */
function redactSensitiveFields(
  details: Record<string, unknown>
): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(details)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      // Skip sensitive fields entirely
      continue;
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      redacted[key] = redactSensitiveFields(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Calculate retention date based on default retention days
 */
function calculateRetentionDate(retentionDays: number = DEFAULT_RETENTION_DAYS): Date {
  const date = new Date();
  date.setDate(date.getDate() + retentionDays);
  return date;
}

// =============================================================================
// LOG AUDIT
// =============================================================================

/**
 * Log an audit event
 *
 * @param input - Audit log input
 * @returns Created audit log entry
 */
export async function logAudit(input: AuditLogInput): Promise<AuditLogEntry> {
  const {
    vendorId,
    action,
    resourceType,
    resourceId = null,
    details,
    ipAddress = null,
    userAgent = null,
    retainUntil = calculateRetentionDate(),
  } = input;

  // Redact sensitive fields from details
  let detailsJson: string | null = null;
  if (details) {
    const redactedDetails = redactSensitiveFields(details);
    detailsJson = JSON.stringify(redactedDetails);
  }

  const entry = await prisma.auditLog.create({
    data: {
      vendorId,
      action,
      resourceType,
      resourceId,
      details: detailsJson,
      ipAddress,
      userAgent,
      retainUntil,
    },
  });

  return entry;
}

// =============================================================================
// QUERY AUDIT LOGS
// =============================================================================

/**
 * Get audit logs with filtering and pagination
 *
 * @param filter - Filter options
 * @returns Audit logs and pagination info
 */
export async function getAuditLogs(filter: AuditLogFilter): Promise<AuditLogResult> {
  const {
    vendorId,
    action,
    resourceType,
    resourceId,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = filter;

  // Build where clause
  const where: Record<string, unknown> = {
    vendorId,
  };

  if (action) {
    where.action = action;
  }

  if (resourceType) {
    where.resourceType = resourceType;
  }

  if (resourceId) {
    where.resourceId = resourceId;
  }

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) {
      (where.timestamp as Record<string, Date>).gte = startDate;
    }
    if (endDate) {
      (where.timestamp as Record<string, Date>).lte = endDate;
    }
  }

  // Query with pagination
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    hasMore: offset + logs.length < total,
  };
}

/**
 * Get a single audit log by ID
 *
 * @param id - Audit log ID
 * @returns Audit log entry or null
 */
export async function getAuditLog(id: string): Promise<AuditLogEntry | null> {
  return prisma.auditLog.findUnique({
    where: { id },
  });
}

// =============================================================================
// RETENTION / CLEANUP
// =============================================================================

/**
 * Delete expired audit logs
 *
 * @returns Number of deleted logs
 */
export async function deleteExpiredAuditLogs(): Promise<{ deleted: number }> {
  const result = await prisma.auditLog.deleteMany({
    where: {
      retainUntil: {
        lt: new Date(),
      },
    },
  });

  return { deleted: result.count };
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Check if an action is valid
 */
export function isValidAction(action: string): action is AuditAction {
  return AUDIT_ACTIONS.includes(action as AuditAction);
}

/**
 * Check if a resource type is valid
 */
export function isValidResourceType(
  resourceType: string
): resourceType is AuditResourceType {
  return AUDIT_RESOURCE_TYPES.includes(resourceType as AuditResourceType);
}
