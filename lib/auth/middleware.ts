/**
 * Authentication Middleware
 *
 * V1-02: Implements middleware for API key authentication and authorization.
 *
 * ## Usage
 *
 * ```typescript
 * import { withAuth, requireScopes } from '@/lib/auth/middleware';
 *
 * // Basic auth (any valid API key)
 * export async function GET(request: NextRequest) {
 *   return withAuth(request, async (req, context) => {
 *     // context.vendorId, context.vendor, context.scopes available
 *     return NextResponse.json({ vendor: context.vendor });
 *   });
 * }
 *
 * // With scope requirements
 * export async function POST(request: NextRequest) {
 *   return withAuth(request, requireScopes(['write'])(async (req, context) => {
 *     // Only called if key has 'write' scope
 *     return NextResponse.json({ success: true });
 *   }));
 * }
 * ```
 *
 * @module lib/auth/middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { validateApiKey, hasAllScopes, type ApiKeyScope } from './api-keys';
import type { Vendor } from '@prisma/client';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Authentication context passed to handlers
 */
export interface AuthContext {
  vendorId: string;
  vendor: Vendor;
  scopes: string[];
  apiKeyId: string;
  requestId: string;
}

/**
 * Handler function type with auth context
 */
export type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<Response>;

// =============================================================================
// TOKEN EXTRACTION
// =============================================================================

/**
 * Extract Bearer token from Authorization header
 *
 * @param request - The incoming request
 * @returns The token or null if not found/invalid
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return null;
  }

  // Case-insensitive "Bearer " prefix
  const lowerHeader = authHeader.toLowerCase();
  if (!lowerHeader.startsWith('bearer ')) {
    return null;
  }

  const token = authHeader.substring(7).trim();

  // Reject empty tokens
  if (!token) {
    return null;
  }

  // Reject tokens with newlines (header injection)
  if (token.includes('\n') || token.includes('\r')) {
    return null;
  }

  return token;
}

// =============================================================================
// AUTH CONTEXT
// =============================================================================

/**
 * Create auth context from validated API key
 *
 * @param apiKey - The validated API key with vendor relation
 * @returns Auth context for handlers
 */
export function createAuthContext(apiKey: {
  id: string;
  vendorId: string;
  vendor: Vendor;
  scopes: string[];
}): AuthContext {
  return {
    vendorId: apiKey.vendorId,
    vendor: apiKey.vendor,
    scopes: apiKey.scopes,
    apiKeyId: apiKey.id,
    requestId: randomUUID(),
  };
}

// =============================================================================
// MAIN MIDDLEWARE
// =============================================================================

/**
 * Wrap a handler with API key authentication
 *
 * @param request - The incoming request
 * @param handler - The handler to call if authenticated
 * @returns Response from handler or error response
 */
export async function withAuth(
  request: NextRequest,
  handler: AuthenticatedHandler
): Promise<Response> {
  const requestId = randomUUID();

  try {
    // Extract token
    const token = extractBearerToken(request);

    if (!token) {
      return NextResponse.json(
        {
          error: 'Missing or invalid Authorization header. Use: Bearer <api_key>',
          requestId,
        },
        { status: 401 }
      );
    }

    // Validate token
    const validation = await validateApiKey(token);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.error || 'Invalid API key',
          requestId,
        },
        { status: 401 }
      );
    }

    // Create auth context
    const context: AuthContext = {
      vendorId: validation.vendorId!,
      vendor: validation.vendor!,
      scopes: validation.scopes!,
      apiKeyId: validation.apiKeyId!,
      requestId,
    };

    // Call handler
    return await handler(request, context);
  } catch (error) {
    console.error('[Auth] Error in middleware:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Authentication error',
        requestId,
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// SCOPE CHECKING
// =============================================================================

/**
 * Create a handler wrapper that requires specific scopes
 *
 * @param requiredScopes - Array of required scopes
 * @returns Wrapper function that checks scopes before calling handler
 *
 * @example
 * ```typescript
 * const handler = requireScopes(['write'])(async (req, ctx) => {
 *   // Only called if key has 'write' scope
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function requireScopes(
  requiredScopes: ApiKeyScope[]
): (handler: AuthenticatedHandler) => AuthenticatedHandler {
  return (handler: AuthenticatedHandler): AuthenticatedHandler => {
    return async (request: NextRequest, context: AuthContext): Promise<Response> => {
      if (!hasAllScopes(context.scopes, requiredScopes)) {
        const missing = requiredScopes.filter(
          (scope) => !context.scopes.includes(scope) && !context.scopes.includes('admin')
        );

        return NextResponse.json(
          {
            error: `Missing required scope(s): ${missing.join(', ')}`,
            requestId: context.requestId,
          },
          { status: 403 }
        );
      }

      return handler(request, context);
    };
  };
}

/**
 * Require admin scope for a handler
 *
 * Convenience wrapper for requireScopes(['admin'])
 */
export function requireAdmin(handler: AuthenticatedHandler): AuthenticatedHandler {
  return requireScopes(['admin'])(handler);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a context has a specific scope
 *
 * @param context - The auth context
 * @param scope - The scope to check
 * @returns true if the scope is present or admin
 */
export function contextHasScope(context: AuthContext, scope: ApiKeyScope): boolean {
  return hasAllScopes(context.scopes, [scope]);
}

/**
 * Create a 401 Unauthorized response
 *
 * @param message - Error message
 * @param requestId - Optional request ID
 * @returns JSON response with 401 status
 */
export function unauthorized(message: string, requestId?: string): Response {
  return NextResponse.json(
    {
      error: message,
      requestId: requestId || randomUUID(),
    },
    { status: 401 }
  );
}

/**
 * Create a 403 Forbidden response
 *
 * @param message - Error message
 * @param requestId - Optional request ID
 * @returns JSON response with 403 status
 */
export function forbidden(message: string, requestId?: string): Response {
  return NextResponse.json(
    {
      error: message,
      requestId: requestId || randomUUID(),
    },
    { status: 403 }
  );
}
