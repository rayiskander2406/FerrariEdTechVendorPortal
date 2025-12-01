/**
 * Security Module - Production-ready security utilities
 *
 * This module provides:
 * 1. XSS Input Sanitization - Prevents cross-site scripting attacks
 * 2. Rate Limiting - Prevents abuse and DoS attacks
 * 3. Payload Validation - Prevents oversized request attacks
 *
 * IMPORTANT: The sandbox API accepts any sbox_test_* key by design for demo purposes.
 * For production deployment, implement proper API key validation against a database.
 *
 * @see docs/SECURITY.md for production deployment guidelines
 */

import { NextRequest, NextResponse } from "next/server";

// =============================================================================
// TYPES
// =============================================================================

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional identifier for the rate limit (e.g., "chat", "vendors") */
  identifier?: string;
}

export interface PayloadConfig {
  /** Maximum payload size in bytes */
  maxSizeBytes: number;
  /** Maximum string field length */
  maxStringLength: number;
  /** Maximum array length */
  maxArrayLength: number;
  /** Maximum object nesting depth */
  maxDepth: number;
}

export interface SanitizeOptions {
  /** Allow basic formatting tags (b, i, em, strong) */
  allowFormatting?: boolean;
  /** Maximum length after sanitization */
  maxLength?: number;
  /** Trim whitespace */
  trim?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export interface SecurityCheckResult {
  valid: boolean;
  error?: string;
  statusCode?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default rate limit: 60 requests per minute */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60 * 1000,
};

/** Stricter rate limit for expensive operations like AI chat */
export const CHAT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60 * 1000,
  identifier: "chat",
};

/** Default payload limits */
export const DEFAULT_PAYLOAD_CONFIG: PayloadConfig = {
  maxSizeBytes: 1024 * 1024, // 1MB
  maxStringLength: 10000,
  maxArrayLength: 1000,
  maxDepth: 10,
};

/** Stricter limits for chat messages */
export const CHAT_PAYLOAD_CONFIG: PayloadConfig = {
  maxSizeBytes: 100 * 1024, // 100KB
  maxStringLength: 5000,
  maxArrayLength: 100,
  maxDepth: 5,
};

// HTML entities for XSS prevention
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

// Dangerous patterns to remove
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:/gi,
  /vbscript:/gi,
  /expression\s*\(/gi,
];

// =============================================================================
// XSS SANITIZATION
// =============================================================================

/**
 * Escapes HTML entities to prevent XSS attacks.
 * This is the core sanitization function.
 */
export function escapeHtml(str: string): string {
  if (typeof str !== "string") {
    return "";
  }
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Removes dangerous patterns from input (scripts, event handlers, etc.)
 */
export function removeDangerousPatterns(str: string): string {
  if (typeof str !== "string") {
    return "";
  }
  let result = str;
  for (const pattern of DANGEROUS_PATTERNS) {
    result = result.replace(pattern, "");
  }
  return result;
}

/**
 * Sanitizes user input to prevent XSS attacks.
 * Combines pattern removal with HTML entity escaping.
 */
export function sanitizeString(
  input: string,
  options: SanitizeOptions = {}
): string {
  const { allowFormatting = false, maxLength = 10000, trim = true } = options;

  if (typeof input !== "string") {
    return "";
  }

  let result = input;

  // Trim whitespace if requested
  if (trim) {
    result = result.trim();
  }

  // Remove dangerous patterns first
  result = removeDangerousPatterns(result);

  // Escape HTML entities
  result = escapeHtml(result);

  // If formatting is allowed, unescape safe tags
  if (allowFormatting) {
    const safeTags = ["b", "i", "em", "strong", "u"];
    for (const tag of safeTags) {
      result = result
        .replace(new RegExp(`&lt;${tag}&gt;`, "gi"), `<${tag}>`)
        .replace(new RegExp(`&lt;/${tag}&gt;`, "gi"), `</${tag}>`);
    }
  }

  // Enforce max length
  if (result.length > maxLength) {
    result = result.substring(0, maxLength);
  }

  return result;
}

/**
 * Sanitizes an email address.
 * Returns empty string if invalid format.
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== "string") {
    return "";
  }

  const trimmed = email.trim().toLowerCase();

  // Basic email regex (not exhaustive but catches common XSS vectors)
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

  if (!emailRegex.test(trimmed)) {
    return "";
  }

  // Additional XSS check - emails shouldn't contain these
  if (/<|>|"|'|`/.test(trimmed)) {
    return "";
  }

  return trimmed;
}

/**
 * Sanitizes a URL.
 * Only allows http, https protocols.
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== "string") {
    return "";
  }

  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);

    // Only allow http and https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }

    // Check for XSS in URL components
    if (/<|>|"|'|`|javascript:|data:|vbscript:/i.test(trimmed)) {
      return "";
    }

    return parsed.href;
  } catch {
    return "";
  }
}

/**
 * Recursively sanitizes all string values in an object.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: SanitizeOptions = {}
): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (typeof item === "string") {
        return sanitizeString(item, options);
      }
      if (typeof item === "object" && item !== null) {
        return sanitizeObject(item as Record<string, unknown>, options);
      }
      return item;
    }) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeString(value, options);
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>, options);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

// =============================================================================
// RATE LIMITING
// =============================================================================

// In-memory rate limit store (use Redis in production for distributed systems)
const rateLimitStore = new Map<
  string,
  { count: number; resetAt: number }
>();

// Cleanup old entries periodically
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup(): void {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 1000); // Cleanup every minute
}

/**
 * Extracts a client identifier from a request.
 * Uses IP address or falls back to a header.
 */
export function getClientId(request: NextRequest): string {
  // Try to get real IP from headers (for proxied requests)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fall back to a generic identifier
  return "anonymous";
}

/**
 * Checks rate limit for a client.
 * Returns whether the request is allowed and metadata.
 */
export function checkRateLimit(
  clientId: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): RateLimitResult {
  startCleanup();

  const key = config.identifier
    ? `${clientId}:${config.identifier}`
    : clientId;
  const now = Date.now();

  const existing = rateLimitStore.get(key);

  // If no existing record or window expired, create new
  if (!existing || existing.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(now + config.windowMs),
    };
  }

  // Increment counter
  existing.count++;
  rateLimitStore.set(key, existing);

  const remaining = Math.max(0, config.maxRequests - existing.count);
  const allowed = existing.count <= config.maxRequests;

  return {
    allowed,
    remaining,
    resetAt: new Date(existing.resetAt),
    retryAfter: allowed ? undefined : Math.ceil((existing.resetAt - now) / 1000),
  };
}

/**
 * Resets rate limit for a client (useful for testing).
 */
export function resetRateLimit(
  clientId: string,
  identifier?: string
): void {
  const key = identifier ? `${clientId}:${identifier}` : clientId;
  rateLimitStore.delete(key);
}

/**
 * Clears all rate limits (useful for testing).
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Creates rate limit headers for a response.
 */
export function createRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers();
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", result.resetAt.toISOString());
  if (result.retryAfter !== undefined) {
    headers.set("Retry-After", result.retryAfter.toString());
  }
  return headers;
}

// =============================================================================
// PAYLOAD VALIDATION
// =============================================================================

/**
 * Calculates the approximate size of a JSON payload in bytes.
 */
export function calculatePayloadSize(data: unknown): number {
  return new TextEncoder().encode(JSON.stringify(data)).length;
}

/**
 * Gets the maximum depth of an object.
 */
export function getObjectDepth(obj: unknown, currentDepth = 0): number {
  if (obj === null || typeof obj !== "object") {
    return currentDepth;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return currentDepth + 1;
    return Math.max(...obj.map((item) => getObjectDepth(item, currentDepth + 1)));
  }

  const values = Object.values(obj);
  if (values.length === 0) return currentDepth + 1;
  return Math.max(
    ...values.map((value) => getObjectDepth(value, currentDepth + 1))
  );
}

/**
 * Validates payload size and structure.
 */
export function validatePayload(
  data: unknown,
  config: PayloadConfig = DEFAULT_PAYLOAD_CONFIG
): SecurityCheckResult {
  // Check total size
  const size = calculatePayloadSize(data);
  if (size > config.maxSizeBytes) {
    return {
      valid: false,
      error: `Payload too large: ${size} bytes (max: ${config.maxSizeBytes})`,
      statusCode: 413,
    };
  }

  // Check depth
  const depth = getObjectDepth(data);
  if (depth > config.maxDepth) {
    return {
      valid: false,
      error: `Payload too deeply nested: depth ${depth} (max: ${config.maxDepth})`,
      statusCode: 400,
    };
  }

  // Recursively check strings and arrays
  const checkResult = validatePayloadRecursive(data, config);
  if (!checkResult.valid) {
    return checkResult;
  }

  return { valid: true };
}

function validatePayloadRecursive(
  data: unknown,
  config: PayloadConfig
): SecurityCheckResult {
  if (typeof data === "string") {
    if (data.length > config.maxStringLength) {
      return {
        valid: false,
        error: `String too long: ${data.length} chars (max: ${config.maxStringLength})`,
        statusCode: 400,
      };
    }
    return { valid: true };
  }

  if (Array.isArray(data)) {
    if (data.length > config.maxArrayLength) {
      return {
        valid: false,
        error: `Array too long: ${data.length} items (max: ${config.maxArrayLength})`,
        statusCode: 400,
      };
    }
    for (const item of data) {
      const result = validatePayloadRecursive(item, config);
      if (!result.valid) return result;
    }
    return { valid: true };
  }

  if (data !== null && typeof data === "object") {
    for (const value of Object.values(data)) {
      const result = validatePayloadRecursive(value, config);
      if (!result.valid) return result;
    }
    return { valid: true };
  }

  return { valid: true };
}

// =============================================================================
// MIDDLEWARE HELPERS
// =============================================================================

/**
 * Creates a rate-limited error response.
 */
export function rateLimitedResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: "Too many requests",
      retryAfter: result.retryAfter,
      resetAt: result.resetAt.toISOString(),
    },
    {
      status: 429,
      headers: createRateLimitHeaders(result),
    }
  );
}

/**
 * Creates a payload validation error response.
 */
export function payloadErrorResponse(result: SecurityCheckResult): NextResponse {
  return NextResponse.json(
    { error: result.error },
    { status: result.statusCode || 400 }
  );
}

/**
 * Combined security check for API routes.
 * Checks rate limit and payload validation.
 */
export async function securityCheck(
  request: NextRequest,
  options: {
    rateLimit?: RateLimitConfig;
    payload?: PayloadConfig;
    skipRateLimit?: boolean;
    skipPayloadValidation?: boolean;
  } = {}
): Promise<{
  passed: boolean;
  response?: NextResponse;
  clientId?: string;
  body?: unknown;
  rateLimitResult?: RateLimitResult;
}> {
  const clientId = getClientId(request);

  // Rate limit check
  if (!options.skipRateLimit) {
    const rateLimitResult = checkRateLimit(
      clientId,
      options.rateLimit || DEFAULT_RATE_LIMIT
    );

    if (!rateLimitResult.allowed) {
      return {
        passed: false,
        response: rateLimitedResponse(rateLimitResult),
        clientId,
        rateLimitResult,
      };
    }
  }

  // Payload validation (for POST/PUT/PATCH requests)
  if (
    !options.skipPayloadValidation &&
    ["POST", "PUT", "PATCH"].includes(request.method)
  ) {
    try {
      const body = await request.json();
      const payloadResult = validatePayload(
        body,
        options.payload || DEFAULT_PAYLOAD_CONFIG
      );

      if (!payloadResult.valid) {
        return {
          passed: false,
          response: payloadErrorResponse(payloadResult),
          clientId,
        };
      }

      // Sanitize the body
      const sanitizedBody =
        typeof body === "object" && body !== null
          ? sanitizeObject(body as Record<string, unknown>)
          : body;

      return {
        passed: true,
        clientId,
        body: sanitizedBody,
      };
    } catch {
      return {
        passed: false,
        response: NextResponse.json(
          { error: "Invalid JSON payload" },
          { status: 400 }
        ),
        clientId,
      };
    }
  }

  return { passed: true, clientId };
}

// =============================================================================
// SANDBOX API KEY DOCUMENTATION
// =============================================================================

/**
 * IMPORTANT: Sandbox API Key Authentication
 *
 * The sandbox API currently accepts ANY key matching the pattern `sbox_test_*`
 * for demo purposes. This allows easy testing without real credential validation.
 *
 * Pattern: /^sbox_test_[a-zA-Z0-9]{24,}$/
 *
 * For PRODUCTION deployment, you MUST:
 *
 * 1. Replace the pattern match with database lookup:
 *    ```typescript
 *    const sandbox = await getSandboxByApiKey(apiKey);
 *    if (!sandbox || sandbox.status !== 'ACTIVE') {
 *      return unauthorized();
 *    }
 *    ```
 *
 * 2. Validate the API secret:
 *    ```typescript
 *    if (sandbox.apiSecret !== apiSecret) {
 *      return unauthorized();
 *    }
 *    ```
 *
 * 3. Check expiration:
 *    ```typescript
 *    if (sandbox.expiresAt < new Date()) {
 *      return unauthorized('Credentials expired');
 *    }
 *    ```
 *
 * 4. Verify endpoint access:
 *    ```typescript
 *    if (!sandbox.allowedEndpoints.includes(endpoint)) {
 *      return forbidden('Endpoint not authorized');
 *    }
 *    ```
 *
 * See docs/SECURITY.md for complete production deployment checklist.
 */
export const SANDBOX_AUTH_PATTERN = /^sbox_test_[a-zA-Z0-9]{24,}$/;

/**
 * Validates a sandbox API key format (demo mode only).
 * For production, replace with database lookup.
 */
export function isValidSandboxKeyFormat(apiKey: string): boolean {
  return SANDBOX_AUTH_PATTERN.test(apiKey);
}
