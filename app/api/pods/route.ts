/**
 * PoDS Application API - Server-side persistence
 *
 * This endpoint handles PoDS application persistence to ensure
 * data is stored on the server where AI handlers can access it.
 */

import { NextRequest, NextResponse } from "next/server";
import { addPodsApplication, type PodsApplication } from "@/lib/data/synthetic";

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

    // Add to server-side storage
    addPodsApplication(application);

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
