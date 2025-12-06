/**
 * Pino Logger
 *
 * V1-07: Structured JSON logging with PII redaction.
 *
 * ## Features
 *
 * - Structured JSON logging
 * - Request context propagation
 * - PII redaction
 * - Log levels (debug, info, warn, error)
 * - Child loggers for request scoping
 *
 * @module lib/observability/logger
 */

import pino from 'pino';

// =============================================================================
// TYPES
// =============================================================================

export interface LogContext {
  requestId?: string;
  vendorId?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

export interface RequestLogData {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface ResponseLogData {
  requestId: string;
  statusCode: number;
  durationMs: number;
  path: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

// PII patterns for redaction
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?1?[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
};

// =============================================================================
// LOGGER INSTANCE
// =============================================================================

/**
 * Base Pino logger instance
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'vendor-portal',
    env: process.env.NODE_ENV || 'development',
  },
});

// =============================================================================
// CHILD LOGGER FACTORY
// =============================================================================

/**
 * Create a child logger with request context
 *
 * @param context - Request context to attach
 * @returns Child logger with context
 */
export function createRequestLogger(context: LogContext): pino.Logger {
  return logger.child(context);
}

// =============================================================================
// REQUEST/RESPONSE LOGGING
// =============================================================================

/**
 * Log incoming request
 *
 * @param req - Request-like object
 */
export function logRequest(req: RequestLogData): void {
  const requestId = req.headers['x-request-id'] as string | undefined;

  logger.info(
    {
      method: req.method,
      url: req.url,
      requestId,
    },
    'Incoming request'
  );
}

/**
 * Log response
 *
 * @param data - Response data
 */
export function logResponse(data: ResponseLogData): void {
  const logData = {
    requestId: data.requestId,
    statusCode: data.statusCode,
    durationMs: data.durationMs,
    path: data.path,
  };

  if (data.statusCode >= 500) {
    logger.warn(logData, 'Response sent with server error');
  } else {
    logger.info(logData, 'Response sent');
  }
}

// =============================================================================
// ERROR LOGGING
// =============================================================================

/**
 * Log error with context
 *
 * @param error - Error to log
 * @param context - Additional context
 */
export function logError(
  error: Error | unknown,
  context: Record<string, unknown> = {}
): void {
  const errorObj =
    error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : { message: String(error) };

  logger.error(
    {
      err: errorObj,
      ...context,
    },
    'Error occurred'
  );
}

// =============================================================================
// PII REDACTION
// =============================================================================

/**
 * Redact PII from data
 *
 * @param data - Data to redact
 * @returns Data with PII redacted
 */
export function redactPII<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    let result = data;
    result = result.replace(PII_PATTERNS.email, '[REDACTED_EMAIL]');
    result = result.replace(PII_PATTERNS.phone, '[REDACTED_PHONE]');
    result = result.replace(PII_PATTERNS.ssn, '[REDACTED_SSN]');
    return result as T;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactPII(item)) as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    result[key] = redactPII(value);
  }
  return result as T;
}
