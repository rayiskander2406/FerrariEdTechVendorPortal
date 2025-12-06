/**
 * API Key Management - Individual key operations
 *
 * V1-02: Protected endpoints for single API key management
 *
 * GET /api/auth/keys/:id
 *   - Requires read scope
 *   - Returns info for a specific API key
 *
 * DELETE /api/auth/keys/:id
 *   - Requires admin scope
 *   - Revokes the specified API key
 *   - Cannot revoke the key being used for this request
 *
 * POST /api/auth/keys/:id/rotate
 *   - Requires admin scope
 *   - Rotates the key (revokes old, creates new)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, requireScopes } from '@/lib/auth';
import {
  getApiKeyById,
  revokeApiKey,
  ApiKeyNotFoundError,
} from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  return withAuth(
    request,
    requireScopes(['read'])(async (_req, context) => {
      const key = await getApiKeyById(id);

      if (!key) {
        return NextResponse.json(
          {
            error: 'API key not found',
            requestId: context.requestId,
          },
          { status: 404 }
        );
      }

      // Security: Only allow viewing own vendor's keys
      if (key.vendorId !== context.vendorId) {
        return NextResponse.json(
          {
            error: 'API key not found',
            requestId: context.requestId,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        key,
        requestId: context.requestId,
      });
    })
  );
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  return withAuth(
    request,
    requireScopes(['admin'])(async (_req, context) => {
      // Cannot revoke the key being used for this request
      if (id === context.apiKeyId) {
        return NextResponse.json(
          {
            error: 'Cannot revoke the API key being used for this request',
            requestId: context.requestId,
          },
          { status: 400 }
        );
      }

      // Check key exists and belongs to this vendor
      const key = await getApiKeyById(id);

      if (!key) {
        return NextResponse.json(
          {
            error: 'API key not found',
            requestId: context.requestId,
          },
          { status: 404 }
        );
      }

      // Security: Only allow revoking own vendor's keys
      if (key.vendorId !== context.vendorId) {
        return NextResponse.json(
          {
            error: 'API key not found',
            requestId: context.requestId,
          },
          { status: 404 }
        );
      }

      try {
        const revoked = await revokeApiKey(id);

        return NextResponse.json({
          success: true,
          key: {
            id: revoked.id,
            name: revoked.name,
            revokedAt: revoked.revokedAt?.toISOString(),
          },
          requestId: context.requestId,
        });
      } catch (error) {
        if (error instanceof ApiKeyNotFoundError) {
          return NextResponse.json(
            {
              error: 'API key not found',
              requestId: context.requestId,
            },
            { status: 404 }
          );
        }
        throw error;
      }
    })
  );
}

