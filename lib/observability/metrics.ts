/**
 * Prometheus Metrics
 *
 * V1-07: Application metrics for monitoring and alerting.
 *
 * ## Metrics
 *
 * - HTTP request counts and durations
 * - Message queue metrics
 * - External service call metrics
 * - Circuit breaker state
 *
 * @module lib/observability/metrics
 */

import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  register,
  collectDefaultMetrics,
} from 'prom-client';

// =============================================================================
// TYPES
// =============================================================================

export interface MetricsConfig {
  defaultLabels?: Record<string, string>;
  prefix?: string;
}

export interface HttpRequestData {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  errorType?: string;
}

export interface ExternalServiceCallData {
  service: string;
  operation: string;
  durationMs: number;
  success: boolean;
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize metrics collection
 *
 * @param config - Metrics configuration
 */
export function initMetrics(config: MetricsConfig = {}): void {
  if (config.defaultLabels) {
    register.setDefaultLabels(config.defaultLabels);
  }

  collectDefaultMetrics({
    prefix: config.prefix || '',
  });
}

/**
 * Get metrics in Prometheus format
 */
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

/**
 * Get content type for metrics response
 */
export function getContentType(): string {
  return register.contentType;
}

// =============================================================================
// HTTP REQUEST METRICS
// =============================================================================

/**
 * Total HTTP requests
 */
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

/**
 * HTTP request errors
 */
export const httpRequestErrorsTotal = new Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'path', 'error_type'],
});

/**
 * HTTP request duration histogram
 */
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

// =============================================================================
// MESSAGE METRICS
// =============================================================================

/**
 * Messages enqueued
 */
export const messagesEnqueuedTotal = new Counter({
  name: 'messages_enqueued_total',
  help: 'Total messages enqueued',
  labelNames: ['channel', 'priority'],
});

/**
 * Messages sent successfully
 */
export const messagesSentTotal = new Counter({
  name: 'messages_sent_total',
  help: 'Total messages sent successfully',
  labelNames: ['channel', 'provider'],
});

/**
 * Messages failed
 */
export const messagesFailedTotal = new Counter({
  name: 'messages_failed_total',
  help: 'Total messages failed',
  labelNames: ['channel', 'reason'],
});

/**
 * Message processing duration
 */
export const messageProcessingDuration = new Histogram({
  name: 'message_processing_duration_seconds',
  help: 'Message processing duration in seconds',
  labelNames: ['channel'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

// =============================================================================
// GAUGE METRICS
// =============================================================================

/**
 * Active connections
 */
export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

/**
 * Queue size by priority
 */
export const queueSize = new Gauge({
  name: 'queue_size',
  help: 'Current queue size',
  labelNames: ['priority'],
});

/**
 * Circuit breaker state
 * 0 = closed, 0.5 = half-open, 1 = open
 */
export const circuitBreakerState = new Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 0.5=half-open, 1=open)',
  labelNames: ['service'],
});

// =============================================================================
// EXTERNAL SERVICE METRICS
// =============================================================================

/**
 * External service call duration
 */
export const externalServiceDuration = new Histogram({
  name: 'external_service_duration_seconds',
  help: 'External service call duration in seconds',
  labelNames: ['service', 'operation', 'success'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Record an HTTP request
 *
 * @param data - Request data
 */
export function recordHttpRequest(data: HttpRequestData): void {
  const labels = {
    method: data.method,
    path: data.path,
    status: String(data.statusCode),
  };

  httpRequestsTotal.labels(labels).inc();
  httpRequestDuration.labels(labels).observe(data.durationMs / 1000);

  if (data.statusCode >= 500 && data.errorType) {
    httpRequestErrorsTotal
      .labels({
        method: data.method,
        path: data.path,
        error_type: data.errorType,
      })
      .inc();
  }
}

/**
 * Record a message enqueued
 *
 * @param channel - Message channel
 * @param priority - Message priority
 * @param count - Number of messages (default 1)
 */
export function recordMessageEnqueued(
  channel: string,
  priority: string,
  count = 1
): void {
  messagesEnqueuedTotal.labels({ channel, priority }).inc(count);
}

/**
 * Record a message sent
 *
 * @param channel - Message channel
 * @param provider - Provider used
 * @param durationMs - Processing duration in ms
 */
export function recordMessageSent(
  channel: string,
  provider: string,
  durationMs: number
): void {
  messagesSentTotal.labels({ channel, provider }).inc();
  messageProcessingDuration.labels({ channel }).observe(durationMs / 1000);
}

/**
 * Record a failed message
 *
 * @param channel - Message channel
 * @param reason - Failure reason
 */
export function recordMessageFailed(channel: string, reason: string): void {
  messagesFailedTotal.labels({ channel, reason }).inc();
}

/**
 * Record an external service call
 *
 * @param data - Service call data
 */
export function recordExternalServiceCall(data: ExternalServiceCallData): void {
  externalServiceDuration
    .labels({
      service: data.service,
      operation: data.operation,
      success: String(data.success),
    })
    .observe(data.durationMs / 1000);
}

/**
 * Set queue size
 *
 * @param priority - Queue priority
 * @param size - Current size
 */
export function setQueueSize(priority: string, size: number): void {
  queueSize.labels({ priority }).set(size);
}

/**
 * Set circuit breaker state
 *
 * @param service - Service name
 * @param state - Circuit breaker state
 */
export function setCircuitBreakerState(
  service: string,
  state: 'closed' | 'half-open' | 'open'
): void {
  const stateValue = state === 'closed' ? 0 : state === 'open' ? 1 : 0.5;
  circuitBreakerState.labels({ service }).set(stateValue);
}
