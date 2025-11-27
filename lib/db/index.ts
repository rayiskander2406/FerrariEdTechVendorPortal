/**
 * Database Layer - Prisma-like interface with in-memory mock mode
 *
 * When USE_MOCK_DB=true (default), uses in-memory Map storage.
 * Designed to be easily swapped with real Prisma client when needed.
 */

import {
  type Vendor,
  type SandboxCredentials,
  type AuditLog,
  type PodsLiteInput,
  type AccessTier,
  type PodsStatus,
  type SandboxStatus,
} from "@/lib/types";

// =============================================================================
// CONFIGURATION
// =============================================================================

const USE_MOCK_DB = process.env.USE_MOCK_DB !== "false";

// =============================================================================
// IN-MEMORY STORES
// =============================================================================

const vendorStore = new Map<string, Vendor>();
const sandboxStore = new Map<string, SandboxCredentials>();
const auditStore: AuditLog[] = [];

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
  return `sk_test_${randomHex(16)}`;
}

/**
 * Generate an API secret
 */
function generateSecret(): string {
  return randomHex(32);
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
  if (!USE_MOCK_DB) {
    throw new Error("Real database not implemented yet");
  }

  const now = new Date();
  const id = generateUuid();

  // Determine access tier based on data elements requested
  // TOKEN_ONLY if no sensitive PII requested
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

  const accessTier: AccessTier = data.accessTier ?? (requestsSensitive ? "SELECTIVE" : "TOKEN_ONLY");

  // TOKEN_ONLY gets auto-approved, others need review
  const podsStatus: PodsStatus = accessTier === "TOKEN_ONLY" ? "APPROVED" : "PENDING_REVIEW";

  const vendor: Vendor = {
    id,
    name: data.podsLiteInput.vendorName,
    contactEmail: data.podsLiteInput.contactEmail,
    contactName: data.podsLiteInput.contactName,
    website: undefined,
    description: data.podsLiteInput.applicationDescription,
    accessTier,
    podsStatus,
    podsApplicationId: `PODS-${now.getFullYear()}-${String(vendorStore.size + 1).padStart(3, "0")}`,
    createdAt: now,
    updatedAt: now,
  };

  vendorStore.set(id, vendor);

  // Log the creation
  await logAuditEvent({
    vendorId: id,
    action: "VENDOR_CREATED",
    resourceType: "vendor",
    resourceId: id,
    details: {
      vendorName: vendor.name,
      accessTier: vendor.accessTier,
      podsStatus: vendor.podsStatus,
    },
  });

  return vendor;
}

/**
 * Get a vendor by ID
 */
export async function getVendor(id: string): Promise<Vendor | null> {
  if (!USE_MOCK_DB) {
    throw new Error("Real database not implemented yet");
  }

  return vendorStore.get(id) ?? null;
}

/**
 * Get a vendor by email
 */
export async function getVendorByEmail(email: string): Promise<Vendor | null> {
  if (!USE_MOCK_DB) {
    throw new Error("Real database not implemented yet");
  }

  const vendors = Array.from(vendorStore.values());
  for (const vendor of vendors) {
    if (vendor.contactEmail === email) {
      return vendor;
    }
  }

  return null;
}

/**
 * Update a vendor
 */
export async function updateVendor(
  id: string,
  data: Partial<Omit<Vendor, "id" | "createdAt">>
): Promise<Vendor | null> {
  if (!USE_MOCK_DB) {
    throw new Error("Real database not implemented yet");
  }

  const existing = vendorStore.get(id);
  if (!existing) {
    return null;
  }

  const updated: Vendor = {
    ...existing,
    ...data,
    updatedAt: new Date(),
  };

  vendorStore.set(id, updated);

  await logAuditEvent({
    vendorId: id,
    action: "VENDOR_UPDATED",
    resourceType: "vendor",
    resourceId: id,
    details: { updatedFields: Object.keys(data) },
  });

  return updated;
}

/**
 * List all vendors
 */
export async function listVendors(): Promise<Vendor[]> {
  if (!USE_MOCK_DB) {
    throw new Error("Real database not implemented yet");
  }

  return Array.from(vendorStore.values());
}

// =============================================================================
// SANDBOX FUNCTIONS
// =============================================================================

/**
 * Create sandbox credentials for a vendor
 */
export async function createSandbox(vendorId: string): Promise<SandboxCredentials> {
  if (!USE_MOCK_DB) {
    throw new Error("Real database not implemented yet");
  }

  const vendor = await getVendor(vendorId);
  if (!vendor) {
    throw new Error(`Vendor not found: ${vendorId}`);
  }

  // Check if vendor is approved
  if (vendor.podsStatus !== "APPROVED") {
    throw new Error(`Vendor must be approved to create sandbox. Current status: ${vendor.podsStatus}`);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

  const sandbox: SandboxCredentials = {
    id: generateUuid(),
    vendorId,
    apiKey: generateApiKey(),
    apiSecret: generateSecret(),
    baseUrl: "https://sandbox.api.lausd.net/oneroster/v1.2",
    environment: "sandbox",
    status: "ACTIVE" as SandboxStatus,
    expiresAt,
    createdAt: now,
    lastUsedAt: undefined,
    rateLimitPerMinute: 60,
    allowedEndpoints: ["/users", "/orgs", "/classes", "/enrollments", "/courses"],
  };

  sandboxStore.set(vendorId, sandbox);

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

  return sandbox;
}

/**
 * Get sandbox credentials for a vendor
 */
export async function getSandbox(vendorId: string): Promise<SandboxCredentials | null> {
  if (!USE_MOCK_DB) {
    throw new Error("Real database not implemented yet");
  }

  return sandboxStore.get(vendorId) ?? null;
}

/**
 * Update sandbox last used timestamp
 */
export async function updateSandboxLastUsed(vendorId: string): Promise<void> {
  if (!USE_MOCK_DB) {
    throw new Error("Real database not implemented yet");
  }

  const sandbox = sandboxStore.get(vendorId);
  if (sandbox) {
    sandbox.lastUsedAt = new Date();
    sandboxStore.set(vendorId, sandbox);
  }
}

/**
 * Revoke sandbox credentials
 */
export async function revokeSandbox(vendorId: string): Promise<SandboxCredentials | null> {
  if (!USE_MOCK_DB) {
    throw new Error("Real database not implemented yet");
  }

  const sandbox = sandboxStore.get(vendorId);
  if (!sandbox) {
    return null;
  }

  sandbox.status = "REVOKED";
  sandboxStore.set(vendorId, sandbox);

  await logAuditEvent({
    vendorId,
    action: "SANDBOX_REVOKED",
    resourceType: "sandbox",
    resourceId: sandbox.id,
    details: {},
  });

  return sandbox;
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
  if (!USE_MOCK_DB) {
    throw new Error("Real database not implemented yet");
  }

  const auditLog: AuditLog = {
    id: generateUuid(),
    vendorId: event.vendorId,
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    details: event.details,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    timestamp: new Date(),
  };

  auditStore.push(auditLog);

  return auditLog;
}

/**
 * Get audit logs for a vendor
 */
export async function getAuditLogs(
  vendorId: string,
  limit: number = 100
): Promise<AuditLog[]> {
  if (!USE_MOCK_DB) {
    throw new Error("Real database not implemented yet");
  }

  return auditStore
    .filter((log) => log.vendorId === vendorId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

/**
 * Get all audit logs (admin only)
 */
export async function getAllAuditLogs(limit: number = 1000): Promise<AuditLog[]> {
  if (!USE_MOCK_DB) {
    throw new Error("Real database not implemented yet");
  }

  return auditStore
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

// =============================================================================
// DATABASE UTILITIES
// =============================================================================

/**
 * Clear all stores (useful for testing)
 */
export function clearAllStores(): void {
  vendorStore.clear();
  sandboxStore.clear();
  auditStore.length = 0;
}

/**
 * Get database stats
 */
export function getDbStats(): {
  vendors: number;
  sandboxes: number;
  auditLogs: number;
} {
  return {
    vendors: vendorStore.size,
    sandboxes: sandboxStore.size,
    auditLogs: auditStore.length,
  };
}

/**
 * Check if running in mock mode
 */
export function isMockMode(): boolean {
  return USE_MOCK_DB;
}

// =============================================================================
// SEED DATA (for development)
// =============================================================================

/**
 * Seed the database with sample data
 */
export async function seedDatabase(): Promise<void> {
  if (!USE_MOCK_DB) {
    throw new Error("Seeding only available in mock mode");
  }

  // Only seed if empty
  if (vendorStore.size > 0) {
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
      applicationDescription: "A demonstration EdTech application for LAUSD integration testing",
      dataElementsRequested: ["STUDENT_ID", "FIRST_NAME", "GRADE_LEVEL", "SCHOOL_ID", "CLASS_ROSTER"],
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
