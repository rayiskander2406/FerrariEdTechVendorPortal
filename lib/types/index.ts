import { z } from "zod";

// =============================================================================
// ENUMS
// =============================================================================

export const AccessTierEnum = z.enum(["TOKEN_ONLY", "SELECTIVE", "FULL_ACCESS"]);
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
