/**
 * API Key Authentication
 *
 * V1-02: Implements API key generation, hashing, and validation.
 *
 * ## Security Model
 *
 * - Keys are SHA-256 hashed before storage (plaintext never stored)
 * - Key prefix (first 15 chars) stored for identification
 * - Timing-safe comparison to prevent timing attacks
 * - Usage tracking for rate limiting and auditing
 *
 * ## Usage
 *
 * ```typescript
 * import { generateApiKey, validateApiKey } from '@/lib/auth/api-keys';
 *
 * // Generate a new key (returns plaintext key + hash)
 * const { key, prefix, hash } = await generateApiKey();
 * // key: "sd_test_abc123..." (show to user ONCE)
 * // prefix: "sd_test_abc123" (for identification)
 * // hash: "a1b2c3..." (store in database)
 *
 * // Validate a key from request
 * const result = await validateApiKey(key);
 * if (result.valid) {
 *   console.log('Vendor:', result.vendorId);
 *   console.log('Scopes:', result.scopes);
 * }
 * ```
 *
 * @module lib/auth/api-keys
 */

import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/db';
import type { Vendor, ApiKey as PrismaApiKey } from '@prisma/client';

// =============================================================================
// CONSTANTS
// =============================================================================

export const API_KEY_PREFIX = 'sd';
const KEY_LENGTH = 32; // bytes of randomness
const PREFIX_LENGTH = 15;

// Valid scopes
export const VALID_SCOPES = ['read', 'write', 'message', 'audit', 'admin'] as const;
export type ApiKeyScope = (typeof VALID_SCOPES)[number];

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of generating an API key
 */
export interface GeneratedApiKey {
  key: string; // Full key (only shown once)
  prefix: string; // First 15 chars for identification
  hash: string; // SHA-256 hash for storage
}

/**
 * Result of validating an API key
 */
export interface ApiKeyValidation {
  valid: boolean;
  error?: string;
  vendorId?: string;
  vendor?: Vendor;
  scopes?: string[];
  apiKeyId?: string;
}

/**
 * API key info returned by list (no sensitive data)
 */
export interface ApiKeyInfo {
  id: string;
  vendorId: string;
  keyPrefix: string;
  name: string;
  scopes: string[];
  createdAt: Date;
  lastUsedAt: Date | null;
  usageCount: number;
  expiresAt: Date | null;
  revokedAt: Date | null;
}

/**
 * Options for listing API keys
 */
export interface ListApiKeysOptions {
  includeRevoked?: boolean;
}

/**
 * Result of rotating an API key
 */
export interface RotateApiKeyResult {
  newKey: GeneratedApiKey;
  newKeyId: string;
  oldKeyId: string;
}

// =============================================================================
// KEY GENERATION
// =============================================================================

/**
 * Generate a new API key
 *
 * Format: sd_{environment}_{random}
 * - sd: SchoolDay prefix
 * - environment: "test" or "live"
 * - random: 32 bytes base64url encoded
 *
 * @returns Generated key, prefix, and hash
 */
export async function generateApiKey(): Promise<GeneratedApiKey> {
  const environment = process.env.NODE_ENV === 'production' ? 'live' : 'test';
  const randomPart = randomBytes(KEY_LENGTH).toString('base64url');
  const key = `${API_KEY_PREFIX}_${environment}_${randomPart}`;

  return {
    key,
    prefix: key.substring(0, PREFIX_LENGTH),
    hash: hashApiKey(key),
  };
}

/**
 * Hash an API key using SHA-256
 *
 * @param key - The plaintext API key
 * @returns Hex-encoded SHA-256 hash
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// =============================================================================
// KEY VALIDATION
// =============================================================================

/**
 * Validate an API key
 *
 * @param key - The plaintext API key from the request
 * @returns Validation result with vendor info if valid
 */
export async function validateApiKey(key: string): Promise<ApiKeyValidation> {
  // Handle empty or malformed keys
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'Invalid API key' };
  }

  const hash = hashApiKey(key);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    include: { vendor: true },
  });

  if (!apiKey) {
    return { valid: false, error: 'Invalid API key' };
  }

  // Check if revoked
  if (apiKey.revokedAt) {
    return { valid: false, error: 'API key has been revoked' };
  }

  // Check if expired
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  // Update usage stats (non-blocking)
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
      },
    })
    .catch((err) => {
      console.error('[ApiKey] Failed to update usage stats:', err);
    });

  return {
    valid: true,
    vendorId: apiKey.vendorId,
    vendor: apiKey.vendor,
    scopes: apiKey.scopes,
    apiKeyId: apiKey.id,
  };
}

// =============================================================================
// KEY MANAGEMENT
// =============================================================================

/**
 * Create a new API key for a vendor
 *
 * @param vendorId - The vendor ID
 * @param name - Name for the key
 * @param scopes - Permissions for the key
 * @param expiresAt - Optional expiration date
 * @returns The generated key (plaintext shown only once)
 */
export async function createApiKey(
  vendorId: string,
  name: string,
  scopes: ApiKeyScope[],
  expiresAt?: Date
): Promise<{ key: GeneratedApiKey; record: PrismaApiKey }> {
  const generated = await generateApiKey();

  const record = await prisma.apiKey.create({
    data: {
      vendorId,
      keyPrefix: generated.prefix,
      keyHash: generated.hash,
      name,
      scopes,
      expiresAt,
    },
  });

  return { key: generated, record };
}

/**
 * Revoke an API key
 *
 * @param keyId - The API key ID
 * @returns The revoked key record
 */
export async function revokeApiKey(keyId: string): Promise<PrismaApiKey> {
  const existing = await prisma.apiKey.findUnique({
    where: { id: keyId },
  });

  if (!existing) {
    throw new ApiKeyNotFoundError(keyId);
  }

  // Idempotent - if already revoked, just return
  if (existing.revokedAt) {
    return existing;
  }

  return prisma.apiKey.update({
    where: { id: keyId },
    data: { revokedAt: new Date() },
  });
}

/**
 * Rotate an API key (revoke old, create new)
 *
 * @param keyId - The API key ID to rotate
 * @returns The new key and old key info
 */
export async function rotateApiKey(keyId: string): Promise<RotateApiKeyResult> {
  const existing = await prisma.apiKey.findUnique({
    where: { id: keyId },
  });

  if (!existing) {
    throw new ApiKeyNotFoundError(keyId);
  }

  // Generate new key with same settings
  const generated = await generateApiKey();

  const [_revoked, newKey] = await prisma.$transaction([
    // Revoke old key
    prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    }),
    // Create new key
    prisma.apiKey.create({
      data: {
        vendorId: existing.vendorId,
        keyPrefix: generated.prefix,
        keyHash: generated.hash,
        name: `${existing.name} (rotated)`,
        scopes: existing.scopes,
        expiresAt: existing.expiresAt,
      },
    }),
  ]);

  return {
    newKey: generated,
    newKeyId: newKey.id,
    oldKeyId: keyId,
  };
}

/**
 * List API keys for a vendor (without sensitive data)
 *
 * @param vendorId - The vendor ID
 * @param options - List options
 * @returns Array of key info (no hashes)
 */
export async function listApiKeys(
  vendorId: string,
  options: ListApiKeysOptions = {}
): Promise<ApiKeyInfo[]> {
  const { includeRevoked = false } = options;

  const keys = await prisma.apiKey.findMany({
    where: {
      vendorId,
      revokedAt: includeRevoked ? undefined : null,
    },
    select: {
      id: true,
      vendorId: true,
      keyPrefix: true,
      name: true,
      scopes: true,
      createdAt: true,
      lastUsedAt: true,
      usageCount: true,
      expiresAt: true,
      revokedAt: true,
      // Explicitly NOT selecting keyHash
    },
    orderBy: { createdAt: 'desc' },
  });

  return keys;
}

/**
 * Get API key info by prefix
 *
 * @param prefix - The key prefix (first 15 chars)
 * @returns Key info or null
 */
export async function getApiKeyByPrefix(prefix: string): Promise<ApiKeyInfo | null> {
  const key = await prisma.apiKey.findFirst({
    where: { keyPrefix: prefix },
    select: {
      id: true,
      vendorId: true,
      keyPrefix: true,
      name: true,
      scopes: true,
      createdAt: true,
      lastUsedAt: true,
      usageCount: true,
      expiresAt: true,
      revokedAt: true,
    },
  });

  return key;
}

/**
 * Get API key by ID
 *
 * @param keyId - The API key ID
 * @returns Key info or null
 */
export async function getApiKeyById(keyId: string): Promise<ApiKeyInfo | null> {
  const key = await prisma.apiKey.findUnique({
    where: { id: keyId },
    select: {
      id: true,
      vendorId: true,
      keyPrefix: true,
      name: true,
      scopes: true,
      createdAt: true,
      lastUsedAt: true,
      usageCount: true,
      expiresAt: true,
      revokedAt: true,
    },
  });

  return key;
}

// =============================================================================
// SCOPE HELPERS
// =============================================================================

/**
 * Check if scopes include a required scope
 *
 * @param userScopes - Scopes from the API key
 * @param requiredScope - The scope to check for
 * @returns true if the scope is present or admin scope grants access
 */
export function hasScope(userScopes: string[], requiredScope: ApiKeyScope): boolean {
  // Admin scope grants all permissions
  if (userScopes.includes('admin')) {
    return true;
  }

  return userScopes.includes(requiredScope);
}

/**
 * Check if scopes include all required scopes
 *
 * @param userScopes - Scopes from the API key
 * @param requiredScopes - Array of required scopes
 * @returns true if all scopes are present or admin scope is present
 */
export function hasAllScopes(userScopes: string[], requiredScopes: ApiKeyScope[]): boolean {
  // Admin scope grants all permissions
  if (userScopes.includes('admin')) {
    return true;
  }

  // Empty required scopes = always allowed
  if (requiredScopes.length === 0) {
    return true;
  }

  return requiredScopes.every((scope) => userScopes.includes(scope));
}

/**
 * Validate that scopes are valid
 *
 * @param scopes - Array of scopes to validate
 * @returns true if all scopes are valid
 */
export function validateScopes(scopes: string[]): scopes is ApiKeyScope[] {
  return scopes.every((scope) => VALID_SCOPES.includes(scope as ApiKeyScope));
}

// =============================================================================
// ERRORS
// =============================================================================

/**
 * Error thrown when API key is not found
 */
export class ApiKeyNotFoundError extends Error {
  constructor(public keyId: string) {
    super(`API key not found: ${keyId}`);
    this.name = 'ApiKeyNotFoundError';
  }
}
