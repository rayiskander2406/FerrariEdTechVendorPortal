/**
 * Sandbox Credentials API - Server-side credential provisioning
 *
 * This endpoint handles sandbox credential creation/lookup to ensure data
 * is stored on the server where AI handlers can access it.
 *
 * CRITICAL: This solves the client/server memory isolation issue where
 * sandbox credentials created in browser memory couldn't be found by
 * server-side AI tools.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSandbox, getSandbox, getVendor } from "@/lib/db";
import type { OneRosterEndpoint } from "@/lib/config/oneroster";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.vendorId) {
      return NextResponse.json(
        { error: "Missing required field: vendorId" },
        { status: 400 }
      );
    }

    const vendorId: string = body.vendorId;
    const requestedEndpoints: OneRosterEndpoint[] | undefined = body.requestedEndpoints;

    // Verify vendor exists on server
    const vendor = await getVendor(vendorId);
    if (!vendor) {
      return NextResponse.json(
        { error: `Vendor not found: ${vendorId}. Create vendor first via /api/vendors.` },
        { status: 404 }
      );
    }

    // Check for existing sandbox
    const existing = await getSandbox(vendorId);
    if (existing && existing.status === "ACTIVE") {
      // Note: Vendor ID intentionally not logged to avoid PII leakage
      return NextResponse.json({
        success: true,
        existing: true,
        sandbox: {
          id: existing.id,
          vendorId: existing.vendorId,
          apiKey: existing.apiKey,
          apiSecret: existing.apiSecret,
          baseUrl: existing.baseUrl,
          environment: existing.environment,
          status: existing.status,
          expiresAt: existing.expiresAt.toISOString(),
          rateLimitPerMinute: existing.rateLimitPerMinute,
          allowedEndpoints: existing.allowedEndpoints,
        },
      });
    }

    // Create new sandbox on server-side
    const sandbox = await createSandbox(vendorId, requestedEndpoints);

    // Note: Sandbox/vendor IDs and endpoints intentionally not logged to avoid PII leakage

    return NextResponse.json({
      success: true,
      existing: false,
      sandbox: {
        id: sandbox.id,
        vendorId: sandbox.vendorId,
        apiKey: sandbox.apiKey,
        apiSecret: sandbox.apiSecret,
        baseUrl: sandbox.baseUrl,
        environment: sandbox.environment,
        status: sandbox.status,
        expiresAt: sandbox.expiresAt.toISOString(),
        createdAt: sandbox.createdAt.toISOString(),
        rateLimitPerMinute: sandbox.rateLimitPerMinute,
        allowedEndpoints: sandbox.allowedEndpoints,
      },
    });
  } catch (error) {
    console.error("[API/sandbox/credentials] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to provision sandbox";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    if (!vendorId) {
      return NextResponse.json(
        { error: "Must provide vendorId parameter" },
        { status: 400 }
      );
    }

    const sandbox = await getSandbox(vendorId);

    if (!sandbox) {
      return NextResponse.json(
        { success: true, sandbox: null },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      sandbox: {
        id: sandbox.id,
        vendorId: sandbox.vendorId,
        apiKey: sandbox.apiKey,
        // Don't expose secret on GET
        baseUrl: sandbox.baseUrl,
        environment: sandbox.environment,
        status: sandbox.status,
        expiresAt: sandbox.expiresAt.toISOString(),
        rateLimitPerMinute: sandbox.rateLimitPerMinute,
        allowedEndpoints: sandbox.allowedEndpoints,
      },
    });
  } catch (error) {
    console.error("[API/sandbox/credentials] Error fetching sandbox:", error);
    return NextResponse.json(
      { error: "Failed to fetch sandbox" },
      { status: 500 }
    );
  }
}
