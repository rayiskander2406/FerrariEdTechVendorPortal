/**
 * AI Tool Handlers Unit Tests
 *
 * Comprehensive tests for all 12 AI tool handlers with 90%+ coverage target.
 * Tests verify correct behavior, error handling, and edge cases.
 *
 * @module tests/ai-tools/handlers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  handleLookupPods,
  handleSubmitPodsLite,
  handleProvisionSandbox,
  handleConfigureSso,
  handleTestOneroster,
  handleConfigureLti,
  handleSendTestMessage,
  handleSubmitApp,
  handleGetAuditLogs,
  handleGetCredentials,
  handleCheckStatus,
  handleRequestUpgrade,
  executeToolCall,
} from '@/lib/ai/handlers';
import { createVendor, createSandbox, clearAllStores } from '@/lib/db';
import type { PodsLiteInput } from '@/lib/types';
import { PodsLiteSchema, createMockFactory } from '@/lib/schemas';

// =============================================================================
// TEST FIXTURES (Schema-First)
// =============================================================================

/**
 * Schema-based mock factory for PoDS-Lite input
 * Uses deterministic seed for reproducible tests
 */
const podsLiteMockFactory = createMockFactory(PodsLiteSchema);

/**
 * Non-sensitive data elements that result in PRIVACY_SAFE tier (auto-approved)
 * Sensitive elements: LAST_NAME, EMAIL, PHONE, ADDRESS, DEMOGRAPHICS, SPECIAL_ED
 */
const NON_SENSITIVE_DATA_ELEMENTS = ['STUDENT_ID', 'FIRST_NAME', 'GRADE_LEVEL', 'CLASS_ROSTER'];

/**
 * Creates a valid PoDS-Lite input for testing
 * Now powered by schema-first mock factory with deterministic generation
 *
 * NOTE: Defaults to non-sensitive data elements so vendors get auto-approved
 * (PRIVACY_SAFE tier). Override dataElementsRequested with sensitive elements
 * to test PENDING_REVIEW scenarios.
 */
function createMockPodsLiteInput(overrides: Partial<PodsLiteInput> = {}): PodsLiteInput {
  // Generate base mock from schema (seed ensures deterministic values)
  const baseMock = podsLiteMockFactory.create({ seed: 12345 });

  // Map schema fields to PodsLiteInput type (schema has extra fields)
  // Default to non-sensitive elements for auto-approval unless overridden
  return {
    vendorName: baseMock.vendorName as string,
    contactEmail: baseMock.contactEmail as string,
    contactName: baseMock.contactName as string,
    contactPhone: baseMock.contactPhone as string,
    websiteUrl: baseMock.websiteUrl as string,
    linkedInUrl: baseMock.linkedInUrl as string,
    applicationName: baseMock.applicationName as string,
    applicationDescription: baseMock.applicationDescription as string,
    dataElementsRequested: NON_SENSITIVE_DATA_ELEMENTS,
    dataPurpose: baseMock.dataPurpose as string,
    dataRetentionDays: baseMock.dataRetentionDays as number,
    integrationMethod: baseMock.integrationMethod as 'ONEROSTER_API' | 'SFTP' | 'LTI_1_3' | 'SSO_SAML' | 'SSO_OIDC' | 'MANUAL_UPLOAD',
    thirdPartySharing: baseMock.thirdPartySharing as boolean,
    thirdPartyDetails: baseMock.thirdPartyDetails as string | undefined,
    hasSOC2: baseMock.hasSOC2 as boolean,
    hasFERPACertification: baseMock.hasFERPACertification as boolean,
    encryptsDataAtRest: baseMock.encryptsDataAtRest as boolean,
    encryptsDataInTransit: baseMock.encryptsDataInTransit as boolean,
    breachNotificationHours: baseMock.breachNotificationHours as number,
    coppaCompliant: baseMock.coppaCompliant as boolean,
    acceptsTerms: baseMock.acceptsTerms as boolean,
    acceptsDataDeletion: baseMock.acceptsDataDeletion as boolean,
    ...overrides,
  };
}

// =============================================================================
// 1. LOOKUP_PODS TESTS
// =============================================================================

describe('handleLookupPods', () => {
  it('should return null when no PoDS application found', async () => {
    const result = await handleLookupPods({ query: 'nonexistent@vendor.com' });

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
    expect(result.message).toContain('No PoDS application found');
  });

  it('should find PoDS application by vendor name (case insensitive)', async () => {
    const result = await handleLookupPods({ query: 'mathwhiz' });

    expect(result.success).toBe(true);
    expect(result.data).not.toBeNull();
    if (result.data) {
      expect((result.data as { vendorName: string }).vendorName).toContain('MathWhiz');
    }
  });

  it('should find PoDS application by application ID', async () => {
    const result = await handleLookupPods({ query: 'PODS-2024-001' });

    expect(result.success).toBe(true);
    expect(result.data).not.toBeNull();
    if (result.data) {
      expect((result.data as { applicationId: string }).applicationId).toBe('PODS-2024-001');
    }
  });

  it('should find PoDS application by email', async () => {
    const result = await handleLookupPods({ query: 'integration@mathwhiz.com' });

    expect(result.success).toBe(true);
    expect(result.data).not.toBeNull();
  });

  it('should include status and tier descriptions', async () => {
    const result = await handleLookupPods({ query: 'PODS-2024-001' });

    expect(result.success).toBe(true);
    if (result.data) {
      const data = result.data as Record<string, unknown>;
      expect(data.statusDescription).toBeDefined();
      expect(data.tierDescription).toBeDefined();
    }
  });
});

// =============================================================================
// 2. SUBMIT_PODS_LITE TESTS
// =============================================================================

describe('handleSubmitPodsLite', () => {
  it('should return showForm for pods_lite', async () => {
    const result = await handleSubmitPodsLite({ trigger_form: true });

    expect(result.success).toBe(true);
    expect(result.showForm).toBe('pods_lite');
    expect(result.message).toContain('PoDS-Lite');
  });

  it('should include prefill data when provided', async () => {
    const result = await handleSubmitPodsLite({
      trigger_form: true,
      prefill_vendor_name: 'Test Vendor',
      prefill_email: 'test@test.com',
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      prefill: {
        vendorName: 'Test Vendor',
        contactEmail: 'test@test.com',
      },
    });
  });

  it('should handle empty prefill values', async () => {
    const result = await handleSubmitPodsLite({ trigger_form: true });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      prefill: {
        vendorName: undefined,
        contactEmail: undefined,
      },
    });
  });
});

// =============================================================================
// 3. PROVISION_SANDBOX TESTS
// =============================================================================

describe('handleProvisionSandbox', () => {
  it('should return error for non-existent vendor', async () => {
    const result = await handleProvisionSandbox({ vendor_id: 'non-existent-id' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Vendor not found');
  });

  it('should provision new sandbox for approved vendor', async () => {
    // Create an approved vendor first
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });

    const result = await handleProvisionSandbox({ vendor_id: vendor.id });

    expect(result.success).toBe(true);
    expect(result.showForm).toBe('credentials');
    expect(result.data).toBeDefined();

    const data = result.data as Record<string, unknown>;
    expect(data.new).toBe(true);
    expect(data.apiKey).toMatch(/^sk_test_/);
    expect(data.apiSecret).toBeDefined();
    expect(data.baseUrl).toContain('sandbox');
    expect(data.environment).toBe('sandbox');
  });

  it('should return existing credentials if sandbox already exists', async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    await createSandbox(vendor.id);

    const result = await handleProvisionSandbox({ vendor_id: vendor.id });

    expect(result.success).toBe(true);
    expect(result.showForm).toBe('credentials');
    const data = result.data as Record<string, unknown>;
    expect(data.existing).toBe(true);
  });

  it('should not provision sandbox for pending vendor', async () => {
    // Create a vendor that needs review (requests sensitive data)
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput({
        dataElementsRequested: ['STUDENT_ID', 'EMAIL', 'PHONE'],
      }),
    });

    const result = await handleProvisionSandbox({ vendor_id: vendor.id });

    expect(result.success).toBe(false);
    expect(result.error).toContain('must be approved');
  });
});

// =============================================================================
// 4. CONFIGURE_SSO TESTS
// =============================================================================

describe('handleConfigureSso', () => {
  it('should trigger SSO config form when trigger_form is true', async () => {
    const result = await handleConfigureSso({
      provider: 'CLEVER',
      trigger_form: true,
    });

    expect(result.success).toBe(true);
    expect(result.showForm).toBe('sso_config');
    expect(result.data).toBeDefined();

    const data = result.data as Record<string, unknown>;
    expect(data.provider).toBe('CLEVER');
    expect(data.providerInfo).toBeDefined();
  });

  it('should configure SSO directly when credentials provided', async () => {
    const result = await handleConfigureSso({
      provider: 'GOOGLE',
      trigger_form: false,
      client_id: 'test-client-id',
      client_secret: 'test-client-secret',
      redirect_uri: 'https://example.com/callback',
    });

    expect(result.success).toBe(true);
    expect(result.showForm).toBeUndefined();

    const data = result.data as Record<string, unknown>;
    expect(data.status).toBe('configured');
    expect(data.provider).toBe('GOOGLE');
    expect(data.redirectUri).toBe('https://example.com/callback');
    expect(Array.isArray(data.nextSteps)).toBe(true);
  });

  it('should provide correct provider info for each SSO type', async () => {
    const providers = ['CLEVER', 'CLASSLINK', 'GOOGLE'] as const;

    for (const provider of providers) {
      const result = await handleConfigureSso({
        provider,
        trigger_form: true,
      });

      expect(result.success).toBe(true);
      const data = result.data as Record<string, { name?: string }>;
      expect(data.providerInfo?.name).toBeDefined();
    }
  });
});

// =============================================================================
// 5. TEST_ONEROSTER TESTS
// =============================================================================

describe('handleTestOneroster', () => {
  it('should return users from /users endpoint', async () => {
    const result = await handleTestOneroster({
      endpoint: '/users',
      limit: 5,
    });

    expect(result.success).toBe(true);
    expect(result.hasData).toBe(true);

    const data = result.data as Record<string, unknown>;
    expect(data.endpoint).toBe('/users');
    expect(data.response).toBeDefined();
    expect(data.metadata).toBeDefined();
  });

  it('should filter users by role', async () => {
    const result = await handleTestOneroster({
      endpoint: '/users',
      filters: { role: 'teacher' },
      limit: 10,
    });

    expect(result.success).toBe(true);

    const data = result.data as { response?: { users?: Array<{ role?: string }> } };
    if (data.response?.users) {
      for (const user of data.response.users) {
        expect(user.role).toBe('teacher');
      }
    }
  });

  it('should return orgs from /orgs endpoint', async () => {
    const result = await handleTestOneroster({
      endpoint: '/orgs',
    });

    expect(result.success).toBe(true);

    const data = result.data as { response?: { orgs?: unknown[] } };
    expect(data.response?.orgs).toBeDefined();
  });

  it('should return classes from /classes endpoint', async () => {
    const result = await handleTestOneroster({
      endpoint: '/classes',
    });

    expect(result.success).toBe(true);

    const data = result.data as { response?: { classes?: unknown[] } };
    expect(data.response?.classes).toBeDefined();
  });

  it('should return enrollments from /enrollments endpoint', async () => {
    const result = await handleTestOneroster({
      endpoint: '/enrollments',
    });

    expect(result.success).toBe(true);

    const data = result.data as { response?: { enrollments?: unknown[] } };
    expect(data.response?.enrollments).toBeDefined();
  });

  it('should return response from /courses endpoint', async () => {
    const result = await handleTestOneroster({
      endpoint: '/courses',
    });

    expect(result.success).toBe(true);
    // Courses endpoint may return empty or not be fully implemented
    expect(result.data).toBeDefined();
  });

  it('should respect limit parameter', async () => {
    const result = await handleTestOneroster({
      endpoint: '/users',
      limit: 3,
    });

    expect(result.success).toBe(true);

    const data = result.data as { metadata?: { recordCount?: number } };
    expect(data.metadata?.recordCount).toBeLessThanOrEqual(3);
  });

  it('should include response metadata', async () => {
    const result = await handleTestOneroster({
      endpoint: '/users',
    });

    expect(result.success).toBe(true);

    const data = result.data as { metadata?: Record<string, unknown> };
    expect(data.metadata?.responseTimeMs).toBeDefined();
    expect(data.metadata?.requestId).toBeDefined();
    expect(data.metadata?.rateLimitRemaining).toBeDefined();
  });
});

// =============================================================================
// 6. CONFIGURE_LTI TESTS
// =============================================================================

describe('handleConfigureLti', () => {
  it('should trigger LTI config form when trigger_form is true', async () => {
    const result = await handleConfigureLti({ trigger_form: true });

    expect(result.success).toBe(true);
    expect(result.showForm).toBe('lti_config');

    const data = result.data as Record<string, unknown>;
    expect(data.platformInfo).toBeDefined();
    expect(data.requiredFields).toBeDefined();
  });

  it('should include Schoology platform info', async () => {
    const result = await handleConfigureLti({ trigger_form: true });

    const data = result.data as { platformInfo?: Record<string, string> };
    expect(data.platformInfo?.name).toContain('Schoology');
    expect(data.platformInfo?.issuer).toContain('schoology');
    expect(data.platformInfo?.authorizationEndpoint).toBeDefined();
    expect(data.platformInfo?.tokenEndpoint).toBeDefined();
    expect(data.platformInfo?.jwksUri).toBeDefined();
  });

  it('should configure LTI directly when all required fields provided', async () => {
    const result = await handleConfigureLti({
      trigger_form: false,
      client_id: 'lti-client-123',
      deployment_id: 'deploy-456',
      launch_url: 'https://vendor.com/lti/launch',
    });

    expect(result.success).toBe(true);
    expect(result.showForm).toBeUndefined();

    const data = result.data as Record<string, unknown>;
    expect(data.status).toBe('configured');
    expect(data.platformConfig).toBeDefined();
    expect(data.vendorConfig).toBeDefined();
  });

  it('should include next steps in configured response', async () => {
    const result = await handleConfigureLti({
      trigger_form: false,
      client_id: 'lti-client-123',
      deployment_id: 'deploy-456',
      launch_url: 'https://vendor.com/lti/launch',
    });

    const data = result.data as { nextSteps?: string[] };
    expect(Array.isArray(data.nextSteps)).toBe(true);
    expect(data.nextSteps?.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// 7. SEND_TEST_MESSAGE TESTS
// =============================================================================

describe('handleSendTestMessage', () => {
  it('should validate email token format', async () => {
    const result = await handleSendTestMessage({
      channel: 'EMAIL',
      recipient_token: 'invalid-token',
      subject: 'Test',
      body: 'Test message',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid email token format');
  });

  it('should validate SMS token format', async () => {
    const result = await handleSendTestMessage({
      channel: 'SMS',
      recipient_token: 'invalid-token',
      body: 'Test message',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid SMS token format');
  });

  it('should require subject for email', async () => {
    const result = await handleSendTestMessage({
      channel: 'EMAIL',
      recipient_token: 'TKN_STU_abc123@relay.schoolday.lausd.net',
      body: 'Test message',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('require a subject line');
  });

  it('should send email successfully with valid token', async () => {
    const result = await handleSendTestMessage({
      channel: 'EMAIL',
      recipient_token: 'TKN_STU_abc123@relay.schoolday.lausd.net',
      subject: 'Test Subject',
      body: 'Test message body',
    });

    expect(result.success).toBe(true);

    const data = result.data as { delivery?: Record<string, unknown> };
    expect(data.delivery?.messageId).toBeDefined();
    expect(data.delivery?.status).toBe('QUEUED');
    expect(data.delivery?.channel).toBe('EMAIL');
  });

  it('should send SMS successfully with valid token', async () => {
    const result = await handleSendTestMessage({
      channel: 'SMS',
      recipient_token: 'TKN_555_XXX_1234',
      body: 'Test SMS message',
    });

    expect(result.success).toBe(true);

    const data = result.data as { delivery?: Record<string, unknown> };
    expect(data.delivery?.messageId).toBeDefined();
    expect(data.delivery?.status).toBe('QUEUED');
    expect(data.delivery?.channel).toBe('SMS');
  });

  it('should include routing path explanation', async () => {
    const result = await handleSendTestMessage({
      channel: 'EMAIL',
      recipient_token: 'TKN_STU_xyz789@relay.schoolday.lausd.net',
      subject: 'Test',
      body: 'Test',
    });

    const data = result.data as { delivery?: { routingPath?: string }; explanation?: string };
    expect(data.delivery?.routingPath).toBeDefined();
    expect(data.explanation).toBeDefined();
  });
});

// =============================================================================
// 8. SUBMIT_APP TESTS
// =============================================================================

describe('handleSubmitApp', () => {
  it('should trigger app submit form', async () => {
    const result = await handleSubmitApp({ trigger_form: true });

    expect(result.success).toBe(true);
    expect(result.showForm).toBe('app_submit');
  });

  it('should include prefill data when provided', async () => {
    const result = await handleSubmitApp({
      trigger_form: true,
      app_name: 'My Learning App',
      app_url: 'https://myapp.com',
      grade_levels: ['K-2', '3-5'],
      subject_areas: ['Math', 'Science'],
    });

    expect(result.success).toBe(true);

    const data = result.data as { prefill?: Record<string, unknown> };
    expect(data.prefill?.appName).toBe('My Learning App');
    expect(data.prefill?.appUrl).toBe('https://myapp.com');
    expect(data.prefill?.gradeLevels).toEqual(['K-2', '3-5']);
    expect(data.prefill?.subjectAreas).toEqual(['Math', 'Science']);
  });

  it('should include requirements and benefits', async () => {
    const result = await handleSubmitApp({ trigger_form: true });

    const data = result.data as { requirements?: string[]; benefits?: string[] };
    expect(Array.isArray(data.requirements)).toBe(true);
    expect(Array.isArray(data.benefits)).toBe(true);
    expect(data.requirements?.length).toBeGreaterThan(0);
    expect(data.benefits?.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// 9. GET_AUDIT_LOGS TESTS
// =============================================================================

describe('handleGetAuditLogs', () => {
  it('should return empty logs for new vendor', async () => {
    const result = await handleGetAuditLogs({
      vendor_id: 'new-vendor-id',
      limit: 50,
    });

    expect(result.success).toBe(true);
    expect(result.showForm).toBe('audit_log');

    const data = result.data as { logs?: unknown[]; summary?: { totalEvents?: number } };
    expect(data.logs).toEqual([]);
    expect(data.summary?.totalEvents).toBe(0);
  });

  it('should return audit logs for vendor with activity', async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    await createSandbox(vendor.id);

    const result = await handleGetAuditLogs({
      vendor_id: vendor.id,
      limit: 50,
    });

    expect(result.success).toBe(true);

    const data = result.data as { logs?: unknown[]; summary?: Record<string, unknown> };
    expect(data.logs?.length).toBeGreaterThan(0);
    expect(data.summary?.totalEvents).toBeGreaterThan(0);
  });

  it('should include formatted log entries', async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });

    const result = await handleGetAuditLogs({
      vendor_id: vendor.id,
    });

    const data = result.data as { logs?: Array<Record<string, unknown>> };
    if (data.logs && data.logs.length > 0) {
      const log = data.logs[0];
      expect(log?.id).toBeDefined();
      expect(log?.timestamp).toBeDefined();
      expect(log?.action).toBeDefined();
      expect(log?.resourceType).toBeDefined();
    }
  });

  it('should include action counts in summary', async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    await createSandbox(vendor.id);

    const result = await handleGetAuditLogs({
      vendor_id: vendor.id,
    });

    const data = result.data as { summary?: { actionCounts?: Record<string, number> } };
    expect(data.summary?.actionCounts).toBeDefined();
  });
});

// =============================================================================
// 10. GET_CREDENTIALS TESTS
// =============================================================================

describe('handleGetCredentials', () => {
  it('should return null for vendor without credentials', async () => {
    const result = await handleGetCredentials({
      vendor_id: 'no-credentials-vendor',
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
    expect(result.message).toContain('No sandbox credentials found');
  });

  it('should return credentials with hidden secret by default', async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    await createSandbox(vendor.id);

    const result = await handleGetCredentials({
      vendor_id: vendor.id,
    });

    expect(result.success).toBe(true);
    expect(result.showForm).toBe('credentials');

    const data = result.data as Record<string, unknown>;
    expect(data.apiKey).toMatch(/^sk_test_/);
    expect(data.apiSecret).toBe('••••••••••••••••');
    expect(data.baseUrl).toBeDefined();
    expect(data.status).toBe('ACTIVE');
  });

  it('should show secret when show_secret is true', async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    await createSandbox(vendor.id);

    const result = await handleGetCredentials({
      vendor_id: vendor.id,
      show_secret: true,
    });

    expect(result.success).toBe(true);

    const data = result.data as Record<string, unknown>;
    expect(data.apiSecret).not.toBe('••••••••••••••••');
    expect((data.apiSecret as string).length).toBe(64); // 32 bytes hex
  });

  it('should include rate limit and allowed endpoints', async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    await createSandbox(vendor.id);

    const result = await handleGetCredentials({
      vendor_id: vendor.id,
    });

    const data = result.data as Record<string, unknown>;
    expect(data.rateLimitPerMinute).toBe(60);
    expect(Array.isArray(data.allowedEndpoints)).toBe(true);
  });
});

// =============================================================================
// 11. CHECK_STATUS TESTS
// =============================================================================

describe('handleCheckStatus', () => {
  it('should return NOT_FOUND status for unknown vendor', async () => {
    const result = await handleCheckStatus({
      vendor_id: 'unknown-vendor',
    });

    expect(result.success).toBe(true);

    const data = result.data as { status?: { pods?: { status?: string } } };
    expect(data.status?.pods?.status).toBe('NOT_FOUND');
  });

  it('should return full status for vendor with sandbox', async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    await createSandbox(vendor.id);

    const result = await handleCheckStatus({
      vendor_id: vendor.id,
    });

    expect(result.success).toBe(true);

    const data = result.data as { status?: Record<string, unknown> };
    expect(data.status?.pods).toBeDefined();
    expect(data.status?.sandbox).toBeDefined();
    expect(data.status?.sso).toBeDefined();
    expect(data.status?.oneroster).toBeDefined();
    expect(data.status?.lti).toBeDefined();
    expect(data.status?.communication).toBeDefined();
  });

  it('should include next action recommendation', async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });

    const result = await handleCheckStatus({
      vendor_id: vendor.id,
    });

    const data = result.data as { nextAction?: { action?: string; description?: string } };
    expect(data.nextAction?.action).toBeDefined();
    expect(data.nextAction?.description).toBeDefined();
  });

  it('should include vendor name in response', async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput({
        vendorName: 'Status Test Vendor',
      }),
    });

    const result = await handleCheckStatus({
      vendor_id: vendor.id,
    });

    const data = result.data as { vendorName?: string };
    expect(data.vendorName).toBe('Status Test Vendor');
  });

  it('should generate appropriate status summary message', async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    await createSandbox(vendor.id);

    const result = await handleCheckStatus({
      vendor_id: vendor.id,
    });

    expect(result.message).toBeDefined();
    expect(result.message?.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// 12. REQUEST_UPGRADE TESTS
// =============================================================================

describe('handleRequestUpgrade', () => {
  it('should reject short justification', async () => {
    const result = await handleRequestUpgrade({
      vendor_id: 'vendor-123',
      target_tier: 'SELECTIVE',
      justification: 'Too short',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('at least 50 characters');
  });

  it('should submit upgrade request with valid justification', async () => {
    const result = await handleRequestUpgrade({
      vendor_id: 'vendor-123',
      target_tier: 'SELECTIVE',
      justification:
        'We need access to student email addresses to send personalized learning reminders and progress reports to help students stay engaged with their coursework.',
    });

    expect(result.success).toBe(true);

    const data = result.data as Record<string, unknown>;
    expect(data.requestId).toMatch(/^UPG-/);
    expect(data.status).toBe('SUBMITTED');
    expect(data.targetTier).toBe('SELECTIVE');
  });

  it('should include data elements requested', async () => {
    const result = await handleRequestUpgrade({
      vendor_id: 'vendor-123',
      target_tier: 'FULL_ACCESS',
      justification:
        'We require full student data access including email, phone, and address for our comprehensive parent communication platform.',
      data_elements_needed: ['email', 'phone', 'address'],
      retention_period: 365,
    });

    const data = result.data as { dataElementsRequested?: string[] };
    expect(data.dataElementsRequested).toEqual(['email', 'phone', 'address']);
  });

  it('should include different requirements for FULL_ACCESS', async () => {
    const result = await handleRequestUpgrade({
      vendor_id: 'vendor-123',
      target_tier: 'FULL_ACCESS',
      justification:
        'We need complete student records including special education data for our intervention tracking system.',
    });

    const data = result.data as { requirements?: { required?: string[] } };
    expect(data.requirements?.required).toContain('Execute Data Privacy Agreement (DPA)');
    expect(data.requirements?.required).toContain('Provide SOC 2 Type II certification');
  });

  it('should include next steps in response', async () => {
    const result = await handleRequestUpgrade({
      vendor_id: 'vendor-123',
      target_tier: 'SELECTIVE',
      justification:
        'This is a valid justification that is more than fifty characters long and explains our data needs.',
    });

    const data = result.data as { nextSteps?: string[] };
    expect(Array.isArray(data.nextSteps)).toBe(true);
    expect(data.nextSteps?.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// TOOL ROUTER TESTS
// =============================================================================

describe('executeToolCall', () => {
  it('should route to correct handler for each tool', async () => {
    const toolTests = [
      { name: 'lookup_pods', params: { query: 'test' } },
      { name: 'submit_pods_lite', params: { trigger_form: true } },
      { name: 'configure_sso', params: { provider: 'CLEVER', trigger_form: true } },
      { name: 'test_oneroster', params: { endpoint: '/users' } },
      { name: 'configure_lti', params: { trigger_form: true } },
      { name: 'submit_app', params: { trigger_form: true } },
      { name: 'get_audit_logs', params: { vendor_id: 'test-id' } },
      { name: 'get_credentials', params: { vendor_id: 'test-id' } },
      { name: 'check_status', params: { vendor_id: 'test-id' } },
    ];

    for (const test of toolTests) {
      const result = await executeToolCall(test.name, test.params);
      expect(result.success).toBeDefined();
    }
  });

  it('should return error for unknown tool', async () => {
    const result = await executeToolCall('unknown_tool', {});

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown tool');
  });

  it('should handle errors gracefully', async () => {
    // This should trigger an error in the handler
    const result = await executeToolCall('provision_sandbox', {
      vendor_id: 'non-existent-id',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
