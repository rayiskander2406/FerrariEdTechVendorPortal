/**
 * Mock Data Factory Generator
 *
 * Generates realistic mock/test data from Zod schemas.
 * Powers demo data, test fixtures, and storybook.
 */

import { type ZodRawShape } from "zod";
import { type SchemaDefinition, extractFields } from "../core";

// =============================================================================
// SEEDED RANDOM
// =============================================================================

/**
 * Simple seeded random number generator for deterministic mocks
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(array: T[]): T {
    // Index is always valid since we use length - 1 as max
    return array[this.nextInt(0, array.length - 1)]!;
  }
}

// =============================================================================
// DATA POOLS
// =============================================================================

const COMPANY_NAMES = [
  "EduTech Solutions",
  "LearnSmart Inc",
  "SchoolBright",
  "MathGenius",
  "ReadingRocket",
  "ScienceExplorer",
  "CodeKids Academy",
  "TeacherTools Pro",
  "StudentSuccess",
  "ClassroomCloud",
];

const FIRST_NAMES = [
  "James", "Maria", "David", "Jennifer", "Michael",
  "Sarah", "Robert", "Emily", "William", "Jessica",
];

const LAST_NAMES = [
  "Johnson", "Williams", "Brown", "Jones", "Garcia",
  "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez",
];

// Reserved for future schema types
// const DEPARTMENTS = ["Engineering", "Product", "Sales", "Marketing", "Support"];

const DOMAINS = ["edutech.io", "learnsmart.com", "schoolbright.org", "edtools.co"];

// Reserved for future schema types
// const SUBJECTS = ["Mathematics", "Reading", "Science", "History", "Art", "Music", "PE"];

// =============================================================================
// MOCK GENERATORS
// =============================================================================

export interface MockOptions {
  seed?: number;
  partial?: boolean;  // Only generate required fields
  override?: Record<string, unknown>;  // Override specific fields
}

/**
 * Generate mock data for a schema
 */
export function generateMock<T extends ZodRawShape>(
  schemaDef: SchemaDefinition<T>,
  options: MockOptions = {}
): Record<string, unknown> {
  const random = new SeededRandom(options.seed ?? Date.now());
  const fields = extractFields(schemaDef.schema);
  const result: Record<string, unknown> = {};

  for (const field of fields) {
    // Skip optional fields if partial mode
    if (options.partial && !field.required) {
      continue;
    }

    // Use override if provided
    if (options.override && field.name in options.override) {
      result[field.name] = options.override[field.name];
      continue;
    }

    // Use custom mock generator if provided in meta
    if (field.meta.mockGenerator) {
      result[field.name] = field.meta.mockGenerator();
      continue;
    }

    // Use mock examples if provided
    if (field.meta.mockExamples && field.meta.mockExamples.length > 0) {
      result[field.name] = random.pick(field.meta.mockExamples);
      continue;
    }

    // Generate based on type and field name
    result[field.name] = generateFieldValue(field, random);
  }

  return result;
}

/**
 * Generate a mock value for a single field
 */
function generateFieldValue(
  field: ReturnType<typeof extractFields>[0],
  random: SeededRandom
): unknown {
  const nameLower = field.name.toLowerCase();

  // Type-specific generation
  switch (field.type) {
    case "boolean":
      // Check common patterns - always return true for acceptance/agreement/compliance fields
      if (
        nameLower.includes("accept") ||
        nameLower.includes("agree") ||
        nameLower.includes("compliant") ||
        nameLower.includes("coppa") ||
        nameLower.includes("terms") ||
        nameLower.includes("deletion")
      ) {
        return true;
      }
      // For "has" fields, return true to show they have certifications
      if (nameLower.includes("has") || nameLower.includes("encrypts")) {
        return true;
      }
      return random.next() > 0.5;

    case "number":
      return generateNumberValue(field, random);

    case "enum":
      if (field.enumValues && field.enumValues.length > 0) {
        return random.pick(field.enumValues);
      }
      return "";

    case "array":
      if (field.enumValues) {
        // Select 2-3 random enum values
        const count = random.nextInt(2, Math.min(3, field.enumValues.length));
        const selected: string[] = [];
        const available = [...field.enumValues];
        for (let i = 0; i < count && available.length > 0; i++) {
          const idx = random.nextInt(0, available.length - 1);
          // Index is always valid since we check available.length > 0
          selected.push(available[idx]!);
          available.splice(idx, 1);
        }
        return selected;
      }
      return [];

    case "string":
    default:
      return generateStringValue(field, random);
  }
}

/**
 * Generate a string value based on field name patterns
 */
function generateStringValue(
  field: ReturnType<typeof extractFields>[0],
  random: SeededRandom
): string {
  const nameLower = field.name.toLowerCase();
  const firstName = random.pick(FIRST_NAMES);
  const lastName = random.pick(LAST_NAMES);
  const company = random.pick(COMPANY_NAMES);
  const domain = random.pick(DOMAINS);

  // Email patterns
  if (nameLower.includes("email")) {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
  }

  // Name patterns
  if (nameLower.includes("vendorname") || nameLower.includes("companyname")) {
    return company;
  }
  if (nameLower.includes("contactname") || nameLower.includes("fullname")) {
    return `${firstName} ${lastName}`;
  }
  if (nameLower.includes("firstname")) {
    return firstName;
  }
  if (nameLower.includes("lastname")) {
    return lastName;
  }

  // URL patterns
  if (nameLower.includes("website") || nameLower.includes("url")) {
    return `https://www.${domain}`;
  }
  if (nameLower.includes("linkedin")) {
    return `https://www.linkedin.com/company/${company.toLowerCase().replace(/\s+/g, "-")}`;
  }

  // Phone patterns
  if (nameLower.includes("phone") || nameLower.includes("tel")) {
    return `(${random.nextInt(200, 999)}) ${random.nextInt(100, 999)}-${random.nextInt(1000, 9999)}`;
  }

  // Description patterns
  if (nameLower.includes("description") || nameLower.includes("purpose")) {
    return `${company} helps LAUSD students improve their learning outcomes through personalized instruction and real-time progress tracking.`;
  }

  // Application name
  if (nameLower.includes("applicationname") || nameLower.includes("appname")) {
    return `${company} Student Portal`;
  }

  // Address patterns
  if (nameLower.includes("street") || nameLower.includes("address")) {
    return `${random.nextInt(100, 9999)} ${random.pick(["Main", "Oak", "Pine", "Maple"])} Street`;
  }
  if (nameLower.includes("city")) {
    return random.pick(["Los Angeles", "Pasadena", "Long Beach", "Santa Monica"]);
  }
  if (nameLower.includes("state")) {
    return "CA";
  }
  if (nameLower.includes("zip")) {
    return `${random.nextInt(90001, 90899)}`;
  }

  // Default: lorem ipsum style
  return `Sample ${field.name.replace(/([A-Z])/g, " $1").trim()}`;
}

/**
 * Generate a number value based on field name patterns
 */
function generateNumberValue(
  field: ReturnType<typeof extractFields>[0],
  random: SeededRandom
): number {
  const nameLower = field.name.toLowerCase();

  if (nameLower.includes("retention") || nameLower.includes("days")) {
    return random.pick([30, 60, 90, 180, 365]);
  }

  if (nameLower.includes("notification") || nameLower.includes("hours")) {
    return random.pick([24, 48, 72]);
  }

  if (nameLower.includes("count") || nameLower.includes("students")) {
    return random.nextInt(100, 10000);
  }

  // Default range
  return random.nextInt(1, 100);
}

// =============================================================================
// FACTORY BUILDER
// =============================================================================

/**
 * Create a typed mock factory for a schema
 */
export function createMockFactory<T extends ZodRawShape>(
  schemaDef: SchemaDefinition<T>
) {
  return {
    /**
     * Generate a single mock instance
     */
    create: (options?: MockOptions): Record<string, unknown> => {
      return generateMock(schemaDef, options);
    },

    /**
     * Generate multiple mock instances
     */
    createMany: (count: number, options?: MockOptions): Record<string, unknown>[] => {
      const baseSeed = options?.seed ?? Date.now();
      return Array.from({ length: count }, (_, i) =>
        generateMock(schemaDef, { ...options, seed: baseSeed + i })
      );
    },

    /**
     * Generate a partial mock (only required fields)
     */
    createPartial: (override?: Record<string, unknown>): Record<string, unknown> => {
      return generateMock(schemaDef, { partial: true, override });
    },

    /**
     * Get schema definition reference
     */
    schema: schemaDef,
  };
}

// =============================================================================
// TEST FIXTURE HELPERS
// =============================================================================

/**
 * Generate test fixture with assertion helpers
 */
export function createTestFixture<T extends ZodRawShape>(
  schemaDef: SchemaDefinition<T>,
  options?: MockOptions
) {
  const data = generateMock(schemaDef, options);

  return {
    data,

    /**
     * Validate the fixture against the schema
     */
    validate: () => {
      return schemaDef.schema.safeParse(data);
    },

    /**
     * Create an invalid version (for testing validation)
     */
    invalidate: (field: string): Record<string, unknown> => {
      const invalid = { ...data };
      delete invalid[field];
      return invalid;
    },
  };
}
