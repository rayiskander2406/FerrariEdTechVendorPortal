/**
 * SSO Provider Configuration - Single Source of Truth
 *
 * CONFIG-02: SSO Providers Centralization
 *
 * IMPORTANT: All SSO provider definitions MUST come from this file.
 * Do NOT define provider lists elsewhere in the codebase.
 *
 * This file was created after identifying SSO provider duplication across:
 * - lib/types/index.ts (SsoProviderEnum)
 * - lib/ai/tools.ts (configure_sso enum)
 * - lib/ai/handlers.ts (getSsoProviderInfo, getProviderDomain)
 * - components/forms/SsoConfigForm.tsx (SsoProvider type, PROVIDERS array)
 *
 * CRITICAL BUG FOUND: UI had SCHOOLDAY but was missing CLASSLINK!
 *
 * @see .claude/PLANNING.md - CONFIG-02 task
 * @see lib/config/forms.ts - Exemplar implementation
 * @see tests/config/sso-consistency.test.ts - 89 tests
 */

import { z } from "zod";

// =============================================================================
// SSO PROVIDER DEFINITIONS
// =============================================================================

/**
 * All SSO providers supported by the portal.
 * Each provider has an ID (lowercase), key (UPPERCASE), and metadata.
 */
export const SSO_PROVIDERS = {
  CLEVER: {
    id: "clever",
    name: "Clever",
    website: "https://clever.com",
    devPortal: "https://dev.clever.com",
    docUrl: "https://dev.clever.com/docs",
    domain: "clever.com",
    typicalUse: "K-8 applications, instant login",
    description: "Single sign-on for K-12",
    icon: "Sparkles",
  },
  CLASSLINK: {
    id: "classlink",
    name: "ClassLink",
    website: "https://classlink.com",
    devPortal: "https://developer.classlink.com",
    docUrl: "https://developer.classlink.com/docs",
    domain: "classlink.com",
    typicalUse: "6-12 applications, LaunchPad integration",
    description: "LaunchPad single sign-on",
    icon: "Link",
  },
  GOOGLE: {
    id: "google",
    name: "Google Workspace",
    website: "https://workspace.google.com",
    devPortal: "https://console.cloud.google.com",
    docUrl: "https://developers.google.com/identity",
    domain: "accounts.google.com",
    typicalUse: "Universal SSO, all grade levels",
    description: "Google Workspace for Education",
    icon: "Users",
  },
  SCHOOLDAY: {
    id: "schoolday",
    name: "SchoolDay",
    website: "https://schoolday.lausd.net",
    devPortal: "https://schoolday.lausd.net/developer",
    docUrl: "https://schoolday.lausd.net/docs",
    domain: "schoolday.lausd.net",
    typicalUse: "LAUSD unified identity platform",
    description: "LAUSD's unified identity platform",
    icon: "GraduationCap",
  },
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Provider key (UPPERCASE) - used for object access
 */
export type SsoProviderKey = keyof typeof SSO_PROVIDERS;

/**
 * Provider ID (lowercase) - used for API values and switch cases
 */
export type SsoProviderId = (typeof SSO_PROVIDERS)[SsoProviderKey]["id"];

/**
 * Full provider configuration object
 */
export interface SsoProviderConfig {
  id: SsoProviderId;
  name: string;
  website: string;
  devPortal: string;
  docUrl: string;
  domain: string;
  typicalUse: string;
  description: string;
  icon: string;
}

// =============================================================================
// DERIVED CONSTANTS
// =============================================================================

/**
 * Array of all provider keys (UPPERCASE)
 */
export const ALL_PROVIDER_KEYS: SsoProviderKey[] = Object.keys(
  SSO_PROVIDERS
) as SsoProviderKey[];

/**
 * Array of all provider IDs (lowercase)
 */
export const ALL_PROVIDER_IDS: SsoProviderId[] = Object.values(SSO_PROVIDERS).map(
  (p) => p.id
) as SsoProviderId[];

/**
 * Zod enum for validation - matches lib/types/index.ts SsoProviderEnum
 * NOTE: For AI tools, we only expose CLEVER, CLASSLINK, GOOGLE (not SCHOOLDAY)
 * because SCHOOLDAY is LAUSD's internal identity - vendors configure external SSO
 */
export const SsoProviderEnum = z.enum(["CLEVER", "CLASSLINK", "GOOGLE"]);

/**
 * Extended Zod enum including SCHOOLDAY (for UI forms)
 */
export const SsoProviderEnumWithSchoolDay = z.enum([
  "SCHOOLDAY",
  "CLEVER",
  "CLASSLINK",
  "GOOGLE",
]);

/**
 * AI Tool provider enum values - SCHOOLDAY first as recommended default
 * Use this for configure_sso tool schema
 */
export const AI_TOOL_SSO_PROVIDERS: readonly ["SCHOOLDAY", "CLEVER", "CLASSLINK", "GOOGLE"] = [
  "SCHOOLDAY",
  "CLEVER",
  "CLASSLINK",
  "GOOGLE",
] as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get provider configuration by ID (lowercase)
 * @param id - Provider ID like "clever"
 * @returns Provider config or undefined
 */
export function getProviderById(id: string): SsoProviderConfig | undefined {
  return Object.values(SSO_PROVIDERS).find((p) => p.id === id) as
    | SsoProviderConfig
    | undefined;
}

/**
 * Get provider configuration by key (UPPERCASE)
 * @param key - Provider key like "CLEVER"
 * @returns Provider config or undefined
 */
export function getProviderByKey(key: string): SsoProviderConfig | undefined {
  if (key in SSO_PROVIDERS) {
    return SSO_PROVIDERS[key as SsoProviderKey] as SsoProviderConfig;
  }
  return undefined;
}

/**
 * Check if a string is a valid provider ID
 * @param id - String to check
 * @returns true if valid provider ID
 */
export function isValidProviderId(id: string): id is SsoProviderId {
  return ALL_PROVIDER_IDS.includes(id as SsoProviderId);
}

/**
 * Check if a string is a valid provider key
 * @param key - String to check
 * @returns true if valid provider key
 */
export function isValidProviderKey(key: string): key is SsoProviderKey {
  return ALL_PROVIDER_KEYS.includes(key as SsoProviderKey);
}

/**
 * Get provider domain by key
 * @param key - Provider key like "CLEVER"
 * @returns Domain string or the key lowercased as fallback
 */
export function getProviderDomain(key: string): string {
  const provider = getProviderByKey(key);
  return provider?.domain ?? key.toLowerCase();
}

/**
 * Get provider info (for AI handler responses)
 * @param key - Provider key like "CLEVER"
 * @returns Object with provider metadata
 */
export function getSsoProviderInfo(
  key: string
): Record<string, string> {
  const provider = getProviderByKey(key);
  if (!provider) {
    return {
      name: key,
      website: "",
      devPortal: "",
      docUrl: "",
      typicalUse: "",
    };
  }
  return {
    name: provider.name,
    website: provider.website,
    devPortal: provider.devPortal,
    docUrl: provider.docUrl,
    typicalUse: provider.typicalUse,
  };
}

/**
 * Convert provider key to provider ID
 * @param key - Provider key like "CLEVER"
 * @returns Provider ID like "clever"
 */
export function providerKeyToId(key: SsoProviderKey): SsoProviderId {
  return SSO_PROVIDERS[key].id;
}

/**
 * Convert provider ID to provider key
 * @param id - Provider ID like "clever"
 * @returns Provider key like "CLEVER" or undefined
 */
export function providerIdToKey(id: string): SsoProviderKey | undefined {
  const entry = Object.entries(SSO_PROVIDERS).find(
    ([, value]) => value.id === id
  );
  return entry?.[0] as SsoProviderKey | undefined;
}

// =============================================================================
// UI CONFIGURATION
// =============================================================================

/**
 * Provider options for UI dropdowns
 * Includes icon names for Lucide React icons
 */
export const SSO_PROVIDER_OPTIONS = Object.entries(SSO_PROVIDERS).map(
  ([key, provider]) => ({
    value: key as SsoProviderKey,
    label: provider.name,
    description: provider.description,
    icon: provider.icon,
  })
);

/**
 * OAuth scopes by provider for UI configuration
 */
export const SSO_SCOPES_BY_PROVIDER: Record<
  SsoProviderKey,
  { value: string; label: string; description: string }[]
> = {
  SCHOOLDAY: [
    { value: "openid", label: "OpenID", description: "Basic authentication" },
    {
      value: "profile",
      label: "Profile",
      description: "Basic user profile information",
    },
    {
      value: "roster:read",
      label: "Roster Read",
      description: "Read class rosters and enrollments",
    },
    {
      value: "student:tokenized",
      label: "Tokenized Students",
      description: "Access tokenized student identifiers",
    },
  ],
  CLEVER: [
    { value: "read:user_id", label: "User ID", description: "Read user identifier" },
    {
      value: "read:sis",
      label: "SIS Data",
      description: "Read student information system data",
    },
    {
      value: "read:district_admins",
      label: "District Admins",
      description: "Read district administrator data",
    },
  ],
  CLASSLINK: [
    { value: "profile", label: "Profile", description: "Basic profile information" },
    { value: "oneroster", label: "OneRoster", description: "OneRoster rostering data" },
    {
      value: "full",
      label: "Full Access",
      description: "Complete ClassLink data access",
    },
  ],
  GOOGLE: [
    { value: "openid", label: "OpenID", description: "Basic authentication" },
    { value: "email", label: "Email", description: "User email address" },
    { value: "profile", label: "Profile", description: "Basic profile information" },
    {
      value: "https://www.googleapis.com/auth/classroom.courses.readonly",
      label: "Classroom Courses",
      description: "Read Google Classroom courses",
    },
  ],
};
