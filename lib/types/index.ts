import { z } from "zod";

// =============================================================================
// ENUMS
// =============================================================================

export const AccessTierEnum = z.enum(["PRIVACY_SAFE", "SELECTIVE", "FULL_ACCESS"]);
export type AccessTier = z.infer<typeof AccessTierEnum>;

export const PodsStatusEnum = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
]);
export type PodsStatus = z.infer<typeof PodsStatusEnum>;

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
export type DataElement = z.infer<typeof DataElementEnum>;

export const IntegrationMethodEnum = z.enum([
  "ONEROSTER_API",
  "SFTP",
  "LTI_1_3",
  "SSO_SAML",
  "SSO_OIDC",
  "MANUAL_UPLOAD",
]);
export type IntegrationMethod = z.infer<typeof IntegrationMethodEnum>;

export const IntegrationTypeEnum = z.enum(["SSO", "ONEROSTER", "LTI", "COMMUNICATION"]);
export type IntegrationType = z.infer<typeof IntegrationTypeEnum>;

export const SsoProviderEnum = z.enum(["CLEVER", "CLASSLINK", "GOOGLE"]);
export type SsoProvider = z.infer<typeof SsoProviderEnum>;

export const IntegrationStatusEnum = z.enum([
  "NOT_CONFIGURED",
  "CONFIGURING",
  "TESTING",
  "ACTIVE",
  "ERROR",
  "DISABLED",
]);
export type IntegrationStatus = z.infer<typeof IntegrationStatusEnum>;

export const CommChannelEnum = z.enum(["EMAIL", "SMS", "PUSH", "IN_APP"]);
export type CommChannel = z.infer<typeof CommChannelEnum>;

export const MessageStatusEnum = z.enum([
  "QUEUED",
  "SENT",
  "DELIVERED",
  "FAILED",
  "BOUNCED",
]);
export type MessageStatus = z.infer<typeof MessageStatusEnum>;

export const SandboxStatusEnum = z.enum([
  "PROVISIONING",
  "ACTIVE",
  "EXPIRED",
  "REVOKED",
]);
export type SandboxStatus = z.infer<typeof SandboxStatusEnum>;

// =============================================================================
// VENDOR
// =============================================================================

export const VendorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  contactEmail: z.string().email(),
  contactName: z.string().min(1),
  website: z.string().url().optional(),
  description: z.string().optional(),
  accessTier: AccessTierEnum,
  podsStatus: PodsStatusEnum,
  podsApplicationId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Vendor = z.infer<typeof VendorSchema>;

// =============================================================================
// PODS-LITE INPUT (13 Questions)
// =============================================================================

export const PodsLiteInputSchema = z.object({
  // Question 1: Basic vendor info
  vendorName: z.string().min(1, "Vendor name is required"),

  // Question 2: Contact information
  contactEmail: z.string().email("Valid email is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactPhone: z.string().optional(),

  // Question 2.5: Verification fields
  websiteUrl: z.string().url("Valid website URL is required").optional(),
  linkedInUrl: z.string().url("Valid LinkedIn URL is required").optional(),

  // Question 3: Application/service description
  applicationName: z.string().min(1, "Application name is required"),
  applicationDescription: z.string().min(10, "Please provide a description"),

  // Question 4: Data elements needed
  dataElementsRequested: z.array(DataElementEnum).min(1, "Select at least one data element"),

  // Question 5: Purpose of data use
  dataPurpose: z.string().min(10, "Please describe the purpose"),

  // Question 6: Data retention policy
  dataRetentionDays: z.number().int().min(1).max(365),

  // Question 7: Integration method
  integrationMethod: IntegrationMethodEnum,

  // Question 8: Will data be shared with third parties?
  thirdPartySharing: z.boolean(),
  thirdPartyDetails: z.string().optional(),

  // Question 9: Security certifications
  hasSOC2: z.boolean(),
  hasFERPACertification: z.boolean(),

  // Question 10: Data encryption
  encryptsDataAtRest: z.boolean(),
  encryptsDataInTransit: z.boolean(),

  // Question 11: Breach notification commitment
  breachNotificationHours: z.number().int().min(1).max(72),

  // Question 12: COPPA compliance (if serving K-12)
  coppaCompliant: z.boolean(),

  // Question 13: Acceptance of LAUSD terms
  acceptsTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms",
  }),
  acceptsDataDeletion: z.boolean().refine((val) => val === true, {
    message: "You must agree to delete data upon request",
  }),
});
export type PodsLiteInput = z.infer<typeof PodsLiteInputSchema>;

// =============================================================================
// SANDBOX CREDENTIALS
// =============================================================================

// Legacy schema - kept for backwards compatibility
export const SandboxCredentialsSchema = z.object({
  id: z.string().uuid(),
  vendorId: z.string().uuid(),
  apiKey: z.string(),
  apiSecret: z.string(),
  baseUrl: z.string().url(),
  environment: z.enum(["sandbox", "production"]),
  status: SandboxStatusEnum,
  expiresAt: z.date(),
  createdAt: z.date(),
  lastUsedAt: z.date().optional(),
  rateLimitPerMinute: z.number().int().positive(),
  allowedEndpoints: z.array(z.string()),
});
export type SandboxCredentials = z.infer<typeof SandboxCredentialsSchema>;

// =============================================================================
// INTEGRATION-SPECIFIC CREDENTIALS
// =============================================================================

// OneRoster API Credentials
export const OneRosterCredentialsSchema = z.object({
  apiKey: z.string(),
  apiSecret: z.string(),
  baseUrl: z.string().url(),
  vendorId: z.string(),
  accessTier: AccessTierEnum,
  rateLimitPerMinute: z.number().int().positive().default(60),
  allowedEndpoints: z.array(z.string()),
  selectedResources: z.array(z.string()), // Which OneRoster resources they requested
});
export type OneRosterCredentials = z.infer<typeof OneRosterCredentialsSchema>;

// LTI 1.3 Credentials
export const Lti13CredentialsSchema = z.object({
  clientId: z.string(),
  deploymentId: z.string(),
  platformId: z.string().url(), // Issuer URL
  authorizationUrl: z.string().url(),
  tokenUrl: z.string().url(),
  jwksUrl: z.string().url(),
  toolLaunchUrl: z.string().url(),
  deepLinkingUrl: z.string().url().optional(),
  selectedServices: z.array(z.string()), // Which LTI services they requested
});
export type Lti13Credentials = z.infer<typeof Lti13CredentialsSchema>;

// SSO SAML Credentials
export const SamlCredentialsSchema = z.object({
  idpEntityId: z.string(),
  idpSsoUrl: z.string().url(),
  idpSloUrl: z.string().url().optional(),
  idpCertificate: z.string(), // PEM format X.509 certificate
  idpMetadataUrl: z.string().url().optional(),
  spEntityId: z.string(), // Service Provider entity ID (vendor's)
  spAcsUrl: z.string().url(), // Assertion Consumer Service URL
  nameIdFormat: z.string().default("urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"),
  selectedAttributes: z.array(z.string()), // Which attributes they requested
  attributeMappings: z.record(z.string(), z.string()), // attribute name → SAML attribute
});
export type SamlCredentials = z.infer<typeof SamlCredentialsSchema>;

// SSO OIDC Credentials
export const OidcCredentialsSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  issuer: z.string().url(),
  authorizationEndpoint: z.string().url(),
  tokenEndpoint: z.string().url(),
  userinfoEndpoint: z.string().url(),
  jwksUrl: z.string().url(),
  redirectUri: z.string().url(),
  scopes: z.array(z.string()).default(["openid", "profile", "email"]),
  selectedClaims: z.array(z.string()), // Which claims they requested
  claimMappings: z.record(z.string(), z.string()), // claim name → OIDC claim
});
export type OidcCredentials = z.infer<typeof OidcCredentialsSchema>;

// SFTP Credentials
export const SftpCredentialsSchema = z.object({
  host: z.string(),
  port: z.number().int().min(1).max(65535).default(22),
  username: z.string(),
  privateKey: z.string().optional(), // PEM format SSH key
  password: z.string().optional(), // Alternative to private key
  remoteDirectory: z.string(),
  fileNamePattern: z.string().default("roster_{date}.csv"),
  deliverySchedule: z.enum(["DAILY", "WEEKLY", "ON_DEMAND"]).default("DAILY"),
  csvDelimiter: z.enum([",", "|", "\t"]).default(","),
  csvEncoding: z.enum(["UTF-8", "ISO-8859-1"]).default("UTF-8"),
  includeHeader: z.boolean().default(true),
});
export type SftpCredentials = z.infer<typeof SftpCredentialsSchema>;

// Combined credentials set for a vendor (can have multiple integration types)
export const VendorCredentialsSetSchema = z.object({
  vendorId: z.string(),
  vendorName: z.string(),
  accessTier: AccessTierEnum,
  environment: z.enum(["sandbox", "production"]).default("sandbox"),
  createdAt: z.date(),
  expiresAt: z.date(),
  // Per-integration credentials (only populated if that integration was selected)
  oneRoster: OneRosterCredentialsSchema.optional(),
  lti13: Lti13CredentialsSchema.optional(),
  saml: SamlCredentialsSchema.optional(),
  oidc: OidcCredentialsSchema.optional(),
  sftp: SftpCredentialsSchema.optional(),
});
export type VendorCredentialsSet = z.infer<typeof VendorCredentialsSetSchema>;

// =============================================================================
// INTEGRATION CONFIG
// =============================================================================

export const IntegrationConfigSchema = z.object({
  id: z.string().uuid(),
  vendorId: z.string().uuid(),
  type: IntegrationTypeEnum,
  status: IntegrationStatusEnum,

  // SSO-specific fields
  ssoProvider: SsoProviderEnum.optional(),
  ssoClientId: z.string().optional(),
  ssoClientSecret: z.string().optional(),
  ssoRedirectUri: z.string().url().optional(),

  // OneRoster-specific fields
  oneRosterVersion: z.enum(["1.1", "1.2"]).optional(),
  oneRosterBaseUrl: z.string().url().optional(),

  // LTI-specific fields
  ltiVersion: z.enum(["1.3"]).optional(),
  ltiClientId: z.string().optional(),
  ltiDeploymentId: z.string().optional(),
  ltiJwksUrl: z.string().url().optional(),
  ltiAuthUrl: z.string().url().optional(),
  ltiTokenUrl: z.string().url().optional(),

  // Metadata
  configuredAt: z.date().optional(),
  lastTestedAt: z.date().optional(),
  testResult: z.enum(["PASS", "FAIL", "PENDING"]).optional(),
  errorMessage: z.string().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});
export type IntegrationConfig = z.infer<typeof IntegrationConfigSchema>;

// =============================================================================
// COMMUNICATION MESSAGE
// =============================================================================

export const CommunicationMessageSchema = z.object({
  id: z.string().uuid(),
  vendorId: z.string().uuid(),
  channel: CommChannelEnum,
  status: MessageStatusEnum,

  // Recipient (tokenized)
  recipientToken: z.string(), // e.g., TKN_STU_8X9Y2Z
  recipientType: z.enum(["STUDENT", "TEACHER", "PARENT"]),

  // Message content
  subject: z.string().optional(), // For email
  body: z.string().min(1),

  // Tracking
  sentAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  failureReason: z.string().optional(),

  // Audit
  createdAt: z.date(),
});
export type CommunicationMessage = z.infer<typeof CommunicationMessageSchema>;

// =============================================================================
// CHAT & AI TYPES
// =============================================================================

export const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  arguments: z.record(z.string(), z.unknown()),
});
export type ToolCall = z.infer<typeof ToolCallSchema>;

export const ToolResultSchema = z.object({
  toolCallId: z.string(),
  result: z.unknown(),
  isError: z.boolean().default(false),
});
export type ToolResult = z.infer<typeof ToolResultSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.date(),
  toolCalls: z.array(ToolCallSchema).optional(),
  toolResults: z.array(ToolResultSchema).optional(),
  isStreaming: z.boolean().default(false),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const VendorContextSchema = z.object({
  vendor: VendorSchema.optional(),
  sandboxCredentials: SandboxCredentialsSchema.optional(),
  integrations: z.array(IntegrationConfigSchema).default([]),
  podsApplication: PodsLiteInputSchema.optional(),
  sessionId: z.string(),
  lastActivity: z.date(),
});
export type VendorContext = z.infer<typeof VendorContextSchema>;

// =============================================================================
// API RESPONSE WRAPPER
// =============================================================================

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.string(), z.unknown()).optional(),
      })
      .optional(),
    meta: z
      .object({
        timestamp: z.date(),
        requestId: z.string().optional(),
        pagination: z
          .object({
            page: z.number().int().positive(),
            pageSize: z.number().int().positive(),
            totalCount: z.number().int().nonnegative(),
            totalPages: z.number().int().nonnegative(),
          })
          .optional(),
      })
      .optional(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: Date;
    requestId?: string;
    pagination?: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  };
};

// =============================================================================
// AUDIT LOG
// =============================================================================

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  vendorId: z.string().uuid(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.date(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

// =============================================================================
// TOKENIZED DATA TYPES
// =============================================================================

export const TokenizedStudentSchema = z.object({
  token: z.string().regex(/^TKN_STU_[A-Z0-9]{8}$/),
  firstName: z.string(), // First name preserved
  lastName: z.literal("[TOKENIZED]"),
  email: z.string().regex(/^TKN_STU_[a-z0-9]+@relay\.schoolday\.lausd\.net$/),
  gradeLevel: z.number().int().min(-1).max(12), // -1 for PreK
  schoolToken: z.string().regex(/^TKN_SCH_[A-Z0-9]{8}$/),
});
export type TokenizedStudent = z.infer<typeof TokenizedStudentSchema>;

export const TokenizedTeacherSchema = z.object({
  token: z.string().regex(/^TKN_TCH_[A-Z0-9]{8}$/),
  firstName: z.string(),
  lastName: z.literal("[TOKENIZED]"),
  email: z.string().regex(/^TKN_TCH_[a-z0-9]+@relay\.schoolday\.lausd\.net$/),
  schoolToken: z.string().regex(/^TKN_SCH_[A-Z0-9]{8}$/),
});
export type TokenizedTeacher = z.infer<typeof TokenizedTeacherSchema>;

// =============================================================================
// VENDOR VERIFICATION
// =============================================================================

/**
 * Vendor verification signals for PoDS-Lite applications
 * These lightweight digital-age checks help verify legitimacy without bureaucracy
 */

/**
 * Verification signal types organized by tier:
 *
 * BASIC SIGNALS (Privacy-Safe tier - 80%):
 * - EMAIL_DOMAIN_MATCH, WEBSITE_SSL, WEBSITE_AGE
 * - LINKEDIN_COMPANY_PROFILE, LINKEDIN_EMPLOYEE_COUNT
 *
 * ENHANCED SIGNALS (Selective/Full Access tiers - 20%):
 * - APPLICANT_LINKEDIN_VERIFIED (person is verified employee)
 * - EDTECH_DIRECTORY_* (listings in credible directories)
 */
export const VerificationSignalTypeEnum = z.enum([
  // === Basic Signals (Privacy-Safe tier) ===
  "EMAIL_DOMAIN_MATCH",           // Email domain matches company website
  "WEBSITE_SSL",                  // Website has valid SSL certificate
  "WEBSITE_AGE",                  // Domain is older than threshold
  "LINKEDIN_COMPANY_PROFILE",     // LinkedIn company page exists
  "LINKEDIN_EMPLOYEE_COUNT",      // LinkedIn shows employee count

  // === Enhanced Signals (PII tiers) ===
  // Applicant verification
  "APPLICANT_LINKEDIN_VERIFIED",  // Applicant has verified LinkedIn showing company affiliation
  "APPLICANT_EMAIL_CORPORATE",    // Applicant uses corporate email (not gmail, etc.)

  // EdTech Directory verifications
  "DIRECTORY_1EDTECH",            // Listed in 1EdTech (IMS Global) - LTI/OneRoster certified
  "DIRECTORY_COMMON_SENSE",       // Common Sense Privacy Program approved
  "DIRECTORY_SDPC",               // Student Data Privacy Consortium member
  "DIRECTORY_IKEEPSAFE",          // iKeepSafe COPPA/FERPA certified
  "DIRECTORY_PRIVACY_PLEDGE",     // Future of Privacy Forum - Student Privacy Pledge signatory
  "DIRECTORY_CLEVER",             // Clever Certified Partner
  "DIRECTORY_CLASSLINK",          // ClassLink Certified Partner
  "DIRECTORY_STATE_APPROVED",     // State-specific approved vendor list (e.g., CA, NY)
]);
export type VerificationSignalType = z.infer<typeof VerificationSignalTypeEnum>;

export const VerificationSignalSchema = z.object({
  signalType: VerificationSignalTypeEnum,
  passed: z.boolean(),
  score: z.number().min(0).max(100),
  details: z.string().optional(),
  checkedAt: z.date(),
  // For directory signals, include the directory-specific data
  directoryData: z.object({
    directoryName: z.string(),
    listingUrl: z.string().url().optional(),
    certificationLevel: z.string().optional(),
    certifiedSince: z.date().optional(),
    expiresAt: z.date().optional(),
  }).optional(),
});
export type VerificationSignal = z.infer<typeof VerificationSignalSchema>;

export const VerificationResultSchema = z.object({
  vendorId: z.string().optional(),
  websiteUrl: z.string().url(),
  linkedInUrl: z.string().url().optional(),
  emailDomain: z.string(),

  // Individual signal results
  signals: z.array(VerificationSignalSchema),

  // Overall scoring
  totalScore: z.number().min(0).max(100),
  maxPossibleScore: z.number(),
  passThreshold: z.number(),

  // Final decision
  decision: z.enum(["APPROVED", "MANUAL_REVIEW", "REJECTED"]),
  decisionReason: z.string(),

  // Timestamps
  verifiedAt: z.date(),
  expiresAt: z.date().optional(),
});
export type VerificationResult = z.infer<typeof VerificationResultSchema>;

/**
 * EdTech Directory configuration
 * Each directory has different API access and verification levels
 */
export const EdTechDirectorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  apiEndpoint: z.string().url().optional(),
  apiKeyRequired: z.boolean().default(false),
  weight: z.number().min(0).max(100),
  requiredForPII: z.boolean().default(false),  // Must pass for PII access
  enabled: z.boolean().default(true),
});
export type EdTechDirectory = z.infer<typeof EdTechDirectorySchema>;

/**
 * Tiered verification requirements
 * Different tiers have different verification needs
 */
export const TierVerificationRequirementsSchema = z.object({
  tier: z.enum(["PRIVACY_SAFE", "SELECTIVE", "FULL_ACCESS"]),

  // Minimum score thresholds
  passThreshold: z.number().min(0).max(100),
  reviewThreshold: z.number().min(0).max(100),

  // Required checks (must all pass)
  requiredSignals: z.array(VerificationSignalTypeEnum),

  // Bonus checks (add to score but not required)
  bonusSignals: z.array(VerificationSignalTypeEnum),

  // Directory requirements
  minDirectoryListings: z.number().int().min(0).default(0),
  requiredDirectories: z.array(z.string()).default([]),  // Directory IDs that must pass

  // Human review requirements
  requiresManualReview: z.boolean().default(false),
  requiresContractReview: z.boolean().default(false),
});
export type TierVerificationRequirements = z.infer<typeof TierVerificationRequirementsSchema>;

/**
 * District-configurable verification thresholds
 * Each district can tune these based on their risk tolerance
 */
export const DistrictVerificationConfigSchema = z.object({
  districtId: z.string(),
  districtName: z.string(),

  // === Basic Configuration ===
  // Domain age requirements (in days)
  minDomainAgeDays: z.number().int().min(0).default(180),  // 6 months default

  // Feature toggles for basic tier
  requireSSL: z.boolean().default(true),
  requireDomainMatch: z.boolean().default(true),
  requireCompanyLinkedIn: z.boolean().default(false),

  // === Basic scoring weights (Privacy-Safe tier) ===
  weights: z.object({
    emailDomainMatch: z.number().min(0).max(100).default(30),
    websiteSSL: z.number().min(0).max(100).default(20),
    websiteAge: z.number().min(0).max(100).default(25),
    linkedInCompanyProfile: z.number().min(0).max(100).default(15),
    linkedInEmployeeCount: z.number().min(0).max(100).default(10),
  }),

  // === Enhanced Weights (for PII tier scoring) ===
  enhancedWeights: z.object({
    applicantLinkedInVerified: z.number().min(0).max(100).default(25),
    applicantEmailCorporate: z.number().min(0).max(100).default(10),
    directoryListing: z.number().min(0).max(100).default(15),  // Per directory
  }),

  // === Tier-specific requirements ===
  tierRequirements: z.object({
    privacySafe: TierVerificationRequirementsSchema,
    selective: TierVerificationRequirementsSchema,
    fullAccess: TierVerificationRequirementsSchema,
  }),

  // === Enabled EdTech directories ===
  enabledDirectories: z.array(z.string()),  // Directory IDs to check

  updatedAt: z.date(),
});
export type DistrictVerificationConfig = z.infer<typeof DistrictVerificationConfigSchema>;

/**
 * EdTech Directory Registry
 * These are the known directories we can verify against
 */
export const EDTECH_DIRECTORIES: EdTechDirectory[] = [
  {
    id: "1edtech",
    name: "1EdTech (IMS Global)",
    description: "LTI and OneRoster certification body. Vendors must pass conformance testing.",
    apiEndpoint: "https://www.1edtech.org/api/certified-products",
    apiKeyRequired: false,
    weight: 20,
    requiredForPII: false,
    enabled: true,
  },
  {
    id: "common_sense",
    name: "Common Sense Privacy Program",
    description: "Evaluates apps for privacy practices. Ratings from Pass to Warning.",
    apiEndpoint: "https://privacy.commonsense.org/api/products",
    apiKeyRequired: true,
    weight: 25,
    requiredForPII: true,  // Strong signal for PII access
    enabled: true,
  },
  {
    id: "sdpc",
    name: "Student Data Privacy Consortium",
    description: "National Data Privacy Agreement (NDPA) signatories.",
    apiEndpoint: "https://sdpc.a4l.org/api/vendors",
    apiKeyRequired: true,
    weight: 20,
    requiredForPII: false,
    enabled: true,
  },
  {
    id: "ikeepsafe",
    name: "iKeepSafe",
    description: "COPPA, FERPA, and CSPC certifications for EdTech.",
    apiEndpoint: "https://ikeepsafe.org/api/certified",
    apiKeyRequired: true,
    weight: 20,
    requiredForPII: false,
    enabled: true,
  },
  {
    id: "privacy_pledge",
    name: "Student Privacy Pledge",
    description: "Future of Privacy Forum commitment to student data privacy.",
    apiEndpoint: "https://studentprivacypledge.org/api/signatories",
    apiKeyRequired: false,
    weight: 15,
    requiredForPII: false,
    enabled: true,
  },
  {
    id: "clever",
    name: "Clever Certified",
    description: "Clever integration partner certification.",
    apiEndpoint: "https://clever.com/api/partners",
    apiKeyRequired: true,
    weight: 15,
    requiredForPII: false,
    enabled: true,
  },
  {
    id: "classlink",
    name: "ClassLink Certified",
    description: "ClassLink Roster Server and LaunchPad certified.",
    apiEndpoint: "https://classlink.com/api/partners",
    apiKeyRequired: true,
    weight: 15,
    requiredForPII: false,
    enabled: true,
  },
  {
    id: "ca_approved",
    name: "California State Approved",
    description: "Listed on California's approved vendor list for K-12.",
    weight: 20,
    requiredForPII: false,
    enabled: true,
    apiKeyRequired: false,
  },
];

/**
 * Default LAUSD verification configuration
 */
export const DEFAULT_VERIFICATION_CONFIG: DistrictVerificationConfig = {
  districtId: "lausd",
  districtName: "Los Angeles Unified School District",
  minDomainAgeDays: 180,
  requireSSL: true,
  requireDomainMatch: true,
  requireCompanyLinkedIn: false,

  weights: {
    emailDomainMatch: 30,
    websiteSSL: 20,
    websiteAge: 25,
    linkedInCompanyProfile: 15,
    linkedInEmployeeCount: 10,
  },

  enhancedWeights: {
    applicantLinkedInVerified: 25,
    applicantEmailCorporate: 10,
    directoryListing: 15,
  },

  tierRequirements: {
    // Privacy-Safe: Basic verification, auto-approval possible
    privacySafe: {
      tier: "PRIVACY_SAFE",
      passThreshold: 60,
      reviewThreshold: 40,
      requiredSignals: ["EMAIL_DOMAIN_MATCH", "WEBSITE_SSL"],
      bonusSignals: ["WEBSITE_AGE", "LINKEDIN_COMPANY_PROFILE", "LINKEDIN_EMPLOYEE_COUNT"],
      minDirectoryListings: 0,
      requiredDirectories: [],
      requiresManualReview: false,
      requiresContractReview: false,
    },
    // Selective: Enhanced verification, some PII access
    selective: {
      tier: "SELECTIVE",
      passThreshold: 75,
      reviewThreshold: 50,
      requiredSignals: [
        "EMAIL_DOMAIN_MATCH",
        "WEBSITE_SSL",
        "WEBSITE_AGE",
        "APPLICANT_LINKEDIN_VERIFIED",
      ],
      bonusSignals: [
        "LINKEDIN_COMPANY_PROFILE",
        "LINKEDIN_EMPLOYEE_COUNT",
        "DIRECTORY_COMMON_SENSE",
        "DIRECTORY_SDPC",
        "DIRECTORY_PRIVACY_PLEDGE",
      ],
      minDirectoryListings: 1,  // Must be in at least one directory
      requiredDirectories: [],
      requiresManualReview: true,
      requiresContractReview: false,
    },
    // Full Access: Strictest verification, full PII access
    fullAccess: {
      tier: "FULL_ACCESS",
      passThreshold: 85,
      reviewThreshold: 70,
      requiredSignals: [
        "EMAIL_DOMAIN_MATCH",
        "WEBSITE_SSL",
        "WEBSITE_AGE",
        "APPLICANT_LINKEDIN_VERIFIED",
        "APPLICANT_EMAIL_CORPORATE",
      ],
      bonusSignals: [
        "LINKEDIN_COMPANY_PROFILE",
        "LINKEDIN_EMPLOYEE_COUNT",
        "DIRECTORY_1EDTECH",
        "DIRECTORY_IKEEPSAFE",
      ],
      minDirectoryListings: 2,  // Must be in at least two directories
      requiredDirectories: ["common_sense"],  // Common Sense required
      requiresManualReview: true,
      requiresContractReview: true,  // Requires legal review
    },
  },

  enabledDirectories: [
    "1edtech",
    "common_sense",
    "sdpc",
    "ikeepsafe",
    "privacy_pledge",
    "clever",
    "classlink",
    "ca_approved",
  ],

  updatedAt: new Date(),
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Creates a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: ApiResponse<T>["meta"]
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: meta ?? { timestamp: new Date() },
  };
}

/**
 * Creates an error API response
 */
export function createErrorResponse<T>(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiResponse<T> {
  return {
    success: false,
    error: { code, message, details },
    meta: { timestamp: new Date() },
  };
}
