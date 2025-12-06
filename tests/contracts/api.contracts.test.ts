/**
 * API Contract Tests
 *
 * TEST-03: Verifies that API endpoints adhere to their documented contracts.
 *
 * These tests validate:
 * - Response structure matches Zod schemas
 * - HTTP status codes are correct
 * - Required headers are present
 * - Error responses follow standard format
 *
 * @module tests/contracts/api.contracts.test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { generateApiKey, hashApiKey } from '@/lib/auth/api-keys';

// Import contract schemas
import {
  // Health
  HealthResponseSchema,
  LiveResponseSchema,
  ReadyResponseSchema,
  // Auth
  VendorMeResponseSchema,
  ApiKeysListResponseSchema,
  // Pricing
  PricingResponseSchema,
  BatchEstimateResponseSchema,
  // Audit
  AuditLogsResponseSchema,
  // Errors
  UnauthorizedResponseSchema,
  ForbiddenResponseSchema,
  ErrorResponseSchema,
} from './schemas';

// =============================================================================
// TEST SETUP
// =============================================================================

const TEST_VENDOR_ID = 'contract-test-vendor';
let testApiKey: string;
let testApiKeyAdmin: string;
let testApiKeyAudit: string;

/**
 * Create a mock Request object for testing
 */
function createRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {}
): Request {
  const { method = 'GET', headers = {}, body } = options;

  return new Request(`http://localhost:3000${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Create authenticated request with API key
 */
function createAuthRequest(
  url: string,
  apiKey: string,
  options: Omit<Parameters<typeof createRequest>[1], 'headers'> & {
    headers?: Record<string, string>;
  } = {}
): Request {
  return createRequest(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...options.headers,
    },
  });
}

beforeAll(async () => {
  // Create test vendor
  await prisma.vendor.upsert({
    where: { id: TEST_VENDOR_ID },
    update: {},
    create: {
      id: TEST_VENDOR_ID,
      name: 'Contract Test Vendor',
      contactEmail: 'contract-test@example.com',
      contactName: 'Contract Tester',
      defaultAccessTier: 'PRIVACY_SAFE',
      podsStatus: 'approved',
    },
  });

  // Create API keys with different scopes
  const readKey = await generateApiKey();
  const adminKey = await generateApiKey();
  const auditKey = await generateApiKey();

  await prisma.apiKey.createMany({
    data: [
      {
        vendorId: TEST_VENDOR_ID,
        keyPrefix: readKey.prefix,
        keyHash: readKey.hash,
        name: 'Read Key',
        scopes: ['read'],
      },
      {
        vendorId: TEST_VENDOR_ID,
        keyPrefix: adminKey.prefix,
        keyHash: adminKey.hash,
        name: 'Admin Key',
        scopes: ['read', 'write', 'admin'],
      },
      {
        vendorId: TEST_VENDOR_ID,
        keyPrefix: auditKey.prefix,
        keyHash: auditKey.hash,
        name: 'Audit Key',
        scopes: ['read', 'audit'],
      },
    ],
    skipDuplicates: true,
  });

  testApiKey = readKey.key;
  testApiKeyAdmin = adminKey.key;
  testApiKeyAudit = auditKey.key;
});

afterAll(async () => {
  // Cleanup test data
  await prisma.apiKey.deleteMany({
    where: { vendorId: TEST_VENDOR_ID },
  });
  await prisma.vendor.delete({
    where: { id: TEST_VENDOR_ID },
  }).catch(() => {});
});

// =============================================================================
// HEALTH ENDPOINT CONTRACTS
// =============================================================================

describe('Health Endpoint Contracts', () => {
  describe('GET /api/health', () => {
    it('returns 200 with valid HealthResponse schema', async () => {
      const { GET } = await import('@/app/api/health/route');
      const request = createRequest('/api/health');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      const result = HealthResponseSchema.safeParse(body);

      expect(result.success).toBe(true);
      if (!result.success) {
        console.error('Schema validation failed:', result.error.issues);
      }
    });

    it('contains required Cache-Control header', async () => {
      const { GET } = await import('@/app/api/health/route');
      const request = createRequest('/api/health');
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toContain('no-cache');
    });

    it('returns valid status and database is healthy', async () => {
      const { GET } = await import('@/app/api/health/route');
      const request = createRequest('/api/health');
      const response = await GET(request);
      const body = await response.json();

      // Status can be healthy or degraded (if cache is down)
      expect(['healthy', 'degraded', 'unhealthy']).toContain(body.status);
      // Database should always be healthy in test environment
      expect(body.components.database).toBe('healthy');
    });
  });

  describe('GET /api/health/live', () => {
    it('returns 200 with valid LiveResponse schema', async () => {
      const { GET } = await import('@/app/api/health/live/route');
      const request = createRequest('/api/health/live');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      const result = LiveResponseSchema.safeParse(body);

      expect(result.success).toBe(true);
    });

    it('returns alive: true', async () => {
      const { GET } = await import('@/app/api/health/live/route');
      const request = createRequest('/api/health/live');
      const response = await GET(request);
      const body = await response.json();

      expect(body.alive).toBe(true);
      expect(body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/health/ready', () => {
    it('returns 200 with valid ReadyResponse schema', async () => {
      const { GET } = await import('@/app/api/health/ready/route');
      const request = createRequest('/api/health/ready');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      const result = ReadyResponseSchema.safeParse(body);

      expect(result.success).toBe(true);
    });
  });
});

// =============================================================================
// AUTH ENDPOINT CONTRACTS
// =============================================================================

describe('Auth Endpoint Contracts', () => {
  describe('GET /api/vendors/me', () => {
    it('returns 401 without API key', async () => {
      const { GET } = await import('@/app/api/vendors/me/route');
      const request = createRequest('/api/vendors/me');
      const response = await GET(request);

      expect(response.status).toBe(401);

      const body = await response.json();
      const result = UnauthorizedResponseSchema.safeParse(body);

      expect(result.success).toBe(true);
    });

    it('returns 401 with invalid API key', async () => {
      const { GET } = await import('@/app/api/vendors/me/route');
      const request = createAuthRequest('/api/vendors/me', 'sd_test_invalid123');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('returns 200 with valid VendorMeResponse schema when authenticated', async () => {
      const { GET } = await import('@/app/api/vendors/me/route');
      const request = createAuthRequest('/api/vendors/me', testApiKey);
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      const result = VendorMeResponseSchema.safeParse(body);

      expect(result.success).toBe(true);
      if (!result.success) {
        console.error('Schema validation failed:', result.error.issues);
      }
    });

    it('includes scopes in response', async () => {
      const { GET } = await import('@/app/api/vendors/me/route');
      const request = createAuthRequest('/api/vendors/me', testApiKey);
      const response = await GET(request);
      const body = await response.json();

      expect(body.scopes).toContain('read');
    });
  });

  describe('GET /api/auth/keys', () => {
    it('returns 401 without authentication', async () => {
      const { GET } = await import('@/app/api/auth/keys/route');
      const request = createRequest('/api/auth/keys');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('returns 200 with read scope (no admin required for listing)', async () => {
      const { GET } = await import('@/app/api/auth/keys/route');
      const request = createAuthRequest('/api/auth/keys', testApiKey); // read-only key
      const response = await GET(request);

      // GET only requires 'read' scope per the route documentation
      expect(response.status).toBe(200);
    });

    it('returns 200 with valid ApiKeysListResponse when authorized', async () => {
      const { GET } = await import('@/app/api/auth/keys/route');
      const request = createAuthRequest('/api/auth/keys', testApiKeyAdmin);
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      const result = ApiKeysListResponseSchema.safeParse(body);

      expect(result.success).toBe(true);
      if (!result.success) {
        console.error('Schema validation failed:', result.error.issues);
      }
    });
  });
});

// =============================================================================
// PRICING ENDPOINT CONTRACTS
// =============================================================================

describe('Pricing Endpoint Contracts', () => {
  describe('GET /api/pricing', () => {
    it('returns 401 without authentication', async () => {
      const { GET } = await import('@/app/api/pricing/route');
      const request = createRequest('/api/pricing');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('returns 200 with valid PricingResponse schema', async () => {
      const { GET } = await import('@/app/api/pricing/route');
      const request = createAuthRequest('/api/pricing', testApiKey);
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      const result = PricingResponseSchema.safeParse(body);

      expect(result.success).toBe(true);
      if (!result.success) {
        console.error('Schema validation failed:', result.error.issues);
      }
    });

    it('contains exactly 4 pricing tiers', async () => {
      const { GET } = await import('@/app/api/pricing/route');
      const request = createAuthRequest('/api/pricing', testApiKey);
      const response = await GET(request);
      const body = await response.json();

      expect(body.tiers).toHaveLength(4);
      expect(body.tiers.map((t: { name: string }) => t.name)).toEqual([
        'STARTER',
        'GROWTH',
        'SCALE',
        'ENTERPRISE',
      ]);
    });

    it('includes rate limit headers', async () => {
      const { GET } = await import('@/app/api/pricing/route');
      const request = createAuthRequest('/api/pricing', testApiKey);
      const response = await GET(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
    });
  });

  describe('POST /api/pricing', () => {
    it('returns 401 without authentication', async () => {
      const { POST } = await import('@/app/api/pricing/route');
      const request = createRequest('/api/pricing', {
        method: 'POST',
        body: { channel: 'EMAIL', messageCount: 100 },
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('returns 400 with invalid body', async () => {
      const { POST } = await import('@/app/api/pricing/route');
      const request = createAuthRequest('/api/pricing', testApiKey, {
        method: 'POST',
        body: { invalid: 'body' },
      });
      const response = await POST(request);

      expect(response.status).toBe(400);

      const body = await response.json();
      const result = ErrorResponseSchema.safeParse(body);

      expect(result.success).toBe(true);
    });

    it('returns 200 with valid BatchEstimateResponse for batch request', async () => {
      const { POST } = await import('@/app/api/pricing/route');
      const request = createAuthRequest('/api/pricing', testApiKey, {
        method: 'POST',
        body: { channel: 'EMAIL', messageCount: 1000 },
      });
      const response = await POST(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      const result = BatchEstimateResponseSchema.safeParse(body);

      expect(result.success).toBe(true);
      if (!result.success) {
        console.error('Schema validation failed:', result.error.issues);
      }
    });

    it('calculates batch estimate correctly', async () => {
      const { POST } = await import('@/app/api/pricing/route');
      const request = createAuthRequest('/api/pricing', testApiKey, {
        method: 'POST',
        body: { channel: 'EMAIL', messageCount: 100 },
      });
      const response = await POST(request);
      const body = await response.json();

      expect(body.estimate.totalCost).toBeGreaterThan(0);
      expect(body.estimate.messageCount).toBe(100);
      expect(body.estimate.unitCost).toBeGreaterThan(0);
      expect(body.estimate.savings).toBeGreaterThanOrEqual(0);
    });
  });
});

// =============================================================================
// AUDIT ENDPOINT CONTRACTS
// =============================================================================

describe('Audit Endpoint Contracts', () => {
  describe('GET /api/audit', () => {
    it('returns 401 without authentication', async () => {
      const { GET } = await import('@/app/api/audit/route');
      const request = createRequest('/api/audit');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('returns 403 without audit scope', async () => {
      const { GET } = await import('@/app/api/audit/route');
      const request = createAuthRequest('/api/audit', testApiKey); // read-only key
      const response = await GET(request);

      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.error).toContain('scope');
    });

    it('returns 200 with valid AuditLogsResponse when authorized', async () => {
      const { GET } = await import('@/app/api/audit/route');
      const request = createAuthRequest('/api/audit', testApiKeyAudit);
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      const result = AuditLogsResponseSchema.safeParse(body);

      expect(result.success).toBe(true);
      if (!result.success) {
        console.error('Schema validation failed:', result.error.issues);
      }
    });

    it('includes pagination info', async () => {
      const { GET } = await import('@/app/api/audit/route');
      const request = createAuthRequest('/api/audit', testApiKeyAudit);
      const response = await GET(request);
      const body = await response.json();

      expect(body.pagination).toBeDefined();
      expect(body.pagination.limit).toBeLessThanOrEqual(100);
      expect(body.pagination.offset).toBeGreaterThanOrEqual(0);
      expect(typeof body.pagination.hasMore).toBe('boolean');
    });

    it('respects limit parameter', async () => {
      const { GET } = await import('@/app/api/audit/route');
      const request = createAuthRequest('/api/audit?limit=10', testApiKeyAudit);
      const response = await GET(request);
      const body = await response.json();

      expect(body.pagination.limit).toBe(10);
      expect(body.logs.length).toBeLessThanOrEqual(10);
    });

    it('enforces max limit of 100', async () => {
      const { GET } = await import('@/app/api/audit/route');
      const request = createAuthRequest('/api/audit?limit=200', testApiKeyAudit);
      const response = await GET(request);
      const body = await response.json();

      expect(body.pagination.limit).toBe(100);
    });

    it('contains no-cache header', async () => {
      const { GET } = await import('@/app/api/audit/route');
      const request = createAuthRequest('/api/audit', testApiKeyAudit);
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toContain('no-store');
    });
  });
});

// =============================================================================
// CONTRACT SUMMARY
// =============================================================================

describe('Contract Summary', () => {
  it('all contract schemas are exported', () => {
    // Verify all schemas are available
    expect(HealthResponseSchema).toBeDefined();
    expect(LiveResponseSchema).toBeDefined();
    expect(ReadyResponseSchema).toBeDefined();
    expect(VendorMeResponseSchema).toBeDefined();
    expect(ApiKeysListResponseSchema).toBeDefined();
    expect(PricingResponseSchema).toBeDefined();
    expect(BatchEstimateResponseSchema).toBeDefined();
    expect(AuditLogsResponseSchema).toBeDefined();
    expect(UnauthorizedResponseSchema).toBeDefined();
    expect(ForbiddenResponseSchema).toBeDefined();
    expect(ErrorResponseSchema).toBeDefined();
  });
});
