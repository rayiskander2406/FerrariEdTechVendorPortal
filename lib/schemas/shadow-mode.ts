/**
 * Shadow Mode Verification
 *
 * Utilities for safely migrating from hardcoded form configs to schema-generated configs.
 * Shadow mode runs both systems in parallel and alerts on any differences.
 *
 * Usage:
 * 1. Import verifyFormConfig in your form component
 * 2. Pass both hardcoded and generated configs
 * 3. In development, it logs warnings for any mismatches
 * 4. Once verified, switch to using generated config directly
 */

import type { FormConfig, FormFieldConfig, FormSectionConfig } from "./generators/form-fields";

// =============================================================================
// TYPES
// =============================================================================

export interface FieldComparisonResult {
  field: string;
  status: "match" | "mismatch" | "missing_in_generated" | "missing_in_existing";
  property?: string;
  existingValue?: unknown;
  generatedValue?: unknown;
}

export interface SectionComparisonResult {
  section: string;
  status: "match" | "mismatch" | "missing_in_generated" | "missing_in_existing";
  fieldResults: FieldComparisonResult[];
}

export interface FormComparisonResult {
  status: "equivalent" | "different";
  sectionResults: SectionComparisonResult[];
  summary: {
    totalSections: number;
    matchingSections: number;
    totalFields: number;
    matchingFields: number;
    mismatches: string[];
  };
}

// =============================================================================
// SHADOW MODE FLAG
// =============================================================================

/**
 * Enable shadow mode verification (default: development only)
 */
export const SHADOW_MODE_ENABLED =
  process.env.NODE_ENV === "development" ||
  process.env.SHADOW_MODE === "true";

// =============================================================================
// COMPARISON UTILITIES
// =============================================================================

/**
 * Compare two field configurations
 */
function compareFields(
  existing: FormFieldConfig,
  generated: FormFieldConfig
): FieldComparisonResult {
  const mismatches: string[] = [];

  // Compare key properties
  if (existing.label !== generated.label) {
    mismatches.push(`label: "${existing.label}" vs "${generated.label}"`);
  }
  if (existing.type !== generated.type) {
    mismatches.push(`type: "${existing.type}" vs "${generated.type}"`);
  }
  if (existing.required !== generated.required) {
    mismatches.push(`required: ${existing.required} vs ${generated.required}`);
  }

  // Compare options for select/multiselect
  if (existing.options || generated.options) {
    const existingValues = existing.options?.map((o) => o.value).sort() || [];
    const generatedValues = generated.options?.map((o) => o.value).sort() || [];

    if (JSON.stringify(existingValues) !== JSON.stringify(generatedValues)) {
      mismatches.push(
        `options: [${existingValues.join(",")}] vs [${generatedValues.join(",")}]`
      );
    }
  }

  if (mismatches.length === 0) {
    return { field: existing.name, status: "match" };
  }

  return {
    field: existing.name,
    status: "mismatch",
    property: mismatches.join("; "),
    existingValue: existing,
    generatedValue: generated,
  };
}

/**
 * Compare two section configurations
 */
function compareSections(
  existing: FormSectionConfig,
  generated: FormSectionConfig
): SectionComparisonResult {
  const fieldResults: FieldComparisonResult[] = [];

  // Create field maps for comparison
  const existingFieldMap = new Map(existing.fields.map((f) => [f.name, f]));
  const generatedFieldMap = new Map(generated.fields.map((f) => [f.name, f]));

  // Check all existing fields
  for (const [name, existingField] of Array.from(existingFieldMap)) {
    const generatedField = generatedFieldMap.get(name);

    if (!generatedField) {
      fieldResults.push({
        field: name,
        status: "missing_in_generated",
      });
    } else {
      fieldResults.push(compareFields(existingField, generatedField));
    }
  }

  // Check for extra fields in generated
  for (const [name] of Array.from(generatedFieldMap)) {
    if (!existingFieldMap.has(name)) {
      fieldResults.push({
        field: name,
        status: "missing_in_existing",
      });
    }
  }

  const hasIssues = fieldResults.some((r) => r.status !== "match");

  return {
    section: existing.id,
    status: hasIssues ? "mismatch" : "match",
    fieldResults,
  };
}

/**
 * Compare two form configurations
 */
export function compareFormConfigs(
  existing: FormConfig,
  generated: FormConfig
): FormComparisonResult {
  const sectionResults: SectionComparisonResult[] = [];
  const mismatches: string[] = [];

  // Create section maps
  const existingSectionMap = new Map(existing.sections.map((s) => [s.id, s]));
  const generatedSectionMap = new Map(generated.sections.map((s) => [s.id, s]));

  // Compare existing sections
  for (const [id, existingSection] of Array.from(existingSectionMap)) {
    const generatedSection = generatedSectionMap.get(id);

    if (!generatedSection) {
      sectionResults.push({
        section: id,
        status: "missing_in_generated",
        fieldResults: [],
      });
      mismatches.push(`Section "${id}" missing in generated config`);
    } else {
      const result = compareSections(existingSection, generatedSection);
      sectionResults.push(result);

      if (result.status !== "match") {
        for (const fieldResult of result.fieldResults) {
          if (fieldResult.status !== "match") {
            mismatches.push(
              `${id}.${fieldResult.field}: ${fieldResult.status}${
                fieldResult.property ? ` (${fieldResult.property})` : ""
              }`
            );
          }
        }
      }
    }
  }

  // Check for extra sections in generated
  for (const [id] of Array.from(generatedSectionMap)) {
    if (!existingSectionMap.has(id)) {
      sectionResults.push({
        section: id,
        status: "missing_in_existing",
        fieldResults: [],
      });
      mismatches.push(`Section "${id}" extra in generated config`);
    }
  }

  // Calculate summary
  const matchingSections = sectionResults.filter((r) => r.status === "match").length;
  const allFieldResults = sectionResults.flatMap((s) => s.fieldResults);
  const matchingFields = allFieldResults.filter((r) => r.status === "match").length;

  return {
    status: mismatches.length === 0 ? "equivalent" : "different",
    sectionResults,
    summary: {
      totalSections: sectionResults.length,
      matchingSections,
      totalFields: allFieldResults.length,
      matchingFields,
      mismatches,
    },
  };
}

// =============================================================================
// SHADOW MODE VERIFICATION
// =============================================================================

/**
 * Verify generated form config matches existing config
 *
 * In development:
 * - Logs detailed comparison results
 * - Warns on any mismatches
 *
 * In production:
 * - No-op (returns silently)
 *
 * @returns The generated config if equivalent, throws if different
 */
export function verifyFormConfig(
  existing: FormConfig,
  generated: FormConfig,
  options: {
    throwOnMismatch?: boolean;
    logDetails?: boolean;
  } = {}
): FormConfig {
  if (!SHADOW_MODE_ENABLED) {
    return generated;
  }

  const { throwOnMismatch = false, logDetails = true } = options;
  const comparison = compareFormConfigs(existing, generated);

  if (comparison.status === "equivalent") {
    if (logDetails) {
      console.log(
        `[Shadow Mode] Form config verified: ${comparison.summary.totalSections} sections, ` +
          `${comparison.summary.totalFields} fields - all equivalent`
      );
    }
    return generated;
  }

  // Log mismatches
  if (logDetails) {
    console.warn("[Shadow Mode] Form config mismatch detected:");
    console.warn(`  Sections: ${comparison.summary.matchingSections}/${comparison.summary.totalSections} match`);
    console.warn(`  Fields: ${comparison.summary.matchingFields}/${comparison.summary.totalFields} match`);
    console.warn("  Mismatches:");
    for (const mismatch of comparison.summary.mismatches) {
      console.warn(`    - ${mismatch}`);
    }
  }

  if (throwOnMismatch) {
    throw new Error(
      `Shadow mode verification failed: ${comparison.summary.mismatches.length} mismatches found`
    );
  }

  // Return existing config when mismatches found (safe fallback)
  return existing;
}

/**
 * Create a shadow-mode-aware form config hook
 *
 * Usage in a form component:
 * ```
 * const formConfig = useShadowFormConfig(
 *   HARDCODED_CONFIG,
 *   () => generateFormConfig(PodsLiteSchema)
 * );
 * ```
 */
export function createShadowFormConfig(
  existing: FormConfig,
  generateFn: () => FormConfig
): FormConfig {
  if (!SHADOW_MODE_ENABLED) {
    // In production, can choose to use existing or generated
    // For safety, use existing until fully verified
    return existing;
  }

  const generated = generateFn();
  return verifyFormConfig(existing, generated, {
    throwOnMismatch: false,
    logDetails: true,
  });
}
