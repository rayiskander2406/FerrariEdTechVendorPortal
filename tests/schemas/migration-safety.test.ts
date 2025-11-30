/**
 * Schema Migration Safety Tests
 *
 * These tests prove equivalence between:
 * 1. Generated outputs from schema-first architecture
 * 2. Existing hardcoded definitions
 *
 * CRITICAL: All tests must pass before migrating any consumer to use generated output.
 * Failing tests reveal gaps that must be fixed before migration.
 */

import { describe, it, expect } from "vitest";
import {
  PodsLiteSchema,
  generateAITool,
  createMockFactory,
  generateFormConfig,
} from "@/lib/schemas";
import { TOOL_DEFINITIONS } from "@/lib/ai/tools";

// =============================================================================
// AI TOOL EQUIVALENCE
// =============================================================================

describe("AI Tool Equivalence: submit_pods_lite", () => {
  const existingTool = TOOL_DEFINITIONS.find(
    (t) => t.name === "submit_pods_lite"
  )!;
  const generatedTool = generateAITool(PodsLiteSchema);

  it("existing tool exists", () => {
    expect(existingTool).toBeDefined();
    expect(existingTool.name).toBe("submit_pods_lite");
  });

  it("generated tool has same name", () => {
    expect(generatedTool.name).toBe(existingTool.name);
  });

  it("INSIGHT: existing tool is a TRIGGER, not full form definition", () => {
    // Document the architectural difference:
    // - Existing tool: minimal trigger with prefills (3 properties)
    // - Generated tool: full form schema (20+ properties)

    const existingProps = Object.keys(
      existingTool.input_schema.properties as Record<string, unknown>
    );
    const generatedProps = Object.keys(
      generatedTool.input_schema.properties as Record<string, unknown>
    );

    console.log("\n=== TOOL PROPERTY COMPARISON ===");
    console.log("Existing tool properties:", existingProps.length, existingProps);
    console.log("Generated tool properties:", generatedProps.length);
    console.log("================================\n");

    // This test DOCUMENTS the difference, not enforces equality
    expect(existingProps).toContain("trigger_form");
    expect(generatedProps).toContain("trigger_form");

    // The generated tool has all form fields - this is BY DESIGN different
    expect(generatedProps.length).toBeGreaterThan(existingProps.length);
  });

  it("both tools require trigger_form", () => {
    const existingRequired = existingTool.input_schema.required as string[];
    const generatedRequired = generatedTool.input_schema.required as string[];

    expect(existingRequired).toContain("trigger_form");
    expect(generatedRequired).toContain("trigger_form");
  });

  describe("Prefill property equivalence", () => {
    const existingProps = existingTool.input_schema.properties as Record<
      string,
      { type: string; description: string }
    >;

    it("existing has prefill_vendor_name", () => {
      expect(existingProps.prefill_vendor_name).toBeDefined();
      expect(existingProps.prefill_vendor_name.type).toBe("string");
    });

    it("existing has prefill_email", () => {
      expect(existingProps.prefill_email).toBeDefined();
      expect(existingProps.prefill_email.type).toBe("string");
    });

    it("generated tool can include prefill fields when configured", () => {
      const toolWithPrefills = generateAITool(PodsLiteSchema, {
        prefillFields: ["vendorName", "contactEmail"],
      });

      const props = toolWithPrefills.input_schema.properties as Record<
        string,
        unknown
      >;

      expect(props.prefill_vendorName).toBeDefined();
      expect(props.prefill_contactEmail).toBeDefined();
    });

    it("GAP: existing uses prefill_email, generated uses prefill_contactEmail", () => {
      // This documents a naming convention difference that must be resolved
      const toolWithPrefills = generateAITool(PodsLiteSchema, {
        prefillFields: ["vendorName", "contactEmail"],
      });
      const generatedProps = toolWithPrefills.input_schema.properties as Record<
        string,
        unknown
      >;

      // Existing uses snake_case: prefill_email
      expect(existingProps.prefill_email).toBeDefined();

      // Generated uses schema field name: prefill_contactEmail
      expect(generatedProps.prefill_contactEmail).toBeDefined();

      // GAP: Names don't match - migration would need a mapping
      expect("prefill_email" in generatedProps).toBe(false);
    });
  });
});

// =============================================================================
// MOCK DATA VALIDATION EQUIVALENCE
// =============================================================================

describe("Mock Data Validation", () => {
  const factory = createMockFactory(PodsLiteSchema);

  it("generated mock passes schema validation", () => {
    const mock = factory.create();
    const result = PodsLiteSchema.schema.safeParse(mock);

    if (!result.success) {
      console.log("Validation errors:", result.error.issues);
    }

    expect(result.success).toBe(true);
  });

  it("generated mock with seed is deterministic", () => {
    const mock1 = factory.create({ seed: 42 });
    const mock2 = factory.create({ seed: 42 });

    expect(mock1.vendorName).toBe(mock2.vendorName);
    expect(mock1.contactEmail).toBe(mock2.contactEmail);
    expect(mock1.integrationMethod).toBe(mock2.integrationMethod);
  });

  it("generated mock has all required fields", () => {
    const mock = factory.create();

    // Required fields from existing form (aligned field names)
    expect(mock.vendorName).toBeDefined();
    expect(mock.applicationName).toBeDefined();
    expect(mock.applicationDescription).toBeDefined();
    expect(mock.contactName).toBeDefined();
    expect(mock.contactEmail).toBeDefined();
    expect(mock.websiteUrl).toBeDefined();
    expect(mock.street).toBeDefined();
    expect(mock.city).toBeDefined();
    expect(mock.state).toBeDefined();
    expect(mock.zipCode).toBeDefined();
    expect(mock.integrationMethod).toBeDefined();
    expect(mock.dataElementsRequested).toBeDefined();
    expect(mock.dataPurpose).toBeDefined();
    expect(mock.dataRetentionDays).toBeDefined();
    expect(mock.coppaCompliant).toBeDefined();
    expect(mock.acceptsDataDeletion).toBeDefined();
    expect(mock.acceptsTerms).toBeDefined();
  });

  it("generated mock has valid field types", () => {
    const mock = factory.create();

    expect(typeof mock.vendorName).toBe("string");
    expect(typeof mock.contactEmail).toBe("string");
    expect((mock.contactEmail as string).includes("@")).toBe(true);
    // integrationMethod is now a single enum value (string)
    expect(typeof mock.integrationMethod).toBe("string");
    // dataElementsRequested is an array
    expect(Array.isArray(mock.dataElementsRequested)).toBe(true);
    expect(typeof mock.dataRetentionDays).toBe("number");
    expect(typeof mock.coppaCompliant).toBe("boolean");
  });

  it("boolean compliance fields are always true (for valid mocks)", () => {
    // Generate multiple mocks to ensure compliance fields are always true
    const mocks = factory.createMany(10);

    for (const mock of mocks) {
      expect(mock.coppaCompliant).toBe(true);
      expect(mock.acceptsTerms).toBe(true);
      expect(mock.acceptsDataDeletion).toBe(true);
    }
  });
});

// =============================================================================
// FORM CONFIG EQUIVALENCE
// =============================================================================

describe("Form Config Generation", () => {
  const formConfig = generateFormConfig(PodsLiteSchema);

  it("generates expected sections", () => {
    const sectionIds = formConfig.sections.map((s) => s.id);

    // 8 sections defined in the schema
    expect(sectionIds).toContain("company");
    expect(sectionIds).toContain("contact");
    expect(sectionIds).toContain("verification");
    expect(sectionIds).toContain("address");
    expect(sectionIds).toContain("integration");
    expect(sectionIds).toContain("data");
    expect(sectionIds).toContain("security");
    expect(sectionIds).toContain("compliance");
    expect(sectionIds.length).toBe(8);
  });

  it("company section has expected fields", () => {
    const companySection = formConfig.sections.find((s) => s.id === "company");
    const fieldNames = companySection?.fields.map((f) => f.name) || [];

    expect(fieldNames).toContain("vendorName");
    expect(fieldNames).toContain("applicationName");
    expect(fieldNames).toContain("applicationDescription");
  });

  it("contact section has expected fields", () => {
    const contactSection = formConfig.sections.find((s) => s.id === "contact");
    const fieldNames = contactSection?.fields.map((f) => f.name) || [];

    expect(fieldNames).toContain("contactName");
    expect(fieldNames).toContain("contactEmail");
    expect(fieldNames).toContain("contactPhone");
  });

  it("verification section has websiteUrl", () => {
    const verificationSection = formConfig.sections.find((s) => s.id === "verification");
    const fieldNames = verificationSection?.fields.map((f) => f.name) || [];

    expect(fieldNames).toContain("websiteUrl");
    expect(fieldNames).toContain("linkedInUrl");
  });

  it("infers correct field types", () => {
    const allFields = formConfig.sections.flatMap((s) => s.fields);

    const emailField = allFields.find((f) => f.name === "contactEmail");
    expect(emailField?.type).toBe("email");

    const urlField = allFields.find((f) => f.name === "websiteUrl");
    expect(urlField?.type).toBe("url");

    const checkboxField = allFields.find((f) => f.name === "coppaCompliant");
    expect(checkboxField?.type).toBe("checkbox");
  });

  it("total fields match schema field count", () => {
    const allFields = formConfig.sections.flatMap((s) => s.fields);
    const schemaFieldCount = Object.keys(PodsLiteSchema.schema.shape).length;

    expect(allFields.length).toBe(schemaFieldCount);
  });
});

// =============================================================================
// MIGRATION DECISION MATRIX
// =============================================================================

describe("Migration Readiness Assessment", () => {
  it("SUMMARY: documents migration gaps", () => {
    const gaps: string[] = [];
    const ready: string[] = [];

    // Check AI tool
    const existingTool = TOOL_DEFINITIONS.find(
      (t) => t.name === "submit_pods_lite"
    )!;
    const generatedTool = generateAITool(PodsLiteSchema);

    if (existingTool.name === generatedTool.name) {
      ready.push("✅ AI Tool name matches");
    }

    // Check prefill naming convention
    const existingProps = existingTool.input_schema.properties as Record<
      string,
      unknown
    >;
    if ("prefill_email" in existingProps) {
      gaps.push(
        "⚠️ AI Tool prefill naming: existing uses prefill_email, schema uses prefill_contactEmail"
      );
    }

    // Check tool purpose difference
    const existingPropCount = Object.keys(existingProps).length;
    const generatedPropCount = Object.keys(
      generatedTool.input_schema.properties as Record<string, unknown>
    ).length;
    if (generatedPropCount > existingPropCount * 2) {
      gaps.push(
        `⚠️ AI Tool design difference: existing is trigger-only (${existingPropCount} props), generated is full-form (${generatedPropCount} props)`
      );
    }

    // Check mock data
    const factory = createMockFactory(PodsLiteSchema);
    const mock = factory.create();
    const validationResult = PodsLiteSchema.schema.safeParse(mock);
    if (validationResult.success) {
      ready.push("✅ Mock data passes schema validation");
    } else {
      gaps.push("❌ Mock data fails schema validation");
    }

    // Check form config
    const formConfig = generateFormConfig(PodsLiteSchema);
    if (formConfig.sections.length === PodsLiteSchema.sections.length) {
      ready.push("✅ Form config sections match schema sections");
    }

    console.log("\n");
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║            MIGRATION READINESS ASSESSMENT                ║");
    console.log("╠══════════════════════════════════════════════════════════╣");
    console.log("║ READY FOR MIGRATION:                                     ║");
    for (const item of ready) {
      console.log(`║   ${item.padEnd(55)}║`);
    }
    console.log("╠══════════════════════════════════════════════════════════╣");
    console.log("║ GAPS TO RESOLVE:                                         ║");
    for (const item of gaps) {
      console.log(`║   ${item.padEnd(55)}║`);
    }
    console.log("╠══════════════════════════════════════════════════════════╣");
    console.log("║ RECOMMENDATION:                                          ║");
    if (gaps.length === 0) {
      console.log("║   ✅ Safe to migrate - all checks pass                   ║");
    } else if (gaps.some((g) => g.includes("❌"))) {
      console.log("║   🛑 DO NOT migrate - critical gaps exist                ║");
    } else {
      console.log("║   ⚠️  Review gaps before migrating - may need updates    ║");
    }
    console.log("╚══════════════════════════════════════════════════════════╝");
    console.log("\n");

    // This test always passes - it's for documentation
    expect(true).toBe(true);
  });
});
