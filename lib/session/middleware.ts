/**
 * Session Middleware
 *
 * V1-04: Middleware for integrating sessions with API routes.
 *
 * ## Usage
 *
 * ```typescript
 * // Standalone session (when vendorId is known)
 * import { withSession } from '@/lib/session/middleware';
 *
 * export async function POST(request: NextRequest) {
 *   return withSession(request, vendorId, async (req, ctx) => {
 *     // ctx.session is available
 *     return NextResponse.json({ sessionId: ctx.sessionId });
 *   });
 * }
 *
 * // Combined auth + session
 * import { withAuthAndSession } from '@/lib/session/middleware';
 *
 * export async function POST(request: NextRequest) {
 *   return withAuthAndSession(request, async (req, ctx) => {
 *     // ctx.session and ctx.vendorId are both available
 *     return NextResponse.json({ vendor: ctx.vendorId });
 *   });
 * }
 * ```
 *
 * @module lib/session/middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createSession,
  getSessionByToken,
  extendSession,
  type VendorSession,
} from './index';
import { withAuth, type AuthContext } from '@/lib/auth';

// =============================================================================
// TYPES
// =============================================================================

export interface SessionContext {
  session: VendorSession;
  sessionId: string;
  sessionToken: string;
  isNewSession: boolean;
}

export interface AuthSessionContext extends AuthContext, SessionContext {}

export type SessionHandler = (
  request: NextRequest,
  context: SessionContext
) => Promise<Response>;

export type AuthSessionHandler = (
  request: NextRequest,
  context: AuthSessionContext
) => Promise<Response>;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Extract session token from request headers
 */
function extractSessionToken(request: NextRequest): string | null {
  // Check X-Session-Token header first
  const sessionHeader = request.headers.get('X-Session-Token');
  if (sessionHeader) {
    return sessionHeader;
  }

  // Check Authorization header with "Session" scheme
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Session ')) {
    return authHeader.slice(8);
  }

  return null;
}

/**
 * Add session headers to response
 */
function addSessionHeaders(
  response: Response,
  session: VendorSession,
  isNew: boolean
): Response {
  const newHeaders = new Headers(response.headers);

  // Always include session token for new sessions
  if (isNew) {
    newHeaders.set('X-Session-Token', session.sessionToken);
  }

  // Include expiration time
  newHeaders.set('X-Session-Expires', session.expiresAt.toISOString());

  // Create new response with merged headers
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

// =============================================================================
// GET OR CREATE SESSION
// =============================================================================

/**
 * Get existing session or create a new one
 *
 * @param vendorId - Vendor ID
 * @param token - Optional session token
 * @returns Session result or null if token belongs to different vendor
 */
export async function getOrCreateSession(
  vendorId: string,
  token: string | undefined
): Promise<{ session: VendorSession; isNew: boolean } | null> {
  // Try to get existing session by token
  if (token) {
    const existingSession = await getSessionByToken(token);

    if (existingSession) {
      // Validate session belongs to this vendor
      if (existingSession.vendorId !== vendorId) {
        return null; // Session belongs to different vendor
      }

      return { session: existingSession, isNew: false };
    }
  }

  // Create new session
  const newSession = await createSession({ vendorId });
  return { session: newSession, isNew: true };
}

// =============================================================================
// WITH SESSION MIDDLEWARE
// =============================================================================

/**
 * Wrap a handler with session management
 *
 * @param request - The incoming request
 * @param vendorId - The vendor ID
 * @param handler - The handler to call with session context
 * @returns Response from handler with session headers
 */
export async function withSession(
  request: NextRequest,
  vendorId: string,
  handler: SessionHandler
): Promise<Response> {
  try {
    const token = extractSessionToken(request);

    const result = await getOrCreateSession(vendorId, token || undefined);

    if (result === null) {
      // Session belongs to different vendor
      return NextResponse.json(
        { error: 'Session does not belong to this vendor' },
        { status: 403 }
      );
    }

    const { session, isNew } = result;

    // Extend session on activity (for existing sessions)
    if (!isNew) {
      await extendSession(session.id);
    }

    // Build session context
    const context: SessionContext = {
      session,
      sessionId: session.id,
      sessionToken: session.sessionToken,
      isNewSession: isNew,
    };

    // Call handler
    const response = await handler(request, context);

    // Add session headers to response
    return addSessionHeaders(response, session, isNew);
  } catch (error) {
    console.error('[Session] Error in session middleware:', error);

    return NextResponse.json(
      { error: 'Failed to manage session' },
      { status: 500 }
    );
  }
}

// =============================================================================
// WITH AUTH AND SESSION COMBINED
// =============================================================================

/**
 * Wrap a handler with both authentication and session management
 *
 * Authentication is checked first. If successful, session is managed
 * based on the authenticated vendor ID.
 *
 * @param request - The incoming request
 * @param handler - The handler to call if auth passes and session is ready
 * @returns Response from handler, 401, 403, or 500 error
 */
export async function withAuthAndSession(
  request: NextRequest,
  handler: AuthSessionHandler
): Promise<Response> {
  return withAuth(request, async (req, authContext) => {
    try {
      const token = extractSessionToken(req);

      const result = await getOrCreateSession(
        authContext.vendorId,
        token || undefined
      );

      if (result === null) {
        // Session belongs to different vendor
        return NextResponse.json(
          {
            error: 'Session does not belong to this vendor',
            requestId: authContext.requestId,
          },
          { status: 403 }
        );
      }

      const { session, isNew } = result;

      // Extend session on activity (for existing sessions)
      if (!isNew) {
        await extendSession(session.id);
      }

      // Build combined context
      const context: AuthSessionContext = {
        ...authContext,
        session,
        sessionId: session.id,
        sessionToken: session.sessionToken,
        isNewSession: isNew,
      };

      // Call handler
      const response = await handler(req, context);

      // Add session headers to response
      return addSessionHeaders(response, session, isNew);
    } catch (error) {
      console.error('[Session] Error in auth+session middleware:', error);

      return NextResponse.json(
        {
          error: 'Failed to manage session',
          requestId: authContext.requestId,
        },
        { status: 500 }
      );
    }
  });
}
