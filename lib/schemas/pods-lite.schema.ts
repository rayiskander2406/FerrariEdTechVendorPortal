/**
 * PoDS-Lite Schema Definition
 *
 * REFERENCE IMPLEMENTATION for schema-first architecture.
 *
 * This single file defines:
 * - The Zod validation schema
 * - Field metadata for form generation
 * - AI tool configuration
 * - Mock data hints
 *
 * From this, we can generate:
 * - TypeScript types
 * - AI tool definition for submit_pods_lite
 * - Form field configurations
 * - Mock data factories
 * - Test fixtures
 */

import { z, defineSchema, withMeta, type InferSchemaType } from "./core";

// =============================================================================
// ENUMS (Aligned with existing PodsLiteForm.tsx)
// =============================================================================

/**
 * Data elements that can be requested (aligned with lib/types/index.ts)
 */
export const DataElementEnum = z.enum([
  "STUDENT_ID",
  "FIRST_NAME",
  "LAST_NAME",
  "EMAIL",
  "GRADE_LEVEL",
  "SCHOOL_ID",
  "CLASS_ROSTER",
  "TEACHER_ID",
  "PHONE",
  "ADDRESS",
  "DEMOGRAPHICS",
  "SPECIAL_ED",
  "ATTENDANCE",
  "GRADES",
]);

/**
 * Integration methods (matches INTEGRATION_METHODS in form)
 */
export const IntegrationMethodEnum = z.enum([
  "ONEROSTER_API",
  "LTI_1_3",
  "SSO_SAML",
  "SSO_OIDC",
  "SFTP",
  "MANUAL_UPLOAD",
]);

// =============================================================================
// PODS-LITE SCHEMA DEFINITION
// =============================================================================

export const PodsLiteSchema = defineSchema({
  id: "pods-lite",
  name: "PoDS-Lite Application",
  description: "Streamlined 13-question privacy application for Privacy-Safe data access",
  version: "1.0.0",

  // ---------------------------------------------------------------------------
  // THE SCHEMA
  // ---------------------------------------------------------------------------
  schema: z.object({
    // === Company Information ===
    vendorName: withMeta(
      z.string().min(2, "Company name must be at least 2 characters"),
      {
        label: "Company Name",
        placeholder: "Enter your company name",
        section: "company",
        sectionOrder: 1,
        fieldOrder: 1,
        aiDescription: "The legal name of the EdTech company applying for data access",
        mockExamples: ["EduTech Solutions", "LearnSmart Inc", "MathGenius"],
      }
    ),

    applicationName: withMeta(
      z.string().min(2, "Product name is required"),
      {
        label: "Product Name",
        placeholder: "Enter your product/application name",
        section: "company",
        fieldOrder: 2,
        aiDescription: "The name of the specific product or application being integrated",
      }
    ),

    applicationDescription: withMeta(
      z.string().min(10, "Please provide a description of at least 10 characters"),
      {
        label: "Product Description",
        placeholder: "Describe what your product does and how it helps students...",
        fieldType: "textarea",
        section: "company",
        fieldOrder: 3,
        aiDescription: "A description of the product's educational purpose and benefits",
      }
    ),

    // === Contact Information ===
    contactName: withMeta(
      z.string().min(2, "Contact name is required"),
      {
        label: "Full Name",
        placeholder: "Enter your full name",
        section: "contact",
        sectionOrder: 2,
        fieldOrder: 1,
        aiDescription: "Full name of the primary contact person for this application",
      }
    ),

    contactEmail: withMeta(
      z.string().email("Please enter a valid email address"),
      {
        label: "Email",
        placeholder: "you@company.com",
        fieldType: "email",
        section: "contact",
        fieldOrder: 2,
        aiDescription: "Primary contact email for application status updates",
      }
    ),

    contactPhone: withMeta(
      z.string().optional(),
      {
        label: "Phone Number",
        placeholder: "(555) 123-4567",
        fieldType: "tel",
        section: "contact",
        fieldOrder: 3,
        aiDescription: "Optional phone number for urgent communications",
      }
    ),

    // === Verification ===
    websiteUrl: withMeta(
      z.string().url("Please enter a valid URL"),
      {
        label: "Company Website",
        placeholder: "https://www.yourcompany.com",
        fieldType: "url",
        section: "verification",
        sectionOrder: 3,
        fieldOrder: 1,
        helpText: "Used to verify your company identity",
        aiDescription: "Company website URL for identity verification",
      }
    ),

    linkedInUrl: withMeta(
      z.string().url("Please enter a valid LinkedIn URL").optional(),
      {
        label: "LinkedIn Company Page",
        placeholder: "https://www.linkedin.com/company/yourcompany",
        fieldType: "url",
        section: "verification",
        fieldOrder: 2,
        helpText: "Optional, but helps verify your company",
        aiDescription: "LinkedIn company page for additional verification",
      }
    ),

    // === Address (field names match existing form) ===
    street: withMeta(
      z.string().min(5, "Street address is required"),
      {
        label: "Street Address",
        placeholder: "123 Main Street",
        section: "address",
        sectionOrder: 4,
        fieldOrder: 1,
      }
    ),

    suite: withMeta(
      z.string().optional(),
      {
        label: "Suite/Unit",
        placeholder: "Suite 100",
        section: "address",
        fieldOrder: 2,
      }
    ),

    city: withMeta(
      z.string().min(2, "City is required"),
      {
        label: "City",
        placeholder: "Los Angeles",
        section: "address",
        fieldOrder: 3,
      }
    ),

    state: withMeta(
      z.string().min(2, "State is required"),
      {
        label: "State",
        placeholder: "CA",
        fieldType: "select",
        section: "address",
        fieldOrder: 4,
      }
    ),

    zipCode: withMeta(
      z.string().regex(/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code"),
      {
        label: "ZIP Code",
        placeholder: "90001",
        section: "address",
        fieldOrder: 5,
      }
    ),

    // === Integration (field names match existing form) ===
    integrationMethod: withMeta(
      IntegrationMethodEnum,
      {
        label: "Integration Method",
        helpText: "Select your primary integration method",
        fieldType: "select",
        section: "integration",
        sectionOrder: 5,
        fieldOrder: 1,
        aiDescription: "The primary technical integration method the vendor requires",
      }
    ),

    dataElementsRequested: withMeta(
      z.array(DataElementEnum).min(1, "Select at least one data element"),
      {
        label: "Data Elements Requested",
        helpText: "Select the data elements your application needs access to",
        fieldType: "multiselect",
        section: "integration",
        fieldOrder: 2,
        aiDescription: "Which data elements (users, classes, etc.) are needed",
      }
    ),

    // === Third Party Sharing ===
    thirdPartySharing: withMeta(
      z.boolean(),
      {
        label: "Third Party Sharing",
        helpText: "Will you share LAUSD data with any third parties?",
        fieldType: "checkbox",
        section: "integration",
        fieldOrder: 3,
      }
    ),

    thirdPartyDetails: withMeta(
      z.string().optional(),
      {
        label: "Third Party Details",
        placeholder: "If yes, describe which third parties and why...",
        fieldType: "textarea",
        section: "integration",
        fieldOrder: 4,
        showWhen: {
          field: "thirdPartySharing",
          equals: true,
        },
      }
    ),

    // === Data Usage ===
    dataPurpose: withMeta(
      z.string().min(10, "Please describe how you will use the data"),
      {
        label: "Data Usage Purpose",
        placeholder: "Describe how student data will be used to improve learning outcomes...",
        fieldType: "textarea",
        section: "data",
        sectionOrder: 6,
        fieldOrder: 1,
        aiDescription: "Educational purpose for the requested data access",
      }
    ),

    // === Security & Compliance ===
    expectedStudentCount: withMeta(
      z.number().int().min(1).optional(),
      {
        label: "Expected Student Count",
        placeholder: "Estimated number of students",
        fieldType: "number",
        section: "security",
        sectionOrder: 7,
        fieldOrder: 1,
      }
    ),

    dataRetentionDays: withMeta(
      z.number().int().min(1).max(365),
      {
        label: "Data Retention (days)",
        placeholder: "30-365 days",
        fieldType: "number",
        helpText: "How long will student data be retained?",
        section: "security",
        fieldOrder: 2,
        aiDescription: "Number of days data will be retained before deletion",
        mockExamples: [30, 60, 90, 180],
      }
    ),

    hasSOC2: withMeta(
      z.boolean(),
      {
        label: "SOC 2 Type II",
        helpText: "Do you have SOC 2 Type II certification?",
        fieldType: "checkbox",
        section: "security",
        fieldOrder: 3,
      }
    ),

    hasFERPACertification: withMeta(
      z.boolean(),
      {
        label: "FERPA Certification",
        fieldType: "checkbox",
        section: "security",
        fieldOrder: 4,
      }
    ),

    encryptsDataAtRest: withMeta(
      z.boolean(),
      {
        label: "Encrypts data at rest",
        fieldType: "checkbox",
        section: "security",
        fieldOrder: 5,
      }
    ),

    encryptsDataInTransit: withMeta(
      z.boolean(),
      {
        label: "Encrypts data in transit",
        fieldType: "checkbox",
        section: "security",
        fieldOrder: 6,
      }
    ),

    breachNotificationHours: withMeta(
      z.number().int().min(1).max(72),
      {
        label: "Breach Notification (hours)",
        placeholder: "24",
        helpText: "How quickly will you notify LAUSD of a data breach?",
        fieldType: "number",
        section: "security",
        fieldOrder: 7,
        mockExamples: [24, 48, 72],
      }
    ),

    // === Compliance Acknowledgments ===
    coppaCompliant: withMeta(
      z.boolean().refine((val) => val === true, {
        message: "COPPA compliance is required for K-12 applications",
      }),
      {
        label: "COPPA Compliance",
        helpText: "I certify that our application complies with COPPA",
        fieldType: "checkbox",
        section: "compliance",
        sectionOrder: 8,
        fieldOrder: 1,
        aiDescription: "Vendor certifies COPPA compliance",
      }
    ),

    acceptsDataDeletion: withMeta(
      z.boolean().refine((val) => val === true, {
        message: "You must agree to delete data upon request",
      }),
      {
        label: "Data Deletion Agreement",
        helpText: "I agree to delete all LAUSD data within 30 days of termination",
        fieldType: "checkbox",
        section: "compliance",
        fieldOrder: 2,
      }
    ),

    acceptsTerms: withMeta(
      z.boolean().refine((val) => val === true, {
        message: "You must accept the terms",
      }),
      {
        label: "Terms & Conditions",
        helpText: "I have read and agree to the LAUSD Privacy Policy",
        fieldType: "checkbox",
        section: "compliance",
        fieldOrder: 3,
      }
    ),
  }),

  // ---------------------------------------------------------------------------
  // SECTIONS
  // ---------------------------------------------------------------------------
  sections: [
    {
      id: "company",
      title: "Company Information",
      icon: "building",
      order: 1,
    },
    {
      id: "contact",
      title: "Primary Contact",
      icon: "user",
      order: 2,
    },
    {
      id: "verification",
      title: "Company Verification",
      description: "Help us verify your company with your website and LinkedIn presence",
      icon: "shield-check",
      order: 3,
    },
    {
      id: "address",
      title: "Business Address",
      icon: "map-pin",
      order: 4,
    },
    {
      id: "integration",
      title: "Integration Types",
      description: "Select all integration methods your application needs",
      icon: "plug",
      order: 5,
    },
    {
      id: "data",
      title: "Data Usage",
      icon: "database",
      order: 6,
    },
    {
      id: "security",
      title: "Security & Compliance",
      icon: "lock",
      order: 7,
    },
    {
      id: "compliance",
      title: "Compliance Acknowledgments",
      icon: "check-circle",
      order: 8,
    },
  ],

  // ---------------------------------------------------------------------------
  // AI TOOL CONFIGURATION
  // ---------------------------------------------------------------------------
  aiTool: {
    name: "submit_pods_lite",
    description: `Trigger the PoDS-Lite application form for Privacy-Safe data access.

PoDS-Lite is a streamlined 13-question privacy application that:
- Grants Privacy-Safe access (zero actual PII)
- Can be auto-approved in minutes
- Covers 80% of typical EdTech integration needs

Use this tool when:
- A new vendor wants to start the onboarding process
- A vendor confirms they only need tokenized data access
- Recommending the fastest path to approval

The form will be embedded in the chat interface for the vendor to complete.`,
    triggerForm: true,
  },

  // ---------------------------------------------------------------------------
  // FEATURES
  // ---------------------------------------------------------------------------
  features: {
    autosave: true,
    prefillFromContext: true,
    validationSummary: true,
  },
});

// =============================================================================
// TYPE EXPORT
// =============================================================================

export type PodsLiteInput = InferSchemaType<typeof PodsLiteSchema>;

// =============================================================================
// USAGE EXAMPLES (for documentation)
// =============================================================================

/*
// Generate AI tool definition:
import { generateAITool } from "./generators/ai-tool";
const submitPodsLiteTool = generateAITool(PodsLiteSchema, {
  prefillFields: ["vendorName", "contactEmail"],
});

// Generate form configuration:
import { generateFormConfig } from "./generators/form-fields";
const formConfig = generateFormConfig(PodsLiteSchema);

// Generate mock data:
import { createMockFactory } from "./generators/mock-factory";
const podsLiteFactory = createMockFactory(PodsLiteSchema);
const mockApplication = podsLiteFactory.create();

// Validate data:
import { validateSchema } from "./core";
const result = validateSchema(PodsLiteSchema.schema, formData);
*/
