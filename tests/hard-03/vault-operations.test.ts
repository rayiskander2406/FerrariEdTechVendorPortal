/**
 * HARD-03: Vault Operations Tests
 *
 * Tests for the vault infrastructure including:
 * - Token mapping CRUD
 * - Access logging
 * - Rate limiting
 * - Security alerts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getVaultClient,
  createMockVaultClient,
  VALID_DETOKENIZATION_REASONS,
  isValidDetokenizationReason,
  type RequestorContext,
  type TokenizeInput,
} from '../../lib/vault';
import {
  checkRateLimit,
  incrementRateLimit,
  clearRateLimitCache,
} from '../../lib/vault/rate-limit';

// =============================================================================
// TEST FIXTURES
// =============================================================================

const TEST_CONTEXT: RequestorContext = {
  requestorId: 'test_api_key_001',
  requestorType: 'vendor',
  requestorIp: '192.168.1.100',
  vendorId: 'vendor_test_001',
  resourceContext: 'test_resource',
};

const TEST_TOKENIZE_INPUT: TokenizeInput = {
  realIdentifier: 'SIS_123456789',
  identifierType: 'sis_id',
  userRole: 'student',
  token: 'TKN_STU_TEST0001',
};

// =============================================================================
// CLIENT TESTS
// =============================================================================

describe('HARD-03: Vault Client', () => {
  it('should export getVaultClient function', () => {
    expect(typeof getVaultClient).toBe('function');
  });

  it('should export createMockVaultClient function', () => {
    expect(typeof createMockVaultClient).toBe('function');
  });

  it('should create mock vault client with tokenMapping', () => {
    const mock = createMockVaultClient();
    expect(mock.tokenMapping).toBeDefined();
    expect(typeof mock.tokenMapping?.create).toBe('function');
    expect(typeof mock.tokenMapping?.findUnique).toBe('function');
    expect(typeof mock.tokenMapping?.update).toBe('function');
    expect(typeof mock.tokenMapping?.delete).toBe('function');
  });

  it('should create mock vault client with tokenAccessLog', () => {
    const mock = createMockVaultClient();
    expect(mock.tokenAccessLog).toBeDefined();
    expect(typeof mock.tokenAccessLog?.create).toBe('function');
    expect(typeof mock.tokenAccessLog?.findMany).toBe('function');
  });

  it('should support disconnect on mock client', async () => {
    const mock = createMockVaultClient();
    await expect(mock.$disconnect?.()).resolves.toBeUndefined();
  });
});

// =============================================================================
// DETOKENIZATION REASON VALIDATION
// =============================================================================

describe('HARD-03: Detokenization Reasons', () => {
  it('should export valid detokenization reasons', () => {
    expect(VALID_DETOKENIZATION_REASONS).toContain('sis_sync_reconciliation');
    expect(VALID_DETOKENIZATION_REASONS).toContain('compliance_audit');
    expect(VALID_DETOKENIZATION_REASONS).toContain('data_subject_request');
    expect(VALID_DETOKENIZATION_REASONS).toContain('emergency_contact');
    expect(VALID_DETOKENIZATION_REASONS).toContain('legal_subpoena');
    expect(VALID_DETOKENIZATION_REASONS).toContain('security_investigation');
  });

  it('should have exactly 6 valid reasons', () => {
    expect(VALID_DETOKENIZATION_REASONS.length).toBe(6);
  });

  it('should validate valid reasons', () => {
    expect(isValidDetokenizationReason('sis_sync_reconciliation')).toBe(true);
    expect(isValidDetokenizationReason('compliance_audit')).toBe(true);
    expect(isValidDetokenizationReason('data_subject_request')).toBe(true);
    expect(isValidDetokenizationReason('emergency_contact')).toBe(true);
    expect(isValidDetokenizationReason('legal_subpoena')).toBe(true);
    expect(isValidDetokenizationReason('security_investigation')).toBe(true);
  });

  it('should reject invalid reasons', () => {
    expect(isValidDetokenizationReason('curiosity')).toBe(false);
    expect(isValidDetokenizationReason('testing')).toBe(false);
    expect(isValidDetokenizationReason('')).toBe(false);
    expect(isValidDetokenizationReason('random_reason')).toBe(false);
  });
});

// =============================================================================
// MOCK TOKEN MAPPING TESTS
// =============================================================================

describe('HARD-03: Mock TokenMapping CRUD', () => {
  let mockClient: ReturnType<typeof createMockVaultClient>;

  beforeEach(() => {
    mockClient = createMockVaultClient();
  });

  it('should create a token mapping', async () => {
    const result = await mockClient.tokenMapping?.create({
      data: {
        token: 'TKN_STU_TEST0001',
        realIdentifier: 'SIS_123456789',
        identifierType: 'sis_id',
        userRole: 'student',
        createdBy: 'test_requestor',
      },
    });

    expect(result).toBeDefined();
    expect(result?.token).toBe('TKN_STU_TEST0001');
    expect(result?.realIdentifier).toBe('SIS_123456789');
    expect(result?.identifierType).toBe('sis_id');
    expect(result?.userRole).toBe('student');
    expect(result?.createdAt).toBeInstanceOf(Date);
    expect(result?.accessCount).toBe(0);
  });

  it('should find token mapping by token', async () => {
    await mockClient.tokenMapping?.create({
      data: {
        token: 'TKN_STU_FIND0001',
        realIdentifier: 'SIS_FIND_001',
        identifierType: 'sis_id',
        userRole: 'student',
      },
    });

    const found = await mockClient.tokenMapping?.findUnique({
      where: { token: 'TKN_STU_FIND0001' },
    });

    expect(found).toBeDefined();
    expect(found?.realIdentifier).toBe('SIS_FIND_001');
  });

  it('should find token mapping by real identifier', async () => {
    await mockClient.tokenMapping?.create({
      data: {
        token: 'TKN_STU_REAL0001',
        realIdentifier: 'SIS_REAL_001',
        identifierType: 'sis_id',
        userRole: 'student',
      },
    });

    const found = await mockClient.tokenMapping?.findUnique({
      where: { realIdentifier: 'SIS_REAL_001' },
    });

    expect(found).toBeDefined();
    expect(found?.token).toBe('TKN_STU_REAL0001');
  });

  it('should return null for non-existent token', async () => {
    const found = await mockClient.tokenMapping?.findUnique({
      where: { token: 'TKN_STU_NONEXIST' },
    });

    expect(found).toBeNull();
  });

  it('should update token mapping', async () => {
    await mockClient.tokenMapping?.create({
      data: {
        token: 'TKN_STU_UPDATE01',
        realIdentifier: 'SIS_UPDATE_001',
        identifierType: 'sis_id',
        userRole: 'student',
      },
    });

    const updated = await mockClient.tokenMapping?.update({
      where: { token: 'TKN_STU_UPDATE01' },
      data: { accessCount: 5 },
    });

    expect(updated?.accessCount).toBe(5);
  });

  it('should delete token mapping', async () => {
    await mockClient.tokenMapping?.create({
      data: {
        token: 'TKN_STU_DELETE01',
        realIdentifier: 'SIS_DELETE_001',
        identifierType: 'sis_id',
        userRole: 'student',
      },
    });

    const deleted = await mockClient.tokenMapping?.delete({
      where: { token: 'TKN_STU_DELETE01' },
    });

    expect(deleted?.token).toBe('TKN_STU_DELETE01');

    const notFound = await mockClient.tokenMapping?.findUnique({
      where: { token: 'TKN_STU_DELETE01' },
    });

    expect(notFound).toBeNull();
  });
});

// =============================================================================
// MOCK ACCESS LOG TESTS
// =============================================================================

describe('HARD-03: Mock TokenAccessLog', () => {
  let mockClient: ReturnType<typeof createMockVaultClient>;

  beforeEach(() => {
    mockClient = createMockVaultClient();
  });

  it('should create access log entry', async () => {
    const log = await mockClient.tokenAccessLog?.create({
      data: {
        token: 'TKN_STU_LOG00001',
        accessType: 'tokenize',
        requestorId: 'api_key_001',
        requestorType: 'vendor',
        requestorIp: '192.168.1.1',
        success: true,
        durationMs: 15,
      },
    });

    expect(log).toBeDefined();
    expect(log?.id).toMatch(/^log_/);
    expect(log?.token).toBe('TKN_STU_LOG00001');
    expect(log?.accessType).toBe('tokenize');
    expect(log?.success).toBe(true);
    expect(log?.timestamp).toBeInstanceOf(Date);
  });

  it('should include reason for detokenize logs', async () => {
    const log = await mockClient.tokenAccessLog?.create({
      data: {
        token: 'TKN_STU_DETOKEN1',
        accessType: 'detokenize',
        requestorId: 'sync_job_001',
        requestorType: 'sync_job',
        requestorIp: '10.0.0.1',
        reason: 'sis_sync_reconciliation',
        success: true,
        durationMs: 25,
      },
    });

    expect(log?.reason).toBe('sis_sync_reconciliation');
  });

  it('should include error details for failed operations', async () => {
    const log = await mockClient.tokenAccessLog?.create({
      data: {
        token: 'TKN_STU_FAILED01',
        accessType: 'detokenize',
        requestorId: 'api_key_bad',
        requestorType: 'vendor',
        requestorIp: '192.168.1.2',
        success: false,
        errorCode: 'NOT_FOUND',
        errorMessage: 'Token not found',
        durationMs: 5,
      },
    });

    expect(log?.success).toBe(false);
    expect(log?.errorCode).toBe('NOT_FOUND');
    expect(log?.errorMessage).toBe('Token not found');
  });

  it('should retrieve all access logs', async () => {
    await mockClient.tokenAccessLog?.create({
      data: {
        token: 'TKN_STU_MULTI001',
        accessType: 'tokenize',
        requestorId: 'api_key_001',
        requestorType: 'vendor',
        requestorIp: '192.168.1.1',
        success: true,
      },
    });

    await mockClient.tokenAccessLog?.create({
      data: {
        token: 'TKN_STU_MULTI002',
        accessType: 'lookup',
        requestorId: 'api_key_002',
        requestorType: 'vendor',
        requestorIp: '192.168.1.2',
        success: true,
      },
    });

    const logs = await mockClient.tokenAccessLog?.findMany();
    expect(logs?.length).toBeGreaterThanOrEqual(2);
  });
});

// =============================================================================
// RATE LIMITING TESTS
// =============================================================================

describe('HARD-03: Rate Limiting', () => {
  beforeEach(() => {
    clearRateLimitCache();
  });

  it('should allow requests under rate limit', async () => {
    const check = await checkRateLimit('test_vendor_001', 'tokenize', 'vendor');

    expect(check.allowed).toBe(true);
    expect(check.currentCount).toBe(0);
    expect(check.limit).toBeGreaterThan(0);
    expect(check.window).toBe('minute');
  });

  it('should increment rate limit counter', async () => {
    await incrementRateLimit('test_vendor_002', 'tokenize');

    const check = await checkRateLimit('test_vendor_002', 'tokenize', 'vendor');
    expect(check.currentCount).toBe(1);
  });

  it('should track separate counters for tokenize and detokenize', async () => {
    await incrementRateLimit('test_vendor_003', 'tokenize');
    await incrementRateLimit('test_vendor_003', 'tokenize');
    await incrementRateLimit('test_vendor_003', 'detokenize');

    const tokenizeCheck = await checkRateLimit('test_vendor_003', 'tokenize', 'vendor');
    const detokenizeCheck = await checkRateLimit('test_vendor_003', 'detokenize', 'vendor');

    expect(tokenizeCheck.currentCount).toBe(2);
    expect(detokenizeCheck.currentCount).toBe(1);
  });

  it('should have stricter limits for detokenize', async () => {
    const tokenizeCheck = await checkRateLimit('test_vendor_004', 'tokenize', 'vendor');
    const detokenizeCheck = await checkRateLimit('test_vendor_004', 'detokenize', 'vendor');

    // Detokenize limit should be lower than tokenize
    expect(detokenizeCheck.limit).toBeLessThan(tokenizeCheck.limit);
  });

  it('should have higher limits for internal services', async () => {
    const vendorCheck = await checkRateLimit('vendor_001', 'tokenize', 'vendor');
    const internalCheck = await checkRateLimit('internal_001', 'tokenize', 'internal_service');

    expect(internalCheck.limit).toBeGreaterThan(vendorCheck.limit);
  });

  it('should have higher limits for admin', async () => {
    const vendorCheck = await checkRateLimit('vendor_001', 'tokenize', 'vendor');
    const adminCheck = await checkRateLimit('admin_001', 'tokenize', 'admin');

    expect(adminCheck.limit).toBeGreaterThan(vendorCheck.limit);
  });

  it('should deny requests when rate limit exceeded', async () => {
    // Get the limit
    const initialCheck = await checkRateLimit('heavy_user', 'tokenize', 'vendor');
    const limit = initialCheck.limit;

    // Exceed the limit
    for (let i = 0; i < limit + 1; i++) {
      await incrementRateLimit('heavy_user', 'tokenize');
    }

    const exceededCheck = await checkRateLimit('heavy_user', 'tokenize', 'vendor');
    expect(exceededCheck.allowed).toBe(false);
    expect(exceededCheck.currentCount).toBeGreaterThanOrEqual(limit);
  });

  it('should provide reset time', async () => {
    const check = await checkRateLimit('test_vendor_005', 'tokenize', 'vendor');

    expect(check.resetAt).toBeInstanceOf(Date);
    expect(check.resetAt.getTime()).toBeGreaterThan(Date.now());
  });
});

// =============================================================================
// CONTEXT VALIDATION TESTS
// =============================================================================

describe('HARD-03: RequestorContext', () => {
  it('should require requestorId', () => {
    const context: RequestorContext = {
      requestorId: 'api_key_123',
      requestorType: 'vendor',
      requestorIp: '192.168.1.1',
    };

    expect(context.requestorId).toBeDefined();
    expect(context.requestorId.length).toBeGreaterThan(0);
  });

  it('should support vendor context', () => {
    const context: RequestorContext = {
      requestorId: 'api_key_123',
      requestorType: 'vendor',
      requestorIp: '192.168.1.1',
      vendorId: 'vendor_acme_001',
      resourceContext: '/api/oneroster/users',
    };

    expect(context.vendorId).toBe('vendor_acme_001');
    expect(context.resourceContext).toBe('/api/oneroster/users');
  });

  it('should support sync job context', () => {
    const context: RequestorContext = {
      requestorId: 'sync_lausd_2024',
      requestorType: 'sync_job',
      requestorIp: '10.0.0.1',
      resourceContext: 'lausd_daily_sync',
    };

    expect(context.requestorType).toBe('sync_job');
  });

  it('should support admin context', () => {
    const context: RequestorContext = {
      requestorId: 'admin_jane_doe',
      requestorType: 'admin',
      requestorIp: '172.16.0.50',
      resourceContext: 'compliance_audit_2024',
    };

    expect(context.requestorType).toBe('admin');
  });
});

// =============================================================================
// TOKENIZE INPUT VALIDATION TESTS
// =============================================================================

describe('HARD-03: TokenizeInput', () => {
  it('should support student tokens', () => {
    const input: TokenizeInput = {
      realIdentifier: 'SIS_123456',
      identifierType: 'sis_id',
      userRole: 'student',
      token: 'TKN_STU_ABCD1234',
    };

    expect(input.userRole).toBe('student');
    expect(input.token).toMatch(/^TKN_STU_/);
  });

  it('should support teacher tokens', () => {
    const input: TokenizeInput = {
      realIdentifier: 'TCH_987654',
      identifierType: 'sis_id',
      userRole: 'teacher',
      token: 'TKN_TCH_EFGH5678',
    };

    expect(input.userRole).toBe('teacher');
    expect(input.token).toMatch(/^TKN_TCH_/);
  });

  it('should support parent tokens', () => {
    const input: TokenizeInput = {
      realIdentifier: 'PAR_111222',
      identifierType: 'sis_id',
      userRole: 'parent',
      token: 'TKN_PAR_IJKL9012',
    };

    expect(input.userRole).toBe('parent');
    expect(input.token).toMatch(/^TKN_PAR_/);
  });

  it('should support different identifier types', () => {
    const sisInput: TokenizeInput = {
      realIdentifier: 'SIS_001',
      identifierType: 'sis_id',
      userRole: 'student',
      token: 'TKN_STU_SIS00001',
    };

    const cleverInput: TokenizeInput = {
      realIdentifier: 'CLV_001',
      identifierType: 'clever_id',
      userRole: 'student',
      token: 'TKN_STU_CLV00001',
    };

    const classlinkInput: TokenizeInput = {
      realIdentifier: 'CL_001',
      identifierType: 'classlink_id',
      userRole: 'student',
      token: 'TKN_STU_CL000001',
    };

    expect(sisInput.identifierType).toBe('sis_id');
    expect(cleverInput.identifierType).toBe('clever_id');
    expect(classlinkInput.identifierType).toBe('classlink_id');
  });
});

// =============================================================================
// EXPORT VERIFICATION
// =============================================================================

describe('HARD-03: Module Exports', () => {
  it('should export client functions', async () => {
    const vault = await import('../../lib/vault');

    expect(vault.getVaultClient).toBeDefined();
    expect(vault.disconnectVault).toBeDefined();
    expect(vault.createMockVaultClient).toBeDefined();
  });

  it('should export operation functions', async () => {
    const vault = await import('../../lib/vault');

    expect(vault.tokenize).toBeDefined();
    expect(vault.detokenize).toBeDefined();
    expect(vault.lookupByRealIdentifier).toBeDefined();
    expect(vault.bulkTokenize).toBeDefined();
  });

  it('should export rate limit functions', async () => {
    const vault = await import('../../lib/vault');

    expect(vault.checkRateLimit).toBeDefined();
    expect(vault.incrementRateLimit).toBeDefined();
    expect(vault.resetRateLimit).toBeDefined();
    expect(vault.getRateLimitStatus).toBeDefined();
    expect(vault.clearRateLimitCache).toBeDefined();
  });

  it('should export alert functions', async () => {
    const vault = await import('../../lib/vault');

    expect(vault.triggerSecurityAlert).toBeDefined();
    expect(vault.acknowledgeAlert).toBeDefined();
    expect(vault.resolveAlert).toBeDefined();
    expect(vault.markAlertFalsePositive).toBeDefined();
    expect(vault.getOpenAlerts).toBeDefined();
    expect(vault.getAlertsForRequestor).toBeDefined();
    expect(vault.getAlertStats).toBeDefined();
  });

  it('should export types', async () => {
    const vault = await import('../../lib/vault');

    // Type exports (checking they exist at runtime as type validation)
    expect(vault.VALID_DETOKENIZATION_REASONS).toBeDefined();
    expect(vault.isValidDetokenizationReason).toBeDefined();
  });
});
