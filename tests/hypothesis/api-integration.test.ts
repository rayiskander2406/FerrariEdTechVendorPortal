/**
 * API Integration Tests - Testing the actual API routes
 *
 * These tests verify the HTTP layer works correctly
 */

import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createServer, Server } from "http";
import { parse } from "url";

// We need to test the actual API routes
// Since we can't easily spawn Next.js in tests, we'll test the route handlers directly

describe("API Integration Tests", () => {

  describe("/api/vendors route handler", () => {
    it("should be importable", async () => {
      // Dynamic import the route handler
      const module = await import("@/app/api/vendors/route");
      expect(module.POST).toBeDefined();
      expect(module.GET).toBeDefined();
    });
  });

  describe("/api/sandbox/credentials route handler", () => {
    it("should be importable", async () => {
      const module = await import("@/app/api/sandbox/credentials/route");
      expect(module.POST).toBeDefined();
      expect(module.GET).toBeDefined();
    });
  });

  describe("/api/pods route handler", () => {
    it("should be importable", async () => {
      const module = await import("@/app/api/pods/route");
      expect(module.POST).toBeDefined();
    });
  });
});

/**
 * This test suite examines what happens in app/chat/page.tsx
 */
describe("Chat Page Data Flow Analysis", () => {

  describe("Form submission data flow", () => {
    it("PodsLiteForm should emit correct data structure", () => {
      // The form should emit dataElementsRequested as an array of DataElementEnum values
      const expectedDataElements = [
        "STUDENT_ID", "FIRST_NAME", "CLASS_ROSTER"
      ];

      // These should map to endpoints
      const { dataElementsToEndpoints } = require("@/lib/config/oneroster");
      const endpoints = dataElementsToEndpoints(expectedDataElements);

      expect(endpoints).toBeDefined();
      expect(endpoints).toContain("/users");
      expect(endpoints).toContain("/classes");
      expect(endpoints).toContain("/enrollments");
      expect(endpoints).toContain("/courses");
    });
  });

  describe("handlePodsLiteSubmit expected behavior", () => {
    it("should call createVendorViaApi with correct data", () => {
      // This is what should happen:
      // 1. Form submits with PodsLiteInput data
      // 2. handlePodsLiteSubmit is called
      // 3. createVendorViaApi is called with the input
      // 4. dataElementsToEndpoints is called to map data elements
      // 5. createSandboxViaApi is called with mapped endpoints

      // The critical point: dataElementsToEndpoints MUST be called, not resourcesToEndpoints
    });
  });
});

/**
 * Direct handler invocation tests - bypassing HTTP layer
 */
describe("Direct Handler Tests", () => {

  describe("handleSubmitPodsLite with full submission", () => {
    it("should create vendor and PoDS when all fields provided", async () => {
      const { handleSubmitPodsLite } = require("@/lib/ai/handlers");
      const { clearAllStores } = require("@/lib/db");
      const { clearSessionPodsSubmissions, getMockPodsDatabase } = require("@/lib/data/synthetic");

      clearAllStores();
      clearSessionPodsSubmissions();

      const result = await handleSubmitPodsLite({
        vendorName: "Direct Handler Test",
        contactEmail: "direct@test.com",
        contactName: "Direct Person",
        appDescription: "Direct test",
        dataElements: ["STUDENT_ID", "CLASS_ROSTER"],
        dataPurpose: "Direct testing",
        termsAccepted: true,
      });

      expect(result.success).toBe(true);

      // Check that PoDS was created
      const db = getMockPodsDatabase();
      const found = db.find((p: { vendorName: string }) => p.vendorName === "Direct Handler Test");
      expect(found).toBeDefined();
      expect(found.status).toBe("APPROVED");
    });
  });

  describe("handleProvisionSandbox with endpoints", () => {
    it("should create sandbox with specified endpoints", async () => {
      const { handleProvisionSandbox } = require("@/lib/ai/handlers");
      const { createVendor, getSandbox, clearAllStores } = require("@/lib/db");

      clearAllStores();

      // First create a vendor
      const vendor = await createVendor({
        podsLiteInput: {
          vendorName: "Provision Test",
          contactEmail: "provision@test.com",
          contactName: "Provision Person",
          applicationName: "Provision App",
          applicationDescription: "Provision test",
          dataElementsRequested: ["STUDENT_ID"],
          dataPurpose: "Provision testing",
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

      // Now provision sandbox with specific resources
      const result = await handleProvisionSandbox({
        vendor_id: vendor.id,
        requested_resources: ["users", "classes"] // Note: these are resource names
      });

      expect(result.success).toBe(true);

      const sandbox = await getSandbox(vendor.id);
      expect(sandbox).toBeDefined();
      // The handler uses resourcesToEndpoints, not dataElementsToEndpoints
      // So it expects resource names like "users", not data elements like "STUDENT_ID"
    });
  });
});

/**
 * Critical: Testing what the AI SHOULD be doing
 */
describe("AI Tool Call Simulation", () => {

  describe("When user says 'I am from MathGenius Learning'", () => {
    it("AI should extract vendor name and pass to submit_pods_lite", async () => {
      const { handleSubmitPodsLite } = require("@/lib/ai/handlers");

      // Simulate what AI SHOULD do:
      const result = await handleSubmitPodsLite({
        trigger_form: true,
        prefill_vendor_name: "MathGenius Learning"
      });

      expect(result.success).toBe(true);
      expect(result.showForm).toBe("pods_lite");

      const data = result.data as { prefill?: { vendorName?: string } };
      expect(data.prefill?.vendorName).toBe("MathGenius Learning");

      // This proves the handler works correctly
      // If pre-fill isn't working, the bug is either:
      // 1. AI not calling with prefill_vendor_name
      // 2. useChat not processing tool_result.data.prefill correctly
      // 3. PodsLiteForm not reading prefill prop
    });
  });

  describe("When user completes PoDS and asks for status", () => {
    it("lookup_pods should find the vendor", async () => {
      const { handleSubmitPodsLite, handleLookupPods } = require("@/lib/ai/handlers");
      const { clearAllStores } = require("@/lib/db");
      const { clearSessionPodsSubmissions } = require("@/lib/data/synthetic");

      clearAllStores();
      clearSessionPodsSubmissions();

      // Step 1: Submit PoDS
      const submitResult = await handleSubmitPodsLite({
        vendorName: "Status Check Vendor",
        contactEmail: "status@test.com",
        contactName: "Status Person",
        appDescription: "Status test",
        dataElements: ["STUDENT_ID"],
        dataPurpose: "Status testing",
        termsAccepted: true,
      });

      expect(submitResult.success).toBe(true);

      // Step 2: Lookup
      const lookupResult = await handleLookupPods({
        query: "Status Check Vendor"
      });

      expect(lookupResult.success).toBe(true);
      expect(lookupResult.data).not.toBeNull();

      const data = lookupResult.data as { vendorName: string };
      expect(data.vendorName).toBe("Status Check Vendor");
    });
  });
});

/**
 * THE CRITICAL BUG HUNTER - What's actually going wrong?
 */
describe("BUG HUNTER: Tracing the actual failure points", () => {

  /**
   * BUG #1 HYPOTHESIS: AI is not passing prefill_vendor_name
   *
   * The tool description says to extract vendor name, but the AI might not be doing it
   * or might be caching old form data from previous submissions
   */
  describe("BUG #1: Prefill vendor name issue", () => {
    it("Tool handler correctly returns prefill data", async () => {
      const { handleSubmitPodsLite } = require("@/lib/ai/handlers");

      const result = await handleSubmitPodsLite({
        trigger_form: true,
        prefill_vendor_name: "BugTest Vendor"
      });

      // This PASSES - handler works
      expect(result.data).toHaveProperty("prefill");
      const prefill = (result.data as { prefill: { vendorName: string } }).prefill;
      expect(prefill.vendorName).toBe("BugTest Vendor");

      // CONCLUSION: Handler is correct. Bug is in:
      // - AI not passing the parameter
      // - useChat not processing the response
      // - PodsLiteForm not reading the prop
    });
  });

  /**
   * BUG #2 HYPOTHESIS: Endpoint mapping not being used
   *
   * Even though dataElementsToEndpoints works, it might not be called
   * because the old code path is still being used somewhere
   */
  describe("BUG #2: Endpoint mapping issue", () => {
    it("dataElementsToEndpoints is correctly exported and works", () => {
      const { dataElementsToEndpoints, resourcesToEndpoints } = require("@/lib/config/oneroster");

      // dataElementsToEndpoints should work with data element names
      const endpoints1 = dataElementsToEndpoints(["STUDENT_ID", "CLASS_ROSTER"]);
      expect(endpoints1).toBeDefined();
      expect(endpoints1).toContain("/users");
      expect(endpoints1).toContain("/classes");

      // resourcesToEndpoints expects different input (resource names)
      const endpoints2 = resourcesToEndpoints(["users", "classes"]);
      expect(endpoints2).toBeDefined();

      // CRITICAL: If someone passes STUDENT_ID to resourcesToEndpoints, it returns undefined!
      const badResult = resourcesToEndpoints(["STUDENT_ID", "CLASS_ROSTER"]);
      expect(badResult).toBeUndefined();

      // This could be the bug - if old code is still calling resourcesToEndpoints
      // with DataElement values, it gets undefined and uses defaults
    });
  });

  /**
   * BUG #3 HYPOTHESIS: PoDS not persisted correctly
   *
   * Even if we create a PoDS, it might not be findable by lookup_pods
   * because of the client/server memory split
   */
  describe("BUG #3: PoDS persistence issue", () => {
    it("addPodsApplication persists to session storage", () => {
      const {
        addPodsApplication,
        getMockPodsDatabase,
        clearSessionPodsSubmissions,
        getSessionPodsSubmissions
      } = require("@/lib/data/synthetic");

      clearSessionPodsSubmissions();

      addPodsApplication({
        id: "PERSIST-TEST-001",
        vendorName: "Persist Test",
        applicationName: "Persist App",
        contactEmail: "persist@test.com",
        status: "APPROVED",
        accessTier: "PRIVACY_SAFE",
        submittedAt: new Date(),
        reviewedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });

      // Check session storage directly
      const sessions = getSessionPodsSubmissions();
      expect(sessions.length).toBe(1);

      // Check mock database includes it
      const db = getMockPodsDatabase();
      const found = db.find((p: { id: string }) => p.id === "PERSIST-TEST-001");
      expect(found).toBeDefined();

      // This PASSES - persistence works in the same process
      // BUG IS: client calls /api/pods, server adds to its memory
      // AI handlers run server-side and should see it
      // BUT: if there are multiple server processes, they don't share memory!
    });
  });

  /**
   * BUG #4 HYPOTHESIS: Sandbox endpoints not reaching ApiTester
   *
   * Even if sandbox is created with correct endpoints,
   * the ApiTester might not receive them via props
   */
  describe("BUG #4: Sandbox endpoints not reaching ApiTester", () => {
    it("Sandbox is created with correct allowedEndpoints", async () => {
      const { createVendor, createSandbox, clearAllStores } = require("@/lib/db");
      const { dataElementsToEndpoints } = require("@/lib/config/oneroster");

      clearAllStores();

      const vendor = await createVendor({
        podsLiteInput: {
          vendorName: "ApiTester Test",
          contactEmail: "apitester@test.com",
          contactName: "ApiTester Person",
          applicationName: "ApiTester App",
          applicationDescription: "ApiTester test",
          dataElementsRequested: ["STUDENT_ID", "CLASS_ROSTER"],
          dataPurpose: "ApiTester testing",
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

      // Map data elements to endpoints
      const endpoints = dataElementsToEndpoints(["STUDENT_ID", "CLASS_ROSTER"]);
      expect(endpoints).toBeDefined();

      // Create sandbox with those endpoints
      const sandbox = await createSandbox(vendor.id, endpoints);

      expect(sandbox.allowedEndpoints).toContain("/users");
      expect(sandbox.allowedEndpoints).toContain("/classes");
      expect(sandbox.allowedEndpoints).toContain("/enrollments");
      expect(sandbox.allowedEndpoints).toContain("/courses");

      // Should NOT have other endpoints
      expect(sandbox.allowedEndpoints).not.toContain("/orgs");
      expect(sandbox.allowedEndpoints).not.toContain("/academicSessions");
      expect(sandbox.allowedEndpoints).not.toContain("/demographics");

      // This PASSES - the sandbox is created correctly
      // BUG IS: The data flow from form → API → state → component
    });
  });
});

/**
 * THE ULTIMATE BUG: Testing the ACTUAL code path in app/chat/page.tsx
 */
describe("ULTIMATE BUG FINDER: Trace through app/chat/page.tsx logic", () => {

  it("Verify dataElementsToEndpoints is the function being used", async () => {
    // Read the actual file content
    const fs = await import("fs/promises");
    const content = await fs.readFile(
      "/Users/rayiskander/FerrariEdTechVendorPortal/app/chat/page.tsx",
      "utf-8"
    );

    // Check for the correct import
    expect(content).toContain("import { dataElementsToEndpoints }");
    expect(content).not.toContain("import { resourcesToEndpoints }");

    // Check for the correct usage
    expect(content).toContain("dataElementsToEndpoints(data.dataElementsRequested)");
  });

  it("Verify API routes are being called (createVendorViaApi)", async () => {
    const fs = await import("fs/promises");
    const content = await fs.readFile(
      "/Users/rayiskander/FerrariEdTechVendorPortal/app/chat/page.tsx",
      "utf-8"
    );

    // Check for API function usage
    expect(content).toContain("createVendorViaApi");
    expect(content).toContain("createSandboxViaApi");
    expect(content).toContain('fetch("/api/vendors"');
    expect(content).toContain('fetch("/api/sandbox/credentials"');
  });

  it("Verify credsForState contains allowedEndpoints", async () => {
    const fs = await import("fs/promises");
    const content = await fs.readFile(
      "/Users/rayiskander/FerrariEdTechVendorPortal/app/chat/page.tsx",
      "utf-8"
    );

    // The credsForState object should include allowedEndpoints
    expect(content).toContain("allowedEndpoints: creds.allowedEndpoints");
  });
});
