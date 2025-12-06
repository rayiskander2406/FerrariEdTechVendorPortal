/**
 * Current Vendor API - Returns authenticated vendor's info
 *
 * V1-02: Protected by API key authentication
 *
 * GET /api/vendors/me
 *   - Requires valid API key (any scope)
 *   - Returns vendor info for the authenticated vendor
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, context) => {
    return NextResponse.json({
      vendor: {
        id: context.vendor.id,
        name: context.vendor.name,
        contactEmail: context.vendor.contactEmail,
        contactName: context.vendor.contactName,
        website: context.vendor.website,
        defaultAccessTier: context.vendor.defaultAccessTier,
        podsStatus: context.vendor.podsStatus,
        createdAt: context.vendor.createdAt.toISOString(),
      },
      scopes: context.scopes,
      requestId: context.requestId,
    });
  });
}
