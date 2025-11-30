/**
 * AI Tool Generator
 *
 * Generates Anthropic-compatible tool definitions from Zod schemas.
 * Eliminates duplication between schemas and AI tool input_schema.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { type ZodTypeAny, type ZodObject, type ZodRawShape } from "zod";
import { getMeta, type SchemaDefinition, extractFields } from "../core";

// =============================================================================
// TYPES
// =============================================================================

export interface AIToolConfig {
  name: string;
  description: string;
  triggerFormKey?: string;  // If set, adds a trigger_form parameter
  prefillFields?: string[]; // Fields that can be prefilled from context
}

// =============================================================================
// SCHEMA TO JSON SCHEMA CONVERSION
// =============================================================================

/**
 * Convert a Zod schema to JSON Schema format for Anthropic tools
 */
function zodToJsonSchema(schema: ZodTypeAny): Record<string, unknown> {
  // Use constructor.name for Zod v4.x compatibility
  const typeName = schema.constructor.name;

  // Unwrap optional
  if (typeName === "ZodOptional") {
    const inner = (schema as unknown as { _def: { innerType: ZodTypeAny } })._def.innerType;
    return zodToJsonSchema(inner);
  }

  // Unwrap nullable
  if (typeName === "ZodNullable") {
    const inner = (schema as unknown as { _def: { innerType: ZodTypeAny } })._def.innerType;
    return zodToJsonSchema(inner);
  }

  // Unwrap effects (refinements)
  if (typeName === "ZodEffects" || typeName === "ZodPipeline") {
    const def = (schema as unknown as { _def: { schema?: ZodTypeAny; in?: ZodTypeAny } })._def;
    if (def.schema) return zodToJsonSchema(def.schema);
    if (def.in) return zodToJsonSchema(def.in);
  }

  // Unwrap default
  if (typeName === "ZodDefault") {
    const inner = (schema as unknown as { _def: { innerType: ZodTypeAny } })._def.innerType;
    return zodToJsonSchema(inner);
  }

  const meta = getMeta(schema);

  switch (typeName) {
    case "ZodString": {
      const result: Record<string, unknown> = { type: "string" };
      if (meta?.aiDescription) result.description = meta.aiDescription;
      else if (schema.description) result.description = schema.description;

      // Check for string validators using _def.checks
      const def = schema._def as { checks?: Array<{ kind: string; value?: number }> };
      const checks = def.checks || [];
      for (const check of checks) {
        if (check.kind === "email") result.format = "email";
        if (check.kind === "url") result.format = "uri";
        if (check.kind === "min") result.minLength = check.value;
        if (check.kind === "max") result.maxLength = check.value;
      }

      return result;
    }

    case "ZodNumber": {
      const result: Record<string, unknown> = { type: "number" };
      if (meta?.aiDescription) result.description = meta.aiDescription;

      const def = schema._def as { checks?: Array<{ kind: string; value?: number }> };
      const checks = def.checks || [];
      for (const check of checks) {
        if (check.kind === "int") result.type = "integer";
        if (check.kind === "min") result.minimum = check.value;
        if (check.kind === "max") result.maximum = check.value;
      }

      return result;
    }

    case "ZodBoolean":
      return {
        type: "boolean",
        ...(meta?.aiDescription && { description: meta.aiDescription }),
      };

    case "ZodEnum": {
      // Zod v4.x uses options property instead of _def.values
      const enumSchema = schema as unknown as { options?: string[]; _def?: { values?: string[] } };
      const values = enumSchema.options || enumSchema._def?.values || [];
      return {
        type: "string",
        enum: values,
        ...(meta?.aiDescription && { description: meta.aiDescription }),
      };
    }

    case "ZodArray": {
      // Zod v4.x uses _def.element instead of _def.type
      const arrayDef = schema._def as { element?: ZodTypeAny; type?: ZodTypeAny };
      const itemType = arrayDef.element || arrayDef.type;
      const itemSchema = itemType ? zodToJsonSchema(itemType) : { type: "string" };
      return {
        type: "array",
        items: itemSchema,
        ...(meta?.aiDescription && { description: meta.aiDescription }),
      };
    }

    case "ZodObject": {
      // Access shape directly from the schema object (Zod's getter)
      const shape = (schema as unknown as { shape: Record<string, ZodTypeAny> }).shape || {};

      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      for (const [key, fieldSchema] of Object.entries(shape)) {
        if (fieldSchema && typeof fieldSchema === "object") {
          properties[key] = zodToJsonSchema(fieldSchema as ZodTypeAny);

          // Check if required - optional schemas have isOptional method
          const zodField = fieldSchema as ZodTypeAny;
          if (typeof zodField.isOptional === "function" && !zodField.isOptional()) {
            required.push(key);
          }
        }
      }

      return {
        type: "object",
        properties,
        ...(required.length > 0 && { required }),
        ...(meta?.aiDescription && { description: meta.aiDescription }),
      };
    }

    case "ZodDate":
      return {
        type: "string",
        format: "date-time",
        ...(meta?.aiDescription && { description: meta.aiDescription }),
      };

    case "ZodRecord": {
      const recordDef = schema._def as { valueType: ZodTypeAny };
      return {
        type: "object",
        additionalProperties: zodToJsonSchema(recordDef.valueType),
        ...(meta?.aiDescription && { description: meta.aiDescription }),
      };
    }

    default:
      // Fallback for unknown types
      return { type: "string" };
  }
}

// =============================================================================
// AI TOOL GENERATOR
// =============================================================================

/**
 * Generate an Anthropic tool definition from a schema definition
 */
export function generateAITool<T extends ZodRawShape>(
  schemaDef: SchemaDefinition<T>,
  config?: Partial<AIToolConfig>
): Anthropic.Tool {
  const toolConfig = schemaDef.aiTool;
  if (!toolConfig && !config?.name) {
    throw new Error(`Schema ${schemaDef.id} has no aiTool config and no name provided`);
  }

  const name = config?.name || toolConfig!.name;
  const description = config?.description || toolConfig!.description;

  // Build the input schema from the object schema
  const jsonSchema = zodToJsonSchema(schemaDef.schema) as {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };

  // Ensure we have properties object
  const properties = jsonSchema.properties || {};
  const required = jsonSchema.required || [];

  // Add trigger_form if needed
  const resultProperties: Record<string, unknown> = {};
  if (toolConfig?.triggerForm || config?.triggerFormKey) {
    resultProperties.trigger_form = {
      type: "boolean",
      description: "Set to true to display the form in the chat interface",
    };
  }

  // Copy all existing properties
  for (const [key, value] of Object.entries(properties)) {
    resultProperties[key] = value;
  }

  // Add prefill_ properties
  const prefillFields = config?.prefillFields || [];
  for (const field of prefillFields) {
    const prefillKey = `prefill_${field}`;
    const originalProp = resultProperties[field] as Record<string, unknown>;
    if (originalProp) {
      resultProperties[prefillKey] = {
        ...originalProp,
        description: `Optional: Pre-fill the ${field} field if already known`,
      };
    }
  }

  // Build required array
  const resultRequired: string[] = [];
  if (toolConfig?.triggerForm || config?.triggerFormKey) {
    resultRequired.push("trigger_form");
  }
  resultRequired.push(...required);

  return {
    name,
    description,
    input_schema: {
      type: "object" as const,
      properties: resultProperties,
      ...(resultRequired.length > 0 && { required: resultRequired }),
    },
  };
}

/**
 * Generate input type interface from a schema (for TypeScript)
 */
export function generateInputTypeName<T extends ZodRawShape>(
  schemaDef: SchemaDefinition<T>
): string {
  const name = schemaDef.aiTool?.name || schemaDef.id;
  // Convert snake_case to PascalCase
  const pascalCase = name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return `${pascalCase}Input`;
}

// =============================================================================
// TOOL VALIDATION
// =============================================================================

/**
 * Validate AI tool input against the source schema
 */
export function validateToolInput<T extends ZodRawShape>(
  schemaDef: SchemaDefinition<T>,
  input: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  // Remove trigger_form and prefill_ keys before validation
  const cleanInput: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === "trigger_form") continue;
    if (key.startsWith("prefill_")) {
      // Map prefill back to actual field name
      const realKey = key.replace("prefill_", "");
      cleanInput[realKey] = value;
    } else {
      cleanInput[key] = value;
    }
  }

  const result = schemaDef.schema.safeParse(cleanInput);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    ),
  };
}
