/**
 * HARD-07: Circuit Breaker Tests
 *
 * Tests for circuit breaker pattern implementation for external services.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import {
  initializeService,
  getServiceHealth,
  getAllServiceHealth,
  recordSuccess,
  recordFailure,
  resetCircuit,
  withCircuitBreaker,
  isServiceAvailable,
  initializeAllServices,
  getServicesSummary,
  CircuitOpenError,
  DEFAULT_CONFIGS,
  type ExternalServiceId,
} from '@/lib/circuit-breaker';

// Test service ID
const TEST_SERVICE: ExternalServiceId = 'clever';

describe('HARD-07: Circuit Breaker', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.externalServiceHealth.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after tests
    await prisma.externalServiceHealth.deleteMany({});
  });

  describe('initializeService', () => {
    it('creates a new service health record', async () => {
      const health = await initializeService(TEST_SERVICE);

      expect(health.id).toBe(TEST_SERVICE);
      expect(health.status).toBe('healthy');
      expect(health.circuitState).toBe('closed');
      expect(health.consecutiveFailures).toBe(0);
      expect(health.consecutiveSuccesses).toBe(0);
    });

    it('uses default config for the service', async () => {
      await initializeService(TEST_SERVICE);

      const record = await prisma.externalServiceHealth.findUnique({
        where: { id: TEST_SERVICE },
      });

      expect(record?.failureThreshold).toBe(DEFAULT_CONFIGS[TEST_SERVICE].failureThreshold);
      expect(record?.successThreshold).toBe(DEFAULT_CONFIGS[TEST_SERVICE].successThreshold);
      expect(record?.openDurationMs).toBe(DEFAULT_CONFIGS[TEST_SERVICE].openDurationMs);
    });

    it('does not overwrite existing service on upsert', async () => {
      await initializeService(TEST_SERVICE);
      await recordFailure(TEST_SERVICE, 'Test failure');

      const before = await getServiceHealth(TEST_SERVICE);
      expect(before?.consecutiveFailures).toBe(1);

      await initializeService(TEST_SERVICE);

      const after = await getServiceHealth(TEST_SERVICE);
      expect(after?.consecutiveFailures).toBe(1); // Still 1
    });

    it('allows custom configuration', async () => {
      await initializeService(TEST_SERVICE, {
        failureThreshold: 10,
        successThreshold: 5,
      });

      const record = await prisma.externalServiceHealth.findUnique({
        where: { id: TEST_SERVICE },
      });

      expect(record?.failureThreshold).toBe(10);
      expect(record?.successThreshold).toBe(5);
    });
  });

  describe('getServiceHealth', () => {
    it('returns null for unknown service', async () => {
      const health = await getServiceHealth('unknown_service' as ExternalServiceId);
      expect(health).toBeNull();
    });

    it('returns health for initialized service', async () => {
      await initializeService(TEST_SERVICE);

      const health = await getServiceHealth(TEST_SERVICE);

      expect(health).not.toBeNull();
      expect(health?.id).toBe(TEST_SERVICE);
    });

    it('transitions open circuit to half-open after timeout', async () => {
      await initializeService(TEST_SERVICE);

      // Simulate circuit opening with a past timestamp
      await prisma.externalServiceHealth.update({
        where: { id: TEST_SERVICE },
        data: {
          circuitState: 'open',
          circuitOpenedAt: new Date(Date.now() - 120000), // 2 minutes ago
          status: 'down',
        },
      });

      const health = await getServiceHealth(TEST_SERVICE);

      expect(health?.circuitState).toBe('half_open');
    });
  });

  describe('getAllServiceHealth', () => {
    it('returns empty array when no services', async () => {
      const services = await getAllServiceHealth();
      expect(services).toEqual([]);
    });

    it('returns all initialized services', async () => {
      await initializeService('clever');
      await initializeService('classlink');

      const services = await getAllServiceHealth();

      expect(services.length).toBe(2);
      expect(services.map((s) => s.id)).toContain('clever');
      expect(services.map((s) => s.id)).toContain('classlink');
    });
  });

  describe('recordSuccess', () => {
    it('increments consecutive successes', async () => {
      await initializeService(TEST_SERVICE);

      await recordSuccess(TEST_SERVICE);
      const health = await getServiceHealth(TEST_SERVICE);

      expect(health?.consecutiveSuccesses).toBe(1);
      expect(health?.consecutiveFailures).toBe(0);
    });

    it('resets consecutive failures on success', async () => {
      await initializeService(TEST_SERVICE);
      await recordFailure(TEST_SERVICE);
      await recordFailure(TEST_SERVICE);

      const before = await getServiceHealth(TEST_SERVICE);
      expect(before?.consecutiveFailures).toBe(2);

      await recordSuccess(TEST_SERVICE);

      const after = await getServiceHealth(TEST_SERVICE);
      expect(after?.consecutiveFailures).toBe(0);
      expect(after?.consecutiveSuccesses).toBe(1);
    });

    it('updates lastSuccess timestamp', async () => {
      await initializeService(TEST_SERVICE);

      const before = await getServiceHealth(TEST_SERVICE);
      await new Promise((r) => setTimeout(r, 10));
      await recordSuccess(TEST_SERVICE);
      const after = await getServiceHealth(TEST_SERVICE);

      expect(after?.lastSuccess).toBeDefined();
      expect(after?.lastSuccess!.getTime()).toBeGreaterThan(before!.lastHealthCheck.getTime());
    });

    it('closes circuit when success threshold reached in half-open', async () => {
      await initializeService(TEST_SERVICE);

      // Set to half-open with successes near threshold
      await prisma.externalServiceHealth.update({
        where: { id: TEST_SERVICE },
        data: {
          circuitState: 'half_open',
          consecutiveSuccesses: 2, // One more success will close
        },
      });

      await recordSuccess(TEST_SERVICE);

      const health = await getServiceHealth(TEST_SERVICE);
      expect(health?.circuitState).toBe('closed');
    });

    it('initializes service if not exists', async () => {
      // Don't initialize first
      const health = await recordSuccess(TEST_SERVICE);

      expect(health.id).toBe(TEST_SERVICE);
      expect(health.status).toBe('healthy');
    });
  });

  describe('recordFailure', () => {
    it('increments consecutive failures', async () => {
      await initializeService(TEST_SERVICE);

      await recordFailure(TEST_SERVICE, 'Connection timeout');
      const health = await getServiceHealth(TEST_SERVICE);

      expect(health?.consecutiveFailures).toBe(1);
      expect(health?.lastFailureReason).toBe('Connection timeout');
    });

    it('sets status to degraded at half threshold', async () => {
      await initializeService(TEST_SERVICE);

      // Default threshold is 5, so 3 failures = degraded
      await recordFailure(TEST_SERVICE);
      await recordFailure(TEST_SERVICE);
      await recordFailure(TEST_SERVICE);

      const health = await getServiceHealth(TEST_SERVICE);
      expect(health?.status).toBe('degraded');
      expect(health?.circuitState).toBe('closed'); // Not yet open
    });

    it('opens circuit at failure threshold', async () => {
      await initializeService(TEST_SERVICE);

      // Default threshold is 5
      for (let i = 0; i < 5; i++) {
        await recordFailure(TEST_SERVICE, `Failure ${i + 1}`);
      }

      const health = await getServiceHealth(TEST_SERVICE);
      expect(health?.status).toBe('down');
      expect(health?.circuitState).toBe('open');
      expect(health?.circuitOpenedAt).toBeDefined();
    });

    it('reopens circuit on failure in half-open state', async () => {
      await initializeService(TEST_SERVICE);

      // Set to half-open
      await prisma.externalServiceHealth.update({
        where: { id: TEST_SERVICE },
        data: {
          circuitState: 'half_open',
          consecutiveSuccesses: 1,
        },
      });

      await recordFailure(TEST_SERVICE, 'Still failing');

      const health = await getServiceHealth(TEST_SERVICE);
      expect(health?.circuitState).toBe('open');
      expect(health?.status).toBe('down');
    });
  });

  describe('resetCircuit', () => {
    it('resets all circuit breaker state', async () => {
      await initializeService(TEST_SERVICE);

      // Make it fail
      for (let i = 0; i < 5; i++) {
        await recordFailure(TEST_SERVICE);
      }

      const before = await getServiceHealth(TEST_SERVICE);
      expect(before?.circuitState).toBe('open');

      await resetCircuit(TEST_SERVICE);

      const after = await getServiceHealth(TEST_SERVICE);
      expect(after?.status).toBe('healthy');
      expect(after?.circuitState).toBe('closed');
      expect(after?.consecutiveFailures).toBe(0);
      expect(after?.consecutiveSuccesses).toBe(0);
      expect(after?.circuitOpenedAt).toBeUndefined();
    });
  });

  describe('withCircuitBreaker', () => {
    it('executes function when circuit is closed', async () => {
      await initializeService(TEST_SERVICE);

      const result = await withCircuitBreaker(TEST_SERVICE, async () => {
        return 'success';
      });

      expect(result).toBe('success');

      const health = await getServiceHealth(TEST_SERVICE);
      expect(health?.consecutiveSuccesses).toBe(1);
    });

    it('records failure when function throws', async () => {
      await initializeService(TEST_SERVICE);

      await expect(
        withCircuitBreaker(TEST_SERVICE, async () => {
          throw new Error('API error');
        })
      ).rejects.toThrow('API error');

      const health = await getServiceHealth(TEST_SERVICE);
      expect(health?.consecutiveFailures).toBe(1);
      expect(health?.lastFailureReason).toBe('API error');
    });

    it('throws CircuitOpenError when circuit is open', async () => {
      await initializeService(TEST_SERVICE);

      // Open the circuit
      await prisma.externalServiceHealth.update({
        where: { id: TEST_SERVICE },
        data: {
          circuitState: 'open',
          circuitOpenedAt: new Date(), // Just opened
          status: 'down',
        },
      });

      await expect(
        withCircuitBreaker(TEST_SERVICE, async () => 'should not run')
      ).rejects.toThrow(CircuitOpenError);
    });

    it('uses fallback when circuit is open', async () => {
      await initializeService(TEST_SERVICE);

      // Open the circuit
      await prisma.externalServiceHealth.update({
        where: { id: TEST_SERVICE },
        data: {
          circuitState: 'open',
          circuitOpenedAt: new Date(),
          status: 'down',
        },
      });

      const result = await withCircuitBreaker(
        TEST_SERVICE,
        async () => 'primary',
        { fallback: async () => 'fallback' }
      );

      expect(result).toBe('fallback');
    });

    it('uses fallback when function fails', async () => {
      await initializeService(TEST_SERVICE);

      const result = await withCircuitBreaker(
        TEST_SERVICE,
        async () => {
          throw new Error('API error');
        },
        { fallback: async () => 'fallback' }
      );

      expect(result).toBe('fallback');
    });

    it('initializes service if not exists', async () => {
      const result = await withCircuitBreaker(TEST_SERVICE, async () => 'success');

      expect(result).toBe('success');

      const health = await getServiceHealth(TEST_SERVICE);
      expect(health).not.toBeNull();
    });
  });

  describe('isServiceAvailable', () => {
    it('returns true for healthy service', async () => {
      await initializeService(TEST_SERVICE);

      const available = await isServiceAvailable(TEST_SERVICE);
      expect(available).toBe(true);
    });

    it('returns false when circuit is open', async () => {
      await initializeService(TEST_SERVICE);

      await prisma.externalServiceHealth.update({
        where: { id: TEST_SERVICE },
        data: {
          circuitState: 'open',
          circuitOpenedAt: new Date(),
          status: 'down',
        },
      });

      const available = await isServiceAvailable(TEST_SERVICE);
      expect(available).toBe(false);
    });

    it('returns true for unknown service', async () => {
      const available = await isServiceAvailable('unknown' as ExternalServiceId);
      expect(available).toBe(true);
    });
  });

  describe('initializeAllServices', () => {
    it('creates records for all known services', async () => {
      await initializeAllServices();

      const services = await getAllServiceHealth();

      expect(services.length).toBeGreaterThanOrEqual(8);
      expect(services.map((s) => s.id)).toContain('clever');
      expect(services.map((s) => s.id)).toContain('classlink');
      expect(services.map((s) => s.id)).toContain('google_sso');
    });
  });

  describe('getServicesSummary', () => {
    it('returns correct counts', async () => {
      await initializeService('clever');
      await initializeService('classlink');
      await initializeService('lausd_sis');

      // Make one degraded
      await recordFailure('classlink');
      await recordFailure('classlink');
      await recordFailure('classlink');

      // Make one down
      for (let i = 0; i < 5; i++) {
        await recordFailure('lausd_sis');
      }

      const summary = await getServicesSummary();

      expect(summary.total).toBe(3);
      expect(summary.healthy).toBe(1);
      expect(summary.degraded).toBe(1);
      expect(summary.down).toBe(1);
      expect(summary.circuitsOpen).toBe(1);
    });
  });
});

describe('HARD-07: CircuitOpenError', () => {
  it('includes service ID and timing info', () => {
    const openedAt = new Date();
    const reopensAt = new Date(openedAt.getTime() + 60000);

    const error = new CircuitOpenError('clever', openedAt, reopensAt);

    expect(error.serviceId).toBe('clever');
    expect(error.circuitOpenedAt).toBe(openedAt);
    expect(error.reopensAt).toBe(reopensAt);
    expect(error.name).toBe('CircuitOpenError');
    expect(error.message).toContain('clever');
  });
});

describe('HARD-07: DEFAULT_CONFIGS', () => {
  it('has configs for all expected services', () => {
    const expectedServices = [
      'google_sso',
      'microsoft_sso',
      'clever',
      'classlink',
      'lausd_sis',
      'schoology',
      'vonage',
      'twilio',
    ];

    for (const service of expectedServices) {
      expect(DEFAULT_CONFIGS[service]).toBeDefined();
      expect(DEFAULT_CONFIGS[service].failureThreshold).toBeGreaterThan(0);
      expect(DEFAULT_CONFIGS[service].successThreshold).toBeGreaterThan(0);
      expect(DEFAULT_CONFIGS[service].openDurationMs).toBeGreaterThan(0);
    }
  });

  it('has stricter settings for SIS than SSO', () => {
    expect(DEFAULT_CONFIGS.lausd_sis.failureThreshold).toBeLessThan(
      DEFAULT_CONFIGS.clever.failureThreshold
    );
  });

  it('has most tolerant settings for communication providers', () => {
    expect(DEFAULT_CONFIGS.vonage.failureThreshold).toBeGreaterThanOrEqual(
      DEFAULT_CONFIGS.clever.failureThreshold
    );
  });
});
