/**
 * BUG-002: Sandbox Endpoints Tests
 *
 * Tests to verify that sandbox provisioning honors vendor's selected OneRoster resources.
 *
 * Root Cause: createSandbox() hardcodes allowedEndpoints at lib/db/index.ts:252
 *             instead of accepting vendor's resource selection.
 *
 * These tests follow TDD - they will FAIL until the fix is implemented.
 *
 * @module tests/bug-002/sandbox-endpoints
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createVendor,
  createSandbox,
  getSandbox,
  clearAllStores,
} from '@/lib/db';
import {
  handleProvisionSandbox,
  handleSubmitPodsLite,
  executeToolCall,
} from '@/lib/ai/handlers';
import type { PodsLiteInput } from '@/lib/types';

// =============================================================================
// FIXTURES
// =============================================================================

/**
 * OneRoster resource to endpoint mapping
 * This is the expected mapping that should be implemented
 */
const ONEROSTER_RESOURCE_TO_ENDPOINT: Record<string, string> = {
  users: '/users',
  classes: '/classes',
  courses: '/courses',
  enrollments: '/enrollments',
  orgs: '/orgs',
  academicSessions: '/academicSessions',
  demographics: '/demographics',
};

/**
 * All available OneRoster resources
 */
const ALL_ONEROSTER_RESOURCES = [
  'users',
  'classes',
  'courses',
  'enrollments',
  'orgs',
  'academicSessions',
  'demographics',
];

/**
 * Default endpoints (current hardcoded behavior)
 */
const DEFAULT_ENDPOINTS = ['/users', '/orgs', '/classes', '/enrollments', '/courses'];

/**
 * Creates a valid PoDS-Lite input for testing
 */
function createMockPodsLiteInput(overrides: Partial<PodsLiteInput> = {}): PodsLiteInput {
  return {
    vendorName: 'Test EdTech Vendor',
    contactEmail: 'test@vendor.com',
    contactName: 'Test User',
    contactPhone: '555-0100',
    applicationName: 'Test Learning App',
    applicationDescription: 'A test application for unit testing',
    dataElementsRequested: ['STUDENT_ID', 'FIRST_NAME', 'GRADE_LEVEL'],
    dataPurpose: 'Testing purposes only',
    dataRetentionDays: 365,
    integrationMethod: 'ONEROSTER_API',
    thirdPartySharing: false,
    thirdPartyDetails: undefined,
    hasSOC2: true,
    hasFERPACertification: true,
    encryptsDataAtRest: true,
    encryptsDataInTransit: true,
    breachNotificationHours: 24,
    coppaCompliant: true,
    acceptsTerms: true,
    acceptsDataDeletion: true,
    ...overrides,
  };
}

// =============================================================================
// TEST SETUP
// =============================================================================

beforeEach(async () => {
  await clearAllStores();
});

// =============================================================================
// UNIT TESTS: createSandbox() with custom endpoints
// =============================================================================

describe('BUG-002: createSandbox() with custom endpoints', () => {
  describe('when requestedEndpoints parameter is provided', () => {
    it('should use the provided endpoints instead of defaults', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const requestedEndpoints = ['/users', '/classes', '/academicSessions'];

      // Act
      const sandbox = await createSandbox(vendor.id, requestedEndpoints);

      // Assert
      expect(sandbox.allowedEndpoints).toEqual(requestedEndpoints);
      expect(sandbox.allowedEndpoints).not.toEqual(DEFAULT_ENDPOINTS);
    });

    it('should include /academicSessions when requested', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const requestedEndpoints = ['/users', '/academicSessions'];

      // Act
      const sandbox = await createSandbox(vendor.id, requestedEndpoints);

      // Assert
      expect(sandbox.allowedEndpoints).toContain('/academicSessions');
    });

    it('should include /demographics when requested', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const requestedEndpoints = ['/users', '/demographics'];

      // Act
      const sandbox = await createSandbox(vendor.id, requestedEndpoints);

      // Assert
      expect(sandbox.allowedEndpoints).toContain('/demographics');
    });

    it('should include all 7 endpoints when all resources requested', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const allEndpoints = ALL_ONEROSTER_RESOURCES.map(
        (r) => ONEROSTER_RESOURCE_TO_ENDPOINT[r]
      );

      // Act
      const sandbox = await createSandbox(vendor.id, allEndpoints);

      // Assert
      expect(sandbox.allowedEndpoints).toHaveLength(7);
      expect(sandbox.allowedEndpoints).toContain('/users');
      expect(sandbox.allowedEndpoints).toContain('/classes');
      expect(sandbox.allowedEndpoints).toContain('/courses');
      expect(sandbox.allowedEndpoints).toContain('/enrollments');
      expect(sandbox.allowedEndpoints).toContain('/orgs');
      expect(sandbox.allowedEndpoints).toContain('/academicSessions');
      expect(sandbox.allowedEndpoints).toContain('/demographics');
    });

    it('should preserve endpoint order as provided', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const orderedEndpoints = ['/demographics', '/users', '/academicSessions'];

      // Act
      const sandbox = await createSandbox(vendor.id, orderedEndpoints);

      // Assert
      expect(sandbox.allowedEndpoints).toEqual(orderedEndpoints);
    });

    it('should handle single endpoint request', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const singleEndpoint = ['/users'];

      // Act
      const sandbox = await createSandbox(vendor.id, singleEndpoint);

      // Assert
      expect(sandbox.allowedEndpoints).toEqual(['/users']);
      expect(sandbox.allowedEndpoints).toHaveLength(1);
    });
  });

  describe('backward compatibility: when requestedEndpoints is not provided', () => {
    it('should use default endpoints when no parameter provided', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      // Act - call without second parameter (backward compatible)
      const sandbox = await createSandbox(vendor.id);

      // Assert - should still work with defaults
      expect(sandbox.allowedEndpoints).toEqual(DEFAULT_ENDPOINTS);
    });

    it('should use default endpoints when undefined is passed', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      // Act
      const sandbox = await createSandbox(vendor.id, undefined);

      // Assert
      expect(sandbox.allowedEndpoints).toEqual(DEFAULT_ENDPOINTS);
    });

    it('should use default endpoints when empty array is passed', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      // Act
      const sandbox = await createSandbox(vendor.id, []);

      // Assert - should fall back to defaults for empty array
      expect(sandbox.allowedEndpoints).toEqual(DEFAULT_ENDPOINTS);
    });
  });

  describe('endpoint validation', () => {
    it('should only allow valid OneRoster endpoints', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const invalidEndpoints = ['/users', '/invalid-endpoint', '/classes'];

      // Act & Assert - should either filter invalid or throw
      // Implementation can choose either approach
      const sandbox = await createSandbox(vendor.id, invalidEndpoints);

      // Should not contain invalid endpoint
      expect(sandbox.allowedEndpoints).not.toContain('/invalid-endpoint');
      // Should contain valid endpoints
      expect(sandbox.allowedEndpoints).toContain('/users');
      expect(sandbox.allowedEndpoints).toContain('/classes');
    });
  });

  describe('persisted sandbox reflects custom endpoints', () => {
    it('should persist custom endpoints when retrieved via getSandbox', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const requestedEndpoints = ['/users', '/academicSessions', '/demographics'];

      // Act
      await createSandbox(vendor.id, requestedEndpoints);
      const retrievedSandbox = await getSandbox(vendor.id);

      // Assert
      expect(retrievedSandbox).not.toBeNull();
      expect(retrievedSandbox?.allowedEndpoints).toEqual(requestedEndpoints);
    });
  });
});

// =============================================================================
// UNIT TESTS: handleProvisionSandbox() with requested resources
// =============================================================================

describe('BUG-002: handleProvisionSandbox() with requested resources', () => {
  describe('when requested_resources is provided', () => {
    it('should pass requested resources to createSandbox', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const requestedResources = ['users', 'classes', 'academicSessions'];

      // Act
      const result = await handleProvisionSandbox({
        vendor_id: vendor.id,
        requested_resources: requestedResources,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const data = result.data as { allowedEndpoints?: string[] };
      expect(data.allowedEndpoints).toContain('/users');
      expect(data.allowedEndpoints).toContain('/classes');
      expect(data.allowedEndpoints).toContain('/academicSessions');
    });

    it('should map resource names to endpoint paths', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      // Act
      const result = await handleProvisionSandbox({
        vendor_id: vendor.id,
        requested_resources: ['academicSessions', 'demographics'],
      });

      // Assert
      expect(result.success).toBe(true);
      const data = result.data as { allowedEndpoints?: string[] };
      expect(data.allowedEndpoints).toContain('/academicSessions');
      expect(data.allowedEndpoints).toContain('/demographics');
    });

    it('should include all 7 endpoints when all resources requested', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      // Act
      const result = await handleProvisionSandbox({
        vendor_id: vendor.id,
        requested_resources: ALL_ONEROSTER_RESOURCES,
      });

      // Assert
      expect(result.success).toBe(true);
      const data = result.data as { allowedEndpoints?: string[] };
      expect(data.allowedEndpoints).toHaveLength(7);
    });
  });

  describe('backward compatibility', () => {
    it('should work without requested_resources (default behavior)', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      // Act - call without requested_resources
      const result = await handleProvisionSandbox({
        vendor_id: vendor.id,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const data = result.data as { allowedEndpoints?: string[] };
      expect(data.allowedEndpoints).toEqual(DEFAULT_ENDPOINTS);
    });
  });

  describe('existing sandbox behavior', () => {
    it('should return existing sandbox endpoints unchanged', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      // Create sandbox with specific endpoints
      await createSandbox(vendor.id, ['/users', '/academicSessions']);

      // Act - request provision again with different resources
      const result = await handleProvisionSandbox({
        vendor_id: vendor.id,
        requested_resources: ['classes', 'courses'],
      });

      // Assert - should return existing sandbox, not create new one
      expect(result.success).toBe(true);
      const data = result.data as { existing?: boolean; allowedEndpoints?: string[] };
      expect(data.existing).toBe(true);
      // Should have original endpoints, not new request
      expect(data.allowedEndpoints).toContain('/users');
      expect(data.allowedEndpoints).toContain('/academicSessions');
    });
  });
});

// =============================================================================
// INTEGRATION TESTS: Full flow from form to sandbox
// =============================================================================

describe('BUG-002: Integration - Form to Sandbox flow', () => {
  describe('Workflow 1: Vendor onboarding with all OneRoster resources', () => {
    it('should provision sandbox with all requested resources from PoDS-Lite', async () => {
      // Step 1: Submit PoDS-Lite with all OneRoster resources selected
      const podsResult = await handleSubmitPodsLite({
        vendorName: 'Full Integration Vendor',
        contactEmail: 'full@vendor.com',
        contactName: 'Test User',
        appDescription: 'Full integration test app',
        dataElements: ['STUDENT_ID', 'FIRST_NAME', 'GRADE_LEVEL'],
        dataPurpose: 'Comprehensive student rostering',
        dataRetention: '365',
        integrationMethod: 'API',
        thirdPartySharing: false,
        encryption: true,
        coppaCompliant: true,
        termsAccepted: true,
        // Simulating OneRoster resource selection (all 7)
        oneRosterResources: ALL_ONEROSTER_RESOURCES,
      });

      expect(podsResult.success).toBe(true);
      const podsData = podsResult.data as { vendorId?: string };
      expect(podsData.vendorId).toBeDefined();

      // Step 2: Provision sandbox with the selected resources
      const sandboxResult = await handleProvisionSandbox({
        vendor_id: podsData.vendorId!,
        requested_resources: ALL_ONEROSTER_RESOURCES,
      });

      expect(sandboxResult.success).toBe(true);

      // Step 3: Verify all 7 endpoints are in the sandbox
      const sandboxData = sandboxResult.data as { allowedEndpoints?: string[] };
      expect(sandboxData.allowedEndpoints).toHaveLength(7);
      expect(sandboxData.allowedEndpoints).toContain('/users');
      expect(sandboxData.allowedEndpoints).toContain('/classes');
      expect(sandboxData.allowedEndpoints).toContain('/courses');
      expect(sandboxData.allowedEndpoints).toContain('/enrollments');
      expect(sandboxData.allowedEndpoints).toContain('/orgs');
      expect(sandboxData.allowedEndpoints).toContain('/academicSessions');
      expect(sandboxData.allowedEndpoints).toContain('/demographics');
    });

    it('should provision sandbox with subset of resources', async () => {
      // Step 1: Submit PoDS-Lite
      const podsResult = await handleSubmitPodsLite({
        vendorName: 'Partial Resources Vendor',
        contactEmail: 'partial@vendor.com',
        contactName: 'Test User',
        appDescription: 'Partial resources test',
        dataElements: ['STUDENT_ID', 'FIRST_NAME'],
        dataPurpose: 'Limited rostering',
        dataRetention: '365',
        integrationMethod: 'API',
        thirdPartySharing: false,
        encryption: true,
        coppaCompliant: true,
        termsAccepted: true,
        oneRosterResources: ['users', 'classes', 'enrollments'],
      });

      expect(podsResult.success).toBe(true);
      const podsData = podsResult.data as { vendorId?: string };

      // Step 2: Provision with only selected resources
      const sandboxResult = await handleProvisionSandbox({
        vendor_id: podsData.vendorId!,
        requested_resources: ['users', 'classes', 'enrollments'],
      });

      expect(sandboxResult.success).toBe(true);

      // Step 3: Verify only requested endpoints
      const sandboxData = sandboxResult.data as { allowedEndpoints?: string[] };
      expect(sandboxData.allowedEndpoints).toHaveLength(3);
      expect(sandboxData.allowedEndpoints).toContain('/users');
      expect(sandboxData.allowedEndpoints).toContain('/classes');
      expect(sandboxData.allowedEndpoints).toContain('/enrollments');
      // Should NOT contain unrequested endpoints
      expect(sandboxData.allowedEndpoints).not.toContain('/academicSessions');
      expect(sandboxData.allowedEndpoints).not.toContain('/demographics');
    });
  });

  describe('executeToolCall integration', () => {
    it('should support requested_resources in provision_sandbox tool call', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      // Act - use executeToolCall to simulate AI tool invocation
      const result = await executeToolCall('provision_sandbox', {
        vendor_id: vendor.id,
        requested_resources: ['users', 'academicSessions', 'demographics'],
      });

      // Assert
      expect(result.success).toBe(true);
      const data = result.data as { allowedEndpoints?: string[] };
      expect(data.allowedEndpoints).toContain('/users');
      expect(data.allowedEndpoints).toContain('/academicSessions');
      expect(data.allowedEndpoints).toContain('/demographics');
    });
  });
});

// =============================================================================
// EDGE CASES & ERROR HANDLING
// =============================================================================

describe('BUG-002: Edge cases and error handling', () => {
  describe('invalid resource names', () => {
    it('should ignore invalid resource names', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      // Act - include some invalid resource names
      const result = await handleProvisionSandbox({
        vendor_id: vendor.id,
        requested_resources: ['users', 'invalid_resource', 'classes', 'fake_endpoint'],
      });

      // Assert - should only include valid resources
      expect(result.success).toBe(true);
      const data = result.data as { allowedEndpoints?: string[] };
      expect(data.allowedEndpoints).toContain('/users');
      expect(data.allowedEndpoints).toContain('/classes');
      expect(data.allowedEndpoints).not.toContain('/invalid_resource');
      expect(data.allowedEndpoints).not.toContain('/fake_endpoint');
    });
  });

  describe('duplicate resources', () => {
    it('should handle duplicate resource names gracefully', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      // Act - include duplicates
      const result = await handleProvisionSandbox({
        vendor_id: vendor.id,
        requested_resources: ['users', 'users', 'classes', 'classes', 'users'],
      });

      // Assert - should deduplicate
      expect(result.success).toBe(true);
      const data = result.data as { allowedEndpoints?: string[] };
      const usersCount = data.allowedEndpoints?.filter((e) => e === '/users').length;
      expect(usersCount).toBe(1);
    });
  });

  describe('case sensitivity', () => {
    it('should handle case variations in resource names', async () => {
      // Arrange
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      // Act - mixed case
      const result = await handleProvisionSandbox({
        vendor_id: vendor.id,
        requested_resources: ['Users', 'CLASSES', 'academicsessions'],
      });

      // Assert - should normalize to correct format
      expect(result.success).toBe(true);
      const data = result.data as { allowedEndpoints?: string[] };
      // Should include the resources regardless of case
      expect(
        data.allowedEndpoints?.some((e) => e.toLowerCase() === '/users')
      ).toBe(true);
      expect(
        data.allowedEndpoints?.some((e) => e.toLowerCase() === '/classes')
      ).toBe(true);
    });
  });

  describe('resource-endpoint mapping correctness', () => {
    const resourceEndpointPairs = [
      ['users', '/users'],
      ['classes', '/classes'],
      ['courses', '/courses'],
      ['enrollments', '/enrollments'],
      ['orgs', '/orgs'],
      ['academicSessions', '/academicSessions'],
      ['demographics', '/demographics'],
    ];

    resourceEndpointPairs.forEach(([resource, endpoint]) => {
      it(`should correctly map '${resource}' to '${endpoint}'`, async () => {
        // Arrange
        const vendor = await createVendor({
          podsLiteInput: createMockPodsLiteInput(),
        });

        // Act
        const result = await handleProvisionSandbox({
          vendor_id: vendor.id,
          requested_resources: [resource],
        });

        // Assert
        expect(result.success).toBe(true);
        const data = result.data as { allowedEndpoints?: string[] };
        expect(data.allowedEndpoints).toContain(endpoint);
      });
    });
  });
});

// =============================================================================
// REGRESSION TESTS
// =============================================================================

describe('BUG-002: Regression tests', () => {
  it('should not break existing sandbox creation flow', async () => {
    // This test ensures the fix doesn't break existing functionality
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });

    // Original flow without requested_resources
    const result = await handleProvisionSandbox({
      vendor_id: vendor.id,
    });

    expect(result.success).toBe(true);
    expect(result.showForm).toBe('credentials');
    expect(result.data).toBeDefined();

    const data = result.data as Record<string, unknown>;
    expect(data.apiKey).toBeDefined();
    expect(data.baseUrl).toBeDefined();
    expect(data.environment).toBe('sandbox');
    expect(Array.isArray(data.allowedEndpoints)).toBe(true);
  });

  it('should still validate vendor exists before creating sandbox', async () => {
    const result = await handleProvisionSandbox({
      vendor_id: 'non-existent-vendor',
      requested_resources: ['users', 'classes'],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Vendor not found');
  });

  it('should still require vendor to be approved', async () => {
    // Create vendor with sensitive data (triggers PENDING_REVIEW)
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput({
        dataElementsRequested: ['STUDENT_ID', 'EMAIL', 'PHONE'],
      }),
    });

    const result = await handleProvisionSandbox({
      vendor_id: vendor.id,
      requested_resources: ['users', 'classes'],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('must be approved');
  });
});
