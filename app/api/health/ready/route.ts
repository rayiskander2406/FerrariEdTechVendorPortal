/**
 * Readiness Probe API
 *
 * V1-07: Kubernetes readiness probe endpoint.
 *
 * Checks if the application is ready to receive traffic.
 * Fails if database is not connected.
 *
 * @module app/api/health/ready
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/health/ready
 *
 * Readiness probe for Kubernetes.
 * Returns 200 if ready, 503 if not ready.
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1 as result`;

    return NextResponse.json(
      {
        ready: true,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ready: false,
        error: 'Database not connected',
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
