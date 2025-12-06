/**
 * Health Endpoint Contract Schemas
 *
 * TEST-03: Defines the API contract for health check endpoints.
 */

import { z } from 'zod';

// =============================================================================
// GET /api/health
// =============================================================================

/**
 * Health status enum
 */
export const HealthStatusSchema = z.enum(['healthy', 'degraded', 'unhealthy']);

/**
 * Component health status
 */
export const ComponentHealthSchema = z.enum(['healthy', 'unhealthy']);

/**
 * GET /api/health - 200 OK Response
 */
export const HealthResponseSchema = z.object({
  status: HealthStatusSchema,
  components: z.object({
    database: ComponentHealthSchema,
    cache: ComponentHealthSchema,
  }),
  version: z.string().min(1),
  uptime: z.number().int().nonnegative(),
  timestamp: z.string().datetime(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

// =============================================================================
// GET /api/health/live
// =============================================================================

/**
 * GET /api/health/live - 200 OK Response
 * Kubernetes liveness probe - checks if process is alive
 */
export const LiveResponseSchema = z.object({
  alive: z.literal(true),
  uptime: z.number().int().nonnegative(),
  timestamp: z.string().datetime(),
});

export type LiveResponse = z.infer<typeof LiveResponseSchema>;

// =============================================================================
// GET /api/health/ready
// =============================================================================

/**
 * GET /api/health/ready - 200 OK Response
 * Kubernetes readiness probe - checks if ready to receive traffic
 */
export const ReadyResponseSchema = z.object({
  ready: z.boolean(),
  error: z.string().optional(),
  timestamp: z.string().datetime(),
});

export type ReadyResponse = z.infer<typeof ReadyResponseSchema>;
