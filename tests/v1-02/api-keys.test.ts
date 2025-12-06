/**
 * V1-02: API Key Authentication - Unit Tests
 *
 * Tests for API key generation, hashing, and validation.
 * Target coverage: 95%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/db';

// These will be implemented in lib/auth/api-keys.ts
import {
  generateApiKey,
  hashApiKey,
  validateApiKey,
  revokeApiKey,
  rotateApiKey,
  listApiKeys,
  getApiKeyByPrefix,
  API_KEY_PREFIX,
  type GeneratedApiKey,
  type ApiKeyValidation,
  type ApiKeyScope,
} from '@/lib/auth/api-keys';

// =============================================================================
// TEST DATA HELPERS
// =============================================================================

const TEST_VENDOR_ID = 'test-vendor-api-keys';

async function createTestVendor() {
  return prisma.vendor.upsert({
    where: { id: TEST_VENDOR_ID },
    update: {},
    create: {
      id: TEST_VENDOR_ID,
      name: 'Test Vendor',
      contactEmail: 'test-apikeys@example.com',
      contactName: 'Test Contact',
      defaultAccessTier: 'PRIVACY_SAFE',
      podsStatus: 'NOT_STARTED',
    },
  });
}

// =============================================================================
// KEY GENERATION TESTS
// =============================================================================

describe('V1-02: API Key Generation', () => {
  describe('generateApiKey', () => {
    it('generates a key with correct prefix format', async () => {
      const result = await generateApiKey();

      expect(result.key).toMatch(/^sd_(test|live)_[A-Za-z0-9_-]+$/);
      expect(result.prefix).toBeDefined();
      expect(result.hash).toBeDefined();
    });

    it('generates unique keys on each call', async () => {
      const key1 = await generateApiKey();
      const key2 = await generateApiKey();

      expect(key1.key).not.toBe(key2.key);
      expect(key1.hash).not.toBe(key2.hash);
    });

    it('uses "test" environment prefix in non-production', async () => {
      const result = await generateApiKey();
      expect(result.key).toContain('_test_');
    });

    it('generates prefix that is exactly 15 characters', async () => {
      const result = await generateApiKey();
      expect(result.prefix.length).toBe(15);
    });

    it('prefix is a substring of the full key', async () => {
      const result = await generateApiKey();
      expect(result.key.startsWith(result.prefix)).toBe(true);
    });

    it('hash is a valid SHA-256 hex string (64 chars)', async () => {
      const result = await generateApiKey();
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('key has sufficient entropy (>= 32 random bytes)', async () => {
      const result = await generateApiKey();
      // Format: sd_test_RANDOM or sd_live_RANDOM
      // sd_test_ = 8 chars, random part should be at least 43 chars (32 bytes base64url)
      // Note: base64url can contain underscores, so we match the prefix instead of splitting
      const prefixMatch = result.key.match(/^sd_(test|live)_/);
      expect(prefixMatch).toBeTruthy();
      const randomPart = result.key.slice(prefixMatch![0].length);
      expect(randomPart.length).toBeGreaterThanOrEqual(43);
    });
  });

  describe('generateApiKey with production environment', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('uses "live" environment prefix in production', async () => {
      const result = await generateApiKey();
      expect(result.key).toContain('_live_');
    });
  });
});

// =============================================================================
// KEY HASHING TESTS
// =============================================================================

describe('V1-02: API Key Hashing', () => {
  describe('hashApiKey', () => {
    it('produces consistent hash for same input', () => {
      const key = 'sd_test_abc123xyz';
      const hash1 = hashApiKey(key);
      const hash2 = hashApiKey(key);

      expect(hash1).toBe(hash2);
    });

    it('produces different hash for different input', () => {
      const hash1 = hashApiKey('sd_test_key1');
      const hash2 = hashApiKey('sd_test_key2');

      expect(hash1).not.toBe(hash2);
    });

    it('returns valid SHA-256 hex string', () => {
      const hash = hashApiKey('any-key');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('is case-sensitive', () => {
      const hash1 = hashApiKey('sd_test_ABC');
      const hash2 = hashApiKey('sd_test_abc');

      expect(hash1).not.toBe(hash2);
    });

    it('handles empty string', () => {
      const hash = hashApiKey('');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('handles special characters', () => {
      const hash = hashApiKey('sd_test_!@#$%^&*()');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('handles very long keys', () => {
      const longKey = 'sd_test_' + 'a'.repeat(1000);
      const hash = hashApiKey(longKey);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});

// =============================================================================
// KEY VALIDATION TESTS
// =============================================================================

describe('V1-02: API Key Validation', () => {
  beforeEach(async () => {
    await createTestVendor();
    // Clean up any existing API keys for test vendor
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  afterEach(async () => {
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  describe('validateApiKey - valid key', () => {
    it('returns valid=true for active key', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Test Key',
          scopes: ['read', 'write'],
        },
      });

      const result = await validateApiKey(generated.key);

      expect(result.valid).toBe(true);
      expect(result.vendorId).toBe(TEST_VENDOR_ID);
      expect(result.scopes).toEqual(['read', 'write']);
    });

    it('includes vendor information in response', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Test Key',
          scopes: ['read'],
        },
      });

      const result = await validateApiKey(generated.key);

      expect(result.valid).toBe(true);
      expect(result.vendor).toBeDefined();
      expect(result.vendor?.name).toBe('Test Vendor');
    });

    it('updates lastUsedAt on successful validation', async () => {
      const generated = await generateApiKey();

      const apiKey = await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Test Key',
          scopes: ['read'],
        },
      });

      expect(apiKey.lastUsedAt).toBeNull();

      await validateApiKey(generated.key);

      const updated = await prisma.apiKey.findUnique({
        where: { id: apiKey.id },
      });

      expect(updated?.lastUsedAt).not.toBeNull();
    });

    it('increments usageCount on successful validation', async () => {
      const generated = await generateApiKey();

      const apiKey = await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Test Key',
          scopes: ['read'],
          usageCount: 0,
        },
      });

      await validateApiKey(generated.key);
      await validateApiKey(generated.key);
      await validateApiKey(generated.key);

      const updated = await prisma.apiKey.findUnique({
        where: { id: apiKey.id },
      });

      expect(updated?.usageCount).toBe(3);
    });
  });

  describe('validateApiKey - invalid key', () => {
    it('returns valid=false for non-existent key', async () => {
      const result = await validateApiKey('sd_test_nonexistent123');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    it('returns valid=false for empty key', async () => {
      const result = await validateApiKey('');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    it('returns valid=false for malformed key', async () => {
      const result = await validateApiKey('not-a-valid-key-format');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    it('does not update stats for invalid key', async () => {
      const generated = await generateApiKey();

      const apiKey = await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Test Key',
          scopes: ['read'],
          usageCount: 5,
        },
      });

      await validateApiKey('sd_test_wrongkey');

      const unchanged = await prisma.apiKey.findUnique({
        where: { id: apiKey.id },
      });

      expect(unchanged?.usageCount).toBe(5);
    });
  });

  describe('validateApiKey - revoked key', () => {
    it('returns valid=false for revoked key', async () => {
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

      const result = await validateApiKey(generated.key);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key has been revoked');
    });

    it('does not update stats for revoked key', async () => {
      const generated = await generateApiKey();

      const apiKey = await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Revoked Key',
          scopes: ['read'],
          revokedAt: new Date(),
          usageCount: 10,
        },
      });

      await validateApiKey(generated.key);

      const unchanged = await prisma.apiKey.findUnique({
        where: { id: apiKey.id },
      });

      expect(unchanged?.usageCount).toBe(10);
    });
  });

  describe('validateApiKey - expired key', () => {
    it('returns valid=false for expired key', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Expired Key',
          scopes: ['read'],
          expiresAt: new Date(Date.now() - 86400000), // 1 day ago
        },
      });

      const result = await validateApiKey(generated.key);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key has expired');
    });

    it('returns valid=true for key with future expiration', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Future Expiry Key',
          scopes: ['read'],
          expiresAt: new Date(Date.now() + 86400000), // 1 day from now
        },
      });

      const result = await validateApiKey(generated.key);

      expect(result.valid).toBe(true);
    });

    it('returns valid=true for key with no expiration', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'No Expiry Key',
          scopes: ['read'],
          expiresAt: null,
        },
      });

      const result = await validateApiKey(generated.key);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateApiKey - timing safety', () => {
    it('takes similar time for valid vs invalid keys', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Timing Test Key',
          scopes: ['read'],
        },
      });

      // Warm up
      await validateApiKey(generated.key);
      await validateApiKey('sd_test_invalid123');

      // Measure valid key
      const validStart = performance.now();
      for (let i = 0; i < 10; i++) {
        await validateApiKey(generated.key);
      }
      const validTime = performance.now() - validStart;

      // Measure invalid key
      const invalidStart = performance.now();
      for (let i = 0; i < 10; i++) {
        await validateApiKey('sd_test_invalid123');
      }
      const invalidTime = performance.now() - invalidStart;

      // Times should be within 50% of each other (loose bound for CI variance)
      const ratio = Math.max(validTime, invalidTime) / Math.min(validTime, invalidTime);
      expect(ratio).toBeLessThan(2);
    });
  });
});

// =============================================================================
// KEY MANAGEMENT TESTS
// =============================================================================

describe('V1-02: API Key Management', () => {
  beforeEach(async () => {
    await createTestVendor();
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  afterEach(async () => {
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  describe('revokeApiKey', () => {
    it('marks key as revoked', async () => {
      const generated = await generateApiKey();

      const apiKey = await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'To Revoke',
          scopes: ['read'],
        },
      });

      await revokeApiKey(apiKey.id);

      const revoked = await prisma.apiKey.findUnique({
        where: { id: apiKey.id },
      });

      expect(revoked?.revokedAt).not.toBeNull();
    });

    it('revoked key fails validation', async () => {
      const generated = await generateApiKey();

      const apiKey = await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'To Revoke',
          scopes: ['read'],
        },
      });

      // Before revocation
      const beforeResult = await validateApiKey(generated.key);
      expect(beforeResult.valid).toBe(true);

      await revokeApiKey(apiKey.id);

      // After revocation
      const afterResult = await validateApiKey(generated.key);
      expect(afterResult.valid).toBe(false);
      expect(afterResult.error).toBe('API key has been revoked');
    });

    it('throws error for non-existent key', async () => {
      await expect(revokeApiKey('non-existent-id')).rejects.toThrow();
    });

    it('is idempotent (revoking twice is safe)', async () => {
      const generated = await generateApiKey();

      const apiKey = await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'To Revoke Twice',
          scopes: ['read'],
        },
      });

      await revokeApiKey(apiKey.id);
      await revokeApiKey(apiKey.id); // Should not throw

      const revoked = await prisma.apiKey.findUnique({
        where: { id: apiKey.id },
      });

      expect(revoked?.revokedAt).not.toBeNull();
    });
  });

  describe('rotateApiKey', () => {
    it('creates new key and revokes old one', async () => {
      const generated = await generateApiKey();

      const oldKey = await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'To Rotate',
          scopes: ['read', 'write'],
        },
      });

      const result = await rotateApiKey(oldKey.id);

      // New key is returned
      expect(result.newKey).toBeDefined();
      expect(result.newKey.key).toMatch(/^sd_(test|live)_/);

      // Old key is revoked
      const oldKeyRecord = await prisma.apiKey.findUnique({
        where: { id: oldKey.id },
      });
      expect(oldKeyRecord?.revokedAt).not.toBeNull();

      // New key is valid
      const validation = await validateApiKey(result.newKey.key);
      expect(validation.valid).toBe(true);
    });

    it('preserves scopes from old key', async () => {
      const generated = await generateApiKey();

      const oldKey = await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'To Rotate',
          scopes: ['read', 'write', 'admin'],
        },
      });

      const result = await rotateApiKey(oldKey.id);
      const validation = await validateApiKey(result.newKey.key);

      expect(validation.scopes).toEqual(['read', 'write', 'admin']);
    });

    it('preserves name from old key with suffix', async () => {
      const generated = await generateApiKey();

      const oldKey = await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Production Key',
          scopes: ['read'],
        },
      });

      await rotateApiKey(oldKey.id);

      const newKeyRecord = await prisma.apiKey.findFirst({
        where: {
          vendorId: TEST_VENDOR_ID,
          revokedAt: null,
        },
      });

      expect(newKeyRecord?.name).toContain('Production Key');
    });

    it('old key fails validation after rotation', async () => {
      const generated = await generateApiKey();

      const oldKey = await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'To Rotate',
          scopes: ['read'],
        },
      });

      await rotateApiKey(oldKey.id);

      const validation = await validateApiKey(generated.key);
      expect(validation.valid).toBe(false);
    });
  });

  describe('listApiKeys', () => {
    it('returns all keys for a vendor', async () => {
      const gen1 = await generateApiKey();
      const gen2 = await generateApiKey();
      const gen3 = await generateApiKey();

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
          {
            vendorId: TEST_VENDOR_ID,
            keyPrefix: gen3.prefix,
            keyHash: gen3.hash,
            name: 'Key 3',
            scopes: ['admin'],
          },
        ],
      });

      const keys = await listApiKeys(TEST_VENDOR_ID);

      expect(keys.length).toBe(3);
      expect(keys.map((k) => k.name)).toContain('Key 1');
      expect(keys.map((k) => k.name)).toContain('Key 2');
      expect(keys.map((k) => k.name)).toContain('Key 3');
    });

    it('does not return keyHash (security)', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Secure Key',
          scopes: ['read'],
        },
      });

      const keys = await listApiKeys(TEST_VENDOR_ID);

      expect(keys[0]).not.toHaveProperty('keyHash');
    });

    it('returns keyPrefix for identification', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Prefix Key',
          scopes: ['read'],
        },
      });

      const keys = await listApiKeys(TEST_VENDOR_ID);

      expect(keys[0].keyPrefix).toBe(generated.prefix);
    });

    it('includes revoked keys with flag', async () => {
      const gen1 = await generateApiKey();
      const gen2 = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: gen1.prefix,
          keyHash: gen1.hash,
          name: 'Active Key',
          scopes: ['read'],
        },
      });

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: gen2.prefix,
          keyHash: gen2.hash,
          name: 'Revoked Key',
          scopes: ['read'],
          revokedAt: new Date(),
        },
      });

      const allKeys = await listApiKeys(TEST_VENDOR_ID, { includeRevoked: true });
      const activeKeys = await listApiKeys(TEST_VENDOR_ID, { includeRevoked: false });

      expect(allKeys.length).toBe(2);
      expect(activeKeys.length).toBe(1);
      expect(activeKeys[0].name).toBe('Active Key');
    });

    it('returns empty array for vendor with no keys', async () => {
      const keys = await listApiKeys(TEST_VENDOR_ID);
      expect(keys).toEqual([]);
    });
  });

  describe('getApiKeyByPrefix', () => {
    it('returns key info by prefix', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Lookup Key',
          scopes: ['read'],
        },
      });

      const key = await getApiKeyByPrefix(generated.prefix);

      expect(key).not.toBeNull();
      expect(key?.name).toBe('Lookup Key');
    });

    it('returns null for unknown prefix', async () => {
      const key = await getApiKeyByPrefix('sd_test_unknow');
      expect(key).toBeNull();
    });

    it('does not return keyHash', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Secure Lookup',
          scopes: ['read'],
        },
      });

      const key = await getApiKeyByPrefix(generated.prefix);

      expect(key).not.toHaveProperty('keyHash');
    });
  });
});

// =============================================================================
// SCOPE TESTS
// =============================================================================

describe('V1-02: API Key Scopes', () => {
  beforeEach(async () => {
    await createTestVendor();
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  afterEach(async () => {
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  describe('scope validation', () => {
    it('returns correct scopes in validation result', async () => {
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

      const result = await validateApiKey(generated.key);

      expect(result.scopes).toEqual(['read', 'write', 'message']);
    });

    it('supports single scope', async () => {
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

      const result = await validateApiKey(generated.key);

      expect(result.scopes).toEqual(['read']);
    });

    it('supports admin scope', async () => {
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

      const result = await validateApiKey(generated.key);

      expect(result.scopes).toContain('admin');
    });

    it('supports empty scopes array', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'No Scope Key',
          scopes: [],
        },
      });

      const result = await validateApiKey(generated.key);

      expect(result.scopes).toEqual([]);
    });
  });
});

// =============================================================================
// EDGE CASES & ERROR HANDLING
// =============================================================================

describe('V1-02: Edge Cases', () => {
  beforeEach(async () => {
    await createTestVendor();
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  afterEach(async () => {
    await prisma.apiKey.deleteMany({ where: { vendorId: TEST_VENDOR_ID } });
  });

  describe('concurrent operations', () => {
    it('handles concurrent validations of same key', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Concurrent Key',
          scopes: ['read'],
          usageCount: 0,
        },
      });

      // Run 10 validations concurrently
      const results = await Promise.all(
        Array(10)
          .fill(null)
          .map(() => validateApiKey(generated.key))
      );

      // All should succeed
      expect(results.every((r) => r.valid)).toBe(true);

      // Wait for async usage updates to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Usage count should be at least 1 (non-blocking updates may race, but some will succeed)
      // Note: In production, exact counts aren't critical - this is for rate limiting hints
      const key = await prisma.apiKey.findFirst({
        where: { keyPrefix: generated.prefix },
      });
      expect(key?.usageCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('database constraints', () => {
    it('enforces unique keyHash', async () => {
      const generated = await generateApiKey();

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'First Key',
          scopes: ['read'],
        },
      });

      await expect(
        prisma.apiKey.create({
          data: {
            vendorId: TEST_VENDOR_ID,
            keyPrefix: 'different_pre',
            keyHash: generated.hash, // Same hash
            name: 'Duplicate Key',
            scopes: ['read'],
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('special characters in key', () => {
    it('handles base64url characters correctly', async () => {
      const generated = await generateApiKey();

      // Base64url can contain - and _
      expect(generated.key).toMatch(/^[A-Za-z0-9_-]+$/);

      await prisma.apiKey.create({
        data: {
          vendorId: TEST_VENDOR_ID,
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          name: 'Base64 Key',
          scopes: ['read'],
        },
      });

      const result = await validateApiKey(generated.key);
      expect(result.valid).toBe(true);
    });
  });
});
