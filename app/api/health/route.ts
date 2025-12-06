/**
 * Health Check API
 *
 * V1-07: Comprehensive health check endpoint.
 *
 * @module app/api/health
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRedisHealth } from '@/lib/rate-limit';

// Track server start time for uptime calculation
const startTime = Date.now();

/**
 * GET /api/health
 *
 * Comprehensive health check including all dependencies.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const components: Record<string, 'healthy' | 'unhealthy'> = {
    database: 'healthy',
    cache: 'healthy',
  };

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1 as result`;
  } catch (error) {
    components.database = 'unhealthy';
    status = 'unhealthy';
  }

  // Check Redis/cache
  try {
    const cacheHealthy = await checkRedisHealth();
    if (!cacheHealthy) {
      components.cache = 'unhealthy';
      if (status === 'healthy') {
        status = 'degraded';
      }
    }
  } catch (error) {
    components.cache = 'unhealthy';
    if (status === 'healthy') {
      status = 'degraded';
    }
  }

  const response = {
    status,
    components,
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  };

  const httpStatus = status === 'unhealthy' ? 503 : 200;

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
