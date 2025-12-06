/**
 * V1-04: Session Middleware - Integration Tests
 *
 * Tests for session middleware integration with API routes.
 * Target coverage: 95%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// These will be implemented
import {
  withSession,
  withAuthAndSession,
  getOrCreateSession,
  SessionContext,
  type SessionHandler,
  type AuthSessionHandler,
} from '@/lib/session/middleware';

// =============================================================================
// TEST HELPERS
// =============================================================================

const TEST_VENDOR_ID = 'test-vendor-middleware';
const TEST_SESSION_TOKEN = 'vss_test123abc';

// Mock the session module
vi.mock('@/lib/session', async () => {
  return {
    createSession: vi.fn(),
    getSession: vi.fn(),
    getSessionByToken: vi.fn(),
    updateSession: vi.fn(),
    extendSession: vi.fn(),
    addMessageToHistory: vi.fn(),
    SESSION_DURATION_MS: 24 * 60 * 60 * 1000,
  };
});

// Mock the auth module
vi.mock('@/lib/auth', async () => {
  return {
    withAuth: vi.fn((request, handler) =>
      handler(request, {
        vendorId: TEST_VENDOR_ID,
        vendor: {
          id: TEST_VENDOR_ID,
          name: 'Test Vendor',
          defaultAccessTier: 'PRIVACY_SAFE',
        },
        scopes: ['read', 'write'],
        apiKeyId: 'test-key-id',
        requestId: 'test-request-id',
      })
    ),
  };
});

function createMockRequest(options: {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: object;
}): NextRequest {
  const url = options.url || 'http://localhost:3000/api/chat';
  const headers = new Headers(options.headers || {});

  return new NextRequest(url, {
    method: options.method || 'POST',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

function createMockSession(overrides?: Record<string, any>) {
  return {
    id: 'session-123',
    vendorId: TEST_VENDOR_ID,
    sessionToken: TEST_SESSION_TOKEN,
    conversationHistory: [],
    vendorState: {},
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    lastActivityAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// =============================================================================
// WITH SESSION MIDDLEWARE TESTS
// =============================================================================

describe('V1-04: withSession Middleware', () => {
  let mockSessionModule: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSessionModule = await import('@/lib/session');
  });

  describe('session from header', () => {
    it('retrieves session from X-Session-Token header', async () => {
      const mockSession = createMockSession();
      (mockSessionModule.getSessionByToken as any).mockResolvedValue(mockSession);

      const handler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );
      const request = createMockRequest({
        headers: { 'X-Session-Token': TEST_SESSION_TOKEN },
      });

      await withSession(request, TEST_VENDOR_ID, handler);

      expect(mockSessionModule.getSessionByToken).toHaveBeenCalledWith(
        TEST_SESSION_TOKEN
      );
      expect(handler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({ session: mockSession })
      );
    });

    it('retrieves session from Authorization header (Bearer session)', async () => {
      const mockSession = createMockSession();
      (mockSessionModule.getSessionByToken as any).mockResolvedValue(mockSession);

      const handler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );
      const request = createMockRequest({
        headers: { Authorization: `Session ${TEST_SESSION_TOKEN}` },
      });

      await withSession(request, TEST_VENDOR_ID, handler);

      expect(mockSessionModule.getSessionByToken).toHaveBeenCalledWith(
        TEST_SESSION_TOKEN
      );
    });
  });

  describe('session creation', () => {
    it('creates new session if none provided', async () => {
      const newSession = createMockSession();
      (mockSessionModule.getSessionByToken as any).mockResolvedValue(null);
      (mockSessionModule.createSession as any).mockResolvedValue(newSession);

      const handler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );
      const request = createMockRequest({});

      await withSession(request, TEST_VENDOR_ID, handler);

      expect(mockSessionModule.createSession).toHaveBeenCalledWith({
        vendorId: TEST_VENDOR_ID,
      });
    });

    it('includes session token in response header for new session', async () => {
      const newSession = createMockSession();
      (mockSessionModule.getSessionByToken as any).mockResolvedValue(null);
      (mockSessionModule.createSession as any).mockResolvedValue(newSession);

      const handler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );
      const request = createMockRequest({});

      const response = await withSession(request, TEST_VENDOR_ID, handler);

      expect(response.headers.get('X-Session-Token')).toBe(TEST_SESSION_TOKEN);
    });
  });

  describe('session validation', () => {
    it('rejects session belonging to different vendor', async () => {
      const wrongVendorSession = createMockSession({ vendorId: 'other-vendor' });
      (mockSessionModule.getSessionByToken as any).mockResolvedValue(
        wrongVendorSession
      );

      const handler = vi.fn();
      const request = createMockRequest({
        headers: { 'X-Session-Token': TEST_SESSION_TOKEN },
      });

      const response = await withSession(request, TEST_VENDOR_ID, handler);

      expect(response.status).toBe(403);
      expect(handler).not.toHaveBeenCalled();
    });

    it('creates new session for expired token', async () => {
      (mockSessionModule.getSessionByToken as any).mockResolvedValue(null);
      const newSession = createMockSession();
      (mockSessionModule.createSession as any).mockResolvedValue(newSession);

      const handler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );
      const request = createMockRequest({
        headers: { 'X-Session-Token': 'expired-token' },
      });

      await withSession(request, TEST_VENDOR_ID, handler);

      expect(mockSessionModule.createSession).toHaveBeenCalled();
    });
  });

  describe('session extension', () => {
    it('extends session on activity', async () => {
      const mockSession = createMockSession();
      (mockSessionModule.getSessionByToken as any).mockResolvedValue(mockSession);
      (mockSessionModule.extendSession as any).mockResolvedValue(mockSession);

      const handler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );
      const request = createMockRequest({
        headers: { 'X-Session-Token': TEST_SESSION_TOKEN },
      });

      await withSession(request, TEST_VENDOR_ID, handler);

      expect(mockSessionModule.extendSession).toHaveBeenCalledWith(
        mockSession.id
      );
    });
  });
});

// =============================================================================
// WITH AUTH AND SESSION COMBINED TESTS
// =============================================================================

describe('V1-04: withAuthAndSession Combined Middleware', () => {
  let mockSessionModule: any;
  let mockAuthModule: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSessionModule = await import('@/lib/session');
    mockAuthModule = await import('@/lib/auth');
  });

  it('authenticates before creating/retrieving session', async () => {
    const mockSession = createMockSession();
    (mockSessionModule.getSessionByToken as any).mockResolvedValue(null);
    (mockSessionModule.createSession as any).mockResolvedValue(mockSession);

    const handler = vi.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );
    const request = createMockRequest({
      headers: { Authorization: 'Bearer api-key' },
    });

    await withAuthAndSession(request, handler);

    // Auth should be checked first
    expect(mockAuthModule.withAuth).toHaveBeenCalled();
    // Then session created with vendorId from auth
    expect(mockSessionModule.createSession).toHaveBeenCalledWith({
      vendorId: TEST_VENDOR_ID,
    });
  });

  it('passes both auth context and session to handler', async () => {
    const mockSession = createMockSession();
    (mockSessionModule.getSessionByToken as any).mockResolvedValue(mockSession);
    (mockSessionModule.extendSession as any).mockResolvedValue(mockSession);

    const handler = vi.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );
    const request = createMockRequest({
      headers: {
        Authorization: 'Bearer api-key',
        'X-Session-Token': TEST_SESSION_TOKEN,
      },
    });

    await withAuthAndSession(request, handler);

    expect(handler).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        vendorId: TEST_VENDOR_ID,
        session: mockSession,
        scopes: expect.any(Array),
      })
    );
  });

  it('returns 401 before checking session if auth fails', async () => {
    (mockAuthModule.withAuth as any).mockImplementation(async () => {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    });

    const handler = vi.fn();
    const request = createMockRequest({});

    const response = await withAuthAndSession(request, handler);

    expect(response.status).toBe(401);
    expect(mockSessionModule.getSessionByToken).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });
});

// =============================================================================
// GET OR CREATE SESSION TESTS
// =============================================================================

describe('V1-04: getOrCreateSession', () => {
  let mockSessionModule: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSessionModule = await import('@/lib/session');
  });

  it('returns existing session if token valid', async () => {
    const existingSession = createMockSession();
    (mockSessionModule.getSessionByToken as any).mockResolvedValue(
      existingSession
    );

    const result = await getOrCreateSession(TEST_VENDOR_ID, TEST_SESSION_TOKEN);

    expect(result.session).toEqual(existingSession);
    expect(result.isNew).toBe(false);
  });

  it('creates new session if no token provided', async () => {
    const newSession = createMockSession();
    (mockSessionModule.createSession as any).mockResolvedValue(newSession);

    const result = await getOrCreateSession(TEST_VENDOR_ID, undefined);

    expect(result.session).toEqual(newSession);
    expect(result.isNew).toBe(true);
  });

  it('creates new session if token expired', async () => {
    (mockSessionModule.getSessionByToken as any).mockResolvedValue(null);
    const newSession = createMockSession();
    (mockSessionModule.createSession as any).mockResolvedValue(newSession);

    const result = await getOrCreateSession(TEST_VENDOR_ID, 'expired-token');

    expect(result.session).toEqual(newSession);
    expect(result.isNew).toBe(true);
  });

  it('returns null if session belongs to different vendor', async () => {
    const wrongVendorSession = createMockSession({ vendorId: 'other-vendor' });
    (mockSessionModule.getSessionByToken as any).mockResolvedValue(
      wrongVendorSession
    );

    const result = await getOrCreateSession(TEST_VENDOR_ID, TEST_SESSION_TOKEN);

    expect(result).toBeNull();
  });
});

// =============================================================================
// SESSION CONTEXT TESTS
// =============================================================================

describe('V1-04: Session Context', () => {
  let mockSessionModule: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSessionModule = await import('@/lib/session');
  });

  it('includes session ID in context', async () => {
    const mockSession = createMockSession();
    (mockSessionModule.getSessionByToken as any).mockResolvedValue(mockSession);
    (mockSessionModule.extendSession as any).mockResolvedValue(mockSession);

    const handler = vi.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );
    const request = createMockRequest({
      headers: { 'X-Session-Token': TEST_SESSION_TOKEN },
    });

    await withSession(request, TEST_VENDOR_ID, handler);

    expect(handler).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        sessionId: 'session-123',
      })
    );
  });

  it('includes session token in context', async () => {
    const mockSession = createMockSession();
    (mockSessionModule.getSessionByToken as any).mockResolvedValue(mockSession);
    (mockSessionModule.extendSession as any).mockResolvedValue(mockSession);

    const handler = vi.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );
    const request = createMockRequest({
      headers: { 'X-Session-Token': TEST_SESSION_TOKEN },
    });

    await withSession(request, TEST_VENDOR_ID, handler);

    expect(handler).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        sessionToken: TEST_SESSION_TOKEN,
      })
    );
  });

  it('includes isNewSession flag in context', async () => {
    (mockSessionModule.getSessionByToken as any).mockResolvedValue(null);
    const newSession = createMockSession();
    (mockSessionModule.createSession as any).mockResolvedValue(newSession);

    const handler = vi.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );
    const request = createMockRequest({});

    await withSession(request, TEST_VENDOR_ID, handler);

    expect(handler).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        isNewSession: true,
      })
    );
  });
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

describe('V1-04: Middleware Error Handling', () => {
  let mockSessionModule: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSessionModule = await import('@/lib/session');
  });

  it('returns 500 on session creation error', async () => {
    (mockSessionModule.getSessionByToken as any).mockResolvedValue(null);
    (mockSessionModule.createSession as any).mockRejectedValue(
      new Error('Database error')
    );

    const handler = vi.fn();
    const request = createMockRequest({});

    const response = await withSession(request, TEST_VENDOR_ID, handler);

    expect(response.status).toBe(500);
    expect(handler).not.toHaveBeenCalled();
  });

  it('logs error when session operations fail', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (mockSessionModule.getSessionByToken as any).mockRejectedValue(
      new Error('Redis error')
    );

    const request = createMockRequest({
      headers: { 'X-Session-Token': TEST_SESSION_TOKEN },
    });

    await withSession(request, TEST_VENDOR_ID, vi.fn());

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('handles handler errors correctly', async () => {
    const mockSession = createMockSession();
    (mockSessionModule.getSessionByToken as any).mockResolvedValue(mockSession);
    (mockSessionModule.extendSession as any).mockResolvedValue(mockSession);

    const handler = vi.fn().mockRejectedValue(new Error('Handler error'));
    const request = createMockRequest({
      headers: { 'X-Session-Token': TEST_SESSION_TOKEN },
    });

    // Middleware catches handler errors and returns 500
    const response = await withSession(request, TEST_VENDOR_ID, handler);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});

// =============================================================================
// HEADER PROPAGATION TESTS
// =============================================================================

describe('V1-04: Header Propagation', () => {
  let mockSessionModule: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSessionModule = await import('@/lib/session');
  });

  it('includes X-Session-Token in response for new sessions', async () => {
    const newSession = createMockSession();
    (mockSessionModule.getSessionByToken as any).mockResolvedValue(null);
    (mockSessionModule.createSession as any).mockResolvedValue(newSession);

    const handlerResponse = NextResponse.json({ data: 'test' });
    const handler = vi.fn().mockResolvedValue(handlerResponse);
    const request = createMockRequest({});

    const response = await withSession(request, TEST_VENDOR_ID, handler);

    expect(response.headers.get('X-Session-Token')).toBe(TEST_SESSION_TOKEN);
  });

  it('includes X-Session-Expires in response', async () => {
    const mockSession = createMockSession();
    (mockSessionModule.getSessionByToken as any).mockResolvedValue(mockSession);
    (mockSessionModule.extendSession as any).mockResolvedValue(mockSession);

    const handler = vi.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );
    const request = createMockRequest({
      headers: { 'X-Session-Token': TEST_SESSION_TOKEN },
    });

    const response = await withSession(request, TEST_VENDOR_ID, handler);

    expect(response.headers.get('X-Session-Expires')).toBeDefined();
  });

  it('preserves existing response headers', async () => {
    const mockSession = createMockSession();
    (mockSessionModule.getSessionByToken as any).mockResolvedValue(mockSession);
    (mockSessionModule.extendSession as any).mockResolvedValue(mockSession);

    const handlerResponse = new NextResponse(JSON.stringify({ data: 'test' }), {
      headers: { 'X-Custom-Header': 'custom-value' },
    });
    const handler = vi.fn().mockResolvedValue(handlerResponse);
    const request = createMockRequest({
      headers: { 'X-Session-Token': TEST_SESSION_TOKEN },
    });

    const response = await withSession(request, TEST_VENDOR_ID, handler);

    expect(response.headers.get('X-Custom-Header')).toBe('custom-value');
  });
});
