/**
 * Observability API Tests
 *
 * V1-07: Integration tests for observability endpoints.
 *
 * Tests cover:
 * - GET /api/metrics - Prometheus metrics endpoint
 * - GET /api/health - Health check endpoint
 * - GET /api/health/ready - Readiness probe
 * - GET /api/health/live - Liveness probe
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted for prom-client mocks
const { mockPromClientMetrics, mockPromClientSetDefaultLabels, mockPromClientCollectDefaultMetrics } = vi.hoisted(() => ({
  mockPromClientMetrics: vi.fn().mockResolvedValue(
    '# HELP http_requests_total Total HTTP requests\n' +
    '# TYPE http_requests_total counter\n' +
    'http_requests_total{method="GET",path="/api/health",status="200"} 100\n'
  ),
  mockPromClientSetDefaultLabels: vi.fn(),
  mockPromClientCollectDefaultMetrics: vi.fn(),
}));

vi.mock('prom-client', () => {
  // Use function constructors (not arrow functions) so they work with 'new'
  function Counter() {
    return { inc: vi.fn(), labels: vi.fn().mockReturnThis() };
  }

  function Gauge() {
    return { set: vi.fn(), inc: vi.fn(), dec: vi.fn(), labels: vi.fn().mockReturnThis() };
  }

  function Histogram() {
    return { observe: vi.fn(), startTimer: vi.fn().mockReturnValue(vi.fn()), labels: vi.fn().mockReturnThis() };
  }

  return {
    Counter,
    Gauge,
    Histogram,
    register: {
      metrics: mockPromClientMetrics,
      contentType: 'text/plain; version=0.0.4; charset=utf-8',
      setDefaultLabels: mockPromClientSetDefaultLabels,
    },
    collectDefaultMetrics: mockPromClientCollectDefaultMetrics,
  };
});

// Mock Prisma for health checks
vi.mock('@/lib/db', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]),
  },
}));

// Mock Redis for health checks
vi.mock('@/lib/rate-limit', () => ({
  checkRedisHealth: vi.fn().mockResolvedValue(true),
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 99, limit: 100 }),
}));

import { prisma } from '@/lib/db';
import { checkRedisHealth } from '@/lib/rate-limit';

// Import handlers after mocks
import { GET as getMetrics } from '@/app/api/metrics/route';
import { GET as getHealth } from '@/app/api/health/route';
import { GET as getReady } from '@/app/api/health/ready/route';
import { GET as getLive } from '@/app/api/health/live/route';

describe('Observability API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // GET /api/metrics - Prometheus Metrics
  // ===========================================================================

  describe('GET /api/metrics', () => {
    it('returns metrics in Prometheus format', async () => {
      const request = new NextRequest('http://localhost/api/metrics');
      const response = await getMetrics(request);

      expect(response.status).toBe(200);

      const body = await response.text();
      expect(body).toContain('# HELP');
      expect(body).toContain('http_requests_total');
    });

    it('returns correct content type', async () => {
      const request = new NextRequest('http://localhost/api/metrics');
      const response = await getMetrics(request);

      expect(response.headers.get('Content-Type')).toContain('text/plain');
    });
  });

  // ===========================================================================
  // GET /api/health - Health Check
  // ===========================================================================

  describe('GET /api/health', () => {
    it('returns healthy status when all checks pass', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ result: 1 }]);
      vi.mocked(checkRedisHealth).mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/health');
      const response = await getHealth(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('healthy');
    });

    it('includes component status', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ result: 1 }]);
      vi.mocked(checkRedisHealth).mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/health');
      const response = await getHealth(request);

      const data = await response.json();
      expect(data.components).toBeDefined();
      expect(data.components.database).toBe('healthy');
      expect(data.components.cache).toBe('healthy');
    });

    it('returns unhealthy when database is down', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Connection refused'));
      vi.mocked(checkRedisHealth).mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/health');
      const response = await getHealth(request);

      expect(response.status).toBe(503);

      const data = await response.json();
      expect(data.status).toBe('unhealthy');
      expect(data.components.database).toBe('unhealthy');
    });

    it('returns degraded when cache is down', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ result: 1 }]);
      vi.mocked(checkRedisHealth).mockResolvedValue(false);

      const request = new NextRequest('http://localhost/api/health');
      const response = await getHealth(request);

      const data = await response.json();
      expect(data.status).toBe('degraded');
      expect(data.components.cache).toBe('unhealthy');
    });

    it('includes version information', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ result: 1 }]);
      vi.mocked(checkRedisHealth).mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/health');
      const response = await getHealth(request);

      const data = await response.json();
      expect(data.version).toBeDefined();
    });

    it('includes uptime', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ result: 1 }]);
      vi.mocked(checkRedisHealth).mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/health');
      const response = await getHealth(request);

      const data = await response.json();
      expect(data.uptime).toBeDefined();
      expect(typeof data.uptime).toBe('number');
    });
  });

  // ===========================================================================
  // GET /api/health/ready - Readiness Probe
  // ===========================================================================

  describe('GET /api/health/ready', () => {
    it('returns ready when database is connected', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ result: 1 }]);

      const request = new NextRequest('http://localhost/api/health/ready');
      const response = await getReady(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.ready).toBe(true);
    });

    it('returns not ready when database is down', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Connection refused'));

      const request = new NextRequest('http://localhost/api/health/ready');
      const response = await getReady(request);

      expect(response.status).toBe(503);

      const data = await response.json();
      expect(data.ready).toBe(false);
    });
  });

  // ===========================================================================
  // GET /api/health/live - Liveness Probe
  // ===========================================================================

  describe('GET /api/health/live', () => {
    it('returns alive status', async () => {
      const request = new NextRequest('http://localhost/api/health/live');
      const response = await getLive(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.alive).toBe(true);
    });

    it('does not check external dependencies', async () => {
      const request = new NextRequest('http://localhost/api/health/live');
      await getLive(request);

      // Liveness probe should NOT check database
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('includes process uptime', async () => {
      const request = new NextRequest('http://localhost/api/health/live');
      const response = await getLive(request);

      const data = await response.json();
      expect(data.uptime).toBeDefined();
      expect(typeof data.uptime).toBe('number');
    });
  });

  // ===========================================================================
  // CACHING
  // ===========================================================================

  describe('Caching', () => {
    it('metrics endpoint has no-store cache header', async () => {
      const request = new NextRequest('http://localhost/api/metrics');
      const response = await getMetrics(request);

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('no-store');
    });

    it('health endpoints have no-cache headers', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ result: 1 }]);
      vi.mocked(checkRedisHealth).mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/health');
      const response = await getHealth(request);

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('no-cache');
    });
  });
});
