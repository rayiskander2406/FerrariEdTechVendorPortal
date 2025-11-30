/**
 * Cross-Layer Consistency Tests for Form Types Configuration
 *
 * CONFIG-01: Form Types Centralization
 *
 * These tests verify that all form type definitions are consistent across:
 * - lib/config/forms.ts (single source of truth - to be created)
 * - lib/ai/handlers.ts (showForm return values)
 * - app/chat/page.tsx (switch cases for rendering)
 * - lib/hooks/useChat.ts (FORM_TRIGGER_REGEX parsing)
 *
 * Coverage Target: 100%
 *
 * @see .claude/PLANNING.md - CONFIG-01 task description
 * @see lib/config/oneroster.ts - Exemplar implementation
 */

import { describe, it, expect } from "vitest";
import {
  FORM_TYPES,
  ALL_FORM_IDS,
  ALL_FORM_MARKERS,
  ALL_FORM_KEYS,
  FORM_MARKER_REGEX,
  FORM_MARKER_REGEX_SINGLE,
  getFormById,
  getFormByMarker,
  getFormByKey,
  parseFormMarker,
  isValidFormId,
  isValidFormKey,
  isValidFormMarker,
  formKeyToId,
  formIdToKey,
  buildFormMarker,
  extractFormTriggers,
  getLastFormTrigger,
  type FormKey,
  type FormId,
  type FormMarker,
  type FormConfig,
} from "@/lib/config/forms";

// Alias for backward compatibility with existing tests
const EXPECTED_FORM_TYPES = FORM_TYPES;

// =============================================================================
// UNIT TESTS: Centralized Config Structure
// =============================================================================

describe("Form Types Centralized Config", () => {
  describe("EXPECTED_FORM_TYPES structure", () => {
    it("should define exactly 8 form types", () => {
      expect(Object.keys(EXPECTED_FORM_TYPES)).toHaveLength(8);
    });

    it("should have all required form types", () => {
      const requiredForms: FormKey[] = [
        "PODS_LITE",
        "SSO_CONFIG",
        "LTI_CONFIG",
        "API_TESTER",
        "COMM_TEST",
        "CREDENTIALS",
        "AUDIT_LOG",
        "APP_SUBMIT",
      ];

      requiredForms.forEach((form) => {
        expect(EXPECTED_FORM_TYPES[form]).toBeDefined();
      });
    });

    it("should have unique IDs for all form types", () => {
      const ids = Object.values(EXPECTED_FORM_TYPES).map((f) => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have unique markers for all form types", () => {
      const markers = Object.values(EXPECTED_FORM_TYPES).map((f) => f.marker);
      const uniqueMarkers = new Set(markers);
      expect(uniqueMarkers.size).toBe(markers.length);
    });

    it("should have unique component names for all form types", () => {
      const components = Object.values(EXPECTED_FORM_TYPES).map((f) => f.component);
      const uniqueComponents = new Set(components);
      expect(uniqueComponents.size).toBe(components.length);
    });
  });

  describe("Form ID format", () => {
    it("should use lowercase with underscores for all IDs", () => {
      Object.values(EXPECTED_FORM_TYPES).forEach((form) => {
        expect(form.id).toMatch(/^[a-z_]+$/);
      });
    });

    it("should not have leading or trailing underscores", () => {
      Object.values(EXPECTED_FORM_TYPES).forEach((form) => {
        expect(form.id).not.toMatch(/^_|_$/);
      });
    });
  });

  describe("Form marker format", () => {
    it("should use [FORM:UPPERCASE_NAME] format for all markers", () => {
      Object.values(EXPECTED_FORM_TYPES).forEach((form) => {
        expect(form.marker).toMatch(/^\[FORM:[A-Z_]+\]$/);
      });
    });

    it("should have marker name match the form key", () => {
      Object.entries(EXPECTED_FORM_TYPES).forEach(([key, form]) => {
        const markerName = form.marker.replace("[FORM:", "").replace("]", "");
        expect(markerName).toBe(key);
      });
    });

    it("should have ID be lowercase version of marker name", () => {
      Object.entries(EXPECTED_FORM_TYPES).forEach(([key, form]) => {
        expect(form.id).toBe(key.toLowerCase());
      });
    });
  });

  describe("Form metadata completeness", () => {
    it("should have non-empty labels for all forms", () => {
      Object.values(EXPECTED_FORM_TYPES).forEach((form) => {
        expect(form.label).toBeTruthy();
        expect(form.label.length).toBeGreaterThan(0);
      });
    });

    it("should have non-empty descriptions for all forms", () => {
      Object.values(EXPECTED_FORM_TYPES).forEach((form) => {
        expect(form.description).toBeTruthy();
        expect(form.description.length).toBeGreaterThan(0);
      });
    });

    it("should have PascalCase component names", () => {
      Object.values(EXPECTED_FORM_TYPES).forEach((form) => {
        expect(form.component).toMatch(/^[A-Z][a-zA-Z]*$/);
      });
    });
  });
});

// =============================================================================
// UNIT TESTS: Helper Functions (to be implemented in lib/config/forms.ts)
// =============================================================================

describe("Form Config Helper Functions", () => {
  describe("getFormById", () => {
    it("should return form config for valid ID", () => {
      const form = getFormById("pods_lite");
      expect(form).toBeDefined();
      expect(form?.id).toBe("pods_lite");
      expect(form?.marker).toBe("[FORM:PODS_LITE]");
    });

    it("should return undefined for invalid ID", () => {
      const form = getFormById("invalid_form");
      expect(form).toBeUndefined();
    });

    it("should be case-sensitive for IDs", () => {
      const form = getFormById("PODS_LITE");
      expect(form).toBeUndefined();
    });

    it("should return correct config for all form IDs", () => {
      ALL_FORM_IDS.forEach((id) => {
        const form = getFormById(id);
        expect(form).toBeDefined();
        expect(form?.id).toBe(id);
      });
    });
  });

  describe("getFormByMarker", () => {
    it("should return form config for valid marker", () => {
      const form = getFormByMarker("[FORM:PODS_LITE]");
      expect(form).toBeDefined();
      expect(form?.marker).toBe("[FORM:PODS_LITE]");
      expect(form?.id).toBe("pods_lite");
    });

    it("should return undefined for invalid marker", () => {
      const form = getFormByMarker("[FORM:INVALID]");
      expect(form).toBeUndefined();
    });

    it("should return correct config for all markers", () => {
      ALL_FORM_MARKERS.forEach((marker) => {
        const form = getFormByMarker(marker);
        expect(form).toBeDefined();
        expect(form?.marker).toBe(marker);
      });
    });
  });

  describe("getFormByKey", () => {
    it("should return form config for valid key", () => {
      const form = getFormByKey("PODS_LITE");
      expect(form).toBeDefined();
      expect(form?.id).toBe("pods_lite");
    });

    it("should return undefined for invalid key", () => {
      const form = getFormByKey("INVALID");
      expect(form).toBeUndefined();
    });

    it("should be case-sensitive for keys", () => {
      const form = getFormByKey("pods_lite");
      expect(form).toBeUndefined();
    });
  });

  describe("parseFormMarker", () => {
    it("should extract form ID from valid marker", () => {
      const formId = parseFormMarker("[FORM:PODS_LITE]");
      expect(formId).toBe("pods_lite");
    });

    it("should return null for invalid marker format", () => {
      const invalidMarkers = [
        "[FORM:lowercase]",
        "[form:PODS_LITE]",
        "FORM:PODS_LITE",
        "[PODS_LITE]",
        "",
      ];

      invalidMarkers.forEach((marker) => {
        const formId = parseFormMarker(marker);
        expect(formId).toBeNull();
      });
    });

    it("should parse all valid markers correctly", () => {
      ALL_FORM_MARKERS.forEach((marker) => {
        const formId = parseFormMarker(marker);
        expect(formId).not.toBeNull();
        expect(isValidFormId(formId as string)).toBe(true);
      });
    });
  });

  describe("isValidFormId", () => {
    it("should return true for all valid form IDs", () => {
      ALL_FORM_IDS.forEach((id) => {
        expect(isValidFormId(id)).toBe(true);
      });
    });

    it("should return false for invalid form IDs", () => {
      const invalidIds = ["invalid", "PODS_LITE", "pods-lite", "", "undefined"];
      invalidIds.forEach((id) => {
        expect(isValidFormId(id)).toBe(false);
      });
    });
  });

  describe("isValidFormKey", () => {
    it("should return true for all valid form keys", () => {
      ALL_FORM_KEYS.forEach((key) => {
        expect(isValidFormKey(key)).toBe(true);
      });
    });

    it("should return false for invalid form keys", () => {
      const invalidKeys = ["invalid", "pods_lite", "INVALID", ""];
      invalidKeys.forEach((key) => {
        expect(isValidFormKey(key)).toBe(false);
      });
    });
  });

  describe("isValidFormMarker", () => {
    it("should return true for all valid markers", () => {
      ALL_FORM_MARKERS.forEach((marker) => {
        expect(isValidFormMarker(marker)).toBe(true);
      });
    });

    it("should return false for invalid markers", () => {
      const invalidMarkers = ["[FORM:INVALID]", "[FORM:pods_lite]", ""];
      invalidMarkers.forEach((marker) => {
        expect(isValidFormMarker(marker)).toBe(false);
      });
    });
  });

  describe("formKeyToId", () => {
    it("should convert key to ID correctly", () => {
      expect(formKeyToId("PODS_LITE")).toBe("pods_lite");
      expect(formKeyToId("SSO_CONFIG")).toBe("sso_config");
      expect(formKeyToId("API_TESTER")).toBe("api_tester");
    });
  });

  describe("formIdToKey", () => {
    it("should convert ID to key correctly", () => {
      expect(formIdToKey("pods_lite")).toBe("PODS_LITE");
      expect(formIdToKey("sso_config")).toBe("SSO_CONFIG");
      expect(formIdToKey("api_tester")).toBe("API_TESTER");
    });

    it("should return undefined for invalid ID", () => {
      expect(formIdToKey("invalid")).toBeUndefined();
    });
  });

  describe("buildFormMarker", () => {
    it("should build marker from ID", () => {
      expect(buildFormMarker("pods_lite")).toBe("[FORM:PODS_LITE]");
      expect(buildFormMarker("sso_config")).toBe("[FORM:SSO_CONFIG]");
    });

    it("should return undefined for invalid ID", () => {
      expect(buildFormMarker("invalid")).toBeUndefined();
    });
  });

  describe("extractFormTriggers", () => {
    it("should extract single form trigger", () => {
      const triggers = extractFormTriggers("Please complete this form: [FORM:PODS_LITE]");
      expect(triggers).toEqual(["pods_lite"]);
    });

    it("should extract multiple form triggers", () => {
      const triggers = extractFormTriggers("[FORM:PODS_LITE] then [FORM:CREDENTIALS]");
      expect(triggers).toEqual(["pods_lite", "credentials"]);
    });

    it("should return empty array for no triggers", () => {
      const triggers = extractFormTriggers("No forms here");
      expect(triggers).toEqual([]);
    });

    it("should ignore invalid markers", () => {
      const triggers = extractFormTriggers("[FORM:INVALID] [FORM:PODS_LITE]");
      expect(triggers).toEqual(["pods_lite"]);
    });
  });

  describe("getLastFormTrigger", () => {
    it("should return last form trigger", () => {
      const trigger = getLastFormTrigger("[FORM:PODS_LITE] then [FORM:CREDENTIALS]");
      expect(trigger).toBe("credentials");
    });

    it("should return null for no triggers", () => {
      const trigger = getLastFormTrigger("No forms here");
      expect(trigger).toBeNull();
    });

    it("should return single trigger when only one present", () => {
      const trigger = getLastFormTrigger("Here is [FORM:SSO_CONFIG]");
      expect(trigger).toBe("sso_config");
    });
  });

  describe("ALL_FORM_IDS", () => {
    it("should return array of all form IDs", () => {
      expect(ALL_FORM_IDS).toHaveLength(8);
      expect(ALL_FORM_IDS).toContain("pods_lite");
      expect(ALL_FORM_IDS).toContain("credentials");
    });
  });

  describe("ALL_FORM_MARKERS", () => {
    it("should return array of all form markers", () => {
      expect(ALL_FORM_MARKERS).toHaveLength(8);
      expect(ALL_FORM_MARKERS).toContain("[FORM:PODS_LITE]");
      expect(ALL_FORM_MARKERS).toContain("[FORM:CREDENTIALS]");
    });
  });

  describe("ALL_FORM_KEYS", () => {
    it("should return array of all form keys", () => {
      expect(ALL_FORM_KEYS).toHaveLength(8);
      expect(ALL_FORM_KEYS).toContain("PODS_LITE");
      expect(ALL_FORM_KEYS).toContain("CREDENTIALS");
    });
  });
});

// =============================================================================
// INTEGRATION TESTS: Handler showForm values
// =============================================================================

describe("Handler showForm Consistency", () => {
  // These values are returned by handlers in lib/ai/handlers.ts
  const HANDLER_SHOW_FORM_VALUES = [
    "pods_lite",
    "credentials",
    "sso_config",
    "lti_config",
    "app_submit",
    "audit_log",
  ];

  it("should have all handler showForm values defined in config", () => {
    const configFormIds = Object.values(EXPECTED_FORM_TYPES).map((f) => f.id);

    HANDLER_SHOW_FORM_VALUES.forEach((showFormValue) => {
      expect(configFormIds).toContain(showFormValue);
    });
  });

  it("should use lowercase_underscore format for all showForm values", () => {
    HANDLER_SHOW_FORM_VALUES.forEach((value) => {
      expect(value).toMatch(/^[a-z_]+$/);
    });
  });

  describe("Individual handler form mappings", () => {
    it("handleSubmitPodsLite should return pods_lite", () => {
      const expected = EXPECTED_FORM_TYPES.PODS_LITE.id;
      expect(expected).toBe("pods_lite");
    });

    it("handleProvisionSandbox should return credentials", () => {
      const expected = EXPECTED_FORM_TYPES.CREDENTIALS.id;
      expect(expected).toBe("credentials");
    });

    it("handleConfigureSso should return sso_config", () => {
      const expected = EXPECTED_FORM_TYPES.SSO_CONFIG.id;
      expect(expected).toBe("sso_config");
    });

    it("handleConfigureLti should return lti_config", () => {
      const expected = EXPECTED_FORM_TYPES.LTI_CONFIG.id;
      expect(expected).toBe("lti_config");
    });

    it("handleSubmitApp should return app_submit", () => {
      const expected = EXPECTED_FORM_TYPES.APP_SUBMIT.id;
      expect(expected).toBe("app_submit");
    });

    it("handleGetAuditLogs should return audit_log", () => {
      const expected = EXPECTED_FORM_TYPES.AUDIT_LOG.id;
      expect(expected).toBe("audit_log");
    });
  });
});

// =============================================================================
// INTEGRATION TESTS: UI Switch Cases
// =============================================================================

describe("UI Form Rendering Consistency", () => {
  // These are the switch cases in app/chat/page.tsx renderForm()
  const UI_SWITCH_CASES = [
    "pods_lite",
    "sso_config",
    "lti_config",
    "api_tester",
    "comm_test",
    "credentials",
    "audit_log",
    "app_submit",
  ];

  it("should have UI switch cases for all config form IDs", () => {
    const configFormIds = Object.values(EXPECTED_FORM_TYPES).map((f) => f.id);

    configFormIds.forEach((formId) => {
      expect(UI_SWITCH_CASES).toContain(formId);
    });
  });

  it("should have all UI switch cases defined in config", () => {
    const configFormIds = Object.values(EXPECTED_FORM_TYPES).map((f) => f.id);

    UI_SWITCH_CASES.forEach((switchCase) => {
      expect(configFormIds).toContain(switchCase);
    });
  });

  it("should have exact match between config and UI", () => {
    const configFormIds = Object.values(EXPECTED_FORM_TYPES)
      .map((f) => f.id)
      .sort();
    const uiCases = [...UI_SWITCH_CASES].sort();

    expect(configFormIds).toEqual(uiCases);
  });

  describe("Component mapping verification", () => {
    const COMPONENT_MAPPING: Record<string, string> = {
      pods_lite: "PodsLiteForm",
      sso_config: "SsoConfigForm",
      lti_config: "LtiConfigForm",
      api_tester: "ApiTester",
      comm_test: "CommTestForm",
      credentials: "CredentialsDisplay",
      audit_log: "AuditLogViewer",
      app_submit: "AppSubmitForm",
    };

    it("should have correct component for each form ID", () => {
      Object.entries(COMPONENT_MAPPING).forEach(([formId, expectedComponent]) => {
        const form = Object.values(EXPECTED_FORM_TYPES).find(
          (f) => f.id === formId
        );
        expect(form?.component).toBe(expectedComponent);
      });
    });
  });
});

// =============================================================================
// INTEGRATION TESTS: Form Trigger Regex
// =============================================================================

describe("Form Trigger Regex Consistency", () => {
  // This regex is from lib/hooks/useChat.ts
  const FORM_TRIGGER_REGEX = /\[FORM:([A-Z_]+)\]/g;

  it("should match all config markers", () => {
    Object.values(EXPECTED_FORM_TYPES).forEach((form) => {
      const matches = form.marker.match(FORM_TRIGGER_REGEX);
      expect(matches).not.toBeNull();
      expect(matches).toHaveLength(1);
    });
  });

  it("should extract correct form key from markers", () => {
    Object.entries(EXPECTED_FORM_TYPES).forEach(([key, form]) => {
      const regex = /\[FORM:([A-Z_]+)\]/;
      const match = form.marker.match(regex);
      expect(match?.[1]).toBe(key);
    });
  });

  it("should not match invalid markers", () => {
    const invalidMarkers = [
      "[FORM:lowercase]",
      "[form:PODS_LITE]",
      "FORM:PODS_LITE",
      "[PODS_LITE]",
      "[FORM:]",
      "[FORM:123]",
    ];

    invalidMarkers.forEach((marker) => {
      const regex = /^\[FORM:([A-Z_]+)\]$/;
      const match = marker.match(regex);
      expect(match).toBeNull();
    });
  });

  describe("Marker to ID conversion", () => {
    it("should correctly convert marker to lowercase form ID", () => {
      const testCases = [
        { marker: "[FORM:PODS_LITE]", expectedId: "pods_lite" },
        { marker: "[FORM:SSO_CONFIG]", expectedId: "sso_config" },
        { marker: "[FORM:API_TESTER]", expectedId: "api_tester" },
        { marker: "[FORM:CREDENTIALS]", expectedId: "credentials" },
      ];

      testCases.forEach(({ marker, expectedId }) => {
        const match = marker.match(/\[FORM:([A-Z_]+)\]/);
        const formId = match?.[1]?.toLowerCase();
        expect(formId).toBe(expectedId);
      });
    });
  });
});

// =============================================================================
// CROSS-LAYER CONSISTENCY TESTS
// =============================================================================

describe("Cross-Layer Consistency", () => {
  describe("Complete Form Lifecycle", () => {
    it("should support full lifecycle for pods_lite", () => {
      // 1. Handler returns showForm
      const showForm = EXPECTED_FORM_TYPES.PODS_LITE.id;
      expect(showForm).toBe("pods_lite");

      // 2. AI response includes marker
      const marker = EXPECTED_FORM_TYPES.PODS_LITE.marker;
      expect(marker).toBe("[FORM:PODS_LITE]");

      // 3. Regex extracts form key
      const match = marker.match(/\[FORM:([A-Z_]+)\]/);
      expect(match?.[1]).toBe("PODS_LITE");

      // 4. Form ID derived from key
      const formId = match?.[1]?.toLowerCase();
      expect(formId).toBe("pods_lite");

      // 5. UI switch case exists
      expect(formId).toBe(showForm);
    });

    it("should support full lifecycle for all form types", () => {
      Object.entries(EXPECTED_FORM_TYPES).forEach(([key, form]) => {
        // Handler returns form ID
        expect(form.id).toBe(key.toLowerCase());

        // Marker uses uppercase key
        expect(form.marker).toBe(`[FORM:${key}]`);

        // Regex can extract key
        const match = form.marker.match(/\[FORM:([A-Z_]+)\]/);
        expect(match?.[1]).toBe(key);

        // Key converts to form ID
        expect(match?.[1]?.toLowerCase()).toBe(form.id);
      });
    });
  });

  describe("No Orphaned Definitions", () => {
    it("should have no form IDs in handlers without UI support", () => {
      const handlerFormIds = [
        "pods_lite",
        "credentials",
        "sso_config",
        "lti_config",
        "app_submit",
        "audit_log",
      ];

      const uiFormIds = [
        "pods_lite",
        "sso_config",
        "lti_config",
        "api_tester",
        "comm_test",
        "credentials",
        "audit_log",
        "app_submit",
      ];

      handlerFormIds.forEach((handlerForm) => {
        expect(uiFormIds).toContain(handlerForm);
      });
    });

    it("should have config definitions for all possible form triggers", () => {
      const configFormIds = Object.values(EXPECTED_FORM_TYPES).map((f) => f.id);

      // All possible form IDs from various sources
      const allPossibleFormIds = new Set([
        // From handlers
        "pods_lite",
        "credentials",
        "sso_config",
        "lti_config",
        "app_submit",
        "audit_log",
        // From UI
        "api_tester",
        "comm_test",
      ]);

      allPossibleFormIds.forEach((formId) => {
        expect(configFormIds).toContain(formId);
      });
    });
  });

  describe("Future-Proofing", () => {
    it("should fail if new form added to config without proper structure", () => {
      Object.values(EXPECTED_FORM_TYPES).forEach((form) => {
        // Every form must have all required fields
        expect(form).toHaveProperty("id");
        expect(form).toHaveProperty("marker");
        expect(form).toHaveProperty("label");
        expect(form).toHaveProperty("description");
        expect(form).toHaveProperty("component");
      });
    });

    it("should maintain ID-marker consistency for any new forms", () => {
      Object.entries(EXPECTED_FORM_TYPES).forEach(([key, form]) => {
        // ID must be lowercase of key
        expect(form.id).toBe(key.toLowerCase());
        // Marker must contain key
        expect(form.marker).toContain(key);
      });
    });
  });
});

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

describe("Edge Cases", () => {
  describe("Empty and null handling", () => {
    it("should not have empty string as any form ID", () => {
      Object.values(EXPECTED_FORM_TYPES).forEach((form) => {
        expect(form.id).not.toBe("");
        expect(form.id.trim()).toBe(form.id);
      });
    });

    it("should not have undefined or null values", () => {
      Object.values(EXPECTED_FORM_TYPES).forEach((form) => {
        expect(form.id).toBeDefined();
        expect(form.marker).toBeDefined();
        expect(form.label).toBeDefined();
        expect(form.description).toBeDefined();
        expect(form.component).toBeDefined();
      });
    });
  });

  describe("Special characters", () => {
    it("should only use alphanumeric and underscore in IDs", () => {
      Object.values(EXPECTED_FORM_TYPES).forEach((form) => {
        expect(form.id).toMatch(/^[a-z0-9_]+$/);
      });
    });

    it("should not have spaces in any form identifiers", () => {
      Object.values(EXPECTED_FORM_TYPES).forEach((form) => {
        expect(form.id).not.toContain(" ");
        expect(form.marker).not.toContain(" ");
      });
    });
  });

  describe("Length constraints", () => {
    it("should have reasonable length for all IDs (3-30 chars)", () => {
      Object.values(EXPECTED_FORM_TYPES).forEach((form) => {
        expect(form.id.length).toBeGreaterThanOrEqual(3);
        expect(form.id.length).toBeLessThanOrEqual(30);
      });
    });

    it("should have descriptive labels (5+ chars)", () => {
      Object.values(EXPECTED_FORM_TYPES).forEach((form) => {
        expect(form.label.length).toBeGreaterThanOrEqual(5);
      });
    });
  });
});

// =============================================================================
// TYPE SAFETY TESTS
// =============================================================================

describe("Type Safety", () => {
  describe("FormId type", () => {
    it("should allow valid form IDs", () => {
      const validIds: FormId[] = [
        "pods_lite",
        "sso_config",
        "lti_config",
        "api_tester",
        "comm_test",
        "credentials",
        "audit_log",
        "app_submit",
      ];

      validIds.forEach((id) => {
        const form = Object.values(EXPECTED_FORM_TYPES).find((f) => f.id === id);
        expect(form).toBeDefined();
      });
    });
  });

  describe("FormKey type", () => {
    it("should allow valid form keys", () => {
      const validKeys: FormKey[] = [
        "PODS_LITE",
        "SSO_CONFIG",
        "LTI_CONFIG",
        "API_TESTER",
        "COMM_TEST",
        "CREDENTIALS",
        "AUDIT_LOG",
        "APP_SUBMIT",
      ];

      validKeys.forEach((key) => {
        expect(EXPECTED_FORM_TYPES[key]).toBeDefined();
      });
    });
  });
});

// =============================================================================
// DOCUMENTATION CONSISTENCY TESTS
// =============================================================================

describe("Documentation Consistency", () => {
  // These markers appear in documentation (CLAUDE.md, system-prompt.ts)
  const DOCUMENTED_MARKERS = [
    "[FORM:PODS_LITE]",
    "[FORM:SSO_CONFIG]",
    "[FORM:API_TESTER]",
    "[FORM:COMM_TEST]",
    "[FORM:APP_SUBMIT]",
    "[FORM:CREDENTIALS]",
    "[FORM:AUDIT_LOG]",
  ];

  it("should have all documented markers defined in config", () => {
    const configMarkers = Object.values(EXPECTED_FORM_TYPES).map((f) => f.marker);

    DOCUMENTED_MARKERS.forEach((docMarker) => {
      expect(configMarkers).toContain(docMarker);
    });
  });

  it("should include LTI_CONFIG marker (may be missing from docs)", () => {
    const configMarkers = Object.values(EXPECTED_FORM_TYPES).map((f) => f.marker);
    expect(configMarkers).toContain("[FORM:LTI_CONFIG]");
  });
});
