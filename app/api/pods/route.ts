/**
 * PoDS Application API - Prisma Database Persistence
 *
 * This endpoint handles PoDS application CRUD operations.
 * Data persists to SQLite (dev) / PostgreSQL (prod) via Prisma.
 *
 * All API routes share the same database - no more memory isolation issues.
 */

import { NextRequest, NextResponse } from "next/server";
import { type PodsApplication } from "@/lib/types";
import { addPodsApplication, listPodsApplications } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.id || !body.vendorName || !body.contactEmail) {
      return NextResponse.json(
        { error: "Missing required fields: id, vendorName, contactEmail" },
        { status: 400 }
      );
    }

    // Construct the PoDS application
    const application: PodsApplication = {
      id: body.id,
      vendorName: body.vendorName,
      applicationName: body.applicationName || body.vendorName,
      contactEmail: body.contactEmail,
      status: body.status || "APPROVED",
      accessTier: body.accessTier || "PRIVACY_SAFE",
      submittedAt: body.submittedAt ? new Date(body.submittedAt) : new Date(),
      reviewedAt: body.reviewedAt ? new Date(body.reviewedAt) : new Date(),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };

    // Add to unified db store (HARD-04)
    await addPodsApplication(application);

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        vendorName: application.vendorName,
        status: application.status,
        accessTier: application.accessTier,
      },
    });
  } catch (error) {
    console.error("[API/pods] Error persisting PoDS application:", error);
    return NextResponse.json(
      { error: "Failed to persist PoDS application" },
      { status: 500 }
    );
  }
}

/**
 * GET - List all PoDS applications or fetch by vendorName
 *
 * Query params:
 * - vendorName: Filter by vendor name (returns single application)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorName = searchParams.get("vendorName");

    // If vendorName provided, return single application
    if (vendorName) {
      const { getPodsApplicationByVendor } = await import("@/lib/db");
      const application = await getPodsApplicationByVendor(vendorName);

      if (!application) {
        return NextResponse.json(
          { success: false, error: "PoDS application not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        application: {
          ...application,
          submittedAt: application.submittedAt?.toISOString() ?? null,
          reviewedAt: application.reviewedAt?.toISOString() ?? null,
          expiresAt: application.expiresAt?.toISOString() ?? null,
        },
      });
    }

    // No filter - return all applications
    const applications = await listPodsApplications();
    return NextResponse.json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("[API/pods] Error listing PoDS applications:", error);
    return NextResponse.json(
      { error: "Failed to list PoDS applications" },
      { status: 500 }
    );
  }
}
