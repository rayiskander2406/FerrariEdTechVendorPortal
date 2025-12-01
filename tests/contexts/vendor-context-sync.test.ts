/**
 * VendorContext Database Sync Tests
 *
 * Tests the automatic credential sync from database on page load.
 * This ensures localStorage cache doesn't show stale data.
 *
 * @module tests/contexts/vendor-context-sync
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  createVendor,
  createSandbox,
  updateSandboxEndpoints,
  clearAllStores,
} from "@/lib/db";
import type { PodsLiteInput } from "@/lib/types";

// =============================================================================
// TEST FIXTURES
// =============================================================================

function createMockPodsLiteInput(
  overrides: Partial<PodsLiteInput> = {}
): PodsLiteInput {
  return {
    vendorName: "Sync Test Vendor",
    contactEmail: `sync-test-${Date.now()}@example.com`,
    contactName: "Test User",
    contactPhone: "555-123-4567",
    websiteUrl: "https://example.com",
    linkedInUrl: "https://linkedin.com/company/example",
    applicationName: "Test Sync App",
    applicationDescription: "Testing credential sync",
    dataElementsRequested: ["STUDENT_ID", "FIRST_NAME"],
    dataPurpose: "Testing",
    intendedUseDescription: "Automated testing",
    integrationMethods: ["ONEROSTER_API"],
    storageLocation: "AWS_US",
    retentionPeriod: "END_OF_SCHOOL_YEAR",
    termsAccepted: true,
    ...overrides,
  };
}

// =============================================================================
// UNIT TESTS: Database Operations
// =============================================================================

describe("Credential Sync Database Operations", () => {
  beforeEach(async () => {
    await clearAllStores();
  });

  it("should update endpoints in database", async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    const initialEndpoints = ["/users", "/classes"];
    await createSandbox(vendor.id, initialEndpoints);

    // Update endpoints
    const updated = await updateSandboxEndpoints(vendor.id, ["/demographics"]);

    expect(updated).not.toBeNull();
    expect(updated!.allowedEndpoints).toContain("/users");
    expect(updated!.allowedEndpoints).toContain("/classes");
    expect(updated!.allowedEndpoints).toContain("/demographics");
  });

  it("should reflect database updates immediately", async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    const initialEndpoints = ["/users"];
    const sandbox = await createSandbox(vendor.id, initialEndpoints);

    expect(sandbox.allowedEndpoints).toEqual(["/users"]);

    // Update database
    await updateSandboxEndpoints(vendor.id, ["/classes", "/enrollments"]);

    // Fresh fetch should show new data
    const { getSandbox } = await import("@/lib/db");
    const freshSandbox = await getSandbox(vendor.id);

    expect(freshSandbox!.allowedEndpoints).toContain("/users");
    expect(freshSandbox!.allowedEndpoints).toContain("/classes");
    expect(freshSandbox!.allowedEndpoints).toContain("/enrollments");
  });
});

// =============================================================================
// INTEGRATION TESTS: API Endpoint
// =============================================================================

describe("Credential Sync API Integration", () => {
  beforeEach(async () => {
    await clearAllStores();
  });

  it("POST /api/sandbox/credentials should return existing sandbox with all fields", async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    const endpoints = ["/users", "/classes", "/enrollments"];
    await createSandbox(vendor.id, endpoints);

    // Import the route handler
    const { POST } = await import("@/app/api/sandbox/credentials/route");

    // Create mock request
    const request = new Request("http://localhost:3000/api/sandbox/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId: vendor.id }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.existing).toBe(true);
    expect(data.sandbox).toBeDefined();
    expect(data.sandbox.apiKey).toMatch(/^sbox_test_/);
    expect(data.sandbox.apiSecret).toBeDefined();
    expect(data.sandbox.allowedEndpoints).toEqual(endpoints);
  });

  it("POST should return fresh data after database update", async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    const initialEndpoints = ["/users"];
    await createSandbox(vendor.id, initialEndpoints);

    // Update database directly
    await updateSandboxEndpoints(vendor.id, ["/classes", "/demographics"]);

    // Import the route handler
    const { POST } = await import("@/app/api/sandbox/credentials/route");

    // Fetch via API
    const request = new Request("http://localhost:3000/api/sandbox/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId: vendor.id }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    // Should have all endpoints including new ones
    expect(data.sandbox.allowedEndpoints).toContain("/users");
    expect(data.sandbox.allowedEndpoints).toContain("/classes");
    expect(data.sandbox.allowedEndpoints).toContain("/demographics");
  });

  it("POST should return 404 for non-existent vendor", async () => {
    const { POST } = await import("@/app/api/sandbox/credentials/route");

    const request = new Request("http://localhost:3000/api/sandbox/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId: "non-existent-vendor-id" }),
    });

    const response = await POST(request as any);

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// SCENARIO TESTS: Stale Cache Problem
// =============================================================================

describe("Stale Cache Scenario", () => {
  beforeEach(async () => {
    await clearAllStores();
  });

  it("should simulate and verify the stale cache fix", async () => {
    // Step 1: Create vendor with initial endpoints (simulates original onboarding)
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput({ vendorName: "StaleCache Test" }),
    });
    const initialEndpoints = ["/users", "/classes", "/enrollments", "/orgs", "/demographics"];
    const sandbox = await createSandbox(vendor.id, initialEndpoints);

    // Step 2: Simulate localStorage storing the initial state
    const cachedCredentials = {
      id: sandbox.id,
      vendorId: sandbox.vendorId,
      apiKey: sandbox.apiKey,
      apiSecret: sandbox.apiSecret,
      baseUrl: sandbox.baseUrl,
      environment: sandbox.environment,
      status: sandbox.status,
      expiresAt: sandbox.expiresAt.toISOString(),
      rateLimitPerMinute: sandbox.rateLimitPerMinute,
      allowedEndpoints: initialEndpoints, // 5 endpoints in cache
    };

    // Step 3: Database is updated directly (simulates what happened with MathGenius)
    await updateSandboxEndpoints(vendor.id, ["/academicSessions", "/courses"]);

    // Step 4: Cache still has old data
    expect(cachedCredentials.allowedEndpoints).toHaveLength(5);
    expect(cachedCredentials.allowedEndpoints).not.toContain("/academicSessions");
    expect(cachedCredentials.allowedEndpoints).not.toContain("/courses");

    // Step 5: API call (simulating what VendorContext.syncCredentialsFromDatabase does)
    const { POST } = await import("@/app/api/sandbox/credentials/route");
    const request = new Request("http://localhost:3000/api/sandbox/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId: vendor.id }),
    });
    const response = await POST(request as any);
    const data = await response.json();

    // Step 6: Fresh data from API has all 7 endpoints
    expect(data.sandbox.allowedEndpoints).toHaveLength(7);
    expect(data.sandbox.allowedEndpoints).toContain("/users");
    expect(data.sandbox.allowedEndpoints).toContain("/classes");
    expect(data.sandbox.allowedEndpoints).toContain("/enrollments");
    expect(data.sandbox.allowedEndpoints).toContain("/orgs");
    expect(data.sandbox.allowedEndpoints).toContain("/demographics");
    expect(data.sandbox.allowedEndpoints).toContain("/academicSessions");
    expect(data.sandbox.allowedEndpoints).toContain("/courses");
  });

  it("should handle vendor without sandbox gracefully", async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    // Note: No sandbox created

    const { POST } = await import("@/app/api/sandbox/credentials/route");
    const request = new Request("http://localhost:3000/api/sandbox/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId: vendor.id }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    // Should create a new sandbox
    expect(data.success).toBe(true);
    expect(data.existing).toBe(false);
    expect(data.sandbox).toBeDefined();
  });
});

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

describe("Credential Sync Edge Cases", () => {
  beforeEach(async () => {
    await clearAllStores();
  });

  it("should handle concurrent sync requests", async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    await createSandbox(vendor.id, ["/users"]);

    const { POST } = await import("@/app/api/sandbox/credentials/route");

    // Simulate multiple concurrent requests
    const requests = Array(5)
      .fill(null)
      .map(() =>
        POST(
          new Request("http://localhost:3000/api/sandbox/credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vendorId: vendor.id }),
          }) as any
        )
      );

    const responses = await Promise.all(requests);
    const results = await Promise.all(responses.map((r) => r.json()));

    // All should succeed with same data
    results.forEach((data) => {
      expect(data.success).toBe(true);
      expect(data.sandbox.vendorId).toBe(vendor.id);
    });
  });

  it("should return complete credential fields for display", async () => {
    const vendor = await createVendor({
      podsLiteInput: createMockPodsLiteInput(),
    });
    await createSandbox(vendor.id);

    const { POST } = await import("@/app/api/sandbox/credentials/route");
    const request = new Request("http://localhost:3000/api/sandbox/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId: vendor.id }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    // Verify all fields needed by CredentialsDisplay are present
    expect(data.sandbox).toMatchObject({
      id: expect.any(String), // CLIENT_ID
      vendorId: expect.any(String),
      apiKey: expect.stringMatching(/^sbox_test_/), // API_KEY
      apiSecret: expect.any(String), // For CLIENT_SECRET derivation
      baseUrl: expect.any(String), // BASE_URL
      environment: expect.stringMatching(/sandbox|production/),
      status: expect.stringMatching(/ACTIVE|PROVISIONING|EXPIRED|REVOKED/),
      expiresAt: expect.any(String),
      rateLimitPerMinute: expect.any(Number),
      allowedEndpoints: expect.any(Array),
    });
  });
});
