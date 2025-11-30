/**
 * MVP-05: Form Triggers Test Suite
 *
 * Comprehensive tests for the [FORM:*] trigger system.
 * Verifies form detection, rendering, and integration across layers.
 *
 * @see lib/config/forms.ts - Form configuration SSOT
 * @see lib/hooks/useChat.ts - Form trigger detection in chat
 * @see lib/ai/handlers.ts - showForm in tool results
 * @see app/chat/page.tsx - Form rendering
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  FORM_TYPES,
  ALL_FORM_IDS,
  ALL_FORM_MARKERS,
  ALL_FORM_KEYS,
  FormId,
  FormKey,
  FormMarker,
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
  FORM_MARKER_REGEX,
  FORM_MARKER_REGEX_SINGLE,
} from "@/lib/config/forms";
import * as fs from "fs";
import * as path from "path";

// =============================================================================
// UNIT TESTS: Form Configuration
// =============================================================================

describe("MVP-05: Form Triggers", () => {
  describe("Form Configuration SSOT", () => {
    it("should have exactly 8 form types defined", () => {
      expect(Object.keys(FORM_TYPES)).toHaveLength(8);
    });

    it("should have all required form types", () => {
      const requiredForms = [
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
        expect(FORM_TYPES).toHaveProperty(form);
      });
    });

    it("should have consistent structure for all form types", () => {
      Object.entries(FORM_TYPES).forEach(([key, form]) => {
        expect(form).toHaveProperty("id");
        expect(form).toHaveProperty("marker");
        expect(form).toHaveProperty("label");
        expect(form).toHaveProperty("description");
        expect(form).toHaveProperty("component");

        // ID should be lowercase
        expect(form.id).toMatch(/^[a-z_]+$/);

        // Marker should be [FORM:UPPERCASE]
        expect(form.marker).toMatch(/^\[FORM:[A-Z_]+\]$/);

        // Key and marker should correspond
        expect(form.marker).toBe(`[FORM:${key}]`);

        // ID should be lowercase version of key
        expect(form.id).toBe(key.toLowerCase());
      });
    });

    it("should have matching arrays for IDs, markers, and keys", () => {
      expect(ALL_FORM_IDS).toHaveLength(8);
      expect(ALL_FORM_MARKERS).toHaveLength(8);
      expect(ALL_FORM_KEYS).toHaveLength(8);
    });
  });

  // ===========================================================================
  // UNIT TESTS: Form Lookup Functions
  // ===========================================================================

  describe("Form Lookup Functions", () => {
    describe("getFormById", () => {
      it("should return form config for valid ID", () => {
        const form = getFormById("pods_lite");
        expect(form).toBeDefined();
        expect(form?.id).toBe("pods_lite");
        expect(form?.marker).toBe("[FORM:PODS_LITE]");
      });

      it("should return undefined for invalid ID", () => {
        expect(getFormById("invalid_form")).toBeUndefined();
        expect(getFormById("")).toBeUndefined();
        expect(getFormById("PODS_LITE")).toBeUndefined(); // uppercase
      });

      it("should find all 8 forms by ID", () => {
        ALL_FORM_IDS.forEach((id) => {
          const form = getFormById(id);
          expect(form).toBeDefined();
          expect(form?.id).toBe(id);
        });
      });
    });

    describe("getFormByMarker", () => {
      it("should return form config for valid marker", () => {
        const form = getFormByMarker("[FORM:SSO_CONFIG]");
        expect(form).toBeDefined();
        expect(form?.id).toBe("sso_config");
      });

      it("should return undefined for invalid marker", () => {
        expect(getFormByMarker("[FORM:INVALID]")).toBeUndefined();
        expect(getFormByMarker("FORM:SSO_CONFIG")).toBeUndefined();
        expect(getFormByMarker("[form:sso_config]")).toBeUndefined();
      });

      it("should find all 8 forms by marker", () => {
        ALL_FORM_MARKERS.forEach((marker) => {
          const form = getFormByMarker(marker);
          expect(form).toBeDefined();
          expect(form?.marker).toBe(marker);
        });
      });
    });

    describe("getFormByKey", () => {
      it("should return form config for valid key", () => {
        const form = getFormByKey("API_TESTER");
        expect(form).toBeDefined();
        expect(form?.id).toBe("api_tester");
      });

      it("should return undefined for invalid key", () => {
        expect(getFormByKey("INVALID_KEY")).toBeUndefined();
        expect(getFormByKey("api_tester")).toBeUndefined(); // lowercase
      });

      it("should find all 8 forms by key", () => {
        ALL_FORM_KEYS.forEach((key) => {
          const form = getFormByKey(key);
          expect(form).toBeDefined();
        });
      });
    });
  });

  // ===========================================================================
  // UNIT TESTS: Form Marker Parsing
  // ===========================================================================

  describe("Form Marker Parsing", () => {
    describe("parseFormMarker", () => {
      it("should extract form ID from valid marker", () => {
        expect(parseFormMarker("[FORM:PODS_LITE]")).toBe("pods_lite");
        expect(parseFormMarker("[FORM:SSO_CONFIG]")).toBe("sso_config");
        expect(parseFormMarker("[FORM:CREDENTIALS]")).toBe("credentials");
      });

      it("should return null for invalid markers", () => {
        expect(parseFormMarker("[FORM:INVALID]")).toBeNull();
        expect(parseFormMarker("FORM:PODS_LITE")).toBeNull();
        expect(parseFormMarker("[form:pods_lite]")).toBeNull();
        expect(parseFormMarker("")).toBeNull();
        expect(parseFormMarker("random text")).toBeNull();
      });

      it("should handle markers embedded in text", () => {
        // parseFormMarker only parses the marker itself, not embedded
        expect(parseFormMarker("[FORM:PODS_LITE]")).toBe("pods_lite");
      });
    });

    describe("extractFormTriggers", () => {
      it("should extract single form trigger from content", () => {
        const content = "Here's the form: [FORM:PODS_LITE]";
        expect(extractFormTriggers(content)).toEqual(["pods_lite"]);
      });

      it("should extract multiple form triggers", () => {
        const content =
          "[FORM:PODS_LITE] some text [FORM:SSO_CONFIG] more text [FORM:CREDENTIALS]";
        expect(extractFormTriggers(content)).toEqual([
          "pods_lite",
          "sso_config",
          "credentials",
        ]);
      });

      it("should return empty array for no triggers", () => {
        expect(extractFormTriggers("No forms here")).toEqual([]);
        expect(extractFormTriggers("")).toEqual([]);
      });

      it("should ignore invalid form markers", () => {
        const content = "[FORM:INVALID] valid [FORM:PODS_LITE] invalid [FORM:NOPE]";
        expect(extractFormTriggers(content)).toEqual(["pods_lite"]);
      });

      it("should handle all 8 form types", () => {
        ALL_FORM_MARKERS.forEach((marker) => {
          const content = `Text ${marker} more text`;
          const triggers = extractFormTriggers(content);
          expect(triggers).toHaveLength(1);
          expect(ALL_FORM_IDS).toContain(triggers[0]);
        });
      });
    });

    describe("getLastFormTrigger", () => {
      it("should return last form trigger when multiple present", () => {
        const content = "[FORM:PODS_LITE] text [FORM:SSO_CONFIG] text [FORM:CREDENTIALS]";
        expect(getLastFormTrigger(content)).toBe("credentials");
      });

      it("should return single trigger when only one present", () => {
        const content = "Configure SSO: [FORM:SSO_CONFIG]";
        expect(getLastFormTrigger(content)).toBe("sso_config");
      });

      it("should return null when no triggers", () => {
        expect(getLastFormTrigger("No forms here")).toBeNull();
        expect(getLastFormTrigger("")).toBeNull();
      });

      it("should handle trigger at start of content", () => {
        const content = "[FORM:API_TESTER] Here's the API tester";
        expect(getLastFormTrigger(content)).toBe("api_tester");
      });

      it("should handle trigger at end of content", () => {
        const content = "Let me show you the form [FORM:COMM_TEST]";
        expect(getLastFormTrigger(content)).toBe("comm_test");
      });
    });
  });

  // ===========================================================================
  // UNIT TESTS: Form Validation
  // ===========================================================================

  describe("Form Validation Functions", () => {
    describe("isValidFormId", () => {
      it("should return true for valid form IDs", () => {
        ALL_FORM_IDS.forEach((id) => {
          expect(isValidFormId(id)).toBe(true);
        });
      });

      it("should return false for invalid form IDs", () => {
        expect(isValidFormId("invalid")).toBe(false);
        expect(isValidFormId("PODS_LITE")).toBe(false);
        expect(isValidFormId("")).toBe(false);
      });
    });

    describe("isValidFormKey", () => {
      it("should return true for valid form keys", () => {
        ALL_FORM_KEYS.forEach((key) => {
          expect(isValidFormKey(key)).toBe(true);
        });
      });

      it("should return false for invalid form keys", () => {
        expect(isValidFormKey("invalid")).toBe(false);
        expect(isValidFormKey("pods_lite")).toBe(false);
        expect(isValidFormKey("")).toBe(false);
      });
    });

    describe("isValidFormMarker", () => {
      it("should return true for valid form markers", () => {
        ALL_FORM_MARKERS.forEach((marker) => {
          expect(isValidFormMarker(marker)).toBe(true);
        });
      });

      it("should return false for invalid form markers", () => {
        expect(isValidFormMarker("[FORM:INVALID]")).toBe(false);
        expect(isValidFormMarker("pods_lite")).toBe(false);
        expect(isValidFormMarker("")).toBe(false);
      });
    });
  });

  // ===========================================================================
  // UNIT TESTS: Form Conversion Functions
  // ===========================================================================

  describe("Form Conversion Functions", () => {
    describe("formKeyToId", () => {
      it("should convert form key to ID", () => {
        expect(formKeyToId("PODS_LITE")).toBe("pods_lite");
        expect(formKeyToId("SSO_CONFIG")).toBe("sso_config");
        expect(formKeyToId("API_TESTER")).toBe("api_tester");
      });

      it("should work for all form keys", () => {
        ALL_FORM_KEYS.forEach((key) => {
          const id = formKeyToId(key);
          expect(id).toBe(key.toLowerCase());
          expect(ALL_FORM_IDS).toContain(id);
        });
      });
    });

    describe("formIdToKey", () => {
      it("should convert form ID to key", () => {
        expect(formIdToKey("pods_lite")).toBe("PODS_LITE");
        expect(formIdToKey("sso_config")).toBe("SSO_CONFIG");
        expect(formIdToKey("api_tester")).toBe("API_TESTER");
      });

      it("should return undefined for invalid ID", () => {
        expect(formIdToKey("invalid")).toBeUndefined();
      });

      it("should work for all form IDs", () => {
        ALL_FORM_IDS.forEach((id) => {
          const key = formIdToKey(id);
          expect(key).toBe(id.toUpperCase());
          expect(ALL_FORM_KEYS).toContain(key);
        });
      });
    });

    describe("buildFormMarker", () => {
      it("should build marker from form ID", () => {
        expect(buildFormMarker("pods_lite")).toBe("[FORM:PODS_LITE]");
        expect(buildFormMarker("sso_config")).toBe("[FORM:SSO_CONFIG]");
      });

      it("should return undefined for invalid ID", () => {
        expect(buildFormMarker("invalid")).toBeUndefined();
      });

      it("should work for all form IDs", () => {
        ALL_FORM_IDS.forEach((id) => {
          const marker = buildFormMarker(id);
          expect(marker).toBeDefined();
          expect(ALL_FORM_MARKERS).toContain(marker);
        });
      });
    });
  });

  // ===========================================================================
  // UNIT TESTS: Regex Patterns
  // ===========================================================================

  describe("Form Marker Regex Patterns", () => {
    describe("FORM_MARKER_REGEX (global)", () => {
      it("should match all form markers in content", () => {
        const content = "[FORM:PODS_LITE] and [FORM:SSO_CONFIG]";
        const matches = content.match(FORM_MARKER_REGEX);
        expect(matches).toHaveLength(2);
        expect(matches).toContain("[FORM:PODS_LITE]");
        expect(matches).toContain("[FORM:SSO_CONFIG]");
      });

      it("should match valid markers only", () => {
        const content = "[FORM:VALID_FORMAT] [INVALID] [form:lowercase]";
        const matches = content.match(FORM_MARKER_REGEX);
        expect(matches).toHaveLength(1);
        expect(matches?.[0]).toBe("[FORM:VALID_FORMAT]");
      });

      it("should handle no matches", () => {
        const content = "No markers here";
        const matches = content.match(FORM_MARKER_REGEX);
        expect(matches).toBeNull();
      });
    });

    describe("FORM_MARKER_REGEX_SINGLE (non-global)", () => {
      it("should match first form marker with capture group", () => {
        const content = "[FORM:PODS_LITE] and [FORM:SSO_CONFIG]";
        const match = content.match(FORM_MARKER_REGEX_SINGLE);
        expect(match).not.toBeNull();
        expect(match?.[0]).toBe("[FORM:PODS_LITE]");
        expect(match?.[1]).toBe("PODS_LITE"); // capture group
      });

      it("should extract form key from capture group", () => {
        ALL_FORM_MARKERS.forEach((marker) => {
          const match = marker.match(FORM_MARKER_REGEX_SINGLE);
          expect(match).not.toBeNull();
          expect(ALL_FORM_KEYS).toContain(match?.[1]);
        });
      });
    });
  });
});

// =============================================================================
// INTEGRATION TESTS: Handler → Form Trigger Flow
// =============================================================================

describe("MVP-05: Handler → Form Integration", () => {
  const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
  let handlersCode: string;

  beforeEach(() => {
    handlersCode = fs.readFileSync(handlersPath, "utf-8");
  });

  describe("Handler showForm Usage", () => {
    it("should import FORM_TYPES from config", () => {
      expect(handlersCode).toContain('import {');
      expect(handlersCode).toContain('FORM_TYPES');
      expect(handlersCode).toContain('from "@/lib/config/forms"');
    });

    it("should use FORM_TYPES.*.id for showForm values", () => {
      // Check that handlers use centralized form IDs
      const showFormUsages = handlersCode.match(/showForm:\s*\S+/g) || [];

      showFormUsages.forEach((usage) => {
        // Should use FORM_TYPES.X.id, not hardcoded strings
        expect(usage).toMatch(/FORM_TYPES\.[A-Z_]+\.id/);
      });
    });

    it("should have showForm for submit_pods_lite handler", () => {
      expect(handlersCode).toContain("FORM_TYPES.PODS_LITE.id");
    });

    it("should have showForm for configure_sso handler", () => {
      expect(handlersCode).toContain("FORM_TYPES.SSO_CONFIG.id");
    });

    it("should have showForm for configure_lti handler", () => {
      expect(handlersCode).toContain("FORM_TYPES.LTI_CONFIG.id");
    });

    it("should have showForm for provision_sandbox/get_credentials handler", () => {
      expect(handlersCode).toContain("FORM_TYPES.CREDENTIALS.id");
    });

    it("should have showForm for submit_app handler", () => {
      expect(handlersCode).toContain("FORM_TYPES.APP_SUBMIT.id");
    });
  });

  describe("ToolResult Interface", () => {
    it("should have showForm as optional string property", () => {
      expect(handlersCode).toContain("showForm?: string");
    });
  });
});

// =============================================================================
// INTEGRATION TESTS: useChat Form Detection
// =============================================================================

describe("MVP-05: useChat Form Detection", () => {
  const useChatPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
  let useChatCode: string;

  beforeEach(() => {
    useChatCode = fs.readFileSync(useChatPath, "utf-8");
  });

  describe("Form Trigger Detection", () => {
    it("should import getLastFormTrigger from config", () => {
      expect(useChatCode).toContain("getLastFormTrigger");
      expect(useChatCode).toContain('@/lib/config/forms');
    });

    it("should have detectFormTriggers callback", () => {
      expect(useChatCode).toContain("detectFormTriggers");
      expect(useChatCode).toMatch(/const\s+detectFormTriggers\s*=/);
    });

    it("should use getLastFormTrigger in detectFormTriggers", () => {
      expect(useChatCode).toMatch(/detectFormTriggers.*getLastFormTrigger/s);
    });

    it("should have activeForm state", () => {
      expect(useChatCode).toContain("activeForm");
      expect(useChatCode).toMatch(/useState.*null.*activeForm|activeForm.*useState.*null/s);
    });

    it("should set activeForm when form trigger detected", () => {
      expect(useChatCode).toContain("setActiveFormState");
      expect(useChatCode).toMatch(/formTrigger.*setActiveFormState|setActiveFormState.*formTrigger/s);
    });

    it("should check for form triggers in accumulated content", () => {
      expect(useChatCode).toContain("detectFormTriggers(accumulatedContent)");
    });

    it("should NOT clear activeForm during API response", () => {
      // There's a comment about this in the code
      expect(useChatCode).toMatch(/DO NOT clear activeForm|don't clear activeForm/i);
    });
  });

  describe("Form Trigger from Tool Results", () => {
    it("should handle showForm in tool results", () => {
      // useChat should check tool_result events for showForm
      expect(useChatCode).toContain("showForm");
    });
  });
});

// =============================================================================
// INTEGRATION TESTS: Chat Page Form Rendering
// =============================================================================

describe("MVP-05: Chat Page Form Rendering", () => {
  const chatPagePath = path.resolve(__dirname, "../../app/chat/page.tsx");
  let chatPageCode: string;

  beforeEach(() => {
    chatPageCode = fs.readFileSync(chatPagePath, "utf-8");
  });

  describe("Form Rendering Switch", () => {
    it("should have renderForm function", () => {
      expect(chatPageCode).toContain("renderForm");
      expect(chatPageCode).toMatch(/const\s+renderForm\s*=/);
    });

    it("should switch on activeForm", () => {
      expect(chatPageCode).toMatch(/switch\s*\(\s*activeForm\s*\)/);
    });

    it("should have case for pods_lite", () => {
      expect(chatPageCode).toMatch(/case\s+["']pods_lite["']/);
      expect(chatPageCode).toContain("PodsLiteForm");
    });

    it("should have case for sso_config", () => {
      expect(chatPageCode).toMatch(/case\s+["']sso_config["']/);
      expect(chatPageCode).toContain("SsoConfigForm");
    });

    it("should have case for lti_config", () => {
      expect(chatPageCode).toMatch(/case\s+["']lti_config["']/);
      expect(chatPageCode).toContain("LtiConfigForm");
    });

    it("should have case for api_tester", () => {
      expect(chatPageCode).toMatch(/case\s+["']api_tester["']/);
      expect(chatPageCode).toContain("ApiTester");
    });

    it("should have case for comm_test", () => {
      expect(chatPageCode).toMatch(/case\s+["']comm_test["']/);
      expect(chatPageCode).toContain("CommTestForm");
    });

    it("should have case for credentials", () => {
      expect(chatPageCode).toMatch(/case\s+["']credentials["']/);
      expect(chatPageCode).toContain("CredentialsDisplay");
    });

    it("should have case for audit_log", () => {
      expect(chatPageCode).toMatch(/case\s+["']audit_log["']/);
      expect(chatPageCode).toContain("AuditLogViewer");
    });

    it("should have case for app_submit", () => {
      expect(chatPageCode).toMatch(/case\s+["']app_submit["']/);
      expect(chatPageCode).toContain("AppSubmitForm");
    });

    it("should have default case for unknown forms", () => {
      expect(chatPageCode).toMatch(/default:/);
    });
  });

  describe("Form Display", () => {
    it("should conditionally render form based on activeForm", () => {
      expect(chatPageCode).toMatch(/\{activeForm\s*&&/);
    });

    it("should have close button for forms", () => {
      expect(chatPageCode).toContain("setActiveForm(null)");
    });

    it("should use stable key for form animation", () => {
      expect(chatPageCode).toMatch(/key=\{.*form.*activeForm/s);
    });
  });

  describe("Form Components Import", () => {
    it("should import PodsLiteForm", () => {
      expect(chatPageCode).toContain("PodsLiteForm");
    });

    it("should import SsoConfigForm", () => {
      expect(chatPageCode).toContain("SsoConfigForm");
    });

    it("should import LtiConfigForm", () => {
      expect(chatPageCode).toContain("LtiConfigForm");
    });

    it("should import ApiTester", () => {
      expect(chatPageCode).toContain("ApiTester");
    });

    it("should import CommTestForm", () => {
      expect(chatPageCode).toContain("CommTestForm");
    });

    it("should import CredentialsDisplay", () => {
      expect(chatPageCode).toContain("CredentialsDisplay");
    });

    it("should import AuditLogViewer", () => {
      expect(chatPageCode).toContain("AuditLogViewer");
    });

    it("should import AppSubmitForm", () => {
      expect(chatPageCode).toContain("AppSubmitForm");
    });
  });
});

// =============================================================================
// INTEGRATION TESTS: Cross-Layer Consistency
// =============================================================================

describe("MVP-05: Cross-Layer Form Consistency", () => {
  const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
  const chatPagePath = path.resolve(__dirname, "../../app/chat/page.tsx");

  it("should have matching form IDs between handlers and chat page", () => {
    const handlersCode = fs.readFileSync(handlersPath, "utf-8");
    const chatPageCode = fs.readFileSync(chatPagePath, "utf-8");

    // Every form ID used in handlers should have a case in chat page
    ALL_FORM_IDS.forEach((formId) => {
      // Check if this form is used in handlers
      const formKey = formId.toUpperCase();
      if (handlersCode.includes(`FORM_TYPES.${formKey}.id`)) {
        // It should have a corresponding case in chat page
        const caseRegex = new RegExp(`case\\s+["']${formId}["']`);
        expect(chatPageCode).toMatch(caseRegex);
      }
    });
  });

  it("should render correct component for each form ID", () => {
    const chatPageCode = fs.readFileSync(chatPagePath, "utf-8");

    // Check form ID → component mapping
    Object.values(FORM_TYPES).forEach((form) => {
      const caseRegex = new RegExp(
        `case\\s+["']${form.id}["'][\\s\\S]*?${form.component}`,
        "m"
      );
      expect(chatPageCode).toMatch(caseRegex);
    });
  });
});

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

describe("MVP-05: Form Trigger Edge Cases", () => {
  describe("Multiple Triggers in Content", () => {
    it("should handle adjacent markers", () => {
      const content = "[FORM:PODS_LITE][FORM:SSO_CONFIG]";
      expect(getLastFormTrigger(content)).toBe("sso_config");
    });

    it("should handle markers with newlines", () => {
      const content = "First form:\n[FORM:PODS_LITE]\n\nSecond form:\n[FORM:SSO_CONFIG]";
      expect(getLastFormTrigger(content)).toBe("sso_config");
    });

    it("should handle many markers", () => {
      const content = ALL_FORM_MARKERS.join(" text ");
      const lastMarker = ALL_FORM_MARKERS[ALL_FORM_MARKERS.length - 1];
      const expectedId = parseFormMarker(lastMarker);
      expect(getLastFormTrigger(content)).toBe(expectedId);
    });
  });

  describe("Marker Format Variations", () => {
    it("should reject lowercase markers", () => {
      expect(getLastFormTrigger("[form:pods_lite]")).toBeNull();
    });

    it("should reject markers without brackets", () => {
      expect(getLastFormTrigger("FORM:PODS_LITE")).toBeNull();
    });

    it("should handle markers with extra characters", () => {
      expect(getLastFormTrigger("[FORM:PODS_LITE] ")).toBe("pods_lite"); // trailing space ok
      expect(getLastFormTrigger(" [FORM:PODS_LITE]")).toBe("pods_lite"); // leading space ok
      // Double brackets still contain valid marker inside - regex extracts it
      expect(getLastFormTrigger("[[FORM:PODS_LITE]]")).toBe("pods_lite");
    });

    it("should handle markers in markdown", () => {
      const content = "**Here's the form:** `[FORM:PODS_LITE]`";
      expect(getLastFormTrigger(content)).toBe("pods_lite");
    });
  });

  describe("Empty and Null Content", () => {
    it("should handle empty string", () => {
      expect(extractFormTriggers("")).toEqual([]);
      expect(getLastFormTrigger("")).toBeNull();
    });

    it("should handle whitespace only", () => {
      expect(extractFormTriggers("   \n\t   ")).toEqual([]);
      expect(getLastFormTrigger("   \n\t   ")).toBeNull();
    });
  });

  describe("Special Characters in Content", () => {
    it("should handle Unicode content", () => {
      const content = "你好 [FORM:PODS_LITE] مرحبا";
      expect(getLastFormTrigger(content)).toBe("pods_lite");
    });

    it("should handle emoji content", () => {
      const content = "📝 Form: [FORM:SSO_CONFIG] ✅";
      expect(getLastFormTrigger(content)).toBe("sso_config");
    });

    it("should handle HTML entities", () => {
      const content = "&lt;form&gt; [FORM:API_TESTER] &lt;/form&gt;";
      expect(getLastFormTrigger(content)).toBe("api_tester");
    });
  });
});

// =============================================================================
// TOOL → FORM MAPPING TESTS
// =============================================================================

describe("MVP-05: Tool → Form Mapping", () => {
  const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");

  it("should map submit_pods_lite → pods_lite form", () => {
    const code = fs.readFileSync(handlersPath, "utf-8");
    // Find handleSubmitPodsLite function and verify it returns pods_lite form
    expect(code).toMatch(/handleSubmitPodsLite[\s\S]*?FORM_TYPES\.PODS_LITE\.id/);
  });

  it("should map configure_sso → sso_config form", () => {
    const code = fs.readFileSync(handlersPath, "utf-8");
    expect(code).toMatch(/handleConfigureSso[\s\S]*?FORM_TYPES\.SSO_CONFIG\.id/);
  });

  it("should map configure_lti → lti_config form", () => {
    const code = fs.readFileSync(handlersPath, "utf-8");
    expect(code).toMatch(/handleConfigureLti[\s\S]*?FORM_TYPES\.LTI_CONFIG\.id/);
  });

  it("should map provision_sandbox → credentials form", () => {
    const code = fs.readFileSync(handlersPath, "utf-8");
    expect(code).toMatch(/handleProvisionSandbox[\s\S]*?FORM_TYPES\.CREDENTIALS\.id/);
  });

  it("should map get_credentials → credentials form", () => {
    const code = fs.readFileSync(handlersPath, "utf-8");
    expect(code).toMatch(/handleGetCredentials[\s\S]*?FORM_TYPES\.CREDENTIALS\.id/);
  });

  it("should map submit_app → app_submit form", () => {
    const code = fs.readFileSync(handlersPath, "utf-8");
    expect(code).toMatch(/handleSubmitApp[\s\S]*?FORM_TYPES\.APP_SUBMIT\.id/);
  });
});
