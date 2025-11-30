/**
 * Schema-First Architecture Core
 *
 * This module provides the foundation for deriving everything from Zod schemas:
 * - TypeScript types
 * - AI tool definitions
 * - Form field configurations
 * - Mock data factories
 * - API validation
 * - Test fixtures
 *
 * SINGLE SOURCE OF TRUTH: Define once, derive everywhere.
 */

import { z, type ZodTypeAny, type ZodObject, type ZodRawShape } from "zod";

// =============================================================================
// FIELD METADATA
// =============================================================================

/**
 * Extended metadata that can be attached to any Zod schema field.
 * This drives form generation, AI tool descriptions, and documentation.
 */
export interface FieldMeta {
  // Display
  label?: string;
  placeholder?: string;
  helpText?: string;

  // Form rendering
  fieldType?:
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

  // Grouping
  section?: string;
  sectionOrder?: number;
  fieldOrder?: number;

  // Conditional display
  showWhen?: {
    field: string;
    equals?: unknown;
    notEquals?: unknown;
    in?: unknown[];
  };

  // AI tool integration
  aiDescription?: string;  // More detailed than label, for AI understanding
  aiExample?: unknown;     // Example value for AI context

  // Validation display
  errorMessages?: Record<string, string>;

  // Mock data generation
  mockGenerator?: () => unknown;
  mockExamples?: unknown[];
}

// =============================================================================
// SCHEMA EXTENSION
// =============================================================================

/**
 * Symbol key for storing field metadata on Zod schemas
 */
const FIELD_META_KEY = Symbol("fieldMeta");

/**
 * Extend a Zod schema with field metadata
 */
export function withMeta<T extends ZodTypeAny>(
  schema: T,
  meta: FieldMeta
): T {
  (schema as unknown as Record<symbol, FieldMeta>)[FIELD_META_KEY] = meta;
  return schema;
}

/**
 * Get field metadata from a Zod schema
 */
export function getMeta(schema: ZodTypeAny): FieldMeta | undefined {
  return (schema as unknown as Record<symbol, FieldMeta>)[FIELD_META_KEY];
}

// =============================================================================
// SCHEMA DEFINITION HELPERS
// =============================================================================

/**
 * Define a form section with its fields
 */
export interface SchemaSection {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  order: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

/**
 * Schema definition with sections and configuration
 */
export interface SchemaDefinition<T extends ZodRawShape> {
  id: string;
  name: string;
  description: string;
  version: string;

  // The actual Zod schema
  schema: ZodObject<T>;

  // Form sections
  sections: SchemaSection[];

  // AI tool configuration
  aiTool?: {
    name: string;
    description: string;
    triggerForm?: boolean;
  };

  // Feature flags
  features?: {
    autosave?: boolean;
    prefillFromContext?: boolean;
    validationSummary?: boolean;
  };
}

/**
 * Create a complete schema definition
 */
export function defineSchema<T extends ZodRawShape>(
  config: SchemaDefinition<T>
): SchemaDefinition<T> {
  return config;
}

// =============================================================================
// TYPE INFERENCE
// =============================================================================

/**
 * Infer TypeScript type from schema definition
 */
export type InferSchemaType<T extends SchemaDefinition<ZodRawShape>> =
  z.infer<T["schema"]>;

// =============================================================================
// FIELD EXTRACTION
// =============================================================================

/**
 * Extracted field information for form generation
 */
export interface ExtractedField {
  name: string;
  type: string;
  required: boolean;
  meta: FieldMeta;
  zodSchema: ZodTypeAny;
  defaultValue?: unknown;
  enumValues?: string[];
}

/**
 * Extract field information from a Zod object schema
 */
export function extractFields(schema: ZodObject<ZodRawShape>): ExtractedField[] {
  const shape = schema.shape;
  const fields: ExtractedField[] = [];

  for (const [name, fieldSchema] of Object.entries(shape)) {
    const zodSchema = fieldSchema as ZodTypeAny;
    const meta = getMeta(zodSchema) || {};

    fields.push({
      name,
      type: getZodTypeName(zodSchema),
      required: !zodSchema.isOptional(),
      meta,
      zodSchema,
      defaultValue: getDefaultValue(zodSchema),
      enumValues: getEnumValues(zodSchema),
    });
  }

  // Sort by section order, then field order
  return fields.sort((a, b) => {
    const sectionDiff = (a.meta.sectionOrder ?? 999) - (b.meta.sectionOrder ?? 999);
    if (sectionDiff !== 0) return sectionDiff;
    return (a.meta.fieldOrder ?? 999) - (b.meta.fieldOrder ?? 999);
  });
}

// =============================================================================
// ZOD TYPE UTILITIES
// =============================================================================

/**
 * Get the base type name from a Zod schema
 */
function getZodTypeName(schema: ZodTypeAny): string {
  // Use constructor.name for Zod v4.x compatibility
  const typeName = schema.constructor.name;

  // Unwrap optional/nullable
  if (typeName === "ZodOptional" || typeName === "ZodNullable") {
    const innerType = (schema as unknown as { _def: { innerType: ZodTypeAny } })._def.innerType;
    if (innerType) return getZodTypeName(innerType);
  }

  // Unwrap effects (refinements)
  if (typeName === "ZodEffects" || typeName === "ZodPipeline") {
    const innerSchema = (schema as unknown as { _def: { schema?: ZodTypeAny; in?: ZodTypeAny } })._def;
    if (innerSchema.schema) return getZodTypeName(innerSchema.schema);
    if (innerSchema.in) return getZodTypeName(innerSchema.in);
  }

  // Map to simple names
  const typeMap: Record<string, string> = {
    ZodString: "string",
    ZodNumber: "number",
    ZodBoolean: "boolean",
    ZodArray: "array",
    ZodEnum: "enum",
    ZodObject: "object",
    ZodDate: "date",
  };

  return typeMap[typeName] || typeName;
}

/**
 * Get default value from a Zod schema
 */
function getDefaultValue(schema: ZodTypeAny): unknown {
  const def = schema._def as { typeName?: string; defaultValue?: () => unknown };
  if (def.typeName === "ZodDefault" && def.defaultValue) {
    return def.defaultValue();
  }
  return undefined;
}

/**
 * Get enum values from a Zod enum schema
 */
function getEnumValues(schema: ZodTypeAny): string[] | undefined {
  let current = schema;

  // Unwrap optional/nullable/effects/default using constructor.name
  while (true) {
    const typeName = current.constructor.name;
    if (typeName === "ZodOptional" || typeName === "ZodNullable" || typeName === "ZodDefault") {
      const inner = (current as unknown as { _def: { innerType?: ZodTypeAny } })._def.innerType;
      if (inner) { current = inner; continue; }
    }
    if (typeName === "ZodEffects" || typeName === "ZodPipeline") {
      const def = (current as unknown as { _def: { schema?: ZodTypeAny; in?: ZodTypeAny } })._def;
      if (def.schema) { current = def.schema; continue; }
      if (def.in) { current = def.in; continue; }
    }
    break;
  }

  const typeName = current.constructor.name;

  // Check if it's an array with enum items
  if (typeName === "ZodArray") {
    // Zod v4.x uses _def.element instead of _def.type
    const def = current._def as unknown as { element?: ZodTypeAny; type?: ZodTypeAny };
    const itemType = def.element || def.type;
    if (itemType?.constructor.name === "ZodEnum") {
      // Zod v4.x uses options property instead of _def.values
      const enumSchema = itemType as unknown as { options?: string[]; _def?: { values?: string[] } };
      return enumSchema.options || enumSchema._def?.values;
    }
  }

  if (typeName === "ZodEnum") {
    // Zod v4.x uses options property instead of _def.values
    const enumSchema = current as unknown as { options?: string[]; _def?: { values?: string[] } };
    return enumSchema.options || enumSchema._def?.values;
  }

  return undefined;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate data against a schema and return formatted errors
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
  fieldErrors?: Array<{ field: string; message: string }>;
}

export function validateSchema<T extends ZodRawShape>(
  schema: ZodObject<T>,
  data: unknown
): ValidationResult<z.infer<ZodObject<T>>> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string[]> = {};
  const fieldErrors: Array<{ field: string; message: string }> = [];

  for (const issue of result.error.issues) {
    const field = issue.path.join(".");
    if (!errors[field]) {
      errors[field] = [];
    }
    errors[field].push(issue.message);
    fieldErrors.push({ field, message: issue.message });
  }

  return { success: false, errors, fieldErrors };
}

// =============================================================================
// EXPORTS
// =============================================================================

export { z };
