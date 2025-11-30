/**
 * SSO Helper Functions Unit Tests
 *
 * Additional tests for SSO helper functions to achieve high coverage.
 * Focuses on edge cases and rarely-used code paths.
 *
 * @vitest-environment node
 */

import { describe, it, expect } from "vitest";
import {
  SSO_PROVIDERS,
  ALL_PROVIDER_KEYS,
  ALL_PROVIDER_IDS,
  SsoProviderEnum,
  SsoProviderEnumWithSchoolDay,
  AI_TOOL_SSO_PROVIDERS,
  getProviderById,
  getProviderByKey,
  isValidProviderId,
  isValidProviderKey,
  getProviderDomain,
  getSsoProviderInfo,
  providerKeyToId,
  providerIdToKey,
  SSO_PROVIDER_OPTIONS,
  SSO_SCOPES_BY_PROVIDER,
  type SsoProviderKey,
  type SsoProviderId,
} from "@/lib/config/sso";

// =============================================================================
// HELPER FUNCTION EDGE CASE TESTS
// =============================================================================

describe("SSO Helper Functions - Edge Cases", () => {
  describe("getProviderById", () => {
    it("should return undefined for empty string", () => {
      expect(getProviderById("")).toBeUndefined();
    });

    it("should return undefined for UPPERCASE ID", () => {
      expect(getProviderById("CLEVER")).toBeUndefined();
    });

    it("should return undefined for mixed case", () => {
      expect(getProviderById("Clever")).toBeUndefined();
    });

    it("should return undefined for partial match", () => {
      expect(getProviderById("clev")).toBeUndefined();
    });

    it("should return provider for all valid IDs", () => {
      for (const id of ALL_PROVIDER_IDS) {
        const provider = getProviderById(id);
        expect(provider).toBeDefined();
        expect(provider?.id).toBe(id);
      }
    });
  });

  describe("getProviderByKey", () => {
    it("should return undefined for empty string", () => {
      expect(getProviderByKey("")).toBeUndefined();
    });

    it("should return undefined for lowercase key", () => {
      expect(getProviderByKey("clever")).toBeUndefined();
    });

    it("should return undefined for mixed case", () => {
      expect(getProviderByKey("Clever")).toBeUndefined();
    });

    it("should return undefined for invalid key", () => {
      expect(getProviderByKey("INVALID_PROVIDER")).toBeUndefined();
    });

    it("should return provider for all valid keys", () => {
      for (const key of ALL_PROVIDER_KEYS) {
        const provider = getProviderByKey(key);
        expect(provider).toBeDefined();
        expect(provider?.id).toBe(key.toLowerCase());
      }
    });
  });

  describe("isValidProviderId", () => {
    it("should return false for empty string", () => {
      expect(isValidProviderId("")).toBe(false);
    });

    it("should return false for UPPERCASE", () => {
      expect(isValidProviderId("CLEVER")).toBe(false);
    });

    it("should return false for unknown provider", () => {
      expect(isValidProviderId("azure")).toBe(false);
    });

    it("should return true for all provider IDs", () => {
      for (const id of ALL_PROVIDER_IDS) {
        expect(isValidProviderId(id)).toBe(true);
      }
    });
  });

  describe("isValidProviderKey", () => {
    it("should return false for empty string", () => {
      expect(isValidProviderKey("")).toBe(false);
    });

    it("should return false for lowercase", () => {
      expect(isValidProviderKey("clever")).toBe(false);
    });

    it("should return false for unknown provider", () => {
      expect(isValidProviderKey("AZURE")).toBe(false);
    });

    it("should return true for all provider keys", () => {
      for (const key of ALL_PROVIDER_KEYS) {
        expect(isValidProviderKey(key)).toBe(true);
      }
    });
  });

  describe("getProviderDomain", () => {
    it("should return domain for valid provider", () => {
      expect(getProviderDomain("CLEVER")).toBe("clever.com");
      expect(getProviderDomain("CLASSLINK")).toBe("classlink.com");
      expect(getProviderDomain("GOOGLE")).toBe("accounts.google.com");
      expect(getProviderDomain("SCHOOLDAY")).toBe("schoolday.lausd.net");
    });

    it("should return lowercase key as fallback for unknown provider", () => {
      expect(getProviderDomain("UNKNOWN")).toBe("unknown");
      expect(getProviderDomain("AZURE")).toBe("azure");
    });

    it("should handle lowercase input as fallback", () => {
      expect(getProviderDomain("clever")).toBe("clever");
    });
  });

  describe("getSsoProviderInfo", () => {
    it("should return provider info for valid key", () => {
      const info = getSsoProviderInfo("CLEVER");
      expect(info.name).toBe("Clever");
      expect(info.website).toBe("https://clever.com");
      expect(info.devPortal).toBe("https://dev.clever.com");
      expect(info.docUrl).toBe("https://dev.clever.com/docs");
      expect(info.typicalUse).toBe("K-8 applications, instant login");
    });

    it("should return default object for unknown provider", () => {
      const info = getSsoProviderInfo("UNKNOWN_PROVIDER");
      expect(info.name).toBe("UNKNOWN_PROVIDER");
      expect(info.website).toBe("");
      expect(info.devPortal).toBe("");
      expect(info.docUrl).toBe("");
      expect(info.typicalUse).toBe("");
    });

    it("should return default for lowercase key", () => {
      const info = getSsoProviderInfo("clever");
      expect(info.name).toBe("clever");
      expect(info.website).toBe("");
    });

    it("should return info for all valid keys", () => {
      for (const key of ALL_PROVIDER_KEYS) {
        const info = getSsoProviderInfo(key);
        expect(info.name).toBeTruthy();
        expect(info.website).toContain("http");
      }
    });
  });

  describe("providerKeyToId", () => {
    it("should convert all keys to IDs", () => {
      expect(providerKeyToId("CLEVER")).toBe("clever");
      expect(providerKeyToId("CLASSLINK")).toBe("classlink");
      expect(providerKeyToId("GOOGLE")).toBe("google");
      expect(providerKeyToId("SCHOOLDAY")).toBe("schoolday");
    });
  });

  describe("providerIdToKey", () => {
    it("should convert all IDs to keys", () => {
      expect(providerIdToKey("clever")).toBe("CLEVER");
      expect(providerIdToKey("classlink")).toBe("CLASSLINK");
      expect(providerIdToKey("google")).toBe("GOOGLE");
      expect(providerIdToKey("schoolday")).toBe("SCHOOLDAY");
    });

    it("should return undefined for unknown ID", () => {
      expect(providerIdToKey("unknown")).toBeUndefined();
      expect(providerIdToKey("azure")).toBeUndefined();
      expect(providerIdToKey("")).toBeUndefined();
    });

    it("should return undefined for UPPERCASE input", () => {
      expect(providerIdToKey("CLEVER")).toBeUndefined();
    });
  });
});

// =============================================================================
// ZOD SCHEMA TESTS
// =============================================================================

describe("SSO Zod Schemas", () => {
  describe("SsoProviderEnum (3 providers)", () => {
    it("should validate CLEVER", () => {
      expect(SsoProviderEnum.safeParse("CLEVER").success).toBe(true);
    });

    it("should validate CLASSLINK", () => {
      expect(SsoProviderEnum.safeParse("CLASSLINK").success).toBe(true);
    });

    it("should validate GOOGLE", () => {
      expect(SsoProviderEnum.safeParse("GOOGLE").success).toBe(true);
    });

    it("should reject SCHOOLDAY (not in AI tool enum)", () => {
      expect(SsoProviderEnum.safeParse("SCHOOLDAY").success).toBe(false);
    });

    it("should reject lowercase", () => {
      expect(SsoProviderEnum.safeParse("clever").success).toBe(false);
    });

    it("should reject invalid provider", () => {
      expect(SsoProviderEnum.safeParse("AZURE").success).toBe(false);
    });
  });

  describe("SsoProviderEnumWithSchoolDay (4 providers)", () => {
    it("should validate SCHOOLDAY", () => {
      expect(SsoProviderEnumWithSchoolDay.safeParse("SCHOOLDAY").success).toBe(true);
    });

    it("should validate CLEVER", () => {
      expect(SsoProviderEnumWithSchoolDay.safeParse("CLEVER").success).toBe(true);
    });

    it("should validate CLASSLINK", () => {
      expect(SsoProviderEnumWithSchoolDay.safeParse("CLASSLINK").success).toBe(true);
    });

    it("should validate GOOGLE", () => {
      expect(SsoProviderEnumWithSchoolDay.safeParse("GOOGLE").success).toBe(true);
    });

    it("should reject invalid provider", () => {
      expect(SsoProviderEnumWithSchoolDay.safeParse("AZURE").success).toBe(false);
    });
  });
});

// =============================================================================
// UI CONFIGURATION TESTS
// =============================================================================

describe("SSO UI Configuration", () => {
  describe("SSO_PROVIDER_OPTIONS", () => {
    it("should have 4 options", () => {
      expect(SSO_PROVIDER_OPTIONS).toHaveLength(4);
    });

    it("should have value, label, description for each option", () => {
      for (const option of SSO_PROVIDER_OPTIONS) {
        expect(option.value).toBeDefined();
        expect(option.label).toBeDefined();
        expect(option.description).toBeDefined();
        expect(option.icon).toBeDefined();
      }
    });

    it("should have correct values", () => {
      const values = SSO_PROVIDER_OPTIONS.map((o) => o.value);
      expect(values).toContain("CLEVER");
      expect(values).toContain("CLASSLINK");
      expect(values).toContain("GOOGLE");
      expect(values).toContain("SCHOOLDAY");
    });
  });

  describe("SSO_SCOPES_BY_PROVIDER", () => {
    it("should have scopes for all providers", () => {
      expect(SSO_SCOPES_BY_PROVIDER.SCHOOLDAY).toBeDefined();
      expect(SSO_SCOPES_BY_PROVIDER.CLEVER).toBeDefined();
      expect(SSO_SCOPES_BY_PROVIDER.CLASSLINK).toBeDefined();
      expect(SSO_SCOPES_BY_PROVIDER.GOOGLE).toBeDefined();
    });

    it("should have value, label, description for each scope", () => {
      for (const provider of ALL_PROVIDER_KEYS) {
        const scopes = SSO_SCOPES_BY_PROVIDER[provider];
        expect(scopes.length).toBeGreaterThan(0);
        for (const scope of scopes) {
          expect(scope.value).toBeDefined();
          expect(scope.label).toBeDefined();
          expect(scope.description).toBeDefined();
        }
      }
    });

    it("should have SchoolDay tokenized scope", () => {
      const tokenizedScope = SSO_SCOPES_BY_PROVIDER.SCHOOLDAY.find(
        (s) => s.value === "student:tokenized"
      );
      expect(tokenizedScope).toBeDefined();
    });
  });
});

// =============================================================================
// AI TOOL SSO PROVIDERS TESTS
// =============================================================================

describe("AI_TOOL_SSO_PROVIDERS", () => {
  it("should have exactly 3 providers", () => {
    expect(AI_TOOL_SSO_PROVIDERS).toHaveLength(3);
  });

  it("should include CLEVER, CLASSLINK, GOOGLE", () => {
    expect(AI_TOOL_SSO_PROVIDERS).toContain("CLEVER");
    expect(AI_TOOL_SSO_PROVIDERS).toContain("CLASSLINK");
    expect(AI_TOOL_SSO_PROVIDERS).toContain("GOOGLE");
  });

  it("should NOT include SCHOOLDAY", () => {
    expect(AI_TOOL_SSO_PROVIDERS).not.toContain("SCHOOLDAY");
  });
});

// =============================================================================
// SSO_PROVIDERS STRUCTURE TESTS
// =============================================================================

describe("SSO_PROVIDERS Structure", () => {
  it("should have icon defined for each provider", () => {
    for (const key of ALL_PROVIDER_KEYS) {
      expect(SSO_PROVIDERS[key].icon).toBeDefined();
      expect(SSO_PROVIDERS[key].icon.length).toBeGreaterThan(0);
    }
  });

  it("should have consistent structure", () => {
    for (const key of ALL_PROVIDER_KEYS) {
      const provider = SSO_PROVIDERS[key];
      expect(provider.id).toBe(key.toLowerCase());
      expect(provider.name).toBeTruthy();
      expect(provider.website).toMatch(/^https?:\/\//);
      expect(provider.devPortal).toMatch(/^https?:\/\//);
      expect(provider.docUrl).toMatch(/^https?:\/\//);
      expect(provider.domain).toBeTruthy();
      expect(provider.typicalUse).toBeTruthy();
      expect(provider.description).toBeTruthy();
      expect(provider.icon).toBeTruthy();
    }
  });
});
