/**
 * Prometheus Metrics API
 *
 * V1-07: Metrics endpoint for Prometheus scraping.
 *
 * @module app/api/metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMetrics, getContentType } from '@/lib/observability/metrics';

/**
 * GET /api/metrics
 *
 * Returns metrics in Prometheus format.
 * No authentication required for metrics scraping.
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const metrics = await getMetrics();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': getContentType(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Metrics] Error getting metrics:', error);

    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
}
