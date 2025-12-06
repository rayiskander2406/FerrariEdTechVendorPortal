/**
 * Observability Module
 *
 * V1-07: Logging, error tracking, and metrics for production monitoring.
 *
 * ## Features
 *
 * - Pino structured logging with PII redaction
 * - Sentry error tracking with context
 * - Prometheus metrics for monitoring
 *
 * @module lib/observability
 */

// Logger exports
export {
  logger,
  createRequestLogger,
  logRequest,
  logResponse,
  logError,
  redactPII,
  LOG_LEVELS,
  type LogContext,
  type LogLevel,
  type RequestLogData,
  type ResponseLogData,
} from './logger';

// Error tracking exports
export {
  initErrorTracking,
  isErrorTrackingEnabled,
  captureError,
  captureWarning,
  setErrorContext,
  setVendorContext,
  addErrorBreadcrumb,
  startPerformanceTransaction,
  withErrorTracking,
  type ErrorTrackingConfig,
  type VendorContext,
  type Breadcrumb,
  type TransactionConfig,
} from './errors';

// Metrics exports
export {
  initMetrics,
  getMetrics,
  getContentType,
  // Counters
  httpRequestsTotal,
  httpRequestErrorsTotal,
  messagesEnqueuedTotal,
  messagesSentTotal,
  messagesFailedTotal,
  // Gauges
  activeConnections,
  queueSize,
  circuitBreakerState,
  // Histograms
  httpRequestDuration,
  messageProcessingDuration,
  externalServiceDuration,
  // Helper functions
  recordHttpRequest,
  recordMessageEnqueued,
  recordMessageSent,
  recordMessageFailed,
  recordExternalServiceCall,
  setQueueSize,
  setCircuitBreakerState,
  type MetricsConfig,
  type HttpRequestData,
  type ExternalServiceCallData,
} from './metrics';
