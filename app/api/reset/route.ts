/**
 * Reset API Route - Clears database for fresh demo sessions
 *
 * POST: Clear all user-generated data (PoDS applications, vendors, sandboxes)
 * GET: Health check
 */

import { clearPodsApplications, prisma } from "@/lib/db";

// Use Node.js runtime for Prisma compatibility
export const runtime = "nodejs";

/**
 * GET - Health check
 */
export async function GET() {
  return Response.json({
    status: "ok",
    service: "reset-api",
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST - Reset database
 * Clears all user-generated data for a fresh demo session
 */
export async function POST() {
  try {
    // Clear in correct order to respect foreign key constraints
    // 1. Clear child tables first
    await prisma.integrationConfig.deleteMany({});
    await prisma.sandboxCredentials.deleteMany({});
    await prisma.communicationMessage.deleteMany({});
    await prisma.auditLog.deleteMany({});

    // 2. Clear PoDS applications
    await clearPodsApplications();

    // 3. Clear vendors last (parent table)
    await prisma.vendor.deleteMany({});

    console.log("[Reset API] Database cleared successfully");

    return Response.json({
      success: true,
      message: "Database reset successfully",
      timestamp: new Date().toISOString(),
      cleared: [
        "integrationConfigs",
        "sandboxCredentials",
        "communicationMessages",
        "auditLogs",
        "podsApplications",
        "vendors",
      ],
    });
  } catch (error) {
    console.error("[Reset API] Error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Reset failed",
      },
      { status: 500 }
    );
  }
}
