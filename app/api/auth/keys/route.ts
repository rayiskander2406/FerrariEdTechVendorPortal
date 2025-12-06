/**
 * API Key Management - Create and list API keys
 *
 * V1-02: Protected endpoints for API key management
 *
 * GET /api/auth/keys
 *   - Requires valid API key (read scope)
 *   - Returns list of API keys for the authenticated vendor
 *
 * POST /api/auth/keys
 *   - Requires admin scope
 *   - Creates a new API key for the authenticated vendor
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, requireScopes } from '@/lib/auth';
import { createApiKey, listApiKeys, validateScopes, type ApiKeyScope } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    requireScopes(['read'])(async (_req, context) => {
      const keys = await listApiKeys(context.vendorId);

      return NextResponse.json({
        keys,
        requestId: context.requestId,
      });
    })
  );
}

export async function POST(request: NextRequest) {
  return withAuth(
    request,
    requireScopes(['admin'])(async (req, context) => {
      let body: { name?: string; scopes?: string[]; expiresAt?: string };

      try {
        body = await req.json();
      } catch {
        return NextResponse.json(
          {
            error: 'Invalid JSON body',
            requestId: context.requestId,
          },
          { status: 400 }
        );
      }

      // Validate required fields
      if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json(
          {
            error: 'Missing or invalid required field: name',
            requestId: context.requestId,
          },
          { status: 400 }
        );
      }

      // Validate scopes
      const scopes = body.scopes || ['read', 'write'];
      if (!Array.isArray(scopes)) {
        return NextResponse.json(
          {
            error: 'scopes must be an array',
            requestId: context.requestId,
          },
          { status: 400 }
        );
      }

      if (!validateScopes(scopes)) {
        return NextResponse.json(
          {
            error: 'Invalid scopes. Valid scopes are: read, write, message, admin',
            requestId: context.requestId,
          },
          { status: 400 }
        );
      }

      // Parse optional expiration
      let expiresAt: Date | undefined;
      if (body.expiresAt) {
        expiresAt = new Date(body.expiresAt);
        if (isNaN(expiresAt.getTime())) {
          return NextResponse.json(
            {
              error: 'Invalid expiresAt date format',
              requestId: context.requestId,
            },
            { status: 400 }
          );
        }
      }

      // Create the key
      const { key, record } = await createApiKey(
        context.vendorId,
        body.name.trim(),
        scopes as ApiKeyScope[],
        expiresAt
      );

      return NextResponse.json(
        {
          // IMPORTANT: This is the only time the full key is returned
          key: key.key,
          keyPrefix: key.prefix,
          id: record.id,
          name: record.name,
          scopes: record.scopes,
          createdAt: record.createdAt.toISOString(),
          expiresAt: record.expiresAt?.toISOString() || null,
          message: 'Store this key securely. It will not be shown again.',
          requestId: context.requestId,
        },
        { status: 201 }
      );
    })
  );
}
