/**
 * V1-02: Authentication Middleware - Unit Tests
 *
 * Tests for auth middleware, scope checking, and request context.
 * Target coverage: 95%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

// These will be implemented in lib/auth/middleware.ts
import {
  withAuth,
  requireScopes,
  extractBearerToken,
  createAuthContext,
  type AuthenticatedHandler,
  type AuthContext,
} from '@/lib/auth/middleware';

import { generateApiKey } from '@/lib/auth/api-keys';

// =============================================================================
// TEST HELPERS
// =============================================================================

const TEST_VENDOR_ID = 'test-vendor-middleware';

async function createTestVendor() {
  return prisma.vendor.upsert({
    where: { id: TEST_VENDOR_ID },
    update: {},
    create: {
      id: TEST_VENDOR_ID,
      name: 'Middleware Test Vendor',
      contactEmail: 'middleware@test.com',
      contactName: 'Middleware Contact',
      defaultAccessTier: 'PRIVACY_SAFE',
      podsStatus: 'NOT_STARTED',
    },
  });
}

function createMockRequest(options: {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
}): NextRequest {
  const url = options.url || 'http://localhost:3000/api/test';
  const headers = new Headers(options.headers || {});

  return new NextRequest(url, {
    method: options.method || 'GET',
    headers,
  });
}

// =============================================================================
// BEARER TOKEN EXTRACTION TESTS
// =============================================================================

describe('V1-02: Bearer Token Extraction', () => {
  describe('extractBearerToken', () => {
    it('extracts token from valid Authorization header', () => {
      const request = createMockRequest({
        headers: { Authorization: 'Bearer sd_test_abc123' },
      });

      const token = extractBearerToken(request);

      expect(token).toBe('sd_test_abc123');
    });

    it('returns null for missing Authorization header', () => {
      const request = createMockRequest({});

      const token = extractBearerToken(request);

      expect(token).toBeNull();
    });

    it('returns null for empty Authorization header', () => {
      const request = createMockRequest({
        headers: { Authorization: '' },
      });

      const token = extractBearerToken(request);

      expect(token).toBeNull();
    });

    it('returns null for non-Bearer auth scheme', () => {
      const request = createMockRequest({
        headers: { Authorization: 'Basic dXNlcjpwYXNz' },
      });

      const token = extractBearerToken(request);

      expect(token).toBeNull();
    });

    it('returns null for "Bearer" without token', () => {
      const request = createMockRequest({
        headers: { Authorization: 'Bearer ' },
      });

      const token = extractBearerToken(request);

      expect(token).toBeNull();
    });

    it('returns null for "Bearer" only (no space)', () => {
      const request = createMockRequest({
        headers: { Authorization: 'Bearer' },
      });

      const token = extractBearerToken(request);

      expect(token).toBeNull();
    });

    it('handles case-insensitive "bearer"', () => {
      const request = createMockRequest({
        headers: { Authorization: 'bearer sd_test_abc123' },
      });

      const token = extractBearerToken(request);

      expect(token).toBe('sd_test_abc123');
    });

    it('handles "BEARER" uppercase', () => {
      const request = createMockRequest({
        headers: { Authorization: 'BEARER sd_test_abc123' },
      });

      const token = extractBearerToken(request);

      expect(token).toBe('sd_test_abc123');
    });

    it('preserves token case', () => {
      const request = createMockRequest({
        headers: { Authorization: 'Bearer SD_Test_AbC123XyZ' },
      });

      const token = extractBearerToken(request);

      expect(token).toBe('SD_Test_AbC123XyZ');
    });

    it('handles tokens with special characters', () => {
      const request = createMockRequest({
        headers: { Authorization: 'Bearer sd_test_abc-123_xyz' },
      });

      const token = extractBearerToken(request);

      expect(token).toBe('sd_test_abc-123_xyz');
    });

    it('handles long tokens', () => {
      const longToken = 'sd_test_' + 'a'.repeat(200);
      const request = createMockRequest({
        headers: { Authorization: `Bearer ${longToken}` },
      });

      const token = extractBearerToken(request);

      expect(token).toBe(longToken);
    });
  });
});

// =============================================================================
// WITH AUTH MIDDLEWARE TESTS
// =============================================================================

describe('V1-02: withAuth Middleware', () => {
  beforeEach(async () => {
    await createTestVendor();
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  afterEach(async () => {
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  describe('successful authentication', () => {
    it('calls handler with authenticated request for valid key', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Valid Key',
          scopes: ['read'],
        },
      });

      const request = createMockRequest({
        headers: { Authorization: `Bearer ${generated.key}` },
      });

      let capturedContext: AuthContext | null = null;

      const response = await withAuth(request, async (req, context) => {
        capturedContext = context;
        return new Response('OK');
      });

      expect(response.status).toBe(200);
      expect(capturedContext).not.toBeNull();
      expect(capturedContext?.vendorId).toBe(TEST_VENDOR_ID);
    });

    it('includes vendor in auth context', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Vendor Key',
          scopes: ['read'],
        },
      });

      const request = createMockRequest({
        headers: { Authorization: `Bearer ${generated.key}` },
      });

      let capturedContext: AuthContext | null = null;

      await withAuth(request, async (req, context) => {
        capturedContext = context;
        return new Response('OK');
      });

      expect(capturedContext?.vendor).toBeDefined();
      expect(capturedContext?.vendor?.name).toBe('Middleware Test Vendor');
    });

    it('includes scopes in auth context', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Scoped Key',
          scopes: ['read', 'write', 'message'],
        },
      });

      const request = createMockRequest({
        headers: { Authorization: `Bearer ${generated.key}` },
      });

      let capturedContext: AuthContext | null = null;

      await withAuth(request, async (req, context) => {
        capturedContext = context;
        return new Response('OK');
      });

      expect(capturedContext?.scopes).toEqual(['read', 'write', 'message']);
    });

    it('includes requestId in auth context', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Request ID Key',
          scopes: ['read'],
        },
      });

      const request = createMockRequest({
        headers: { Authorization: `Bearer ${generated.key}` },
      });

      let capturedContext: AuthContext | null = null;

      await withAuth(request, async (req, context) => {
        capturedContext = context;
        return new Response('OK');
      });

      expect(capturedContext?.requestId).toBeDefined();
      expect(capturedContext?.requestId).toMatch(/^[a-f0-9-]+$/);
    });
  });

  describe('missing authorization', () => {
    it('returns 401 for missing Authorization header', async () => {
      const request = createMockRequest({});

      const response = await withAuth(request, async () => {
        return new Response('Should not reach');
      });

      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error).toContain('Authorization');
    });

    it('does not call handler when auth fails', async () => {
      const request = createMockRequest({});

      let handlerCalled = false;

      await withAuth(request, async () => {
        handlerCalled = true;
        return new Response('OK');
      });

      expect(handlerCalled).toBe(false);
    });
  });

  describe('invalid authorization', () => {
    it('returns 401 for invalid Bearer token format', async () => {
      const request = createMockRequest({
        headers: { Authorization: 'InvalidFormat' },
      });

      const response = await withAuth(request, async () => {
        return new Response('Should not reach');
      });

      expect(response.status).toBe(401);
    });

    it('returns 401 for non-existent API key', async () => {
      const request = createMockRequest({
        headers: { Authorization: 'Bearer sd_test_nonexistent123' },
      });

      const response = await withAuth(request, async () => {
        return new Response('Should not reach');
      });

      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error).toContain('Invalid');
    });

    it('returns 401 for revoked API key', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Revoked Key',
          scopes: ['read'],
          revokedAt: new Date(),
        },
      });

      const request = createMockRequest({
        headers: { Authorization: `Bearer ${generated.key}` },
      });

      const response = await withAuth(request, async () => {
        return new Response('Should not reach');
      });

      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error).toContain('revoked');
    });

    it('returns 401 for expired API key', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Expired Key',
          scopes: ['read'],
          expiresAt: new Date(Date.now() - 86400000),
        },
      });

      const request = createMockRequest({
        headers: { Authorization: `Bearer ${generated.key}` },
      });

      const response = await withAuth(request, async () => {
        return new Response('Should not reach');
      });

      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error).toContain('expired');
    });
  });

  describe('error response format', () => {
    it('returns JSON error response', async () => {
      const request = createMockRequest({});

      const response = await withAuth(request, async () => {
        return new Response('OK');
      });

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('includes request ID in error response', async () => {
      const request = createMockRequest({});

      const response = await withAuth(request, async () => {
        return new Response('OK');
      });

      const body = await response.json();
      expect(body.requestId).toBeDefined();
    });
  });
});

// =============================================================================
// SCOPE CHECKING TESTS
// =============================================================================

describe('V1-02: Scope Checking', () => {
  beforeEach(async () => {
    await createTestVendor();
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  afterEach(async () => {
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  describe('requireScopes', () => {
    it('allows request when key has required scope', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Read Key',
          scopes: ['read'],
        },
      });

      const request = createMockRequest({
        headers: { Authorization: `Bearer ${generated.key}` },
      });

      const handler = requireScopes(['read'])(async () => {
        return new Response('OK');
      });

      const response = await withAuth(request, handler);

      expect(response.status).toBe(200);
    });

    it('allows request when key has all required scopes', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Multi-Scope Key',
          scopes: ['read', 'write', 'message'],
        },
      });

      const request = createMockRequest({
        headers: { Authorization: `Bearer ${generated.key}` },
      });

      const handler = requireScopes(['read', 'write'])(async () => {
        return new Response('OK');
      });

      const response = await withAuth(request, handler);

      expect(response.status).toBe(200);
    });

    it('returns 403 when key is missing required scope', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Read Only Key',
          scopes: ['read'],
        },
      });

      const request = createMockRequest({
        headers: { Authorization: `Bearer ${generated.key}` },
      });

      const handler = requireScopes(['write'])(async () => {
        return new Response('Should not reach');
      });

      const response = await withAuth(request, handler);

      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.error).toContain('scope');
      expect(body.error).toContain('write');
    });

    it('returns 403 when key is missing one of multiple required scopes', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Partial Scope Key',
          scopes: ['read'],
        },
      });

      const request = createMockRequest({
        headers: { Authorization: `Bearer ${generated.key}` },
      });

      const handler = requireScopes(['read', 'write'])(async () => {
        return new Response('Should not reach');
      });

      const response = await withAuth(request, handler);

      expect(response.status).toBe(403);
    });

    it('admin scope grants all permissions', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Admin Key',
          scopes: ['admin'],
        },
      });

      const request = createMockRequest({
        headers: { Authorization: `Bearer ${generated.key}` },
      });

      const handler = requireScopes(['read', 'write', 'message'])(async () => {
        return new Response('OK');
      });

      const response = await withAuth(request, handler);

      expect(response.status).toBe(200);
    });

    it('empty required scopes allows any authenticated request', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Any Scope Key',
          scopes: [],
        },
      });

      const request = createMockRequest({
        headers: { Authorization: `Bearer ${generated.key}` },
      });

      const handler = requireScopes([])(async () => {
        return new Response('OK');
      });

      const response = await withAuth(request, handler);

      expect(response.status).toBe(200);
    });
  });
});

// =============================================================================
// AUTH CONTEXT TESTS
// =============================================================================

describe('V1-02: Auth Context', () => {
  beforeEach(async () => {
    await createTestVendor();
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  afterEach(async () => {
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  describe('createAuthContext', () => {
    it('creates context with all required fields', async () => {
      const generated = await generateApiKey();

      const apiKey = await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Context Key',
          scopes: ['read', 'write'],
        },
        include: { vendor: true },
      });

      const context = createAuthContext(apiKey);

      expect(context.vendorId).toBe(TEST_VENDOR_ID);
      expect(context.vendor).toBeDefined();
      expect(context.scopes).toEqual(['read', 'write']);
      expect(context.apiKeyId).toBe(apiKey.id);
      expect(context.requestId).toBeDefined();
    });

    it('generates unique requestId each time', async () => {
      const generated = await generateApiKey();

      const apiKey = await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Unique ID Key',
          scopes: ['read'],
        },
        include: { vendor: true },
      });

      const context1 = createAuthContext(apiKey);
      const context2 = createAuthContext(apiKey);

      expect(context1.requestId).not.toBe(context2.requestId);
    });
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe('V1-02: Middleware Edge Cases', () => {
  beforeEach(async () => {
    await createTestVendor();
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  afterEach(async () => {
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  describe('handler errors', () => {
    it('propagates errors from handler', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Error Key',
          scopes: ['read'],
        },
      });

      const request = createMockRequest({
        headers: { Authorization: `Bearer ${generated.key}` },
      });

      const response = await withAuth(request, async () => {
        throw new Error('Handler error');
      });

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.error).toBeDefined();
    });
  });

  describe('concurrent requests', () => {
    it('handles concurrent requests with same key', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Concurrent Key',
          scopes: ['read'],
        },
      });

      const requests = Array(5)
        .fill(null)
        .map(() =>
          createMockRequest({
            headers: { Authorization: `Bearer ${generated.key}` },
          })
        );

      const responses = await Promise.all(
        requests.map((req) =>
          withAuth(req, async () => new Response('OK'))
        )
      );

      expect(responses.every((r) => r.status === 200)).toBe(true);
    });
  });

  describe('request methods', () => {
    it('works with GET requests', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'GET Key',
          scopes: ['read'],
        },
      });

      const request = createMockRequest({
        method: 'GET',
        headers: { Authorization: `Bearer ${generated.key}` },
      });

      const response = await withAuth(request, async () => new Response('OK'));

      expect(response.status).toBe(200);
    });

    it('works with POST requests', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'POST Key',
          scopes: ['write'],
        },
      });

      const request = createMockRequest({
        method: 'POST',
        headers: { Authorization: `Bearer ${generated.key}` },
      });

      const response = await withAuth(request, async () => new Response('OK'));

      expect(response.status).toBe(200);
    });

    it('works with DELETE requests', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'DELETE Key',
          scopes: ['admin'],
        },
      });

      const request = createMockRequest({
        method: 'DELETE',
        headers: { Authorization: `Bearer ${generated.key}` },
      });

      const response = await withAuth(request, async () => new Response('OK'));

      expect(response.status).toBe(200);
    });
  });
});

// =============================================================================
// SECURITY TESTS
// =============================================================================

describe('V1-02: Security', () => {
  beforeEach(async () => {
    await createTestVendor();
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  afterEach(async () => {
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  describe('key exposure prevention', () => {
    it('does not expose API key in error responses', async () => {
      const request = createMockRequest({
        headers: { Authorization: 'Bearer sd_test_secretkey123' },
      });

      const response = await withAuth(request, async () => {
        return new Response('OK');
      });

      const body = await response.json();
      const bodyString = JSON.stringify(body);

      expect(bodyString).not.toContain('secretkey123');
    });

    it('does not expose key hash in responses', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Hash Test Key',
          scopes: ['read'],
        },
      });

      const request = createMockRequest({
        headers: { Authorization: `Bearer ${generated.key}` },
      });

      let capturedContext: AuthContext | null = null;

      await withAuth(request, async (req, context) => {
        capturedContext = context;
        return new Response('OK');
      });

      expect(capturedContext).not.toHaveProperty('keyHash');
      expect(JSON.stringify(capturedContext)).not.toContain(generated.hash);
    });
  });

  describe('header injection', () => {
    it('handles Authorization header with extra whitespace', async () => {
      const request = createMockRequest({
        headers: { Authorization: 'Bearer   sd_test_key123  ' },
      });

      // Should trim and still work, or reject consistently
      const response = await withAuth(request, async () => {
        return new Response('OK');
      });

      // Either 401 (invalid key) or 200 (if trimmed) - not 500
      expect([200, 401]).toContain(response.status);
    });

    it('rejects Authorization header with newlines', () => {
      // Note: The Headers API in Node.js/browsers already prevents creating headers
      // with newlines (throws TypeError), providing first-line defense against header injection.
      // Our extractBearerToken also checks for this as defense-in-depth.
      // We test the extractBearerToken function directly with a mock.
      const mockRequest = {
        headers: {
          get: (name: string) => (name === 'Authorization' ? 'Bearer sd_test\nkey123' : null),
        },
      } as unknown as NextRequest;

      const token = extractBearerToken(mockRequest);
      expect(token).toBeNull();
    });
  });
});
