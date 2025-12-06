/**
 * V1-09: Environment Configuration with Zod Validation
 *
 * Single source of truth for all environment variables.
 * Provides type-safe access with validation and helpful error messages.
 *
 * @example
 * import { getEnv, isProduction } from '@/lib/config/env';
 *
 * const env = getEnv();
 * console.log(env.DATABASE_URL); // Type-safe access
 *
 * if (isProduction()) {
 *   // Production-only code
 * }
 */

import { z } from 'zod';

// =============================================================================
// Custom Zod Refinements
// =============================================================================

/**
 * PostgreSQL URL validator - accepts both postgresql:// and postgres:// schemes
 */
const postgresUrlSchema = z
  .string()
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:';
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid PostgreSQL URL (postgresql:// or postgres://)' }
  );

/**
 * HTTPS URL validator for external services
 */
const httpsUrlSchema = z
  .string()
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid HTTPS URL' }
  );

/**
 * Boolean coercion from string environment variables
 * Accepts: 'true', '1', 'yes' as true; everything else as false
 */
const booleanString = z
  .string()
  .optional()
  .transform((val) => {
    if (val === undefined || val === '') return false;
    return val.toLowerCase() === 'true' || val === '1' || val.toLowerCase() === 'yes';
  });

/**
 * Port number validator (1-65535)
 */
const portSchema = z
  .string()
  .optional()
  .transform((val) => (val ? parseInt(val, 10) : 3000))
  .refine((val) => val >= 1 && val <= 65535, {
    message: 'Port must be between 1 and 65535',
  });

// =============================================================================
// Environment Schema Definition
// =============================================================================

/**
 * Valid NODE_ENV values
 */
const nodeEnvSchema = z.enum(['development', 'test', 'production']).default('development');

/**
 * Valid log levels (Pino-compatible)
 */
const logLevelSchema = z
  .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
  .default('info');

/**
 * Base environment schema - defines all environment variables
 */
const baseEnvSchema = z.object({
  // ==========================================================================
  // Core Configuration
  // ==========================================================================

  /** Application environment */
  NODE_ENV: nodeEnvSchema,

  /** Server port */
  PORT: portSchema,

  /** Logging level */
  LOG_LEVEL: logLevelSchema,

  // ==========================================================================
  // Database Configuration
  // ==========================================================================

  /** Main PostgreSQL database URL */
  DATABASE_URL: postgresUrlSchema.optional(),

  /** Vault database URL (separate for security) */
  VAULT_DATABASE_URL: postgresUrlSchema.optional(),

  /** Read replica URL for list operations */
  DATABASE_READ_URL: postgresUrlSchema.optional(),

  // ==========================================================================
  // Feature Flags
  // ==========================================================================

  /** Use in-memory mock database instead of PostgreSQL */
  USE_MOCK_DB: booleanString,

  /** Enable shadow mode for schema validation */
  SHADOW_MODE: booleanString,

  // ==========================================================================
  // API Keys
  // ==========================================================================

  /** Anthropic Claude API key */
  ANTHROPIC_API_KEY: z.string().optional(),

  // ==========================================================================
  // External Services (Optional)
  // ==========================================================================

  /** Upstash Redis REST URL for rate limiting */
  UPSTASH_REDIS_REST_URL: httpsUrlSchema.optional(),

  /** Upstash Redis REST token */
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  /** Sentry DSN for error tracking */
  SENTRY_DSN: httpsUrlSchema.optional(),

  // ==========================================================================
  // CPaaS Providers (Optional)
  // ==========================================================================

  /** SendGrid API key for email */
  SENDGRID_API_KEY: z.string().optional(),

  /** Twilio Account SID for SMS */
  TWILIO_ACCOUNT_SID: z.string().optional(),

  /** Twilio Auth Token */
  TWILIO_AUTH_TOKEN: z.string().optional(),

  /** Twilio phone number (E.164 format) */
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // ==========================================================================
  // Test Environment
  // ==========================================================================

  /** Vitest indicator */
  VITEST: z.string().optional(),
});

/**
 * Environment schema with cross-field validation and production requirements
 */
export const envSchema = baseEnvSchema.superRefine((data, ctx) => {
  const isProduction = data.NODE_ENV === 'production';
  const isDevelopmentOrTest = data.NODE_ENV === 'development' || data.NODE_ENV === 'test';
  const useMockDb = data.USE_MOCK_DB;

  // Production requirements
  if (isProduction) {
    // DATABASE_URL required in production
    if (!data.DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'DATABASE_URL is required in production',
        path: ['DATABASE_URL'],
      });
    }

    // ANTHROPIC_API_KEY required in production
    if (!data.ANTHROPIC_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ANTHROPIC_API_KEY is required in production',
        path: ['ANTHROPIC_API_KEY'],
      });
    }

    // USE_MOCK_DB must be false in production
    if (useMockDb) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'USE_MOCK_DB cannot be true in production',
        path: ['USE_MOCK_DB'],
      });
    }
  }

  // Development/Test requirements
  if (isDevelopmentOrTest && !useMockDb) {
    // DATABASE_URL required if not using mock DB
    // But we allow it to be missing in dev/test for flexibility
    // The actual DB code will handle this gracefully
  }
});

// =============================================================================
// Types
// =============================================================================

/**
 * Validated environment type
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Environment validation error with detailed issues
 */
export class EnvValidationError extends Error {
  public readonly issues: Array<{ path: string[]; message: string }>;

  constructor(message: string, issues: Array<{ path: string[]; message: string }> = []) {
    super(message);
    this.name = 'EnvValidationError';
    this.issues = issues;
  }
}

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Cached validated environment
 */
let cachedEnv: Env | null = null;

/**
 * Validates process.env against the schema and throws on failure
 *
 * @throws {EnvValidationError} If validation fails
 * @returns Validated environment object
 *
 * @example
 * try {
 *   const env = validateEnv();
 *   console.log(env.DATABASE_URL);
 * } catch (error) {
 *   if (error instanceof EnvValidationError) {
 *     console.error('Missing env vars:', error.issues);
 *   }
 * }
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.map(String),
      message: issue.message,
    }));

    const missingVars = issues.map((i) => i.path.join('.')).join(', ');
    throw new EnvValidationError(
      `Environment validation failed. Issues with: ${missingVars}`,
      issues
    );
  }

  return result.data;
}

/**
 * Gets the validated environment, caching the result.
 * Safe to call multiple times - validation only runs once.
 *
 * @throws {EnvValidationError} If validation fails on first call
 * @returns Cached validated environment object
 *
 * @example
 * const env = getEnv();
 * console.log(env.NODE_ENV); // 'development' | 'test' | 'production'
 */
export function getEnv(): Env {
  if (cachedEnv === null) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

/**
 * Clears the cached environment (useful for testing)
 */
export function clearEnvCache(): void {
  cachedEnv = null;
}

// =============================================================================
// Environment Helper Functions
// =============================================================================

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development';
}

/**
 * Check if running in test environment
 */
export function isTest(): boolean {
  const env = getEnv();
  return env.NODE_ENV === 'test' || env.VITEST === 'true';
}

/**
 * Require an environment variable to be present.
 * Throws if the variable is missing or empty.
 *
 * @param key - Environment variable name
 * @throws {Error} If the variable is missing or empty
 * @returns The environment variable value
 *
 * @example
 * const apiKey = requireEnv('API_KEY');
 */
export function requireEnv(key: string): string {
  const value = process.env[key];

  if (value === undefined || value === '') {
    throw new Error(`Required environment variable ${key} is not set`);
  }

  return value;
}

// =============================================================================
// Service-Specific Helpers
// =============================================================================

/**
 * Check if Upstash Redis is configured
 */
export function hasUpstashRedis(): boolean {
  const env = getEnv();
  return !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Check if Sentry is configured
 */
export function hasSentry(): boolean {
  return !!getEnv().SENTRY_DSN;
}

/**
 * Check if SendGrid is configured
 */
export function hasSendGrid(): boolean {
  return !!getEnv().SENDGRID_API_KEY;
}

/**
 * Check if Twilio is configured
 */
export function hasTwilio(): boolean {
  const env = getEnv();
  return !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN);
}

/**
 * Check if using mock database
 */
export function useMockDb(): boolean {
  return getEnv().USE_MOCK_DB;
}

/**
 * Check if Anthropic API is configured
 */
export function hasAnthropicApi(): boolean {
  return !!getEnv().ANTHROPIC_API_KEY;
}
