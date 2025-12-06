/**
 * Audit Endpoint Contract Schemas
 *
 * TEST-03: Defines the API contract for audit log endpoints.
 */

import { z } from 'zod';

// =============================================================================
// AUDIT LOG ITEM
// =============================================================================

/**
 * Audit log entry
 */
export const AuditLogItemSchema = z.object({
  id: z.string().uuid(),
  vendorId: z.string().uuid().nullable(),
  action: z.string().min(1),
  resourceType: z.string().min(1),
  resourceId: z.string().nullable(),
  details: z.record(z.unknown()).nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  timestamp: z.string().datetime(),
  retainUntil: z.string().datetime().nullable(),
});

export type AuditLogItem = z.infer<typeof AuditLogItemSchema>;

// =============================================================================
// PAGINATION
// =============================================================================

/**
 * Pagination info
 */
export const PaginationSchema = z.object({
  limit: z.number().int().positive().max(100),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

// =============================================================================
// GET /api/audit
// =============================================================================

/**
 * GET /api/audit - 200 OK Response
 */
export const AuditLogsResponseSchema = z.object({
  logs: z.array(AuditLogItemSchema),
  total: z.number().int().nonnegative(),
  pagination: PaginationSchema,
});

export type AuditLogsResponse = z.infer<typeof AuditLogsResponseSchema>;

// =============================================================================
// GET /api/audit/[id]
// =============================================================================

/**
 * GET /api/audit/[id] - 200 OK Response
 */
export const AuditLogDetailResponseSchema = z.object({
  log: AuditLogItemSchema,
});

export type AuditLogDetailResponse = z.infer<typeof AuditLogDetailResponseSchema>;
