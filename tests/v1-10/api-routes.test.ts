/**
 * V1-10: API Route Integration Tests
 *
 * Tests for API route handlers. These tests call the route handler
 * functions directly without requiring a running server.
 *
 * Uses TDD approach with shared test utilities from TEST-02.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  createTestId,
  createTestVendor,
  createTestApiKey,
  cleanupTestData,
  TestDataTracker,
} from '@/tests/utils';

// =============================================================================
// MOCK HELPERS
// =============================================================================

function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {}
): NextRequest {
  const { method = 'GET', headers = {}, body } = options;

  const init: RequestInit = {
    method,
    headers: new Headers(headers),
  };

  if (body && method !== 'GET') {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

// =============================================================================
// HEALTH ENDPOINTS
// =============================================================================

describe('V1-10: Health Endpoints', () => {
  describe('GET /api/health', () => {
    it('returns 200 with health status', async () => {
      const { GET } = await import('@/app/api/health/route');

      const request = createMockRequest('/api/health');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      // Status can be 'healthy' or 'degraded' (if cache unavailable)
      expect(['healthy', 'degraded']).toContain(body.status);
      expect(body.components).toBeDefined();
      expect(body.components.database).toBe('healthy');
      expect(body.version).toBeDefined();
      expect(body.uptime).toBeGreaterThanOrEqual(0);
      expect(body.timestamp).toBeDefined();
    });

    it('includes cache-control headers', async () => {
      const { GET } = await import('@/app/api/health/route');

      const request = createMockRequest('/api/health');
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toContain('no-cache');
    });
  });

  describe('GET /api/health/live', () => {
    it('returns 200 OK for liveness probe', async () => {
      const { GET } = await import('@/app/api/health/live/route');

      const request = createMockRequest('/api/health/live');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.alive).toBe(true);
      expect(body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/health/ready', () => {
    it('returns 200 when database is ready', async () => {
      const { GET } = await import('@/app/api/health/ready/route');

      const request = createMockRequest('/api/health/ready');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.ready).toBe(true);
    });
  });
});

// =============================================================================
// VENDOR ENDPOINTS
// =============================================================================

describe('V1-10: Vendor Endpoints', () => {
  let tracker: TestDataTracker;

  beforeEach(() => {
    tracker = new TestDataTracker();
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
  });

  describe('GET /api/vendors/me', () => {
    it('returns 401 without authentication', async () => {
      const { GET } = await import('@/app/api/vendors/me/route');

      const request = createMockRequest('/api/vendors/me');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('returns vendor info with valid API key', async () => {
      const vendor = await createTestVendor({ tracker });
      const apiKey = await createTestApiKey({
        vendorId: vendor.id,
        tracker,
        scopes: ['read'],
      });

      const { GET } = await import('@/app/api/vendors/me/route');

      const request = createMockRequest('/api/vendors/me', {
        headers: { Authorization: `Bearer ${apiKey.key}` },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.vendor).toBeDefined();
      expect(body.vendor.id).toBe(vendor.id);
      expect(body.vendor.name).toBe(vendor.name);
      expect(body.scopes).toContain('read');
    });

    it('returns 401 for invalid API key', async () => {
      const { GET } = await import('@/app/api/vendors/me/route');

      const request = createMockRequest('/api/vendors/me', {
        headers: { Authorization: 'Bearer sd_test_invalid123456' },
      });
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });
});

// =============================================================================
// AUTH/KEYS ENDPOINTS
// =============================================================================

describe('V1-10: API Key Management Endpoints', () => {
  let tracker: TestDataTracker;

  beforeEach(() => {
    tracker = new TestDataTracker();
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
  });

  describe('GET /api/auth/keys', () => {
    it('returns 401 without authentication', async () => {
      const { GET } = await import('@/app/api/auth/keys/route');

      const request = createMockRequest('/api/auth/keys');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('returns keys with read scope', async () => {
      const vendor = await createTestVendor({ tracker });
      const apiKey = await createTestApiKey({
        vendorId: vendor.id,
        tracker,
        scopes: ['read'],
      });

      const { GET } = await import('@/app/api/auth/keys/route');

      const request = createMockRequest('/api/auth/keys', {
        headers: { Authorization: `Bearer ${apiKey.key}` },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.keys).toBeDefined();
    });

    it('lists API keys with admin scope', async () => {
      const vendor = await createTestVendor({ tracker });
      const adminKey = await createTestApiKey({
        vendorId: vendor.id,
        tracker,
        scopes: ['admin'],
      });

      // Create additional key
      await createTestApiKey({
        vendorId: vendor.id,
        tracker,
        scopes: ['read'],
      });

      const { GET } = await import('@/app/api/auth/keys/route');

      const request = createMockRequest('/api/auth/keys', {
        headers: { Authorization: `Bearer ${adminKey.key}` },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.keys).toBeDefined();
      expect(body.keys.length).toBeGreaterThanOrEqual(2);
    });

    it('does not expose keyHash in list', async () => {
      const vendor = await createTestVendor({ tracker });
      const adminKey = await createTestApiKey({
        vendorId: vendor.id,
        tracker,
        scopes: ['admin'],
      });

      const { GET } = await import('@/app/api/auth/keys/route');

      const request = createMockRequest('/api/auth/keys', {
        headers: { Authorization: `Bearer ${adminKey.key}` },
      });
      const response = await GET(request);

      const body = await response.json();

      body.keys.forEach((key: Record<string, unknown>) => {
        expect(key).not.toHaveProperty('keyHash');
      });
    });
  });

  describe('POST /api/auth/keys', () => {
    it('creates new API key with admin scope', async () => {
      const vendor = await createTestVendor({ tracker });
      const adminKey = await createTestApiKey({
        vendorId: vendor.id,
        tracker,
        scopes: ['admin'],
      });

      const { POST } = await import('@/app/api/auth/keys/route');

      const request = createMockRequest('/api/auth/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminKey.key}`,
          'Content-Type': 'application/json',
        },
        body: { name: 'New Key', scopes: ['read'] },
      });
      const response = await POST(request);

      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.key).toMatch(/^sd_(test|live)_/);
      expect(body.keyPrefix).toBeDefined();
      expect(body.id).toBeDefined();
    });

    it('returns 403 without admin scope', async () => {
      const vendor = await createTestVendor({ tracker });
      const readKey = await createTestApiKey({
        vendorId: vendor.id,
        tracker,
        scopes: ['read', 'write'],
      });

      const { POST } = await import('@/app/api/auth/keys/route');

      const request = createMockRequest('/api/auth/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${readKey.key}`,
          'Content-Type': 'application/json',
        },
        body: { name: 'New Key', scopes: ['read'] },
      });
      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('validates required fields', async () => {
      const vendor = await createTestVendor({ tracker });
      const adminKey = await createTestApiKey({
        vendorId: vendor.id,
        tracker,
        scopes: ['admin'],
      });

      const { POST } = await import('@/app/api/auth/keys/route');

      const request = createMockRequest('/api/auth/keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminKey.key}`,
          'Content-Type': 'application/json',
        },
        body: {}, // Missing name
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});

// =============================================================================
// PRICING ENDPOINTS
// =============================================================================

describe('V1-10: Pricing Endpoints', () => {
  let tracker: TestDataTracker;

  beforeEach(() => {
    tracker = new TestDataTracker();
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
  });

  describe('GET /api/pricing', () => {
    it('returns 401 without authentication', async () => {
      const { GET } = await import('@/app/api/pricing/route');

      const request = createMockRequest('/api/pricing');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    // Note: Full pricing tests require rate limit infrastructure
    // Covered by dedicated tests in tests/v1-06/
  });

  describe('POST /api/pricing', () => {
    it('returns 401 without authentication', async () => {
      const { POST } = await import('@/app/api/pricing/route');

      const request = createMockRequest('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { channel: 'EMAIL', messageCount: 1000 },
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/pricing/usage', () => {
    it('returns 401 without authentication', async () => {
      const { GET } = await import('@/app/api/pricing/usage/route');

      const request = createMockRequest('/api/pricing/usage');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });
});

// =============================================================================
// AUDIT ENDPOINTS
// =============================================================================

describe('V1-10: Audit Endpoints', () => {
  let tracker: TestDataTracker;

  beforeEach(() => {
    tracker = new TestDataTracker();
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
  });

  describe('GET /api/audit', () => {
    it('returns 401 without authentication', async () => {
      const { GET } = await import('@/app/api/audit/route');

      const request = createMockRequest('/api/audit');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('returns 403 without audit scope', async () => {
      const vendor = await createTestVendor({ tracker });
      const apiKey = await createTestApiKey({
        vendorId: vendor.id,
        tracker,
        scopes: ['read'], // No audit
      });

      const { GET } = await import('@/app/api/audit/route');

      const request = createMockRequest('/api/audit', {
        headers: { Authorization: `Bearer ${apiKey.key}` },
      });
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it('returns audit logs with audit scope', async () => {
      const vendor = await createTestVendor({ tracker });
      const apiKey = await createTestApiKey({
        vendorId: vendor.id,
        tracker,
        scopes: ['audit'],
      });

      const { GET } = await import('@/app/api/audit/route');

      const request = createMockRequest('/api/audit', {
        headers: { Authorization: `Bearer ${apiKey.key}` },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.logs).toBeDefined();
      expect(Array.isArray(body.logs)).toBe(true);
    });
  });
});

// =============================================================================
// METRICS ENDPOINT
// =============================================================================

// Note: Metrics endpoint requires prom-client package
// Skip these tests if prom-client is not installed
describe.skip('V1-10: Metrics Endpoint (requires prom-client)', () => {
  describe('GET /api/metrics', () => {
    it('returns prometheus metrics', async () => {
      const { GET } = await import('@/app/api/metrics/route');

      const request = createMockRequest('/api/metrics');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const text = await response.text();
      expect(text).toContain('# HELP');
      expect(text).toContain('# TYPE');
    });

    it('has correct content-type', async () => {
      const { GET } = await import('@/app/api/metrics/route');

      const request = createMockRequest('/api/metrics');
      const response = await GET(request);

      expect(response.headers.get('Content-Type')).toContain('text/plain');
    });
  });
});
