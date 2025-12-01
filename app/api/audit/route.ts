/**
 * Audit Log API - Server-side audit logging
 *
 * This endpoint handles audit log operations.
 * Client components must use this API instead of importing from lib/db directly.
 *
 * POST - Log an audit event
 * GET - Retrieve audit logs for a vendor
 */

import { NextRequest, NextResponse } from "next/server";
import { logAuditEvent, getAuditLogs, type AuditEventInput } from "@/lib/db";

/**
 * POST - Log an audit event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.vendorId || !body.action || !body.resourceType) {
      return NextResponse.json(
        { error: "Missing required fields: vendorId, action, resourceType" },
        { status: 400 }
      );
    }

    const event: AuditEventInput = {
      vendorId: body.vendorId,
      action: body.action,
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      details: body.details,
      ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    };

    const auditLog = await logAuditEvent(event);

    return NextResponse.json({
      success: true,
      auditLog: {
        id: auditLog.id,
        vendorId: auditLog.vendorId,
        action: auditLog.action,
        resourceType: auditLog.resourceType,
        timestamp: auditLog.timestamp.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API/audit] Error logging audit event:", error);
    return NextResponse.json(
      { error: "Failed to log audit event" },
      { status: 500 }
    );
  }
}

/**
 * GET - Retrieve audit logs for a vendor
 *
 * Query params:
 * - vendorId: Required - the vendor to get logs for
 * - limit: Optional - max number of logs (default 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    const limit = parseInt(searchParams.get("limit") ?? "100", 10);

    if (!vendorId) {
      return NextResponse.json(
        { error: "Missing required query param: vendorId" },
        { status: 400 }
      );
    }

    const logs = await getAuditLogs(vendorId, limit);

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs: logs.map((log) => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[API/audit] Error retrieving audit logs:", error);
    return NextResponse.json(
      { error: "Failed to retrieve audit logs" },
      { status: 500 }
    );
  }
}
