/**
 * Credentials Display and Execution End-to-End Tests
 *
 * Tests the complete flow from PoDS-Lite submission through
 * credential display and API execution in the "black form" (dark-themed
 * CredentialsDisplay) and ApiTester components.
 *
 * @module tests/e2e/credentials-display-execution
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createVendor,
  createSandbox,
  getSandbox,
  getVendor,
  clearAllStores,
} from "@/lib/db";
import { getSyntheticData, getOneRosterResponse } from "@/lib/data/synthetic";
import {
  ONEROSTER_ENDPOINTS,
  ONEROSTER_ENDPOINT_METADATA,
  DEFAULT_ONEROSTER_ENDPOINTS,
  getEndpointMetadata,
} from "@/lib/config/oneroster";
import type { PodsLiteInput, SandboxCredentials } from "@/lib/types";

// =============================================================================
// TEST FIXTURES
// =============================================================================

function createMockPodsLiteInput(
  overrides: Partial<PodsLiteInput> = {}
): PodsLiteInput {
  return {
    vendorName: "Test Credentials Vendor",
    contactEmail: `creds-test-${Date.now()}@example.com`,
    contactName: "Test User",
    contactPhone: "555-123-4567",
    websiteUrl: "https://example.com",
    linkedInUrl: "https://linkedin.com/company/example",
    applicationName: "Test Creds App",
    applicationDescription: "Testing credentials display",
    dataElementsRequested: ["STUDENT_ID", "FIRST_NAME", "CLASS_ROSTER"],
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
// TESTS
// =============================================================================

describe("Credentials Display and Execution Flow", () => {
  beforeEach(async () => {
    await clearAllStores();
  });

  describe("Sandbox Credentials Creation", () => {
    it("should create sandbox with valid API key format", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const sandbox = await createSandbox(vendor.id);

      expect(sandbox).not.toBeNull();
      expect(sandbox!.apiKey).toMatch(/^sbox_test_/);
      expect(sandbox!.apiKey.length).toBeGreaterThanOrEqual(24);
    });

    it("should create sandbox with default endpoints when none specified", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const sandbox = await createSandbox(vendor.id);

      expect(sandbox).not.toBeNull();
      expect(sandbox!.allowedEndpoints).toEqual(
        expect.arrayContaining(DEFAULT_ONEROSTER_ENDPOINTS)
      );
    });

    it("should create sandbox with specified endpoints", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const requestedEndpoints = ["/users", "/classes"];
      const sandbox = await createSandbox(vendor.id, requestedEndpoints);

      expect(sandbox).not.toBeNull();
      expect(sandbox!.allowedEndpoints).toEqual(requestedEndpoints);
    });

    it("should have all required credential fields for display", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const sandbox = await createSandbox(vendor.id);

      // CredentialsDisplay requires these fields
      expect(sandbox).toMatchObject({
        id: expect.any(String),
        vendorId: vendor.id,
        apiKey: expect.any(String),
        apiSecret: expect.any(String),
        baseUrl: expect.any(String),
        environment: expect.stringMatching(/sandbox|production/),
        status: expect.stringMatching(/PROVISIONING|ACTIVE|EXPIRED|REVOKED/),
        expiresAt: expect.any(Date),
        rateLimitPerMinute: expect.any(Number),
        allowedEndpoints: expect.any(Array),
      });
    });
  });

  describe("CredentialsDisplay Field Derivation", () => {
    it("should derive CLIENT_ID from sandbox id", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const sandbox = await createSandbox(vendor.id);

      // CLIENT_ID is the sandbox record UUID
      expect(sandbox!.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it("should derive CLIENT_SECRET from first 32 chars of apiSecret", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const sandbox = await createSandbox(vendor.id);

      // CLIENT_SECRET = apiSecret.slice(0, 32)
      const clientSecret = sandbox!.apiSecret.slice(0, 32);
      expect(clientSecret.length).toBe(32);
    });

    it("should have expiration date in the future", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const sandbox = await createSandbox(vendor.id);

      expect(sandbox!.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("API Explorer in CredentialsDisplay", () => {
    it("should have all endpoints defined in metadata", () => {
      // Verify that all ONEROSTER_ENDPOINTS have metadata
      ONEROSTER_ENDPOINTS.forEach((endpoint) => {
        const metadata = getEndpointMetadata(endpoint);
        expect(metadata).toBeDefined();
        expect(metadata?.label).toBeDefined();
        expect(metadata?.description).toBeDefined();
        expect(metadata?.responseKey).toBeDefined();
      });
    });

    it("should validate API key format for sandbox access", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const sandbox = await createSandbox(vendor.id);

      // API validation: keys must start with sbox_test_
      const isValidFormat = sandbox!.apiKey.startsWith("sbox_test_");
      expect(isValidFormat).toBe(true);
    });
  });

  describe("ApiTester Execution", () => {
    it("should return synthetic data for /users endpoint", () => {
      const response = getOneRosterResponse("/users", undefined, 10, 0);
      expect(response).toBeDefined();
      expect(response).toHaveProperty("users");
      const users = (response as { users: unknown[] }).users;
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeLessThanOrEqual(10);
    });

    it("should return synthetic data for /classes endpoint", () => {
      const response = getOneRosterResponse("/classes", undefined, 10, 0);
      expect(response).toBeDefined();
      expect(response).toHaveProperty("classes");
      const classes = (response as { classes: unknown[] }).classes;
      expect(Array.isArray(classes)).toBe(true);
    });

    it("should return synthetic data for /enrollments endpoint", () => {
      const response = getOneRosterResponse("/enrollments", undefined, 10, 0);
      expect(response).toBeDefined();
      expect(response).toHaveProperty("enrollments");
    });

    it("should return synthetic data for /orgs endpoint", () => {
      const response = getOneRosterResponse("/orgs", undefined, 10, 0);
      expect(response).toBeDefined();
      expect(response).toHaveProperty("orgs");
    });

    it("should return synthetic data for /courses endpoint", () => {
      const response = getOneRosterResponse("/courses", undefined, 10, 0);
      expect(response).toBeDefined();
      expect(response).toHaveProperty("courses");
    });

    it("should return synthetic data for /academicSessions endpoint", () => {
      const response = getOneRosterResponse(
        "/academicSessions",
        undefined,
        10,
        0
      );
      expect(response).toBeDefined();
      expect(response).toHaveProperty("academicSessions");
    });

    it("should filter endpoints based on vendor allowedEndpoints", async () => {
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput(),
      });
      const limitedEndpoints = ["/users", "/classes"];
      const sandbox = await createSandbox(vendor.id, limitedEndpoints);

      // ApiTester filters endpoints based on allowedEndpoints
      const availableEndpoints = ONEROSTER_ENDPOINT_METADATA.filter((ep) =>
        sandbox!.allowedEndpoints.includes(ep.value)
      );

      expect(availableEndpoints.length).toBe(2);
      expect(availableEndpoints.map((ep) => ep.value)).toEqual(
        expect.arrayContaining(["/users", "/classes"])
      );
    });
  });

  describe("Synthetic Data Consistency", () => {
    it("should return consistent data structure", () => {
      const data = getSyntheticData();

      expect(data).toHaveProperty("students");
      expect(data).toHaveProperty("teachers");
      expect(data).toHaveProperty("classes");
      expect(data).toHaveProperty("schools");
      expect(data).toHaveProperty("enrollments");

      expect(Array.isArray(data.students)).toBe(true);
      expect(Array.isArray(data.teachers)).toBe(true);
      expect(Array.isArray(data.classes)).toBe(true);
      expect(Array.isArray(data.schools)).toBe(true);
      expect(Array.isArray(data.enrollments)).toBe(true);
    });

    it("should have tokenized student data", () => {
      const data = getSyntheticData();

      if (data.students.length > 0) {
        const student = data.students[0];
        // Student tokens should follow pattern TKN_STU_XXXXXXXX
        expect(student.token).toMatch(/^TKN_STU_[A-Z0-9]+$/);
        // Last names should be [TOKENIZED] for privacy-safe
        expect(student.lastName).toBe("[TOKENIZED]");
      }
    });

    it("should have valid school references in student data", () => {
      const data = getSyntheticData();

      if (data.students.length > 0) {
        const student = data.students[0];
        // School token should exist
        expect(student.schoolToken).toMatch(/^TKN_SCH_[A-Z0-9]+$/);
        // School should exist in schools array
        const school = data.schools.find(
          (s) => s.token === student.schoolToken
        );
        expect(school).toBeDefined();
      }
    });
  });

  describe("Complete Flow: Onboard → Credentials → Execution", () => {
    it("should complete full flow without errors", async () => {
      // Step 1: Create vendor
      const vendor = await createVendor({
        podsLiteInput: createMockPodsLiteInput({
          vendorName: "Full Flow Test Vendor",
        }),
      });
      expect(vendor).toBeDefined();
      expect(vendor.id).toBeDefined();

      // Step 2: Provision sandbox
      const sandbox = await createSandbox(vendor.id);
      expect(sandbox).not.toBeNull();
      expect(sandbox!.apiKey).toMatch(/^sbox_test_/);

      // Step 3: Retrieve sandbox (simulates what the form does)
      const retrievedSandbox = await getSandbox(vendor.id);
      expect(retrievedSandbox).not.toBeNull();
      expect(retrievedSandbox!.id).toBe(sandbox!.id);

      // Step 4: Execute API call (simulates ApiTester)
      const response = getOneRosterResponse("/users", undefined, 5, 0);
      expect(response).toBeDefined();
      const users = (response as { users: unknown[] }).users;
      expect(users.length).toBeGreaterThan(0);

      // Step 5: Verify credentials can be displayed
      const credentials: SandboxCredentials = {
        id: retrievedSandbox!.id,
        vendorId: retrievedSandbox!.vendorId,
        apiKey: retrievedSandbox!.apiKey,
        apiSecret: retrievedSandbox!.apiSecret,
        baseUrl: retrievedSandbox!.baseUrl,
        environment: retrievedSandbox!.environment,
        status: retrievedSandbox!.status,
        expiresAt: retrievedSandbox!.expiresAt,
        createdAt: retrievedSandbox!.createdAt,
        rateLimitPerMinute: retrievedSandbox!.rateLimitPerMinute,
        allowedEndpoints: retrievedSandbox!.allowedEndpoints,
      };

      // These are the fields displayed in CredentialsDisplay
      expect(credentials.apiKey).toBeDefined();
      expect(credentials.apiSecret).toBeDefined();
      expect(credentials.id).toBeDefined(); // CLIENT_ID
      expect(credentials.baseUrl).toBeDefined();
      expect(credentials.allowedEndpoints.length).toBeGreaterThan(0);
    });
  });
});
