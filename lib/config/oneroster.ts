/**
 * OneRoster Configuration - Single Source of Truth
 *
 * IMPORTANT: All OneRoster endpoint definitions MUST come from this file.
 * Do NOT define endpoint lists elsewhere in the codebase.
 *
 * This file was created after BUG-002 revealed that duplicated endpoint
 * definitions across files (db, handlers, UI) caused configuration drift.
 *
 * @see .claude/tickets/BUG-002-sandbox-endpoints-ignored.md
 */

// =============================================================================
// ENDPOINT DEFINITIONS
// =============================================================================

/**
 * All valid OneRoster 1.1 endpoints supported by this portal.
 * These are the canonical endpoint paths used for API routing and validation.
 */
export const ONEROSTER_ENDPOINTS = [
  "/users",
  "/classes",
  "/courses",
  "/enrollments",
  "/orgs",
  "/academicSessions",
  "/demographics",
] as const;

export type OneRosterEndpoint = (typeof ONEROSTER_ENDPOINTS)[number];

/**
 * Default endpoints provisioned when vendor doesn't specify preferences.
 * Includes core rostering data but excludes demographics by default.
 */
export const DEFAULT_ONEROSTER_ENDPOINTS: OneRosterEndpoint[] = [
  "/users",
  "/orgs",
  "/classes",
  "/enrollments",
  "/courses",
];

// =============================================================================
// RESOURCE MAPPING
// =============================================================================

/**
 * Maps human-readable resource names (from PoDS-Lite form) to endpoint paths.
 * Used when processing vendor selections from the onboarding flow.
 */
export const ONEROSTER_RESOURCE_TO_ENDPOINT: Record<string, OneRosterEndpoint> = {
  users: "/users",
  classes: "/classes",
  courses: "/courses",
  enrollments: "/enrollments",
  orgs: "/orgs",
  organizations: "/orgs",
  academicSessions: "/academicSessions",
  academicsessions: "/academicSessions",
  sessions: "/academicSessions",
  demographics: "/demographics",
};

// =============================================================================
// UI METADATA
// =============================================================================

export interface EndpointMetadata {
  value: OneRosterEndpoint;
  label: string;
  description: string;
  /** Response array key in OneRoster response */
  responseKey: string;
}

/**
 * UI metadata for each endpoint - labels, descriptions, response keys.
 * Used by ApiTester and other UI components.
 */
export const ONEROSTER_ENDPOINT_METADATA: EndpointMetadata[] = [
  {
    value: "/users",
    label: "Users",
    description: "Students & Teachers (tokenized)",
    responseKey: "users",
  },
  {
    value: "/classes",
    label: "Classes",
    description: "Course sections & schedules",
    responseKey: "classes",
  },
  {
    value: "/courses",
    label: "Courses",
    description: "Curriculum & subjects",
    responseKey: "courses",
  },
  {
    value: "/enrollments",
    label: "Enrollments",
    description: "Student-class relationships",
    responseKey: "enrollments",
  },
  {
    value: "/orgs",
    label: "Orgs",
    description: "Schools & district info",
    responseKey: "orgs",
  },
  {
    value: "/academicSessions",
    label: "Sessions",
    description: "Terms & grading periods",
    responseKey: "academicSessions",
  },
  {
    value: "/demographics",
    label: "Demographics",
    description: "Student demographics",
    responseKey: "demographics",
  },
];

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validates and normalizes an endpoint path.
 * Returns the canonical endpoint or undefined if invalid.
 */
export function normalizeEndpoint(endpoint: string): OneRosterEndpoint | undefined {
  const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return ONEROSTER_ENDPOINTS.find(
    (valid) => valid.toLowerCase() === normalized.toLowerCase()
  );
}

/**
 * Maps a resource name to its canonical endpoint path.
 */
export function resourceToEndpoint(resource: string): OneRosterEndpoint | undefined {
  const normalized = resource.toLowerCase();
  const entry = Object.entries(ONEROSTER_RESOURCE_TO_ENDPOINT).find(
    ([key]) => key.toLowerCase() === normalized
  );
  return entry ? entry[1] : undefined;
}

/**
 * Validates and deduplicates a list of requested endpoints.
 * Returns valid endpoints or defaults if none valid.
 */
export function validateEndpoints(requestedEndpoints?: string[]): OneRosterEndpoint[] {
  if (!requestedEndpoints || requestedEndpoints.length === 0) {
    return [...DEFAULT_ONEROSTER_ENDPOINTS];
  }

  const validated = requestedEndpoints
    .map(normalizeEndpoint)
    .filter((ep): ep is OneRosterEndpoint => ep !== undefined);

  const unique = [...new Set(validated)];

  return unique.length > 0 ? unique : [...DEFAULT_ONEROSTER_ENDPOINTS];
}

/**
 * Maps resource names to validated endpoint paths.
 */
export function resourcesToEndpoints(resources?: string[]): OneRosterEndpoint[] | undefined {
  if (!resources || resources.length === 0) {
    return undefined;
  }

  const endpoints = resources
    .map(resourceToEndpoint)
    .filter((ep): ep is OneRosterEndpoint => ep !== undefined);

  return endpoints.length > 0 ? endpoints : undefined;
}

/**
 * Gets metadata for a specific endpoint.
 */
export function getEndpointMetadata(endpoint: OneRosterEndpoint): EndpointMetadata | undefined {
  return ONEROSTER_ENDPOINT_METADATA.find((meta) => meta.value === endpoint);
}
