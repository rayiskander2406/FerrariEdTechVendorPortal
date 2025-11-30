/**
 * Cross-Layer Consistency Tests for OneRoster Configuration
 *
 * These tests verify that all components using OneRoster endpoints
 * derive their configuration from the centralized source of truth.
 *
 * Created after BUG-002 revealed that duplicated endpoint definitions
 * across files (db, handlers, UI) caused configuration drift.
 *
 * @see lib/config/oneroster.ts - Single source of truth
 * @see .claude/tickets/BUG-002-sandbox-endpoints-ignored.md
 */

import { describe, it, expect } from "vitest";
import {
  ONEROSTER_ENDPOINTS,
  ONEROSTER_ENDPOINT_METADATA,
  ONEROSTER_RESOURCE_TO_ENDPOINT,
  DEFAULT_ONEROSTER_ENDPOINTS,
  validateEndpoints,
  resourcesToEndpoints,
  normalizeEndpoint,
  resourceToEndpoint,
  getEndpointMetadata,
} from "@/lib/config/oneroster";
import { getOneRosterResponse } from "@/lib/data/synthetic";

// =============================================================================
// CENTRALIZED CONFIG INTEGRITY TESTS
// =============================================================================

describe("OneRoster Centralized Config", () => {
  describe("ONEROSTER_ENDPOINTS", () => {
    it("should define exactly 7 endpoints", () => {
      expect(ONEROSTER_ENDPOINTS).toHaveLength(7);
    });

    it("should include all required endpoints", () => {
      const required = [
        "/users",
        "/classes",
        "/courses",
        "/enrollments",
        "/orgs",
        "/academicSessions",
        "/demographics",
      ];
      required.forEach((ep) => {
        expect(ONEROSTER_ENDPOINTS).toContain(ep);
      });
    });

    it("should have all endpoints starting with /", () => {
      ONEROSTER_ENDPOINTS.forEach((ep) => {
        expect(ep).toMatch(/^\//);
      });
    });
  });

  describe("ONEROSTER_ENDPOINT_METADATA", () => {
    it("should have metadata for all endpoints", () => {
      expect(ONEROSTER_ENDPOINT_METADATA).toHaveLength(ONEROSTER_ENDPOINTS.length);
    });

    it("should have consistent endpoint values with ONEROSTER_ENDPOINTS", () => {
      const metadataEndpoints = ONEROSTER_ENDPOINT_METADATA.map((m) => m.value);
      ONEROSTER_ENDPOINTS.forEach((ep) => {
        expect(metadataEndpoints).toContain(ep);
      });
    });

    it("should have required fields for all metadata entries", () => {
      ONEROSTER_ENDPOINT_METADATA.forEach((meta) => {
        expect(meta.value).toBeTruthy();
        expect(meta.label).toBeTruthy();
        expect(meta.description).toBeTruthy();
        expect(meta.responseKey).toBeTruthy();
      });
    });

    it("should have unique response keys", () => {
      const keys = ONEROSTER_ENDPOINT_METADATA.map((m) => m.responseKey);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });

  describe("DEFAULT_ONEROSTER_ENDPOINTS", () => {
    it("should be a subset of ONEROSTER_ENDPOINTS", () => {
      DEFAULT_ONEROSTER_ENDPOINTS.forEach((ep) => {
        expect(ONEROSTER_ENDPOINTS).toContain(ep);
      });
    });

    it("should not include demographics by default", () => {
      expect(DEFAULT_ONEROSTER_ENDPOINTS).not.toContain("/demographics");
    });
  });

  describe("ONEROSTER_RESOURCE_TO_ENDPOINT mapping", () => {
    it("should map all standard resource names", () => {
      const standardResources = [
        "users",
        "classes",
        "courses",
        "enrollments",
        "orgs",
        "demographics",
      ];
      standardResources.forEach((resource) => {
        expect(ONEROSTER_RESOURCE_TO_ENDPOINT[resource]).toBeDefined();
      });
    });

    it("should handle academicSessions variations", () => {
      expect(ONEROSTER_RESOURCE_TO_ENDPOINT["academicSessions"]).toBe("/academicSessions");
      expect(ONEROSTER_RESOURCE_TO_ENDPOINT["sessions"]).toBe("/academicSessions");
    });

    it("should handle organizations alias", () => {
      expect(ONEROSTER_RESOURCE_TO_ENDPOINT["organizations"]).toBe("/orgs");
      expect(ONEROSTER_RESOURCE_TO_ENDPOINT["orgs"]).toBe("/orgs");
    });
  });
});

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe("OneRoster Config Helper Functions", () => {
  describe("normalizeEndpoint", () => {
    it("should normalize endpoints without leading slash", () => {
      expect(normalizeEndpoint("users")).toBe("/users");
      expect(normalizeEndpoint("classes")).toBe("/classes");
    });

    it("should keep endpoints with leading slash", () => {
      expect(normalizeEndpoint("/users")).toBe("/users");
      expect(normalizeEndpoint("/demographics")).toBe("/demographics");
    });

    it("should be case-insensitive", () => {
      expect(normalizeEndpoint("USERS")).toBe("/users");
      expect(normalizeEndpoint("/AcademicSessions")).toBe("/academicSessions");
    });

    it("should return undefined for invalid endpoints", () => {
      expect(normalizeEndpoint("invalid")).toBeUndefined();
      expect(normalizeEndpoint("/notreal")).toBeUndefined();
    });
  });

  describe("resourceToEndpoint", () => {
    it("should map standard resources", () => {
      expect(resourceToEndpoint("users")).toBe("/users");
      expect(resourceToEndpoint("classes")).toBe("/classes");
    });

    it("should be case-insensitive", () => {
      expect(resourceToEndpoint("USERS")).toBe("/users");
      expect(resourceToEndpoint("Classes")).toBe("/classes");
    });

    it("should handle aliases", () => {
      expect(resourceToEndpoint("sessions")).toBe("/academicSessions");
      expect(resourceToEndpoint("organizations")).toBe("/orgs");
    });

    it("should return undefined for invalid resources", () => {
      expect(resourceToEndpoint("invalid")).toBeUndefined();
    });
  });

  describe("validateEndpoints", () => {
    it("should return defaults when no endpoints provided", () => {
      expect(validateEndpoints()).toEqual(DEFAULT_ONEROSTER_ENDPOINTS);
      expect(validateEndpoints([])).toEqual(DEFAULT_ONEROSTER_ENDPOINTS);
    });

    it("should filter invalid endpoints", () => {
      const result = validateEndpoints(["/users", "/invalid", "/classes"]);
      expect(result).toContain("/users");
      expect(result).toContain("/classes");
      expect(result).not.toContain("/invalid");
    });

    it("should deduplicate endpoints", () => {
      const result = validateEndpoints(["/users", "/users", "/classes"]);
      const userCount = result.filter((ep) => ep === "/users").length;
      expect(userCount).toBe(1);
    });

    it("should normalize endpoint formats", () => {
      const result = validateEndpoints(["users", "/classes"]);
      expect(result).toContain("/users");
      expect(result).toContain("/classes");
    });

    it("should return defaults if all endpoints invalid", () => {
      const result = validateEndpoints(["/invalid1", "/invalid2"]);
      expect(result).toEqual(DEFAULT_ONEROSTER_ENDPOINTS);
    });
  });

  describe("resourcesToEndpoints", () => {
    it("should return undefined for empty resources", () => {
      expect(resourcesToEndpoints()).toBeUndefined();
      expect(resourcesToEndpoints([])).toBeUndefined();
    });

    it("should map valid resources to endpoints", () => {
      const result = resourcesToEndpoints(["users", "classes"]);
      expect(result).toContain("/users");
      expect(result).toContain("/classes");
    });

    it("should filter invalid resources", () => {
      const result = resourcesToEndpoints(["users", "invalid", "classes"]);
      expect(result).toHaveLength(2);
      expect(result).toContain("/users");
      expect(result).toContain("/classes");
    });

    it("should return undefined if all resources invalid", () => {
      const result = resourcesToEndpoints(["invalid1", "invalid2"]);
      expect(result).toBeUndefined();
    });
  });

  describe("getEndpointMetadata", () => {
    it("should return metadata for valid endpoints", () => {
      const meta = getEndpointMetadata("/users");
      expect(meta).toBeDefined();
      expect(meta?.label).toBe("Users");
      expect(meta?.responseKey).toBe("users");
    });

    it("should return undefined for invalid endpoints", () => {
      const meta = getEndpointMetadata("/invalid" as any);
      expect(meta).toBeUndefined();
    });

    it("should have responseKey matching expected format", () => {
      ONEROSTER_ENDPOINTS.forEach((ep) => {
        const meta = getEndpointMetadata(ep);
        expect(meta).toBeDefined();
        // responseKey should not have leading slash
        expect(meta?.responseKey).not.toMatch(/^\//);
      });
    });
  });
});

// =============================================================================
// CROSS-LAYER CONSISTENCY TESTS
// =============================================================================

describe("Cross-Layer Consistency", () => {
  describe("Synthetic Data Layer", () => {
    it("should support all endpoints defined in config", () => {
      ONEROSTER_ENDPOINTS.forEach((endpoint) => {
        // This should not throw
        const response = getOneRosterResponse(endpoint, undefined, 5, 0);
        expect(response).toBeDefined();
      });
    });

    it("should return data with correct response keys", () => {
      ONEROSTER_ENDPOINT_METADATA.forEach((meta) => {
        const response = getOneRosterResponse(meta.value, undefined, 5, 0);
        const resp = response as Record<string, unknown>;
        expect(resp[meta.responseKey]).toBeDefined();
        expect(Array.isArray(resp[meta.responseKey])).toBe(true);
      });
    });
  });

  describe("Endpoint Count Verification", () => {
    it("should have same count across all configurations", () => {
      const configCount = ONEROSTER_ENDPOINTS.length;
      const metadataCount = ONEROSTER_ENDPOINT_METADATA.length;

      expect(metadataCount).toBe(configCount);
      expect(configCount).toBe(7); // Known expected count
    });
  });

  describe("Future-Proofing", () => {
    it("should fail if new endpoint added to config but not metadata", () => {
      // This test ensures metadata is kept in sync
      const configEndpoints = new Set(ONEROSTER_ENDPOINTS);
      const metadataEndpoints = new Set(ONEROSTER_ENDPOINT_METADATA.map((m) => m.value));

      // Every config endpoint should have metadata
      configEndpoints.forEach((ep) => {
        expect(metadataEndpoints.has(ep)).toBe(true);
      });

      // Every metadata endpoint should be in config
      metadataEndpoints.forEach((ep) => {
        expect(configEndpoints.has(ep)).toBe(true);
      });
    });

    it("should fail if endpoint added without resource mapping", () => {
      // Ensure all endpoints can be reached via resource names
      const mappedEndpoints = new Set(Object.values(ONEROSTER_RESOURCE_TO_ENDPOINT));
      ONEROSTER_ENDPOINTS.forEach((ep) => {
        expect(mappedEndpoints.has(ep)).toBe(true);
      });
    });
  });
});
