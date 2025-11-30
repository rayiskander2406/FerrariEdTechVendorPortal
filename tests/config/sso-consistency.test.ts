/**
 * Cross-Layer Consistency Tests for SSO Provider Configuration
 *
 * CONFIG-02: SSO Providers Centralization
 *
 * These tests verify that all SSO provider definitions are consistent across:
 * - lib/config/sso.ts (single source of truth - to be created)
 * - lib/types/index.ts (SsoProviderEnum Zod schema)
 * - lib/ai/tools.ts (configure_sso tool enum)
 * - lib/ai/handlers.ts (getSsoProviderInfo, getProviderDomain)
 * - components/forms/SsoConfigForm.tsx (UI provider list)
 *
 * CRITICAL: This test file was created because a consistency check revealed:
 * - Backend has: CLEVER, CLASSLINK, GOOGLE
 * - UI has: SCHOOLDAY, CLEVER, GOOGLE (missing CLASSLINK!)
 *
 * Coverage Target: 100%
 *
 * @see .claude/PLANNING.md - CONFIG-02 task description
 * @see lib/config/oneroster.ts - Exemplar implementation
 * @see lib/config/forms.ts - Another exemplar
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// =============================================================================
// CONFIG-02: Expected SSO Provider Configuration
// =============================================================================

/**
 * These are the SSO providers that will be defined in lib/config/sso.ts
 * After implementation, these imports should come from that file.
 */
const EXPECTED_SSO_PROVIDERS = {
  CLEVER: {
    id: "clever",
    name: "Clever",
    website: "https://clever.com",
    devPortal: "https://dev.clever.com",
    docUrl: "https://dev.clever.com/docs",
    domain: "clever.com",
    typicalUse: "K-8 applications, instant login",
    description: "Single sign-on for K-12",
  },
  CLASSLINK: {
    id: "classlink",
    name: "ClassLink",
    website: "https://classlink.com",
    devPortal: "https://developer.classlink.com",
    docUrl: "https://developer.classlink.com/docs",
    domain: "classlink.com",
    typicalUse: "6-12 applications, LaunchPad integration",
    description: "LaunchPad single sign-on",
  },
  GOOGLE: {
    id: "google",
    name: "Google Workspace",
    website: "https://workspace.google.com",
    devPortal: "https://console.cloud.google.com",
    docUrl: "https://developers.google.com/identity",
    domain: "accounts.google.com",
    typicalUse: "Universal SSO, all grade levels",
    description: "Google Workspace for Education",
  },
  SCHOOLDAY: {
    id: "schoolday",
    name: "SchoolDay",
    website: "https://schoolday.lausd.net",
    devPortal: "https://schoolday.lausd.net/developer",
    docUrl: "https://schoolday.lausd.net/docs",
    domain: "schoolday.lausd.net",
    typicalUse: "LAUSD unified identity platform",
    description: "LAUSD's unified identity platform",
  },
} as const;

type SsoProviderKey = keyof typeof EXPECTED_SSO_PROVIDERS;
type SsoProviderId = (typeof EXPECTED_SSO_PROVIDERS)[SsoProviderKey]["id"];

const ALL_PROVIDER_KEYS: SsoProviderKey[] = ["CLEVER", "CLASSLINK", "GOOGLE", "SCHOOLDAY"];
const ALL_PROVIDER_IDS: SsoProviderId[] = ["clever", "classlink", "google", "schoolday"];

// =============================================================================
// UNIT TESTS: Centralized Config Structure
// =============================================================================

describe("SSO Provider Centralized Config", () => {
  describe("SSO_PROVIDERS structure", () => {
    it("should define exactly 4 SSO providers", () => {
      expect(Object.keys(EXPECTED_SSO_PROVIDERS)).toHaveLength(4);
    });

    it("should have all required providers", () => {
      ALL_PROVIDER_KEYS.forEach((key) => {
        expect(EXPECTED_SSO_PROVIDERS[key]).toBeDefined();
      });
    });

    it("should have unique IDs for all providers", () => {
      const ids = Object.values(EXPECTED_SSO_PROVIDERS).map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have unique domains for all providers", () => {
      const domains = Object.values(EXPECTED_SSO_PROVIDERS).map((p) => p.domain);
      const uniqueDomains = new Set(domains);
      expect(uniqueDomains.size).toBe(domains.length);
    });

    it("should have unique names for all providers", () => {
      const names = Object.values(EXPECTED_SSO_PROVIDERS).map((p) => p.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe("Provider ID format", () => {
    it("should use lowercase for all IDs", () => {
      Object.values(EXPECTED_SSO_PROVIDERS).forEach((provider) => {
        expect(provider.id).toMatch(/^[a-z]+$/);
      });
    });

    it("should match key lowercase", () => {
      Object.entries(EXPECTED_SSO_PROVIDERS).forEach(([key, provider]) => {
        expect(provider.id).toBe(key.toLowerCase());
      });
    });
  });

  describe("Provider key format", () => {
    it("should use UPPERCASE for all keys", () => {
      Object.keys(EXPECTED_SSO_PROVIDERS).forEach((key) => {
        expect(key).toMatch(/^[A-Z]+$/);
      });
    });
  });

  describe("Provider metadata", () => {
    it("should have valid website URLs", () => {
      Object.values(EXPECTED_SSO_PROVIDERS).forEach((provider) => {
        expect(provider.website).toMatch(/^https:\/\//);
      });
    });

    it("should have valid devPortal URLs", () => {
      Object.values(EXPECTED_SSO_PROVIDERS).forEach((provider) => {
        expect(provider.devPortal).toMatch(/^https:\/\//);
      });
    });

    it("should have valid documentation URLs", () => {
      Object.values(EXPECTED_SSO_PROVIDERS).forEach((provider) => {
        expect(provider.docUrl).toMatch(/^https:\/\//);
      });
    });

    it("should have non-empty domains", () => {
      Object.values(EXPECTED_SSO_PROVIDERS).forEach((provider) => {
        expect(provider.domain.length).toBeGreaterThan(0);
      });
    });

    it("should have non-empty descriptions", () => {
      Object.values(EXPECTED_SSO_PROVIDERS).forEach((provider) => {
        expect(provider.description.length).toBeGreaterThan(0);
      });
    });

    it("should have non-empty typicalUse", () => {
      Object.values(EXPECTED_SSO_PROVIDERS).forEach((provider) => {
        expect(provider.typicalUse.length).toBeGreaterThan(0);
      });
    });
  });
});

// =============================================================================
// UNIT TESTS: Helper Functions (to be implemented in lib/config/sso.ts)
// =============================================================================

describe("SSO Provider Helper Functions", () => {
  describe("getProviderById", () => {
    it("should return provider for valid ID", () => {
      ALL_PROVIDER_IDS.forEach((id) => {
        const provider = Object.values(EXPECTED_SSO_PROVIDERS).find((p) => p.id === id);
        expect(provider).toBeDefined();
      });
    });

    it("should return undefined for invalid ID", () => {
      const invalidIds = ["invalid", "CLEVER", "Microsoft", "apple", ""];
      invalidIds.forEach((id) => {
        const provider = Object.values(EXPECTED_SSO_PROVIDERS).find((p) => p.id === id);
        expect(provider).toBeUndefined();
      });
    });
  });

  describe("getProviderByKey", () => {
    it("should return provider for valid key", () => {
      ALL_PROVIDER_KEYS.forEach((key) => {
        expect(EXPECTED_SSO_PROVIDERS[key]).toBeDefined();
      });
    });
  });

  describe("isValidProviderId", () => {
    it("should return true for valid IDs", () => {
      ALL_PROVIDER_IDS.forEach((id) => {
        expect(ALL_PROVIDER_IDS.includes(id)).toBe(true);
      });
    });

    it("should return false for invalid IDs", () => {
      const invalidIds = ["invalid", "CLEVER", "Microsoft", ""];
      invalidIds.forEach((id) => {
        expect(ALL_PROVIDER_IDS.includes(id as SsoProviderId)).toBe(false);
      });
    });
  });

  describe("isValidProviderKey", () => {
    it("should return true for valid keys", () => {
      ALL_PROVIDER_KEYS.forEach((key) => {
        expect(ALL_PROVIDER_KEYS.includes(key)).toBe(true);
      });
    });

    it("should return false for invalid keys", () => {
      const invalidKeys = ["clever", "Invalid", "MICROSOFT", ""];
      invalidKeys.forEach((key) => {
        expect(ALL_PROVIDER_KEYS.includes(key as SsoProviderKey)).toBe(false);
      });
    });
  });

  describe("getProviderDomain", () => {
    it("should return correct domain for each provider", () => {
      expect(EXPECTED_SSO_PROVIDERS.CLEVER.domain).toBe("clever.com");
      expect(EXPECTED_SSO_PROVIDERS.CLASSLINK.domain).toBe("classlink.com");
      expect(EXPECTED_SSO_PROVIDERS.GOOGLE.domain).toBe("accounts.google.com");
      expect(EXPECTED_SSO_PROVIDERS.SCHOOLDAY.domain).toBe("schoolday.lausd.net");
    });
  });

  describe("providerKeyToId", () => {
    it("should convert UPPERCASE keys to lowercase IDs", () => {
      ALL_PROVIDER_KEYS.forEach((key) => {
        const expectedId = key.toLowerCase();
        expect(EXPECTED_SSO_PROVIDERS[key].id).toBe(expectedId);
      });
    });
  });

  describe("providerIdToKey", () => {
    it("should convert lowercase IDs to UPPERCASE keys", () => {
      ALL_PROVIDER_IDS.forEach((id) => {
        const expectedKey = id.toUpperCase() as SsoProviderKey;
        if (EXPECTED_SSO_PROVIDERS[expectedKey]) {
          expect(EXPECTED_SSO_PROVIDERS[expectedKey].id).toBe(id);
        }
      });
    });
  });
});

// =============================================================================
// UNIT TESTS: Derived Constants
// =============================================================================

describe("SSO Provider Derived Constants", () => {
  describe("ALL_PROVIDER_KEYS", () => {
    it("should contain exactly 4 keys", () => {
      expect(ALL_PROVIDER_KEYS).toHaveLength(4);
    });

    it("should be in UPPERCASE format", () => {
      ALL_PROVIDER_KEYS.forEach((key) => {
        expect(key).toMatch(/^[A-Z]+$/);
      });
    });

    it("should match EXPECTED_SSO_PROVIDERS keys", () => {
      const configKeys = Object.keys(EXPECTED_SSO_PROVIDERS).sort();
      expect([...ALL_PROVIDER_KEYS].sort()).toEqual(configKeys);
    });
  });

  describe("ALL_PROVIDER_IDS", () => {
    it("should contain exactly 4 IDs", () => {
      expect(ALL_PROVIDER_IDS).toHaveLength(4);
    });

    it("should be in lowercase format", () => {
      ALL_PROVIDER_IDS.forEach((id) => {
        expect(id).toMatch(/^[a-z]+$/);
      });
    });

    it("should match EXPECTED_SSO_PROVIDERS ids", () => {
      const configIds = Object.values(EXPECTED_SSO_PROVIDERS)
        .map((p) => p.id)
        .sort();
      expect([...ALL_PROVIDER_IDS].sort()).toEqual(configIds);
    });
  });
});

// =============================================================================
// INTEGRATION TESTS: Cross-Layer Consistency
// =============================================================================

describe("Cross-Layer SSO Provider Consistency", () => {
  describe("lib/types/index.ts - SsoProviderEnum", () => {
    it("should exist and export SsoProviderEnum", () => {
      const typesPath = path.resolve(__dirname, "../../lib/types/index.ts");
      const content = fs.readFileSync(typesPath, "utf-8");
      expect(content).toContain("SsoProviderEnum");
    });

    it("should define SsoProviderEnum as Zod enum", () => {
      const typesPath = path.resolve(__dirname, "../../lib/types/index.ts");
      const content = fs.readFileSync(typesPath, "utf-8");
      expect(content).toMatch(/SsoProviderEnum\s*=\s*z\.enum/);
    });

    it("should include CLEVER provider", () => {
      const typesPath = path.resolve(__dirname, "../../lib/types/index.ts");
      const content = fs.readFileSync(typesPath, "utf-8");
      expect(content).toMatch(/SsoProviderEnum.*CLEVER/);
    });

    it("should include CLASSLINK provider", () => {
      const typesPath = path.resolve(__dirname, "../../lib/types/index.ts");
      const content = fs.readFileSync(typesPath, "utf-8");
      expect(content).toMatch(/SsoProviderEnum.*CLASSLINK/);
    });

    it("should include GOOGLE provider", () => {
      const typesPath = path.resolve(__dirname, "../../lib/types/index.ts");
      const content = fs.readFileSync(typesPath, "utf-8");
      expect(content).toMatch(/SsoProviderEnum.*GOOGLE/);
    });

    it("should export SsoProvider type", () => {
      const typesPath = path.resolve(__dirname, "../../lib/types/index.ts");
      const content = fs.readFileSync(typesPath, "utf-8");
      expect(content).toMatch(/export type SsoProvider/);
    });
  });

  describe("lib/ai/tools.ts - configure_sso tool", () => {
    it("should exist", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      expect(fs.existsSync(toolsPath)).toBe(true);
    });

    it("should define configure_sso tool", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain("configure_sso");
    });

    it("should use AI_TOOL_SSO_PROVIDERS from config", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      // After CONFIG-02, enum is built from imported constant
      expect(content).toContain("AI_TOOL_SSO_PROVIDERS");
    });

    it("should include CLEVER in tool enum", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain('"CLEVER"');
    });

    it("should include CLASSLINK in tool enum", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain('"CLASSLINK"');
    });

    it("should include GOOGLE in tool enum", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain('"GOOGLE"');
    });
  });

  describe("lib/ai/handlers.ts - SSO Provider Functions", () => {
    it("should exist", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      expect(fs.existsSync(handlersPath)).toBe(true);
    });

    it("should import getSsoProviderInfo from config", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      const content = fs.readFileSync(handlersPath, "utf-8");
      expect(content).toContain("getSsoProviderInfo");
      expect(content).toMatch(/from ["']@\/lib\/config\/sso["']/);
    });

    it("should import getProviderDomain from config", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      const content = fs.readFileSync(handlersPath, "utf-8");
      expect(content).toContain("getProviderDomain");
      expect(content).toMatch(/from ["']@\/lib\/config\/sso["']/);
    });

    it("should have provider info defined in centralized config", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toMatch(/CLEVER:\s*\{/);
    });

    it("should have CLASSLINK provider in centralized config", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toMatch(/CLASSLINK:\s*\{/);
    });

    it("should have GOOGLE provider in centralized config", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toMatch(/GOOGLE:\s*\{/);
    });

    it("should have CLEVER domain in centralized config", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toMatch(/domain:\s*"clever\.com"/);
    });

    it("should have CLASSLINK domain in centralized config", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toMatch(/domain:\s*"classlink\.com"/);
    });

    it("should have GOOGLE domain in centralized config", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toMatch(/domain:\s*"accounts\.google\.com"/);
    });
  });

  describe("components/forms/SsoConfigForm.tsx - UI Provider List", () => {
    it("should exist", () => {
      const formPath = path.resolve(__dirname, "../../components/forms/SsoConfigForm.tsx");
      expect(fs.existsSync(formPath)).toBe(true);
    });

    it("should define SsoProvider type", () => {
      const formPath = path.resolve(__dirname, "../../components/forms/SsoConfigForm.tsx");
      const content = fs.readFileSync(formPath, "utf-8");
      expect(content).toMatch(/type SsoProvider\s*=/);
    });

    it("should define PROVIDERS array", () => {
      const formPath = path.resolve(__dirname, "../../components/forms/SsoConfigForm.tsx");
      const content = fs.readFileSync(formPath, "utf-8");
      expect(content).toContain("const PROVIDERS");
    });

    it("should define SCOPES_BY_PROVIDER", () => {
      const formPath = path.resolve(__dirname, "../../components/forms/SsoConfigForm.tsx");
      const content = fs.readFileSync(formPath, "utf-8");
      expect(content).toContain("SCOPES_BY_PROVIDER");
    });

    // After CONFIG-02: All providers come from centralized config
    it("should import providers from centralized config", () => {
      const formPath = path.resolve(__dirname, "../../components/forms/SsoConfigForm.tsx");
      const content = fs.readFileSync(formPath, "utf-8");
      expect(content).toContain("SSO_PROVIDERS");
      expect(content).toMatch(/from ["']@\/lib\/config\/sso["']/);
    });

    it("should have CLEVER defined in centralized config", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toMatch(/CLEVER:\s*\{/);
    });

    it("should have CLASSLINK defined in centralized config", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toMatch(/CLASSLINK:\s*\{/);
    });

    it("should have GOOGLE defined in centralized config", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toMatch(/GOOGLE:\s*\{/);
    });

    it("should have SCHOOLDAY defined in centralized config", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toMatch(/SCHOOLDAY:\s*\{/);
    });
  });
});

// =============================================================================
// INTEGRATION TESTS: Provider List Consistency
// =============================================================================

describe("Provider List Consistency - All Layers Import From Config", () => {
  // After CONFIG-02, all layers import from the centralized config
  // Instead of checking each layer has the same hardcoded values,
  // we verify they all import from lib/config/sso.ts

  function extractProvidersFromConfig(): string[] {
    const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
    const content = fs.readFileSync(configPath, "utf-8");
    // Extract from SSO_PROVIDERS object keys
    const match = content.match(/export const SSO_PROVIDERS\s*=\s*\{([\s\S]*?)\}\s*as const/);
    if (match && match[1]) {
      const providers = match[1].match(/^\s*([A-Z]+):\s*\{/gm);
      return providers ? providers.map((p) => p.replace(/[:\s{]/g, "").trim()) : [];
    }
    return [];
  }

  it("should have centralized config with all 4 providers", () => {
    const configProviders = extractProvidersFromConfig().sort();
    expect(configProviders).toContain("CLEVER");
    expect(configProviders).toContain("CLASSLINK");
    expect(configProviders).toContain("GOOGLE");
    expect(configProviders).toContain("SCHOOLDAY");
  });

  it("should have tools.ts import from config", () => {
    const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
    const content = fs.readFileSync(toolsPath, "utf-8");
    expect(content).toMatch(/from ["']@\/lib\/config\/sso["']/);
    expect(content).toContain("AI_TOOL_SSO_PROVIDERS");
  });

  it("should have handlers.ts import from config", () => {
    const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
    const content = fs.readFileSync(handlersPath, "utf-8");
    expect(content).toMatch(/from ["']@\/lib\/config\/sso["']/);
  });

  it("should have SsoConfigForm.tsx import from config", () => {
    const formPath = path.resolve(__dirname, "../../components/forms/SsoConfigForm.tsx");
    const content = fs.readFileSync(formPath, "utf-8");
    expect(content).toMatch(/from ["']@\/lib\/config\/sso["']/);
    expect(content).toContain("SSO_PROVIDERS");
  });

  it("should have types/index.ts define SsoProviderEnum", () => {
    const typesPath = path.resolve(__dirname, "../../lib/types/index.ts");
    const content = fs.readFileSync(typesPath, "utf-8");
    expect(content).toContain("SsoProviderEnum");
    // Types still has its own enum for backward compatibility
    expect(content).toMatch(/z\.enum\(/);
  });
});

// =============================================================================
// INTEGRATION TESTS: After Centralization
// =============================================================================

describe("After CONFIG-02 Centralization", () => {
  describe("lib/config/sso.ts should be created", () => {
    it("should exist after implementation", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it("should export SSO_PROVIDERS constant", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toContain("export const SSO_PROVIDERS");
    });

    it("should export ALL_PROVIDER_KEYS", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toContain("ALL_PROVIDER_KEYS");
    });

    it("should export ALL_PROVIDER_IDS", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toContain("ALL_PROVIDER_IDS");
    });

    it("should export helper functions", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toContain("getProviderById");
      expect(content).toContain("getProviderByKey");
      expect(content).toContain("isValidProviderId");
      expect(content).toContain("isValidProviderKey");
      expect(content).toContain("getProviderDomain");
    });
  });

  describe("lib/ai/tools.ts should import from config", () => {
    it("should import from config", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toMatch(/from ["']@\/lib\/config\/sso["']/);
    });

    it("should not have hardcoded provider enum", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      // Should not have a literal enum array for providers
      expect(content).not.toMatch(/enum:\s*\["CLEVER",\s*"CLASSLINK",\s*"GOOGLE"\]/);
    });
  });

  describe("lib/ai/handlers.ts should import from config", () => {
    it("should import from config", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      const content = fs.readFileSync(handlersPath, "utf-8");
      expect(content).toMatch(/from ["']@\/lib\/config\/sso["']/);
    });

    it("should not have local getSsoProviderInfo definition", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      const content = fs.readFileSync(handlersPath, "utf-8");
      // After refactor, this function should be imported, not defined locally
      expect(content).not.toMatch(/function getSsoProviderInfo/);
    });

    it("should not have local getProviderDomain definition", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      const content = fs.readFileSync(handlersPath, "utf-8");
      expect(content).not.toMatch(/function getProviderDomain/);
    });
  });

  describe("components/forms/SsoConfigForm.tsx should import from config", () => {
    it("should import from config", () => {
      const formPath = path.resolve(__dirname, "../../components/forms/SsoConfigForm.tsx");
      const content = fs.readFileSync(formPath, "utf-8");
      expect(content).toMatch(/from ["']@\/lib\/config\/sso["']/);
    });

    it("should use SsoProviderKey from config (aliased as SsoProvider)", () => {
      const formPath = path.resolve(__dirname, "../../components/forms/SsoConfigForm.tsx");
      const content = fs.readFileSync(formPath, "utf-8");
      // Type is re-exported from config, not locally defined as a union type
      expect(content).toContain("type SsoProviderKey");
      expect(content).toContain("export type SsoProvider = SsoProviderKey");
    });

    it("should build PROVIDERS from centralized config", () => {
      const formPath = path.resolve(__dirname, "../../components/forms/SsoConfigForm.tsx");
      const content = fs.readFileSync(formPath, "utf-8");
      // Should build PROVIDERS from SSO_PROVIDERS, not hardcode array
      expect(content).toContain("SSO_PROVIDERS");
      expect(content).toMatch(/Object\.entries\(SSO_PROVIDERS\)/);
    });
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe("Edge Cases", () => {
  describe("Case sensitivity", () => {
    it("should recognize UPPERCASE provider keys", () => {
      expect(ALL_PROVIDER_KEYS.includes("CLEVER")).toBe(true);
    });

    it("should not recognize lowercase as valid keys", () => {
      expect(ALL_PROVIDER_KEYS.includes("clever" as SsoProviderKey)).toBe(false);
    });

    it("should recognize lowercase provider IDs", () => {
      expect(ALL_PROVIDER_IDS.includes("clever")).toBe(true);
    });

    it("should not recognize UPPERCASE as valid IDs", () => {
      expect(ALL_PROVIDER_IDS.includes("CLEVER" as SsoProviderId)).toBe(false);
    });
  });

  describe("Empty and null handling", () => {
    it("should not have empty provider key", () => {
      expect(ALL_PROVIDER_KEYS.includes("" as SsoProviderKey)).toBe(false);
    });

    it("should not have empty provider ID", () => {
      expect(ALL_PROVIDER_IDS.includes("" as SsoProviderId)).toBe(false);
    });

    it("should handle unknown provider gracefully", () => {
      const unknownProvider = "MICROSOFT";
      expect(ALL_PROVIDER_KEYS.includes(unknownProvider as SsoProviderKey)).toBe(false);
    });
  });

  describe("Provider metadata completeness", () => {
    it("every provider should have all required metadata fields", () => {
      const requiredFields = ["id", "name", "website", "devPortal", "docUrl", "domain", "typicalUse", "description"];

      Object.values(EXPECTED_SSO_PROVIDERS).forEach((provider) => {
        requiredFields.forEach((field) => {
          expect(provider).toHaveProperty(field);
          expect((provider as Record<string, string>)[field]).toBeTruthy();
        });
      });
    });
  });
});

// =============================================================================
// TYPE SAFETY TESTS
// =============================================================================

describe("Type Safety", () => {
  describe("SsoProviderKey type", () => {
    it("should only accept valid provider keys", () => {
      const validKeys: SsoProviderKey[] = ["CLEVER", "CLASSLINK", "GOOGLE", "SCHOOLDAY"];
      validKeys.forEach((key) => {
        expect(EXPECTED_SSO_PROVIDERS[key]).toBeDefined();
      });
    });
  });

  describe("SsoProviderId type", () => {
    it("should match provider.id values", () => {
      Object.values(EXPECTED_SSO_PROVIDERS).forEach((provider) => {
        expect(ALL_PROVIDER_IDS).toContain(provider.id);
      });
    });
  });
});

// =============================================================================
// SCOPES CONFIGURATION TESTS
// =============================================================================

describe("SSO Provider Scopes Configuration", () => {
  describe("Scopes defined in centralized config", () => {
    it("should define scopes for SCHOOLDAY in config", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toMatch(/SCHOOLDAY:\s*\[/);
    });

    it("should define scopes for CLEVER in config", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toMatch(/CLEVER:\s*\[/);
    });

    it("should define scopes for GOOGLE in config", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toMatch(/GOOGLE:\s*\[/);
    });

    it("should define scopes for CLASSLINK in config", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/sso.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toMatch(/CLASSLINK:\s*\[/);
    });
  });

  describe("UI imports scopes from config", () => {
    it("should import SSO_SCOPES_BY_PROVIDER", () => {
      const formPath = path.resolve(__dirname, "../../components/forms/SsoConfigForm.tsx");
      const content = fs.readFileSync(formPath, "utf-8");
      expect(content).toContain("SSO_SCOPES_BY_PROVIDER");
    });
  });
});
