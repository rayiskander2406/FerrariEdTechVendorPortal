/**
 * Form Field Generator
 *
 * Generates form field configurations from Zod schemas.
 * Powers dynamic form rendering from schema definitions.
 */

import { type ZodTypeAny, type ZodObject, type ZodRawShape } from "zod";
import {
  getMeta,
  type SchemaDefinition,
  type SchemaSection,
  extractFields,
  type ExtractedField,
  type FieldMeta,
} from "../core";

// =============================================================================
// FORM FIELD TYPES
// =============================================================================

export interface FormFieldConfig {
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: unknown;

  // For select/radio/checkbox
  options?: Array<{ value: string; label: string; description?: string }>;

  // Validation
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;

  // Conditional display
  showWhen?: FieldMeta["showWhen"];

  // Grouping
  section?: string;

  // Additional attributes
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export type FormFieldType =
  | "text"
  | "email"
  | "url"
  | "tel"
  | "number"
  | "textarea"
  | "select"
  | "multiselect"
  | "checkbox"
  | "radio"
  | "toggle"
  | "hidden";

export interface FormSectionConfig {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  order: number;
  fields: FormFieldConfig[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface FormConfig {
  id: string;
  name: string;
  description: string;
  sections: FormSectionConfig[];
  submitLabel?: string;
  cancelLabel?: string;
  features: {
    autosave: boolean;
    validationSummary: boolean;
    progressIndicator: boolean;
  };
}

// =============================================================================
// FIELD TYPE INFERENCE
// =============================================================================

/**
 * Infer the best form field type from a Zod schema
 */
function inferFieldType(field: ExtractedField): FormFieldType {
  // Explicit override from meta
  if (field.meta.fieldType) {
    return field.meta.fieldType;
  }

  // Infer from schema type
  switch (field.type) {
    case "boolean":
      return "checkbox";

    case "number":
      return "number";

    case "enum":
      if (field.enumValues && field.enumValues.length <= 4) {
        return "radio";
      }
      return "select";

    case "array":
      if (field.enumValues) {
        return "multiselect";
      }
      return "text";

    case "string": {
      // Check for common patterns in name
      const nameLower = field.name.toLowerCase();
      if (nameLower.includes("email")) return "email";
      if (nameLower.includes("url") || nameLower.includes("website")) return "url";
      if (nameLower.includes("phone") || nameLower.includes("tel")) return "tel";
      if (
        nameLower.includes("description") ||
        nameLower.includes("purpose") ||
        nameLower.includes("details")
      ) {
        return "textarea";
      }
      return "text";
    }

    default:
      return "text";
  }
}

/**
 * Generate label from field name
 */
function inferLabel(field: ExtractedField): string {
  if (field.meta.label) return field.meta.label;

  // Convert camelCase to Title Case
  return field.name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// =============================================================================
// FORM GENERATOR
// =============================================================================

/**
 * Generate form configuration from a schema definition
 */
export function generateFormConfig<T extends ZodRawShape>(
  schemaDef: SchemaDefinition<T>
): FormConfig {
  const fields = extractFields(schemaDef.schema);

  // Group fields by section
  const sectionMap = new Map<string, FormFieldConfig[]>();

  for (const field of fields) {
    const sectionId = field.meta.section || "default";
    if (!sectionMap.has(sectionId)) {
      sectionMap.set(sectionId, []);
    }

    const fieldConfig = generateFieldConfig(field);
    sectionMap.get(sectionId)!.push(fieldConfig);
  }

  // Build sections
  const sections: FormSectionConfig[] = [];

  for (const section of schemaDef.sections) {
    const sectionFields = sectionMap.get(section.id) || [];
    sections.push({
      id: section.id,
      title: section.title,
      description: section.description,
      icon: section.icon,
      order: section.order,
      fields: sectionFields,
      collapsible: section.collapsible,
      defaultCollapsed: section.defaultCollapsed,
    });
  }

  // Add default section if there are ungrouped fields
  const defaultFields = sectionMap.get("default");
  if (defaultFields && defaultFields.length > 0) {
    const hasDefaultSection = sections.some((s) => s.id === "default");
    if (!hasDefaultSection) {
      sections.push({
        id: "default",
        title: "General",
        order: 999,
        fields: defaultFields,
      });
    }
  }

  // Sort sections by order
  sections.sort((a, b) => a.order - b.order);

  return {
    id: schemaDef.id,
    name: schemaDef.name,
    description: schemaDef.description,
    sections,
    submitLabel: "Submit",
    cancelLabel: "Cancel",
    features: {
      autosave: schemaDef.features?.autosave ?? false,
      validationSummary: schemaDef.features?.validationSummary ?? true,
      progressIndicator: true,
    },
  };
}

/**
 * Generate a single field configuration
 */
function generateFieldConfig(field: ExtractedField): FormFieldConfig {
  const type = inferFieldType(field);

  const config: FormFieldConfig = {
    name: field.name,
    label: inferLabel(field),
    type,
    required: field.required,
    placeholder: field.meta.placeholder,
    helpText: field.meta.helpText,
    defaultValue: field.defaultValue,
    showWhen: field.meta.showWhen,
    section: field.meta.section,
  };

  // Add options for select/radio/multiselect
  if (field.enumValues) {
    config.options = field.enumValues.map((value) => ({
      value,
      label: formatEnumLabel(value),
    }));
  }

  // Add validation constraints
  addValidationConstraints(config, field);

  return config;
}

/**
 * Format enum value as a label
 */
function formatEnumLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Add validation constraints from Zod schema
 */
function addValidationConstraints(config: FormFieldConfig, field: ExtractedField): void {
  const checks = (field.zodSchema._def as { checks?: Array<{ kind: string; value?: number }> })
    .checks || [];

  for (const check of checks) {
    switch (check.kind) {
      case "min":
        if (field.type === "number") config.min = check.value;
        else config.minLength = check.value;
        break;
      case "max":
        if (field.type === "number") config.max = check.value;
        else config.maxLength = check.value;
        break;
    }
  }
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Generate default form values from a schema
 */
export function generateDefaultValues<T extends ZodRawShape>(
  schemaDef: SchemaDefinition<T>
): Record<string, unknown> {
  const fields = extractFields(schemaDef.schema);
  const defaults: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.defaultValue !== undefined) {
      defaults[field.name] = field.defaultValue;
    } else if (field.type === "boolean") {
      defaults[field.name] = false;
    } else if (field.type === "array") {
      defaults[field.name] = [];
    }
  }

  return defaults;
}

// =============================================================================
// VALIDATION MESSAGES
// =============================================================================

/**
 * Get validation error messages for a field
 */
export function getFieldErrorMessages(field: ExtractedField): Record<string, string> {
  const messages = field.meta.errorMessages || {};

  // Default messages
  if (field.required && !messages.required) {
    messages.required = `${inferLabel(field)} is required`;
  }

  return messages;
}
