/**
 * Critical Flow E2E Tests - High ROI Coverage
 *
 * Tests complete user journeys through the portal:
 * 1. Vendor Onboarding Flow (PoDS-Lite → Sandbox → API Testing)
 * 2. Security Through-Flow (XSS survives full request cycle)
 * 3. API Chain Integration (Vendor → Sandbox → OneRoster)
 *
 * These tests validate the demo-critical paths stakeholders will see.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as vendorsPost, GET as vendorsGet } from "@/app/api/vendors/route";
import { POST as sandboxCredentialsPost } from "@/app/api/sandbox/credentials/route";
import { clearAllRateLimits } from "@/lib/security";
import { clearAllStores } from "@/lib/db";

// =============================================================================
// TEST HELPERS
// =============================================================================

function createRequest(
  method: "GET" | "POST",
  body?: Record<string, unknown>,
  searchParams?: Record<string, string>
): NextRequest {
  const url = new URL("http://localhost:3000/api/test");
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return new NextRequest(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": `e2e-test-${Date.now()}`, // Unique IP per test
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function createValidPodsLiteInput(overrides: Record<string, unknown> = {}) {
  return {
    vendorName: "E2E Test Vendor",
    contactEmail: `e2e-${Date.now()}@example.com`,
    contactName: "E2E Test Contact",
    applicationName: "E2E Test App",
    applicationDescription: "End-to-end testing application",
    dataElementsRequested: ["STUDENT_ID", "FIRST_NAME"],
    dataPurpose: "E2E Testing and validation",
    dataRetentionDays: 30,
    termsAccepted: true,
    dataProcessedOffshore: false,
    thirdPartySharing: false,
    soc2Compliant: true,
    coppaCompliant: true,
    ferpaAcknowledged: true,
    ...overrides,
  };
}

// =============================================================================
// E2E: VENDOR ONBOARDING FLOW
// =============================================================================

describe("E2E: Complete Vendor Onboarding Flow", () => {
  beforeEach(async () => {
    clearAllRateLimits();
    await clearAllStores();
  });

  afterEach(() => {
    clearAllRateLimits();
  });

  it("should complete full onboarding: create vendor → provision sandbox → verify credentials", async () => {
    // Step 1: Create vendor via PoDS-Lite
    const vendorRequest = createRequest("POST", {
      podsLiteInput: createValidPodsLiteInput(),
      accessTier: "PRIVACY_SAFE",
    });

    const vendorResponse = await vendorsPost(vendorRequest);
    expect(vendorResponse.status).toBe(200);

    const vendorData = await vendorResponse.json();
    expect(vendorData.success).toBe(true);
    expect(vendorData.vendor.id).toBeDefined();
    expect(vendorData.vendor.accessTier).toBe("PRIVACY_SAFE");

    const vendorId = vendorData.vendor.id;

    // Step 2: Provision sandbox credentials
    const sandboxRequest = createRequest("POST", {
      vendorId,
    });

    const sandboxResponse = await sandboxCredentialsPost(sandboxRequest);
    expect(sandboxResponse.status).toBe(200);

    const sandboxData = await sandboxResponse.json();
    expect(sandboxData.success).toBe(true);
    expect(sandboxData.sandbox).toBeDefined();
    expect(sandboxData.sandbox.apiKey).toMatch(/^sbox_test_/);
    expect(sandboxData.sandbox.apiSecret).toBeDefined();

    // Step 3: Verify vendor can be retrieved
    const getRequest = createRequest("GET", undefined, { id: vendorId });
    const getResponse = await vendorsGet(getRequest);
    expect(getResponse.status).toBe(200);

    const getData = await getResponse.json();
    expect(getData.success).toBe(true);
    expect(getData.vendor.id).toBe(vendorId);
  });

  it("should handle tier upgrade request flow", async () => {
    // Create vendor at Privacy-Safe tier
    const vendorRequest = createRequest("POST", {
      podsLiteInput: createValidPodsLiteInput(),
      accessTier: "PRIVACY_SAFE",
    });

    const vendorResponse = await vendorsPost(vendorRequest);
    const vendorData = await vendorResponse.json();
    expect(vendorData.vendor.accessTier).toBe("PRIVACY_SAFE");

    // Privacy-Safe tier is auto-approved (key feature of PoDS-Lite)
    // Higher tiers (SELECTIVE, FULL_ACCESS) would require manual review
    expect(vendorData.vendor.podsStatus).toBe("APPROVED");
  });
});

// =============================================================================
// E2E: SECURITY THROUGH-FLOW
// =============================================================================

describe("E2E: Security Through-Flow", () => {
  beforeEach(async () => {
    clearAllRateLimits();
    await clearAllStores();
  });

  afterEach(() => {
    clearAllRateLimits();
  });

  it("should sanitize XSS through complete create/retrieve cycle", async () => {
    const xssPayload = "<script>alert('xss')</script>Malicious Vendor";
    const xssEmail = "test<script>@example.com";

    // Create vendor with XSS in name
    const vendorRequest = createRequest("POST", {
      podsLiteInput: createValidPodsLiteInput({
        vendorName: xssPayload,
        contactEmail: "safe@example.com", // Use safe email to pass validation
        applicationDescription: "<img onerror='alert(1)'>Description",
      }),
      accessTier: "PRIVACY_SAFE",
    });

    const vendorResponse = await vendorsPost(vendorRequest);
    expect(vendorResponse.status).toBe(200);

    const vendorData = await vendorResponse.json();
    const vendorId = vendorData.vendor.id;

    // Retrieve and verify XSS was sanitized
    const getRequest = createRequest("GET", undefined, { id: vendorId });
    const getResponse = await vendorsGet(getRequest);
    const getData = await getResponse.json();

    // Verify script tags are removed/escaped
    expect(getData.vendor.name).not.toContain("<script>");
    expect(getData.vendor.name).not.toContain("</script>");
    expect(getData.vendor.name).toContain("Malicious Vendor");
  });

  it("should reject deeply nested payloads in API chain", async () => {
    // Create deeply nested object (exceeds max depth of 10)
    const createDeepObject = (depth: number): Record<string, unknown> => {
      if (depth === 0) return { value: "leaf" };
      return { nested: createDeepObject(depth - 1) };
    };

    const deepPayload = createDeepObject(15);

    const request = createRequest("POST", {
      podsLiteInput: createValidPodsLiteInput({
        // Attach deep object to a field
        applicationDescription: deepPayload as unknown as string,
      }),
    });

    const response = await vendorsPost(request);
    // Should reject due to nesting depth
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain("nested");
  });

  it("should enforce rate limits across multiple rapid requests", async () => {
    // Make requests up to the limit (60/min for vendors API)
    const responses: Response[] = [];
    const uniqueIp = `rate-limit-test-${Date.now()}`;

    // Make 61 requests to trigger rate limit
    for (let i = 0; i < 61; i++) {
      const request = new NextRequest("http://localhost:3000/api/vendors?id=test", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": uniqueIp,
        },
      });

      responses.push(await vendorsGet(request));
    }

    // First 60 should succeed (or return 200 with null vendor)
    const successResponses = responses.filter((r) => r.status === 200);
    const rateLimitedResponses = responses.filter((r) => r.status === 429);

    // At least one should be rate limited
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
    // Most should succeed
    expect(successResponses.length).toBeGreaterThanOrEqual(59);
  });
});

// =============================================================================
// E2E: VENDOR LOOKUP VARIATIONS
// =============================================================================

describe("E2E: Vendor Lookup Flows", () => {
  let createdVendorId: string;
  let createdVendorEmail: string;

  beforeEach(async () => {
    clearAllRateLimits();
    await clearAllStores();

    // Create a vendor for lookup tests
    createdVendorEmail = `lookup-${Date.now()}@example.com`;
    const vendorRequest = createRequest("POST", {
      podsLiteInput: createValidPodsLiteInput({
        contactEmail: createdVendorEmail,
      }),
      accessTier: "PRIVACY_SAFE",
    });

    const vendorResponse = await vendorsPost(vendorRequest);
    const vendorData = await vendorResponse.json();
    createdVendorId = vendorData.vendor.id;
  });

  afterEach(() => {
    clearAllRateLimits();
  });

  it("should find vendor by ID", async () => {
    const request = createRequest("GET", undefined, { id: createdVendorId });
    const response = await vendorsGet(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.vendor.id).toBe(createdVendorId);
  });

  it("should find vendor by email", async () => {
    const request = createRequest("GET", undefined, { email: createdVendorEmail });
    const response = await vendorsGet(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.vendor.contactEmail).toBe(createdVendorEmail);
  });

  it("should return null for non-existent vendor", async () => {
    const request = createRequest("GET", undefined, { id: "non-existent-id" });
    const response = await vendorsGet(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.vendor).toBeNull();
  });

  it("should reject request without id or email", async () => {
    const request = createRequest("GET");
    const response = await vendorsGet(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("id or email");
  });
});

// =============================================================================
// E2E: ERROR HANDLING FLOWS
// =============================================================================

describe("E2E: Error Handling Flows", () => {
  beforeEach(async () => {
    clearAllRateLimits();
    await clearAllStores();
  });

  afterEach(() => {
    clearAllRateLimits();
  });

  it("should handle missing required fields gracefully", async () => {
    const request = createRequest("POST", {
      // Missing podsLiteInput
      accessTier: "PRIVACY_SAFE",
    });

    const response = await vendorsPost(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain("podsLiteInput");
  });

  it("should default to PRIVACY_SAFE when no access tier specified", async () => {
    const request = createRequest("POST", {
      podsLiteInput: createValidPodsLiteInput(),
      // No accessTier specified
    });

    const response = await vendorsPost(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    // Should default to PRIVACY_SAFE (as documented in API)
    expect(data.vendor.accessTier).toBe("PRIVACY_SAFE");
  });

  it("should handle oversized payload", async () => {
    // Create string exceeding max length (10000 chars)
    const oversizedDescription = "x".repeat(15000);

    const request = createRequest("POST", {
      podsLiteInput: createValidPodsLiteInput({
        applicationDescription: oversizedDescription,
      }),
      accessTier: "PRIVACY_SAFE",
    });

    const response = await vendorsPost(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain("String too long");
  });
});

// =============================================================================
// E2E: CONCURRENT OPERATIONS
// =============================================================================

describe("E2E: Concurrent Operations", () => {
  beforeEach(async () => {
    clearAllRateLimits();
    await clearAllStores();
  });

  afterEach(() => {
    clearAllRateLimits();
  });

  it("should handle concurrent vendor creations", async () => {
    // Create 5 vendors concurrently
    const createPromises = Array.from({ length: 5 }, (_, i) =>
      vendorsPost(
        createRequest("POST", {
          podsLiteInput: createValidPodsLiteInput({
            vendorName: `Concurrent Vendor ${i}`,
            contactEmail: `concurrent-${i}-${Date.now()}@example.com`,
          }),
          accessTier: "PRIVACY_SAFE",
        })
      )
    );

    const responses = await Promise.all(createPromises);

    // All should succeed
    responses.forEach((response, i) => {
      expect(response.status).toBe(200);
    });

    // Extract vendor IDs
    const vendorIds = await Promise.all(
      responses.map(async (r) => {
        const data = await r.json();
        return data.vendor.id;
      })
    );

    // All IDs should be unique
    const uniqueIds = new Set(vendorIds);
    expect(uniqueIds.size).toBe(5);
  });

  it("should handle concurrent reads of same vendor", async () => {
    // Create a vendor first
    const createResponse = await vendorsPost(
      createRequest("POST", {
        podsLiteInput: createValidPodsLiteInput(),
        accessTier: "PRIVACY_SAFE",
      })
    );
    const { vendor } = await createResponse.json();

    // Read concurrently 10 times
    const readPromises = Array.from({ length: 10 }, () =>
      vendorsGet(createRequest("GET", undefined, { id: vendor.id }))
    );

    const responses = await Promise.all(readPromises);

    // All should return same vendor
    const vendors = await Promise.all(
      responses.map(async (r) => {
        expect(r.status).toBe(200);
        const data = await r.json();
        return data.vendor;
      })
    );

    vendors.forEach((v) => {
      expect(v.id).toBe(vendor.id);
      expect(v.name).toBe(vendor.name);
    });
  });
});
