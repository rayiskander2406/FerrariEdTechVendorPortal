/**
 * Audit Logs API
 *
 * V1-08: List and query audit logs with filtering and pagination.
 *
 * Endpoints:
 * - GET /api/audit - List audit logs (requires auth + audit scope)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth';
import {
  getAuditLogs,
  isValidAction,
  isValidResourceType,
  type AuditAction,
  type AuditResourceType,
} from '@/lib/audit';

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Parse details JSON, returning null if invalid
 */
function parseDetails(details: string | null): Record<string, unknown> | null {
  if (!details) return null;
  try {
    return JSON.parse(details);
  } catch {
    return null;
  }
}

/**
 * Format audit log for response
 */
function formatAuditLog(log: {
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
}) {
  return {
    id: log.id,
    vendorId: log.vendorId,
    action: log.action,
    resourceType: log.resourceType,
    resourceId: log.resourceId,
    details: parseDetails(log.details),
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    timestamp: log.timestamp.toISOString(),
    retainUntil: log.retainUntil?.toISOString() || null,
  };
}

// =============================================================================
// GET /api/audit
// =============================================================================

async function handleGet(
  request: NextRequest,
  context: AuthContext
): Promise<Response> {
  const { vendorId, scopes } = context;

  // Check for audit scope
  if (!scopes.includes('audit') && !scopes.includes('admin')) {
    return NextResponse.json(
      { error: 'Missing required scope: audit' },
      { status: 403 }
    );
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url);

  const action = searchParams.get('action');
  const resourceType = searchParams.get('resourceType');
  const resourceId = searchParams.get('resourceId');
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');
  const limitStr = searchParams.get('limit');
  const offsetStr = searchParams.get('offset');

  // Validate action if provided
  if (action && !isValidAction(action)) {
    return NextResponse.json(
      { error: `Invalid action: ${action}` },
      { status: 400 }
    );
  }

  // Validate resource type if provided
  if (resourceType && !isValidResourceType(resourceType)) {
    return NextResponse.json(
      { error: `Invalid resourceType: ${resourceType}` },
      { status: 400 }
    );
  }

  // Parse dates
  const startDate = startDateStr ? new Date(startDateStr) : undefined;
  const endDate = endDateStr ? new Date(endDateStr) : undefined;

  // Parse pagination
  let limit = limitStr ? parseInt(limitStr, 10) : DEFAULT_LIMIT;
  const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

  // Enforce max limit
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  // Get audit logs
  const result = await getAuditLogs({
    vendorId,
    action: action as AuditAction | undefined,
    resourceType: resourceType as AuditResourceType | undefined,
    resourceId: resourceId || undefined,
    startDate,
    endDate,
    limit,
    offset,
  });

  // Format response
  const formattedLogs = result.logs.map(formatAuditLog);

  return NextResponse.json(
    {
      logs: formattedLogs,
      total: result.total,
      pagination: {
        limit,
        offset,
        hasMore: result.hasMore,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export async function GET(request: NextRequest): Promise<Response> {
  return withAuth(request, handleGet);
}
