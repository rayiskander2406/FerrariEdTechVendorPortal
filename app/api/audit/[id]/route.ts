/**
 * Single Audit Log API
 *
 * V1-08: Get a single audit log by ID.
 *
 * Endpoints:
 * - GET /api/audit/:id - Get single audit log (requires auth + audit scope)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth';
import { getAuditLog } from '@/lib/audit';

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
// GET /api/audit/:id
// =============================================================================

interface RouteParams {
  params: {
    id: string;
  };
}

async function handleGet(
  request: NextRequest,
  context: AuthContext,
  params: { id: string }
): Promise<Response> {
  const { vendorId, scopes } = context;
  const { id } = params;

  // Check for audit scope
  if (!scopes.includes('audit') && !scopes.includes('admin')) {
    return NextResponse.json(
      { error: 'Missing required scope: audit' },
      { status: 403 }
    );
  }

  // Get audit log
  const log = await getAuditLog(id);

  if (!log) {
    return NextResponse.json(
      { error: 'Audit log not found' },
      { status: 404 }
    );
  }

  // Check vendor ownership
  if (log.vendorId !== vendorId) {
    return NextResponse.json(
      { error: 'You are not authorized to view this audit log' },
      { status: 403 }
    );
  }

  return NextResponse.json(formatAuditLog(log), {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  return withAuth(request, (req, ctx) => handleGet(req, ctx, params));
}
