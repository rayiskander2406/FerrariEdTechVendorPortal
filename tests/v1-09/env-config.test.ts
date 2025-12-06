/**
 * V1-09: Environment Configuration Tests
 * TDD approach - write tests first, then implement
 *
 * Tests Zod validation for all environment variables
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Will be implemented in lib/config/env.ts
import {
  envSchema,
  validateEnv,
  getEnv,
  clearEnvCache,
  isProduction,
  isDevelopment,
  isTest,
  requireEnv,
  EnvValidationError,
  type Env,
} from '@/lib/config/env';

describe('V1-09: Environment Configuration', () => {
  // Store original env
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset process.env before each test
    vi.resetModules();
    process.env = { ...originalEnv };
    // Clear the cached env to ensure fresh validation
    clearEnvCache();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('envSchema', () => {
    describe('DATABASE_URL', () => {
      it('should require DATABASE_URL in production', () => {
        process.env.NODE_ENV = 'production';
        delete process.env.DATABASE_URL;

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some(i => i.path.includes('DATABASE_URL'))).toBe(true);
        }
      });

      it('should accept valid PostgreSQL URL', () => {
        process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db');
        }
      });

      it('should accept postgres:// URL scheme', () => {
        process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
      });

      it('should reject invalid URL format', () => {
        process.env.DATABASE_URL = 'not-a-valid-url';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(false);
      });

      it('should allow undefined in development/test when USE_MOCK_DB is true', () => {
        process.env.NODE_ENV = 'development';
        process.env.USE_MOCK_DB = 'true';
        delete process.env.DATABASE_URL;

        const result = envSchema.safeParse(process.env);

        // Should pass because mock DB is enabled
        expect(result.success).toBe(true);
      });
    });

    describe('VAULT_DATABASE_URL', () => {
      it('should be optional but validate format when provided', () => {
        process.env.VAULT_DATABASE_URL = 'postgresql://vault:pass@localhost:5433/vault';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.VAULT_DATABASE_URL).toBe('postgresql://vault:pass@localhost:5433/vault');
        }
      });

      it('should reject invalid URL format', () => {
        process.env.VAULT_DATABASE_URL = 'invalid-url';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(false);
      });
    });

    describe('DATABASE_READ_URL', () => {
      it('should be optional', () => {
        delete process.env.DATABASE_READ_URL;

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.DATABASE_READ_URL).toBeUndefined();
        }
      });

      it('should validate format when provided', () => {
        process.env.DATABASE_READ_URL = 'postgresql://user:pass@replica:5432/db';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
      });
    });

    describe('ANTHROPIC_API_KEY', () => {
      it('should require in production', () => {
        process.env.NODE_ENV = 'production';
        delete process.env.ANTHROPIC_API_KEY;

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(false);
      });

      it('should accept valid API key format', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-api03-abc123xyz';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.ANTHROPIC_API_KEY).toBe('sk-ant-api03-abc123xyz');
        }
      });

      it('should allow empty in development for demo mode', () => {
        process.env.NODE_ENV = 'development';
        process.env.ANTHROPIC_API_KEY = '';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
      });
    });

    describe('NODE_ENV', () => {
      it('should default to development', () => {
        delete process.env.NODE_ENV;

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.NODE_ENV).toBe('development');
        }
      });

      it('should accept valid values', () => {
        const validEnvs = ['development', 'test', 'production'];

        for (const env of validEnvs) {
          process.env.NODE_ENV = env;
          // Production requires additional env vars
          if (env === 'production') {
            process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
            process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
          }
          const result = envSchema.safeParse(process.env);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.NODE_ENV).toBe(env);
          }
        }
      });

      it('should reject invalid values', () => {
        process.env.NODE_ENV = 'staging';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(false);
      });
    });

    describe('USE_MOCK_DB', () => {
      it('should default to false', () => {
        delete process.env.USE_MOCK_DB;

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.USE_MOCK_DB).toBe(false);
        }
      });

      it('should coerce string "true" to boolean true', () => {
        process.env.USE_MOCK_DB = 'true';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.USE_MOCK_DB).toBe(true);
        }
      });

      it('should coerce string "false" to boolean false', () => {
        process.env.USE_MOCK_DB = 'false';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.USE_MOCK_DB).toBe(false);
        }
      });

      it('should coerce "1" to true', () => {
        process.env.USE_MOCK_DB = '1';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.USE_MOCK_DB).toBe(true);
        }
      });
    });

    describe('SHADOW_MODE', () => {
      it('should default to false', () => {
        delete process.env.SHADOW_MODE;

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.SHADOW_MODE).toBe(false);
        }
      });

      it('should coerce string to boolean', () => {
        process.env.SHADOW_MODE = 'true';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.SHADOW_MODE).toBe(true);
        }
      });
    });

    describe('LOG_LEVEL', () => {
      it('should default to info', () => {
        delete process.env.LOG_LEVEL;

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.LOG_LEVEL).toBe('info');
        }
      });

      it('should accept valid log levels', () => {
        const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'];

        for (const level of validLevels) {
          process.env.LOG_LEVEL = level;
          const result = envSchema.safeParse(process.env);
          expect(result.success).toBe(true);
        }
      });

      it('should reject invalid log levels', () => {
        process.env.LOG_LEVEL = 'verbose';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(false);
      });
    });

    describe('Upstash Redis', () => {
      it('UPSTASH_REDIS_REST_URL should be optional', () => {
        delete process.env.UPSTASH_REDIS_REST_URL;

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
      });

      it('UPSTASH_REDIS_REST_TOKEN should be optional', () => {
        delete process.env.UPSTASH_REDIS_REST_TOKEN;

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
      });

      it('should validate URL format when provided', () => {
        process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
      });
    });

    describe('Sentry', () => {
      it('SENTRY_DSN should be optional', () => {
        delete process.env.SENTRY_DSN;

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
      });

      it('should validate DSN format when provided', () => {
        process.env.SENTRY_DSN = 'https://abc123@o123456.ingest.sentry.io/1234567';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
      });
    });

    describe('SendGrid', () => {
      it('SENDGRID_API_KEY should be optional', () => {
        delete process.env.SENDGRID_API_KEY;

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
      });

      it('should accept valid SendGrid API key', () => {
        process.env.SENDGRID_API_KEY = 'SG.abcdefghijklmnop.xyz123';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
      });
    });

    describe('Twilio', () => {
      it('TWILIO_ACCOUNT_SID should be optional', () => {
        delete process.env.TWILIO_ACCOUNT_SID;

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
      });

      it('TWILIO_AUTH_TOKEN should be optional', () => {
        delete process.env.TWILIO_AUTH_TOKEN;

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
      });

      it('TWILIO_PHONE_NUMBER should be optional', () => {
        delete process.env.TWILIO_PHONE_NUMBER;

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
      });

      it('should accept valid Twilio phone number format', () => {
        process.env.TWILIO_PHONE_NUMBER = '+15551234567';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
      });
    });

    describe('PORT', () => {
      it('should default to 3000', () => {
        delete process.env.PORT;

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.PORT).toBe(3000);
        }
      });

      it('should coerce string to number', () => {
        process.env.PORT = '8080';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.PORT).toBe(8080);
        }
      });

      it('should reject invalid port numbers', () => {
        process.env.PORT = '99999';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(false);
      });

      it('should reject non-numeric values', () => {
        process.env.PORT = 'abc';

        const result = envSchema.safeParse(process.env);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('validateEnv()', () => {
    it('should return validated env on success', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

      const env = validateEnv();

      expect(env.NODE_ENV).toBe('development');
      expect(env.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db');
    });

    it('should throw EnvValidationError on failure', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URL;
      delete process.env.ANTHROPIC_API_KEY;

      expect(() => validateEnv()).toThrow(EnvValidationError);
    });

    it('should include all missing variables in error message', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URL;
      delete process.env.ANTHROPIC_API_KEY;

      try {
        validateEnv();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(EnvValidationError);
        const envError = error as EnvValidationError;
        expect(envError.message).toContain('DATABASE_URL');
        expect(envError.message).toContain('ANTHROPIC_API_KEY');
      }
    });
  });

  describe('getEnv()', () => {
    it('should return cached validated env', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

      const env1 = getEnv();
      const env2 = getEnv();

      expect(env1).toBe(env2); // Same reference (cached)
    });

    it('should return typed env object', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

      const env: Env = getEnv();

      // TypeScript should know these types
      expect(typeof env.NODE_ENV).toBe('string');
      expect(typeof env.USE_MOCK_DB).toBe('boolean');
      expect(typeof env.PORT).toBe('number');
    });
  });

  describe('Environment helpers', () => {
    describe('isProduction()', () => {
      it('should return true when NODE_ENV is production', () => {
        process.env.NODE_ENV = 'production';
        process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
        process.env.ANTHROPIC_API_KEY = 'sk-ant-test';

        expect(isProduction()).toBe(true);
      });

      it('should return false when NODE_ENV is not production', () => {
        process.env.NODE_ENV = 'development';

        expect(isProduction()).toBe(false);
      });
    });

    describe('isDevelopment()', () => {
      it('should return true when NODE_ENV is development', () => {
        process.env.NODE_ENV = 'development';

        expect(isDevelopment()).toBe(true);
      });

      it('should return false when NODE_ENV is not development', () => {
        process.env.NODE_ENV = 'production';
        process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
        process.env.ANTHROPIC_API_KEY = 'sk-ant-test';

        expect(isDevelopment()).toBe(false);
      });
    });

    describe('isTest()', () => {
      it('should return true when NODE_ENV is test', () => {
        process.env.NODE_ENV = 'test';

        expect(isTest()).toBe(true);
      });

      it('should return true when VITEST is set', () => {
        process.env.NODE_ENV = 'development';
        process.env.VITEST = 'true';

        expect(isTest()).toBe(true);
      });
    });
  });

  describe('requireEnv()', () => {
    it('should return value when env var exists', () => {
      process.env.TEST_VAR = 'test-value';

      const value = requireEnv('TEST_VAR');

      expect(value).toBe('test-value');
    });

    it('should throw when env var is missing', () => {
      delete process.env.MISSING_VAR;

      expect(() => requireEnv('MISSING_VAR')).toThrow();
    });

    it('should include variable name in error message', () => {
      delete process.env.MISSING_VAR;

      expect(() => requireEnv('MISSING_VAR')).toThrow('MISSING_VAR');
    });

    it('should throw when env var is empty string', () => {
      process.env.EMPTY_VAR = '';

      expect(() => requireEnv('EMPTY_VAR')).toThrow();
    });
  });

  describe('EnvValidationError', () => {
    it('should be an Error subclass', () => {
      const error = new EnvValidationError('test');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('EnvValidationError');
    });

    it('should store validation issues', () => {
      const issues = [
        { path: ['DATABASE_URL'], message: 'Required' },
        { path: ['PORT'], message: 'Invalid number' },
      ];

      const error = new EnvValidationError('Validation failed', issues);

      expect(error.issues).toEqual(issues);
    });
  });

  describe('Production Requirements', () => {
    it('should require DATABASE_URL in production', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URL;
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test';

      const result = envSchema.safeParse(process.env);

      expect(result.success).toBe(false);
    });

    it('should require ANTHROPIC_API_KEY in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      delete process.env.ANTHROPIC_API_KEY;

      const result = envSchema.safeParse(process.env);

      expect(result.success).toBe(false);
    });

    it('should not allow USE_MOCK_DB=true in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
      process.env.USE_MOCK_DB = 'true';

      const result = envSchema.safeParse(process.env);

      expect(result.success).toBe(false);
    });
  });

  describe('Development/Test Flexibility', () => {
    it('should allow missing DATABASE_URL when USE_MOCK_DB is true', () => {
      process.env.NODE_ENV = 'development';
      process.env.USE_MOCK_DB = 'true';
      delete process.env.DATABASE_URL;

      const result = envSchema.safeParse(process.env);

      expect(result.success).toBe(true);
    });

    it('should allow missing ANTHROPIC_API_KEY in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.ANTHROPIC_API_KEY;

      const result = envSchema.safeParse(process.env);

      expect(result.success).toBe(true);
    });

    it('should allow missing ANTHROPIC_API_KEY in test', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.ANTHROPIC_API_KEY;

      const result = envSchema.safeParse(process.env);

      expect(result.success).toBe(true);
    });
  });

  describe('Type Coercion', () => {
    it('should coerce PORT from string to number', () => {
      process.env.PORT = '4000';

      const result = envSchema.safeParse(process.env);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PORT).toBe(4000);
        expect(typeof result.data.PORT).toBe('number');
      }
    });

    it('should coerce boolean flags from string', () => {
      process.env.USE_MOCK_DB = 'true';
      process.env.SHADOW_MODE = 'false';

      const result = envSchema.safeParse(process.env);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.USE_MOCK_DB).toBe(true);
        expect(result.data.SHADOW_MODE).toBe(false);
        expect(typeof result.data.USE_MOCK_DB).toBe('boolean');
      }
    });
  });

  describe('URL Validation', () => {
    it('should accept valid PostgreSQL URLs', () => {
      const validUrls = [
        'postgresql://user:pass@localhost:5432/db',
        'postgres://user:pass@localhost:5432/db',
        'postgresql://user:pass@db.example.com:5432/mydb?sslmode=require',
        'postgresql://user@localhost/db',
      ];

      for (const url of validUrls) {
        process.env.DATABASE_URL = url;
        const result = envSchema.safeParse(process.env);
        expect(result.success).toBe(true);
      }
    });

    it('should reject non-PostgreSQL URLs for DATABASE_URL', () => {
      process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/db';

      const result = envSchema.safeParse(process.env);

      expect(result.success).toBe(false);
    });

    it('should accept valid HTTPS URLs for services', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.SENTRY_DSN = 'https://abc@sentry.io/123';

      const result = envSchema.safeParse(process.env);

      expect(result.success).toBe(true);
    });
  });

  describe('Comprehensive Validation', () => {
    it('should validate complete production config', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.VAULT_DATABASE_URL = 'postgresql://vault:pass@localhost:5433/vault';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-api03-abc123';
      process.env.PORT = '3000';
      process.env.LOG_LEVEL = 'info';
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token123';
      process.env.SENTRY_DSN = 'https://abc@sentry.io/123';

      const result = envSchema.safeParse(process.env);

      expect(result.success).toBe(true);
    });

    it('should validate minimal development config', () => {
      process.env.NODE_ENV = 'development';
      process.env.USE_MOCK_DB = 'true';
      // Everything else can be missing in dev with mock DB

      const result = envSchema.safeParse(process.env);

      expect(result.success).toBe(true);
    });
  });
});
