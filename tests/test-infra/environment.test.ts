/**
 * TEST-01: Vitest Environment Configuration Tests
 *
 * TDD tests to verify environment standardization:
 * - API/library tests run in 'node' environment
 * - Component tests run in 'jsdom' environment
 * - Both environments are properly isolated
 */

import { describe, it, expect } from 'vitest';

describe('TEST-01: Vitest Environment Configuration', () => {
  describe('Node Environment (API/Library Tests)', () => {
    it('should run in node environment for this test file', () => {
      // This file is in tests/test-infra, should use node
      expect(typeof process).toBe('object');
      expect(typeof process.env).toBe('object');
    });

    it('should have NODE_ENV set to test', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });

    it('should have access to Node.js globals', () => {
      expect(typeof Buffer).toBe('function');
      expect(typeof __dirname).toBe('string');
      expect(typeof require).toBe('function');
    });

    it('should NOT have window defined in node environment', () => {
      // In pure node, window should not exist (unless jsdom is loaded)
      // This test verifies we're in node, not jsdom
      expect(typeof globalThis.window).toBe('undefined');
    });

    it('should NOT have document defined in node environment', () => {
      expect(typeof globalThis.document).toBe('undefined');
    });
  });

  describe('Environment Helpers', () => {
    it('should detect test environment via VITEST', () => {
      // Vitest sets this automatically
      expect(process.env.VITEST).toBeTruthy();
    });

    it('should have path alias @/ working', async () => {
      // Verify path aliases resolve correctly
      const { getEnv } = await import('@/lib/config/env');
      expect(typeof getEnv).toBe('function');
    });
  });

  describe('Database Configuration', () => {
    it('should have DATABASE_URL configured', () => {
      const dbUrl = process.env.DATABASE_URL || '';
      expect(dbUrl).toBeTruthy();
      expect(
        dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')
      ).toBe(true);
    });
  });

  describe('Test Isolation', () => {
    it('should have localStorage mock available', () => {
      // Our setup.ts provides localStorage mock
      expect(typeof localStorage).toBe('object');
      expect(typeof localStorage.getItem).toBe('function');
      expect(typeof localStorage.setItem).toBe('function');
    });

    it('should have clean localStorage between tests', () => {
      // Previous tests shouldn't leave data
      expect(localStorage.length).toBe(0);
    });

    it('should persist localStorage within a test', () => {
      localStorage.setItem('test-key', 'test-value');
      expect(localStorage.getItem('test-key')).toBe('test-value');
    });
  });
});
