/**
 * Security Integration Tests
 *
 * End-to-end tests for security features in API routes:
 * - XSS sanitization in request/response cycle
 * - Rate limiting enforcement
 * - Payload validation
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  clearAllRateLimits,
  DEFAULT_RATE_LIMIT,
  sanitizeString,
  sanitizeObject,
} from "@/lib/security";
import { clearAllStores } from "@/lib/db";

// Import after mocking
import { POST as vendorsPost, GET as vendorsGet } from "@/app/api/vendors/route";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a valid vendor input with optional overrides
 */
function createValidVendorInput(overrides: Record<string, unknown> = {}) {
  return {
    vendorName: "Test Vendor",
    contactEmail: "test@example.com",
    contactName: "Test Contact",
    applicationName: "Test Application",
    applicationDescription: "A test application for integration testing",
    dataElementsRequested: ["STUDENT_ID"],
    dataPurpose: "Testing security features",
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

function createMockRequest(
  body: unknown,
  options: {
    method?: string;
    headers?: Record<string, string>;
    ip?: string;
  } = {}
): NextRequest {
  const headers = new Headers({
    "Content-Type": "application/json",
    ...options.headers,
  });

  // Add IP header for rate limiting tests
  if (options.ip) {
    headers.set("X-Forwarded-For", options.ip);
  }

  return new NextRequest("http://localhost/api/vendors", {
    method: options.method || "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function createGetRequest(
  params: Record<string, string>,
  options: { ip?: string } = {}
): NextRequest {
  const searchParams = new URLSearchParams(params);
  const headers = new Headers();

  if (options.ip) {
    headers.set("X-Forwarded-For", options.ip);
  }

  return new NextRequest(
    `http://localhost/api/vendors?${searchParams.toString()}`,
    {
      method: "GET",
      headers,
    }
  );
}

// =============================================================================
// XSS INTEGRATION TESTS
// =============================================================================

describe("Security Integration: XSS Sanitization in Vendors API", () => {
  beforeEach(async () => {
    clearAllRateLimits();
    await clearAllStores();
  });

  afterEach(() => {
    clearAllRateLimits();
  });

  describe("POST /api/vendors - XSS in Request Body", () => {
    it("should sanitize script tags in vendor name", async () => {
      const request = createMockRequest({
        podsLiteInput: createValidVendorInput({
          vendorName: '<script>alert("xss")</script>Test Vendor',
        }),
        accessTier: "PRIVACY_SAFE",
      });

      const response = await vendorsPost(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      // Vendor name should not contain raw script tags
      expect(data.vendor.name).not.toContain("<script>");
      expect(data.vendor.name).not.toContain("</script>");
    });

    it("should sanitize event handlers in contact name", async () => {
      const request = createMockRequest({
        podsLiteInput: createValidVendorInput({
          contactName: '<img onerror="alert(1)">John',
        }),
        accessTier: "PRIVACY_SAFE",
      });

      const response = await vendorsPost(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      // Should not contain onerror handler
      expect(JSON.stringify(data)).not.toContain("onerror=");
    });

    it("should sanitize JavaScript URLs in description", async () => {
      const request = createMockRequest({
        podsLiteInput: createValidVendorInput({
          applicationDescription:
            'Check <a href="javascript:alert(1)">here</a> for more info',
        }),
        accessTier: "PRIVACY_SAFE",
      });

      const response = await vendorsPost(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      // Should not contain javascript: protocol
      expect(JSON.stringify(data)).not.toContain("javascript:");
    });

    it("should preserve legitimate HTML entities", async () => {
      const request = createMockRequest({
        podsLiteInput: createValidVendorInput({
          vendorName: "Test & Company Inc.",
        }),
        accessTier: "PRIVACY_SAFE",
      });

      const response = await vendorsPost(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      // Ampersand should be preserved (escaped form)
      expect(data.vendor.name).toContain("&amp;");
    });
  });
});

// =============================================================================
// RATE LIMITING INTEGRATION TESTS
// =============================================================================

describe("Security Integration: Rate Limiting in Vendors API", () => {
  beforeEach(async () => {
    clearAllRateLimits();
    await clearAllStores();
  });

  afterEach(() => {
    clearAllRateLimits();
  });

  describe("POST /api/vendors - Rate Limiting", () => {
    it("should allow requests under the rate limit", async () => {
      const request = createMockRequest(
        {
          podsLiteInput: createValidVendorInput(),
          accessTier: "PRIVACY_SAFE",
        },
        { ip: "192.168.1.100" }
      );

      const response = await vendorsPost(request);
      expect(response.status).toBe(200);
    });

    it("should block requests after exceeding rate limit", async () => {
      const uniqueIp = `10.0.0.${Math.floor(Math.random() * 255)}`;

      // Make requests up to the limit
      for (let i = 0; i < DEFAULT_RATE_LIMIT.maxRequests; i++) {
        const request = createMockRequest(
          {
            podsLiteInput: createValidVendorInput({
              vendorName: `Test Vendor ${i}`,
              contactEmail: `test${i}@example.com`,
            }),
            accessTier: "PRIVACY_SAFE",
          },
          { ip: uniqueIp }
        );
        await vendorsPost(request);
      }

      // Next request should be blocked
      const blockedRequest = createMockRequest(
        {
          podsLiteInput: createValidVendorInput({
            vendorName: "Blocked Vendor",
            contactEmail: "blocked@example.com",
          }),
          accessTier: "PRIVACY_SAFE",
        },
        { ip: uniqueIp }
      );

      const response = await vendorsPost(blockedRequest);
      expect(response.status).toBe(429);

      const data = await response.json();
      expect(data.error).toBe("Too many requests");
      expect(data.retryAfter).toBeDefined();
    });

    it("should include rate limit headers in response", async () => {
      const uniqueIp = `10.0.1.${Math.floor(Math.random() * 255)}`;

      // Make enough requests to trigger rate limit
      for (let i = 0; i < DEFAULT_RATE_LIMIT.maxRequests + 1; i++) {
        const request = createMockRequest(
          {
            podsLiteInput: createValidVendorInput({
              vendorName: `Test Vendor ${i}`,
              contactEmail: `test${i}@example.com`,
            }),
            accessTier: "PRIVACY_SAFE",
          },
          { ip: uniqueIp }
        );

        const response = await vendorsPost(request);

        if (response.status === 429) {
          // Check for rate limit headers
          expect(response.headers.get("X-RateLimit-Remaining")).toBeDefined();
          expect(response.headers.get("X-RateLimit-Reset")).toBeDefined();
          expect(response.headers.get("Retry-After")).toBeDefined();
          break;
        }
      }
    });

    it("should track rate limits separately per client IP", async () => {
      const ip1 = "192.168.1.1";
      const ip2 = "192.168.1.2";

      // Exhaust rate limit for ip1
      for (let i = 0; i < DEFAULT_RATE_LIMIT.maxRequests; i++) {
        const request = createMockRequest(
          {
            podsLiteInput: createValidVendorInput({
              vendorName: `Test Vendor ${i}`,
              contactEmail: `test${i}@example.com`,
            }),
            accessTier: "PRIVACY_SAFE",
          },
          { ip: ip1 }
        );
        await vendorsPost(request);
      }

      // ip1 should be blocked
      const blockedRequest = createMockRequest(
        {
          podsLiteInput: createValidVendorInput({
            vendorName: "Blocked",
            contactEmail: "blocked@example.com",
          }),
          accessTier: "PRIVACY_SAFE",
        },
        { ip: ip1 }
      );
      const blockedResponse = await vendorsPost(blockedRequest);
      expect(blockedResponse.status).toBe(429);

      // ip2 should still work
      const allowedRequest = createMockRequest(
        {
          podsLiteInput: createValidVendorInput({
            vendorName: "Allowed Vendor",
            contactEmail: "allowed@example.com",
          }),
          accessTier: "PRIVACY_SAFE",
        },
        { ip: ip2 }
      );
      const allowedResponse = await vendorsPost(allowedRequest);
      expect(allowedResponse.status).toBe(200);
    });
  });

  describe("GET /api/vendors - Rate Limiting", () => {
    it("should rate limit GET requests separately from POST", async () => {
      const uniqueIp = `10.0.2.${Math.floor(Math.random() * 255)}`;

      // First make a POST to create a vendor
      const postRequest = createMockRequest(
        {
          podsLiteInput: createValidVendorInput({
            vendorName: "Get Test Vendor",
            contactEmail: "gettest@example.com",
          }),
          accessTier: "PRIVACY_SAFE",
        },
        { ip: uniqueIp }
      );
      const postResponse = await vendorsPost(postRequest);
      expect(postResponse.status).toBe(200);
      const vendorData = await postResponse.json();

      // Make GET requests
      for (let i = 0; i < 5; i++) {
        const getRequest = createGetRequest(
          { id: vendorData.vendor.id },
          { ip: uniqueIp }
        );
        const getResponse = await vendorsGet(getRequest);
        expect(getResponse.status).toBe(200);
      }
    });
  });
});

// =============================================================================
// PAYLOAD VALIDATION INTEGRATION TESTS
// =============================================================================

describe("Security Integration: Payload Validation in Vendors API", () => {
  beforeEach(async () => {
    clearAllRateLimits();
    await clearAllStores();
  });

  afterEach(() => {
    clearAllRateLimits();
  });

  describe("POST /api/vendors - Payload Size Limits", () => {
    it("should accept normal-sized payloads", async () => {
      const request = createMockRequest({
        podsLiteInput: createValidVendorInput(),
        accessTier: "PRIVACY_SAFE",
      });

      const response = await vendorsPost(request);
      expect(response.status).toBe(200);
    });

    it("should reject oversized string fields", async () => {
      // Create a string that exceeds the max string length (10000 chars)
      const oversizedString = "x".repeat(11000);

      const request = createMockRequest({
        podsLiteInput: createValidVendorInput({
          vendorName: oversizedString,
        }),
        accessTier: "PRIVACY_SAFE",
      });

      const response = await vendorsPost(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("too long");
    });

    it("should reject deeply nested payloads", async () => {
      // Create deeply nested object (exceeds 10 levels)
      let nested: Record<string, unknown> = { value: "deep" };
      for (let i = 0; i < 15; i++) {
        nested = { nested };
      }

      const request = createMockRequest({
        podsLiteInput: createValidVendorInput({
          extra: nested,
        }),
        accessTier: "PRIVACY_SAFE",
      });

      const response = await vendorsPost(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("nested");
    });

    it("should reject oversized arrays", async () => {
      // Create array exceeding max length (1000 items)
      const oversizedArray = Array.from({ length: 1100 }, () => "USERS");

      const request = createMockRequest({
        podsLiteInput: createValidVendorInput({
          dataElementsRequested: oversizedArray,
        }),
        accessTier: "PRIVACY_SAFE",
      });

      const response = await vendorsPost(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("Array too long");
    });
  });

  describe("POST /api/vendors - Field Validation", () => {
    it("should reject missing required fields", async () => {
      const request = createMockRequest({
        accessTier: "PRIVACY_SAFE",
        // Missing podsLiteInput
      });

      const response = await vendorsPost(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain("podsLiteInput");
    });

    it("should handle malformed JSON gracefully", async () => {
      const request = new NextRequest("http://localhost/api/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{ invalid json }",
      });

      const response = await vendorsPost(request);
      expect(response.status).toBe(400);
    });
  });
});

// =============================================================================
// COMBINED SECURITY TESTS
// =============================================================================

describe("Security Integration: Combined Security Checks", () => {
  beforeEach(async () => {
    clearAllRateLimits();
    await clearAllStores();
  });

  afterEach(() => {
    clearAllRateLimits();
  });

  it("should sanitize XSS while also enforcing rate limits", async () => {
    const uniqueIp = `10.0.3.${Math.floor(Math.random() * 255)}`;

    // First request with XSS should be sanitized and succeed
    const request = createMockRequest(
      {
        podsLiteInput: createValidVendorInput({
          vendorName: '<script>alert("xss")</script>Vendor',
        }),
        accessTier: "PRIVACY_SAFE",
      },
      { ip: uniqueIp }
    );

    const response = await vendorsPost(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.vendor.name).not.toContain("<script>");
  });

  it("should reject both XSS and oversized payload", async () => {
    const oversizedString = "x".repeat(11000);

    const request = createMockRequest({
      podsLiteInput: createValidVendorInput({
        vendorName: `<script>alert("xss")</script>${oversizedString}`,
      }),
      accessTier: "PRIVACY_SAFE",
    });

    const response = await vendorsPost(request);
    // Should be rejected for payload size (400), not allowed through
    expect(response.status).toBe(400);
  });

  it("should process multiple valid vendors without leaking data between requests", async () => {
    const vendors = [
      { name: "Vendor One", email: "one@example.com" },
      { name: "Vendor Two", email: "two@example.com" },
      { name: "Vendor Three", email: "three@example.com" },
    ];

    const results = [];

    for (const vendor of vendors) {
      const request = createMockRequest({
        podsLiteInput: createValidVendorInput({
          vendorName: vendor.name,
          contactEmail: vendor.email,
        }),
        accessTier: "PRIVACY_SAFE",
      });

      const response = await vendorsPost(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      results.push(data.vendor);
    }

    // Verify each vendor has unique ID and correct name
    const ids = new Set(results.map((v) => v.id));
    expect(ids.size).toBe(3); // All unique IDs

    expect(results[0].name).toBe("Vendor One");
    expect(results[1].name).toBe("Vendor Two");
    expect(results[2].name).toBe("Vendor Three");
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe("Security Integration: Edge Cases", () => {
  beforeEach(async () => {
    clearAllRateLimits();
    await clearAllStores();
  });

  afterEach(() => {
    clearAllRateLimits();
  });

  it("should handle Unicode characters in vendor names", async () => {
    const request = createMockRequest({
      podsLiteInput: createValidVendorInput({
        vendorName: "日本語ベンダー",
        applicationDescription: "App with unicode émojis",
      }),
      accessTier: "PRIVACY_SAFE",
    });

    const response = await vendorsPost(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.vendor.name).toContain("日本語ベンダー");
  });

  it("should handle empty strings for optional fields", async () => {
    const request = createMockRequest({
      podsLiteInput: createValidVendorInput({
        websiteUrl: undefined,
        linkedInUrl: undefined,
        contactPhone: undefined,
      }),
      accessTier: "PRIVACY_SAFE",
    });

    const response = await vendorsPost(request);
    // Should still create vendor (optional fields can be omitted)
    expect(response.status).toBe(200);
  });

  it("should sanitize mixed attack vectors", async () => {
    const request = createMockRequest({
      podsLiteInput: createValidVendorInput({
        vendorName:
          '<script>alert(1)</script><img onerror="alert(2)">Vendor<a href="javascript:alert(3)">',
      }),
      accessTier: "PRIVACY_SAFE",
    });

    const response = await vendorsPost(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.vendor.name).not.toContain("<script>");
    expect(data.vendor.name).not.toContain("onerror=");
    expect(data.vendor.name).not.toContain("javascript:");
  });
});

// =============================================================================
// UNIT TESTS FOR SANITIZATION HELPERS (Integration context)
// =============================================================================

describe("Security Helpers: Used in Integration Context", () => {
  it("sanitizeString should handle all XSS vectors", () => {
    const vectors = [
      '<script>alert("xss")</script>',
      '<img src="x" onerror="alert(1)">',
      '<a href="javascript:alert(1)">click</a>',
      '<svg onload="alert(1)">',
      '<body onload="alert(1)">',
      '<div style="background:url(javascript:alert(1))">',
    ];

    for (const vector of vectors) {
      const sanitized = sanitizeString(vector);
      expect(sanitized).not.toContain("<script");
      expect(sanitized).not.toContain("onerror=");
      expect(sanitized).not.toContain("onload=");
      expect(sanitized).not.toContain("javascript:");
    }
  });

  it("sanitizeObject should recursively sanitize nested objects", () => {
    const input = {
      name: '<script>alert(1)</script>Test',
      nested: {
        description: '<img onerror="alert(2)">Image',
        deep: {
          value: '<a href="javascript:void(0)">Link</a>',
        },
      },
      array: ['<script>1</script>', "normal", '<img onerror="x">'],
    };

    const sanitized = sanitizeObject(input) as typeof input;

    expect(sanitized.name).not.toContain("<script>");
    expect(sanitized.nested.description).not.toContain("onerror=");
    expect(sanitized.nested.deep.value).not.toContain("javascript:");
    expect(sanitized.array[0]).not.toContain("<script>");
    expect(sanitized.array[2]).not.toContain("onerror=");
    expect(sanitized.array[1]).toBe("normal");
  });
});
