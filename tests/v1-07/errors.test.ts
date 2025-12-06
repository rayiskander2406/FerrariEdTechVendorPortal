/**
 * Error Tracking Tests
 *
 * V1-07: Unit tests for Sentry error tracking.
 *
 * Tests cover:
 * - Sentry initialization
 * - Error capturing
 * - Context enrichment
 * - User identification
 * - Breadcrumbs
 * - Performance transactions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Sentry with inline implementations (hoisting-safe)
vi.mock('@sentry/nextjs', () => {
  return {
    init: vi.fn(),
    captureException: vi.fn().mockReturnValue('event-123'),
    captureMessage: vi.fn(),
    setUser: vi.fn(),
    setTag: vi.fn(),
    setExtra: vi.fn(),
    addBreadcrumb: vi.fn(),
    startTransaction: vi.fn().mockReturnValue({
      finish: vi.fn(),
      setStatus: vi.fn(),
      startChild: vi.fn().mockReturnValue({
        finish: vi.fn(),
        setStatus: vi.fn(),
      }),
    }),
    Severity: {
      Error: 'error',
      Warning: 'warning',
      Info: 'info',
    },
  };
});

import * as Sentry from '@sentry/nextjs';
import {
  initErrorTracking,
  captureError,
  captureWarning,
  setErrorContext,
  setVendorContext,
  addErrorBreadcrumb,
  startPerformanceTransaction,
  withErrorTracking,
  isErrorTrackingEnabled,
} from '@/lib/observability/errors';

describe('Error Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  describe('initErrorTracking', () => {
    it('initializes Sentry with DSN', () => {
      initErrorTracking({ dsn: 'https://test@sentry.io/123' });

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://test@sentry.io/123',
        })
      );
    });

    it('sets environment', () => {
      initErrorTracking({
        dsn: 'https://test@sentry.io/123',
        environment: 'production',
      });

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: 'production',
        })
      );
    });

    it('sets sample rate', () => {
      initErrorTracking({
        dsn: 'https://test@sentry.io/123',
        sampleRate: 0.5,
      });

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          sampleRate: 0.5,
        })
      );
    });
  });

  // ===========================================================================
  // ERROR CAPTURING
  // ===========================================================================

  describe('captureError', () => {
    it('captures Error instances', () => {
      const error = new Error('Test error');

      captureError(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, undefined);
    });

    it('captures error with context', () => {
      const error = new Error('Database error');
      const context = {
        requestId: 'req-123',
        vendorId: 'vendor-456',
      };

      captureError(error, context);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          extra: context,
        })
      );
    });

    it('returns event ID', () => {
      const eventId = captureError(new Error('Test'));

      expect(eventId).toBe('event-123');
    });
  });

  describe('captureWarning', () => {
    it('captures warning messages', () => {
      captureWarning('Deprecated API used');

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Deprecated API used',
        expect.objectContaining({
          level: 'warning',
        })
      );
    });
  });

  // ===========================================================================
  // CONTEXT MANAGEMENT
  // ===========================================================================

  describe('setErrorContext', () => {
    it('sets tags', () => {
      setErrorContext({ environment: 'production', version: '1.0.0' });

      expect(Sentry.setTag).toHaveBeenCalledWith('environment', 'production');
      expect(Sentry.setTag).toHaveBeenCalledWith('version', '1.0.0');
    });

    it('sets extra data', () => {
      setErrorContext({}, { requestId: 'req-123' });

      expect(Sentry.setExtra).toHaveBeenCalledWith('requestId', 'req-123');
    });
  });

  describe('setVendorContext', () => {
    it('sets vendor user context', () => {
      setVendorContext({
        vendorId: 'vendor-123',
        vendorName: 'Test Vendor',
        tier: 'PRIVACY_SAFE',
      });

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'vendor-123',
        username: 'Test Vendor',
      });
      expect(Sentry.setTag).toHaveBeenCalledWith('vendor_tier', 'PRIVACY_SAFE');
    });

    it('clears vendor context when null', () => {
      setVendorContext(null);

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  // ===========================================================================
  // BREADCRUMBS
  // ===========================================================================

  describe('addErrorBreadcrumb', () => {
    it('adds breadcrumb', () => {
      addErrorBreadcrumb({
        category: 'navigation',
        message: 'User navigated to /dashboard',
        level: 'info',
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'navigation',
        message: 'User navigated to /dashboard',
        level: 'info',
      });
    });
  });

  // ===========================================================================
  // PERFORMANCE MONITORING
  // ===========================================================================

  describe('startPerformanceTransaction', () => {
    it('starts a transaction', () => {
      const transaction = startPerformanceTransaction({
        name: 'POST /api/messages',
        op: 'http.server',
      });

      expect(Sentry.startTransaction).toHaveBeenCalledWith({
        name: 'POST /api/messages',
        op: 'http.server',
      });
      expect(transaction).toBeDefined();
    });
  });

  // ===========================================================================
  // ERROR TRACKING WRAPPER
  // ===========================================================================

  describe('withErrorTracking', () => {
    it('returns result on success', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withErrorTracking(fn, 'test-operation');

      expect(result).toBe('success');
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('captures and rethrows errors', async () => {
      const error = new Error('Operation failed');
      const fn = vi.fn().mockRejectedValue(error);

      await expect(withErrorTracking(fn, 'test-operation')).rejects.toThrow(
        'Operation failed'
      );

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          extra: expect.objectContaining({
            operation: 'test-operation',
          }),
        })
      );
    });
  });

  // ===========================================================================
  // ENABLED CHECK
  // ===========================================================================

  describe('isErrorTrackingEnabled', () => {
    it('returns boolean', () => {
      const enabled = isErrorTrackingEnabled();
      expect(typeof enabled).toBe('boolean');
    });
  });
});
