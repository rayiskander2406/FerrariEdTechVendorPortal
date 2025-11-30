/**
 * Form Types Configuration - Single Source of Truth
 *
 * CONFIG-01: Form Types Centralization
 *
 * IMPORTANT: All form type definitions MUST come from this file.
 * Do NOT define form IDs, markers, or mappings elsewhere in the codebase.
 *
 * This file was created after identifying the same duplication pattern
 * that caused BUG-002 (OneRoster endpoints). Form types were defined in:
 * - lib/ai/handlers.ts (showForm return values)
 * - app/chat/page.tsx (switch cases)
 * - lib/hooks/useChat.ts (regex parsing)
 *
 * @see .claude/PLANNING.md - CONFIG-01 task
 * @see lib/config/oneroster.ts - Exemplar implementation
 * @see tests/config/forms-consistency.test.ts - 56 tests
 */

// =============================================================================
// FORM TYPE DEFINITIONS
// =============================================================================

/**
 * All form types supported by the portal.
 * Each form has an ID (lowercase), marker (uppercase), and metadata.
 */
export const FORM_TYPES = {
  PODS_LITE: {
    id: "pods_lite",
    marker: "[FORM:PODS_LITE]",
    label: "PoDS-Lite Application",
    description: "13-question privacy onboarding form",
    component: "PodsLiteForm",
  },
  SSO_CONFIG: {
    id: "sso_config",
    marker: "[FORM:SSO_CONFIG]",
    label: "SSO Configuration",
    description: "Configure Clever/ClassLink/Google SSO",
    component: "SsoConfigForm",
  },
  LTI_CONFIG: {
    id: "lti_config",
    marker: "[FORM:LTI_CONFIG]",
    label: "LTI Configuration",
    description: "Configure LTI 1.3 integration",
    component: "LtiConfigForm",
  },
  API_TESTER: {
    id: "api_tester",
    marker: "[FORM:API_TESTER]",
    label: "OneRoster API Tester",
    description: "Interactive API testing console",
    component: "ApiTester",
  },
  COMM_TEST: {
    id: "comm_test",
    marker: "[FORM:COMM_TEST]",
    label: "Communication Test",
    description: "Test email/SMS gateway",
    component: "CommTestForm",
  },
  CREDENTIALS: {
    id: "credentials",
    marker: "[FORM:CREDENTIALS]",
    label: "Credentials Display",
    description: "Show sandbox API credentials",
    component: "CredentialsDisplay",
  },
  AUDIT_LOG: {
    id: "audit_log",
    marker: "[FORM:AUDIT_LOG]",
    label: "Audit Log Viewer",
    description: "View data access audit trail",
    component: "AuditLogViewer",
  },
  APP_SUBMIT: {
    id: "app_submit",
    marker: "[FORM:APP_SUBMIT]",
    label: "App Submission",
    description: "Submit for freemium whitelist",
    component: "AppSubmitForm",
  },
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Form key (UPPERCASE) - used for object access
 */
export type FormKey = keyof typeof FORM_TYPES;

/**
 * Form ID (lowercase) - used for showForm values and switch cases
 */
export type FormId = (typeof FORM_TYPES)[FormKey]["id"];

/**
 * Form marker - used in AI responses [FORM:UPPERCASE]
 */
export type FormMarker = (typeof FORM_TYPES)[FormKey]["marker"];

/**
 * Full form configuration object
 */
export interface FormConfig {
  id: FormId;
  marker: FormMarker;
  label: string;
  description: string;
  component: string;
}

// =============================================================================
// DERIVED CONSTANTS
// =============================================================================

/**
 * Array of all form IDs (lowercase)
 */
export const ALL_FORM_IDS: FormId[] = Object.values(FORM_TYPES).map(
  (f) => f.id
) as FormId[];

/**
 * Array of all form markers
 */
export const ALL_FORM_MARKERS: FormMarker[] = Object.values(FORM_TYPES).map(
  (f) => f.marker
) as FormMarker[];

/**
 * Array of all form keys (UPPERCASE)
 */
export const ALL_FORM_KEYS: FormKey[] = Object.keys(FORM_TYPES) as FormKey[];

/**
 * Regex pattern for matching form markers in AI responses
 * Matches: [FORM:PODS_LITE], [FORM:SSO_CONFIG], etc.
 */
export const FORM_MARKER_REGEX = /\[FORM:([A-Z_]+)\]/g;

/**
 * Regex pattern for matching a single form marker (non-global)
 */
export const FORM_MARKER_REGEX_SINGLE = /\[FORM:([A-Z_]+)\]/;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get form configuration by ID (lowercase)
 * @param id - Form ID like "pods_lite"
 * @returns Form config or undefined
 */
export function getFormById(id: string): FormConfig | undefined {
  return Object.values(FORM_TYPES).find((f) => f.id === id) as
    | FormConfig
    | undefined;
}

/**
 * Get form configuration by marker
 * @param marker - Form marker like "[FORM:PODS_LITE]"
 * @returns Form config or undefined
 */
export function getFormByMarker(marker: string): FormConfig | undefined {
  return Object.values(FORM_TYPES).find((f) => f.marker === marker) as
    | FormConfig
    | undefined;
}

/**
 * Get form configuration by key (UPPERCASE)
 * @param key - Form key like "PODS_LITE"
 * @returns Form config or undefined
 */
export function getFormByKey(key: string): FormConfig | undefined {
  if (key in FORM_TYPES) {
    return FORM_TYPES[key as FormKey] as FormConfig;
  }
  return undefined;
}

/**
 * Parse a form marker and extract the form ID
 * @param marker - Form marker like "[FORM:PODS_LITE]"
 * @returns Form ID like "pods_lite" or null if invalid
 */
export function parseFormMarker(marker: string): FormId | null {
  const match = marker.match(FORM_MARKER_REGEX_SINGLE);
  if (match && match[1]) {
    const formKey = match[1];
    const formId = formKey.toLowerCase();
    // Verify it's a valid form ID
    if (isValidFormId(formId)) {
      return formId as FormId;
    }
  }
  return null;
}

/**
 * Check if a string is a valid form ID
 * @param id - String to check
 * @returns true if valid form ID
 */
export function isValidFormId(id: string): id is FormId {
  return ALL_FORM_IDS.includes(id as FormId);
}

/**
 * Check if a string is a valid form key
 * @param key - String to check
 * @returns true if valid form key
 */
export function isValidFormKey(key: string): key is FormKey {
  return ALL_FORM_KEYS.includes(key as FormKey);
}

/**
 * Check if a string is a valid form marker
 * @param marker - String to check
 * @returns true if valid form marker
 */
export function isValidFormMarker(marker: string): marker is FormMarker {
  return ALL_FORM_MARKERS.includes(marker as FormMarker);
}

/**
 * Convert form key to form ID
 * @param key - Form key like "PODS_LITE"
 * @returns Form ID like "pods_lite" or undefined
 */
export function formKeyToId(key: FormKey): FormId {
  return FORM_TYPES[key].id;
}

/**
 * Convert form ID to form key
 * @param id - Form ID like "pods_lite"
 * @returns Form key like "PODS_LITE" or undefined
 */
export function formIdToKey(id: string): FormKey | undefined {
  const form = getFormById(id);
  if (form) {
    return Object.entries(FORM_TYPES).find(
      ([, value]) => value.id === id
    )?.[0] as FormKey | undefined;
  }
  return undefined;
}

/**
 * Build a form marker from a form ID
 * @param id - Form ID like "pods_lite"
 * @returns Form marker like "[FORM:PODS_LITE]" or undefined
 */
export function buildFormMarker(id: string): FormMarker | undefined {
  const form = getFormById(id);
  return form?.marker as FormMarker | undefined;
}

/**
 * Extract all form triggers from a content string
 * @param content - String that may contain form markers
 * @returns Array of form IDs found, or empty array
 */
export function extractFormTriggers(content: string): FormId[] {
  const matches = content.match(FORM_MARKER_REGEX);
  if (!matches) {
    return [];
  }

  return matches
    .map((match) => parseFormMarker(match))
    .filter((id): id is FormId => id !== null);
}

/**
 * Get the last form trigger from a content string
 * @param content - String that may contain form markers
 * @returns Last form ID found, or null
 */
export function getLastFormTrigger(content: string): FormId | null {
  const triggers = extractFormTriggers(content);
  return triggers.length > 0 ? triggers[triggers.length - 1] : null;
}
