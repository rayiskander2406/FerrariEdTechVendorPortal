/**
 * External Service Health API
 *
 * HARD-07: Provides health status for external services with circuit breaker info.
 *
 * GET /api/health/external - Get all service health statuses
 * GET /api/health/external?service=clever - Get specific service health
 * POST /api/health/external/reset - Reset a circuit breaker (admin)
 *
 * @module app/api/health/external/route
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllServiceHealth,
  getServiceHealth,
  getServicesSummary,
  resetCircuit,
  initializeAllServices,
  type ExternalServiceId,
} from '@/lib/circuit-breaker';

/**
 * GET /api/health/external
 *
 * Get health status for external services
 *
 * Query params:
 * - service: Optional service ID to get specific service health
 * - summary: If 'true', returns summary statistics only
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get('service') as ExternalServiceId | null;
    const summaryOnly = searchParams.get('summary') === 'true';

    // Summary mode
    if (summaryOnly) {
      const summary = await getServicesSummary();
      return NextResponse.json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString(),
      });
    }

    // Specific service
    if (serviceId) {
      const health = await getServiceHealth(serviceId);

      if (!health) {
        return NextResponse.json(
          {
            success: false,
            error: `Service '${serviceId}' not found`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: health,
        timestamp: new Date().toISOString(),
      });
    }

    // All services
    const services = await getAllServiceHealth();
    const summary = await getServicesSummary();

    return NextResponse.json({
      success: true,
      data: {
        services,
        summary,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Health API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/external
 *
 * Admin actions for circuit breaker management
 *
 * Body:
 * - action: 'reset' | 'initialize'
 * - serviceId: Required for 'reset' action
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, serviceId } = body;

    switch (action) {
      case 'reset':
        if (!serviceId) {
          return NextResponse.json(
            {
              success: false,
              error: 'serviceId is required for reset action',
            },
            { status: 400 }
          );
        }

        const health = await resetCircuit(serviceId as ExternalServiceId);
        return NextResponse.json({
          success: true,
          message: `Circuit breaker reset for ${serviceId}`,
          data: health,
          timestamp: new Date().toISOString(),
        });

      case 'initialize':
        await initializeAllServices();
        const services = await getAllServiceHealth();
        return NextResponse.json({
          success: true,
          message: 'All services initialized',
          data: { count: services.length, services },
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}. Valid actions: reset, initialize`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Health API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
