/**
 * Shadow Mode Verification Tests
 *
 * Tests for the shadow mode utility that compares
 * hardcoded and generated form configs.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  compareFormConfigs,
  verifyFormConfig,
  createShadowFormConfig,
} from "@/lib/schemas/shadow-mode";
import type { FormConfig } from "@/lib/schemas/generators/form-fields";

// =============================================================================
// TEST FIXTURES
// =============================================================================

const createMockConfig = (overrides: Partial<FormConfig> = {}): FormConfig => ({
  id: "test-form",
  name: "Test Form",
  sections: [
    {
      id: "section1",
      title: "Section 1",
      fields: [
        {
          name: "field1",
          label: "Field 1",
          type: "text",
          required: true,
        },
        {
          name: "field2",
          label: "Field 2",
          type: "email",
          required: false,
        },
      ],
    },
    {
      id: "section2",
      title: "Section 2",
      fields: [
        {
          name: "field3",
          label: "Field 3",
          type: "select",
          required: true,
          options: [
            { value: "a", label: "Option A" },
            { value: "b", label: "Option B" },
          ],
        },
      ],
    },
  ],
  ...overrides,
});

// =============================================================================
// COMPARISON TESTS
// =============================================================================

describe("compareFormConfigs", () => {
  it("should return equivalent for identical configs", () => {
    const config1 = createMockConfig();
    const config2 = createMockConfig();

    const result = compareFormConfigs(config1, config2);

    expect(result.status).toBe("equivalent");
    expect(result.summary.mismatches).toHaveLength(0);
    expect(result.summary.matchingSections).toBe(2);
    expect(result.summary.matchingFields).toBe(3);
  });

  it("should detect missing section in generated", () => {
    const existing = createMockConfig();
    const generated = createMockConfig({
      sections: [existing.sections[0]], // Only first section
    });

    const result = compareFormConfigs(existing, generated);

    expect(result.status).toBe("different");
    expect(result.summary.mismatches).toContain(
      'Section "section2" missing in generated config'
    );
  });

  it("should detect extra section in generated", () => {
    const existing = createMockConfig({
      sections: [createMockConfig().sections[0]], // Only first section
    });
    const generated = createMockConfig();

    const result = compareFormConfigs(existing, generated);

    expect(result.status).toBe("different");
    expect(result.summary.mismatches).toContain(
      'Section "section2" extra in generated config'
    );
  });

  it("should detect field label mismatch", () => {
    const existing = createMockConfig();
    const generated = createMockConfig();
    generated.sections[0].fields[0].label = "Different Label";

    const result = compareFormConfigs(existing, generated);

    expect(result.status).toBe("different");
    expect(result.summary.mismatches.some((m) => m.includes("label"))).toBe(true);
  });

  it("should detect field type mismatch", () => {
    const existing = createMockConfig();
    const generated = createMockConfig();
    generated.sections[0].fields[0].type = "number";

    const result = compareFormConfigs(existing, generated);

    expect(result.status).toBe("different");
    expect(result.summary.mismatches.some((m) => m.includes("type"))).toBe(true);
  });

  it("should detect field required mismatch", () => {
    const existing = createMockConfig();
    const generated = createMockConfig();
    generated.sections[0].fields[0].required = false;

    const result = compareFormConfigs(existing, generated);

    expect(result.status).toBe("different");
    expect(result.summary.mismatches.some((m) => m.includes("required"))).toBe(true);
  });

  it("should detect options mismatch", () => {
    const existing = createMockConfig();
    const generated = createMockConfig();
    generated.sections[1].fields[0].options = [
      { value: "a", label: "Option A" },
      { value: "c", label: "Option C" }, // Different option
    ];

    const result = compareFormConfigs(existing, generated);

    expect(result.status).toBe("different");
    expect(result.summary.mismatches.some((m) => m.includes("options"))).toBe(true);
  });

  it("should detect missing field in generated", () => {
    const existing = createMockConfig();
    const generated = createMockConfig();
    generated.sections[0].fields = [generated.sections[0].fields[0]]; // Remove field2

    const result = compareFormConfigs(existing, generated);

    expect(result.status).toBe("different");
    expect(
      result.summary.mismatches.some((m) => m.includes("field2") && m.includes("missing_in_generated"))
    ).toBe(true);
  });

  it("should provide detailed summary", () => {
    const existing = createMockConfig();
    const generated = createMockConfig();
    generated.sections[0].fields[0].label = "Different";

    const result = compareFormConfigs(existing, generated);

    expect(result.summary.totalSections).toBe(2);
    expect(result.summary.totalFields).toBe(3);
    expect(result.summary.matchingFields).toBe(2); // field2 and field3 still match
  });
});

// =============================================================================
// VERIFY FORM CONFIG TESTS
// =============================================================================

describe("verifyFormConfig", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("should return generated config when equivalent", () => {
    const existing = createMockConfig();
    const generated = createMockConfig();

    const result = verifyFormConfig(existing, generated);

    expect(result).toBe(generated);
  });

  it("should log success when configs match", () => {
    const existing = createMockConfig();
    const generated = createMockConfig();

    verifyFormConfig(existing, generated, { logDetails: true });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Form config verified")
    );
  });

  it("should return existing config when mismatches found (safe fallback)", () => {
    const existing = createMockConfig();
    const generated = createMockConfig();
    generated.sections[0].fields[0].label = "Different";

    const result = verifyFormConfig(existing, generated, { throwOnMismatch: false });

    expect(result).toBe(existing);
  });

  it("should log warnings when mismatches found", () => {
    const existing = createMockConfig();
    const generated = createMockConfig();
    generated.sections[0].fields[0].label = "Different";

    verifyFormConfig(existing, generated, { logDetails: true });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Form config mismatch detected")
    );
  });

  it("should throw when throwOnMismatch is true", () => {
    const existing = createMockConfig();
    const generated = createMockConfig();
    generated.sections[0].fields[0].label = "Different";

    expect(() =>
      verifyFormConfig(existing, generated, { throwOnMismatch: true })
    ).toThrow("Shadow mode verification failed");
  });

  it("should not log when logDetails is false", () => {
    const existing = createMockConfig();
    const generated = createMockConfig();

    verifyFormConfig(existing, generated, { logDetails: false });

    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});

// =============================================================================
// CREATE SHADOW FORM CONFIG TESTS
// =============================================================================

describe("createShadowFormConfig", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it("should call generator function", () => {
    const existing = createMockConfig();
    const generated = createMockConfig();
    const generateFn = vi.fn(() => generated);

    createShadowFormConfig(existing, generateFn);

    expect(generateFn).toHaveBeenCalled();
  });

  it("should return existing config for safe fallback on mismatch", () => {
    const existing = createMockConfig();
    const generated = createMockConfig();
    generated.sections[0].fields[0].label = "Different";
    const generateFn = vi.fn(() => generated);

    const result = createShadowFormConfig(existing, generateFn);

    // In development mode with mismatch, should return existing for safety
    expect(result).toBe(existing);
  });
});

// =============================================================================
// INTEGRATION WITH REAL SCHEMA
// =============================================================================

describe("Shadow Mode with PodsLiteSchema", () => {
  it("should verify real schema generates equivalent config", async () => {
    const { PodsLiteSchema, generateFormConfig } = await import("@/lib/schemas");

    const generated = generateFormConfig(PodsLiteSchema);

    // Verify structure
    expect(generated.sections.length).toBe(8);
    expect(generated.id).toBe("pods-lite");

    // All fields should have types
    const allFields = generated.sections.flatMap((s) => s.fields);
    expect(allFields.every((f) => f.type)).toBe(true);

    // All fields should have labels
    expect(allFields.every((f) => f.label)).toBe(true);
  });

  it("should create shadow config from schema", async () => {
    const { PodsLiteSchema, generateFormConfig } = await import("@/lib/schemas");

    const existing = generateFormConfig(PodsLiteSchema);
    const result = createShadowFormConfig(existing, () =>
      generateFormConfig(PodsLiteSchema)
    );

    // Since both are identical, should return generated
    expect(result.id).toBe(existing.id);
    expect(result.sections.length).toBe(existing.sections.length);
  });
});
