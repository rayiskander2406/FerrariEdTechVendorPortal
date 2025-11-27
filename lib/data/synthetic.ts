/**
 * Synthetic LAUSD Demo Data Generator
 *
 * Generates realistic tokenized data for 5 LAUSD schools with:
 * - Students (tokenized IDs, emails, last names)
 * - Teachers (tokenized)
 * - Classes and Enrollments
 *
 * All tokens are deterministic using seeded hashing.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface SyntheticSchool {
  token: string;
  name: string;
  shortName: string;
  gradeRange: { min: number; max: number };
  studentCount: number;
  address: string;
  principal: string;
}

export interface SyntheticStudent {
  token: string;
  firstName: string;
  lastName: string; // Always "[TOKENIZED]"
  email: string;
  gradeLevel: number;
  schoolToken: string;
  dateOfBirth: string; // Tokenized as "[TOKENIZED]"
  enrollmentDate: string;
}

export interface SyntheticTeacher {
  token: string;
  firstName: string;
  lastName: string; // Always "[TOKENIZED]"
  email: string;
  schoolToken: string;
  department: string;
  subjects: string[];
}

export interface SyntheticClass {
  token: string;
  title: string;
  courseCode: string;
  schoolToken: string;
  teacherToken: string;
  gradeLevel: number;
  period: number;
  subject: string;
}

export interface SyntheticEnrollment {
  token: string;
  studentToken: string;
  classToken: string;
  role: "student";
  status: "active" | "inactive";
  startDate: string;
}

export interface SyntheticData {
  schools: SyntheticSchool[];
  students: SyntheticStudent[];
  teachers: SyntheticTeacher[];
  classes: SyntheticClass[];
  enrollments: SyntheticEnrollment[];
  generatedAt: Date;
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    totalEnrollments: number;
  };
}

export interface PodsApplication {
  id: string;
  vendorName: string;
  applicationName: string;
  contactEmail: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  accessTier: "TOKEN_ONLY" | "SELECTIVE" | "FULL_ACCESS";
  submittedAt: Date | null;
  reviewedAt: Date | null;
  expiresAt: Date | null;
}

export interface OneRosterResponse {
  users?: OneRosterUser[];
  orgs?: OneRosterOrg[];
  classes?: OneRosterClass[];
  enrollments?: OneRosterEnrollment[];
  statusInfoSet?: { imsx_codeMajor: string; imsx_severity: string; imsx_description: string };
}

export interface OneRosterUser {
  sourcedId: string;
  status: "active" | "tobedeleted";
  dateLastModified: string;
  role: "student" | "teacher" | "administrator";
  givenName: string;
  familyName: string;
  email: string;
  grades?: string[];
  orgs: { sourcedId: string; type: "school" }[];
}

export interface OneRosterOrg {
  sourcedId: string;
  status: "active";
  dateLastModified: string;
  name: string;
  type: "school" | "district";
  identifier: string;
}

export interface OneRosterClass {
  sourcedId: string;
  status: "active";
  dateLastModified: string;
  title: string;
  classCode: string;
  classType: "homeroom" | "scheduled";
  course: { sourcedId: string };
  school: { sourcedId: string };
  terms: { sourcedId: string }[];
  periods?: string[];
}

export interface OneRosterEnrollment {
  sourcedId: string;
  status: "active" | "tobedeleted";
  dateLastModified: string;
  role: "student" | "teacher";
  user: { sourcedId: string };
  class: { sourcedId: string };
  school: { sourcedId: string };
}

// =============================================================================
// SEEDED RANDOM & HASH FUNCTIONS
// =============================================================================

/**
 * Simple seeded PRNG (Mulberry32)
 */
function createSeededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate deterministic 8-character hash from seed string
 */
function generateHash(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert to base36 and ensure 8 characters
  const base36 = Math.abs(hash).toString(36).toUpperCase();
  const padded = (base36 + "00000000").slice(0, 8);
  return padded;
}

/**
 * Generate student token
 */
function studentToken(schoolId: string, index: number): string {
  return `TKN_STU_${generateHash(`student_${schoolId}_${index}`)}`;
}

/**
 * Generate teacher token
 */
function teacherToken(schoolId: string, index: number): string {
  return `TKN_TCH_${generateHash(`teacher_${schoolId}_${index}`)}`;
}

/**
 * Generate class token
 */
function classToken(schoolId: string, subject: string, period: number): string {
  return `TKN_CLS_${generateHash(`class_${schoolId}_${subject}_${period}`)}`;
}

/**
 * Generate enrollment token
 */
function enrollmentToken(studentToken: string, classToken: string): string {
  return `TKN_ENR_${generateHash(`enrollment_${studentToken}_${classToken}`)}`;
}

/**
 * Generate school token
 */
function schoolToken(schoolName: string): string {
  return `TKN_SCH_${generateHash(`school_${schoolName}`)}`;
}

/**
 * Generate tokenized email
 */
function tokenizedEmail(token: string, type: "STU" | "TCH"): string {
  const hash = token.replace(`TKN_${type}_`, "").toLowerCase();
  return `TKN_${type}_${hash}@relay.schoolday.lausd.net`;
}

// =============================================================================
// NAME DATA
// =============================================================================

const FIRST_NAMES = [
  // Common diverse names reflecting LAUSD demographics
  "Sofia", "Miguel", "Emily", "Jose", "Isabella", "Carlos", "Mia", "Angel",
  "Camila", "David", "Valentina", "Daniel", "Luna", "Diego", "Aria", "Juan",
  "Victoria", "Luis", "Scarlett", "Jesus", "Chloe", "Anthony", "Penelope", "Kevin",
  "Riley", "Bryan", "Zoey", "Alexander", "Nora", "Brandon", "Lily", "Adrian",
  "Eleanor", "Jonathan", "Hannah", "Christopher", "Addison", "Joshua", "Aubrey", "Matthew",
  "Natalie", "Andrew", "Leah", "Sebastian", "Savannah", "Nathan", "Brooklyn", "Ryan",
  "Stella", "Eric", "Hazel", "Jason", "Aurora", "Tyler", "Paisley", "Jacob",
  "Maya", "Ethan", "Willow", "Noah", "Evelyn", "Liam", "Abigail", "Mason",
  "Aaliyah", "James", "Layla", "Benjamin", "Skylar", "Henry", "Madelyn", "William",
  "Jade", "Michael", "Jasmine", "Samuel", "Ruby", "Gabriel", "Eva", "Owen",
  "Lucia", "Lucas", "Gabriella", "Jayden", "Ariana", "Dylan", "Naomi", "Luke",
  "Elena", "Isaac", "Daniela", "Isaiah", "Vivian", "Jack", "Kaylee", "Oliver",
  "Alyssa", "Elijah", "Sarah", "Caleb", "Allison", "Nicholas", "Kennedy", "Robert",
];

const TEACHER_FIRST_NAMES = [
  "Patricia", "Michael", "Jennifer", "Robert", "Maria", "David", "Linda", "James",
  "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas",
  "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Matthew",
  "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley", "Steven",
];

const SUBJECTS = [
  "Mathematics", "English Language Arts", "Science", "Social Studies", "History",
  "Physical Education", "Art", "Music", "Spanish", "Computer Science",
  "Biology", "Chemistry", "Physics", "Algebra", "Geometry", "Calculus",
  "World History", "US History", "Government", "Economics",
];

const DEPARTMENTS = [
  "Mathematics", "English", "Science", "Social Studies", "Physical Education",
  "Arts", "World Languages", "Technology", "Special Education",
];

// =============================================================================
// SCHOOL DEFINITIONS
// =============================================================================

const SCHOOL_DEFINITIONS: Omit<SyntheticSchool, "token">[] = [
  {
    name: "Abraham Lincoln High School",
    shortName: "Lincoln High",
    gradeRange: { min: 9, max: 12 },
    studentCount: 2500,
    address: "3501 N Broadway, Los Angeles, CA 90031",
    principal: "Dr. Martinez",
  },
  {
    name: "Theodore Roosevelt Middle School",
    shortName: "Roosevelt Middle",
    gradeRange: { min: 6, max: 8 },
    studentCount: 1200,
    address: "456 S Main St, Los Angeles, CA 90013",
    principal: "Ms. Johnson",
  },
  {
    name: "George Washington Elementary School",
    shortName: "Washington Elementary",
    gradeRange: { min: 0, max: 5 }, // K=0
    studentCount: 800,
    address: "789 W Olympic Blvd, Los Angeles, CA 90015",
    principal: "Mr. Chen",
  },
  {
    name: "Thomas Jefferson STEM Academy",
    shortName: "Jefferson STEM",
    gradeRange: { min: 6, max: 12 },
    studentCount: 1500,
    address: "1234 Innovation Way, Los Angeles, CA 90024",
    principal: "Dr. Patel",
  },
  {
    name: "John Adams Arts Magnet",
    shortName: "Adams Arts",
    gradeRange: { min: 0, max: 8 }, // K=0
    studentCount: 600,
    address: "567 Arts District Ave, Los Angeles, CA 90021",
    principal: "Ms. Williams",
  },
];

// =============================================================================
// DATA GENERATION
// =============================================================================

/**
 * Generate all synthetic data for LAUSD demo
 */
export function generateAllData(): SyntheticData {
  const random = createSeededRandom(20241115); // Fixed seed for determinism
  const schools: SyntheticSchool[] = [];
  const students: SyntheticStudent[] = [];
  const teachers: SyntheticTeacher[] = [];
  const classes: SyntheticClass[] = [];
  const enrollments: SyntheticEnrollment[] = [];

  // Generate schools
  for (const def of SCHOOL_DEFINITIONS) {
    schools.push({
      ...def,
      token: schoolToken(def.shortName),
    });
  }

  // Generate data for each school
  for (const school of schools) {
    const def = SCHOOL_DEFINITIONS.find((d) => d.shortName === school.shortName);
    if (!def) continue;

    // Generate students
    for (let i = 0; i < def.studentCount; i++) {
      const firstName = FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)];
      const gradeLevel =
        def.gradeRange.min + Math.floor(random() * (def.gradeRange.max - def.gradeRange.min + 1));
      const token = studentToken(school.token, i);

      students.push({
        token,
        firstName: firstName ?? "Unknown",
        lastName: "[TOKENIZED]",
        email: tokenizedEmail(token, "STU"),
        gradeLevel,
        schoolToken: school.token,
        dateOfBirth: "[TOKENIZED]",
        enrollmentDate: "2024-08-15",
      });
    }

    // Calculate teachers per school (roughly 1 teacher per 25 students)
    const teacherCount = Math.ceil(def.studentCount / 25);

    // Generate teachers
    for (let i = 0; i < teacherCount; i++) {
      const firstName = TEACHER_FIRST_NAMES[Math.floor(random() * TEACHER_FIRST_NAMES.length)];
      const department = DEPARTMENTS[Math.floor(random() * DEPARTMENTS.length)];
      const token = teacherToken(school.token, i);

      // Assign 1-3 subjects based on department
      const subjectCount = 1 + Math.floor(random() * 3);
      const teacherSubjects: string[] = [];
      for (let j = 0; j < subjectCount; j++) {
        const subject = SUBJECTS[Math.floor(random() * SUBJECTS.length)];
        if (subject && !teacherSubjects.includes(subject)) {
          teacherSubjects.push(subject);
        }
      }

      teachers.push({
        token,
        firstName: firstName ?? "Unknown",
        lastName: "[TOKENIZED]",
        email: tokenizedEmail(token, "TCH"),
        schoolToken: school.token,
        department: department ?? "General",
        subjects: teacherSubjects,
      });
    }

    // Generate classes (roughly 6 periods per grade level)
    const schoolTeachers = teachers.filter((t) => t.schoolToken === school.token);
    for (
      let grade = def.gradeRange.min;
      grade <= def.gradeRange.max;
      grade++
    ) {
      for (let period = 1; period <= 6; period++) {
        const subject = SUBJECTS[Math.floor(random() * SUBJECTS.length)] ?? "General Studies";
        const teacher = schoolTeachers[Math.floor(random() * schoolTeachers.length)];
        if (!teacher) continue;

        const token = classToken(school.token, subject, grade * 10 + period);

        classes.push({
          token,
          title: `${subject} - Grade ${grade === 0 ? "K" : grade}`,
          courseCode: `${subject.substring(0, 3).toUpperCase()}${grade}0${period}`,
          schoolToken: school.token,
          teacherToken: teacher.token,
          gradeLevel: grade,
          period,
          subject,
        });
      }
    }

    // Generate enrollments (each student enrolled in 5-7 classes)
    const schoolStudents = students.filter((s) => s.schoolToken === school.token);
    const schoolClasses = classes.filter((c) => c.schoolToken === school.token);

    for (const student of schoolStudents) {
      // Find classes matching student's grade level
      const eligibleClasses = schoolClasses.filter(
        (c) => c.gradeLevel === student.gradeLevel
      );

      // Enroll in up to 6 classes
      const enrollCount = Math.min(6, eligibleClasses.length);
      const shuffled = [...eligibleClasses].sort(() => random() - 0.5);

      for (let i = 0; i < enrollCount; i++) {
        const cls = shuffled[i];
        if (!cls) continue;

        enrollments.push({
          token: enrollmentToken(student.token, cls.token),
          studentToken: student.token,
          classToken: cls.token,
          role: "student",
          status: "active",
          startDate: "2024-08-15",
        });
      }
    }
  }

  return {
    schools,
    students,
    teachers,
    classes,
    enrollments,
    generatedAt: new Date("2024-11-15T00:00:00Z"),
    stats: {
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      totalEnrollments: enrollments.length,
    },
  };
}

// =============================================================================
// PRE-GENERATED DATA
// =============================================================================

export const SYNTHETIC_DATA: SyntheticData = generateAllData();

// =============================================================================
// ONEROSTER API RESPONSE GENERATOR
// =============================================================================

interface OneRosterFilters {
  schoolId?: string;
  role?: "student" | "teacher";
  grade?: number;
  classId?: string;
  userId?: string;
}

/**
 * Get OneRoster-formatted response for a given endpoint
 */
export function getOneRosterResponse(
  endpoint: string,
  filters?: OneRosterFilters,
  limit: number = 100,
  offset: number = 0
): OneRosterResponse {
  const dateModified = "2024-11-15T00:00:00Z";

  switch (endpoint) {
    case "/users": {
      const users: OneRosterUser[] = [];

      // Add students
      if (!filters?.role || filters.role === "student") {
        let filteredStudents = SYNTHETIC_DATA.students;

        if (filters?.schoolId) {
          filteredStudents = filteredStudents.filter(
            (s) => s.schoolToken === filters.schoolId
          );
        }
        if (filters?.grade !== undefined) {
          filteredStudents = filteredStudents.filter(
            (s) => s.gradeLevel === filters.grade
          );
        }

        users.push(
          ...filteredStudents.map((s) => ({
            sourcedId: s.token,
            status: "active" as const,
            dateLastModified: dateModified,
            role: "student" as const,
            givenName: s.firstName,
            familyName: s.lastName,
            email: s.email,
            grades: [s.gradeLevel === 0 ? "KG" : s.gradeLevel.toString()],
            orgs: [{ sourcedId: s.schoolToken, type: "school" as const }],
          }))
        );
      }

      // Add teachers
      if (!filters?.role || filters.role === "teacher") {
        let filteredTeachers = SYNTHETIC_DATA.teachers;

        if (filters?.schoolId) {
          filteredTeachers = filteredTeachers.filter(
            (t) => t.schoolToken === filters.schoolId
          );
        }

        users.push(
          ...filteredTeachers.map((t) => ({
            sourcedId: t.token,
            status: "active" as const,
            dateLastModified: dateModified,
            role: "teacher" as const,
            givenName: t.firstName,
            familyName: t.lastName,
            email: t.email,
            orgs: [{ sourcedId: t.schoolToken, type: "school" as const }],
          }))
        );
      }

      // Apply pagination
      const paginated = users.slice(offset, offset + limit);

      return {
        users: paginated,
        statusInfoSet: {
          imsx_codeMajor: "success",
          imsx_severity: "status",
          imsx_description: `${paginated.length} users returned`,
        },
      };
    }

    case "/orgs": {
      const orgs: OneRosterOrg[] = SYNTHETIC_DATA.schools.map((s) => ({
        sourcedId: s.token,
        status: "active" as const,
        dateLastModified: dateModified,
        name: s.name,
        type: "school" as const,
        identifier: s.shortName.replace(/\s+/g, "_").toUpperCase(),
      }));

      // Add district
      orgs.unshift({
        sourcedId: "TKN_ORG_LAUSD0001",
        status: "active",
        dateLastModified: dateModified,
        name: "Los Angeles Unified School District",
        type: "district",
        identifier: "LAUSD",
      });

      return {
        orgs: orgs.slice(offset, offset + limit),
        statusInfoSet: {
          imsx_codeMajor: "success",
          imsx_severity: "status",
          imsx_description: `${orgs.length} orgs returned`,
        },
      };
    }

    case "/classes": {
      let filteredClasses = SYNTHETIC_DATA.classes;

      if (filters?.schoolId) {
        filteredClasses = filteredClasses.filter(
          (c) => c.schoolToken === filters.schoolId
        );
      }
      if (filters?.grade !== undefined) {
        filteredClasses = filteredClasses.filter(
          (c) => c.gradeLevel === filters.grade
        );
      }

      const classes: OneRosterClass[] = filteredClasses
        .slice(offset, offset + limit)
        .map((c) => ({
          sourcedId: c.token,
          status: "active" as const,
          dateLastModified: dateModified,
          title: c.title,
          classCode: c.courseCode,
          classType: "scheduled" as const,
          course: { sourcedId: `CRS_${c.courseCode}` },
          school: { sourcedId: c.schoolToken },
          terms: [{ sourcedId: "TERM_2024_FALL" }],
          periods: [c.period.toString()],
        }));

      return {
        classes,
        statusInfoSet: {
          imsx_codeMajor: "success",
          imsx_severity: "status",
          imsx_description: `${classes.length} classes returned`,
        },
      };
    }

    case "/enrollments": {
      let filteredEnrollments = SYNTHETIC_DATA.enrollments;

      if (filters?.classId) {
        filteredEnrollments = filteredEnrollments.filter(
          (e) => e.classToken === filters.classId
        );
      }
      if (filters?.userId) {
        filteredEnrollments = filteredEnrollments.filter(
          (e) => e.studentToken === filters.userId
        );
      }

      const enrollments: OneRosterEnrollment[] = filteredEnrollments
        .slice(offset, offset + limit)
        .map((e) => {
          // Find the class to get the school
          const cls = SYNTHETIC_DATA.classes.find(
            (c) => c.token === e.classToken
          );
          return {
            sourcedId: e.token,
            status: e.status === "active" ? ("active" as const) : ("tobedeleted" as const),
            dateLastModified: dateModified,
            role: e.role,
            user: { sourcedId: e.studentToken },
            class: { sourcedId: e.classToken },
            school: { sourcedId: cls?.schoolToken ?? "UNKNOWN" },
          };
        });

      return {
        enrollments,
        statusInfoSet: {
          imsx_codeMajor: "success",
          imsx_severity: "status",
          imsx_description: `${enrollments.length} enrollments returned`,
        },
      };
    }

    default:
      return {
        statusInfoSet: {
          imsx_codeMajor: "failure",
          imsx_severity: "error",
          imsx_description: `Unknown endpoint: ${endpoint}`,
        },
      };
  }
}

// =============================================================================
// MOCK PODS DATABASE
// =============================================================================

/**
 * Get mock PoDS applications database with 5 existing records
 */
export function getMockPodsDatabase(): PodsApplication[] {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  return [
    {
      id: "PODS-2024-001",
      vendorName: "MathWhiz Learning",
      applicationName: "MathWhiz Student Portal",
      contactEmail: "integration@mathwhiz.com",
      status: "APPROVED",
      accessTier: "TOKEN_ONLY",
      submittedAt: oneMonthAgo,
      reviewedAt: twoWeeksAgo,
      expiresAt: oneYearFromNow,
    },
    {
      id: "PODS-2024-002",
      vendorName: "ReadingRocket Inc",
      applicationName: "ReadingRocket K-5",
      contactEmail: "support@readingrocket.io",
      status: "APPROVED",
      accessTier: "SELECTIVE",
      submittedAt: twoWeeksAgo,
      reviewedAt: oneWeekAgo,
      expiresAt: oneYearFromNow,
    },
    {
      id: "PODS-2024-003",
      vendorName: "ScienceLab Pro",
      applicationName: "Virtual Lab Environment",
      contactEmail: "admin@sciencelabpro.com",
      status: "PENDING_REVIEW",
      accessTier: "TOKEN_ONLY",
      submittedAt: oneWeekAgo,
      reviewedAt: null,
      expiresAt: null,
    },
    {
      id: "PODS-2024-004",
      vendorName: "EduTrack Systems",
      applicationName: "Student Progress Dashboard",
      contactEmail: "hello@edutrack.net",
      status: "IN_PROGRESS",
      accessTier: "FULL_ACCESS",
      submittedAt: null,
      reviewedAt: null,
      expiresAt: null,
    },
    {
      id: "PODS-2024-005",
      vendorName: "LanguageBridge",
      applicationName: "ESL Learning Platform",
      contactEmail: "partners@languagebridge.edu",
      status: "REJECTED",
      accessTier: "FULL_ACCESS",
      submittedAt: oneMonthAgo,
      reviewedAt: twoWeeksAgo,
      expiresAt: null,
    },
  ];
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Get a specific student by token
 */
export function getStudentByToken(token: string): SyntheticStudent | undefined {
  return SYNTHETIC_DATA.students.find((s) => s.token === token);
}

/**
 * Get a specific teacher by token
 */
export function getTeacherByToken(token: string): SyntheticTeacher | undefined {
  return SYNTHETIC_DATA.teachers.find((t) => t.token === token);
}

/**
 * Get a specific school by token
 */
export function getSchoolByToken(token: string): SyntheticSchool | undefined {
  return SYNTHETIC_DATA.schools.find((s) => s.token === token);
}

/**
 * Get classes for a teacher
 */
export function getClassesByTeacher(teacherToken: string): SyntheticClass[] {
  return SYNTHETIC_DATA.classes.filter((c) => c.teacherToken === teacherToken);
}

/**
 * Get students in a class
 */
export function getStudentsInClass(classToken: string): SyntheticStudent[] {
  const studentTokens = SYNTHETIC_DATA.enrollments
    .filter((e) => e.classToken === classToken)
    .map((e) => e.studentToken);

  return SYNTHETIC_DATA.students.filter((s) => studentTokens.includes(s.token));
}

/**
 * Get classes for a student
 */
export function getClassesForStudent(studentToken: string): SyntheticClass[] {
  const classTokens = SYNTHETIC_DATA.enrollments
    .filter((e) => e.studentToken === studentToken)
    .map((e) => e.classToken);

  return SYNTHETIC_DATA.classes.filter((c) => classTokens.includes(c.token));
}
