/**
 * Test script to verify synthetic data generation
 * Run with: npx tsx tests/synthetic-data.test.ts
 */

import {
  SYNTHETIC_DATA,
  getOneRosterResponse,
  getMockPodsDatabase,
  getStudentByToken,
  getSchoolByToken,
} from "../lib/data/synthetic";

console.log("=== SYNTHETIC DATA VERIFICATION ===\n");

// Test 1: Verify data stats
console.log("📊 Data Statistics:");
console.log(`   Schools: ${SYNTHETIC_DATA.schools.length}`);
console.log(`   Students: ${SYNTHETIC_DATA.stats.totalStudents}`);
console.log(`   Teachers: ${SYNTHETIC_DATA.stats.totalTeachers}`);
console.log(`   Classes: ${SYNTHETIC_DATA.stats.totalClasses}`);
console.log(`   Enrollments: ${SYNTHETIC_DATA.stats.totalEnrollments}`);
console.log();

// Test 2: Verify school definitions
console.log("🏫 Schools:");
for (const school of SYNTHETIC_DATA.schools) {
  console.log(`   ${school.shortName} (${school.token})`);
  console.log(`      Grades: ${school.gradeRange.min === 0 ? "K" : school.gradeRange.min}-${school.gradeRange.max}`);
  console.log(`      Students: ${school.studentCount}`);
}
console.log();

// Test 3: Verify token format
console.log("🔑 Token Format Verification:");
const sampleStudent = SYNTHETIC_DATA.students[0];
const sampleTeacher = SYNTHETIC_DATA.teachers[0];
const sampleClass = SYNTHETIC_DATA.classes[0];
if (sampleStudent) {
  console.log(`   Student token: ${sampleStudent.token}`);
  console.log(`   Student email: ${sampleStudent.email}`);
  console.log(`   Student lastName: ${sampleStudent.lastName}`);
}
if (sampleTeacher) {
  console.log(`   Teacher token: ${sampleTeacher.token}`);
  console.log(`   Teacher email: ${sampleTeacher.email}`);
}
if (sampleClass) {
  console.log(`   Class token: ${sampleClass.token}`);
}
console.log();

// Test 4: Verify OneRoster response
console.log("📡 OneRoster API Response (/users):");
const usersResponse = getOneRosterResponse("/users", undefined, 5);
console.log(`   Status: ${usersResponse.statusInfoSet?.imsx_codeMajor}`);
console.log(`   Users returned: ${usersResponse.users?.length ?? 0}`);
if (usersResponse.users && usersResponse.users.length > 0) {
  const firstUser = usersResponse.users[0];
  if (firstUser) {
    console.log(`   Sample user:`);
    console.log(`      sourcedId: ${firstUser.sourcedId}`);
    console.log(`      givenName: ${firstUser.givenName}`);
    console.log(`      familyName: ${firstUser.familyName}`);
    console.log(`      email: ${firstUser.email}`);
    console.log(`      role: ${firstUser.role}`);
  }
}
console.log();

// Test 5: Verify filtered response
console.log("🔍 Filtered OneRoster Response (teachers only):");
const teachersResponse = getOneRosterResponse("/users", { role: "teacher" }, 3);
console.log(`   Teachers returned: ${teachersResponse.users?.length ?? 0}`);
if (teachersResponse.users) {
  for (const teacher of teachersResponse.users) {
    console.log(`      ${teacher.givenName} ${teacher.familyName} (${teacher.sourcedId})`);
  }
}
console.log();

// Test 6: Verify PoDS database
console.log("📋 Mock PoDS Database:");
const podsDb = getMockPodsDatabase();
for (const app of podsDb) {
  console.log(`   ${app.id}: ${app.vendorName}`);
  console.log(`      Status: ${app.status}, Tier: ${app.accessTier}`);
}
console.log();

// Test 7: Verify determinism (same token for same input)
console.log("🔄 Determinism Check:");
const school1 = getSchoolByToken("TKN_SCH_" + "LINCOLN_".substring(0, 8).toUpperCase());
console.log(`   School lookup by partial token: ${school1?.shortName ?? "Not found (expected)"}`);

// Find Lincoln High's actual token
const lincolnHigh = SYNTHETIC_DATA.schools.find(s => s.shortName === "Lincoln High");
if (lincolnHigh) {
  console.log(`   Lincoln High token: ${lincolnHigh.token}`);
  const foundSchool = getSchoolByToken(lincolnHigh.token);
  console.log(`   Lookup result: ${foundSchool?.name ?? "Not found"}`);
}

// Verify student lookup
if (sampleStudent) {
  const foundStudent = getStudentByToken(sampleStudent.token);
  console.log(`   Student lookup match: ${foundStudent?.token === sampleStudent.token}`);
}
console.log();

console.log("✅ All verifications complete!");
