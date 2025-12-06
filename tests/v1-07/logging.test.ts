/**
 * Pino Logging Tests
 *
 * V1-07: Unit tests for structured logging.
 *
 * Tests cover:
 * - Logger configuration
 * - Log levels (debug, info, warn, error)
 * - Structured log fields
 * - Request context logging
 * - Child loggers
 * - Log redaction (PII protection)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Use vi.hoisted to create mock functions that are available during vi.mock hoisting
const { mockInfo, mockWarn, mockError, mockDebug, mockChild } = vi.hoisted(() => ({
  mockInfo: vi.fn(),
  mockWarn: vi.fn(),
  mockError: vi.fn(),
  mockDebug: vi.fn(),
  mockChild: vi.fn(),
}));

vi.mock('pino', () => {
  const pinoInstance = {
    info: mockInfo,
    warn: mockWarn,
    error: mockError,
    debug: mockDebug,
    child: mockChild.mockReturnValue({
      info: mockInfo,
      warn: mockWarn,
      error: mockError,
      debug: mockDebug,
    }),
  };

  // Create a function that returns the instance and has stdTimeFunctions attached
  function pino() {
    return pinoInstance;
  }
  pino.stdTimeFunctions = {
    isoTime: () => `,"time":"${new Date().toISOString()}"`,
  };

  return { default: pino };
});

import pino from 'pino';
import {
  logger,
  createRequestLogger,
  logRequest,
  logResponse,
  logError,
  redactPII,
  LOG_LEVELS,
  type LogContext,
} from '@/lib/observability/logger';

describe('Pino Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // LOGGER CONFIGURATION
  // ===========================================================================

  describe('Logger Configuration', () => {
    it('exports a logger instance', () => {
      expect(logger).toBeDefined();
    });

    it('defines log levels', () => {
      expect(LOG_LEVELS).toBeDefined();
      expect(LOG_LEVELS).toContain('debug');
      expect(LOG_LEVELS).toContain('info');
      expect(LOG_LEVELS).toContain('warn');
      expect(LOG_LEVELS).toContain('error');
    });

    it('logger has standard methods', () => {
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('logger has child method', () => {
      expect(typeof logger.child).toBe('function');
    });
  });

  // ===========================================================================
  // BASIC LOGGING
  // ===========================================================================

  describe('Basic Logging', () => {
    it('logs info messages', () => {
      logger.info('Test info message');
      expect(logger.info).toHaveBeenCalledWith('Test info message');
    });

    it('logs warn messages', () => {
      logger.warn('Test warning');
      expect(logger.warn).toHaveBeenCalledWith('Test warning');
    });

    it('logs error messages', () => {
      logger.error('Test error');
      expect(logger.error).toHaveBeenCalledWith('Test error');
    });

    it('logs debug messages', () => {
      logger.debug('Test debug');
      expect(logger.debug).toHaveBeenCalledWith('Test debug');
    });

    it('logs with structured data', () => {
      logger.info({ userId: 'user-123', action: 'login' }, 'User logged in');
      expect(logger.info).toHaveBeenCalledWith(
        { userId: 'user-123', action: 'login' },
        'User logged in'
      );
    });
  });

  // ===========================================================================
  // REQUEST LOGGER
  // ===========================================================================

  describe('createRequestLogger', () => {
    it('creates a child logger with request context', () => {
      const context: LogContext = {
        requestId: 'req-123',
        vendorId: 'vendor-456',
        path: '/api/test',
        method: 'GET',
      };

      const requestLogger = createRequestLogger(context);

      expect(logger.child).toHaveBeenCalledWith(context);
      expect(requestLogger).toBeDefined();
    });

    it('child logger inherits parent methods', () => {
      const context: LogContext = {
        requestId: 'req-123',
        path: '/api/test',
        method: 'POST',
      };

      const requestLogger = createRequestLogger(context);

      expect(typeof requestLogger.info).toBe('function');
      expect(typeof requestLogger.error).toBe('function');
    });
  });

  // ===========================================================================
  // REQUEST/RESPONSE LOGGING
  // ===========================================================================

  describe('logRequest', () => {
    it('logs incoming request details', () => {
      const req = {
        method: 'POST',
        url: '/api/messages',
        headers: {
          'content-type': 'application/json',
          'x-request-id': 'req-123',
        },
      };

      logRequest(req as any);

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/api/messages',
          requestId: 'req-123',
        }),
        expect.stringContaining('Incoming request')
      );
    });

    it('handles missing request ID', () => {
      const req = {
        method: 'GET',
        url: '/api/health',
        headers: {},
      };

      logRequest(req as any);

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/api/health',
        }),
        expect.any(String)
      );
    });
  });

  describe('logResponse', () => {
    it('logs response with status and duration', () => {
      logResponse({
        requestId: 'req-123',
        statusCode: 200,
        durationMs: 45,
        path: '/api/test',
      });

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'req-123',
          statusCode: 200,
          durationMs: 45,
        }),
        expect.stringContaining('Response')
      );
    });

    it('logs error responses at warn level', () => {
      logResponse({
        requestId: 'req-123',
        statusCode: 500,
        durationMs: 100,
        path: '/api/test',
      });

      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
        }),
        expect.any(String)
      );
    });

    it('logs client errors at info level', () => {
      logResponse({
        requestId: 'req-123',
        statusCode: 400,
        durationMs: 20,
        path: '/api/test',
      });

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
        }),
        expect.any(String)
      );
    });
  });

  // ===========================================================================
  // ERROR LOGGING
  // ===========================================================================

  describe('logError', () => {
    it('logs error with stack trace', () => {
      const error = new Error('Test error');

      logError(error, { requestId: 'req-123' });

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.objectContaining({
            message: 'Test error',
            stack: expect.any(String),
          }),
          requestId: 'req-123',
        }),
        expect.stringContaining('Error')
      );
    });

    it('logs error with custom context', () => {
      const error = new Error('Database error');

      logError(error, {
        requestId: 'req-456',
        operation: 'createUser',
        vendorId: 'vendor-789',
      });

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'createUser',
          vendorId: 'vendor-789',
        }),
        expect.any(String)
      );
    });

    it('handles non-Error objects', () => {
      const errorObj = { code: 'UNKNOWN', message: 'Something went wrong' };

      logError(errorObj as any, { requestId: 'req-123' });

      expect(logger.error).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // PII REDACTION
  // ===========================================================================

  describe('redactPII', () => {
    it('redacts email addresses', () => {
      const data = {
        user: 'john@example.com',
        message: 'Contact john@example.com for help',
      };

      const redacted = redactPII(data);

      expect(redacted.user).toBe('[REDACTED_EMAIL]');
      expect(redacted.message).toBe('Contact [REDACTED_EMAIL] for help');
    });

    it('redacts phone numbers', () => {
      const data = {
        phone: '555-123-4567',
        contact: 'Call (555) 123-4567',
      };

      const redacted = redactPII(data);

      expect(redacted.phone).toBe('[REDACTED_PHONE]');
      expect(redacted.contact).toContain('[REDACTED_PHONE]');
    });

    it('redacts SSN patterns', () => {
      const data = {
        ssn: '123-45-6789',
      };

      const redacted = redactPII(data);

      expect(redacted.ssn).toBe('[REDACTED_SSN]');
    });

    it('preserves non-PII fields', () => {
      const data = {
        id: 'user-123',
        status: 'active',
        count: 42,
      };

      const redacted = redactPII(data);

      expect(redacted.id).toBe('user-123');
      expect(redacted.status).toBe('active');
      expect(redacted.count).toBe(42);
    });

    it('handles nested objects', () => {
      const data = {
        user: {
          email: 'test@test.com',
          name: 'John',
        },
      };

      const redacted = redactPII(data);

      expect(redacted.user.email).toBe('[REDACTED_EMAIL]');
      expect(redacted.user.name).toBe('John');
    });

    it('handles arrays', () => {
      const data = {
        emails: ['a@b.com', 'c@d.com'],
      };

      const redacted = redactPII(data);

      expect(redacted.emails[0]).toBe('[REDACTED_EMAIL]');
      expect(redacted.emails[1]).toBe('[REDACTED_EMAIL]');
    });

    it('returns primitive values unchanged', () => {
      expect(redactPII('simple string')).toBe('simple string');
      expect(redactPII(42)).toBe(42);
      expect(redactPII(null)).toBe(null);
    });
  });
});
