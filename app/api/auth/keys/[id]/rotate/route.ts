/**
 * API Key Rotation - Rotate a specific API key
 *
 * V1-02: Protected endpoint for key rotation
 *
 * POST /api/auth/keys/:id/rotate
 *   - Requires admin scope
 *   - Revokes the old key and creates a new one with same settings
 *   - Cannot rotate the key being used for this request
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, requireScopes } from '@/lib/auth';
import {
  getApiKeyById,
  rotateApiKey,
  ApiKeyNotFoundError,
} from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  return withAuth(
    request,
    requireScopes(['admin'])(async (_req, context) => {
      // Cannot rotate the key being used for this request
      if (id === context.apiKeyId) {
        return NextResponse.json(
          {
            error: 'Cannot rotate the API key being used for this request',
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

      // Security: Only allow rotating own vendor's keys
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
        const result = await rotateApiKey(id);

        return NextResponse.json({
          success: true,
          // IMPORTANT: This is the only time the new key is returned
          newKey: result.newKey.key,
          newKeyPrefix: result.newKey.prefix,
          newKeyId: result.newKeyId,
          oldKeyId: result.oldKeyId,
          message: 'Store the new key securely. It will not be shown again.',
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
