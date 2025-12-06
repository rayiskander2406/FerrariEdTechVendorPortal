/**
 * TEST-02: Shared Test Utilities Tests
 *
 * TDD tests for shared test utilities that solve:
 * - Database isolation (unique IDs per test)
 * - Test factories (create vendors, API keys, etc.)
 * - Cleanup helpers (proper teardown)
 * - Server detection (integration test helpers)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// These imports will fail initially (TDD red phase)
// We'll implement them to make tests pass (TDD green phase)
import {
  createTestId,
  createTestVendor,
  createTestApiKey,
  withTestVendor,
  cleanupTestData,
  TestDataTracker,
} from '@/tests/utils';

describe('TEST-02: Shared Test Utilities', () => {
  // ==========================================================================
  // UNIQUE ID GENERATION
  // ==========================================================================

  describe('createTestId', () => {
    it('generates unique IDs on each call', () => {
      const id1 = createTestId('vendor');
      const id2 = createTestId('vendor');

      expect(id1).not.toBe(id2);
    });

    it('includes prefix in generated ID', () => {
      const id = createTestId('vendor');

      expect(id).toContain('vendor');
    });

    it('includes timestamp or random component', () => {
      const id = createTestId('test');

      // ID should be longer than just the prefix
      expect(id.length).toBeGreaterThan(10);
    });

    it('generates valid IDs for different resource types', () => {
      const vendorId = createTestId('vendor');
      const keyId = createTestId('api-key');
      const sessionId = createTestId('session');

      expect(vendorId).toMatch(/^test-vendor-/);
      expect(keyId).toMatch(/^test-api-key-/);
      expect(sessionId).toMatch(/^test-session-/);
    });

    it('generates URL-safe IDs', () => {
      const id = createTestId('resource');

      // Should only contain alphanumeric, hyphens, underscores
      expect(id).toMatch(/^[a-zA-Z0-9_-]+$/);
    });
  });

  // ==========================================================================
  // TEST DATA TRACKER
  // ==========================================================================

  describe('TestDataTracker', () => {
    let tracker: TestDataTracker;

    beforeEach(() => {
      tracker = new TestDataTracker();
    });

    it('tracks created vendors', () => {
      tracker.trackVendor('test-vendor-1');
      tracker.trackVendor('test-vendor-2');

      expect(tracker.getVendors()).toEqual(['test-vendor-1', 'test-vendor-2']);
    });

    it('tracks created API keys', () => {
      tracker.trackApiKey('key-1');
      tracker.trackApiKey('key-2');

      expect(tracker.getApiKeys()).toEqual(['key-1', 'key-2']);
    });

    it('returns IDs in order for cleanup', () => {
      tracker.trackVendor('v1');
      tracker.trackApiKey('k1');
      tracker.trackVendor('v2');
      tracker.trackApiKey('k2');

      // API keys should be cleaned up before vendors (foreign key constraint)
      expect(tracker.getApiKeys()).toEqual(['k1', 'k2']);
      expect(tracker.getVendors()).toEqual(['v1', 'v2']);
    });

    it('clears all tracked data', () => {
      tracker.trackVendor('v1');
      tracker.trackApiKey('k1');

      tracker.clear();

      expect(tracker.getVendors()).toEqual([]);
      expect(tracker.getApiKeys()).toEqual([]);
    });

    it('tracks sessions', () => {
      tracker.trackSession('session-1');

      expect(tracker.getSessions()).toEqual(['session-1']);
    });

    it('tracks audit logs', () => {
      tracker.trackAuditLog('log-1');

      expect(tracker.getAuditLogs()).toEqual(['log-1']);
    });
  });

  // ==========================================================================
  // TEST VENDOR FACTORY
  // ==========================================================================

  describe('createTestVendor', () => {
    let tracker: TestDataTracker;

    beforeEach(() => {
      tracker = new TestDataTracker();
    });

    afterEach(async () => {
      await cleanupTestData(tracker);
    });

    it('creates vendor with unique ID', async () => {
      const vendor1 = await createTestVendor({ tracker });
      const vendor2 = await createTestVendor({ tracker });

      expect(vendor1.id).not.toBe(vendor2.id);
    });

    it('creates vendor with default values', async () => {
      const vendor = await createTestVendor({ tracker });

      expect(vendor.name).toBeTruthy();
      expect(vendor.contactEmail).toBeTruthy();
      expect(vendor.contactName).toBeTruthy();
      expect(vendor.defaultAccessTier).toBe('PRIVACY_SAFE');
      expect(vendor.podsStatus).toBe('NOT_STARTED');
    });

    it('allows overriding default values', async () => {
      const vendor = await createTestVendor({
        tracker,
        overrides: {
          name: 'Custom Vendor',
          defaultAccessTier: 'SELECTIVE',
          podsStatus: 'APPROVED',
        },
      });

      expect(vendor.name).toBe('Custom Vendor');
      expect(vendor.defaultAccessTier).toBe('SELECTIVE');
      expect(vendor.podsStatus).toBe('APPROVED');
    });

    it('generates unique contactEmail per vendor', async () => {
      const vendor1 = await createTestVendor({ tracker });
      const vendor2 = await createTestVendor({ tracker });

      expect(vendor1.contactEmail).not.toBe(vendor2.contactEmail);
    });

    it('tracks created vendor for cleanup', async () => {
      const vendor = await createTestVendor({ tracker });

      expect(tracker.getVendors()).toContain(vendor.id);
    });
  });

  // ==========================================================================
  // TEST API KEY FACTORY
  // ==========================================================================

  describe('createTestApiKey', () => {
    let tracker: TestDataTracker;

    beforeEach(() => {
      tracker = new TestDataTracker();
    });

    afterEach(async () => {
      await cleanupTestData(tracker);
    });

    it('creates API key for existing vendor', async () => {
      const vendor = await createTestVendor({ tracker });
      const apiKey = await createTestApiKey({ vendorId: vendor.id, tracker });

      expect(apiKey.key).toBeTruthy();
      expect(apiKey.prefix).toBeTruthy();
      expect(apiKey.id).toBeTruthy();
    });

    it('returns full key only on creation', async () => {
      const vendor = await createTestVendor({ tracker });
      const apiKey = await createTestApiKey({ vendorId: vendor.id, tracker });

      expect(apiKey.key).toMatch(/^sd_(test|live)_/);
    });

    it('allows specifying scopes', async () => {
      const vendor = await createTestVendor({ tracker });
      const apiKey = await createTestApiKey({
        vendorId: vendor.id,
        tracker,
        scopes: ['read', 'admin'],
      });

      expect(apiKey.scopes).toEqual(['read', 'admin']);
    });

    it('defaults to read/write scopes', async () => {
      const vendor = await createTestVendor({ tracker });
      const apiKey = await createTestApiKey({ vendorId: vendor.id, tracker });

      expect(apiKey.scopes).toContain('read');
      expect(apiKey.scopes).toContain('write');
    });

    it('generates unique keyHash per key', async () => {
      const vendor = await createTestVendor({ tracker });
      const key1 = await createTestApiKey({ vendorId: vendor.id, tracker });
      const key2 = await createTestApiKey({ vendorId: vendor.id, tracker });

      expect(key1.hash).not.toBe(key2.hash);
    });

    it('tracks created API key for cleanup', async () => {
      const vendor = await createTestVendor({ tracker });
      const apiKey = await createTestApiKey({ vendorId: vendor.id, tracker });

      expect(tracker.getApiKeys()).toContain(apiKey.id);
    });
  });

  // ==========================================================================
  // WITH TEST VENDOR (CONVENIENCE WRAPPER)
  // ==========================================================================

  describe('withTestVendor', () => {
    it('creates vendor, runs test, cleans up', async () => {
      let capturedVendor: { id: string } | null = null;

      await withTestVendor(async (vendor) => {
        capturedVendor = vendor;
        expect(vendor.id).toBeTruthy();
      });

      expect(capturedVendor).not.toBeNull();
      // Vendor should be cleaned up after callback
    });

    it('passes API key if requested', async () => {
      await withTestVendor(
        async (vendor, apiKey) => {
          expect(apiKey).toBeDefined();
          expect(apiKey!.key).toBeTruthy();
          expect(apiKey!.vendorId).toBe(vendor.id);
        },
        { withApiKey: true }
      );
    });

    it('allows custom scopes for API key', async () => {
      await withTestVendor(
        async (_vendor, apiKey) => {
          expect(apiKey!.scopes).toContain('admin');
        },
        { withApiKey: true, scopes: ['admin'] }
      );
    });

    it('cleans up on error', async () => {
      const tracker = new TestDataTracker();

      try {
        await withTestVendor(
          async () => {
            throw new Error('Test error');
          },
          { tracker }
        );
      } catch {
        // Expected error
      }

      // Tracker should be cleared even after error
      expect(tracker.getVendors().length).toBe(0);
    });
  });

  // ==========================================================================
  // CLEANUP HELPERS
  // ==========================================================================

  describe('cleanupTestData', () => {
    it('deletes API keys before vendors (FK constraint)', async () => {
      const tracker = new TestDataTracker();
      const vendor = await createTestVendor({ tracker });
      await createTestApiKey({ vendorId: vendor.id, tracker });

      // Should not throw FK constraint error
      await expect(cleanupTestData(tracker)).resolves.not.toThrow();
    });

    it('handles empty tracker', async () => {
      const tracker = new TestDataTracker();

      await expect(cleanupTestData(tracker)).resolves.not.toThrow();
    });

    it('clears tracker after cleanup', async () => {
      const tracker = new TestDataTracker();
      await createTestVendor({ tracker });

      await cleanupTestData(tracker);

      expect(tracker.getVendors()).toEqual([]);
    });

    it('continues cleanup even if some items fail', async () => {
      const tracker = new TestDataTracker();

      // Track IDs that don't exist
      tracker.trackVendor('nonexistent-vendor-1');
      tracker.trackVendor('nonexistent-vendor-2');

      // Should not throw, should log warning
      await expect(cleanupTestData(tracker)).resolves.not.toThrow();
    });
  });
});
