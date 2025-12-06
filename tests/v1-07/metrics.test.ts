/**
 * Prometheus Metrics Tests
 *
 * V1-07: Unit tests for application metrics.
 *
 * Tests cover:
 * - Counter metrics
 * - Gauge metrics
 * - Histogram metrics
 * - Helper functions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Use vi.hoisted to create mock functions that are available during vi.mock hoisting
const {
  mockInc,
  mockSet,
  mockDec,
  mockObserve,
  mockLabels,
  mockStartTimer,
  mockMetrics,
  mockSetDefaultLabels,
  mockCollectDefaultMetrics,
} = vi.hoisted(() => ({
  mockInc: vi.fn(),
  mockSet: vi.fn(),
  mockDec: vi.fn(),
  mockObserve: vi.fn(),
  mockLabels: vi.fn().mockReturnThis(),
  mockStartTimer: vi.fn().mockReturnValue(vi.fn()),
  mockMetrics: vi.fn().mockResolvedValue('# HELP test_metric\ntest_metric 1'),
  mockSetDefaultLabels: vi.fn(),
  mockCollectDefaultMetrics: vi.fn(),
}));

vi.mock('prom-client', () => {
  // Use function constructors (not arrow functions) so they work with 'new'
  function Counter() {
    return { inc: mockInc, labels: mockLabels };
  }

  function Gauge() {
    return { set: mockSet, inc: mockInc, dec: mockDec, labels: mockLabels };
  }

  function Histogram() {
    return { observe: mockObserve, startTimer: mockStartTimer, labels: mockLabels };
  }

  function Registry() {
    return {
      metrics: mockMetrics,
      contentType: 'text/plain',
      clear: vi.fn(),
      setDefaultLabels: mockSetDefaultLabels,
    };
  }

  return {
    Counter,
    Gauge,
    Histogram,
    Registry,
    register: {
      metrics: mockMetrics,
      contentType: 'text/plain; version=0.0.4; charset=utf-8',
      clear: vi.fn(),
      setDefaultLabels: mockSetDefaultLabels,
    },
    collectDefaultMetrics: mockCollectDefaultMetrics,
  };
});

import * as promClient from 'prom-client';
import {
  initMetrics,
  getMetrics,
  getContentType,
  httpRequestsTotal,
  httpRequestErrorsTotal,
  messagesEnqueuedTotal,
  messagesSentTotal,
  messagesFailedTotal,
  activeConnections,
  queueSize,
  circuitBreakerState,
  httpRequestDuration,
  messageProcessingDuration,
  externalServiceDuration,
  recordHttpRequest,
  recordMessageEnqueued,
  recordMessageSent,
  recordMessageFailed,
  recordExternalServiceCall,
  setQueueSize,
  setCircuitBreakerState,
} from '@/lib/observability/metrics';

describe('Prometheus Metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  describe('initMetrics', () => {
    it('initializes default metrics', () => {
      initMetrics();

      expect(promClient.collectDefaultMetrics).toHaveBeenCalled();
    });

    it('sets default labels', () => {
      initMetrics({
        defaultLabels: {
          app: 'vendor-portal',
          environment: 'production',
        },
      });

      expect(promClient.register.setDefaultLabels).toHaveBeenCalledWith({
        app: 'vendor-portal',
        environment: 'production',
      });
    });
  });

  // ===========================================================================
  // METRICS EXPORT
  // ===========================================================================

  describe('getMetrics', () => {
    it('returns metrics in Prometheus format', async () => {
      const metrics = await getMetrics();

      expect(promClient.register.metrics).toHaveBeenCalled();
      expect(typeof metrics).toBe('string');
    });
  });

  describe('getContentType', () => {
    it('returns Prometheus content type', () => {
      const contentType = getContentType();

      expect(contentType).toContain('text/plain');
    });
  });

  // ===========================================================================
  // HTTP REQUEST METRICS
  // ===========================================================================

  describe('httpRequestsTotal', () => {
    it('has inc method', () => {
      expect(typeof httpRequestsTotal.inc).toBe('function');
    });

    it('has labels method', () => {
      expect(typeof httpRequestsTotal.labels).toBe('function');
    });
  });

  describe('httpRequestDuration', () => {
    it('has observe method', () => {
      expect(typeof httpRequestDuration.observe).toBe('function');
    });

    it('has startTimer method', () => {
      expect(typeof httpRequestDuration.startTimer).toBe('function');
    });
  });

  // ===========================================================================
  // MESSAGE METRICS
  // ===========================================================================

  describe('messagesEnqueuedTotal', () => {
    it('has inc method', () => {
      expect(typeof messagesEnqueuedTotal.inc).toBe('function');
    });
  });

  describe('messagesSentTotal', () => {
    it('has inc method', () => {
      expect(typeof messagesSentTotal.inc).toBe('function');
    });
  });

  describe('messagesFailedTotal', () => {
    it('has inc method', () => {
      expect(typeof messagesFailedTotal.inc).toBe('function');
    });
  });

  // ===========================================================================
  // GAUGE METRICS
  // ===========================================================================

  describe('activeConnections', () => {
    it('has set method', () => {
      expect(typeof activeConnections.set).toBe('function');
    });

    it('has inc method', () => {
      expect(typeof activeConnections.inc).toBe('function');
    });

    it('has dec method', () => {
      expect(typeof activeConnections.dec).toBe('function');
    });
  });

  describe('queueSize', () => {
    it('has set method', () => {
      expect(typeof queueSize.set).toBe('function');
    });

    it('has labels method', () => {
      expect(typeof queueSize.labels).toBe('function');
    });
  });

  describe('circuitBreakerState', () => {
    it('has set method', () => {
      expect(typeof circuitBreakerState.set).toBe('function');
    });
  });

  // ===========================================================================
  // HELPER FUNCTIONS
  // ===========================================================================

  describe('recordHttpRequest', () => {
    it('records request metrics', () => {
      recordHttpRequest({
        method: 'POST',
        path: '/api/messages',
        statusCode: 201,
        durationMs: 150,
      });

      expect(httpRequestsTotal.labels).toHaveBeenCalled();
      expect(httpRequestsTotal.inc).toHaveBeenCalled();
      expect(httpRequestDuration.observe).toHaveBeenCalledWith(0.150);
    });
  });

  describe('recordMessageEnqueued', () => {
    it('records single message', () => {
      recordMessageEnqueued('EMAIL', 'NORMAL');

      expect(messagesEnqueuedTotal.labels).toHaveBeenCalledWith({
        channel: 'EMAIL',
        priority: 'NORMAL',
      });
      expect(messagesEnqueuedTotal.inc).toHaveBeenCalled();
    });

    it('records batch messages', () => {
      recordMessageEnqueued('SMS', 'HIGH', 500);

      expect(messagesEnqueuedTotal.inc).toHaveBeenCalledWith(500);
    });
  });

  describe('recordMessageSent', () => {
    it('records successful send', () => {
      recordMessageSent('EMAIL', 'sendgrid', 250);

      expect(messagesSentTotal.labels).toHaveBeenCalledWith({
        channel: 'EMAIL',
        provider: 'sendgrid',
      });
      expect(messagesSentTotal.inc).toHaveBeenCalled();
      expect(messageProcessingDuration.observe).toHaveBeenCalledWith(0.250);
    });
  });

  describe('recordMessageFailed', () => {
    it('records failed message', () => {
      recordMessageFailed('SMS', 'invalid_recipient');

      expect(messagesFailedTotal.labels).toHaveBeenCalledWith({
        channel: 'SMS',
        reason: 'invalid_recipient',
      });
      expect(messagesFailedTotal.inc).toHaveBeenCalled();
    });
  });

  describe('recordExternalServiceCall', () => {
    it('records external call', () => {
      recordExternalServiceCall({
        service: 'sendgrid',
        operation: 'sendEmail',
        durationMs: 350,
        success: true,
      });

      expect(externalServiceDuration.labels).toHaveBeenCalledWith({
        service: 'sendgrid',
        operation: 'sendEmail',
        success: 'true',
      });
      expect(externalServiceDuration.observe).toHaveBeenCalledWith(0.350);
    });
  });

  describe('setQueueSize', () => {
    it('updates queue size gauge', () => {
      setQueueSize('HIGH', 75);

      expect(queueSize.labels).toHaveBeenCalledWith({ priority: 'HIGH' });
      expect(queueSize.set).toHaveBeenCalledWith(75);
    });
  });

  describe('setCircuitBreakerState', () => {
    it('sets closed state as 0', () => {
      setCircuitBreakerState('sendgrid', 'closed');

      expect(circuitBreakerState.labels).toHaveBeenCalledWith({ service: 'sendgrid' });
      expect(circuitBreakerState.set).toHaveBeenCalledWith(0);
    });

    it('sets open state as 1', () => {
      setCircuitBreakerState('twilio', 'open');

      expect(circuitBreakerState.set).toHaveBeenCalledWith(1);
    });

    it('sets half-open state as 0.5', () => {
      setCircuitBreakerState('database', 'half-open');

      expect(circuitBreakerState.set).toHaveBeenCalledWith(0.5);
    });
  });
});
