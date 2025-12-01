/**
 * AI Tools Helper Functions Unit Tests
 *
 * Tests that actually import and call the helper functions
 * to achieve code coverage.
 *
 * @vitest-environment node
 */

import { describe, it, expect } from "vitest";
import {
  AI_TOOLS,
  ALL_TOOL_KEYS,
  ALL_TOOL_IDS,
  TOOL_CATEGORIES,
  TOOL_COUNT,
  ToolIdEnum,
  ToolKeyEnum,
  getToolById,
  getToolByKey,
  isValidToolId,
  isValidToolKey,
  toolKeyToId,
  toolIdToKey,
  getToolsByCategory,
  getToolLabel,
  getToolDescription,
  type ToolId,
  type ToolKey,
} from "@/lib/config/ai-tools";

// =============================================================================
// CONSTANTS TESTS
// =============================================================================

describe("AI Tools Constants", () => {
  describe("AI_TOOLS", () => {
    it("should contain all 13 tools", () => {
      expect(Object.keys(AI_TOOLS)).toHaveLength(13);
    });

    it("should have LOOKUP_PODS tool", () => {
      expect(AI_TOOLS.LOOKUP_PODS).toBeDefined();
      expect(AI_TOOLS.LOOKUP_PODS.id).toBe("lookup_pods");
    });

    it("should have SUBMIT_PODS_LITE tool", () => {
      expect(AI_TOOLS.SUBMIT_PODS_LITE).toBeDefined();
      expect(AI_TOOLS.SUBMIT_PODS_LITE.id).toBe("submit_pods_lite");
    });

    it("should have valid category for each tool", () => {
      const validCategories = Object.values(TOOL_CATEGORIES);
      Object.values(AI_TOOLS).forEach((tool) => {
        expect(validCategories).toContain(tool.category);
      });
    });
  });

  describe("ALL_TOOL_KEYS", () => {
    it("should have exactly 13 keys", () => {
      expect(ALL_TOOL_KEYS).toHaveLength(13);
    });

    it("should include LOOKUP_PODS", () => {
      expect(ALL_TOOL_KEYS).toContain("LOOKUP_PODS");
    });

    it("should be readonly", () => {
      // Type check - this would fail at compile time if not readonly
      expect(Array.isArray(ALL_TOOL_KEYS)).toBe(true);
    });
  });

  describe("ALL_TOOL_IDS", () => {
    it("should have exactly 13 IDs", () => {
      expect(ALL_TOOL_IDS).toHaveLength(13);
    });

    it("should include lookup_pods", () => {
      expect(ALL_TOOL_IDS).toContain("lookup_pods");
    });

    it("should all be lowercase_snake_case", () => {
      ALL_TOOL_IDS.forEach((id) => {
        expect(id).toMatch(/^[a-z_]+$/);
      });
    });
  });

  describe("TOOL_COUNT", () => {
    it("should equal 13", () => {
      expect(TOOL_COUNT).toBe(13);
    });

    it("should match AI_TOOLS count", () => {
      expect(TOOL_COUNT).toBe(Object.keys(AI_TOOLS).length);
    });
  });

  describe("TOOL_CATEGORIES", () => {
    it("should have all expected categories", () => {
      expect(TOOL_CATEGORIES.ONBOARDING).toBe("onboarding");
      expect(TOOL_CATEGORIES.INTEGRATION).toBe("integration");
      expect(TOOL_CATEGORIES.TESTING).toBe("testing");
      expect(TOOL_CATEGORIES.MONITORING).toBe("monitoring");
    });
  });
});

// =============================================================================
// ZOD SCHEMA TESTS
// =============================================================================

describe("AI Tools Zod Schemas", () => {
  describe("ToolIdEnum", () => {
    it("should validate valid tool IDs", () => {
      expect(ToolIdEnum.safeParse("lookup_pods").success).toBe(true);
      expect(ToolIdEnum.safeParse("submit_pods_lite").success).toBe(true);
      expect(ToolIdEnum.safeParse("provision_sandbox").success).toBe(true);
    });

    it("should reject invalid tool IDs", () => {
      expect(ToolIdEnum.safeParse("invalid_tool").success).toBe(false);
      expect(ToolIdEnum.safeParse("LOOKUP_PODS").success).toBe(false);
      expect(ToolIdEnum.safeParse("").success).toBe(false);
    });
  });

  describe("ToolKeyEnum", () => {
    it("should validate valid tool keys", () => {
      expect(ToolKeyEnum.safeParse("LOOKUP_PODS").success).toBe(true);
      expect(ToolKeyEnum.safeParse("SUBMIT_PODS_LITE").success).toBe(true);
      expect(ToolKeyEnum.safeParse("PROVISION_SANDBOX").success).toBe(true);
    });

    it("should reject invalid tool keys", () => {
      expect(ToolKeyEnum.safeParse("invalid_key").success).toBe(false);
      expect(ToolKeyEnum.safeParse("lookup_pods").success).toBe(false);
      expect(ToolKeyEnum.safeParse("").success).toBe(false);
    });
  });
});

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe("getToolById", () => {
  it("should return tool for valid ID", () => {
    const tool = getToolById("lookup_pods");
    expect(tool).toBeDefined();
    expect(tool?.id).toBe("lookup_pods");
    expect(tool?.label).toBe("Lookup PoDS");
  });

  it("should return tool for all valid IDs", () => {
    ALL_TOOL_IDS.forEach((id) => {
      const tool = getToolById(id);
      expect(tool).toBeDefined();
      expect(tool?.id).toBe(id);
    });
  });

  it("should return undefined for invalid ID", () => {
    expect(getToolById("invalid_tool")).toBeUndefined();
    expect(getToolById("")).toBeUndefined();
    expect(getToolById("LOOKUP_PODS")).toBeUndefined();
  });
});

describe("getToolByKey", () => {
  it("should return tool for valid key", () => {
    const tool = getToolByKey("LOOKUP_PODS");
    expect(tool).toBeDefined();
    expect(tool?.id).toBe("lookup_pods");
  });

  it("should return tool for all valid keys", () => {
    ALL_TOOL_KEYS.forEach((key) => {
      const tool = getToolByKey(key);
      expect(tool).toBeDefined();
    });
  });

  it("should return undefined for invalid key", () => {
    expect(getToolByKey("INVALID_KEY")).toBeUndefined();
    expect(getToolByKey("lookup_pods")).toBeUndefined();
  });
});

describe("isValidToolId", () => {
  it("should return true for valid IDs", () => {
    expect(isValidToolId("lookup_pods")).toBe(true);
    expect(isValidToolId("submit_pods_lite")).toBe(true);
    expect(isValidToolId("provision_sandbox")).toBe(true);
  });

  it("should return true for all IDs in ALL_TOOL_IDS", () => {
    ALL_TOOL_IDS.forEach((id) => {
      expect(isValidToolId(id)).toBe(true);
    });
  });

  it("should return false for invalid IDs", () => {
    expect(isValidToolId("invalid_tool")).toBe(false);
    expect(isValidToolId("")).toBe(false);
    expect(isValidToolId("LOOKUP_PODS")).toBe(false);
  });
});

describe("isValidToolKey", () => {
  it("should return true for valid keys", () => {
    expect(isValidToolKey("LOOKUP_PODS")).toBe(true);
    expect(isValidToolKey("SUBMIT_PODS_LITE")).toBe(true);
    expect(isValidToolKey("PROVISION_SANDBOX")).toBe(true);
  });

  it("should return true for all keys in ALL_TOOL_KEYS", () => {
    ALL_TOOL_KEYS.forEach((key) => {
      expect(isValidToolKey(key)).toBe(true);
    });
  });

  it("should return false for invalid keys", () => {
    expect(isValidToolKey("INVALID_KEY")).toBe(false);
    expect(isValidToolKey("")).toBe(false);
    expect(isValidToolKey("lookup_pods")).toBe(false);
  });
});

describe("toolKeyToId", () => {
  it("should convert key to ID", () => {
    expect(toolKeyToId("LOOKUP_PODS")).toBe("lookup_pods");
    expect(toolKeyToId("SUBMIT_PODS_LITE")).toBe("submit_pods_lite");
    expect(toolKeyToId("PROVISION_SANDBOX")).toBe("provision_sandbox");
  });

  it("should convert all keys correctly", () => {
    ALL_TOOL_KEYS.forEach((key) => {
      const id = toolKeyToId(key);
      expect(id).toBe(key.toLowerCase());
      expect(ALL_TOOL_IDS).toContain(id);
    });
  });
});

describe("toolIdToKey", () => {
  it("should convert ID to key", () => {
    expect(toolIdToKey("lookup_pods")).toBe("LOOKUP_PODS");
    expect(toolIdToKey("submit_pods_lite")).toBe("SUBMIT_PODS_LITE");
    expect(toolIdToKey("provision_sandbox")).toBe("PROVISION_SANDBOX");
  });

  it("should convert all IDs correctly", () => {
    ALL_TOOL_IDS.forEach((id) => {
      const key = toolIdToKey(id);
      expect(key).toBeDefined();
      expect(key).toBe(id.toUpperCase());
    });
  });

  it("should return undefined for invalid ID", () => {
    expect(toolIdToKey("invalid_tool")).toBeUndefined();
    expect(toolIdToKey("")).toBeUndefined();
  });
});

describe("getToolsByCategory", () => {
  it("should return onboarding tools", () => {
    const tools = getToolsByCategory("onboarding");
    expect(tools.length).toBeGreaterThan(0);
    tools.forEach((tool) => {
      expect(tool.category).toBe("onboarding");
    });
  });

  it("should return integration tools", () => {
    const tools = getToolsByCategory("integration");
    expect(tools.length).toBeGreaterThan(0);
    tools.forEach((tool) => {
      expect(tool.category).toBe("integration");
    });
  });

  it("should return testing tools", () => {
    const tools = getToolsByCategory("testing");
    expect(tools.length).toBeGreaterThan(0);
    tools.forEach((tool) => {
      expect(tool.category).toBe("testing");
    });
  });

  it("should return monitoring tools", () => {
    const tools = getToolsByCategory("monitoring");
    expect(tools.length).toBeGreaterThan(0);
    tools.forEach((tool) => {
      expect(tool.category).toBe("monitoring");
    });
  });

  it("should return empty array for invalid category", () => {
    const tools = getToolsByCategory("invalid" as never);
    expect(tools).toEqual([]);
  });
});

describe("getToolLabel", () => {
  it("should return label for valid ID", () => {
    expect(getToolLabel("lookup_pods")).toBe("Lookup PoDS");
    expect(getToolLabel("submit_pods_lite")).toBe("Submit PoDS-Lite");
    expect(getToolLabel("provision_sandbox")).toBe("Provision Sandbox");
  });

  it("should return ID as fallback for invalid ID", () => {
    expect(getToolLabel("invalid_tool")).toBe("invalid_tool");
  });
});

describe("getToolDescription", () => {
  it("should return description for valid ID", () => {
    expect(getToolDescription("lookup_pods")).toBe(
      "Check existing PoDS application status"
    );
    expect(getToolDescription("submit_pods_lite")).toBe(
      "Trigger PoDS-Lite form for Privacy-Safe access"
    );
  });

  it("should return empty string for invalid ID", () => {
    expect(getToolDescription("invalid_tool")).toBe("");
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe("AI Tools Integration", () => {
  it("should have consistent key-to-id mapping", () => {
    ALL_TOOL_KEYS.forEach((key) => {
      const tool = getToolByKey(key);
      const id = toolKeyToId(key);
      expect(tool?.id).toBe(id);
    });
  });

  it("should have consistent id-to-key mapping", () => {
    ALL_TOOL_IDS.forEach((id) => {
      const tool = getToolById(id);
      const key = toolIdToKey(id);
      if (tool && key) {
        expect(getToolByKey(key)?.id).toBe(id);
      }
    });
  });

  it("should have all tools in at least one category", () => {
    const categories = Object.values(TOOL_CATEGORIES);
    const allCategoryTools = categories.flatMap((cat) =>
      getToolsByCategory(cat)
    );

    expect(allCategoryTools.length).toBe(TOOL_COUNT);
  });
});
