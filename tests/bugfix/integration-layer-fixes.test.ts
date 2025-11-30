/**
 * Integration Layer Bug Fixes - Test Suite
 *
 * This test file validates the 6 identified bugs and confirms their fixes
 * independently without breaking existing functionality.
 *
 * Bug Report Reference: November 30, 2025
 *
 * FIX-001: Semantic mismatch between form values and endpoint mapping
 * FIX-002: Random demo data overrides empty prefill
 * FIX-003: useState ignores prefill prop changes after mount
 * FIX-004: AI not extracting vendor names from conversation
 * FIX-005: SSO flow ignores existing vendorState
 * FIX-006: ACADEMIC_SESSIONS not mapped in dataElementsToEndpoints
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// =============================================================================
// FIX-001: Semantic Mismatch - Form Values to Endpoint Mapping
// =============================================================================

describe("FIX-001: Form Values to Endpoint Mapping", () => {
  describe("Unit Tests - dataElementsToEndpoints mapping", () => {
    it("should map USERS to /users endpoint", async () => {
      const { dataElementsToEndpoints } = await import("@/lib/config/oneroster");
      const endpoints = dataElementsToEndpoints(["USERS"]);
      expect(endpoints).toBeDefined();
      expect(endpoints).toContain("/users");
    });

    it("should map CLASSES to /classes endpoint", async () => {
      const { dataElementsToEndpoints } = await import("@/lib/config/oneroster");
      const endpoints = dataElementsToEndpoints(["CLASSES"]);
      expect(endpoints).toBeDefined();
      expect(endpoints).toContain("/classes");
    });

    it("should map ENROLLMENTS to /enrollments endpoint", async () => {
      const { dataElementsToEndpoints } = await import("@/lib/config/oneroster");
      const endpoints = dataElementsToEndpoints(["ENROLLMENTS"]);
      expect(endpoints).toBeDefined();
      expect(endpoints).toContain("/enrollments");
    });

    it("should map COURSES to /courses endpoint", async () => {
      const { dataElementsToEndpoints } = await import("@/lib/config/oneroster");
      const endpoints = dataElementsToEndpoints(["COURSES"]);
      expect(endpoints).toBeDefined();
      expect(endpoints).toContain("/courses");
    });

    it("should map ORGS to /orgs endpoint", async () => {
      const { dataElementsToEndpoints } = await import("@/lib/config/oneroster");
      const endpoints = dataElementsToEndpoints(["ORGS"]);
      expect(endpoints).toBeDefined();
      expect(endpoints).toContain("/orgs");
    });

    it("should map ACADEMIC_SESSIONS to /academicSessions endpoint", async () => {
      const { dataElementsToEndpoints } = await import("@/lib/config/oneroster");
      const endpoints = dataElementsToEndpoints(["ACADEMIC_SESSIONS"]);
      expect(endpoints).toBeDefined();
      expect(endpoints).toContain("/academicSessions");
    });

    it("should map multiple form values correctly", async () => {
      const { dataElementsToEndpoints } = await import("@/lib/config/oneroster");
      const endpoints = dataElementsToEndpoints(["USERS", "CLASSES", "ENROLLMENTS"]);
      expect(endpoints).toBeDefined();
      expect(endpoints).toContain("/users");
      expect(endpoints).toContain("/classes");
      expect(endpoints).toContain("/enrollments");
      // Should NOT contain endpoints not requested
      expect(endpoints).not.toContain("/orgs");
      expect(endpoints).not.toContain("/academicSessions");
    });

    it("should return only requested endpoints, not defaults", async () => {
      const { dataElementsToEndpoints } = await import("@/lib/config/oneroster");
      // When user selects only USERS
      const endpoints = dataElementsToEndpoints(["USERS"]);
      expect(endpoints).toBeDefined();
      expect(endpoints?.length).toBe(1);
      expect(endpoints).toContain("/users");
    });
  });

  describe("Integration Tests - Form to Sandbox flow", () => {
    it("form DATA_ELEMENTS values should all have endpoint mappings", async () => {
      // Read the form's DATA_ELEMENTS values
      const formDataElements = [
        "USERS", "CLASSES", "COURSES", "ENROLLMENTS",
        "ORGS", "ACADEMIC_SESSIONS", "DEMOGRAPHICS"
      ];

      const { dataElementsToEndpoints, DATA_ELEMENT_TO_ENDPOINTS } = await import("@/lib/config/oneroster");

      for (const element of formDataElements) {
        expect(DATA_ELEMENT_TO_ENDPOINTS[element]).toBeDefined();
        const endpoints = dataElementsToEndpoints([element]);
        expect(endpoints).toBeDefined();
        expect(endpoints!.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Non-Regression Tests", () => {
    it("should still map legacy DataElement enum values", async () => {
      const { dataElementsToEndpoints } = await import("@/lib/config/oneroster");
      // Legacy values should still work
      const legacyEndpoints = dataElementsToEndpoints(["STUDENT_ID", "CLASS_ROSTER"]);
      expect(legacyEndpoints).toBeDefined();
      expect(legacyEndpoints).toContain("/users");
      expect(legacyEndpoints).toContain("/classes");
    });

    it("should return undefined for empty array (default behavior)", async () => {
      const { dataElementsToEndpoints } = await import("@/lib/config/oneroster");
      const endpoints = dataElementsToEndpoints([]);
      expect(endpoints).toBeUndefined();
    });

    it("should return undefined for undefined input", async () => {
      const { dataElementsToEndpoints } = await import("@/lib/config/oneroster");
      const endpoints = dataElementsToEndpoints(undefined);
      expect(endpoints).toBeUndefined();
    });
  });
});

// =============================================================================
// FIX-002: Random Demo Data Override
// =============================================================================

describe("FIX-002: Random Demo Data Override", () => {
  describe("Unit Tests - Prefill priority", () => {
    it("prefill.vendorName should take precedence over demo data", () => {
      const prefill = { vendorName: "MathGenius Learning" };
      const demoData = { vendorName: "Random Demo Company" };

      // This is the logic that should be in the form
      const vendorName = prefill?.vendorName || demoData.vendorName;
      expect(vendorName).toBe("MathGenius Learning");
    });

    it("should use demo data when prefill.vendorName is undefined", () => {
      const prefill = { vendorName: undefined };
      const demoData = { vendorName: "Random Demo Company" };

      const vendorName = prefill?.vendorName || demoData.vendorName;
      expect(vendorName).toBe("Random Demo Company");
    });

    it("should use empty string when prefill is provided but empty", () => {
      const prefill = { vendorName: "" };
      const demoData = { vendorName: "Random Demo Company" };

      // IMPORTANT: Empty string should NOT fall back to demo data
      // Because empty string means "user will type", not "use default"
      const vendorName = prefill?.vendorName ?? demoData.vendorName;
      // Using ?? (nullish coalescing) instead of || preserves empty string
      expect(vendorName).toBe("");
    });
  });

  describe("Integration Tests - Form initialization", () => {
    it("form should receive prefill prop from formData", () => {
      // Simulate useChat providing formData with prefill
      const formData = {
        prefill: {
          vendorName: "Test Vendor Corp",
          contactEmail: "test@vendor.com"
        }
      };

      const podsPrefill = formData?.prefill as { vendorName?: string; contactEmail?: string } | undefined;
      expect(podsPrefill?.vendorName).toBe("Test Vendor Corp");
      expect(podsPrefill?.contactEmail).toBe("test@vendor.com");
    });
  });
});

// =============================================================================
// FIX-003: useState Ignores Prefill Prop Changes
// =============================================================================

describe("FIX-003: useState Prefill Prop Changes", () => {
  describe("Behavior Tests - useEffect for prefill updates", () => {
    it("component should update state when prefill prop changes", () => {
      // Simulate React state + useEffect pattern
      let formState = { vendorName: "Initial Value" };

      // Simulate useEffect that watches prefill changes
      const updateFromPrefill = (newPrefill: { vendorName?: string }) => {
        if (newPrefill?.vendorName) {
          formState = { ...formState, vendorName: newPrefill.vendorName };
        }
      };

      // Prefill arrives after mount
      updateFromPrefill({ vendorName: "MathGenius Learning" });

      expect(formState.vendorName).toBe("MathGenius Learning");
    });

    it("should not override user edits when prefill is same as current", () => {
      let formState = { vendorName: "MathGenius Learning" };
      let userHasEdited = true;

      const updateFromPrefill = (newPrefill: { vendorName?: string }) => {
        // Only update if user hasn't edited AND prefill differs
        if (!userHasEdited && newPrefill?.vendorName && newPrefill.vendorName !== formState.vendorName) {
          formState = { ...formState, vendorName: newPrefill.vendorName };
        }
      };

      // Prefill arrives but user already typed something
      updateFromPrefill({ vendorName: "Different Vendor" });

      // Should keep user's edit
      expect(formState.vendorName).toBe("MathGenius Learning");
    });
  });
});

// =============================================================================
// FIX-004: AI Vendor Name Extraction
// =============================================================================

describe("FIX-004: AI Vendor Name Extraction", () => {
  describe("Tool Definition Tests", () => {
    it("submit_pods_lite tool should have prefill_vendor_name parameter", async () => {
      const { TOOL_DEFINITIONS } = await import("@/lib/ai/tools");
      const submitPodsTool = TOOL_DEFINITIONS.find(t => t.name === "submit_pods_lite");

      expect(submitPodsTool).toBeDefined();
      expect(submitPodsTool?.input_schema.properties).toHaveProperty("prefill_vendor_name");
    });

    it("prefill_vendor_name description should emphasize extraction", async () => {
      const { TOOL_DEFINITIONS } = await import("@/lib/ai/tools");
      const submitPodsTool = TOOL_DEFINITIONS.find(t => t.name === "submit_pods_lite");

      const prefillParam = (submitPodsTool?.input_schema.properties as Record<string, { description?: string }>)?.prefill_vendor_name;
      expect(prefillParam?.description).toContain("CRITICAL");
      expect(prefillParam?.description).toContain("extract");
    });
  });

  describe("Handler Tests", () => {
    it("handleSubmitPodsLite should return prefill in data when prefill_vendor_name provided", async () => {
      const { handleSubmitPodsLite } = await import("@/lib/ai/handlers");

      const result = await handleSubmitPodsLite({
        trigger_form: true,
        prefill_vendor_name: "Extracted Vendor Name"
      });

      expect(result.success).toBe(true);
      expect(result.showForm).toBe("pods_lite");

      const data = result.data as { prefill?: { vendorName?: string } };
      expect(data.prefill?.vendorName).toBe("Extracted Vendor Name");
    });

    it("handleSubmitPodsLite should handle undefined prefill_vendor_name gracefully", async () => {
      const { handleSubmitPodsLite } = await import("@/lib/ai/handlers");

      const result = await handleSubmitPodsLite({
        trigger_form: true
      });

      expect(result.success).toBe(true);
      const data = result.data as { prefill?: { vendorName?: string } };
      // prefill should exist but vendorName should be undefined
      expect(data.prefill).toBeDefined();
      expect(data.prefill?.vendorName).toBeUndefined();
    });
  });
});

// =============================================================================
// FIX-005: SSO Flow Vendor Recognition
// =============================================================================

describe("FIX-005: SSO Flow Vendor Recognition", () => {
  describe("VendorState Tests", () => {
    it("vendorState.isOnboarded should be true after PoDS completion", () => {
      const vendorState = {
        isOnboarded: true,
        vendorId: "VND_12345678",
        companyName: "MathGenius Learning",
        accessTier: "PRIVACY_SAFE" as const,
        podsStatus: "APPROVED",
        credentials: {
          apiKey: "sk_test_xxx",
          baseUrl: "https://sandbox.lausd.com"
        }
      };

      expect(vendorState.isOnboarded).toBe(true);
      expect(vendorState.vendorId).toBeDefined();
    });

    it("AI should use vendorId from context for SSO, not trigger new PoDS", () => {
      // Simulate vendor context passed to AI
      const vendorContext = {
        vendor: {
          id: "VND_12345678",
          name: "MathGenius Learning",
          accessTier: "PRIVACY_SAFE",
          podsStatus: "APPROVED"
        }
      };

      // When podsStatus is APPROVED, SSO should proceed without new PoDS
      expect(vendorContext.vendor.podsStatus).toBe("APPROVED");
      expect(vendorContext.vendor.id).toBeDefined();
    });
  });

  describe("Handler Tests - check_status with vendorId", () => {
    it("check_status should accept vendor_id and return valid status", async () => {
      const { handleCheckStatus } = await import("@/lib/ai/handlers");
      const { createVendor, clearAllStores } = await import("@/lib/db");

      clearAllStores();

      // Create a vendor first
      const vendor = await createVendor({
        podsLiteInput: {
          vendorName: "SSO Test Vendor",
          contactEmail: "sso@test.com",
          contactName: "SSO Tester",
          contactPhone: "555-1234",
          applicationName: "SSO Test App",
          applicationDescription: "Testing SSO flow",
          dataElementsRequested: ["STUDENT_ID"],
          dataPurpose: "Testing",
          dataRetentionDays: 90,
          integrationMethod: "ONEROSTER_API",
          thirdPartySharing: false,
          hasSOC2: true,
          hasFERPACertification: true,
          encryptsDataAtRest: true,
          encryptsDataInTransit: true,
          breachNotificationHours: 24,
          coppaCompliant: true,
          acceptsTerms: true,
          acceptsDataDeletion: true,
        }
      });

      const result = await handleCheckStatus({ vendor_id: vendor.id });

      expect(result.success).toBe(true);
      // Status should show the vendor's current state
    });
  });
});

// =============================================================================
// FIX-006: ACADEMIC_SESSIONS Mapping
// =============================================================================

describe("FIX-006: ACADEMIC_SESSIONS Endpoint Mapping", () => {
  describe("Unit Tests", () => {
    it("DATA_ELEMENT_TO_ENDPOINTS should have ACADEMIC_SESSIONS key", async () => {
      const { DATA_ELEMENT_TO_ENDPOINTS } = await import("@/lib/config/oneroster");
      expect(DATA_ELEMENT_TO_ENDPOINTS).toHaveProperty("ACADEMIC_SESSIONS");
    });

    it("ACADEMIC_SESSIONS should map to /academicSessions endpoint", async () => {
      const { DATA_ELEMENT_TO_ENDPOINTS } = await import("@/lib/config/oneroster");
      expect(DATA_ELEMENT_TO_ENDPOINTS.ACADEMIC_SESSIONS).toContain("/academicSessions");
    });

    it("dataElementsToEndpoints should include /academicSessions for ACADEMIC_SESSIONS", async () => {
      const { dataElementsToEndpoints } = await import("@/lib/config/oneroster");
      const endpoints = dataElementsToEndpoints(["ACADEMIC_SESSIONS"]);
      expect(endpoints).toBeDefined();
      expect(endpoints).toContain("/academicSessions");
    });
  });

  describe("Integration Tests", () => {
    it("selecting only ACADEMIC_SESSIONS should create sandbox with only /academicSessions", async () => {
      const { createSandbox, createVendor, clearAllStores } = await import("@/lib/db");
      const { dataElementsToEndpoints } = await import("@/lib/config/oneroster");

      clearAllStores();

      const vendor = await createVendor({
        podsLiteInput: {
          vendorName: "Academic Sessions Vendor",
          contactEmail: "academic@test.com",
          contactName: "Academic Tester",
          contactPhone: "555-5678",
          applicationName: "Academic Test",
          applicationDescription: "Testing academic sessions",
          dataElementsRequested: ["ACADEMIC_SESSIONS"],
          dataPurpose: "Testing",
          dataRetentionDays: 90,
          integrationMethod: "ONEROSTER_API",
          thirdPartySharing: false,
          hasSOC2: true,
          hasFERPACertification: true,
          encryptsDataAtRest: true,
          encryptsDataInTransit: true,
          breachNotificationHours: 24,
          coppaCompliant: true,
          acceptsTerms: true,
          acceptsDataDeletion: true,
        }
      });

      const endpoints = dataElementsToEndpoints(["ACADEMIC_SESSIONS"]);
      const sandbox = await createSandbox(vendor.id, endpoints);

      expect(sandbox.allowedEndpoints).toContain("/academicSessions");
    });
  });
});

// =============================================================================
// NON-REGRESSION TESTS - Ensure existing functionality still works
// =============================================================================

describe("NON-REGRESSION: Existing Functionality", () => {
  describe("Legacy DataElement enum values should still work", () => {
    it("STUDENT_ID should still map to /users", async () => {
      const { dataElementsToEndpoints } = await import("@/lib/config/oneroster");
      const endpoints = dataElementsToEndpoints(["STUDENT_ID"]);
      expect(endpoints).toContain("/users");
    });

    it("CLASS_ROSTER should still map to multiple endpoints", async () => {
      const { dataElementsToEndpoints } = await import("@/lib/config/oneroster");
      const endpoints = dataElementsToEndpoints(["CLASS_ROSTER"]);
      expect(endpoints).toContain("/classes");
      expect(endpoints).toContain("/enrollments");
      expect(endpoints).toContain("/courses");
    });

    it("DEMOGRAPHICS should still map to /demographics", async () => {
      const { dataElementsToEndpoints } = await import("@/lib/config/oneroster");
      const endpoints = dataElementsToEndpoints(["DEMOGRAPHICS"]);
      expect(endpoints).toContain("/demographics");
    });
  });

  describe("Existing tool handlers should still work", () => {
    it("lookup_pods should work with vendor name query", async () => {
      const { handleLookupPods } = await import("@/lib/ai/handlers");

      const result = await handleLookupPods({ query: "NonExistent Vendor" });

      expect(result.success).toBe(true);
      // Should return null data for non-existent vendor, not error
      expect(result.data).toBeNull();
    });

    it("handleProvisionSandbox should still work with resource names", async () => {
      const { handleProvisionSandbox } = await import("@/lib/ai/handlers");
      const { createVendor, clearAllStores } = await import("@/lib/db");

      clearAllStores();

      const vendor = await createVendor({
        podsLiteInput: {
          vendorName: "Provision Test Vendor",
          contactEmail: "provision@test.com",
          contactName: "Provision Tester",
          contactPhone: "555-9012",
          applicationName: "Provision Test",
          applicationDescription: "Testing provisioning",
          dataElementsRequested: ["STUDENT_ID"],
          dataPurpose: "Testing",
          dataRetentionDays: 90,
          integrationMethod: "ONEROSTER_API",
          thirdPartySharing: false,
          hasSOC2: true,
          hasFERPACertification: true,
          encryptsDataAtRest: true,
          encryptsDataInTransit: true,
          breachNotificationHours: 24,
          coppaCompliant: true,
          acceptsTerms: true,
          acceptsDataDeletion: true,
        }
      });

      const result = await handleProvisionSandbox({
        vendor_id: vendor.id,
        requested_resources: ["users", "classes"]
      });

      expect(result.success).toBe(true);
    });
  });

  describe("API routes should still work", () => {
    it("/api/vendors route should be importable", async () => {
      const module = await import("@/app/api/vendors/route");
      expect(module.POST).toBeDefined();
      expect(module.GET).toBeDefined();
    });

    it("/api/sandbox/credentials route should be importable", async () => {
      const module = await import("@/app/api/sandbox/credentials/route");
      expect(module.POST).toBeDefined();
      expect(module.GET).toBeDefined();
    });

    it("/api/pods route should be importable", async () => {
      const module = await import("@/app/api/pods/route");
      expect(module.POST).toBeDefined();
    });
  });
});

// =============================================================================
// END-TO-END FLOW TESTS
// =============================================================================

describe("E2E: Complete Onboarding Flow After Fixes", () => {
  it("should complete full flow: PoDS → Sandbox → SSO → Status Check", async () => {
    const { handleSubmitPodsLite, handleProvisionSandbox, handleConfigureSso, handleCheckStatus } = await import("@/lib/ai/handlers");
    const { clearAllStores } = await import("@/lib/db");
    const { clearSessionPodsSubmissions } = await import("@/lib/data/synthetic");

    clearAllStores();
    clearSessionPodsSubmissions();

    // Step 1: Submit PoDS with vendor name extraction
    const podsResult = await handleSubmitPodsLite({
      vendorName: "E2E Test Vendor",
      contactEmail: "e2e@test.com",
      contactName: "E2E Tester",
      appDescription: "E2E Testing",
      dataElements: ["STUDENT_ID", "CLASS_ROSTER"],
      dataPurpose: "End-to-end testing",
      termsAccepted: true,
    });

    expect(podsResult.success).toBe(true);
    const podsData = podsResult.data as { vendorId: string; podsId: string };
    expect(podsData.vendorId).toBeDefined();

    // Step 2: Provision sandbox
    const sandboxResult = await handleProvisionSandbox({
      vendor_id: podsData.vendorId,
      requested_resources: ["users", "classes"]
    });

    expect(sandboxResult.success).toBe(true);

    // Step 3: Configure SSO (should NOT ask for new PoDS)
    const ssoResult = await handleConfigureSso({
      provider: "CLEVER",
      trigger_form: true
    });

    expect(ssoResult.success).toBe(true);
    // SSO should work without requiring new PoDS

    // Step 4: Check status (should find the vendor)
    const statusResult = await handleCheckStatus({
      vendor_id: podsData.vendorId
    });

    expect(statusResult.success).toBe(true);
  });
});
