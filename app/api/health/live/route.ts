/**
 * Liveness Probe API
 *
 * V1-07: Kubernetes liveness probe endpoint.
 *
 * Checks if the application is alive (not deadlocked).
 * Does NOT check external dependencies - this is intentional.
 *
 * @module app/api/health/live
 */

import { NextRequest, NextResponse } from 'next/server';

// Track server start time for uptime
const startTime = Date.now();

/**
 * GET /api/health/live
 *
 * Liveness probe for Kubernetes.
 * Always returns 200 if the process is running.
 */
export async function GET(request: NextRequest): Promise<Response> {
  return NextResponse.json(
    {
      alive: true,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
