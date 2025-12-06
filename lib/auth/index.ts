/**
 * Authentication Module
 *
 * V1-02: API Key authentication and authorization
 *
 * @module lib/auth
 */

// API Key functions
export {
  generateApiKey,
  hashApiKey,
  validateApiKey,
  createApiKey,
  revokeApiKey,
  rotateApiKey,
  listApiKeys,
  getApiKeyByPrefix,
  getApiKeyById,
  hasScope,
  hasAllScopes,
  validateScopes,
  API_KEY_PREFIX,
  VALID_SCOPES,
  ApiKeyNotFoundError,
  type GeneratedApiKey,
  type ApiKeyValidation,
  type ApiKeyInfo,
  type ApiKeyScope,
  type ListApiKeysOptions,
  type RotateApiKeyResult,
} from './api-keys';

// Middleware functions
export {
  withAuth,
  requireScopes,
  requireAdmin,
  extractBearerToken,
  createAuthContext,
  contextHasScope,
  unauthorized,
  forbidden,
  type AuthContext,
  type AuthenticatedHandler,
} from './middleware';
