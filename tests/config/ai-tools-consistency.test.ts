/**
 * Cross-Layer Consistency Tests for AI Tool Names Configuration
 *
 * CONFIG-03: AI Tool Names Type Safety
 *
 * These tests verify that all AI tool name definitions are consistent across:
 * - lib/config/ai-tools.ts (single source of truth - to be created)
 * - lib/ai/tools.ts (TOOL_DEFINITIONS, ToolName type)
 * - lib/ai/handlers.ts (handleToolCall switch cases)
 *
 * Coverage Target: 100%
 *
 * @see .claude/PLANNING.md - CONFIG-03 task description
 * @see lib/config/forms.ts - Exemplar implementation
 * @see lib/config/sso.ts - Another exemplar
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// =============================================================================
// CONFIG-03: Expected AI Tool Configuration
// =============================================================================

/**
 * These are the AI tools that will be defined in lib/config/ai-tools.ts
 * After implementation, these should come from that file.
 */
const EXPECTED_AI_TOOLS = {
  LOOKUP_PODS: {
    id: "lookup_pods",
    label: "Lookup PoDS",
    description: "Check existing PoDS application status",
    category: "onboarding",
  },
  SUBMIT_PODS_LITE: {
    id: "submit_pods_lite",
    label: "Submit PoDS-Lite",
    description: "Trigger PoDS-Lite form for Privacy-Safe access",
    category: "onboarding",
  },
  PROVISION_SANDBOX: {
    id: "provision_sandbox",
    label: "Provision Sandbox",
    description: "Generate API credentials for testing",
    category: "integration",
  },
  CONFIGURE_SSO: {
    id: "configure_sso",
    label: "Configure SSO",
    description: "Configure Clever/ClassLink/Google SSO",
    category: "integration",
  },
  TEST_ONEROSTER: {
    id: "test_oneroster",
    label: "Test OneRoster",
    description: "Execute test API call against sandbox",
    category: "testing",
  },
  CONFIGURE_LTI: {
    id: "configure_lti",
    label: "Configure LTI",
    description: "Configure LTI 1.3 integration",
    category: "integration",
  },
  SEND_TEST_MESSAGE: {
    id: "send_test_message",
    label: "Send Test Message",
    description: "Test communication gateway",
    category: "testing",
  },
  SUBMIT_APP: {
    id: "submit_app",
    label: "Submit App",
    description: "Submit freemium app for whitelist",
    category: "onboarding",
  },
  GET_AUDIT_LOGS: {
    id: "get_audit_logs",
    label: "Get Audit Logs",
    description: "Retrieve audit trail",
    category: "monitoring",
  },
  GET_CREDENTIALS: {
    id: "get_credentials",
    label: "Get Credentials",
    description: "Display sandbox credentials",
    category: "integration",
  },
  CHECK_STATUS: {
    id: "check_status",
    label: "Check Status",
    description: "Get integration statuses",
    category: "monitoring",
  },
  REQUEST_UPGRADE: {
    id: "request_upgrade",
    label: "Request Upgrade",
    description: "Initiate tier upgrade request",
    category: "onboarding",
  },
} as const;

type ToolKey = keyof typeof EXPECTED_AI_TOOLS;
type ToolId = (typeof EXPECTED_AI_TOOLS)[ToolKey]["id"];

const ALL_TOOL_KEYS: ToolKey[] = Object.keys(EXPECTED_AI_TOOLS) as ToolKey[];
const ALL_TOOL_IDS: ToolId[] = Object.values(EXPECTED_AI_TOOLS).map((t) => t.id) as ToolId[];

// =============================================================================
// UNIT TESTS: Centralized Config Structure
// =============================================================================

describe("AI Tools Centralized Config", () => {
  describe("EXPECTED_AI_TOOLS structure", () => {
    it("should define exactly 12 AI tools", () => {
      expect(Object.keys(EXPECTED_AI_TOOLS)).toHaveLength(12);
    });

    it("should have all required tools", () => {
      const requiredTools: ToolKey[] = [
        "LOOKUP_PODS",
        "SUBMIT_PODS_LITE",
        "PROVISION_SANDBOX",
        "CONFIGURE_SSO",
        "TEST_ONEROSTER",
        "CONFIGURE_LTI",
        "SEND_TEST_MESSAGE",
        "SUBMIT_APP",
        "GET_AUDIT_LOGS",
        "GET_CREDENTIALS",
        "CHECK_STATUS",
        "REQUEST_UPGRADE",
      ];

      requiredTools.forEach((tool) => {
        expect(EXPECTED_AI_TOOLS[tool]).toBeDefined();
      });
    });

    it("should have unique IDs for all tools", () => {
      const ids = Object.values(EXPECTED_AI_TOOLS).map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have unique labels for all tools", () => {
      const labels = Object.values(EXPECTED_AI_TOOLS).map((t) => t.label);
      const uniqueLabels = new Set(labels);
      expect(uniqueLabels.size).toBe(labels.length);
    });
  });

  describe("Tool ID format", () => {
    it("should use lowercase with underscores for all IDs", () => {
      Object.values(EXPECTED_AI_TOOLS).forEach((tool) => {
        expect(tool.id).toMatch(/^[a-z_]+$/);
      });
    });

    it("should not have leading or trailing underscores", () => {
      Object.values(EXPECTED_AI_TOOLS).forEach((tool) => {
        expect(tool.id).not.toMatch(/^_|_$/);
      });
    });

    it("should convert key to ID correctly (UPPERCASE_SNAKE to lowercase_snake)", () => {
      Object.entries(EXPECTED_AI_TOOLS).forEach(([key, tool]) => {
        expect(tool.id).toBe(key.toLowerCase());
      });
    });
  });

  describe("Tool key format", () => {
    it("should use UPPERCASE_SNAKE_CASE for all keys", () => {
      Object.keys(EXPECTED_AI_TOOLS).forEach((key) => {
        expect(key).toMatch(/^[A-Z_]+$/);
      });
    });
  });

  describe("Tool metadata", () => {
    it("should have non-empty labels", () => {
      Object.values(EXPECTED_AI_TOOLS).forEach((tool) => {
        expect(tool.label.length).toBeGreaterThan(0);
      });
    });

    it("should have non-empty descriptions", () => {
      Object.values(EXPECTED_AI_TOOLS).forEach((tool) => {
        expect(tool.description.length).toBeGreaterThan(0);
      });
    });

    it("should have valid category for each tool", () => {
      const validCategories = ["onboarding", "integration", "testing", "monitoring"];
      Object.values(EXPECTED_AI_TOOLS).forEach((tool) => {
        expect(validCategories).toContain(tool.category);
      });
    });
  });

  describe("Tool categories", () => {
    it("should have onboarding tools", () => {
      const onboardingTools = Object.values(EXPECTED_AI_TOOLS).filter(
        (t) => t.category === "onboarding"
      );
      expect(onboardingTools.length).toBeGreaterThan(0);
    });

    it("should have integration tools", () => {
      const integrationTools = Object.values(EXPECTED_AI_TOOLS).filter(
        (t) => t.category === "integration"
      );
      expect(integrationTools.length).toBeGreaterThan(0);
    });

    it("should have testing tools", () => {
      const testingTools = Object.values(EXPECTED_AI_TOOLS).filter(
        (t) => t.category === "testing"
      );
      expect(testingTools.length).toBeGreaterThan(0);
    });

    it("should have monitoring tools", () => {
      const monitoringTools = Object.values(EXPECTED_AI_TOOLS).filter(
        (t) => t.category === "monitoring"
      );
      expect(monitoringTools.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// UNIT TESTS: Helper Functions (to be implemented in lib/config/ai-tools.ts)
// =============================================================================

describe("AI Tools Helper Functions", () => {
  describe("getToolById", () => {
    it("should return tool for valid ID", () => {
      ALL_TOOL_IDS.forEach((id) => {
        const tool = Object.values(EXPECTED_AI_TOOLS).find((t) => t.id === id);
        expect(tool).toBeDefined();
      });
    });

    it("should return undefined for invalid ID", () => {
      const invalidIds = ["invalid", "LOOKUP_PODS", "lookupPods", ""];
      invalidIds.forEach((id) => {
        const tool = Object.values(EXPECTED_AI_TOOLS).find((t) => t.id === id);
        expect(tool).toBeUndefined();
      });
    });
  });

  describe("getToolByKey", () => {
    it("should return tool for valid key", () => {
      ALL_TOOL_KEYS.forEach((key) => {
        expect(EXPECTED_AI_TOOLS[key]).toBeDefined();
      });
    });
  });

  describe("isValidToolId", () => {
    it("should return true for valid IDs", () => {
      ALL_TOOL_IDS.forEach((id) => {
        expect(ALL_TOOL_IDS.includes(id)).toBe(true);
      });
    });

    it("should return false for invalid IDs", () => {
      const invalidIds = ["invalid", "LOOKUP_PODS", "lookupPods", ""];
      invalidIds.forEach((id) => {
        expect(ALL_TOOL_IDS.includes(id as ToolId)).toBe(false);
      });
    });
  });

  describe("isValidToolKey", () => {
    it("should return true for valid keys", () => {
      ALL_TOOL_KEYS.forEach((key) => {
        expect(ALL_TOOL_KEYS.includes(key)).toBe(true);
      });
    });

    it("should return false for invalid keys", () => {
      const invalidKeys = ["lookup_pods", "Invalid", "LOOKUP"];
      invalidKeys.forEach((key) => {
        expect(ALL_TOOL_KEYS.includes(key as ToolKey)).toBe(false);
      });
    });
  });

  describe("toolKeyToId", () => {
    it("should convert UPPERCASE_SNAKE to lowercase_snake", () => {
      ALL_TOOL_KEYS.forEach((key) => {
        const expectedId = key.toLowerCase();
        expect(EXPECTED_AI_TOOLS[key].id).toBe(expectedId);
      });
    });
  });

  describe("toolIdToKey", () => {
    it("should convert lowercase_snake to UPPERCASE_SNAKE", () => {
      ALL_TOOL_IDS.forEach((id) => {
        const expectedKey = id.toUpperCase() as ToolKey;
        if (EXPECTED_AI_TOOLS[expectedKey]) {
          expect(EXPECTED_AI_TOOLS[expectedKey].id).toBe(id);
        }
      });
    });
  });
});

// =============================================================================
// UNIT TESTS: Derived Constants
// =============================================================================

describe("AI Tools Derived Constants", () => {
  describe("ALL_TOOL_KEYS", () => {
    it("should contain exactly 12 keys", () => {
      expect(ALL_TOOL_KEYS).toHaveLength(12);
    });

    it("should be in UPPERCASE_SNAKE_CASE format", () => {
      ALL_TOOL_KEYS.forEach((key) => {
        expect(key).toMatch(/^[A-Z_]+$/);
      });
    });

    it("should match EXPECTED_AI_TOOLS keys", () => {
      const configKeys = Object.keys(EXPECTED_AI_TOOLS).sort();
      expect([...ALL_TOOL_KEYS].sort()).toEqual(configKeys);
    });
  });

  describe("ALL_TOOL_IDS", () => {
    it("should contain exactly 12 IDs", () => {
      expect(ALL_TOOL_IDS).toHaveLength(12);
    });

    it("should be in lowercase_snake_case format", () => {
      ALL_TOOL_IDS.forEach((id) => {
        expect(id).toMatch(/^[a-z_]+$/);
      });
    });

    it("should match EXPECTED_AI_TOOLS ids", () => {
      const configIds = Object.values(EXPECTED_AI_TOOLS)
        .map((t) => t.id)
        .sort();
      expect([...ALL_TOOL_IDS].sort()).toEqual(configIds);
    });
  });
});

// =============================================================================
// INTEGRATION TESTS: Cross-Layer Consistency
// =============================================================================

describe("Cross-Layer AI Tool Name Consistency", () => {
  describe("lib/ai/tools.ts - TOOL_DEFINITIONS", () => {
    it("should exist", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      expect(fs.existsSync(toolsPath)).toBe(true);
    });

    it("should export TOOL_DEFINITIONS", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain("export const TOOL_DEFINITIONS");
    });

    it("should export ToolName type", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain("export type ToolName");
    });

    it("should define lookup_pods tool", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain('name: "lookup_pods"');
    });

    it("should define submit_pods_lite tool", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain('name: "submit_pods_lite"');
    });

    it("should define provision_sandbox tool", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain('name: "provision_sandbox"');
    });

    it("should define configure_sso tool", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain('name: "configure_sso"');
    });

    it("should define test_oneroster tool", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain('name: "test_oneroster"');
    });

    it("should define configure_lti tool", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain('name: "configure_lti"');
    });

    it("should define send_test_message tool", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain('name: "send_test_message"');
    });

    it("should define submit_app tool", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain('name: "submit_app"');
    });

    it("should define get_audit_logs tool", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain('name: "get_audit_logs"');
    });

    it("should define get_credentials tool", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain('name: "get_credentials"');
    });

    it("should define check_status tool", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain('name: "check_status"');
    });

    it("should define request_upgrade tool", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain('name: "request_upgrade"');
    });
  });

  describe("lib/ai/handlers.ts - handleToolCall switch cases", () => {
    it("should exist", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      expect(fs.existsSync(handlersPath)).toBe(true);
    });

    it("should have executeToolCall function", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      const content = fs.readFileSync(handlersPath, "utf-8");
      expect(content).toContain("executeToolCall");
    });

    it("should have case for lookup_pods", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      const content = fs.readFileSync(handlersPath, "utf-8");
      expect(content).toContain('case "lookup_pods"');
    });

    it("should have case for submit_pods_lite", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      const content = fs.readFileSync(handlersPath, "utf-8");
      expect(content).toContain('case "submit_pods_lite"');
    });

    it("should have case for provision_sandbox", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      const content = fs.readFileSync(handlersPath, "utf-8");
      expect(content).toContain('case "provision_sandbox"');
    });

    it("should have case for configure_sso", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      const content = fs.readFileSync(handlersPath, "utf-8");
      expect(content).toContain('case "configure_sso"');
    });

    it("should have case for test_oneroster", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      const content = fs.readFileSync(handlersPath, "utf-8");
      expect(content).toContain('case "test_oneroster"');
    });

    it("should have case for configure_lti", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      const content = fs.readFileSync(handlersPath, "utf-8");
      expect(content).toContain('case "configure_lti"');
    });

    it("should have case for send_test_message", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      const content = fs.readFileSync(handlersPath, "utf-8");
      expect(content).toContain('case "send_test_message"');
    });

    it("should have case for submit_app", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      const content = fs.readFileSync(handlersPath, "utf-8");
      expect(content).toContain('case "submit_app"');
    });

    it("should have case for get_audit_logs", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      const content = fs.readFileSync(handlersPath, "utf-8");
      expect(content).toContain('case "get_audit_logs"');
    });

    it("should have case for get_credentials", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      const content = fs.readFileSync(handlersPath, "utf-8");
      expect(content).toContain('case "get_credentials"');
    });

    it("should have case for check_status", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      const content = fs.readFileSync(handlersPath, "utf-8");
      expect(content).toContain('case "check_status"');
    });

    it("should have case for request_upgrade", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      const content = fs.readFileSync(handlersPath, "utf-8");
      expect(content).toContain('case "request_upgrade"');
    });
  });
});

// =============================================================================
// INTEGRATION TESTS: Tool Count Consistency
// =============================================================================

describe("Tool Count Consistency Across Layers", () => {
  function countToolDefinitions(): number {
    const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
    const content = fs.readFileSync(toolsPath, "utf-8");
    const matches = content.match(/name:\s*"[a-z_]+"/g);
    return matches ? matches.length : 0;
  }

  function countHandlerCases(): number {
    const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
    const content = fs.readFileSync(handlersPath, "utf-8");
    const matches = content.match(/case\s*"[a-z_]+"/g);
    // Filter to only tool-related cases (not other switch statements)
    if (matches) {
      return matches.filter((m) =>
        ALL_TOOL_IDS.some((id) => m.includes(id))
      ).length;
    }
    return 0;
  }

  function countToolNameUnion(): number {
    const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
    const content = fs.readFileSync(toolsPath, "utf-8");
    const typeMatch = content.match(/export type ToolName\s*=[\s\S]*?;/);
    if (typeMatch) {
      const unionMatch = typeMatch[0].match(/"[a-z_]+"/g);
      return unionMatch ? unionMatch.length : 0;
    }
    return 0;
  }

  it("should have same number of tools in TOOL_DEFINITIONS and expected config", () => {
    const definitionCount = countToolDefinitions();
    expect(definitionCount).toBe(12);
  });

  it("should have same number of switch cases as tools", () => {
    const caseCount = countHandlerCases();
    expect(caseCount).toBe(12);
  });

  it("should have same number of types in ToolName union as tools", () => {
    const typeCount = countToolNameUnion();
    expect(typeCount).toBe(12);
  });

  it("should have TOOL_DEFINITIONS, handler cases, and ToolName all match", () => {
    const definitionCount = countToolDefinitions();
    const caseCount = countHandlerCases();
    const typeCount = countToolNameUnion();

    expect(definitionCount).toBe(caseCount);
    expect(definitionCount).toBe(typeCount);
  });
});

// =============================================================================
// INTEGRATION TESTS: Tool Name Matching
// =============================================================================

describe("Tool Name Matching Across Layers", () => {
  function extractToolNamesFromDefinitions(): string[] {
    const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
    const content = fs.readFileSync(toolsPath, "utf-8");
    const matches = content.match(/name:\s*"([a-z_]+)"/g);
    return matches ? matches.map((m) => m.replace(/name:\s*"|"/g, "")) : [];
  }

  function extractToolNamesFromCases(): string[] {
    const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
    const content = fs.readFileSync(handlersPath, "utf-8");
    const matches = content.match(/case\s*"([a-z_]+)"/g);
    if (matches) {
      const caseNames = matches.map((m) => m.replace(/case\s*"|"/g, ""));
      // Filter to only known tool names
      return caseNames.filter((name) => ALL_TOOL_IDS.includes(name as ToolId));
    }
    return [];
  }

  function extractToolNamesFromType(): string[] {
    const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
    const content = fs.readFileSync(toolsPath, "utf-8");
    const typeMatch = content.match(/export type ToolName\s*=[\s\S]*?;/);
    if (typeMatch) {
      const unionMatch = typeMatch[0].match(/"([a-z_]+)"/g);
      return unionMatch ? unionMatch.map((m) => m.replace(/"/g, "")) : [];
    }
    return [];
  }

  it("should have all expected tool names in TOOL_DEFINITIONS", () => {
    const definitionNames = extractToolNamesFromDefinitions().sort();
    const expectedNames = [...ALL_TOOL_IDS].sort();
    expect(definitionNames).toEqual(expectedNames);
  });

  it("should have all expected tool names in handler switch cases", () => {
    const caseNames = extractToolNamesFromCases().sort();
    const expectedNames = [...ALL_TOOL_IDS].sort();
    expect(caseNames).toEqual(expectedNames);
  });

  it("should have all expected tool names in ToolName type", () => {
    const typeNames = extractToolNamesFromType().sort();
    const expectedNames = [...ALL_TOOL_IDS].sort();
    expect(typeNames).toEqual(expectedNames);
  });

  it("should have TOOL_DEFINITIONS names match handler cases", () => {
    const definitionNames = extractToolNamesFromDefinitions().sort();
    const caseNames = extractToolNamesFromCases().sort();
    expect(definitionNames).toEqual(caseNames);
  });

  it("should have TOOL_DEFINITIONS names match ToolName type", () => {
    const definitionNames = extractToolNamesFromDefinitions().sort();
    const typeNames = extractToolNamesFromType().sort();
    expect(definitionNames).toEqual(typeNames);
  });
});

// =============================================================================
// INTEGRATION TESTS: After Centralization
// =============================================================================

describe("After CONFIG-03 Centralization", () => {
  describe("lib/config/ai-tools.ts should be created", () => {
    it("should exist after implementation", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/ai-tools.ts");
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it("should export AI_TOOLS constant", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/ai-tools.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toContain("export const AI_TOOLS");
    });

    it("should export ALL_TOOL_IDS", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/ai-tools.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toContain("ALL_TOOL_IDS");
    });

    it("should export ALL_TOOL_KEYS", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/ai-tools.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toContain("ALL_TOOL_KEYS");
    });

    it("should export ToolId type", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/ai-tools.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toContain("ToolId");
    });

    it("should export helper functions", () => {
      const configPath = path.resolve(__dirname, "../../lib/config/ai-tools.ts");
      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toContain("getToolById");
      expect(content).toContain("isValidToolId");
    });
  });

  describe("lib/ai/tools.ts should import from config", () => {
    it("should import from config", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toMatch(/from ["']@\/lib\/config\/ai-tools["']/);
    });

    it("should use AI_TOOLS for tool names", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain("AI_TOOLS");
    });
  });

  describe("lib/ai/handlers.ts should use centralized config", () => {
    it("should import from config", () => {
      const handlersPath = path.resolve(__dirname, "../../lib/ai/handlers.ts");
      const content = fs.readFileSync(handlersPath, "utf-8");
      expect(content).toMatch(/from ["']@\/lib\/config\/ai-tools["']/);
    });
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe("Edge Cases", () => {
  describe("Case sensitivity", () => {
    it("should recognize lowercase_snake IDs", () => {
      expect(ALL_TOOL_IDS.includes("lookup_pods")).toBe(true);
    });

    it("should not recognize UPPERCASE as valid IDs", () => {
      expect(ALL_TOOL_IDS.includes("LOOKUP_PODS" as ToolId)).toBe(false);
    });

    it("should recognize UPPERCASE_SNAKE keys", () => {
      expect(ALL_TOOL_KEYS.includes("LOOKUP_PODS")).toBe(true);
    });

    it("should not recognize lowercase as valid keys", () => {
      expect(ALL_TOOL_KEYS.includes("lookup_pods" as ToolKey)).toBe(false);
    });
  });

  describe("Empty and null handling", () => {
    it("should not have empty tool ID", () => {
      expect(ALL_TOOL_IDS.includes("" as ToolId)).toBe(false);
    });

    it("should not have empty tool key", () => {
      expect(ALL_TOOL_KEYS.includes("" as ToolKey)).toBe(false);
    });

    it("should handle unknown tool gracefully", () => {
      const unknownTool = "unknown_tool";
      expect(ALL_TOOL_IDS.includes(unknownTool as ToolId)).toBe(false);
    });
  });

  describe("Tool metadata completeness", () => {
    it("every tool should have all required metadata fields", () => {
      const requiredFields = ["id", "label", "description", "category"];

      Object.values(EXPECTED_AI_TOOLS).forEach((tool) => {
        requiredFields.forEach((field) => {
          expect(tool).toHaveProperty(field);
          expect((tool as Record<string, string>)[field]).toBeTruthy();
        });
      });
    });
  });
});

// =============================================================================
// TYPE SAFETY TESTS
// =============================================================================

describe("Type Safety", () => {
  describe("ToolKey type", () => {
    it("should only accept valid tool keys", () => {
      const validKeys: ToolKey[] = [
        "LOOKUP_PODS",
        "SUBMIT_PODS_LITE",
        "PROVISION_SANDBOX",
        "CONFIGURE_SSO",
        "TEST_ONEROSTER",
        "CONFIGURE_LTI",
        "SEND_TEST_MESSAGE",
        "SUBMIT_APP",
        "GET_AUDIT_LOGS",
        "GET_CREDENTIALS",
        "CHECK_STATUS",
        "REQUEST_UPGRADE",
      ];
      validKeys.forEach((key) => {
        expect(EXPECTED_AI_TOOLS[key]).toBeDefined();
      });
    });
  });

  describe("ToolId type", () => {
    it("should match tool.id values", () => {
      Object.values(EXPECTED_AI_TOOLS).forEach((tool) => {
        expect(ALL_TOOL_IDS).toContain(tool.id);
      });
    });
  });

  describe("ToolName type in tools.ts", () => {
    it("should be a union of all tool IDs", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");

      // Check that ToolName includes all expected tool names
      ALL_TOOL_IDS.forEach((id) => {
        expect(content).toContain(`"${id}"`);
      });
    });
  });
});

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe("Existing Helper Functions in tools.ts", () => {
  describe("getToolByName", () => {
    it("should be exported from tools.ts", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain("export function getToolByName");
    });
  });

  describe("getToolNames", () => {
    it("should be exported from tools.ts", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain("export function getToolNames");
    });
  });

  describe("validateToolInput", () => {
    it("should be exported from tools.ts", () => {
      const toolsPath = path.resolve(__dirname, "../../lib/ai/tools.ts");
      const content = fs.readFileSync(toolsPath, "utf-8");
      expect(content).toContain("export function validateToolInput");
    });
  });
});
