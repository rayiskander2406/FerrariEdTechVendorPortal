/**
 * PoDS Database Sync Tests
 *
 * Tests the database-first hydration pattern for PoDS applications.
 * Ensures localStorage backup syncs with database on page load.
 *
 * @module tests/contexts/pods-sync
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  addPodsApplication,
  getPodsApplicationByVendor,
  clearPodsApplications,
  clearAllStores,
} from "@/lib/db";
import type { PodsApplication } from "@/lib/types";

// =============================================================================
// TEST FIXTURES
// =============================================================================

function createMockPodsApplication(
  overrides: Partial<PodsApplication> = {}
): PodsApplication {
  const now = new Date();
  const oneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  return {
    id: `pods_${Date.now()}`,
    vendorName: "Sync Test Vendor",
    applicationName: "Test App",
    contactEmail: `sync-test-${Date.now()}@example.com`,
    status: "APPROVED",
    accessTier: "PRIVACY_SAFE",
    submittedAt: now,
    reviewedAt: now,
    expiresAt: oneYear,
    ...overrides,
  };
}

// =============================================================================
// UNIT TESTS: Database Operations
// =============================================================================

describe("PoDS Database Operations", () => {
  beforeEach(async () => {
    await clearAllStores();
  });

  it("should store PoDS application in database", async () => {
    const pods = createMockPodsApplication();
    await addPodsApplication(pods);

    const retrieved = await getPodsApplicationByVendor(pods.vendorName);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.vendorName).toBe(pods.vendorName);
    expect(retrieved!.status).toBe("APPROVED");
  });

  it("should update existing PoDS application", async () => {
    const pods = createMockPodsApplication({ vendorName: "Update Test" });
    await addPodsApplication(pods);

    // Update status
    const updated = createMockPodsApplication({
      id: pods.id,
      vendorName: "Update Test",
      status: "REVOKED",
    });
    await addPodsApplication(updated);

    const retrieved = await getPodsApplicationByVendor("Update Test");
    expect(retrieved!.status).toBe("REVOKED");
  });

  it("should return null for non-existent vendor", async () => {
    const retrieved = await getPodsApplicationByVendor("Non-Existent Vendor");
    expect(retrieved).toBeNull();
  });
});

// =============================================================================
// INTEGRATION TESTS: API Endpoint
// =============================================================================

describe("PoDS API Sync Endpoint", () => {
  beforeEach(async () => {
    await clearAllStores();
  });

  it("GET /api/pods?vendorName= should return single application", async () => {
    const pods = createMockPodsApplication({ vendorName: "API Test Vendor" });
    await addPodsApplication(pods);

    const { GET } = await import("@/app/api/pods/route");
    const request = new Request(
      `http://localhost:3000/api/pods?vendorName=${encodeURIComponent("API Test Vendor")}`
    );

    const response = await GET(request as any);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.application).toBeDefined();
    expect(data.application.vendorName).toBe("API Test Vendor");
    expect(data.application.status).toBe("APPROVED");
  });

  it("GET /api/pods?vendorName= should return fresh database values", async () => {
    // Create initial application
    const pods = createMockPodsApplication({
      vendorName: "Fresh Data Vendor",
      status: "APPROVED",
      accessTier: "PRIVACY_SAFE",
    });
    await addPodsApplication(pods);

    // Update in database directly
    const updated = createMockPodsApplication({
      id: pods.id,
      vendorName: "Fresh Data Vendor",
      status: "REVOKED",
      accessTier: "SELECTIVE",
    });
    await addPodsApplication(updated);

    // API should return updated values
    const { GET } = await import("@/app/api/pods/route");
    const request = new Request(
      `http://localhost:3000/api/pods?vendorName=${encodeURIComponent("Fresh Data Vendor")}`
    );

    const response = await GET(request as any);
    const data = await response.json();

    expect(data.application.status).toBe("REVOKED");
    expect(data.application.accessTier).toBe("SELECTIVE");
  });

  it("GET /api/pods?vendorName= should return 404 for non-existent vendor", async () => {
    const { GET } = await import("@/app/api/pods/route");
    const request = new Request(
      `http://localhost:3000/api/pods?vendorName=${encodeURIComponent("Non-Existent")}`
    );

    const response = await GET(request as any);
    expect(response.status).toBe(404);
  });

  it("GET /api/pods without vendorName should return all applications", async () => {
    // First clear to ensure clean state
    await clearPodsApplications();

    // Create multiple applications with unique IDs and names to avoid collision
    const timestamp = Date.now();
    await addPodsApplication(
      createMockPodsApplication({
        id: `pods_list_a_${timestamp}`,
        vendorName: `List Test A ${timestamp}`,
        applicationName: "List App A",
      })
    );
    await addPodsApplication(
      createMockPodsApplication({
        id: `pods_list_b_${timestamp}`,
        vendorName: `List Test B ${timestamp}`,
        applicationName: "List App B",
      })
    );

    const { GET } = await import("@/app/api/pods/route");
    const request = new Request("http://localhost:3000/api/pods");

    const response = await GET(request as any);
    const data = await response.json();

    expect(data.success).toBe(true);
    // Should have exactly 2 applications we just created
    expect(data.count).toBe(2);
    expect(data.applications).toBeDefined();
    expect(data.applications.length).toBe(2);
  });
});

// =============================================================================
// SCENARIO TESTS: Stale Cache Problem
// =============================================================================

describe("PoDS Stale Cache Scenario", () => {
  beforeEach(async () => {
    await clearAllStores();
  });

  it("should simulate and verify the stale cache fix", async () => {
    // Step 1: Create vendor with initial status
    const pods = createMockPodsApplication({
      vendorName: "StaleCache PoDS Test",
      status: "APPROVED",
      accessTier: "PRIVACY_SAFE",
    });
    await addPodsApplication(pods);

    // Step 2: Simulate localStorage storing initial state
    const cachedPods = {
      id: pods.id,
      vendorName: pods.vendorName,
      applicationName: pods.applicationName,
      contactEmail: pods.contactEmail,
      status: "APPROVED", // Cached status
      accessTier: "PRIVACY_SAFE",
      submittedAt: pods.submittedAt.toISOString(),
      reviewedAt: pods.reviewedAt.toISOString(),
      expiresAt: pods.expiresAt.toISOString(),
    };

    // Step 3: Admin updates status in database
    const updatedPods = createMockPodsApplication({
      id: pods.id,
      vendorName: "StaleCache PoDS Test",
      status: "REVOKED",
      accessTier: "PRIVACY_SAFE",
    });
    await addPodsApplication(updatedPods);

    // Step 4: Cache still has old status
    expect(cachedPods.status).toBe("APPROVED");

    // Step 5: API call (simulating what syncPodsData does)
    const { GET } = await import("@/app/api/pods/route");
    const request = new Request(
      `http://localhost:3000/api/pods?vendorName=${encodeURIComponent("StaleCache PoDS Test")}`
    );
    const response = await GET(request as any);
    const data = await response.json();

    // Step 6: Fresh data from API has updated status
    expect(data.application.status).toBe("REVOKED");
    expect(data.application.status).not.toBe(cachedPods.status);
  });

  it("should handle multiple vendors in cache", async () => {
    // This test verifies that updating one vendor doesn't affect another
    const timestamp = Date.now();
    const vendorOneName = `Multi Cache One ${timestamp}`;
    const vendorTwoName = `Multi Cache Two ${timestamp}`;

    // Create two separate vendors with unique IDs
    await addPodsApplication(
      createMockPodsApplication({
        id: `pods_multi_one_${timestamp}`,
        vendorName: vendorOneName,
        applicationName: `App ${vendorOneName}`,
        status: "APPROVED",
      })
    );
    await addPodsApplication(
      createMockPodsApplication({
        id: `pods_multi_two_${timestamp}`,
        vendorName: vendorTwoName,
        applicationName: `App ${vendorTwoName}`,
        status: "APPROVED",
      })
    );

    // Update vendor two's status (same ID to update, not create new)
    await addPodsApplication(
      createMockPodsApplication({
        id: `pods_multi_two_${timestamp}`,
        vendorName: vendorTwoName,
        applicationName: `App ${vendorTwoName}`,
        status: "EXPIRED",
      })
    );

    // Verify vendor one is still APPROVED
    const vendorOne = await getPodsApplicationByVendor(vendorOneName);
    expect(vendorOne).not.toBeNull();
    expect(vendorOne!.status).toBe("APPROVED");

    // Verify vendor two is now EXPIRED
    const vendorTwo = await getPodsApplicationByVendor(vendorTwoName);
    expect(vendorTwo).not.toBeNull();
    expect(vendorTwo!.status).toBe("EXPIRED");
  });
});

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

describe("PoDS Sync Edge Cases", () => {
  beforeEach(async () => {
    await clearAllStores();
  });

  it("should handle special characters in vendor name", async () => {
    const vendorName = "Test & Company's \"App\" <Special>";
    const pods = createMockPodsApplication({ vendorName });
    await addPodsApplication(pods);

    const { GET } = await import("@/app/api/pods/route");
    const request = new Request(
      `http://localhost:3000/api/pods?vendorName=${encodeURIComponent(vendorName)}`
    );

    const response = await GET(request as any);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.application.vendorName).toBe(vendorName);
  });

  it("should return date fields as ISO strings", async () => {
    const pods = createMockPodsApplication();
    await addPodsApplication(pods);

    const { GET } = await import("@/app/api/pods/route");
    const request = new Request(
      `http://localhost:3000/api/pods?vendorName=${encodeURIComponent(pods.vendorName)}`
    );

    const response = await GET(request as any);
    const data = await response.json();

    // Verify date fields are ISO strings
    expect(typeof data.application.submittedAt).toBe("string");
    expect(typeof data.application.reviewedAt).toBe("string");
    expect(typeof data.application.expiresAt).toBe("string");

    // Verify they can be parsed as dates
    expect(new Date(data.application.submittedAt)).toBeInstanceOf(Date);
  });

  it("should preserve all application fields", async () => {
    const pods = createMockPodsApplication({
      vendorName: "Full Fields Test",
      applicationName: "Custom App Name",
      contactEmail: "test@example.com",
      status: "APPROVED",
      accessTier: "SELECTIVE",
    });
    await addPodsApplication(pods);

    const { GET } = await import("@/app/api/pods/route");
    const request = new Request(
      `http://localhost:3000/api/pods?vendorName=${encodeURIComponent("Full Fields Test")}`
    );

    const response = await GET(request as any);
    const data = await response.json();

    expect(data.application.id).toBe(pods.id);
    expect(data.application.vendorName).toBe("Full Fields Test");
    expect(data.application.applicationName).toBe("Custom App Name");
    expect(data.application.contactEmail).toBe("test@example.com");
    expect(data.application.status).toBe("APPROVED");
    expect(data.application.accessTier).toBe("SELECTIVE");
  });
});
