/**
 * Schema-First Architecture Tests
 *
 * Proves that schemas serve as single source of truth for:
 * - TypeScript types
 * - AI tool definitions
 * - Form configurations
 * - Mock data generation
 * - Validation
 */

import { describe, it, expect } from "vitest";
import {
  PodsLiteSchema,
  generateAITool,
  generateFormConfig,
  createMockFactory,
  validateSchema,
  extractFields,
  type PodsLiteInput,
} from "@/lib/schemas";

// =============================================================================
// SCHEMA EXTRACTION TESTS
// =============================================================================

describe("Schema Field Extraction", () => {
  it("should extract all fields from schema", () => {
    const fields = extractFields(PodsLiteSchema.schema);

    expect(fields.length).toBeGreaterThan(10);

    // Check key fields exist (aligned with existing form)
    const fieldNames = fields.map((f) => f.name);
    expect(fieldNames).toContain("vendorName");
    expect(fieldNames).toContain("contactEmail");
    expect(fieldNames).toContain("integrationMethod");
    expect(fieldNames).toContain("dataElementsRequested");
    expect(fieldNames).toContain("coppaCompliant");
  });

  it("should identify required vs optional fields", () => {
    const fields = extractFields(PodsLiteSchema.schema);

    const vendorName = fields.find((f) => f.name === "vendorName");
    expect(vendorName?.required).toBe(true);

    const contactPhone = fields.find((f) => f.name === "contactPhone");
    expect(contactPhone?.required).toBe(false);
  });

  it("should extract enum values", () => {
    const fields = extractFields(PodsLiteSchema.schema);

    // integrationMethod is a single enum (aligned with existing form)
    const integrationMethod = fields.find((f) => f.name === "integrationMethod");
    expect(integrationMethod?.enumValues).toContain("ONEROSTER_API");
    expect(integrationMethod?.enumValues).toContain("LTI_1_3");

    // dataElementsRequested is an array of enums (aligned with lib/types/index.ts)
    const dataElements = fields.find((f) => f.name === "dataElementsRequested");
    expect(dataElements?.enumValues).toContain("STUDENT_ID");
    expect(dataElements?.enumValues).toContain("CLASS_ROSTER");
  });

  it("should extract field metadata", () => {
    const fields = extractFields(PodsLiteSchema.schema);

    const vendorName = fields.find((f) => f.name === "vendorName");
    expect(vendorName?.meta.label).toBe("Company Name");
    expect(vendorName?.meta.section).toBe("company");
  });

  it("should sort fields by section and field order", () => {
    const fields = extractFields(PodsLiteSchema.schema);

    // First fields should be from section with sectionOrder: 1
    const firstField = fields[0];
    expect(firstField.meta.sectionOrder).toBe(1);
  });
});

// =============================================================================
// AI TOOL GENERATION TESTS
// =============================================================================

describe("AI Tool Generation", () => {
  it("should generate valid Anthropic tool definition", () => {
    const tool = generateAITool(PodsLiteSchema, {
      prefillFields: ["vendorName", "contactEmail"],
    });

    expect(tool.name).toBe("submit_pods_lite");
    expect(tool.description).toContain("PoDS-Lite");
    expect(tool.input_schema.type).toBe("object");
  });

  it("should include trigger_form parameter when configured", () => {
    const tool = generateAITool(PodsLiteSchema);

    const properties = tool.input_schema.properties as Record<string, unknown>;
    expect(properties).toHaveProperty("trigger_form");
    expect((properties.trigger_form as { type: string }).type).toBe("boolean");
  });

  it("should include all schema fields in input_schema", () => {
    const tool = generateAITool(PodsLiteSchema);

    const properties = tool.input_schema.properties as Record<string, unknown>;
    expect(properties).toHaveProperty("vendorName");
    expect(properties).toHaveProperty("contactEmail");
    expect(properties).toHaveProperty("integrationMethod");
    expect(properties).toHaveProperty("dataElementsRequested");
  });

  it("should mark required fields correctly", () => {
    const tool = generateAITool(PodsLiteSchema);

    const required = tool.input_schema.required as string[];
    expect(required).toContain("trigger_form");
    expect(required).toContain("vendorName");
    expect(required).toContain("contactEmail");
    expect(required).not.toContain("contactPhone");
  });

  it("should generate prefill parameters when specified", () => {
    const tool = generateAITool(PodsLiteSchema, {
      prefillFields: ["vendorName", "contactEmail"],
    });

    const properties = tool.input_schema.properties as Record<string, unknown>;
    expect(properties).toHaveProperty("prefill_vendorName");
    expect(properties).toHaveProperty("prefill_contactEmail");
  });
});

// =============================================================================
// FORM CONFIG GENERATION TESTS
// =============================================================================

describe("Form Config Generation", () => {
  it("should generate form configuration with sections", () => {
    const formConfig = generateFormConfig(PodsLiteSchema);

    expect(formConfig.id).toBe("pods-lite");
    expect(formConfig.name).toBe("PoDS-Lite Application");
    expect(formConfig.sections.length).toBeGreaterThan(0);
  });

  it("should group fields into correct sections", () => {
    const formConfig = generateFormConfig(PodsLiteSchema);

    const companySection = formConfig.sections.find((s) => s.id === "company");
    expect(companySection).toBeDefined();
    expect(companySection?.fields.some((f) => f.name === "vendorName")).toBe(true);

    const contactSection = formConfig.sections.find((s) => s.id === "contact");
    expect(contactSection).toBeDefined();
    expect(contactSection?.fields.some((f) => f.name === "contactEmail")).toBe(true);
  });

  it("should infer correct field types", () => {
    const formConfig = generateFormConfig(PodsLiteSchema);

    const allFields = formConfig.sections.flatMap((s) => s.fields);

    const emailField = allFields.find((f) => f.name === "contactEmail");
    expect(emailField?.type).toBe("email");

    const websiteField = allFields.find((f) => f.name === "websiteUrl");
    expect(websiteField?.type).toBe("url");

    const descField = allFields.find((f) => f.name === "applicationDescription");
    expect(descField?.type).toBe("textarea");

    const coppaField = allFields.find((f) => f.name === "coppaCompliant");
    expect(coppaField?.type).toBe("checkbox");
  });

  it("should generate options for enum fields", () => {
    const formConfig = generateFormConfig(PodsLiteSchema);
    const allFields = formConfig.sections.flatMap((s) => s.fields);

    // integrationMethod is a select with enum options
    const integrationField = allFields.find((f) => f.name === "integrationMethod");
    expect(integrationField?.options).toBeDefined();
    expect(integrationField?.options?.some((o) => o.value === "ONEROSTER_API")).toBe(
      true
    );

    // dataElementsRequested is a multiselect with enum options (aligned with lib/types)
    const dataField = allFields.find((f) => f.name === "dataElementsRequested");
    expect(dataField?.options).toBeDefined();
    expect(dataField?.options?.some((o) => o.value === "STUDENT_ID")).toBe(true);
  });

  it("should include conditional display rules", () => {
    const formConfig = generateFormConfig(PodsLiteSchema);
    const allFields = formConfig.sections.flatMap((s) => s.fields);

    // thirdPartyDetails has conditional display based on thirdPartySharing
    const thirdPartyField = allFields.find((f) => f.name === "thirdPartyDetails");
    expect(thirdPartyField?.showWhen).toBeDefined();
    expect(thirdPartyField?.showWhen?.field).toBe("thirdPartySharing");
  });
});

// =============================================================================
// MOCK DATA GENERATION TESTS
// =============================================================================

describe("Mock Data Generation", () => {
  it("should create mock factory for schema", () => {
    const factory = createMockFactory(PodsLiteSchema);

    expect(factory.create).toBeDefined();
    expect(factory.createMany).toBeDefined();
    expect(factory.createPartial).toBeDefined();
  });

  it("should generate valid mock data", () => {
    const factory = createMockFactory(PodsLiteSchema);
    const mock = factory.create();

    expect(mock).toHaveProperty("vendorName");
    expect(mock).toHaveProperty("contactEmail");
    expect(typeof mock.vendorName).toBe("string");
    expect((mock.contactEmail as string).includes("@")).toBe(true);
  });

  it("should generate deterministic data with seed", () => {
    const factory = createMockFactory(PodsLiteSchema);
    const mock1 = factory.create({ seed: 12345 });
    const mock2 = factory.create({ seed: 12345 });

    expect(mock1.vendorName).toBe(mock2.vendorName);
    expect(mock1.contactEmail).toBe(mock2.contactEmail);
  });

  it("should generate multiple mocks", () => {
    const factory = createMockFactory(PodsLiteSchema);
    const mocks = factory.createMany(5);

    expect(mocks.length).toBe(5);

    // Each should be different
    const names = mocks.map((m) => m.vendorName);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBeGreaterThan(1);
  });

  it("should allow overrides", () => {
    const factory = createMockFactory(PodsLiteSchema);
    const mock = factory.create({
      override: {
        vendorName: "Custom Company",
        contactEmail: "custom@test.com",
      },
    });

    expect(mock.vendorName).toBe("Custom Company");
    expect(mock.contactEmail).toBe("custom@test.com");
  });

  it("should generate booleans as true for acceptance fields", () => {
    const factory = createMockFactory(PodsLiteSchema);
    const mock = factory.create();

    expect(mock.coppaCompliant).toBe(true);
    expect(mock.acceptsTerms).toBe(true);
    expect(mock.acceptsDataDeletion).toBe(true);
  });
});

// =============================================================================
// VALIDATION TESTS
// =============================================================================

describe("Schema Validation", () => {
  it("should validate correct data", () => {
    const factory = createMockFactory(PodsLiteSchema);
    const mock = factory.create();

    const result = validateSchema(PodsLiteSchema.schema, mock);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("should reject invalid data with errors", () => {
    const invalidData = {
      vendorName: "", // Too short
      contactEmail: "not-an-email",
    };

    const result = validateSchema(PodsLiteSchema.schema, invalidData);

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(Object.keys(result.errors!).length).toBeGreaterThan(0);
  });

  it("should provide field-level errors", () => {
    const invalidData = {
      vendorName: "A",
      contactEmail: "bad-email",
    };

    const result = validateSchema(PodsLiteSchema.schema, invalidData);

    expect(result.fieldErrors).toBeDefined();
    expect(result.fieldErrors?.some((e) => e.field === "vendorName")).toBe(true);
    expect(result.fieldErrors?.some((e) => e.field === "contactEmail")).toBe(true);
  });
});

// =============================================================================
// TYPE INFERENCE TESTS
// =============================================================================

describe("Type Inference", () => {
  it("should infer correct TypeScript type", () => {
    // This is a compile-time check - if it compiles, the type is correct
    // Field names aligned with existing form
    const typedData: PodsLiteInput = {
      vendorName: "Test Company",
      applicationName: "Test App",
      applicationDescription: "A test application for testing",
      contactName: "John Doe",
      contactEmail: "john@test.com",
      websiteUrl: "https://test.com",
      street: "123 Main St",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
      integrationMethod: "ONEROSTER_API",
      dataElementsRequested: ["STUDENT_ID", "CLASS_ROSTER"],
      thirdPartySharing: false,
      dataPurpose: "Testing the schema-first architecture",
      dataRetentionDays: 30,
      breachNotificationHours: 24,
      hasSOC2: true,
      hasFERPACertification: true,
      encryptsDataAtRest: true,
      encryptsDataInTransit: true,
      coppaCompliant: true,
      acceptsDataDeletion: true,
      acceptsTerms: true,
    };

    // If we can access these properties with correct types, the inference works
    expect(typedData.vendorName).toBe("Test Company");
    expect(typedData.integrationMethod).toBe("ONEROSTER_API");
    expect(typedData.dataElementsRequested).toContain("STUDENT_ID");
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe("Schema-First Integration", () => {
  it("should maintain consistency across all generators", () => {
    const fields = extractFields(PodsLiteSchema.schema);
    const tool = generateAITool(PodsLiteSchema);
    const formConfig = generateFormConfig(PodsLiteSchema);
    const factory = createMockFactory(PodsLiteSchema);

    // All should have the same field count (approximately)
    const fieldNames = fields.map((f) => f.name);
    const toolProperties = Object.keys(
      tool.input_schema.properties as Record<string, unknown>
    ).filter((k) => !k.startsWith("trigger_") && !k.startsWith("prefill_"));
    const formFields = formConfig.sections.flatMap((s) => s.fields.map((f) => f.name));

    expect(toolProperties.sort()).toEqual(fieldNames.sort());
    expect(formFields.sort()).toEqual(fieldNames.sort());
  });

  it("should generate mock data that passes validation", () => {
    const factory = createMockFactory(PodsLiteSchema);

    // Generate 10 mocks and validate all
    const mocks = factory.createMany(10);

    for (const mock of mocks) {
      const result = validateSchema(PodsLiteSchema.schema, mock);
      expect(result.success).toBe(true);
    }
  });
});
