/**
 * Schema-First Architecture
 *
 * SINGLE SOURCE OF TRUTH for all data structures.
 *
 * Usage:
 *
 * 1. DEFINE a schema:
 *    import { defineSchema, withMeta, z } from "@/lib/schemas";
 *    export const MySchema = defineSchema({ ... });
 *
 * 2. GENERATE from schema:
 *    - AI Tool:     generateAITool(MySchema)
 *    - Form Config: generateFormConfig(MySchema)
 *    - Mock Data:   createMockFactory(MySchema).create()
 *    - Validate:    validateSchema(MySchema.schema, data)
 *
 * 3. USE the type:
 *    type MyData = InferSchemaType<typeof MySchema>;
 */

// Core utilities
export {
  // Schema definition
  defineSchema,
  withMeta,
  getMeta,
  z,

  // Extraction
  extractFields,
  validateSchema,

  // Types
  type FieldMeta,
  type SchemaSection,
  type SchemaDefinition,
  type InferSchemaType,
  type ExtractedField,
  type ValidationResult,
} from "./core";

// Generators
export {
  generateAITool,
  validateToolInput,
  generateInputTypeName,
  type AIToolConfig,
} from "./generators/ai-tool";

export {
  generateFormConfig,
  generateDefaultValues,
  getFieldErrorMessages,
  type FormFieldConfig,
  type FormFieldType,
  type FormSectionConfig,
  type FormConfig,
} from "./generators/form-fields";

export {
  generateMock,
  createMockFactory,
  createTestFixture,
  type MockOptions,
} from "./generators/mock-factory";

// Shadow mode (safe migration utilities)
export {
  compareFormConfigs,
  verifyFormConfig,
  createShadowFormConfig,
  SHADOW_MODE_ENABLED,
  type FieldComparisonResult,
  type SectionComparisonResult,
  type FormComparisonResult,
} from "./shadow-mode";

// Schema definitions
export { PodsLiteSchema, type PodsLiteInput } from "./pods-lite.schema";
