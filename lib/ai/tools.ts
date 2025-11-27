/**
 * AI Tool Definitions for LAUSD Vendor Integration Assistant
 *
 * These tools follow the Anthropic tool schema format and enable
 * the AI to perform structured actions within the portal.
 */

import type Anthropic from "@anthropic-ai/sdk";

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  // -------------------------------------------------------------------------
  // 1. lookup_pods - Check existing PoDS application status
  // -------------------------------------------------------------------------
  {
    name: "lookup_pods",
    description: `Look up an existing Privacy of Data Statement (PoDS) application by vendor name, email, or application ID.

Use this tool when:
- A vendor asks about their existing PoDS status
- You need to verify if a vendor has already applied
- Checking approval status before provisioning credentials

Returns the PoDS application details including status, access tier, and expiration date if approved.`,
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "The vendor name, contact email, or PoDS application ID (e.g., 'PODS-2024-001') to search for",
        },
      },
      required: ["query"],
    },
  },

  // -------------------------------------------------------------------------
  // 2. submit_pods_lite - Trigger PoDS-Lite form
  // -------------------------------------------------------------------------
  {
    name: "submit_pods_lite",
    description: `Trigger the PoDS-Lite application form for TOKEN_ONLY data access.

PoDS-Lite is a streamlined 13-question privacy application that:
- Grants TOKEN_ONLY access (zero actual PII)
- Can be auto-approved in minutes
- Covers 80% of typical EdTech integration needs

Use this tool when:
- A new vendor wants to start the onboarding process
- A vendor confirms they only need tokenized data access
- Recommending the fastest path to approval

The form will be embedded in the chat interface for the vendor to complete.`,
    input_schema: {
      type: "object" as const,
      properties: {
        trigger_form: {
          type: "boolean",
          description:
            "Set to true to display the PoDS-Lite form in the chat interface",
        },
        prefill_vendor_name: {
          type: "string",
          description:
            "Optional: Pre-fill the vendor name field if already known",
        },
        prefill_email: {
          type: "string",
          description:
            "Optional: Pre-fill the contact email field if already known",
        },
      },
      required: ["trigger_form"],
    },
  },

  // -------------------------------------------------------------------------
  // 3. provision_sandbox - Generate API credentials
  // -------------------------------------------------------------------------
  {
    name: "provision_sandbox",
    description: `Provision sandbox API credentials for a vendor to access the OneRoster API.

Prerequisites:
- Vendor must have an APPROVED PoDS status
- Creates API key (sk_test_xxx) and secret
- Credentials valid for 90 days

Use this tool when:
- A vendor with approved PoDS needs API access
- Setting up OneRoster integration testing
- Vendor requests their API credentials

Returns the API key, secret, base URL, and expiration date. Credentials are shown securely once.`,
    input_schema: {
      type: "object" as const,
      properties: {
        vendor_id: {
          type: "string",
          description:
            "The UUID of the vendor to provision credentials for. Use the vendor ID from the current context or lookup_pods result.",
        },
      },
      required: ["vendor_id"],
    },
  },

  // -------------------------------------------------------------------------
  // 4. configure_sso - Configure SSO provider
  // -------------------------------------------------------------------------
  {
    name: "configure_sso",
    description: `Configure Single Sign-On (SSO) integration with one of LAUSD's supported identity providers.

Supported Providers:
- CLEVER: Primary SSO for K-8 applications
- CLASSLINK: Primary SSO for 6-12 applications
- GOOGLE: Google Workspace SSO for all grade levels

Use this tool when:
- A vendor needs to set up SSO
- Configuring OAuth redirect URIs
- Troubleshooting SSO connection issues

Can either trigger the configuration form or update settings directly if credentials are provided.`,
    input_schema: {
      type: "object" as const,
      properties: {
        provider: {
          type: "string",
          enum: ["CLEVER", "CLASSLINK", "GOOGLE"],
          description: "The SSO provider to configure",
        },
        trigger_form: {
          type: "boolean",
          description:
            "Set to true to display the SSO configuration form. Set to false if providing credentials directly.",
        },
        client_id: {
          type: "string",
          description:
            "Optional: The OAuth client ID from the SSO provider. Required if trigger_form is false.",
        },
        client_secret: {
          type: "string",
          description:
            "Optional: The OAuth client secret from the SSO provider. Required if trigger_form is false.",
        },
        redirect_uri: {
          type: "string",
          description:
            "Optional: The OAuth redirect URI where users return after authentication.",
        },
      },
      required: ["provider"],
    },
  },

  // -------------------------------------------------------------------------
  // 5. test_oneroster - Execute test API call
  // -------------------------------------------------------------------------
  {
    name: "test_oneroster",
    description: `Execute a test API call against the OneRoster sandbox environment.

Available Endpoints:
- /users: List students and teachers (tokenized)
- /orgs: List schools and the district
- /classes: List class sections
- /enrollments: List class enrollments
- /courses: List available courses

Use this tool when:
- Vendor wants to test their API integration
- Demonstrating the data format
- Verifying credentials are working
- Showing tokenized data examples

Returns sample data in OneRoster format with tokenized PII.`,
    input_schema: {
      type: "object" as const,
      properties: {
        endpoint: {
          type: "string",
          enum: ["/users", "/orgs", "/classes", "/enrollments", "/courses"],
          description: "The OneRoster API endpoint to call",
        },
        filters: {
          type: "object",
          description:
            "Optional filters to apply to the request (e.g., { schoolId: 'TKN_SCH_xxx', role: 'student' })",
          properties: {
            schoolId: {
              type: "string",
              description: "Filter by school token",
            },
            role: {
              type: "string",
              enum: ["student", "teacher"],
              description: "Filter users by role",
            },
            grade: {
              type: "number",
              description: "Filter by grade level (0 for Kindergarten)",
            },
            classId: {
              type: "string",
              description: "Filter enrollments by class token",
            },
            userId: {
              type: "string",
              description: "Filter enrollments by user token",
            },
          },
        },
        limit: {
          type: "number",
          description:
            "Maximum number of records to return (default: 10, max: 100)",
        },
      },
      required: ["endpoint"],
    },
  },

  // -------------------------------------------------------------------------
  // 6. configure_lti - Configure LTI 1.3
  // -------------------------------------------------------------------------
  {
    name: "configure_lti",
    description: `Configure LTI 1.3 (Learning Tools Interoperability) integration for embedding in Schoology LMS.

LTI 1.3 enables:
- Deep linking into the vendor's application from Schoology
- Grade passback from vendor app to Schoology gradebook
- Roster synchronization via LTI Advantage

Use this tool when:
- Vendor wants their app embedded in Schoology
- Setting up grade passback integration
- Configuring LTI launch endpoints

Triggers the LTI configuration form for entering platform credentials.`,
    input_schema: {
      type: "object" as const,
      properties: {
        trigger_form: {
          type: "boolean",
          description:
            "Set to true to display the LTI 1.3 configuration form",
        },
        client_id: {
          type: "string",
          description:
            "Optional: The LTI client ID assigned by the vendor platform",
        },
        deployment_id: {
          type: "string",
          description: "Optional: The deployment ID for this LTI integration",
        },
        jwks_url: {
          type: "string",
          description:
            "Optional: The vendor's JSON Web Key Set URL for signature verification",
        },
        auth_url: {
          type: "string",
          description: "Optional: The vendor's OIDC authorization endpoint",
        },
        token_url: {
          type: "string",
          description: "Optional: The vendor's OAuth token endpoint",
        },
        launch_url: {
          type: "string",
          description: "Optional: The vendor's LTI launch URL",
        },
      },
      required: ["trigger_form"],
    },
  },

  // -------------------------------------------------------------------------
  // 7. send_test_message - Test communication gateway
  // -------------------------------------------------------------------------
  {
    name: "send_test_message",
    description: `Send a test message through LAUSD's communication gateway.

Channels:
- EMAIL: Sends to tokenized email addresses (routed through relay servers)
- SMS: Sends to tokenized phone numbers (routed through LAUSD gateway)

Use this tool when:
- Testing the communication integration
- Demonstrating how tokenized messaging works
- Verifying message delivery

Note: Messages to tokenized addresses are routed through LAUSD's relay servers to the actual recipients.`,
    input_schema: {
      type: "object" as const,
      properties: {
        channel: {
          type: "string",
          enum: ["EMAIL", "SMS"],
          description: "The communication channel to use",
        },
        recipient_token: {
          type: "string",
          description:
            "The tokenized recipient identifier (e.g., TKN_STU_xxx for email, TKN_555_XXX_xxxx for SMS)",
        },
        subject: {
          type: "string",
          description: "Email subject line (required for EMAIL channel)",
        },
        body: {
          type: "string",
          description: "The message content to send",
        },
      },
      required: ["channel", "recipient_token", "body"],
    },
  },

  // -------------------------------------------------------------------------
  // 8. submit_app - Submit for freemium whitelist
  // -------------------------------------------------------------------------
  {
    name: "submit_app",
    description: `Submit an application for LAUSD's freemium app whitelist consideration.

The freemium whitelist allows:
- Free apps to be promoted to LAUSD educators
- Featured placement in LAUSD's approved apps catalog
- Streamlined deployment to schools

Requirements:
- Must have approved PoDS (any tier)
- Must be a free application (no per-student fees)
- Must meet LAUSD's educational quality standards

Use this tool when a vendor with free educational software wants broader LAUSD adoption.`,
    input_schema: {
      type: "object" as const,
      properties: {
        trigger_form: {
          type: "boolean",
          description:
            "Set to true to display the freemium app submission form",
        },
        app_name: {
          type: "string",
          description: "Optional: Pre-fill the application name",
        },
        app_url: {
          type: "string",
          description: "Optional: Pre-fill the application URL",
        },
        grade_levels: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional: Pre-fill target grade levels (e.g., ['K-2', '3-5', '6-8'])",
        },
        subject_areas: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional: Pre-fill subject areas (e.g., ['Math', 'Reading', 'Science'])",
        },
      },
      required: ["trigger_form"],
    },
  },

  // -------------------------------------------------------------------------
  // 9. get_audit_logs - Retrieve audit trail
  // -------------------------------------------------------------------------
  {
    name: "get_audit_logs",
    description: `Retrieve the audit log for a vendor's data access and integration activities.

Logged events include:
- API credential provisioning
- OneRoster API calls
- SSO configuration changes
- Data access requests
- Message sending attempts

Use this tool when:
- Vendor wants to review their activity history
- Troubleshooting integration issues
- Compliance verification
- Demonstrating audit capabilities

Returns timestamped list of actions with details.`,
    input_schema: {
      type: "object" as const,
      properties: {
        vendor_id: {
          type: "string",
          description: "The UUID of the vendor to retrieve logs for",
        },
        limit: {
          type: "number",
          description: "Maximum number of log entries to return (default: 50)",
        },
        action_filter: {
          type: "string",
          description:
            "Optional: Filter logs by action type (e.g., 'API_CALL', 'SSO_LOGIN')",
        },
        start_date: {
          type: "string",
          description:
            "Optional: Filter logs after this date (ISO 8601 format)",
        },
        end_date: {
          type: "string",
          description:
            "Optional: Filter logs before this date (ISO 8601 format)",
        },
      },
      required: ["vendor_id"],
    },
  },

  // -------------------------------------------------------------------------
  // 10. get_credentials - Display sandbox credentials
  // -------------------------------------------------------------------------
  {
    name: "get_credentials",
    description: `Retrieve and display the sandbox credentials for a vendor.

Returns:
- API Key (sk_test_xxx format)
- API Secret (displayed securely)
- Base URL for API calls
- Expiration date
- Rate limits
- Allowed endpoints

Use this tool when:
- Vendor needs to see their existing credentials
- Verifying credential status
- Checking expiration dates

Note: If credentials have expired or been revoked, will indicate status and offer to provision new ones.`,
    input_schema: {
      type: "object" as const,
      properties: {
        vendor_id: {
          type: "string",
          description: "The UUID of the vendor to retrieve credentials for",
        },
        show_secret: {
          type: "boolean",
          description:
            "Whether to display the API secret (default: false for security)",
        },
      },
      required: ["vendor_id"],
    },
  },

  // -------------------------------------------------------------------------
  // 11. check_status - Get integration statuses
  // -------------------------------------------------------------------------
  {
    name: "check_status",
    description: `Get the current status of all integrations for a vendor.

Returns status for:
- PoDS Application (approval status, tier, expiration)
- Sandbox Credentials (active, expired, rate limits)
- SSO Integration (Clever, ClassLink, Google)
- OneRoster API (last successful call, error rate)
- LTI Integration (configuration status)
- Communication Gateway (email/SMS capability)

Use this tool when:
- Vendor asks "what's my status?"
- Providing an integration overview
- Identifying next steps for the vendor
- Troubleshooting connectivity issues`,
    input_schema: {
      type: "object" as const,
      properties: {
        vendor_id: {
          type: "string",
          description: "The UUID of the vendor to check status for",
        },
        include_details: {
          type: "boolean",
          description:
            "Whether to include detailed configuration info (default: true)",
        },
      },
      required: ["vendor_id"],
    },
  },

  // -------------------------------------------------------------------------
  // 12. request_upgrade - Initiate tier upgrade
  // -------------------------------------------------------------------------
  {
    name: "request_upgrade",
    description: `Initiate a request to upgrade a vendor's data access tier.

Upgrade Paths:
- TOKEN_ONLY → SELECTIVE: Requires justification for limited PII access
- TOKEN_ONLY → FULL_ACCESS: Requires strong justification and DPA
- SELECTIVE → FULL_ACCESS: Requires DPA and enhanced security review

Process:
1. Vendor provides justification for why they need additional data
2. Request is submitted to LAUSD Privacy Office
3. Manual review process (typically 2-4 weeks)
4. Vendor notified of decision

Use this tool when:
- Vendor has legitimate need for more data than TOKEN_ONLY provides
- Vendor's use case genuinely requires actual PII

Always encourage TOKEN_ONLY first - only use this if the vendor has a clear, specific need for actual student PII.`,
    input_schema: {
      type: "object" as const,
      properties: {
        vendor_id: {
          type: "string",
          description: "The UUID of the vendor requesting the upgrade",
        },
        current_tier: {
          type: "string",
          enum: ["TOKEN_ONLY", "SELECTIVE"],
          description: "The vendor's current access tier",
        },
        target_tier: {
          type: "string",
          enum: ["SELECTIVE", "FULL_ACCESS"],
          description: "The desired access tier",
        },
        justification: {
          type: "string",
          description:
            "Detailed explanation of why the additional data access is needed. Must be specific about use cases.",
        },
        data_elements_needed: {
          type: "array",
          items: { type: "string" },
          description:
            "List of specific PII elements needed (e.g., ['email', 'phone', 'address'])",
        },
        retention_period: {
          type: "number",
          description: "How long the data will be retained (in days)",
        },
      },
      required: ["vendor_id", "target_tier", "justification"],
    },
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a tool definition by name
 */
export function getToolByName(name: string): Anthropic.Tool | undefined {
  return TOOL_DEFINITIONS.find((tool) => tool.name === name);
}

/**
 * Get tool names as an array
 */
export function getToolNames(): string[] {
  return TOOL_DEFINITIONS.map((tool) => tool.name);
}

/**
 * Validate tool input against schema (basic validation)
 */
export function validateToolInput(
  toolName: string,
  input: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const tool = getToolByName(toolName);
  if (!tool) {
    return { valid: false, errors: [`Unknown tool: ${toolName}`] };
  }

  const errors: string[] = [];
  const schema = tool.input_schema;

  // Check required fields
  if (schema.required && Array.isArray(schema.required)) {
    for (const field of schema.required) {
      if (!(field in input) || input[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Basic type checking for properties
  if (schema.properties && typeof schema.properties === "object") {
    for (const [key, value] of Object.entries(input)) {
      const propSchema = (schema.properties as Record<string, { type?: string; enum?: string[] }>)[key];
      if (propSchema) {
        // Check enum values
        if (propSchema.enum && !propSchema.enum.includes(value as string)) {
          errors.push(
            `Invalid value for ${key}: must be one of ${propSchema.enum.join(", ")}`
          );
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ToolName =
  | "lookup_pods"
  | "submit_pods_lite"
  | "provision_sandbox"
  | "configure_sso"
  | "test_oneroster"
  | "configure_lti"
  | "send_test_message"
  | "submit_app"
  | "get_audit_logs"
  | "get_credentials"
  | "check_status"
  | "request_upgrade";

export interface LookupPodsInput {
  query: string;
}

export interface SubmitPodsLiteInput {
  trigger_form: boolean;
  prefill_vendor_name?: string;
  prefill_email?: string;
}

export interface ProvisionSandboxInput {
  vendor_id: string;
}

export interface ConfigureSsoInput {
  provider: "CLEVER" | "CLASSLINK" | "GOOGLE";
  trigger_form?: boolean;
  client_id?: string;
  client_secret?: string;
  redirect_uri?: string;
}

export interface TestOneRosterInput {
  endpoint: "/users" | "/orgs" | "/classes" | "/enrollments" | "/courses";
  filters?: {
    schoolId?: string;
    role?: "student" | "teacher";
    grade?: number;
    classId?: string;
    userId?: string;
  };
  limit?: number;
}

export interface ConfigureLtiInput {
  trigger_form: boolean;
  client_id?: string;
  deployment_id?: string;
  jwks_url?: string;
  auth_url?: string;
  token_url?: string;
  launch_url?: string;
}

export interface SendTestMessageInput {
  channel: "EMAIL" | "SMS";
  recipient_token: string;
  subject?: string;
  body: string;
}

export interface SubmitAppInput {
  trigger_form: boolean;
  app_name?: string;
  app_url?: string;
  grade_levels?: string[];
  subject_areas?: string[];
}

export interface GetAuditLogsInput {
  vendor_id: string;
  limit?: number;
  action_filter?: string;
  start_date?: string;
  end_date?: string;
}

export interface GetCredentialsInput {
  vendor_id: string;
  show_secret?: boolean;
}

export interface CheckStatusInput {
  vendor_id: string;
  include_details?: boolean;
}

export interface RequestUpgradeInput {
  vendor_id: string;
  current_tier?: "TOKEN_ONLY" | "SELECTIVE";
  target_tier: "SELECTIVE" | "FULL_ACCESS";
  justification: string;
  data_elements_needed?: string[];
  retention_period?: number;
}

export type ToolInput =
  | LookupPodsInput
  | SubmitPodsLiteInput
  | ProvisionSandboxInput
  | ConfigureSsoInput
  | TestOneRosterInput
  | ConfigureLtiInput
  | SendTestMessageInput
  | SubmitAppInput
  | GetAuditLogsInput
  | GetCredentialsInput
  | CheckStatusInput
  | RequestUpgradeInput;
