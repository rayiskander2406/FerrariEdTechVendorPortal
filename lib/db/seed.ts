/**
 * LAUSD Demo Data Seeder
 *
 * HARD-05: Seeds the database with realistic LAUSD demo data:
 * - 1 District (LAUSD)
 * - 5 Schools (matching synthetic data)
 * - Academic Sessions for 2024-2025
 * - ~1000 Users (students + teachers)
 * - Courses, Classes, and Enrollments
 *
 * All student PII is tokenized - only first names are real.
 *
 * @module lib/db/seed
 */

import { prisma } from './index';
import {
  upsertDistrict,
  upsertSchool,
  upsertUser,
  upsertClass,
  upsertEnrollment,
  upsertAcademicSession,
  upsertCourse,
  getEntityStats,
} from './entities';
import {
  studentToken,
  teacherToken,
  tokenizedEmail,
} from '../tokens';

// =============================================================================
// SEED CONFIGURATION
// =============================================================================

const SEED_CONFIG = {
  // Reduce student count for faster seeding (original: 6600)
  studentsPerSchool: {
    'lincoln-high': 200,      // Original: 2500
    'roosevelt-middle': 120,  // Original: 1200
    'washington-elem': 80,    // Original: 800
    'jefferson-stem': 150,    // Original: 1500
    'adams-arts': 60,         // Original: 600
  },
  teacherRatio: 25, // 1 teacher per 25 students
  classesPerGrade: 6,
  enrollmentsPerStudent: 6,
};

// =============================================================================
// NAME DATA
// =============================================================================

const FIRST_NAMES = [
  'Sofia', 'Miguel', 'Emily', 'Jose', 'Isabella', 'Carlos', 'Mia', 'Angel',
  'Camila', 'David', 'Valentina', 'Daniel', 'Luna', 'Diego', 'Aria', 'Juan',
  'Victoria', 'Luis', 'Scarlett', 'Jesus', 'Chloe', 'Anthony', 'Penelope', 'Kevin',
  'Riley', 'Bryan', 'Zoey', 'Alexander', 'Nora', 'Brandon', 'Lily', 'Adrian',
  'Eleanor', 'Jonathan', 'Hannah', 'Christopher', 'Addison', 'Joshua', 'Aubrey', 'Matthew',
  'Natalie', 'Andrew', 'Leah', 'Sebastian', 'Savannah', 'Nathan', 'Brooklyn', 'Ryan',
  'Stella', 'Eric', 'Hazel', 'Jason', 'Aurora', 'Tyler', 'Paisley', 'Jacob',
  'Maya', 'Ethan', 'Willow', 'Noah', 'Evelyn', 'Liam', 'Abigail', 'Mason',
];

const TEACHER_FIRST_NAMES = [
  'Patricia', 'Michael', 'Jennifer', 'Robert', 'Maria', 'David', 'Linda', 'James',
  'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas',
  'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew',
];

const SUBJECTS = [
  'Mathematics', 'English Language Arts', 'Science', 'Social Studies', 'History',
  'Physical Education', 'Art', 'Music', 'Spanish', 'Computer Science',
  'Biology', 'Chemistry', 'Physics', 'Algebra', 'Geometry',
];

// =============================================================================
// SCHOOL DEFINITIONS
// =============================================================================

interface SchoolDefinition {
  id: string;
  sourcedId: string;
  name: string;
  shortCode: string;
  type: 'elementary' | 'middle' | 'high' | 'K-8' | 'K-12';
  gradeMin: number;
  gradeMax: number;
  address: string;
  city: string;
  zipCode: string;
  principal: string;
}

const SCHOOLS: SchoolDefinition[] = [
  {
    id: 'lincoln-high',
    sourcedId: 'SCH_LINCOLN_HIGH',
    name: 'Abraham Lincoln High School',
    shortCode: 'LINCOLN',
    type: 'high',
    gradeMin: 9,
    gradeMax: 12,
    address: '3501 N Broadway',
    city: 'Los Angeles',
    zipCode: '90031',
    principal: 'Dr. Martinez',
  },
  {
    id: 'roosevelt-middle',
    sourcedId: 'SCH_ROOSEVELT_MID',
    name: 'Theodore Roosevelt Middle School',
    shortCode: 'ROOSEVELT',
    type: 'middle',
    gradeMin: 6,
    gradeMax: 8,
    address: '456 S Main St',
    city: 'Los Angeles',
    zipCode: '90013',
    principal: 'Ms. Johnson',
  },
  {
    id: 'washington-elem',
    sourcedId: 'SCH_WASHINGTON_ELEM',
    name: 'George Washington Elementary School',
    shortCode: 'WASHINGTON',
    type: 'elementary',
    gradeMin: 0,  // K
    gradeMax: 5,
    address: '789 W Olympic Blvd',
    city: 'Los Angeles',
    zipCode: '90015',
    principal: 'Mr. Chen',
  },
  {
    id: 'jefferson-stem',
    sourcedId: 'SCH_JEFFERSON_STEM',
    name: 'Thomas Jefferson STEM Academy',
    shortCode: 'JEFFERSON',
    type: 'K-12',
    gradeMin: 6,
    gradeMax: 12,
    address: '1234 Innovation Way',
    city: 'Los Angeles',
    zipCode: '90024',
    principal: 'Dr. Patel',
  },
  {
    id: 'adams-arts',
    sourcedId: 'SCH_ADAMS_ARTS',
    name: 'John Adams Arts Magnet',
    shortCode: 'ADAMS',
    type: 'K-8',
    gradeMin: 0,  // K
    gradeMax: 8,
    address: '567 Arts District Ave',
    city: 'Los Angeles',
    zipCode: '90021',
    principal: 'Ms. Williams',
  },
];

// =============================================================================
// SEEDED RANDOM
// =============================================================================

function createSeededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

/**
 * Seed LAUSD district
 */
async function seedDistrict(): Promise<string> {
  const district = await upsertDistrict({
    sourcedId: 'DIST_LAUSD',
    name: 'Los Angeles Unified School District',
    shortCode: 'LAUSD',
    ncesId: '0622710',
    stateId: 'CA-LAUSD',
    timezone: 'America/Los_Angeles',
    locale: 'en-US',
  });

  console.log(`[Seed] Created district: ${district.name}`);
  return district.id;
}

/**
 * Seed academic sessions
 */
async function seedAcademicSessions(districtId: string): Promise<string> {
  // School Year 2024-2025
  const schoolYear = await upsertAcademicSession({
    sourcedId: 'SESS_2024_2025',
    districtId,
    title: 'School Year 2024-2025',
    type: 'schoolYear',
    startDate: new Date('2024-08-19'),
    endDate: new Date('2025-06-06'),
  });

  // Fall Semester
  await upsertAcademicSession({
    sourcedId: 'SESS_2024_FALL',
    districtId,
    title: 'Fall 2024',
    type: 'semester',
    startDate: new Date('2024-08-19'),
    endDate: new Date('2024-12-20'),
    parentId: schoolYear.id,
  });

  // Spring Semester
  await upsertAcademicSession({
    sourcedId: 'SESS_2025_SPRING',
    districtId,
    title: 'Spring 2025',
    type: 'semester',
    startDate: new Date('2025-01-06'),
    endDate: new Date('2025-06-06'),
    parentId: schoolYear.id,
  });

  console.log('[Seed] Created academic sessions for 2024-2025');
  return schoolYear.id;
}

/**
 * Seed courses
 */
async function seedCourses(districtId: string): Promise<Map<string, string>> {
  const courseMap = new Map<string, string>();

  for (const subject of SUBJECTS) {
    const courseCode = subject.substring(0, 3).toUpperCase() + '100';
    const course = await upsertCourse({
      sourcedId: `CRS_${courseCode}`,
      districtId,
      title: subject,
      courseCode,
      subject,
    });
    courseMap.set(subject, course.id);
  }

  console.log(`[Seed] Created ${courseMap.size} courses`);
  return courseMap;
}

/**
 * Seed schools
 */
async function seedSchools(districtId: string): Promise<Map<string, string>> {
  const schoolMap = new Map<string, string>();

  for (const def of SCHOOLS) {
    const school = await upsertSchool({
      sourcedId: def.sourcedId,
      districtId,
      name: def.name,
      shortCode: def.shortCode,
      type: def.type,
      gradeMin: def.gradeMin,
      gradeMax: def.gradeMax,
      address: def.address,
      city: def.city,
      state: 'CA',
      zipCode: def.zipCode,
    });
    schoolMap.set(def.id, school.id);
  }

  console.log(`[Seed] Created ${schoolMap.size} schools`);
  return schoolMap;
}

/**
 * Seed users (students and teachers)
 */
async function seedUsers(
  schoolMap: Map<string, string>,
  random: () => number
): Promise<{ studentIds: Map<string, string[]>; teacherIds: Map<string, string[]> }> {
  const studentIds = new Map<string, string[]>();
  const teacherIds = new Map<string, string[]>();

  for (const [schoolKey, schoolId] of Array.from(schoolMap.entries())) {
    const def = SCHOOLS.find(s => s.id === schoolKey);
    if (!def) continue;

    const studentCount = SEED_CONFIG.studentsPerSchool[schoolKey as keyof typeof SEED_CONFIG.studentsPerSchool] || 100;
    const teacherCount = Math.ceil(studentCount / SEED_CONFIG.teacherRatio);

    const schoolStudentIds: string[] = [];
    const schoolTeacherIds: string[] = [];

    // Create students
    for (let i = 0; i < studentCount; i++) {
      const firstName = FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)]!;
      const gradeLevel = def.gradeMin + Math.floor(random() * (def.gradeMax - def.gradeMin + 1));
      const token = studentToken(schoolKey, i);

      const user = await upsertUser({
        sourcedId: `STU_${schoolKey.toUpperCase()}_${i}`,
        token,
        givenName: firstName,
        familyName: '[TOKENIZED]',
        role: 'student',
        primarySchoolId: schoolId,
        email: tokenizedEmail(token),
        gradeLevel: gradeLevel === 0 ? 'K' : gradeLevel.toString(),
      });

      schoolStudentIds.push(user.id);
    }

    // Create teachers
    for (let i = 0; i < teacherCount; i++) {
      const firstName = TEACHER_FIRST_NAMES[Math.floor(random() * TEACHER_FIRST_NAMES.length)]!;
      const token = teacherToken(schoolKey, i);

      const user = await upsertUser({
        sourcedId: `TCH_${schoolKey.toUpperCase()}_${i}`,
        token,
        givenName: firstName,
        familyName: '[TOKENIZED]',
        role: 'teacher',
        primarySchoolId: schoolId,
        email: tokenizedEmail(token),
      });

      schoolTeacherIds.push(user.id);
    }

    studentIds.set(schoolKey, schoolStudentIds);
    teacherIds.set(schoolKey, schoolTeacherIds);

    console.log(`[Seed] ${def.shortCode}: ${studentCount} students, ${teacherCount} teachers`);
  }

  return { studentIds, teacherIds };
}

/**
 * Seed classes
 */
async function seedClasses(
  schoolMap: Map<string, string>,
  courseMap: Map<string, string>,
  academicSessionId: string,
  random: () => number
): Promise<Map<string, { classId: string; gradeLevel: string }[]>> {
  const classMap = new Map<string, { classId: string; gradeLevel: string }[]>();

  for (const [schoolKey, schoolId] of Array.from(schoolMap.entries())) {
    const def = SCHOOLS.find(s => s.id === schoolKey);
    if (!def) continue;

    const schoolClasses: { classId: string; gradeLevel: string }[] = [];

    for (let grade = def.gradeMin; grade <= def.gradeMax; grade++) {
      const gradeLabel = grade === 0 ? 'K' : grade.toString();

      for (let period = 1; period <= SEED_CONFIG.classesPerGrade; period++) {
        const subject = SUBJECTS[Math.floor(random() * SUBJECTS.length)]!;
        const courseId = courseMap.get(subject);
        const classCode = `${subject.substring(0, 3).toUpperCase()}${gradeLabel}P${period}`;

        const cls = await upsertClass({
          sourcedId: `CLS_${schoolKey.toUpperCase()}_${gradeLabel}_${period}`,
          schoolId,
          courseId,
          academicSessionId,
          title: `${subject} - Grade ${gradeLabel}`,
          classCode,
          gradeLevel: gradeLabel,
          subject,
          period: period.toString(),
        });

        schoolClasses.push({ classId: cls.id, gradeLevel: gradeLabel });
      }
    }

    classMap.set(schoolKey, schoolClasses);
  }

  const totalClasses = Array.from(classMap.values()).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`[Seed] Created ${totalClasses} classes`);

  return classMap;
}

/**
 * Seed enrollments
 */
async function seedEnrollments(
  studentIds: Map<string, string[]>,
  classMap: Map<string, { classId: string; gradeLevel: string }[]>,
  random: () => number
): Promise<number> {
  let enrollmentCount = 0;

  // Get student grade levels from database
  const students = await prisma.user.findMany({
    where: { role: 'student', deletedAt: null },
    select: { id: true, gradeLevel: true },
  });

  const studentGrades = new Map(students.map(s => [s.id, s.gradeLevel]));

  for (const [schoolKey, schoolStudentIds] of Array.from(studentIds.entries())) {
    const schoolClasses = classMap.get(schoolKey) || [];

    for (const studentId of schoolStudentIds) {
      const studentGrade = studentGrades.get(studentId) || 'K';

      // Find classes matching student's grade
      const eligibleClasses = schoolClasses.filter(c => c.gradeLevel === studentGrade);

      // Enroll in up to N classes
      const enrollCount = Math.min(SEED_CONFIG.enrollmentsPerStudent, eligibleClasses.length);
      const shuffled = [...eligibleClasses].sort(() => random() - 0.5);

      for (let i = 0; i < enrollCount; i++) {
        const cls = shuffled[i];
        if (!cls) continue;

        await upsertEnrollment({
          sourcedId: `ENR_${studentId}_${cls.classId}`,
          userId: studentId,
          classId: cls.classId,
          role: 'student',
          isPrimary: true,
        });

        enrollmentCount++;
      }
    }
  }

  console.log(`[Seed] Created ${enrollmentCount} enrollments`);
  return enrollmentCount;
}

// =============================================================================
// MAIN SEED FUNCTION
// =============================================================================

/**
 * Check if database already has LAUSD data
 */
export async function isSeeded(): Promise<boolean> {
  const district = await prisma.district.findFirst({
    where: { shortCode: 'LAUSD' },
  });
  return !!district;
}

/**
 * Seed the database with LAUSD demo data
 */
export async function seedLAUSD(): Promise<void> {
  console.log('[Seed] Starting LAUSD demo data seed...');
  const startTime = Date.now();

  // Check if already seeded
  if (await isSeeded()) {
    console.log('[Seed] Database already contains LAUSD data. Skipping seed.');
    const stats = await getEntityStats();
    console.log('[Seed] Current stats:', stats);
    return;
  }

  // Initialize seeded random
  const random = createSeededRandom(20241205);

  // Seed in order (respecting foreign keys)
  const districtId = await seedDistrict();
  const academicSessionId = await seedAcademicSessions(districtId);
  const courseMap = await seedCourses(districtId);
  const schoolMap = await seedSchools(districtId);
  const { studentIds } = await seedUsers(schoolMap, random);
  const classMap = await seedClasses(schoolMap, courseMap, academicSessionId, random);
  await seedEnrollments(studentIds, classMap, random);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const stats = await getEntityStats();

  console.log('[Seed] LAUSD seed complete!');
  console.log(`[Seed] Duration: ${duration}s`);
  console.log('[Seed] Stats:', stats);
}

/**
 * Clear all LAUSD data (for re-seeding)
 */
export async function clearLAUSDData(): Promise<void> {
  console.log('[Seed] Clearing LAUSD data...');

  // Find LAUSD district
  const district = await prisma.district.findFirst({
    where: { shortCode: 'LAUSD' },
  });

  if (!district) {
    console.log('[Seed] No LAUSD data found.');
    return;
  }

  // Delete in order (respecting foreign keys)
  await prisma.enrollment.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.course.deleteMany({ where: { districtId: district.id } });
  await prisma.user.deleteMany({});
  await prisma.academicSession.deleteMany({ where: { districtId: district.id } });
  await prisma.school.deleteMany({ where: { districtId: district.id } });
  await prisma.district.delete({ where: { id: district.id } });

  console.log('[Seed] LAUSD data cleared.');
}

/**
 * Re-seed LAUSD data (clear and seed)
 */
export async function reseedLAUSD(): Promise<void> {
  await clearLAUSDData();
  await seedLAUSD();
}

// =============================================================================
// CLI ENTRY POINT
// =============================================================================

// Allow running directly: npx ts-node lib/db/seed.ts
if (require.main === module) {
  const arg = process.argv[2];

  const run = async () => {
    try {
      if (arg === '--clear') {
        await clearLAUSDData();
      } else if (arg === '--reseed') {
        await reseedLAUSD();
      } else {
        await seedLAUSD();
      }
      process.exit(0);
    } catch (error) {
      console.error('[Seed] Error:', error);
      process.exit(1);
    }
  };

  run();
}
