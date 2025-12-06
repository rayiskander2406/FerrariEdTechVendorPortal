/**
 * Error Response Contract Schemas
 *
 * TEST-03: Defines the API contract for error responses.
 */

import { z } from 'zod';

// =============================================================================
// STANDARD ERROR RESPONSES
// =============================================================================

/**
 * Standard error response (400, 500, etc.)
 */
export const ErrorResponseSchema = z.object({
  error: z.string().min(1),
  requestId: z.string().optional(),
  details: z.array(z.unknown()).optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// =============================================================================
// AUTH ERROR RESPONSES
// =============================================================================

/**
 * 401 Unauthorized response
 */
export const UnauthorizedResponseSchema = z.object({
  error: z.string(),
});

export type UnauthorizedResponse = z.infer<typeof UnauthorizedResponseSchema>;

/**
 * 403 Forbidden response
 */
export const ForbiddenResponseSchema = z.object({
  error: z.string(),
});

export type ForbiddenResponse = z.infer<typeof ForbiddenResponseSchema>;

// =============================================================================
// RATE LIMIT ERROR
// =============================================================================

/**
 * 429 Rate Limit Exceeded response
 */
export const RateLimitResponseSchema = z.object({
  error: z.literal('Rate limit exceeded'),
  retryAfter: z.number().int().positive(),
  requestId: z.string(),
});

export type RateLimitResponse = z.infer<typeof RateLimitResponseSchema>;

// =============================================================================
// VALIDATION ERROR
// =============================================================================

/**
 * Zod validation issue
 */
export const ValidationIssueSchema = z.object({
  code: z.string(),
  message: z.string(),
  path: z.array(z.union([z.string(), z.number()])),
});

/**
 * 400 Validation Error response
 */
export const ValidationErrorResponseSchema = z.object({
  error: z.string(),
  details: z.array(ValidationIssueSchema).optional(),
  requestId: z.string().optional(),
});

export type ValidationErrorResponse = z.infer<typeof ValidationErrorResponseSchema>;
