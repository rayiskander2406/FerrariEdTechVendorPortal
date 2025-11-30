/**
 * AI Tool Names Configuration
 *
 * CONFIG-03: Centralized AI Tool Name Definitions
 *
 * Single source of truth for all AI tool names used across:
 * - lib/ai/tools.ts (TOOL_DEFINITIONS, ToolName type)
 * - lib/ai/handlers.ts (executeToolCall switch cases)
 *
 * @see tests/config/ai-tools-consistency.test.ts - Consistency tests
 * @see lib/config/forms.ts - Exemplar implementation
 * @see lib/config/sso.ts - Another exemplar
 */

import { z } from "zod";

// =============================================================================
// TOOL CATEGORIES
// =============================================================================

export const TOOL_CATEGORIES = {
  ONBOARDING: "onboarding",
  INTEGRATION: "integration",
  TESTING: "testing",
  MONITORING: "monitoring",
} as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[keyof typeof TOOL_CATEGORIES];

// =============================================================================
// AI TOOLS CONFIGURATION (Single Source of Truth)
// =============================================================================

/**
 * Centralized AI tools configuration.
 * All 12 tools used by the LAUSD Vendor Integration Assistant.
 */
export const AI_TOOLS = {
  LOOKUP_PODS: {
    id: "lookup_pods",
    label: "Lookup PoDS",
    description: "Check existing PoDS application status",
    category: TOOL_CATEGORIES.ONBOARDING,
  },
  SUBMIT_PODS_LITE: {
    id: "submit_pods_lite",
    label: "Submit PoDS-Lite",
    description: "Trigger PoDS-Lite form for Privacy-Safe access",
    category: TOOL_CATEGORIES.ONBOARDING,
  },
  PROVISION_SANDBOX: {
    id: "provision_sandbox",
    label: "Provision Sandbox",
    description: "Generate API credentials for testing",
    category: TOOL_CATEGORIES.INTEGRATION,
  },
  CONFIGURE_SSO: {
    id: "configure_sso",
    label: "Configure SSO",
    description: "Configure Clever/ClassLink/Google SSO",
    category: TOOL_CATEGORIES.INTEGRATION,
  },
  TEST_ONEROSTER: {
    id: "test_oneroster",
    label: "Test OneRoster",
    description: "Execute test API call against sandbox",
    category: TOOL_CATEGORIES.TESTING,
  },
  CONFIGURE_LTI: {
    id: "configure_lti",
    label: "Configure LTI",
    description: "Configure LTI 1.3 integration",
    category: TOOL_CATEGORIES.INTEGRATION,
  },
  SEND_TEST_MESSAGE: {
    id: "send_test_message",
    label: "Send Test Message",
    description: "Test communication gateway",
    category: TOOL_CATEGORIES.TESTING,
  },
  SUBMIT_APP: {
    id: "submit_app",
    label: "Submit App",
    description: "Submit freemium app for whitelist",
    category: TOOL_CATEGORIES.ONBOARDING,
  },
  GET_AUDIT_LOGS: {
    id: "get_audit_logs",
    label: "Get Audit Logs",
    description: "Retrieve audit trail",
    category: TOOL_CATEGORIES.MONITORING,
  },
  GET_CREDENTIALS: {
    id: "get_credentials",
    label: "Get Credentials",
    description: "Display sandbox credentials",
    category: TOOL_CATEGORIES.INTEGRATION,
  },
  CHECK_STATUS: {
    id: "check_status",
    label: "Check Status",
    description: "Get integration statuses",
    category: TOOL_CATEGORIES.MONITORING,
  },
  REQUEST_UPGRADE: {
    id: "request_upgrade",
    label: "Request Upgrade",
    description: "Initiate tier upgrade request",
    category: TOOL_CATEGORIES.ONBOARDING,
  },
} as const;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/** Tool key type (UPPERCASE_SNAKE) */
export type ToolKey = keyof typeof AI_TOOLS;

/** Tool ID type (lowercase_snake) */
export type ToolId = (typeof AI_TOOLS)[ToolKey]["id"];

/** Single tool configuration */
export interface ToolConfig {
  id: string;
  label: string;
  description: string;
  category: ToolCategory;
}

// =============================================================================
// DERIVED CONSTANTS
// =============================================================================

/** Array of all tool keys in UPPERCASE_SNAKE format */
export const ALL_TOOL_KEYS: readonly ToolKey[] = Object.keys(AI_TOOLS) as ToolKey[];

/** Array of all tool IDs in lowercase_snake format */
export const ALL_TOOL_IDS: readonly ToolId[] = Object.values(AI_TOOLS).map(
  (t) => t.id
) as readonly ToolId[];

/** Total number of AI tools */
export const TOOL_COUNT = 12;

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

/** Zod enum for tool IDs (for runtime validation) */
export const ToolIdEnum = z.enum([
  "lookup_pods",
  "submit_pods_lite",
  "provision_sandbox",
  "configure_sso",
  "test_oneroster",
  "configure_lti",
  "send_test_message",
  "submit_app",
  "get_audit_logs",
  "get_credentials",
  "check_status",
  "request_upgrade",
]);

/** Zod enum for tool keys (for runtime validation) */
export const ToolKeyEnum = z.enum([
  "LOOKUP_PODS",
  "SUBMIT_PODS_LITE",
  "PROVISION_SANDBOX",
  "CONFIGURE_SSO",
  "TEST_ONEROSTER",
  "CONFIGURE_LTI",
  "SEND_TEST_MESSAGE",
  "SUBMIT_APP",
  "GET_AUDIT_LOGS",
  "GET_CREDENTIALS",
  "CHECK_STATUS",
  "REQUEST_UPGRADE",
]);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get tool configuration by ID
 * @param id Tool ID in lowercase_snake format
 * @returns Tool configuration or undefined if not found
 */
export function getToolById(id: string): ToolConfig | undefined {
  return Object.values(AI_TOOLS).find((tool) => tool.id === id);
}

/**
 * Get tool configuration by key
 * @param key Tool key in UPPERCASE_SNAKE format
 * @returns Tool configuration or undefined if not found
 */
export function getToolByKey(key: string): ToolConfig | undefined {
  return AI_TOOLS[key as ToolKey];
}

/**
 * Check if a string is a valid tool ID
 * @param id String to check
 * @returns True if valid tool ID
 */
export function isValidToolId(id: string): id is ToolId {
  return ALL_TOOL_IDS.includes(id as ToolId);
}

/**
 * Check if a string is a valid tool key
 * @param key String to check
 * @returns True if valid tool key
 */
export function isValidToolKey(key: string): key is ToolKey {
  return ALL_TOOL_KEYS.includes(key as ToolKey);
}

/**
 * Convert tool key to ID
 * @param key Tool key in UPPERCASE_SNAKE format
 * @returns Tool ID in lowercase_snake format
 */
export function toolKeyToId(key: ToolKey): ToolId {
  return AI_TOOLS[key].id;
}

/**
 * Convert tool ID to key
 * @param id Tool ID in lowercase_snake format
 * @returns Tool key in UPPERCASE_SNAKE format, or undefined if not found
 */
export function toolIdToKey(id: string): ToolKey | undefined {
  const entry = Object.entries(AI_TOOLS).find(([, tool]) => tool.id === id);
  return entry ? (entry[0] as ToolKey) : undefined;
}

/**
 * Get all tools in a specific category
 * @param category Tool category
 * @returns Array of tool configurations
 */
export function getToolsByCategory(category: ToolCategory): ToolConfig[] {
  return Object.values(AI_TOOLS).filter((tool) => tool.category === category);
}

/**
 * Get tool label by ID
 * @param id Tool ID
 * @returns Human-readable label or the ID if not found
 */
export function getToolLabel(id: string): string {
  const tool = getToolById(id);
  return tool?.label ?? id;
}

/**
 * Get tool description by ID
 * @param id Tool ID
 * @returns Tool description or empty string if not found
 */
export function getToolDescription(id: string): string {
  const tool = getToolById(id);
  return tool?.description ?? "";
}
