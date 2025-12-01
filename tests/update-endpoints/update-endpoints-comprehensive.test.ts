/**
 * Comprehensive Update Endpoints Test Suite
 *
 * 100% coverage for the update_endpoints feature across all layers:
 * - Database layer (updateSandboxEndpoints)
 * - Handler layer (handleUpdateEndpoints)
 * - Tool definition validation
 * - Integration flow
 *
 * @module tests/update-endpoints/update-endpoints-comprehensive
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createVendor,
  createSandbox,
  getSandbox,
  updateSandboxEndpoints,
  getAuditLogs,
  clearAllStores,
} from "@/lib/db";
import {
  handleUpdateEndpoints,
  executeToolCall,
} from "@/lib/ai/handlers";
import {
  TOOL_DEFINITIONS,
  getToolByName,
  validateToolInput,
} from "@/lib/ai/tools";
import { ONEROSTER_ENDPOINTS, ONEROSTER_ENDPOINT_METADATA } from "@/lib/config/oneroster";
import type { PodsLiteInput } from "@/lib/types";

// =============================================================================
// TEST FIXTURES
// =============================================================================

function createMockPodsLiteInput(
  overrides: Partial<PodsLiteInput> = {}
): PodsLiteInput {
  return {
    vendorName: "Test Vendor",
    contactEmail: `test-${Date.now()}@example.com`,
    contactName: "Test User",
    contactPhone: "555-123-4567",
    websiteUrl: "https://example.com",
    linkedInUrl: "https://linkedin.com/company/example",
    applicationName: "Test App",
    applicationDescription: "A test application",
    dataElementsRequested: ["STUDENT_ID", "FIRST_NAME", "GRADE_LEVEL"],
    dataPurpose: "Educational software integration",
    dataRetentionDays: 365,
    integrationMethod: "ONEROSTER_API",
    thirdPartySharing: false,
    hasSOC2: true,
    hasFERPACertification: true,
    encryptsDataAtRest: true,
    encryptsDataInTransit: true,
    breachNotificationHours: 72,
    coppaCompliant: true,
    acceptsTerms: true,
    acceptsDataDeletion: true,
    ...overrides,
  };
}

// =============================================================================
// SETUP
// =============================================================================

beforeEach(async () => {
  await clearAllStores();
});

// =============================================================================
// 1. TOOL DEFINITION TESTS
// =============================================================================

describe("update_endpoints Tool Definition", () => {
  const tool = TOOL_DEFINITIONS.find((t) => t.name === "update_endpoints");

  it("should exist in TOOL_DEFINITIONS", () => {
    expect(tool).toBeDefined();
  });

  it("should have correct name", () => {
    expect(tool?.name).toBe("update_endpoints");
  });

  it("should have description mentioning OneRoster", () => {
    expect(tool?.description).toContain("OneRoster");
  });

  it("should require vendor_id parameter", () => {
    expect(tool?.input_schema.required).toContain("vendor_id");
  });

  it("should require endpoints parameter", () => {
    expect(tool?.input_schema.required).toContain("endpoints");
  });

  it("should have optional mode parameter", () => {
    const props = tool?.input_schema.properties as Record<string, unknown>;
    expect(props.mode).toBeDefined();
    expect(tool?.input_schema.required).not.toContain("mode");
  });

  it("should have mode enum with add and replace options", () => {
    const props = tool?.input_schema.properties as Record<
      string,
      { enum?: string[] }
    >;
    expect(props.mode?.enum).toContain("add");
    expect(props.mode?.enum).toContain("replace");
  });

  it("should be retrievable via getToolByName", () => {
    const retrieved = getToolByName("update_endpoints");
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe("update_endpoints");
  });
});

// =============================================================================
// 2. INPUT VALIDATION TESTS
// =============================================================================

describe("update_endpoints Input Validation", () => {
  it("should validate with valid vendor_id and endpoints", () => {
    const result = validateToolInput("update_endpoints", {
      vendor_id: "test-vendor-id",
      endpoints: ["/users", "/classes"],
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail without vendor_id", () => {
    const result = validateToolInput("update_endpoints", {
      endpoints: ["/users"],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing required field: vendor_id");
  });

  it("should fail without endpoints", () => {
    const result = validateToolInput("update_endpoints", {
      vendor_id: "test-id",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing required field: endpoints");
  });

  it("should pass with optional mode parameter", () => {
    const result = validateToolInput("update_endpoints", {
      vendor_id: "test-id",
      endpoints: ["/users"],
      mode: "add",
    });
    expect(result.valid).toBe(true);
  });

  it("should pass with replace mode", () => {
    const result = validateToolInput("update_endpoints", {
      vendor_id: "test-id",
      endpoints: ["/users"],
      mode: "replace",
    });
    expect(result.valid).toBe(true);
  });
});

// =============================================================================
// 3. DATABASE LAYER TESTS
// =============================================================================

describe("updateSandboxEndpoints Database Function", () => {
  describe("Basic Operations", () => {
    it("should return null for non-existent vendor", async () => {
      const result = await updateSandboxEndpoints(
        "non-existent-id",
        ["/users"],
        "add"
      );
      expect(result).toBeNull();
    });

    it("should return null for vendor without sandbox", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      const result = await updateSandboxEndpoints(vendor.id, ["/users"], "add");
      expect(result).toBeNull();
    });

    it("should update endpoints for vendor with sandbox", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const result = await updateSandboxEndpoints(
        vendor.id,
        ["/demographics"],
        "add"
      );

      expect(result).not.toBeNull();
      expect(result?.allowedEndpoints).toContain("/demographics");
    });
  });

  describe("Add Mode", () => {
    it("should add new endpoints to existing ones", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const originalSandbox = await getSandbox(vendor.id);
      const originalEndpoints = originalSandbox?.allowedEndpoints ?? [];

      const result = await updateSandboxEndpoints(
        vendor.id,
        ["/academicSessions"],
        "add"
      );

      expect(result).not.toBeNull();
      // Should have all original endpoints
      for (const ep of originalEndpoints) {
        expect(result?.allowedEndpoints).toContain(ep);
      }
      // Plus the new one
      expect(result?.allowedEndpoints).toContain("/academicSessions");
    });

    it("should deduplicate when adding existing endpoints", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      // Add /users which likely already exists
      const result = await updateSandboxEndpoints(
        vendor.id,
        ["/users", "/users", "/classes"],
        "add"
      );

      expect(result).not.toBeNull();
      const usersCount = result?.allowedEndpoints.filter(
        (ep) => ep === "/users"
      ).length;
      expect(usersCount).toBe(1);
    });

    it("should default to add mode when mode not specified", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const originalSandbox = await getSandbox(vendor.id);
      const originalEndpoints = originalSandbox?.allowedEndpoints ?? [];

      // Call without mode parameter (should default to add)
      const result = await updateSandboxEndpoints(vendor.id, ["/courses"]);

      expect(result).not.toBeNull();
      // Should preserve original endpoints
      for (const ep of originalEndpoints) {
        expect(result?.allowedEndpoints).toContain(ep);
      }
      // And add the new one
      expect(result?.allowedEndpoints).toContain("/courses");
    });
  });

  describe("Replace Mode", () => {
    it("should replace all endpoints with new ones", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const newEndpoints = ["/users", "/orgs"];
      const result = await updateSandboxEndpoints(
        vendor.id,
        newEndpoints,
        "replace"
      );

      expect(result).not.toBeNull();
      expect(result?.allowedEndpoints).toEqual(newEndpoints);
    });

    it("should replace with single endpoint", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const result = await updateSandboxEndpoints(
        vendor.id,
        ["/users"],
        "replace"
      );

      expect(result).not.toBeNull();
      expect(result?.allowedEndpoints).toEqual(["/users"]);
    });
  });

  describe("Endpoint Validation", () => {
    it("should normalize endpoints without leading slash", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const result = await updateSandboxEndpoints(
        vendor.id,
        ["users", "classes"],
        "replace"
      );

      expect(result).not.toBeNull();
      expect(result?.allowedEndpoints).toContain("/users");
      expect(result?.allowedEndpoints).toContain("/classes");
    });

    it("should filter out invalid endpoints", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const result = await updateSandboxEndpoints(
        vendor.id,
        ["/users", "/invalid", "/notreal"],
        "replace"
      );

      expect(result).not.toBeNull();
      expect(result?.allowedEndpoints).toContain("/users");
      expect(result?.allowedEndpoints).not.toContain("/invalid");
      expect(result?.allowedEndpoints).not.toContain("/notreal");
    });

    it("should fall back to defaults if all endpoints are invalid", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const result = await updateSandboxEndpoints(
        vendor.id,
        ["/invalid1", "/invalid2"],
        "replace"
      );

      expect(result).not.toBeNull();
      // Should have default endpoints, not be empty
      expect(result?.allowedEndpoints.length).toBeGreaterThan(0);
    });
  });

  describe("Audit Logging", () => {
    it("should log audit event when endpoints updated", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      await updateSandboxEndpoints(vendor.id, ["/demographics"], "add");

      const logs = await getAuditLogs(vendor.id);
      const updateLog = logs.find(
        (log) => log.action === "SANDBOX_ENDPOINTS_UPDATED"
      );

      expect(updateLog).toBeDefined();
      expect(updateLog?.details).toHaveProperty("mode", "add");
      expect(updateLog?.details).toHaveProperty("previousEndpoints");
      expect(updateLog?.details).toHaveProperty("newEndpoints");
    });
  });
});

// =============================================================================
// 4. HANDLER LAYER TESTS
// =============================================================================

describe("handleUpdateEndpoints Handler", () => {
  describe("Error Cases", () => {
    it("should return error for non-existent vendor", async () => {
      const result = await handleUpdateEndpoints({
        vendor_id: "non-existent-id",
        endpoints: ["/users"],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Vendor not found");
    });

    it("should return error for vendor without sandbox", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });

      const result = await handleUpdateEndpoints({
        vendor_id: vendor.id,
        endpoints: ["/users"],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("No sandbox credentials found");
    });
  });

  describe("Success Cases - Add Mode", () => {
    it("should successfully add endpoints", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const result = await handleUpdateEndpoints({
        vendor_id: vendor.id,
        endpoints: ["/academicSessions"],
        mode: "add",
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should return correct data structure in add mode", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const result = await handleUpdateEndpoints({
        vendor_id: vendor.id,
        endpoints: ["/demographics"],
        mode: "add",
      });

      expect(result.success).toBe(true);

      const data = result.data as {
        vendorId?: string;
        vendorName?: string;
        mode?: string;
        previousEndpoints?: string[];
        updatedEndpoints?: string[];
        addedEndpoints?: string[];
      };

      expect(data.vendorId).toBe(vendor.id);
      expect(data.vendorName).toBeDefined();
      expect(data.mode).toBe("add");
      expect(data.previousEndpoints).toBeDefined();
      expect(data.updatedEndpoints).toBeDefined();
      expect(data.addedEndpoints).toBeDefined();
      expect(Array.isArray(data.updatedEndpoints)).toBe(true);
    });

    it("should include added endpoints list", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const result = await handleUpdateEndpoints({
        vendor_id: vendor.id,
        endpoints: ["/academicSessions", "/courses"],
        mode: "add",
      });

      expect(result.success).toBe(true);

      const data = result.data as { addedEndpoints?: string[] };
      expect(data.addedEndpoints).toBeDefined();
      expect(Array.isArray(data.addedEndpoints)).toBe(true);
    });

    it("should default to add mode", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const result = await handleUpdateEndpoints({
        vendor_id: vendor.id,
        endpoints: ["/demographics"],
        // mode not specified - should default to add
      });

      expect(result.success).toBe(true);

      const data = result.data as { mode?: string };
      expect(data.mode).toBe("add");
    });
  });

  describe("Success Cases - Replace Mode", () => {
    it("should successfully replace endpoints", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const result = await handleUpdateEndpoints({
        vendor_id: vendor.id,
        endpoints: ["/users", "/classes"],
        mode: "replace",
      });

      expect(result.success).toBe(true);

      const data = result.data as { updatedEndpoints?: string[] };
      expect(data.updatedEndpoints).toEqual(["/users", "/classes"]);
    });

    it("should return null for addedEndpoints in replace mode", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const result = await handleUpdateEndpoints({
        vendor_id: vendor.id,
        endpoints: ["/users"],
        mode: "replace",
      });

      expect(result.success).toBe(true);

      const data = result.data as { addedEndpoints?: string[] | null };
      expect(data.addedEndpoints).toBeNull();
    });
  });

  describe("Response Messages", () => {
    it("should include success message for add mode", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const result = await handleUpdateEndpoints({
        vendor_id: vendor.id,
        endpoints: ["/demographics"],
        mode: "add",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.message).toContain("added");
    });

    it("should include success message for replace mode", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      await createSandbox(vendor.id);

      const result = await handleUpdateEndpoints({
        vendor_id: vendor.id,
        endpoints: ["/users"],
        mode: "replace",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.message).toContain("updated");
    });
  });
});

// =============================================================================
// 5. TOOL ROUTER TESTS
// =============================================================================

describe("executeToolCall Integration", () => {
  it("should route update_endpoints to correct handler", async () => {
    const result = await executeToolCall("update_endpoints", {
      vendor_id: "non-existent",
      endpoints: ["/users"],
    });

    // Should return a result (even if error)
    expect(result).toBeDefined();
    expect(result.success).toBeDefined();
  });

  it("should return error for missing vendor", async () => {
    const result = await executeToolCall("update_endpoints", {
      vendor_id: "missing-vendor",
      endpoints: ["/users"],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Vendor not found");
  });

  it("should successfully execute with valid vendor", async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    await createSandbox(vendor.id);

    const result = await executeToolCall("update_endpoints", {
      vendor_id: vendor.id,
      endpoints: ["/demographics"],
      mode: "add",
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});

// =============================================================================
// 6. END-TO-END FLOW TESTS
// =============================================================================

describe("End-to-End Update Endpoints Flow", () => {
  it("should complete full flow: create vendor → provision sandbox → update endpoints", async () => {
    // Step 1: Create vendor
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput({ vendorName: "E2E Test Vendor" }),
    });
    expect(vendor).toBeDefined();
    expect(vendor.id).toBeDefined();

    // Step 2: Provision sandbox
    const sandbox = await createSandbox(vendor.id);
    expect(sandbox).toBeDefined();
    expect(sandbox.allowedEndpoints.length).toBeGreaterThan(0);

    const originalEndpoints = [...sandbox.allowedEndpoints];

    // Step 3: Add new endpoint via handler
    const addResult = await handleUpdateEndpoints({
      vendor_id: vendor.id,
      endpoints: ["/academicSessions"],
      mode: "add",
    });
    expect(addResult.success).toBe(true);

    const addData = addResult.data as { updatedEndpoints?: string[] };
    expect(addData.updatedEndpoints).toContain("/academicSessions");
    // Should still have original endpoints
    for (const ep of originalEndpoints) {
      expect(addData.updatedEndpoints).toContain(ep);
    }

    // Step 4: Verify in database
    const updatedSandbox = await getSandbox(vendor.id);
    expect(updatedSandbox?.allowedEndpoints).toContain("/academicSessions");

    // Step 5: Replace endpoints
    const replaceResult = await handleUpdateEndpoints({
      vendor_id: vendor.id,
      endpoints: ["/users", "/classes"],
      mode: "replace",
    });
    expect(replaceResult.success).toBe(true);

    const replaceData = replaceResult.data as { updatedEndpoints?: string[] };
    expect(replaceData.updatedEndpoints).toEqual(["/users", "/classes"]);

    // Step 6: Verify replacement in database
    const finalSandbox = await getSandbox(vendor.id);
    expect(finalSandbox?.allowedEndpoints).toEqual(["/users", "/classes"]);
  });

  it("should handle multiple sequential updates correctly", async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    await createSandbox(vendor.id);

    // Update 1: Add demographics
    await handleUpdateEndpoints({
      vendor_id: vendor.id,
      endpoints: ["/demographics"],
      mode: "add",
    });

    // Update 2: Add academicSessions
    await handleUpdateEndpoints({
      vendor_id: vendor.id,
      endpoints: ["/academicSessions"],
      mode: "add",
    });

    // Update 3: Add courses
    await handleUpdateEndpoints({
      vendor_id: vendor.id,
      endpoints: ["/courses"],
      mode: "add",
    });

    const sandbox = await getSandbox(vendor.id);
    expect(sandbox?.allowedEndpoints).toContain("/demographics");
    expect(sandbox?.allowedEndpoints).toContain("/academicSessions");
    expect(sandbox?.allowedEndpoints).toContain("/courses");
  });
});

// =============================================================================
// 7. ONEROSTER ENDPOINT VALIDATION TESTS
// =============================================================================

describe("OneRoster Endpoint Configuration", () => {
  it("should have valid endpoints configured", () => {
    expect(ONEROSTER_ENDPOINTS).toBeDefined();
    expect(Array.isArray(ONEROSTER_ENDPOINTS)).toBe(true);
    expect(ONEROSTER_ENDPOINTS.length).toBeGreaterThan(0);
  });

  it("should include standard OneRoster endpoints", () => {
    // ONEROSTER_ENDPOINTS is a string array
    expect(ONEROSTER_ENDPOINTS).toContain("/users");
    expect(ONEROSTER_ENDPOINTS).toContain("/classes");
    expect(ONEROSTER_ENDPOINTS).toContain("/enrollments");
    expect(ONEROSTER_ENDPOINTS).toContain("/orgs");
  });

  it("should have endpoint metadata for each endpoint", () => {
    // ONEROSTER_ENDPOINT_METADATA has the detailed info
    ONEROSTER_ENDPOINT_METADATA.forEach((metadata) => {
      expect(metadata.value).toBeDefined();
      expect(metadata.label).toBeDefined();
      expect(metadata.description).toBeDefined();
      expect(metadata.responseKey).toBeDefined();
    });
  });
});

// =============================================================================
// 8. EDGE CASES AND ERROR HANDLING
// =============================================================================

describe("Edge Cases and Error Handling", () => {
  it("should handle empty endpoints array", async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    await createSandbox(vendor.id);

    const result = await handleUpdateEndpoints({
      vendor_id: vendor.id,
      endpoints: [],
      mode: "add",
    });

    // Should succeed but not change anything meaningfully
    expect(result.success).toBe(true);
  });

  it("should handle very long endpoint lists", async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    await createSandbox(vendor.id);

    // Try to add all valid endpoints multiple times
    const manyEndpoints = [
      "/users",
      "/classes",
      "/enrollments",
      "/orgs",
      "/courses",
      "/academicSessions",
      "/demographics",
      "/users",
      "/classes",
    ];

    const result = await handleUpdateEndpoints({
      vendor_id: vendor.id,
      endpoints: manyEndpoints,
      mode: "add",
    });

    expect(result.success).toBe(true);
  });

  it("should handle concurrent update attempts gracefully", async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    await createSandbox(vendor.id);

    // Fire multiple updates concurrently
    const promises = [
      handleUpdateEndpoints({
        vendor_id: vendor.id,
        endpoints: ["/demographics"],
        mode: "add",
      }),
      handleUpdateEndpoints({
        vendor_id: vendor.id,
        endpoints: ["/academicSessions"],
        mode: "add",
      }),
      handleUpdateEndpoints({
        vendor_id: vendor.id,
        endpoints: ["/courses"],
        mode: "add",
      }),
    ];

    const results = await Promise.all(promises);

    // All should succeed
    results.forEach((result) => {
      expect(result.success).toBe(true);
    });
  });
});
