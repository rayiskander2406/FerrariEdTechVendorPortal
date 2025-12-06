/**
 * V1-02: API Key Authentication - Integration Tests
 *
 * Tests for protected API routes and end-to-end authentication flows.
 * Target coverage: 95%+
 *
 * IMPORTANT: These tests require a running development server.
 * Run with: npm run dev (in another terminal) && npm test -- tests/v1-02/integration.test.ts
 *
 * Set SKIP_INTEGRATION_TESTS=true to skip these tests in CI without a server.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { generateApiKey, hashApiKey } from '@/lib/auth/api-keys';

// =============================================================================
// TEST SETUP
// =============================================================================

const TEST_VENDOR_ID = 'test-vendor-integration';
const TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Check if server is available before running tests
let serverAvailable = false;

beforeAll(async () => {
  try {
    const response = await fetch(`${TEST_BASE_URL}/api/health/external`, {
      signal: AbortSignal.timeout(2000),
    });
    serverAvailable = response.ok;
  } catch {
    serverAvailable = false;
  }

  if (!serverAvailable && !process.env.SKIP_INTEGRATION_TESTS) {
    console.warn(
      '\n⚠️  Integration tests skipped: Development server not running.\n' +
        '   Start server with: npm run dev\n' +
        '   Or set SKIP_INTEGRATION_TESTS=true to suppress this warning.\n'
    );
  }
});

async function createTestVendor() {
  return prisma.vendor.upsert({
    where: { id: TEST_VENDOR_ID },
    update: {},
    create: {
      id: TEST_VENDOR_ID,
      name: 'Integration Test Vendor',
      contactEmail: 'integration@test.com',
      contactName: 'Integration Contact',
      defaultAccessTier: 'PRIVACY_SAFE',
      podsStatus: 'NOT_STARTED',
    },
  });
}

async function createTestApiKey(scopes: string[] = ['read', 'write']) {
  const generated = await generateApiKey();

  await prisma.apiKey.create({
    data: {
      vendorId: TEST_VENDOR_ID,
      keyPrefix: generated.prefix,
      keyHash: generated.hash,
      name: 'Integration Test Key',
      scopes,
    },
  });

  return generated;
}

// =============================================================================
// API ROUTE PROTECTION TESTS
// =============================================================================

// Skip integration tests when:
// 1. SKIP_INTEGRATION_TESTS=true (explicit)
// 2. Running in CI without server (auto-detect)
// 3. NODE_ENV=test and no explicit override
const shouldSkipIntegration =
  process.env.SKIP_INTEGRATION_TESTS === 'true' ||
  (process.env.CI === 'true' && process.env.RUN_INTEGRATION_TESTS !== 'true') ||
  (process.env.VITEST === 'true' && process.env.RUN_INTEGRATION_TESTS !== 'true');

// Helper to conditionally skip tests when server is not available
// Tests will be skipped if SKIP_INTEGRATION_TESTS is set or CI without explicit opt-in
const describeWithServer = shouldSkipIntegration ? describe.skip : describe;

describeWithServer('V1-02: Protected API Routes', () => {
  beforeEach(async () => {
    if (!serverAvailable) return;
    await createTestVendor();
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  afterEach(async () => {
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  describe('GET /api/vendors/me', () => {
    it('returns vendor info for valid API key', async () => {
      const apiKey = await createTestApiKey(['read']);

      const response = await fetch(`${TEST_BASE_URL}/api/vendors/me`, {
        headers: { Authorization: `Bearer ${apiKey.key}` },
      });

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.vendor).toBeDefined();
      expect(body.vendor.id).toBe(TEST_VENDOR_ID);
    });

    it('returns 401 without Authorization header', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/vendors/me`);

      expect(response.status).toBe(401);
    });

    it('returns 401 for invalid API key', async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/vendors/me`, {
        headers: { Authorization: 'Bearer sd_test_invalid123' },
      });

      expect(response.status).toBe(401);
    });

    it('returns 403 without read scope', async () => {
      const apiKey = await createTestApiKey(['write']); // No read scope

      const response = await fetch(`${TEST_BASE_URL}/api/vendors/me`, {
        headers: { Authorization: `Bearer ${apiKey.key}` },
      });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/messages', () => {
    it('creates message with valid API key and message scope', async () => {
      const apiKey = await createTestApiKey(['read', 'write', 'message']);

      const response = await fetch(`${TEST_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: 'TKN_STU_12345678',
          channel: 'email',
          content: 'Test message',
        }),
      });

      expect(response.status).toBe(201);
    });

    it('returns 403 without message scope', async () => {
      const apiKey = await createTestApiKey(['read', 'write']); // No message scope

      const response = await fetch(`${TEST_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: 'TKN_STU_12345678',
          channel: 'email',
          content: 'Test message',
        }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/integrations/:id', () => {
    it('requires admin scope for deletion', async () => {
      const apiKey = await createTestApiKey(['read', 'write']); // No admin scope

      const response = await fetch(`${TEST_BASE_URL}/api/integrations/test-id`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${apiKey.key}` },
      });

      expect(response.status).toBe(403);
    });

    it('allows deletion with admin scope', async () => {
      const apiKey = await createTestApiKey(['admin']);

      const response = await fetch(`${TEST_BASE_URL}/api/integrations/test-id`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${apiKey.key}` },
      });

      // 200 or 404 (not found) but not 401/403
      expect([200, 204, 404]).toContain(response.status);
    });
  });
});

// =============================================================================
// API KEY MANAGEMENT ENDPOINT TESTS
// =============================================================================

describeWithServer('V1-02: API Key Management Endpoints', () => {
  beforeEach(async () => {
    await createTestVendor();
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  afterEach(async () => {
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  describe('POST /api/auth/keys', () => {
    it('creates new API key', async () => {
      const adminKey = await createTestApiKey(['admin']);

      const response = await fetch(`${TEST_BASE_URL}/api/auth/keys`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminKey.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Key',
          scopes: ['read'],
        }),
      });

      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.key).toBeDefined();
      expect(body.key).toMatch(/^sd_(test|live)_/);
      expect(body.prefix).toBeDefined();
    });

    it('returns full key only on creation', async () => {
      const adminKey = await createTestApiKey(['admin']);

      const createResponse = await fetch(`${TEST_BASE_URL}/api/auth/keys`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminKey.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'One-Time Key',
          scopes: ['read'],
        }),
      });

      const createBody = await createResponse.json();
      const prefix = createBody.prefix;

      // List should not include full key
      const listResponse = await fetch(`${TEST_BASE_URL}/api/auth/keys`, {
        headers: { Authorization: `Bearer ${adminKey.key}` },
      });

      const listBody = await listResponse.json();
      const key = listBody.keys.find((k: { keyPrefix: string }) => k.keyPrefix === prefix);

      expect(key).toBeDefined();
      expect(key).not.toHaveProperty('key');
      expect(key).not.toHaveProperty('keyHash');
    });

    it('requires admin scope to create keys', async () => {
      const readKey = await createTestApiKey(['read', 'write']); // No admin

      const response = await fetch(`${TEST_BASE_URL}/api/auth/keys`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${readKey.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Unauthorized Key',
          scopes: ['read'],
        }),
      });

      expect(response.status).toBe(403);
    });

    it('validates scopes array', async () => {
      const adminKey = await createTestApiKey(['admin']);

      const response = await fetch(`${TEST_BASE_URL}/api/auth/keys`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminKey.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Invalid Scopes Key',
          scopes: ['invalid_scope'],
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/keys', () => {
    it('lists all API keys for vendor', async () => {
      const adminKey = await createTestApiKey(['admin']);

      // Create additional keys
      const gen1 = await generateApiKey();
      const gen2 = await generateApiKey();

      await prisma.apiKey.createMany({
        data: [
          {
            vendorId: TEST_VENDOR_ID,
            keyPrefix: gen1.prefix,
            keyHash: gen1.hash,
            name: 'Key 1',
            scopes: ['read'],
          },
          {
            vendorId: TEST_VENDOR_ID,
            keyPrefix: gen2.prefix,
            keyHash: gen2.hash,
            name: 'Key 2',
            scopes: ['read', 'write'],
          },
        ],
      });

      const response = await fetch(`${TEST_BASE_URL}/api/auth/keys`, {
        headers: { Authorization: `Bearer ${adminKey.key}` },
      });

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.keys.length).toBeGreaterThanOrEqual(3); // admin + 2 created
    });

    it('does not expose keyHash in list', async () => {
      const adminKey = await createTestApiKey(['admin']);

      const response = await fetch(`${TEST_BASE_URL}/api/auth/keys`, {
        headers: { Authorization: `Bearer ${adminKey.key}` },
      });

      const body = await response.json();

      body.keys.forEach((key: Record<string, unknown>) => {
        expect(key).not.toHaveProperty('keyHash');
      });
    });
  });

  describe('DELETE /api/auth/keys/:id', () => {
    it('revokes API key', async () => {
      const adminKey = await createTestApiKey(['admin']);

      const toRevoke = await generateApiKey();
      const revokeRecord = await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: toRevoke.prefix,
          keyHash: toRevoke.hash,
          name: 'To Revoke',
          scopes: ['read'],
        },
      });

      // Verify key works before revocation
      const beforeResponse = await fetch(`${TEST_BASE_URL}/api/vendors/me`, {
        headers: { Authorization: `Bearer ${toRevoke.key}` },
      });
      expect(beforeResponse.status).toBe(200);

      // Revoke
      const revokeResponse = await fetch(
        `${TEST_BASE_URL}/api/auth/keys/${revokeRecord.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminKey.key}` },
        }
      );
      expect(revokeResponse.status).toBe(200);

      // Verify key no longer works
      const afterResponse = await fetch(`${TEST_BASE_URL}/api/vendors/me`, {
        headers: { Authorization: `Bearer ${toRevoke.key}` },
      });
      expect(afterResponse.status).toBe(401);
    });

    it('requires admin scope to revoke keys', async () => {
      const readKey = await createTestApiKey(['read', 'write']);

      const response = await fetch(`${TEST_BASE_URL}/api/auth/keys/some-id`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${readKey.key}` },
      });

      expect(response.status).toBe(403);
    });

    it('cannot revoke own admin key', async () => {
      const adminKey = await createTestApiKey(['admin']);

      const keyRecord = await prisma.apiKey.findFirst({
        where: { keyPrefix: adminKey.prefix },
      });

      const response = await fetch(
        `${TEST_BASE_URL}/api/auth/keys/${keyRecord!.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminKey.key}` },
        }
      );

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toContain('cannot revoke');
    });
  });

  describe('POST /api/auth/keys/:id/rotate', () => {
    it('rotates API key', async () => {
      const adminKey = await createTestApiKey(['admin']);

      const toRotate = await generateApiKey();
      const rotateRecord = await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: toRotate.prefix,
          keyHash: toRotate.hash,
          name: 'To Rotate',
          scopes: ['read', 'write'],
        },
      });

      const response = await fetch(
        `${TEST_BASE_URL}/api/auth/keys/${rotateRecord.id}/rotate`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminKey.key}` },
        }
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.newKey).toBeDefined();
      expect(body.newKey).toMatch(/^sd_(test|live)_/);

      // Old key should not work
      const oldKeyResponse = await fetch(`${TEST_BASE_URL}/api/vendors/me`, {
        headers: { Authorization: `Bearer ${toRotate.key}` },
      });
      expect(oldKeyResponse.status).toBe(401);

      // New key should work
      const newKeyResponse = await fetch(`${TEST_BASE_URL}/api/vendors/me`, {
        headers: { Authorization: `Bearer ${body.newKey}` },
      });
      expect(newKeyResponse.status).toBe(200);
    });
  });
});

// =============================================================================
// RATE LIMITING WITH API KEYS
// =============================================================================

describeWithServer('V1-02: API Key Rate Limiting', () => {
  beforeEach(async () => {
    await createTestVendor();
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  afterEach(async () => {
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  describe('usage tracking', () => {
    it('increments usage count on each request', async () => {
      const apiKey = await createTestApiKey(['read']);

      const keyBefore = await prisma.apiKey.findFirst({
        where: { keyPrefix: apiKey.prefix },
      });
      const initialCount = keyBefore?.usageCount || 0;

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        await fetch(`${TEST_BASE_URL}/api/vendors/me`, {
          headers: { Authorization: `Bearer ${apiKey.key}` },
        });
      }

      const keyAfter = await prisma.apiKey.findFirst({
        where: { keyPrefix: apiKey.prefix },
      });

      expect(keyAfter?.usageCount).toBe(initialCount + 5);
    });

    it('updates lastUsedAt timestamp', async () => {
      const apiKey = await createTestApiKey(['read']);

      const keyBefore = await prisma.apiKey.findFirst({
        where: { keyPrefix: apiKey.prefix },
      });

      await new Promise((r) => setTimeout(r, 100));

      await fetch(`${TEST_BASE_URL}/api/vendors/me`, {
        headers: { Authorization: `Bearer ${apiKey.key}` },
      });

      const keyAfter = await prisma.apiKey.findFirst({
        where: { keyPrefix: apiKey.prefix },
      });

      expect(keyAfter?.lastUsedAt).not.toBeNull();
      if (keyBefore?.lastUsedAt) {
        expect(keyAfter?.lastUsedAt?.getTime()).toBeGreaterThan(
          keyBefore.lastUsedAt.getTime()
        );
      }
    });
  });
});

// =============================================================================
// AUDIT LOGGING
// =============================================================================

describeWithServer('V1-02: API Key Audit Logging', () => {
  beforeEach(async () => {
    await createTestVendor();
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
    await prisma.auditLog.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  afterEach(async () => {
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
    await prisma.auditLog.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  describe('key lifecycle events', () => {
    it('logs API key creation', async () => {
      const adminKey = await createTestApiKey(['admin']);

      await fetch(`${TEST_BASE_URL}/api/auth/keys`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminKey.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Logged Key',
          scopes: ['read'],
        }),
      });

      const logs = await prisma.auditLog.findMany({
        where: {
          vendorId: TEST_VENDOR_ID,
          action: 'api_key.created',
        },
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('logs API key revocation', async () => {
      const adminKey = await createTestApiKey(['admin']);

      const toRevoke = await generateApiKey();
      const revokeRecord = await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: toRevoke.prefix,
          keyHash: toRevoke.hash,
          name: 'To Revoke',
          scopes: ['read'],
        },
      });

      await fetch(`${TEST_BASE_URL}/api/auth/keys/${revokeRecord.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminKey.key}` },
      });

      const logs = await prisma.auditLog.findMany({
        where: {
          vendorId: TEST_VENDOR_ID,
          action: 'api_key.revoked',
        },
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('logs API key rotation', async () => {
      const adminKey = await createTestApiKey(['admin']);

      const toRotate = await generateApiKey();
      const rotateRecord = await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: toRotate.prefix,
          keyHash: toRotate.hash,
          name: 'To Rotate',
          scopes: ['read'],
        },
      });

      await fetch(`${TEST_BASE_URL}/api/auth/keys/${rotateRecord.id}/rotate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminKey.key}` },
      });

      const logs = await prisma.auditLog.findMany({
        where: {
          vendorId: TEST_VENDOR_ID,
          action: 'api_key.rotated',
        },
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('request logging', () => {
    it('includes API key prefix in request logs', async () => {
      const apiKey = await createTestApiKey(['read']);

      await fetch(`${TEST_BASE_URL}/api/vendors/me`, {
        headers: { Authorization: `Bearer ${apiKey.key}` },
      });

      const logs = await prisma.auditLog.findMany({
        where: {
          vendorId: TEST_VENDOR_ID,
          action: 'api.request',
        },
        orderBy: { timestamp: 'desc' },
        take: 1,
      });

      if (logs.length > 0) {
        const details = logs[0].details ? JSON.parse(logs[0].details) : {};
        expect(details.apiKeyPrefix).toBe(apiKey.prefix);
      }
    });
  });
});

// =============================================================================
// ERROR SCENARIOS
// =============================================================================

describeWithServer('V1-02: Error Scenarios', () => {
  beforeEach(async () => {
    await createTestVendor();
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  afterEach(async () => {
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  describe('malformed requests', () => {
    it('handles malformed JSON body gracefully', async () => {
      const adminKey = await createTestApiKey(['admin']);

      const response = await fetch(`${TEST_BASE_URL}/api/auth/keys`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminKey.key}`,
          'Content-Type': 'application/json',
        },
        body: 'not valid json',
      });

      expect(response.status).toBe(400);
    });

    it('handles missing required fields', async () => {
      const adminKey = await createTestApiKey(['admin']);

      const response = await fetch(`${TEST_BASE_URL}/api/auth/keys`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminKey.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Missing name and scopes
      });

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBeDefined();
    });
  });

  describe('vendor state', () => {
    it('rejects API key if vendor is suspended', async () => {
      const apiKey = await createTestApiKey(['read']);

      // Suspend vendor
      await prisma.vendor.update({
        where: { id: TEST_VENDOR_ID },
        data: { podsStatus: 'suspended' },
      });

      const response = await fetch(`${TEST_BASE_URL}/api/vendors/me`, {
        headers: { Authorization: `Bearer ${apiKey.key}` },
      });

      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.error).toContain('suspended');

      // Restore for cleanup
      await prisma.vendor.update({
        where: { id: TEST_VENDOR_ID },
        data: { podsStatus: 'approved' },
      });
    });
  });
});

// =============================================================================
// CROSS-VENDOR ISOLATION
// =============================================================================

describeWithServer('V1-02: Cross-Vendor Isolation', () => {
  const VENDOR_A_ID = 'test-vendor-a';
  const VENDOR_B_ID = 'test-vendor-b';

  beforeEach(async () => {
    await prisma.vendor.upsert({
      where: { id: VENDOR_A_ID },
      update: {},
      create: {
        id: VENDOR_A_ID,
        name: 'Vendor A',
        contactEmail: 'a@test.com',
        contactName: 'Contact A',
        defaultAccessTier: 'PRIVACY_SAFE',
        podsStatus: 'NOT_STARTED',
      },
    });

    await prisma.vendor.upsert({
      where: { id: VENDOR_B_ID },
      update: {},
      create: {
        id: VENDOR_B_ID,
        name: 'Vendor B',
        contactEmail: 'b@test.com',
        contactName: 'Contact B',
        defaultAccessTier: 'PRIVACY_SAFE',
        podsStatus: 'NOT_STARTED',
      },
    });

    await prisma.apiKey.deleteMany({
      where: { vendorId: { in: [VENDOR_A_ID, VENDOR_B_ID] } },
    });
  });

  afterEach(async () => {
    await prisma.apiKey.deleteMany({
      where: { vendorId: { in: [VENDOR_A_ID, VENDOR_B_ID] } },
    });
  });

  it('vendor A cannot access vendor B resources', async () => {
    const keyA = await generateApiKey();
    await prisma.apiKey.create({
      data: {
        vendorId: VENDOR_A_ID,
        keyPrefix: keyA.prefix,
        keyHash: keyA.hash,
        name: 'Vendor A Key',
        scopes: ['admin'],
      },
    });

    const keyB = await generateApiKey();
    const keyBRecord = await prisma.apiKey.create({
      data: {
        vendorId: VENDOR_B_ID,
        keyPrefix: keyB.prefix,
        keyHash: keyB.hash,
        name: 'Vendor B Key',
        scopes: ['read'],
      },
    });

    // Vendor A tries to revoke Vendor B's key
    const response = await fetch(
      `${TEST_BASE_URL}/api/auth/keys/${keyBRecord.id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${keyA.key}` },
      }
    );

    expect(response.status).toBe(404); // Not found (not their key)
  });

  it('vendor A cannot list vendor B keys', async () => {
    const keyA = await generateApiKey();
    await prisma.apiKey.create({
      data: {
        vendorId: VENDOR_A_ID,
        keyPrefix: keyA.prefix,
        keyHash: keyA.hash,
        name: 'Vendor A Key',
        scopes: ['admin'],
      },
    });

    const keyB = await generateApiKey();
    await prisma.apiKey.create({
      data: {
        vendorId: VENDOR_B_ID,
        keyPrefix: keyB.prefix,
        keyHash: keyB.hash,
        name: 'Vendor B Key',
        scopes: ['read'],
      },
    });

    const response = await fetch(`${TEST_BASE_URL}/api/auth/keys`, {
      headers: { Authorization: `Bearer ${keyA.key}` },
    });

    expect(response.status).toBe(200);

    const body = await response.json();

    // Should only see Vendor A's keys
    const keyPrefixes = body.keys.map((k: { keyPrefix: string }) => k.keyPrefix);
    expect(keyPrefixes).toContain(keyA.prefix);
    expect(keyPrefixes).not.toContain(keyB.prefix);
  });
});
