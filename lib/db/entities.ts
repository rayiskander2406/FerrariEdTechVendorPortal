/**
 * Entity Operations for New Schema Models
 *
 * HARD-04: Operations for District, School, User, Class, Enrollment
 * These complement the existing operations in index.ts
 *
 * @module lib/db/entities
 */

import { prisma } from './index';

// =============================================================================
// TYPES
// =============================================================================

export interface DistrictInput {
  sourcedId: string;
  name: string;
  shortCode: string;
  ncesId?: string;
  stateId?: string;
  timezone?: string;
  locale?: string;
}

export interface SchoolInput {
  sourcedId: string;
  districtId: string;
  name: string;
  shortCode: string;
  type: 'elementary' | 'middle' | 'high' | 'K-8' | 'K-12';
  ncesId?: string;
  gradeMin: number;
  gradeMax: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface UserInput {
  sourcedId: string;
  token: string;
  givenName: string;
  familyName: string;
  role: 'student' | 'teacher' | 'parent' | 'administrator' | 'aide';
  primarySchoolId?: string;
  email?: string;
  phone?: string;
  gradeLevel?: string;
}

export interface ClassInput {
  sourcedId: string;
  schoolId: string;
  courseId?: string;
  academicSessionId?: string;
  title: string;
  classCode?: string;
  gradeLevel?: string;
  subject?: string;
  period?: string;
}

export interface EnrollmentInput {
  sourcedId: string;
  userId: string;
  classId: string;
  role: 'student' | 'teacher' | 'aide' | 'administrator';
  isPrimary?: boolean;
}

export interface AcademicSessionInput {
  sourcedId: string;
  districtId: string;
  title: string;
  type: 'schoolYear' | 'semester' | 'term' | 'gradingPeriod';
  startDate: Date;
  endDate: Date;
  parentId?: string;
}

export interface CourseInput {
  sourcedId: string;
  districtId: string;
  title: string;
  courseCode: string;
  subject?: string;
  gradeLevel?: string;
}

// =============================================================================
// DISTRICT OPERATIONS
// =============================================================================

/**
 * Create or update a district
 */
export async function upsertDistrict(input: DistrictInput) {
  return prisma.district.upsert({
    where: { sourcedId: input.sourcedId },
    update: {
      name: input.name,
      shortCode: input.shortCode,
      ncesId: input.ncesId,
      stateId: input.stateId,
      timezone: input.timezone ?? 'America/Los_Angeles',
      locale: input.locale ?? 'en-US',
      lastSyncedAt: new Date(),
    },
    create: {
      sourcedId: input.sourcedId,
      name: input.name,
      shortCode: input.shortCode,
      ncesId: input.ncesId,
      stateId: input.stateId,
      timezone: input.timezone ?? 'America/Los_Angeles',
      locale: input.locale ?? 'en-US',
    },
  });
}

/**
 * Get district by sourcedId
 */
export async function getDistrict(sourcedId: string) {
  return prisma.district.findUnique({
    where: { sourcedId },
    include: {
      schools: true,
      academicSessions: true,
    },
  });
}

/**
 * Get district by shortCode (e.g., "LAUSD")
 */
export async function getDistrictByShortCode(shortCode: string) {
  return prisma.district.findUnique({
    where: { shortCode },
  });
}

/**
 * List all districts
 */
export async function listDistricts() {
  return prisma.district.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
  });
}

// =============================================================================
// SCHOOL OPERATIONS
// =============================================================================

/**
 * Create or update a school
 */
export async function upsertSchool(input: SchoolInput) {
  return prisma.school.upsert({
    where: { sourcedId: input.sourcedId },
    update: {
      name: input.name,
      shortCode: input.shortCode,
      type: input.type,
      ncesId: input.ncesId,
      gradeMin: input.gradeMin,
      gradeMax: input.gradeMax,
      address: input.address,
      city: input.city,
      state: input.state ?? 'CA',
      zipCode: input.zipCode,
      lastSyncedAt: new Date(),
    },
    create: {
      sourcedId: input.sourcedId,
      districtId: input.districtId,
      name: input.name,
      shortCode: input.shortCode,
      type: input.type,
      ncesId: input.ncesId,
      gradeMin: input.gradeMin,
      gradeMax: input.gradeMax,
      address: input.address,
      city: input.city,
      state: input.state ?? 'CA',
      zipCode: input.zipCode,
    },
  });
}

/**
 * Get school by sourcedId
 */
export async function getSchool(sourcedId: string) {
  return prisma.school.findUnique({
    where: { sourcedId },
    include: {
      district: true,
      classes: true,
    },
  });
}

/**
 * List schools in a district
 */
export async function listSchoolsInDistrict(districtId: string) {
  return prisma.school.findMany({
    where: {
      districtId,
      deletedAt: null,
      status: 'active',
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get school count in district
 */
export async function getSchoolCount(districtId: string) {
  return prisma.school.count({
    where: {
      districtId,
      deletedAt: null,
      status: 'active',
    },
  });
}

// =============================================================================
// USER OPERATIONS
// =============================================================================

/**
 * Create or update a user
 */
export async function upsertUser(input: UserInput) {
  return prisma.user.upsert({
    where: { sourcedId: input.sourcedId },
    update: {
      token: input.token,
      givenName: input.givenName,
      familyName: input.familyName,
      role: input.role,
      primarySchoolId: input.primarySchoolId,
      email: input.email,
      phone: input.phone,
      gradeLevel: input.gradeLevel,
      lastSyncedAt: new Date(),
    },
    create: {
      sourcedId: input.sourcedId,
      token: input.token,
      givenName: input.givenName,
      familyName: input.familyName,
      role: input.role,
      primarySchoolId: input.primarySchoolId,
      email: input.email,
      phone: input.phone,
      gradeLevel: input.gradeLevel,
    },
  });
}

/**
 * Get user by sourcedId
 */
export async function getUser(sourcedId: string) {
  return prisma.user.findUnique({
    where: { sourcedId },
    include: {
      primarySchool: true,
      enrollments: true,
    },
  });
}

/**
 * Get user by token
 */
export async function getUserByToken(token: string) {
  return prisma.user.findUnique({
    where: { token },
  });
}

/**
 * List users by role in a school
 */
export async function listUsersByRole(
  primarySchoolId: string,
  role: 'student' | 'teacher' | 'parent' | 'administrator'
) {
  return prisma.user.findMany({
    where: {
      primarySchoolId,
      role,
      deletedAt: null,
      status: 'active',
    },
    orderBy: [{ familyName: 'asc' }, { givenName: 'asc' }],
  });
}

/**
 * Get user counts by role
 */
export async function getUserCounts(primarySchoolId?: string) {
  const where = {
    deletedAt: null,
    status: 'active',
    ...(primarySchoolId && { primarySchoolId }),
  };

  const [students, teachers, parents, administrators] = await Promise.all([
    prisma.user.count({ where: { ...where, role: 'student' } }),
    prisma.user.count({ where: { ...where, role: 'teacher' } }),
    prisma.user.count({ where: { ...where, role: 'parent' } }),
    prisma.user.count({ where: { ...where, role: 'administrator' } }),
  ]);

  return { students, teachers, parents, administrators, total: students + teachers + parents + administrators };
}

// =============================================================================
// CLASS OPERATIONS
// =============================================================================

/**
 * Create or update a class
 */
export async function upsertClass(input: ClassInput) {
  return prisma.class.upsert({
    where: { sourcedId: input.sourcedId },
    update: {
      title: input.title,
      classCode: input.classCode,
      courseId: input.courseId,
      academicSessionId: input.academicSessionId,
      gradeLevel: input.gradeLevel,
      subject: input.subject,
      period: input.period,
      lastSyncedAt: new Date(),
    },
    create: {
      sourcedId: input.sourcedId,
      schoolId: input.schoolId,
      title: input.title,
      classCode: input.classCode,
      courseId: input.courseId,
      academicSessionId: input.academicSessionId,
      gradeLevel: input.gradeLevel,
      subject: input.subject,
      period: input.period,
    },
  });
}

/**
 * Get class by sourcedId
 */
export async function getClass(sourcedId: string) {
  return prisma.class.findUnique({
    where: { sourcedId },
    include: {
      school: true,
      course: true,
      enrollments: true,
    },
  });
}

/**
 * List classes in a school
 */
export async function listClassesInSchool(schoolId: string) {
  return prisma.class.findMany({
    where: {
      schoolId,
      deletedAt: null,
      status: 'active',
    },
    orderBy: [{ gradeLevel: 'asc' }, { title: 'asc' }],
  });
}

// =============================================================================
// ENROLLMENT OPERATIONS
// =============================================================================

/**
 * Create or update an enrollment
 */
export async function upsertEnrollment(input: EnrollmentInput) {
  return prisma.enrollment.upsert({
    where: { sourcedId: input.sourcedId },
    update: {
      role: input.role,
      isPrimary: input.isPrimary ?? true,
      lastSyncedAt: new Date(),
    },
    create: {
      sourcedId: input.sourcedId,
      userId: input.userId,
      classId: input.classId,
      role: input.role,
      isPrimary: input.isPrimary ?? true,
    },
  });
}

/**
 * Get enrollments for a user
 */
export async function getEnrollmentsForUser(userId: string) {
  return prisma.enrollment.findMany({
    where: {
      userId,
      deletedAt: null,
      status: 'active',
    },
    include: {
      class: true,
    },
  });
}

/**
 * Get enrollments for a class
 */
export async function getEnrollmentsForClass(classId: string) {
  return prisma.enrollment.findMany({
    where: {
      classId,
      deletedAt: null,
      status: 'active',
    },
    include: {
      user: true,
    },
  });
}

/**
 * Get enrollment counts
 */
export async function getEnrollmentCount(classId?: string, userId?: string) {
  return prisma.enrollment.count({
    where: {
      deletedAt: null,
      status: 'active',
      ...(classId && { classId }),
      ...(userId && { userId }),
    },
  });
}

// =============================================================================
// ACADEMIC SESSION OPERATIONS
// =============================================================================

/**
 * Create or update an academic session
 */
export async function upsertAcademicSession(input: AcademicSessionInput) {
  return prisma.academicSession.upsert({
    where: { sourcedId: input.sourcedId },
    update: {
      title: input.title,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      parentId: input.parentId,
      lastSyncedAt: new Date(),
    },
    create: {
      sourcedId: input.sourcedId,
      districtId: input.districtId,
      title: input.title,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      parentId: input.parentId,
    },
  });
}

/**
 * Get current academic session
 */
export async function getCurrentAcademicSession(districtId: string) {
  const now = new Date();
  return prisma.academicSession.findFirst({
    where: {
      districtId,
      type: 'schoolYear',
      startDate: { lte: now },
      endDate: { gte: now },
      deletedAt: null,
    },
  });
}

// =============================================================================
// COURSE OPERATIONS
// =============================================================================

/**
 * Create or update a course
 */
export async function upsertCourse(input: CourseInput) {
  return prisma.course.upsert({
    where: { sourcedId: input.sourcedId },
    update: {
      title: input.title,
      courseCode: input.courseCode,
      subject: input.subject,
      gradeLevel: input.gradeLevel,
      lastSyncedAt: new Date(),
    },
    create: {
      sourcedId: input.sourcedId,
      districtId: input.districtId,
      title: input.title,
      courseCode: input.courseCode,
      subject: input.subject,
      gradeLevel: input.gradeLevel,
    },
  });
}

/**
 * List courses in a district
 */
export async function listCourses(districtId: string) {
  return prisma.course.findMany({
    where: {
      districtId,
      deletedAt: null,
      status: 'active',
    },
    orderBy: { title: 'asc' },
  });
}

// =============================================================================
// BULK OPERATIONS
// =============================================================================

/**
 * Clear all entity data (for testing/seeding)
 */
export async function clearAllEntityData(): Promise<void> {
  // Delete in order to respect foreign key constraints
  await prisma.enrollment.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.academicSession.deleteMany({});
  await prisma.school.deleteMany({});
  await prisma.district.deleteMany({});
}

/**
 * Get entity statistics
 */
export async function getEntityStats() {
  const [districts, schools, users, classes, enrollments, courses, academicSessions] =
    await Promise.all([
      prisma.district.count({ where: { deletedAt: null } }),
      prisma.school.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.class.count({ where: { deletedAt: null } }),
      prisma.enrollment.count({ where: { deletedAt: null } }),
      prisma.course.count({ where: { deletedAt: null } }),
      prisma.academicSession.count({ where: { deletedAt: null } }),
    ]);

  return {
    districts,
    schools,
    users,
    classes,
    enrollments,
    courses,
    academicSessions,
  };
}
