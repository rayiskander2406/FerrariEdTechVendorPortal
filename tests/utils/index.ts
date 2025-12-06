/**
 * Shared Test Utilities
 *
 * Provides:
 * - Unique ID generation for test isolation
 * - Test data factories (vendors, API keys, etc.)
 * - Cleanup helpers with proper FK ordering
 * - TestDataTracker for automatic cleanup
 */

import { prisma } from '@/lib/db';
import { generateApiKey } from '@/lib/auth/api-keys';
import type { Vendor, ApiKey } from '@prisma/client';

// =============================================================================
// UNIQUE ID GENERATION
// =============================================================================

let idCounter = 0;

/**
 * Generates a unique test ID for database entities.
 * Uses a combination of prefix, timestamp, and counter to ensure uniqueness.
 */
export function createTestId(resourceType: string): string {
  idCounter++;
  const timestamp = Date.now().toString(36);
  const counter = idCounter.toString(36).padStart(4, '0');
  const random = Math.random().toString(36).substring(2, 6);

  return `test-${resourceType}-${timestamp}-${counter}-${random}`;
}

/**
 * Resets the ID counter (for testing the utility itself)
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

// =============================================================================
// TEST DATA TRACKER
// =============================================================================

/**
 * Tracks all test data created during a test for cleanup.
 * Ensures data is cleaned up in the correct order (FK constraints).
 */
export class TestDataTracker {
  private vendors: string[] = [];
  private apiKeys: string[] = [];
  private sessions: string[] = [];
  private auditLogs: string[] = [];
  private messages: string[] = [];

  trackVendor(id: string): void {
    this.vendors.push(id);
  }

  trackApiKey(id: string): void {
    this.apiKeys.push(id);
  }

  trackSession(id: string): void {
    this.sessions.push(id);
  }

  trackAuditLog(id: string): void {
    this.auditLogs.push(id);
  }

  trackMessage(id: string): void {
    this.messages.push(id);
  }

  getVendors(): string[] {
    return [...this.vendors];
  }

  getApiKeys(): string[] {
    return [...this.apiKeys];
  }

  getSessions(): string[] {
    return [...this.sessions];
  }

  getAuditLogs(): string[] {
    return [...this.auditLogs];
  }

  getMessages(): string[] {
    return [...this.messages];
  }

  clear(): void {
    this.vendors = [];
    this.apiKeys = [];
    this.sessions = [];
    this.auditLogs = [];
    this.messages = [];
  }
}

// =============================================================================
// TEST VENDOR FACTORY
// =============================================================================

export interface CreateTestVendorOptions {
  tracker: TestDataTracker;
  overrides?: Partial<{
    id: string;
    name: string;
    contactEmail: string;
    contactName: string;
    defaultAccessTier: string;
    podsStatus: string;
    website: string;
  }>;
}

/**
 * Creates a test vendor with unique ID and email.
 */
export async function createTestVendor(options: CreateTestVendorOptions): Promise<Vendor> {
  const id = options.overrides?.id ?? createTestId('vendor');
  const email = options.overrides?.contactEmail ?? `${id}@test.local`;

  const vendor = await prisma.vendor.create({
    data: {
      id,
      name: options.overrides?.name ?? `Test Vendor ${id.substring(0, 20)}`,
      contactEmail: email,
      contactName: options.overrides?.contactName ?? 'Test Contact',
      defaultAccessTier: options.overrides?.defaultAccessTier ?? 'PRIVACY_SAFE',
      podsStatus: options.overrides?.podsStatus ?? 'NOT_STARTED',
      website: options.overrides?.website,
    },
  });

  options.tracker.trackVendor(vendor.id);

  return vendor;
}

// =============================================================================
// TEST API KEY FACTORY
// =============================================================================

export interface CreateTestApiKeyOptions {
  vendorId: string;
  tracker: TestDataTracker;
  scopes?: string[];
  name?: string;
}

export interface TestApiKeyResult {
  id: string;
  key: string;
  prefix: string;
  hash: string;
  scopes: string[];
  vendorId: string;
}

/**
 * Creates a test API key for a vendor.
 */
export async function createTestApiKey(options: CreateTestApiKeyOptions): Promise<TestApiKeyResult> {
  const generated = await generateApiKey();
  const scopes = options.scopes ?? ['read', 'write'];

  const apiKey = await prisma.apiKey.create({
    data: {
      vendorId: options.vendorId,
      keyPrefix: generated.prefix,
      keyHash: generated.hash,
      name: options.name ?? `Test Key ${createTestId('key').substring(0, 20)}`,
      scopes,
    },
  });

  options.tracker.trackApiKey(apiKey.id);

  return {
    id: apiKey.id,
    key: generated.key,
    prefix: generated.prefix,
    hash: generated.hash,
    scopes,
    vendorId: options.vendorId,
  };
}

// =============================================================================
// WITH TEST VENDOR (CONVENIENCE WRAPPER)
// =============================================================================

export interface WithTestVendorOptions {
  withApiKey?: boolean;
  scopes?: string[];
  tracker?: TestDataTracker;
  vendorOverrides?: CreateTestVendorOptions['overrides'];
}

/**
 * Creates a test vendor (and optionally API key), runs the callback, then cleans up.
 * Useful for single-test scenarios where you need isolated data.
 */
export async function withTestVendor<T>(
  callback: (vendor: Vendor, apiKey?: TestApiKeyResult) => Promise<T>,
  options: WithTestVendorOptions = {}
): Promise<T> {
  const tracker = options.tracker ?? new TestDataTracker();

  try {
    const vendor = await createTestVendor({
      tracker,
      overrides: options.vendorOverrides,
    });

    let apiKey: TestApiKeyResult | undefined;
    if (options.withApiKey) {
      apiKey = await createTestApiKey({
        vendorId: vendor.id,
        tracker,
        scopes: options.scopes,
      });
    }

    return await callback(vendor, apiKey);
  } finally {
    await cleanupTestData(tracker);
  }
}

// =============================================================================
// CLEANUP HELPERS
// =============================================================================

/**
 * Cleans up all test data tracked by the tracker.
 * Deletes in FK-safe order: messages, audit logs, sessions, API keys, vendors
 */
export async function cleanupTestData(tracker: TestDataTracker): Promise<void> {
  const messages = tracker.getMessages();
  const auditLogs = tracker.getAuditLogs();
  const sessions = tracker.getSessions();
  const apiKeys = tracker.getApiKeys();
  const vendors = tracker.getVendors();

  // Delete in order respecting foreign key constraints
  // Messages first (may reference other tables)
  if (messages.length > 0) {
    try {
      await prisma.communicationMessage.deleteMany({
        where: { id: { in: messages } },
      });
    } catch {
      // Ignore errors for non-existent records
    }
  }

  // Audit logs
  if (auditLogs.length > 0) {
    try {
      await prisma.auditLog.deleteMany({
        where: { id: { in: auditLogs } },
      });
    } catch {
      // Ignore errors for non-existent records
    }
  }

  // Sessions
  if (sessions.length > 0) {
    try {
      await prisma.vendorSession.deleteMany({
        where: { id: { in: sessions } },
      });
    } catch {
      // Ignore errors for non-existent records
    }
  }

  // API keys (before vendors)
  if (apiKeys.length > 0) {
    try {
      await prisma.apiKey.deleteMany({
        where: { id: { in: apiKeys } },
      });
    } catch {
      // Ignore errors for non-existent records
    }
  }

  // Vendors last
  if (vendors.length > 0) {
    try {
      await prisma.vendor.deleteMany({
        where: { id: { in: vendors } },
      });
    } catch {
      // Ignore errors for non-existent records
    }
  }

  // Clear the tracker
  tracker.clear();
}

// =============================================================================
// INTEGRATION TEST HELPERS
// =============================================================================

export interface ServerStatus {
  available: boolean;
  url: string;
}

/**
 * Checks if the development server is running.
 */
export async function checkServerAvailability(
  baseUrl: string = 'http://localhost:3000'
): Promise<ServerStatus> {
  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return { available: response.ok, url: baseUrl };
  } catch {
    return { available: false, url: baseUrl };
  }
}

/**
 * Creates a describe block that skips when server is unavailable.
 */
export function describeWithServer(
  name: string,
  fn: () => void,
  options: { skip?: boolean } = {}
): void {
  if (options.skip || process.env.SKIP_INTEGRATION_TESTS === 'true') {
    describe.skip(name, fn);
  } else {
    describe(name, fn);
  }
}

// =============================================================================
// RE-EXPORTS FOR CONVENIENCE
// =============================================================================

export { prisma } from '@/lib/db';
