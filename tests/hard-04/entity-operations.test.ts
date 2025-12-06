/**
 * HARD-04: Entity Operations Tests
 *
 * Tests for the new schema entity operations:
 * - District, School, User, Class, Enrollment operations
 * - CRUD operations with proper relationships
 * - Entity statistics
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  prisma,
  upsertDistrict,
  getDistrict,
  getDistrictByShortCode,
  listDistricts,
  upsertSchool,
  getSchool,
  listSchoolsInDistrict,
  getSchoolCount,
  upsertUser,
  getUser,
  getUserByToken,
  listUsersByRole,
  getUserCounts,
  upsertClass,
  getClass,
  listClassesInSchool,
  upsertEnrollment,
  getEnrollmentsForUser,
  getEnrollmentsForClass,
  getEnrollmentCount,
  upsertAcademicSession,
  getCurrentAcademicSession,
  upsertCourse,
  listCourses,
  clearAllEntityData,
  getEntityStats,
} from '../../lib/db';

// =============================================================================
// TEST DATA
// =============================================================================

const TEST_DISTRICT = {
  sourcedId: 'TEST_DISTRICT_001',
  name: 'Test School District',
  shortCode: 'TSD',
  ncesId: '0600001',
  timezone: 'America/Los_Angeles',
  locale: 'en-US',
};

const TEST_SCHOOL = {
  sourcedId: 'TEST_SCHOOL_001',
  districtId: '', // Will be set after district creation
  name: 'Test Elementary School',
  shortCode: 'TES',
  type: 'elementary' as const,
  ncesId: '060000100001',
  gradeMin: 0,
  gradeMax: 5,
  address: '123 Test Street',
  city: 'Los Angeles',
  state: 'CA',
  zipCode: '90001',
};

const TEST_USER = {
  sourcedId: 'TEST_USER_001',
  token: 'TKN_STU_TEST0001',
  givenName: 'Test',
  familyName: 'Student',
  role: 'student' as const,
  primarySchoolId: '', // Will be set after school creation
  email: 'test@relay.schoolday.lausd.net',
  gradeLevel: '3',
};

const TEST_TEACHER = {
  sourcedId: 'TEST_TEACHER_001',
  token: 'TKN_TCH_TEST0001',
  givenName: 'Test',
  familyName: 'Teacher',
  role: 'teacher' as const,
  primarySchoolId: '', // Will be set after school creation
  email: 'teacher@relay.schoolday.lausd.net',
};

// =============================================================================
// SETUP & TEARDOWN
// =============================================================================

let testDistrictId: string;
let testSchoolId: string;
let testUserId: string;
let testTeacherId: string;
let testClassId: string;
let testAcademicSessionId: string;
let testCourseId: string;

beforeAll(async () => {
  // Clean up any existing test data
  await prisma.enrollment.deleteMany({
    where: { sourcedId: { startsWith: 'TEST_' } },
  });
  await prisma.class.deleteMany({
    where: { sourcedId: { startsWith: 'TEST_' } },
  });
  await prisma.course.deleteMany({
    where: { sourcedId: { startsWith: 'TEST_' } },
  });
  await prisma.user.deleteMany({
    where: { sourcedId: { startsWith: 'TEST_' } },
  });
  await prisma.academicSession.deleteMany({
    where: { sourcedId: { startsWith: 'TEST_' } },
  });
  await prisma.school.deleteMany({
    where: { sourcedId: { startsWith: 'TEST_' } },
  });
  await prisma.district.deleteMany({
    where: { sourcedId: { startsWith: 'TEST_' } },
  });
});

afterAll(async () => {
  // Clean up test data
  await prisma.enrollment.deleteMany({
    where: { sourcedId: { startsWith: 'TEST_' } },
  });
  await prisma.class.deleteMany({
    where: { sourcedId: { startsWith: 'TEST_' } },
  });
  await prisma.course.deleteMany({
    where: { sourcedId: { startsWith: 'TEST_' } },
  });
  await prisma.user.deleteMany({
    where: { sourcedId: { startsWith: 'TEST_' } },
  });
  await prisma.academicSession.deleteMany({
    where: { sourcedId: { startsWith: 'TEST_' } },
  });
  await prisma.school.deleteMany({
    where: { sourcedId: { startsWith: 'TEST_' } },
  });
  await prisma.district.deleteMany({
    where: { sourcedId: { startsWith: 'TEST_' } },
  });
});

// =============================================================================
// DISTRICT TESTS
// =============================================================================

describe('HARD-04: District Operations', () => {
  it('should create a district', async () => {
    const district = await upsertDistrict(TEST_DISTRICT);

    expect(district).toBeDefined();
    expect(district.id).toBeDefined();
    expect(district.sourcedId).toBe(TEST_DISTRICT.sourcedId);
    expect(district.name).toBe(TEST_DISTRICT.name);
    expect(district.shortCode).toBe(TEST_DISTRICT.shortCode);
    expect(district.ncesId).toBe(TEST_DISTRICT.ncesId);
    expect(district.timezone).toBe(TEST_DISTRICT.timezone);

    testDistrictId = district.id;
  });

  it('should update an existing district', async () => {
    const updated = await upsertDistrict({
      ...TEST_DISTRICT,
      name: 'Updated Test School District',
    });

    expect(updated.name).toBe('Updated Test School District');
    expect(updated.sourcedId).toBe(TEST_DISTRICT.sourcedId);
  });

  it('should get district by sourcedId', async () => {
    const district = await getDistrict(TEST_DISTRICT.sourcedId);

    expect(district).toBeDefined();
    expect(district?.sourcedId).toBe(TEST_DISTRICT.sourcedId);
  });

  it('should get district by shortCode', async () => {
    const district = await getDistrictByShortCode(TEST_DISTRICT.shortCode);

    expect(district).toBeDefined();
    expect(district?.shortCode).toBe(TEST_DISTRICT.shortCode);
  });

  it('should list districts', async () => {
    const districts = await listDistricts();

    expect(Array.isArray(districts)).toBe(true);
    expect(districts.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// SCHOOL TESTS
// =============================================================================

describe('HARD-04: School Operations', () => {
  it('should create a school', async () => {
    const school = await upsertSchool({
      ...TEST_SCHOOL,
      districtId: testDistrictId,
    });

    expect(school).toBeDefined();
    expect(school.id).toBeDefined();
    expect(school.sourcedId).toBe(TEST_SCHOOL.sourcedId);
    expect(school.name).toBe(TEST_SCHOOL.name);
    expect(school.type).toBe(TEST_SCHOOL.type);
    expect(school.gradeMin).toBe(TEST_SCHOOL.gradeMin);
    expect(school.gradeMax).toBe(TEST_SCHOOL.gradeMax);

    testSchoolId = school.id;
  });

  it('should get school by sourcedId', async () => {
    const school = await getSchool(TEST_SCHOOL.sourcedId);

    expect(school).toBeDefined();
    expect(school?.sourcedId).toBe(TEST_SCHOOL.sourcedId);
    expect(school?.district).toBeDefined();
  });

  it('should list schools in district', async () => {
    const schools = await listSchoolsInDistrict(testDistrictId);

    expect(Array.isArray(schools)).toBe(true);
    expect(schools.length).toBeGreaterThan(0);
    expect(schools.some(s => s.sourcedId === TEST_SCHOOL.sourcedId)).toBe(true);
  });

  it('should get school count', async () => {
    const count = await getSchoolCount(testDistrictId);

    expect(count).toBeGreaterThan(0);
  });
});

// =============================================================================
// ACADEMIC SESSION TESTS
// =============================================================================

describe('HARD-04: Academic Session Operations', () => {
  it('should create an academic session', async () => {
    const now = new Date();
    const session = await upsertAcademicSession({
      sourcedId: 'TEST_SESSION_001',
      districtId: testDistrictId,
      title: 'Test School Year 2024-2025',
      type: 'schoolYear',
      startDate: new Date(now.getFullYear(), 7, 15), // Aug 15
      endDate: new Date(now.getFullYear() + 1, 5, 15), // Jun 15
    });

    expect(session).toBeDefined();
    expect(session.id).toBeDefined();
    expect(session.title).toBe('Test School Year 2024-2025');
    expect(session.type).toBe('schoolYear');

    testAcademicSessionId = session.id;
  });

  it('should get current academic session', async () => {
    // Create a current session
    const now = new Date();
    await upsertAcademicSession({
      sourcedId: 'TEST_CURRENT_SESSION',
      districtId: testDistrictId,
      title: 'Current Test Session',
      type: 'schoolYear',
      startDate: new Date(now.getFullYear() - 1, 0, 1),
      endDate: new Date(now.getFullYear() + 1, 11, 31),
    });

    const current = await getCurrentAcademicSession(testDistrictId);

    expect(current).toBeDefined();
    expect(current?.type).toBe('schoolYear');
  });
});

// =============================================================================
// COURSE TESTS
// =============================================================================

describe('HARD-04: Course Operations', () => {
  it('should create a course', async () => {
    const course = await upsertCourse({
      sourcedId: 'TEST_COURSE_001',
      districtId: testDistrictId,
      title: 'Test Mathematics',
      courseCode: 'MATH101',
      subject: 'Mathematics',
      gradeLevel: '3',
    });

    expect(course).toBeDefined();
    expect(course.id).toBeDefined();
    expect(course.title).toBe('Test Mathematics');
    expect(course.courseCode).toBe('MATH101');

    testCourseId = course.id;
  });

  it('should list courses in district', async () => {
    const courses = await listCourses(testDistrictId);

    expect(Array.isArray(courses)).toBe(true);
    expect(courses.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// USER TESTS
// =============================================================================

describe('HARD-04: User Operations', () => {
  it('should create a student user', async () => {
    const user = await upsertUser({
      ...TEST_USER,
      primarySchoolId: testSchoolId,
    });

    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.sourcedId).toBe(TEST_USER.sourcedId);
    expect(user.token).toBe(TEST_USER.token);
    expect(user.givenName).toBe(TEST_USER.givenName);
    expect(user.role).toBe('student');

    testUserId = user.id;
  });

  it('should create a teacher user', async () => {
    const teacher = await upsertUser({
      ...TEST_TEACHER,
      primarySchoolId: testSchoolId,
    });

    expect(teacher).toBeDefined();
    expect(teacher.role).toBe('teacher');

    testTeacherId = teacher.id;
  });

  it('should get user by sourcedId', async () => {
    const user = await getUser(TEST_USER.sourcedId);

    expect(user).toBeDefined();
    expect(user?.sourcedId).toBe(TEST_USER.sourcedId);
  });

  it('should get user by token', async () => {
    const user = await getUserByToken(TEST_USER.token);

    expect(user).toBeDefined();
    expect(user?.token).toBe(TEST_USER.token);
  });

  it('should list users by role', async () => {
    const students = await listUsersByRole(testSchoolId, 'student');
    const teachers = await listUsersByRole(testSchoolId, 'teacher');

    expect(Array.isArray(students)).toBe(true);
    expect(Array.isArray(teachers)).toBe(true);
    expect(students.some(s => s.sourcedId === TEST_USER.sourcedId)).toBe(true);
    expect(teachers.some(t => t.sourcedId === TEST_TEACHER.sourcedId)).toBe(true);
  });

  it('should get user counts', async () => {
    const counts = await getUserCounts(testSchoolId);

    expect(counts.students).toBeGreaterThan(0);
    expect(counts.teachers).toBeGreaterThan(0);
    expect(counts.total).toBeGreaterThan(0);
  });
});

// =============================================================================
// CLASS TESTS
// =============================================================================

describe('HARD-04: Class Operations', () => {
  it('should create a class', async () => {
    const cls = await upsertClass({
      sourcedId: 'TEST_CLASS_001',
      schoolId: testSchoolId,
      courseId: testCourseId,
      academicSessionId: testAcademicSessionId,
      title: 'Test Math Class - Grade 3',
      classCode: 'MATH301',
      gradeLevel: '3',
      subject: 'Mathematics',
      period: '1',
    });

    expect(cls).toBeDefined();
    expect(cls.id).toBeDefined();
    expect(cls.title).toBe('Test Math Class - Grade 3');
    expect(cls.classCode).toBe('MATH301');

    testClassId = cls.id;
  });

  it('should get class by sourcedId', async () => {
    const cls = await getClass('TEST_CLASS_001');

    expect(cls).toBeDefined();
    expect(cls?.sourcedId).toBe('TEST_CLASS_001');
    expect(cls?.school).toBeDefined();
  });

  it('should list classes in school', async () => {
    const classes = await listClassesInSchool(testSchoolId);

    expect(Array.isArray(classes)).toBe(true);
    expect(classes.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// ENROLLMENT TESTS
// =============================================================================

describe('HARD-04: Enrollment Operations', () => {
  it('should create student enrollment', async () => {
    const enrollment = await upsertEnrollment({
      sourcedId: 'TEST_ENROLLMENT_001',
      userId: testUserId,
      classId: testClassId,
      role: 'student',
      isPrimary: true,
    });

    expect(enrollment).toBeDefined();
    expect(enrollment.id).toBeDefined();
    expect(enrollment.role).toBe('student');
  });

  it('should create teacher enrollment', async () => {
    const enrollment = await upsertEnrollment({
      sourcedId: 'TEST_ENROLLMENT_002',
      userId: testTeacherId,
      classId: testClassId,
      role: 'teacher',
      isPrimary: true,
    });

    expect(enrollment).toBeDefined();
    expect(enrollment.role).toBe('teacher');
  });

  it('should get enrollments for user', async () => {
    const enrollments = await getEnrollmentsForUser(testUserId);

    expect(Array.isArray(enrollments)).toBe(true);
    expect(enrollments.length).toBeGreaterThan(0);
    expect(enrollments[0].class).toBeDefined();
  });

  it('should get enrollments for class', async () => {
    const enrollments = await getEnrollmentsForClass(testClassId);

    expect(Array.isArray(enrollments)).toBe(true);
    expect(enrollments.length).toBeGreaterThan(0);
    expect(enrollments[0].user).toBeDefined();
  });

  it('should get enrollment count', async () => {
    const count = await getEnrollmentCount(testClassId);

    expect(count).toBeGreaterThan(0);
  });
});

// =============================================================================
// STATISTICS TESTS
// =============================================================================

describe('HARD-04: Entity Statistics', () => {
  it('should get entity stats', async () => {
    const stats = await getEntityStats();

    expect(stats).toBeDefined();
    expect(stats.districts).toBeGreaterThan(0);
    expect(stats.schools).toBeGreaterThan(0);
    expect(stats.users).toBeGreaterThan(0);
    expect(stats.classes).toBeGreaterThan(0);
    expect(stats.enrollments).toBeGreaterThan(0);
  });
});

// =============================================================================
// EXPORTS VERIFICATION
// =============================================================================

describe('HARD-04: Module Exports', () => {
  it('should export all district operations', () => {
    expect(typeof upsertDistrict).toBe('function');
    expect(typeof getDistrict).toBe('function');
    expect(typeof getDistrictByShortCode).toBe('function');
    expect(typeof listDistricts).toBe('function');
  });

  it('should export all school operations', () => {
    expect(typeof upsertSchool).toBe('function');
    expect(typeof getSchool).toBe('function');
    expect(typeof listSchoolsInDistrict).toBe('function');
    expect(typeof getSchoolCount).toBe('function');
  });

  it('should export all user operations', () => {
    expect(typeof upsertUser).toBe('function');
    expect(typeof getUser).toBe('function');
    expect(typeof getUserByToken).toBe('function');
    expect(typeof listUsersByRole).toBe('function');
    expect(typeof getUserCounts).toBe('function');
  });

  it('should export all class operations', () => {
    expect(typeof upsertClass).toBe('function');
    expect(typeof getClass).toBe('function');
    expect(typeof listClassesInSchool).toBe('function');
  });

  it('should export all enrollment operations', () => {
    expect(typeof upsertEnrollment).toBe('function');
    expect(typeof getEnrollmentsForUser).toBe('function');
    expect(typeof getEnrollmentsForClass).toBe('function');
    expect(typeof getEnrollmentCount).toBe('function');
  });

  it('should export bulk operations', () => {
    expect(typeof clearAllEntityData).toBe('function');
    expect(typeof getEntityStats).toBe('function');
  });
});
