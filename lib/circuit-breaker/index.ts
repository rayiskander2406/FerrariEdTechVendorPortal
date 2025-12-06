/**
 * Circuit Breaker for External Services
 *
 * HARD-07: Implements circuit breaker pattern for external service calls.
 * Prevents cascading failures when third-party services (SIS, SSO) are down.
 *
 * ## Circuit States
 *
 * - **CLOSED**: Normal operation, requests go through
 * - **OPEN**: Service is down, requests fail fast without calling service
 * - **HALF_OPEN**: Testing if service recovered, limited requests allowed
 *
 * ## Usage
 *
 * ```typescript
 * import { withCircuitBreaker, getServiceHealth } from '@/lib/circuit-breaker';
 *
 * // Wrap external calls with circuit breaker
 * const result = await withCircuitBreaker('clever', async () => {
 *   return await cleverApi.getUsers();
 * });
 *
 * // Check service health before attempting calls
 * const health = await getServiceHealth('clever');
 * if (health.status === 'down') {
 *   // Show degraded UI
 * }
 * ```
 *
 * @module lib/circuit-breaker
 */

import { prisma } from '@/lib/db';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Known external services that can be monitored
 */
export type ExternalServiceId =
  | 'clever'
  | 'classlink'
  | 'lausd_sis'
  | 'schoology'
  | 'google_sso'
  | 'microsoft_sso'
  | 'vonage'
  | 'twilio';

/**
 * Service health status
 */
export type ServiceStatus = 'healthy' | 'degraded' | 'down';

/**
 * Circuit breaker state
 */
export type CircuitState = 'closed' | 'open' | 'half_open';

/**
 * Service health information
 */
export interface ServiceHealth {
  id: ExternalServiceId;
  status: ServiceStatus;
  circuitState: CircuitState;
  lastHealthCheck: Date;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailure?: Date;
  lastFailureReason?: string;
  lastSuccess?: Date;
  circuitOpenedAt?: Date;
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;  // Failures before opening circuit
  successThreshold: number;  // Successes to close circuit from half-open
  openDurationMs: number;    // Time circuit stays open before half-open
}

/**
 * Default configuration per service type
 */
export const DEFAULT_CONFIGS: Record<string, CircuitBreakerConfig> = {
  // SSO providers - more tolerant
  google_sso: { failureThreshold: 5, successThreshold: 3, openDurationMs: 60000 },
  microsoft_sso: { failureThreshold: 5, successThreshold: 3, openDurationMs: 60000 },
  clever: { failureThreshold: 5, successThreshold: 3, openDurationMs: 60000 },
  classlink: { failureThreshold: 5, successThreshold: 3, openDurationMs: 60000 },

  // SIS - slightly stricter
  lausd_sis: { failureThreshold: 3, successThreshold: 2, openDurationMs: 120000 },
  schoology: { failureThreshold: 3, successThreshold: 2, openDurationMs: 120000 },

  // Communication providers - very tolerant (has fallback)
  vonage: { failureThreshold: 10, successThreshold: 3, openDurationMs: 30000 },
  twilio: { failureThreshold: 10, successThreshold: 3, openDurationMs: 30000 },
};

// =============================================================================
// CIRCUIT BREAKER ERROR
// =============================================================================

/**
 * Error thrown when circuit is open
 */
export class CircuitOpenError extends Error {
  constructor(
    public serviceId: ExternalServiceId,
    public circuitOpenedAt: Date,
    public reopensAt: Date
  ) {
    super(`Circuit breaker open for ${serviceId}. Reopens at ${reopensAt.toISOString()}`);
    this.name = 'CircuitOpenError';
  }
}

// =============================================================================
// SERVICE HEALTH OPERATIONS
// =============================================================================

/**
 * Initialize a service health record if it doesn't exist
 */
export async function initializeService(
  serviceId: ExternalServiceId,
  config?: Partial<CircuitBreakerConfig>
): Promise<ServiceHealth> {
  const defaultConfig = DEFAULT_CONFIGS[serviceId] || DEFAULT_CONFIGS.clever;
  const finalConfig = { ...defaultConfig, ...config };

  const record = await prisma.externalServiceHealth.upsert({
    where: { id: serviceId },
    update: {},
    create: {
      id: serviceId,
      status: 'healthy',
      circuitState: 'closed',
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      failureThreshold: finalConfig.failureThreshold,
      successThreshold: finalConfig.successThreshold,
      openDurationMs: finalConfig.openDurationMs,
    },
  });

  return toServiceHealth(record);
}

/**
 * Get current health status for a service
 */
export async function getServiceHealth(serviceId: ExternalServiceId): Promise<ServiceHealth | null> {
  const record = await prisma.externalServiceHealth.findUnique({
    where: { id: serviceId },
  });

  if (!record) return null;

  // Check if circuit should transition from open to half-open
  if (record.circuitState === 'open' && record.circuitOpenedAt) {
    const reopensAt = new Date(record.circuitOpenedAt.getTime() + record.openDurationMs);
    if (new Date() >= reopensAt) {
      // Transition to half-open
      const updated = await prisma.externalServiceHealth.update({
        where: { id: serviceId },
        data: {
          circuitState: 'half_open',
          circuitHalfOpenAt: new Date(),
        },
      });
      return toServiceHealth(updated);
    }
  }

  return toServiceHealth(record);
}

/**
 * Get health status for all services
 */
export async function getAllServiceHealth(): Promise<ServiceHealth[]> {
  const records = await prisma.externalServiceHealth.findMany({
    orderBy: { id: 'asc' },
  });

  return records.map(toServiceHealth);
}

/**
 * Record a successful call to an external service
 */
export async function recordSuccess(serviceId: ExternalServiceId): Promise<ServiceHealth> {
  const current = await getServiceHealth(serviceId);

  if (!current) {
    // Initialize if not exists
    return initializeService(serviceId);
  }

  const record = await prisma.externalServiceHealth.update({
    where: { id: serviceId },
    data: {
      lastHealthCheck: new Date(),
      lastSuccess: new Date(),
      consecutiveSuccesses: current.consecutiveSuccesses + 1,
      consecutiveFailures: 0,
      status: 'healthy',
      // If half-open and success threshold reached, close circuit
      circuitState:
        current.circuitState === 'half_open' &&
        current.consecutiveSuccesses + 1 >= (DEFAULT_CONFIGS[serviceId]?.successThreshold || 3)
          ? 'closed'
          : current.circuitState === 'half_open'
          ? 'half_open'
          : 'closed',
      circuitOpenedAt:
        current.circuitState === 'half_open' &&
        current.consecutiveSuccesses + 1 >= (DEFAULT_CONFIGS[serviceId]?.successThreshold || 3)
          ? null
          : current.circuitOpenedAt,
      circuitHalfOpenAt:
        current.circuitState === 'half_open' &&
        current.consecutiveSuccesses + 1 >= (DEFAULT_CONFIGS[serviceId]?.successThreshold || 3)
          ? null
          : current.circuitHalfOpenAt,
    },
  });

  return toServiceHealth(record);
}

/**
 * Record a failed call to an external service
 */
export async function recordFailure(
  serviceId: ExternalServiceId,
  reason?: string
): Promise<ServiceHealth> {
  const current = await getServiceHealth(serviceId);

  if (!current) {
    // Initialize with failure
    await initializeService(serviceId);
    return recordFailure(serviceId, reason);
  }

  const newFailureCount = current.consecutiveFailures + 1;
  const threshold = DEFAULT_CONFIGS[serviceId]?.failureThreshold || 5;

  // Determine new status
  let newStatus: ServiceStatus = current.status;
  let newCircuitState: CircuitState = current.circuitState;
  let circuitOpenedAt = current.circuitOpenedAt;

  if (newFailureCount >= threshold) {
    // Open the circuit
    newStatus = 'down';
    newCircuitState = 'open';
    circuitOpenedAt = new Date();
  } else if (newFailureCount >= Math.ceil(threshold / 2)) {
    // Degraded
    newStatus = 'degraded';
  }

  // If in half-open and failure, go back to open
  if (current.circuitState === 'half_open') {
    newCircuitState = 'open';
    newStatus = 'down';
    circuitOpenedAt = new Date();
  }

  const record = await prisma.externalServiceHealth.update({
    where: { id: serviceId },
    data: {
      lastHealthCheck: new Date(),
      lastFailure: new Date(),
      lastFailureReason: reason,
      consecutiveFailures: newFailureCount,
      consecutiveSuccesses: 0,
      status: newStatus,
      circuitState: newCircuitState,
      circuitOpenedAt,
    },
  });

  return toServiceHealth(record);
}

/**
 * Manually reset a circuit breaker (admin action)
 */
export async function resetCircuit(serviceId: ExternalServiceId): Promise<ServiceHealth> {
  const record = await prisma.externalServiceHealth.update({
    where: { id: serviceId },
    data: {
      status: 'healthy',
      circuitState: 'closed',
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      circuitOpenedAt: null,
      circuitHalfOpenAt: null,
      lastHealthCheck: new Date(),
    },
  });

  return toServiceHealth(record);
}

// =============================================================================
// CIRCUIT BREAKER WRAPPER
// =============================================================================

/**
 * Execute a function with circuit breaker protection
 *
 * @param serviceId - The external service being called
 * @param fn - The async function to execute
 * @param options - Optional configuration
 * @returns The result of the function
 * @throws CircuitOpenError if circuit is open
 *
 * @example
 * ```typescript
 * const users = await withCircuitBreaker('clever', async () => {
 *   return await cleverApi.getUsers();
 * });
 * ```
 */
export async function withCircuitBreaker<T>(
  serviceId: ExternalServiceId,
  fn: () => Promise<T>,
  options?: {
    fallback?: () => Promise<T>;
    timeout?: number;
  }
): Promise<T> {
  // Get current health
  let health = await getServiceHealth(serviceId);

  if (!health) {
    health = await initializeService(serviceId);
  }

  // Check if circuit is open
  if (health.circuitState === 'open') {
    const config = DEFAULT_CONFIGS[serviceId] || DEFAULT_CONFIGS.clever;
    const reopensAt = new Date(health.circuitOpenedAt!.getTime() + config.openDurationMs);

    if (new Date() < reopensAt) {
      // Circuit is still open
      if (options?.fallback) {
        return options.fallback();
      }
      throw new CircuitOpenError(serviceId, health.circuitOpenedAt!, reopensAt);
    }

    // Transition to half-open handled by getServiceHealth
    health = await getServiceHealth(serviceId);
  }

  // Execute the function
  try {
    const result = await (options?.timeout
      ? withTimeout(fn(), options.timeout)
      : fn());

    await recordSuccess(serviceId);
    return result;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown error';
    await recordFailure(serviceId, reason);

    if (options?.fallback) {
      return options.fallback();
    }
    throw error;
  }
}

/**
 * Check if a service is available (not in open circuit)
 */
export async function isServiceAvailable(serviceId: ExternalServiceId): Promise<boolean> {
  const health = await getServiceHealth(serviceId);

  if (!health) return true; // Unknown service assumed available

  if (health.circuitState === 'open') {
    const config = DEFAULT_CONFIGS[serviceId] || DEFAULT_CONFIGS.clever;
    const reopensAt = new Date(health.circuitOpenedAt!.getTime() + config.openDurationMs);
    return new Date() >= reopensAt;
  }

  return true;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Wrap a promise with a timeout
 */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });

  return Promise.race([promise, timeout]);
}

/**
 * Convert database record to ServiceHealth type
 */
function toServiceHealth(record: {
  id: string;
  status: string;
  circuitState: string;
  lastHealthCheck: Date;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailure: Date | null;
  lastFailureReason: string | null;
  lastSuccess: Date | null;
  circuitOpenedAt: Date | null;
}): ServiceHealth {
  return {
    id: record.id as ExternalServiceId,
    status: record.status as ServiceStatus,
    circuitState: record.circuitState as CircuitState,
    lastHealthCheck: record.lastHealthCheck,
    consecutiveFailures: record.consecutiveFailures,
    consecutiveSuccesses: record.consecutiveSuccesses,
    lastFailure: record.lastFailure ?? undefined,
    lastFailureReason: record.lastFailureReason ?? undefined,
    lastSuccess: record.lastSuccess ?? undefined,
    circuitOpenedAt: record.circuitOpenedAt ?? undefined,
  };
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize all known services
 *
 * Call this on app startup to ensure all service records exist
 */
export async function initializeAllServices(): Promise<void> {
  const serviceIds: ExternalServiceId[] = [
    'clever',
    'classlink',
    'lausd_sis',
    'schoology',
    'google_sso',
    'microsoft_sso',
    'vonage',
    'twilio',
  ];

  await Promise.all(serviceIds.map((id) => initializeService(id)));
}

/**
 * Get summary statistics for all services
 */
export async function getServicesSummary(): Promise<{
  total: number;
  healthy: number;
  degraded: number;
  down: number;
  circuitsOpen: number;
}> {
  const services = await getAllServiceHealth();

  return {
    total: services.length,
    healthy: services.filter((s) => s.status === 'healthy').length,
    degraded: services.filter((s) => s.status === 'degraded').length,
    down: services.filter((s) => s.status === 'down').length,
    circuitsOpen: services.filter((s) => s.circuitState === 'open').length,
  };
}
