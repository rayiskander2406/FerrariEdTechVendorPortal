/**
 * Test script to verify database functions
 * Run with: npx tsx tests/db.test.ts
 */

import {
  createVendor,
  getVendor,
  createSandbox,
  getSandbox,
  logAuditEvent,
  getAuditLogs,
  clearAllStores,
  getDbStats,
  isMockMode,
} from "../lib/db";

async function runTests() {
  console.log("=== DATABASE LAYER VERIFICATION ===\n");

  // Clear any existing data
  clearAllStores();

  // Test 1: Verify mock mode
  console.log("🔧 Mock Mode Check:");
  console.log(`   Running in mock mode: ${isMockMode()}`);
  console.log();

  // Test 2: Create vendor
  console.log("👤 Creating Vendor:");
  const vendor = await createVendor({
    podsLiteInput: {
      vendorName: "Test EdTech Company",
      contactEmail: "test@edtech.com",
      contactName: "John Test",
      contactPhone: "555-1234",
      applicationName: "Test Learning App",
      applicationDescription: "A test application for verification",
      dataElementsRequested: ["STUDENT_ID", "FIRST_NAME", "GRADE_LEVEL"],
      dataPurpose: "Testing the database layer",
      dataRetentionDays: 30,
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

  console.log(`   Vendor ID: ${vendor.id}`);
  console.log(`   Vendor Name: ${vendor.name}`);
  console.log(`   Access Tier: ${vendor.accessTier}`);
  console.log(`   PoDS Status: ${vendor.podsStatus}`);
  console.log(`   PoDS Application ID: ${vendor.podsApplicationId}`);
  console.log(`   ID is UUID format: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vendor.id)}`);
  console.log();

  // Test 3: Get vendor
  console.log("🔍 Getting Vendor:");
  const retrievedVendor = await getVendor(vendor.id);
  console.log(`   Found vendor: ${retrievedVendor !== null}`);
  console.log(`   Matches original: ${retrievedVendor?.id === vendor.id}`);
  console.log();

  // Test 4: Create sandbox
  console.log("🔐 Creating Sandbox Credentials:");
  const sandbox = await createSandbox(vendor.id);
  console.log(`   Sandbox ID: ${sandbox.id}`);
  console.log(`   API Key: ${sandbox.apiKey}`);
  console.log(`   API Key format valid: ${sandbox.apiKey.startsWith("sbox_test_")}`);
  console.log(`   Secret length: ${sandbox.apiSecret.length} chars`);
  console.log(`   Base URL: ${sandbox.baseUrl}`);
  console.log(`   Environment: ${sandbox.environment}`);
  console.log(`   Status: ${sandbox.status}`);
  console.log(`   Expires: ${sandbox.expiresAt.toISOString()}`);
  console.log();

  // Test 5: Get sandbox
  console.log("🔍 Getting Sandbox:");
  const retrievedSandbox = await getSandbox(vendor.id);
  console.log(`   Found sandbox: ${retrievedSandbox !== null}`);
  console.log(`   Matches original: ${retrievedSandbox?.id === sandbox.id}`);
  console.log();

  // Test 6: Audit logs
  console.log("📝 Audit Logs:");
  const auditLogs = await getAuditLogs(vendor.id);
  console.log(`   Total audit entries: ${auditLogs.length}`);
  for (const log of auditLogs) {
    console.log(`      ${log.action} on ${log.resourceType} at ${log.timestamp.toISOString()}`);
  }
  console.log();

  // Test 7: Manual audit event
  console.log("📝 Adding Manual Audit Event:");
  const manualLog = await logAuditEvent({
    vendorId: vendor.id,
    action: "TEST_EVENT",
    resourceType: "test",
    resourceId: "test-123",
    details: { test: true },
  });
  console.log(`   Log ID: ${manualLog.id}`);
  console.log(`   Action: ${manualLog.action}`);
  console.log();

  // Test 8: Database stats
  console.log("📊 Database Stats:");
  const stats = await getDbStats();
  console.log(`   Vendors: ${stats.vendors}`);
  console.log(`   Sandboxes: ${stats.sandboxes}`);
  console.log(`   Audit Logs: ${stats.auditLogs}`);
  console.log();

  // Test 9: Auto-approval for PRIVACY_SAFE
  console.log("✅ Auto-Approval Test (Privacy-Safe):");
  console.log(`   Requested non-sensitive data: ["STUDENT_ID", "FIRST_NAME", "GRADE_LEVEL"]`);
  console.log(`   Access tier assigned: ${vendor.accessTier}`);
  console.log(`   Auto-approved: ${vendor.podsStatus === "APPROVED"}`);
  console.log();

  // Test 10: Selective tier test
  console.log("⚠️ Selective Tier Test:");
  const selectiveVendor = await createVendor({
    podsLiteInput: {
      vendorName: "Sensitive Data Vendor",
      contactEmail: "sensitive@vendor.com",
      contactName: "Jane Sensitive",
      applicationName: "Sensitive App",
      applicationDescription: "App that needs email access",
      dataElementsRequested: ["STUDENT_ID", "FIRST_NAME", "EMAIL", "PHONE"], // Sensitive!
      dataPurpose: "Communication with students",
      dataRetentionDays: 90,
      integrationMethod: "ONEROSTER_API",
      thirdPartySharing: false,
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
  console.log(`   Requested sensitive data: ["EMAIL", "PHONE"]`);
  console.log(`   Access tier assigned: ${selectiveVendor.accessTier}`);
  console.log(`   Status: ${selectiveVendor.podsStatus}`);
  console.log(`   Requires review: ${selectiveVendor.podsStatus === "PENDING_REVIEW"}`);
  console.log();

  console.log("✅ All database tests complete!");
}

runTests().catch(console.error);
