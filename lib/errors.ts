/**
 * Custom Error Classes for SchoolDay Vendor Portal
 *
 * Provides structured error handling with error codes and HTTP status codes.
 */

// =============================================================================
// ERROR CODES
// =============================================================================

export const ErrorCodes = {
  // Validation errors (400)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_FIELD: "MISSING_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",

  // Authentication errors (401)
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_API_KEY: "INVALID_API_KEY",
  EXPIRED_TOKEN: "EXPIRED_TOKEN",

  // Authorization errors (403)
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  ACCESS_DENIED: "ACCESS_DENIED",

  // Not found errors (404)
  NOT_FOUND: "NOT_FOUND",
  VENDOR_NOT_FOUND: "VENDOR_NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",

  // Conflict errors (409)
  CONFLICT: "CONFLICT",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  ALREADY_EXISTS: "ALREADY_EXISTS",

  // Rate limiting (429)
  RATE_LIMITED: "RATE_LIMITED",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",

  // Server errors (500)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  AI_SERVICE_ERROR: "AI_SERVICE_ERROR",

  // Network errors (client-side)
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  CONNECTION_FAILED: "CONNECTION_FAILED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// =============================================================================
// BASE APP ERROR
// =============================================================================

/**
 * Base application error class with code and status
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: ErrorCode = ErrorCodes.INTERNAL_ERROR,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert to JSON-serializable object
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
    };
  }

  /**
   * Create a user-friendly error message
   */
  toUserMessage(): string {
    return this.message;
  }
}

// =============================================================================
// VALIDATION ERROR
// =============================================================================

/**
 * Error for validation failures (400)
 */
export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly value?: unknown;

  constructor(
    message: string,
    field?: string,
    value?: unknown,
    details?: Record<string, unknown>
  ) {
    super(
      message,
      field ? ErrorCodes.INVALID_INPUT : ErrorCodes.VALIDATION_ERROR,
      400,
      { ...details, field, value }
    );
    this.name = "ValidationError";
    this.field = field;
    this.value = value;
  }

  toUserMessage(): string {
    if (this.field) {
      return `Invalid ${this.field}: ${this.message}`;
    }
    return this.message;
  }
}

// =============================================================================
// API ERROR
// =============================================================================

/**
 * Error for API-related failures
 */
export class ApiError extends AppError {
  public readonly endpoint?: string;
  public readonly method?: string;

  constructor(
    message: string,
    code: ErrorCode = ErrorCodes.INTERNAL_ERROR,
    statusCode: number = 500,
    endpoint?: string,
    method?: string,
    details?: Record<string, unknown>
  ) {
    super(message, code, statusCode, { ...details, endpoint, method });
    this.name = "ApiError";
    this.endpoint = endpoint;
    this.method = method;
  }

  /**
   * Create from HTTP response
   */
  static fromResponse(
    response: Response,
    body?: { error?: string; message?: string; code?: string }
  ): ApiError {
    const message =
      body?.error || body?.message || `HTTP ${response.status}: ${response.statusText}`;
    const code = (body?.code as ErrorCode) || getErrorCodeFromStatus(response.status);

    return new ApiError(
      message,
      code,
      response.status,
      response.url,
      undefined,
      { responseStatus: response.status, responseStatusText: response.statusText }
    );
  }

  toUserMessage(): string {
    switch (this.statusCode) {
      case 400:
        return "Invalid request. Please check your input and try again.";
      case 401:
        return "Authentication required. Please sign in.";
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
      case 502:
      case 503:
        return "Server error. Please try again later.";
      default:
        return this.message;
    }
  }
}

// =============================================================================
// NETWORK ERROR
// =============================================================================

/**
 * Error for network-related failures (client-side)
 */
export class NetworkError extends AppError {
  public readonly isTimeout: boolean;
  public readonly isOffline: boolean;

  constructor(
    message: string,
    options: {
      isTimeout?: boolean;
      isOffline?: boolean;
      details?: Record<string, unknown>;
    } = {}
  ) {
    const code = options.isTimeout
      ? ErrorCodes.TIMEOUT
      : options.isOffline
        ? ErrorCodes.CONNECTION_FAILED
        : ErrorCodes.NETWORK_ERROR;

    super(message, code, 0, options.details);
    this.name = "NetworkError";
    this.isTimeout = options.isTimeout ?? false;
    this.isOffline = options.isOffline ?? false;
  }

  /**
   * Create timeout error
   */
  static timeout(timeoutMs: number): NetworkError {
    return new NetworkError(
      `Request timed out after ${Math.round(timeoutMs / 1000)} seconds`,
      { isTimeout: true, details: { timeoutMs } }
    );
  }

  /**
   * Create offline error
   */
  static offline(): NetworkError {
    return new NetworkError("No internet connection. Please check your network.", {
      isOffline: true,
    });
  }

  /**
   * Create from fetch error
   */
  static fromFetchError(error: Error): NetworkError {
    if (error.name === "AbortError") {
      return new NetworkError("Request was cancelled", { details: { aborted: true } });
    }

    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      return new NetworkError("Connection error. Please check your network and try again.", {
        isOffline: typeof navigator !== "undefined" && !navigator.onLine,
      });
    }

    return new NetworkError(error.message);
  }

  toUserMessage(): string {
    if (this.isTimeout) {
      return "Request timed out. Please try again.";
    }
    if (this.isOffline) {
      return "No internet connection. Please check your network.";
    }
    return "Connection error. Please try again.";
  }
}

// =============================================================================
// AI SERVICE ERROR
// =============================================================================

/**
 * Error for AI service failures (Claude API)
 */
export class AIServiceError extends AppError {
  public readonly provider: string;
  public readonly isRateLimited: boolean;
  public readonly retryAfter?: number;

  constructor(
    message: string,
    options: {
      provider?: string;
      isRateLimited?: boolean;
      retryAfter?: number;
      statusCode?: number;
      details?: Record<string, unknown>;
    } = {}
  ) {
    const code = options.isRateLimited ? ErrorCodes.RATE_LIMITED : ErrorCodes.AI_SERVICE_ERROR;
    super(message, code, options.statusCode ?? 500, options.details);
    this.name = "AIServiceError";
    this.provider = options.provider ?? "anthropic";
    this.isRateLimited = options.isRateLimited ?? false;
    this.retryAfter = options.retryAfter;
  }

  toUserMessage(): string {
    if (this.isRateLimited) {
      return "AI service is busy. Please wait a moment and try again.";
    }
    return "AI service is temporarily unavailable. Please try again later.";
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get error code from HTTP status
 */
function getErrorCodeFromStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCodes.VALIDATION_ERROR;
    case 401:
      return ErrorCodes.UNAUTHORIZED;
    case 403:
      return ErrorCodes.FORBIDDEN;
    case 404:
      return ErrorCodes.NOT_FOUND;
    case 409:
      return ErrorCodes.CONFLICT;
    case 429:
      return ErrorCodes.RATE_LIMITED;
    default:
      return ErrorCodes.INTERNAL_ERROR;
  }
}

/**
 * Check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Get user-friendly message from any error
 */
export function getUserErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.toUserMessage();
  }

  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      return "Connection error. Please check your network and try again.";
    }
    if (error.name === "AbortError") {
      return "Request was cancelled.";
    }
    if (error.message.includes("timeout")) {
      return "Request timed out. Please try again.";
    }
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Log error with context
 */
export function logError(
  error: unknown,
  context?: { action?: string; userId?: string; [key: string]: unknown }
): void {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (isAppError(error)) {
    console.error("[AppError]", {
      ...errorInfo,
      error: error.toJSON(),
    });
  } else if (error instanceof Error) {
    console.error("[Error]", {
      ...errorInfo,
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  } else {
    console.error("[Unknown Error]", {
      ...errorInfo,
      error,
    });
  }
}
