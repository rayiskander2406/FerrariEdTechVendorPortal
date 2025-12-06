/**
 * Auth Endpoint Contract Schemas
 *
 * TEST-03: Defines the API contract for authentication endpoints.
 */

import { z } from 'zod';

// =============================================================================
// COMMON
// =============================================================================

/**
 * Access tier enum
 */
export const AccessTierSchema = z.enum(['PRIVACY_SAFE', 'SELECTIVE', 'FULL_ACCESS']);

/**
 * API key scope enum
 */
export const ApiKeyScopeSchema = z.enum([
  'read',
  'write',
  'admin',
  'audit',
  'messaging',
]);

// =============================================================================
// GET /api/vendors/me
// =============================================================================

/**
 * Vendor info in response
 */
export const VendorInfoSchema = z.object({
  id: z.string().min(1), // Can be UUID or custom ID
  name: z.string().min(1),
  contactEmail: z.string().email(),
  contactName: z.string().nullable(),
  website: z.string().nullable(),
  defaultAccessTier: AccessTierSchema,
  podsStatus: z.string(),
  createdAt: z.string().datetime(),
});

/**
 * GET /api/vendors/me - 200 OK Response
 */
export const VendorMeResponseSchema = z.object({
  vendor: VendorInfoSchema,
  scopes: z.array(z.string()),
  requestId: z.string().min(1),
});

export type VendorMeResponse = z.infer<typeof VendorMeResponseSchema>;

// =============================================================================
// GET /api/auth/keys
// =============================================================================

/**
 * API key item in list response
 */
export const ApiKeyItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  keyPrefix: z.string(),
  scopes: z.array(z.string()),
  createdAt: z.string().datetime(),
  lastUsedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  revokedAt: z.string().datetime().nullable(),
});

/**
 * GET /api/auth/keys - 200 OK Response
 */
export const ApiKeysListResponseSchema = z.object({
  keys: z.array(ApiKeyItemSchema),
  requestId: z.string(),
});

export type ApiKeysListResponse = z.infer<typeof ApiKeysListResponseSchema>;

// =============================================================================
// POST /api/auth/keys
// =============================================================================

/**
 * POST /api/auth/keys - Request Body
 */
export const CreateApiKeyRequestSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(ApiKeyScopeSchema).min(1),
  expiresInDays: z.number().int().positive().optional(),
});

/**
 * POST /api/auth/keys - 201 Created Response
 */
export const CreateApiKeyResponseSchema = z.object({
  id: z.string().uuid(),
  key: z.string().regex(/^sd_[a-z]+_[A-Za-z0-9_-]+$/),
  name: z.string(),
  scopes: z.array(z.string()),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
  requestId: z.string(),
});

export type CreateApiKeyResponse = z.infer<typeof CreateApiKeyResponseSchema>;
