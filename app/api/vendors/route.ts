/**
 * Vendors API - Server-side vendor persistence
 *
 * This endpoint handles vendor creation/lookup to ensure data is stored
 * on the server where AI handlers can access it.
 *
 * Security features:
 * - Rate limiting: 60 requests/minute per IP
 * - Payload validation: 1MB max, 10k char strings
 * - XSS sanitization: All string inputs escaped
 *
 * CRITICAL: This solves the client/server memory isolation issue where
 * vendors created in browser memory couldn't be found by server-side AI tools.
 */

import { NextRequest, NextResponse } from "next/server";
import { createVendor, getVendor, getVendorByEmail } from "@/lib/db";
import type { PodsLiteInput, AccessTier } from "@/lib/types";
import {
  securityCheck,
  DEFAULT_RATE_LIMIT,
  DEFAULT_PAYLOAD_CONFIG,
  getClientId,
  checkRateLimit,
  createRateLimitHeaders,
} from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    // Security check: rate limiting + payload validation + XSS sanitization
    const security = await securityCheck(request, {
      rateLimit: DEFAULT_RATE_LIMIT,
      payload: DEFAULT_PAYLOAD_CONFIG,
    });

    if (!security.passed) {
      return security.response!;
    }

    const body = security.body as { podsLiteInput?: PodsLiteInput; accessTier?: AccessTier };

    // Validate required fields
    if (!body.podsLiteInput) {
      return NextResponse.json(
        { error: "Missing required field: podsLiteInput" },
        { status: 400 }
      );
    }

    const podsLiteInput: PodsLiteInput = body.podsLiteInput;
    const accessTier: AccessTier = body.accessTier ?? "PRIVACY_SAFE";

    // Create vendor on server-side (input already sanitized by securityCheck)
    const vendor = await createVendor({ podsLiteInput, accessTier });

    // Note: Vendor ID/name intentionally not logged to avoid PII leakage

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        name: vendor.name,
        contactEmail: vendor.contactEmail,
        accessTier: vendor.accessTier,
        podsStatus: vendor.podsStatus,
        podsApplicationId: vendor.podsApplicationId,
        createdAt: vendor.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API/vendors] Error creating vendor:", error);
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limit check for GET requests
    const clientId = getClientId(request);
    const rateLimitResult = checkRateLimit(clientId, DEFAULT_RATE_LIMIT);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests",
          retryAfter: rateLimitResult.retryAfter,
          resetAt: rateLimitResult.resetAt.toISOString(),
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const email = searchParams.get("email");

    let vendor = null;

    if (id) {
      vendor = await getVendor(id);
    } else if (email) {
      vendor = await getVendorByEmail(email);
    } else {
      return NextResponse.json(
        { error: "Must provide either id or email parameter" },
        { status: 400 }
      );
    }

    if (!vendor) {
      return NextResponse.json(
        { success: true, vendor: null },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        name: vendor.name,
        contactEmail: vendor.contactEmail,
        accessTier: vendor.accessTier,
        podsStatus: vendor.podsStatus,
        podsApplicationId: vendor.podsApplicationId,
        createdAt: vendor.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API/vendors] Error fetching vendor:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    );
  }
}
