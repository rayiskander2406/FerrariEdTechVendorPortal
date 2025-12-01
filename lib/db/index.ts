/**
 * Database Layer - Pure Prisma Implementation
 *
 * Uses SQLite for development, PostgreSQL for production.
 * All data persists to disk - no more globalThis memory isolation issues.
 *
 * Migration from v1.0-hardening:
 * - Removed MockDbService class
 * - Removed globalThis.__mockDb patterns
 * - Pure Prisma queries for all operations
 */

import { PrismaClient } from "@prisma/client";
import {
  type Vendor,
  type SandboxCredentials,
  type AuditLog,
  type PodsLiteInput,
  type AccessTier,
  type PodsStatus,
  type SandboxStatus,
  type PodsApplication,
} from "@/lib/types";
import { validateEndpoints } from "@/lib/config/oneroster";

// =============================================================================
// PRISMA CLIENT SINGLETON
// =============================================================================

/**
 * PrismaClient singleton pattern for Next.js
 * Prevents too many connections during development hot reloads
 *
 * For tests: Uses test.db to avoid polluting dev.db
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  __testDb?: boolean;
};

// Determine if we're in test mode
const isTest = process.env.NODE_ENV === "test" || process.env.VITEST === "true";

// In test mode, use test database. Vitest sets DATABASE_URL via env config.
// The globalForPrisma cache is separate per test run since Vitest resets globalThis.
const createPrismaClient = () => {
  // If test mode and DATABASE_URL points to dev.db, switch to test.db
  if (isTest && process.env.DATABASE_URL?.includes("dev.db")) {
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace("dev.db", "test.db");
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate a random hex string of specified length
 * Uses Web Crypto API for edge runtime compatibility
 */
function randomHex(bytes: number): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a UUID v4
 */
function generateUuid(): string {
  return crypto.randomUUID();
}

/**
 * Generate a test API key
 */
function generateApiKey(): string {
  return `sbox_test_${randomHex(16)}`;
}

/**
 * Generate an API secret
 */
function generateSecret(): string {
  return randomHex(32);
}

// =============================================================================
// TYPE CONVERTERS (Prisma <-> App Types)
// =============================================================================

/**
 * Convert Prisma Vendor to App Vendor type
 */
function toVendor(prismaVendor: {
  id: string;
  name: string;
  contactEmail: string;
  contactName: string;
  website: string | null;
  description: string | null;
  accessTier: string;
  podsStatus: string;
  podsApplicationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Vendor {
  return {
    id: prismaVendor.id,
    name: prismaVendor.name,
    contactEmail: prismaVendor.contactEmail,
    contactName: prismaVendor.contactName,
    website: prismaVendor.website ?? undefined,
    description: prismaVendor.description ?? undefined,
    accessTier: prismaVendor.accessTier as AccessTier,
    podsStatus: prismaVendor.podsStatus as PodsStatus,
    podsApplicationId: prismaVendor.podsApplicationId ?? undefined,
    createdAt: prismaVendor.createdAt,
    updatedAt: prismaVendor.updatedAt,
  };
}

/**
 * Convert Prisma SandboxCredentials to App SandboxCredentials type
 */
function toSandboxCredentials(prismaSandbox: {
  id: string;
  vendorId: string;
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  environment: string;
  status: string;
  rateLimitPerMinute: number;
  allowedEndpoints: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date | null;
}): SandboxCredentials {
  return {
    id: prismaSandbox.id,
    vendorId: prismaSandbox.vendorId,
    apiKey: prismaSandbox.apiKey,
    apiSecret: prismaSandbox.apiSecret,
    baseUrl: prismaSandbox.baseUrl,
    environment: prismaSandbox.environment as "sandbox" | "production",
    status: prismaSandbox.status as SandboxStatus,
    rateLimitPerMinute: prismaSandbox.rateLimitPerMinute,
    allowedEndpoints: JSON.parse(prismaSandbox.allowedEndpoints),
    expiresAt: prismaSandbox.expiresAt,
    createdAt: prismaSandbox.createdAt,
    lastUsedAt: prismaSandbox.lastUsedAt ?? undefined,
  };
}

/**
 * Convert Prisma AuditLog to App AuditLog type
 */
function toAuditLog(prismaLog: {
  id: string;
  vendorId: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
}): AuditLog {
  return {
    id: prismaLog.id,
    vendorId: prismaLog.vendorId,
    action: prismaLog.action,
    resourceType: prismaLog.resourceType,
    resourceId: prismaLog.resourceId ?? undefined,
    details: prismaLog.details ? JSON.parse(prismaLog.details) : undefined,
    ipAddress: prismaLog.ipAddress ?? undefined,
    userAgent: prismaLog.userAgent ?? undefined,
    timestamp: prismaLog.timestamp,
  };
}

/**
 * Convert Prisma PodsApplication to App PodsApplication type
 */
function toPodsApplication(prismaApp: {
  id: string;
  vendorName: string;
  applicationName: string;
  contactEmail: string;
  status: string;
  accessTier: string;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  expiresAt: Date | null;
}): PodsApplication {
  return {
    id: prismaApp.id,
    vendorName: prismaApp.vendorName,
    applicationName: prismaApp.applicationName,
    contactEmail: prismaApp.contactEmail,
    status: prismaApp.status as PodsStatus,
    accessTier: prismaApp.accessTier as AccessTier,
    submittedAt: prismaApp.submittedAt,
    reviewedAt: prismaApp.reviewedAt,
    expiresAt: prismaApp.expiresAt,
  };
}

// =============================================================================
// VENDOR FUNCTIONS
// =============================================================================

export interface CreateVendorInput {
  podsLiteInput: PodsLiteInput;
  accessTier?: AccessTier;
}

/**
 * Create a new vendor from PoDS-Lite application
 */
export async function createVendor(data: CreateVendorInput): Promise<Vendor> {
  // Determine access tier based on data elements requested
  const sensitiveElements = [
    "LAST_NAME",
    "EMAIL",
    "PHONE",
    "ADDRESS",
    "DEMOGRAPHICS",
    "SPECIAL_ED",
  ];
  const requestsSensitive = data.podsLiteInput.dataElementsRequested.some((el) =>
    sensitiveElements.includes(el)
  );

  const accessTier: AccessTier =
    data.accessTier ?? (requestsSensitive ? "SELECTIVE" : "PRIVACY_SAFE");

  // PRIVACY_SAFE gets auto-approved, others need review
  const podsStatus: PodsStatus =
    accessTier === "PRIVACY_SAFE" ? "APPROVED" : "PENDING_REVIEW";

  // Get count for application ID
  const count = await prisma.vendor.count();

  const vendor = await prisma.vendor.create({
    data: {
      name: data.podsLiteInput.vendorName,
      contactEmail: data.podsLiteInput.contactEmail,
      contactName: data.podsLiteInput.contactName,
      website: data.podsLiteInput.websiteUrl,
      description: data.podsLiteInput.applicationDescription,
      accessTier,
      podsStatus,
      podsApplicationId: `PODS-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`,
    },
  });

  // Log the creation
  await logAuditEvent({
    vendorId: vendor.id,
    action: "VENDOR_CREATED",
    resourceType: "vendor",
    resourceId: vendor.id,
    details: {
      vendorName: vendor.name,
      accessTier: vendor.accessTier,
      podsStatus: vendor.podsStatus,
    },
  });

  return toVendor(vendor);
}

/**
 * Get a vendor by ID
 */
export async function getVendor(id: string): Promise<Vendor | null> {
  const vendor = await prisma.vendor.findUnique({
    where: { id },
  });

  return vendor ? toVendor(vendor) : null;
}

/**
 * Get a vendor by email
 */
export async function getVendorByEmail(email: string): Promise<Vendor | null> {
  const vendor = await prisma.vendor.findUnique({
    where: { contactEmail: email },
  });

  return vendor ? toVendor(vendor) : null;
}

/**
 * Update a vendor
 */
export async function updateVendor(
  id: string,
  data: Partial<Omit<Vendor, "id" | "createdAt">>
): Promise<Vendor | null> {
  try {
    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    await logAuditEvent({
      vendorId: id,
      action: "VENDOR_UPDATED",
      resourceType: "vendor",
      resourceId: id,
      details: { updatedFields: Object.keys(data) },
    });

    return toVendor(vendor);
  } catch {
    return null;
  }
}

/**
 * List all vendors
 */
export async function listVendors(): Promise<Vendor[]> {
  const vendors = await prisma.vendor.findMany({
    orderBy: { createdAt: "desc" },
  });

  return vendors.map(toVendor);
}

// =============================================================================
// SANDBOX FUNCTIONS
// =============================================================================

/**
 * Create sandbox credentials for a vendor
 * @param vendorId - The vendor's ID
 * @param requestedEndpoints - Optional array of OneRoster endpoints the vendor requested
 */
export async function createSandbox(
  vendorId: string,
  requestedEndpoints?: string[]
): Promise<SandboxCredentials> {
  const vendor = await getVendor(vendorId);
  if (!vendor) {
    throw new Error(`Vendor not found: ${vendorId}`);
  }

  // Check if vendor is approved
  if (vendor.podsStatus !== "APPROVED") {
    throw new Error(
      `Vendor must be approved to create sandbox. Current status: ${vendor.podsStatus}`
    );
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

  // Use centralized endpoint validation
  const allowedEndpoints = validateEndpoints(requestedEndpoints);

  const sandbox = await prisma.sandboxCredentials.create({
    data: {
      vendorId,
      apiKey: generateApiKey(),
      apiSecret: generateSecret(),
      baseUrl: "https://sandbox.api.lausd.net/oneroster/v1.2",
      environment: "sandbox",
      status: "ACTIVE",
      expiresAt,
      rateLimitPerMinute: 60,
      allowedEndpoints: JSON.stringify(allowedEndpoints),
    },
  });

  await logAuditEvent({
    vendorId,
    action: "SANDBOX_CREATED",
    resourceType: "sandbox",
    resourceId: sandbox.id,
    details: {
      environment: sandbox.environment,
      expiresAt: sandbox.expiresAt.toISOString(),
    },
  });

  return toSandboxCredentials(sandbox);
}

/**
 * Get sandbox credentials for a vendor
 */
export async function getSandbox(
  vendorId: string
): Promise<SandboxCredentials | null> {
  const sandbox = await prisma.sandboxCredentials.findUnique({
    where: { vendorId },
  });

  return sandbox ? toSandboxCredentials(sandbox) : null;
}

/**
 * Update sandbox last used timestamp
 */
export async function updateSandboxLastUsed(vendorId: string): Promise<void> {
  try {
    await prisma.sandboxCredentials.update({
      where: { vendorId },
      data: { lastUsedAt: new Date() },
    });
  } catch {
    // Gracefully handle non-existent sandbox
  }
}

/**
 * Update sandbox allowed endpoints
 * @param vendorId - The vendor's ID
 * @param endpoints - Array of OneRoster endpoints to allow
 * @param mode - "replace" replaces all endpoints, "add" adds to existing
 */
export async function updateSandboxEndpoints(
  vendorId: string,
  endpoints: string[],
  mode: "replace" | "add" = "add"
): Promise<SandboxCredentials | null> {
  try {
    const existingSandbox = await getSandbox(vendorId);
    if (!existingSandbox) {
      return null;
    }

    // Validate endpoints using centralized config
    const validatedEndpoints = validateEndpoints(endpoints);

    // Determine final endpoints based on mode
    let finalEndpoints: string[];
    if (mode === "add") {
      // Merge existing with new, deduplicate
      const merged = new Set([
        ...existingSandbox.allowedEndpoints,
        ...validatedEndpoints,
      ]);
      finalEndpoints = Array.from(merged);
    } else {
      finalEndpoints = validatedEndpoints;
    }

    const sandbox = await prisma.sandboxCredentials.update({
      where: { vendorId },
      data: { allowedEndpoints: JSON.stringify(finalEndpoints) },
    });

    await logAuditEvent({
      vendorId,
      action: "SANDBOX_ENDPOINTS_UPDATED",
      resourceType: "sandbox",
      resourceId: sandbox.id,
      details: {
        mode,
        previousEndpoints: existingSandbox.allowedEndpoints,
        newEndpoints: finalEndpoints,
      },
    });

    return toSandboxCredentials(sandbox);
  } catch {
    return null;
  }
}

/**
 * Revoke sandbox credentials
 */
export async function revokeSandbox(
  vendorId: string
): Promise<SandboxCredentials | null> {
  try {
    const sandbox = await prisma.sandboxCredentials.update({
      where: { vendorId },
      data: { status: "REVOKED" },
    });

    await logAuditEvent({
      vendorId,
      action: "SANDBOX_REVOKED",
      resourceType: "sandbox",
      resourceId: sandbox.id,
      details: {},
    });

    return toSandboxCredentials(sandbox);
  } catch {
    return null;
  }
}

// =============================================================================
// AUDIT LOG FUNCTIONS
// =============================================================================

export interface AuditEventInput {
  vendorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(event: AuditEventInput): Promise<AuditLog> {
  const auditLog = await prisma.auditLog.create({
    data: {
      vendorId: event.vendorId,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      details: event.details ? JSON.stringify(event.details) : null,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    },
  });

  return toAuditLog(auditLog);
}

/**
 * Get audit logs for a vendor
 */
export async function getAuditLogs(
  vendorId: string,
  limit: number = 100
): Promise<AuditLog[]> {
  const logs = await prisma.auditLog.findMany({
    where: { vendorId },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  return logs.map(toAuditLog);
}

/**
 * Get all audit logs (admin only)
 */
export async function getAllAuditLogs(limit: number = 1000): Promise<AuditLog[]> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  return logs.map(toAuditLog);
}

// =============================================================================
// PODS APPLICATION FUNCTIONS
// =============================================================================

/**
 * Add or update a PoDS application
 * Uses upsert pattern to handle ID collisions gracefully
 */
export async function addPodsApplication(
  application: PodsApplication
): Promise<PodsApplication> {
  // First check if there's an existing application by vendor+app name (business key)
  const existingByName = await prisma.podsApplication.findFirst({
    where: {
      AND: [
        { vendorName: application.vendorName },
        { applicationName: application.applicationName },
      ],
    },
  });

  if (existingByName) {
    // Update existing application found by business key
    const updated = await prisma.podsApplication.update({
      where: { id: existingByName.id },
      data: {
        contactEmail: application.contactEmail,
        status: application.status,
        accessTier: application.accessTier,
        submittedAt: application.submittedAt,
        reviewedAt: application.reviewedAt,
        expiresAt: application.expiresAt,
      },
    });
    return toPodsApplication(updated);
  }

  // Use upsert on ID to handle ID collisions (e.g., from synthetic data)
  const result = await prisma.podsApplication.upsert({
    where: { id: application.id },
    update: {
      vendorName: application.vendorName,
      applicationName: application.applicationName,
      contactEmail: application.contactEmail,
      status: application.status,
      accessTier: application.accessTier,
      submittedAt: application.submittedAt,
      reviewedAt: application.reviewedAt,
      expiresAt: application.expiresAt,
    },
    create: {
      id: application.id,
      vendorName: application.vendorName,
      applicationName: application.applicationName,
      contactEmail: application.contactEmail,
      status: application.status,
      accessTier: application.accessTier,
      submittedAt: application.submittedAt,
      reviewedAt: application.reviewedAt,
      expiresAt: application.expiresAt,
    },
  });

  // Note: We skip audit logging here because PoDS applications don't have
  // a vendor ID yet - the PoDS application is the process to become a vendor.
  // The application itself serves as the audit trail.

  return toPodsApplication(result);
}

/**
 * Get a PoDS application by ID
 */
export async function getPodsApplication(
  id: string
): Promise<PodsApplication | null> {
  const app = await prisma.podsApplication.findUnique({
    where: { id },
  });

  return app ? toPodsApplication(app) : null;
}

/**
 * Get a PoDS application by vendor name
 */
export async function getPodsApplicationByVendor(
  vendorName: string
): Promise<PodsApplication | null> {
  const app = await prisma.podsApplication.findFirst({
    where: {
      vendorName: vendorName,
    },
  });

  return app ? toPodsApplication(app) : null;
}

/**
 * List all PoDS applications
 */
export async function listPodsApplications(): Promise<PodsApplication[]> {
  const apps = await prisma.podsApplication.findMany({
    orderBy: { submittedAt: "desc" },
  });

  return apps.map(toPodsApplication);
}

/**
 * Clear all PoDS applications (for testing)
 */
export async function clearPodsApplications(): Promise<void> {
  await prisma.podsApplication.deleteMany({});
}

// =============================================================================
// DATABASE UTILITIES
// =============================================================================

/**
 * Database statistics for monitoring
 */
export interface DbStats {
  vendors: number;
  sandboxes: number;
  auditLogs: number;
  podsApplications: number;
  initialized: boolean;
}

/**
 * Clear all stores (useful for testing)
 */
export async function clearAllStores(): Promise<void> {
  // Delete in order to respect foreign key constraints
  await prisma.communicationMessage.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.integrationConfig.deleteMany({});
  await prisma.sandboxCredentials.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.podsApplication.deleteMany({});
}

/**
 * Get database stats
 */
export async function getDbStats(): Promise<DbStats> {
  const [vendors, sandboxes, auditLogs, podsApplications] = await Promise.all([
    prisma.vendor.count(),
    prisma.sandboxCredentials.count(),
    prisma.auditLog.count(),
    prisma.podsApplication.count(),
  ]);

  return {
    vendors,
    sandboxes,
    auditLogs,
    podsApplications,
    initialized: true,
  };
}

/**
 * Check if running in mock mode (legacy - always false now)
 */
export function isMockMode(): boolean {
  return false;
}

// =============================================================================
// SEED DATA (for development)
// =============================================================================

/**
 * Seed the database with sample data
 */
export async function seedDatabase(): Promise<void> {
  // Only seed if empty
  const vendorCount = await prisma.vendor.count();
  if (vendorCount > 0) {
    return;
  }

  // Create sample vendor
  const sampleVendor = await createVendor({
    podsLiteInput: {
      vendorName: "Demo EdTech Vendor",
      contactEmail: "demo@edtechvendor.com",
      contactName: "Demo User",
      contactPhone: "555-0100",
      applicationName: "Demo Learning App",
      applicationDescription:
        "A demonstration EdTech application for LAUSD integration testing",
      dataElementsRequested: [
        "STUDENT_ID",
        "FIRST_NAME",
        "GRADE_LEVEL",
        "SCHOOL_ID",
        "CLASS_ROSTER",
      ],
      dataPurpose: "Provide personalized learning experiences for students",
      dataRetentionDays: 365,
      integrationMethod: "ONEROSTER_API",
      thirdPartySharing: false,
      thirdPartyDetails: undefined,
      hasSOC2: true,
      hasFERPACertification: true,
      encryptsDataAtRest: true,
      encryptsDataInTransit: true,
      breachNotificationHours: 24,
      coppaCompliant: true,
      acceptsTerms: true,
      acceptsDataDeletion: true,
    },
  });

  // Create sandbox for the sample vendor
  await createSandbox(sampleVendor.id);

  console.log(`[DB] Seeded database with sample vendor: ${sampleVendor.id}`);
}
