/**
 * Form Config Equivalence Tests
 *
 * These tests prove that the generated form config from PodsLiteSchema
 * is equivalent to the hardcoded form definitions in PodsLiteForm.tsx.
 *
 * CRITICAL: All tests must pass before migrating the form component
 * to use the generated config instead of hardcoded definitions.
 */

import { describe, it, expect } from "vitest";
import {
  PodsLiteSchema,
  generateFormConfig,
  extractFields,
} from "@/lib/schemas";

// =============================================================================
// EXISTING FORM DEFINITIONS (extracted from PodsLiteForm.tsx for comparison)
// =============================================================================

/**
 * These constants mirror the hardcoded definitions in PodsLiteForm.tsx
 * We use them to verify the generated config matches.
 */

const EXISTING_INTEGRATION_METHODS = [
  { value: "ONEROSTER_API", label: "OneRoster API" },
  { value: "LTI_1_3", label: "LTI 1.3" },
  { value: "SSO_SAML", label: "SSO (SAML)" },
  { value: "SSO_OIDC", label: "SSO (OIDC)" },
  { value: "SFTP", label: "SFTP/CSV" },
  { value: "MANUAL_UPLOAD", label: "Manual Upload" },
];

/**
 * Required fields from the existing Zod schema in PodsLiteForm.tsx
 */
const EXISTING_REQUIRED_FIELDS = [
  "vendorName",
  "applicationName",
  "applicationDescription",
  "contactName",
  "contactEmail",
  "contactPhone",
  "websiteUrl",
  "street",
  "city",
  "state",
  "zipCode",
  "integrationMethod",
  "dataElementsRequested",
  "dataPurpose",
  "dataRetentionDays",
  "breachNotificationHours",
  "coppaCompliant",
  "acceptsDataDeletion",
  "acceptsTerms",
];

/**
 * Optional fields from the existing form
 */
const EXISTING_OPTIONAL_FIELDS = [
  "linkedInUrl",
  "suite",
  "contactPhone", // Note: In schema it's optional, form may have different handling
  "thirdPartyDetails",
  "expectedStudentCount",
];

// =============================================================================
// SECTION STRUCTURE TESTS
// =============================================================================

describe("Form Config Section Equivalence", () => {
  const formConfig = generateFormConfig(PodsLiteSchema);

  it("should have exactly 8 sections matching schema definition", () => {
    expect(formConfig.sections).toHaveLength(8);
  });

  it("should have all expected section IDs", () => {
    const sectionIds = formConfig.sections.map((s) => s.id);

    expect(sectionIds).toContain("company");
    expect(sectionIds).toContain("contact");
    expect(sectionIds).toContain("verification");
    expect(sectionIds).toContain("address");
    expect(sectionIds).toContain("integration");
    expect(sectionIds).toContain("data");
    expect(sectionIds).toContain("security");
    expect(sectionIds).toContain("compliance");
  });

  it("should have sections in correct order", () => {
    const sectionIds = formConfig.sections.map((s) => s.id);

    expect(sectionIds).toEqual([
      "company",
      "contact",
      "verification",
      "address",
      "integration",
      "data",
      "security",
      "compliance",
    ]);
  });

  it("company section should have correct title", () => {
    const section = formConfig.sections.find((s) => s.id === "company");
    expect(section?.title).toBe("Company Information");
  });

  it("contact section should have correct title", () => {
    const section = formConfig.sections.find((s) => s.id === "contact");
    expect(section?.title).toBe("Primary Contact");
  });

  it("compliance section should have correct title", () => {
    const section = formConfig.sections.find((s) => s.id === "compliance");
    expect(section?.title).toBe("Compliance Acknowledgments");
  });
});

// =============================================================================
// FIELD GROUPING TESTS
// =============================================================================

describe("Form Config Field Grouping Equivalence", () => {
  const formConfig = generateFormConfig(PodsLiteSchema);

  it("company section should contain vendor and application fields", () => {
    const section = formConfig.sections.find((s) => s.id === "company");
    const fieldNames = section?.fields.map((f) => f.name) || [];

    expect(fieldNames).toContain("vendorName");
    expect(fieldNames).toContain("applicationName");
    expect(fieldNames).toContain("applicationDescription");
    expect(fieldNames).toHaveLength(3);
  });

  it("contact section should contain contact fields", () => {
    const section = formConfig.sections.find((s) => s.id === "contact");
    const fieldNames = section?.fields.map((f) => f.name) || [];

    expect(fieldNames).toContain("contactName");
    expect(fieldNames).toContain("contactEmail");
    expect(fieldNames).toContain("contactPhone");
    expect(fieldNames).toHaveLength(3);
  });

  it("address section should contain address fields", () => {
    const section = formConfig.sections.find((s) => s.id === "address");
    const fieldNames = section?.fields.map((f) => f.name) || [];

    expect(fieldNames).toContain("street");
    expect(fieldNames).toContain("suite");
    expect(fieldNames).toContain("city");
    expect(fieldNames).toContain("state");
    expect(fieldNames).toContain("zipCode");
    expect(fieldNames).toHaveLength(5);
  });

  it("integration section should contain integration fields", () => {
    const section = formConfig.sections.find((s) => s.id === "integration");
    const fieldNames = section?.fields.map((f) => f.name) || [];

    expect(fieldNames).toContain("integrationMethod");
    expect(fieldNames).toContain("dataElementsRequested");
    expect(fieldNames).toContain("thirdPartySharing");
    expect(fieldNames).toContain("thirdPartyDetails");
    expect(fieldNames).toHaveLength(4);
  });

  it("compliance section should contain agreement fields", () => {
    const section = formConfig.sections.find((s) => s.id === "compliance");
    const fieldNames = section?.fields.map((f) => f.name) || [];

    expect(fieldNames).toContain("coppaCompliant");
    expect(fieldNames).toContain("acceptsDataDeletion");
    expect(fieldNames).toContain("acceptsTerms");
    expect(fieldNames).toHaveLength(3);
  });
});

// =============================================================================
// FIELD TYPE TESTS
// =============================================================================

describe("Form Config Field Type Equivalence", () => {
  const formConfig = generateFormConfig(PodsLiteSchema);
  const allFields = formConfig.sections.flatMap((s) => s.fields);

  it("email fields should have email type", () => {
    const emailField = allFields.find((f) => f.name === "contactEmail");
    expect(emailField?.type).toBe("email");
  });

  it("URL fields should have url type", () => {
    const websiteField = allFields.find((f) => f.name === "websiteUrl");
    const linkedInField = allFields.find((f) => f.name === "linkedInUrl");

    expect(websiteField?.type).toBe("url");
    expect(linkedInField?.type).toBe("url");
  });

  it("textarea fields should have textarea type", () => {
    const descField = allFields.find((f) => f.name === "applicationDescription");
    const purposeField = allFields.find((f) => f.name === "dataPurpose");

    expect(descField?.type).toBe("textarea");
    expect(purposeField?.type).toBe("textarea");
  });

  it("checkbox fields should have checkbox type", () => {
    const coppaField = allFields.find((f) => f.name === "coppaCompliant");
    const termsField = allFields.find((f) => f.name === "acceptsTerms");
    const soc2Field = allFields.find((f) => f.name === "hasSOC2");

    expect(coppaField?.type).toBe("checkbox");
    expect(termsField?.type).toBe("checkbox");
    expect(soc2Field?.type).toBe("checkbox");
  });

  it("number fields should have number type", () => {
    const retentionField = allFields.find((f) => f.name === "dataRetentionDays");
    const notificationField = allFields.find((f) => f.name === "breachNotificationHours");

    expect(retentionField?.type).toBe("number");
    expect(notificationField?.type).toBe("number");
  });

  it("select fields should have select type", () => {
    const integrationField = allFields.find((f) => f.name === "integrationMethod");
    const stateField = allFields.find((f) => f.name === "state");

    expect(integrationField?.type).toBe("select");
    expect(stateField?.type).toBe("select");
  });

  it("multiselect fields should have multiselect type", () => {
    const dataField = allFields.find((f) => f.name === "dataElementsRequested");
    expect(dataField?.type).toBe("multiselect");
  });
});

// =============================================================================
// FIELD OPTIONS TESTS (ENUM VALUES)
// =============================================================================

describe("Form Config Enum Options Equivalence", () => {
  const formConfig = generateFormConfig(PodsLiteSchema);
  const allFields = formConfig.sections.flatMap((s) => s.fields);

  it("integrationMethod should have all expected options", () => {
    const field = allFields.find((f) => f.name === "integrationMethod");
    const optionValues = field?.options?.map((o) => o.value) || [];

    for (const method of EXISTING_INTEGRATION_METHODS) {
      expect(optionValues).toContain(method.value);
    }
  });

  it("integrationMethod option count should match", () => {
    const field = allFields.find((f) => f.name === "integrationMethod");
    expect(field?.options?.length).toBe(EXISTING_INTEGRATION_METHODS.length);
  });

  it("dataElementsRequested should have data element options", () => {
    const field = allFields.find((f) => f.name === "dataElementsRequested");
    const optionValues = field?.options?.map((o) => o.value) || [];

    // Key data elements that should exist
    expect(optionValues).toContain("STUDENT_ID");
    expect(optionValues).toContain("FIRST_NAME");
    expect(optionValues).toContain("CLASS_ROSTER");
    expect(optionValues).toContain("GRADES");
  });
});

// =============================================================================
// FIELD LABEL AND METADATA TESTS
// =============================================================================

describe("Form Config Field Labels Equivalence", () => {
  const formConfig = generateFormConfig(PodsLiteSchema);
  const allFields = formConfig.sections.flatMap((s) => s.fields);

  it("vendorName should have correct label", () => {
    const field = allFields.find((f) => f.name === "vendorName");
    expect(field?.label).toBe("Company Name");
  });

  it("contactEmail should have correct label", () => {
    const field = allFields.find((f) => f.name === "contactEmail");
    expect(field?.label).toBe("Email");
  });

  it("applicationDescription should have correct label", () => {
    const field = allFields.find((f) => f.name === "applicationDescription");
    expect(field?.label).toBe("Product Description");
  });

  it("coppaCompliant should have correct label", () => {
    const field = allFields.find((f) => f.name === "coppaCompliant");
    expect(field?.label).toBe("COPPA Compliance");
  });

  it("dataRetentionDays should have correct label", () => {
    const field = allFields.find((f) => f.name === "dataRetentionDays");
    expect(field?.label).toBe("Data Retention (days)");
  });
});

// =============================================================================
// REQUIRED VS OPTIONAL TESTS
// =============================================================================

describe("Form Config Required Fields Equivalence", () => {
  const fields = extractFields(PodsLiteSchema.schema);

  it("should have correct required fields", () => {
    const requiredFieldNames = fields
      .filter((f) => f.required)
      .map((f) => f.name);

    // Check key required fields
    expect(requiredFieldNames).toContain("vendorName");
    expect(requiredFieldNames).toContain("contactEmail");
    expect(requiredFieldNames).toContain("integrationMethod");
    expect(requiredFieldNames).toContain("coppaCompliant");
    expect(requiredFieldNames).toContain("acceptsTerms");
  });

  it("should have correct optional fields", () => {
    const optionalFieldNames = fields
      .filter((f) => !f.required)
      .map((f) => f.name);

    // Check key optional fields
    expect(optionalFieldNames).toContain("linkedInUrl");
    expect(optionalFieldNames).toContain("suite");
    expect(optionalFieldNames).toContain("thirdPartyDetails");
  });
});

// =============================================================================
// CONDITIONAL DISPLAY TESTS
// =============================================================================

describe("Form Config Conditional Display Equivalence", () => {
  const formConfig = generateFormConfig(PodsLiteSchema);
  const allFields = formConfig.sections.flatMap((s) => s.fields);

  it("thirdPartyDetails should be conditional on thirdPartySharing", () => {
    const field = allFields.find((f) => f.name === "thirdPartyDetails");

    expect(field?.showWhen).toBeDefined();
    expect(field?.showWhen?.field).toBe("thirdPartySharing");
    expect(field?.showWhen?.equals).toBe(true);
  });
});

// =============================================================================
// TOTAL FIELD COUNT TEST
// =============================================================================

describe("Form Config Total Fields", () => {
  const formConfig = generateFormConfig(PodsLiteSchema);
  const schemaFields = extractFields(PodsLiteSchema.schema);

  it("total fields in form config should match schema field count", () => {
    const formFieldCount = formConfig.sections.reduce(
      (sum, section) => sum + section.fields.length,
      0
    );

    expect(formFieldCount).toBe(schemaFields.length);
  });

  it("should have exactly 28 fields (matching PodsLiteForm.tsx)", () => {
    const formFieldCount = formConfig.sections.reduce(
      (sum, section) => sum + section.fields.length,
      0
    );

    expect(formFieldCount).toBe(28);
  });
});

// =============================================================================
// MIGRATION READINESS SUMMARY
// =============================================================================

describe("Form Config Migration Readiness", () => {
  it("SUMMARY: documents form config equivalence status", () => {
    const formConfig = generateFormConfig(PodsLiteSchema);
    const ready: string[] = [];
    const gaps: string[] = [];

    // Check section count
    if (formConfig.sections.length === 8) {
      ready.push("Section count matches (8 sections)");
    } else {
      gaps.push(`Section count mismatch: got ${formConfig.sections.length}, expected 8`);
    }

    // Check total field count
    const fieldCount = formConfig.sections.reduce(
      (sum, s) => sum + s.fields.length,
      0
    );
    if (fieldCount === 28) {
      ready.push("Field count matches (28 fields)");
    } else {
      gaps.push(`Field count mismatch: got ${fieldCount}, expected 28`);
    }

    // Check all sections have titles
    const sectionsWithTitles = formConfig.sections.filter((s) => s.title);
    if (sectionsWithTitles.length === 8) {
      ready.push("All sections have titles");
    } else {
      gaps.push("Some sections missing titles");
    }

    // Check field types are inferred
    const allFields = formConfig.sections.flatMap((s) => s.fields);
    const fieldsWithTypes = allFields.filter((f) => f.type);
    if (fieldsWithTypes.length === allFields.length) {
      ready.push("All fields have types inferred");
    } else {
      gaps.push("Some fields missing type inference");
    }

    console.log("\n");
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║          FORM CONFIG MIGRATION READINESS                 ║");
    console.log("╠══════════════════════════════════════════════════════════╣");
    console.log("║ READY:                                                   ║");
    for (const item of ready) {
      console.log(`║   ${item.padEnd(55)}║`);
    }
    if (gaps.length > 0) {
      console.log("╠══════════════════════════════════════════════════════════╣");
      console.log("║ GAPS:                                                    ║");
      for (const item of gaps) {
        console.log(`║   ${item.padEnd(55)}║`);
      }
    }
    console.log("╠══════════════════════════════════════════════════════════╣");
    if (gaps.length === 0) {
      console.log("║   SAFE TO MIGRATE form to use generated config         ║");
    } else {
      console.log("║   REVIEW gaps before migrating                          ║");
    }
    console.log("╚══════════════════════════════════════════════════════════╝");
    console.log("\n");

    // This test always passes - it's for documentation
    expect(true).toBe(true);
  });
});
