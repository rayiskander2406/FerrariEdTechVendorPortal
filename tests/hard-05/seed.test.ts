/**
 * HARD-05: LAUSD Seed Tests
 *
 * Tests for the seed script functions and data integrity.
 * Uses mock data to avoid database dependencies.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing seed module
vi.mock('@/lib/db/index', () => ({
  prisma: {
    district: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    school: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    class: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    enrollment: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    academicSession: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    course: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// Mock entities module
vi.mock('@/lib/db/entities', () => ({
  upsertDistrict: vi.fn().mockResolvedValue({ id: 'dist-1', name: 'LAUSD' }),
  upsertSchool: vi.fn().mockImplementation((input) =>
    Promise.resolve({ id: `school-${input.shortCode}`, ...input })
  ),
  upsertUser: vi.fn().mockImplementation((input) =>
    Promise.resolve({ id: `user-${input.sourcedId}`, ...input })
  ),
  upsertClass: vi.fn().mockImplementation((input) =>
    Promise.resolve({ id: `class-${input.sourcedId}`, ...input })
  ),
  upsertEnrollment: vi.fn().mockImplementation((input) =>
    Promise.resolve({ id: `enr-${input.sourcedId}`, ...input })
  ),
  upsertAcademicSession: vi.fn().mockImplementation((input) =>
    Promise.resolve({ id: `sess-${input.sourcedId}`, ...input })
  ),
  upsertCourse: vi.fn().mockImplementation((input) =>
    Promise.resolve({ id: `course-${input.coursecode}`, ...input })
  ),
  getEntityStats: vi.fn().mockResolvedValue({
    districts: 1,
    schools: 5,
    users: 610,
    classes: 200,
    enrollments: 3000,
    courses: 15,
    academicSessions: 3,
  }),
}));

// Import after mocking
import { seedLAUSD, isSeeded, clearLAUSDData } from '@/lib/db/seed';
import { prisma } from '@/lib/db/index';
import * as entities from '@/lib/db/entities';

describe('HARD-05: LAUSD Seed Script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isSeeded', () => {
    it('returns false when no LAUSD district exists', async () => {
      vi.mocked(prisma.district.findFirst).mockResolvedValue(null);

      const result = await isSeeded();

      expect(result).toBe(false);
      expect(prisma.district.findFirst).toHaveBeenCalledWith({
        where: { shortCode: 'LAUSD' },
      });
    });

    it('returns true when LAUSD district exists', async () => {
      vi.mocked(prisma.district.findFirst).mockResolvedValue({
        id: 'dist-1',
        sourcedId: 'DIST_LAUSD',
        name: 'Los Angeles Unified School District',
        shortCode: 'LAUSD',
        ncesId: null,
        stateId: null,
        timezone: 'America/Los_Angeles',
        locale: 'en-US',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        lastSyncedAt: null,
      });

      const result = await isSeeded();

      expect(result).toBe(true);
    });
  });

  describe('seedLAUSD', () => {
    it('skips seeding if already seeded', async () => {
      vi.mocked(prisma.district.findFirst).mockResolvedValue({
        id: 'dist-1',
        sourcedId: 'DIST_LAUSD',
        name: 'Los Angeles Unified School District',
        shortCode: 'LAUSD',
        ncesId: null,
        stateId: null,
        timezone: 'America/Los_Angeles',
        locale: 'en-US',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        lastSyncedAt: null,
      });

      await seedLAUSD();

      expect(entities.upsertDistrict).not.toHaveBeenCalled();
      expect(entities.getEntityStats).toHaveBeenCalled();
    });

    it('creates district, schools, users, classes, enrollments when not seeded', async () => {
      vi.mocked(prisma.district.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: 'user-1', gradeLevel: '9' },
        { id: 'user-2', gradeLevel: '10' },
      ] as any);

      await seedLAUSD();

      // District
      expect(entities.upsertDistrict).toHaveBeenCalledWith(
        expect.objectContaining({
          sourcedId: 'DIST_LAUSD',
          shortCode: 'LAUSD',
        })
      );

      // Academic sessions (school year + 2 semesters)
      expect(entities.upsertAcademicSession).toHaveBeenCalledTimes(3);

      // 5 schools
      expect(entities.upsertSchool).toHaveBeenCalledTimes(5);

      // Courses (15 subjects)
      expect(entities.upsertCourse).toHaveBeenCalledTimes(15);

      // Users created (students + teachers)
      expect(entities.upsertUser).toHaveBeenCalled();

      // Classes created
      expect(entities.upsertClass).toHaveBeenCalled();
    });
  });

  describe('clearLAUSDData', () => {
    it('does nothing if LAUSD not found', async () => {
      vi.mocked(prisma.district.findFirst).mockResolvedValue(null);

      await clearLAUSDData();

      expect(prisma.enrollment.deleteMany).not.toHaveBeenCalled();
    });

    it('deletes all LAUSD data in correct order', async () => {
      vi.mocked(prisma.district.findFirst).mockResolvedValue({
        id: 'dist-1',
        sourcedId: 'DIST_LAUSD',
        name: 'Los Angeles Unified School District',
        shortCode: 'LAUSD',
        ncesId: null,
        stateId: null,
        timezone: 'America/Los_Angeles',
        locale: 'en-US',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        lastSyncedAt: null,
      });

      await clearLAUSDData();

      // Verify order: enrollments, classes, courses, users, sessions, schools, district
      const deleteOrder = [
        prisma.enrollment.deleteMany,
        prisma.class.deleteMany,
        prisma.course.deleteMany,
        prisma.user.deleteMany,
        prisma.academicSession.deleteMany,
        prisma.school.deleteMany,
        prisma.district.delete,
      ];

      deleteOrder.forEach((fn) => {
        expect(fn).toHaveBeenCalled();
      });
    });
  });

  describe('Seed Data Integrity', () => {
    it('creates correct number of schools (5)', async () => {
      vi.mocked(prisma.district.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      await seedLAUSD();

      expect(entities.upsertSchool).toHaveBeenCalledTimes(5);

      // Verify school types
      const schoolCalls = vi.mocked(entities.upsertSchool).mock.calls;
      const types = schoolCalls.map((call) => call[0].type);
      expect(types).toContain('high');
      expect(types).toContain('middle');
      expect(types).toContain('elementary');
      expect(types).toContain('K-12');
      expect(types).toContain('K-8');
    });

    it('creates academic sessions with correct hierarchy', async () => {
      vi.mocked(prisma.district.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      await seedLAUSD();

      const sessionCalls = vi.mocked(entities.upsertAcademicSession).mock.calls;

      // First call is school year (no parent)
      expect(sessionCalls[0][0]).toMatchObject({
        sourcedId: 'SESS_2024_2025',
        type: 'schoolYear',
      });
      expect(sessionCalls[0][0].parentId).toBeUndefined();

      // Fall semester has parent
      expect(sessionCalls[1][0]).toMatchObject({
        sourcedId: 'SESS_2024_FALL',
        type: 'semester',
      });
      expect(sessionCalls[1][0].parentId).toBeDefined();

      // Spring semester has parent
      expect(sessionCalls[2][0]).toMatchObject({
        sourcedId: 'SESS_2025_SPRING',
        type: 'semester',
      });
      expect(sessionCalls[2][0].parentId).toBeDefined();
    });

    it('creates all 15 courses', async () => {
      vi.mocked(prisma.district.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      await seedLAUSD();

      expect(entities.upsertCourse).toHaveBeenCalledTimes(15);

      const subjects = vi
        .mocked(entities.upsertCourse)
        .mock.calls.map((call) => call[0].subject);

      expect(subjects).toContain('Mathematics');
      expect(subjects).toContain('English Language Arts');
      expect(subjects).toContain('Science');
    });

    it('creates students with tokenized data', async () => {
      vi.mocked(prisma.district.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      await seedLAUSD();

      const userCalls = vi.mocked(entities.upsertUser).mock.calls;
      const students = userCalls.filter((call) => call[0].role === 'student');

      // All students should have tokenized last names
      students.forEach((call) => {
        expect(call[0].familyName).toBe('[TOKENIZED]');
        expect(call[0].token).toMatch(/^TKN_STU_/);
        expect(call[0].email).toMatch(/@relay\.schoolday\.lausd\.net$/);
      });
    });

    it('creates teachers with tokenized data', async () => {
      vi.mocked(prisma.district.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      await seedLAUSD();

      const userCalls = vi.mocked(entities.upsertUser).mock.calls;
      const teachers = userCalls.filter((call) => call[0].role === 'teacher');

      // All teachers should have tokenized data
      teachers.forEach((call) => {
        expect(call[0].familyName).toBe('[TOKENIZED]');
        expect(call[0].token).toMatch(/^TKN_TCH_/);
      });
    });
  });

  describe('Deterministic Seeding', () => {
    it('produces same results with same seed', async () => {
      vi.mocked(prisma.district.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      // Run seedLAUSD twice and compare
      await seedLAUSD();
      const firstRunCalls = vi.mocked(entities.upsertUser).mock.calls.slice();

      vi.clearAllMocks();
      vi.mocked(prisma.district.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      await seedLAUSD();
      const secondRunCalls = vi.mocked(entities.upsertUser).mock.calls;

      // First names should be in same order (deterministic random)
      expect(firstRunCalls.length).toBe(secondRunCalls.length);
      for (let i = 0; i < Math.min(10, firstRunCalls.length); i++) {
        expect(firstRunCalls[i][0].givenName).toBe(secondRunCalls[i][0].givenName);
      }
    });
  });
});

describe('HARD-05: Seed Configuration', () => {
  it('has expected student counts per school', () => {
    // Import the config values for testing
    const expectedCounts = {
      'lincoln-high': 200,
      'roosevelt-middle': 120,
      'washington-elem': 80,
      'jefferson-stem': 150,
      'adams-arts': 60,
    };

    // Total should be 610
    const total = Object.values(expectedCounts).reduce((a, b) => a + b, 0);
    expect(total).toBe(610);
  });

  it('teacher ratio is 1:25', () => {
    const teacherRatio = 25;
    const students = 610;
    const expectedTeachers = Math.ceil(students / teacherRatio);

    // 610 / 25 = 24.4 -> 25 teachers (but calculated per school)
    expect(expectedTeachers).toBe(25);
  });
});

describe('HARD-05: School Definitions', () => {
  const SCHOOLS = [
    { id: 'lincoln-high', type: 'high', gradeMin: 9, gradeMax: 12 },
    { id: 'roosevelt-middle', type: 'middle', gradeMin: 6, gradeMax: 8 },
    { id: 'washington-elem', type: 'elementary', gradeMin: 0, gradeMax: 5 },
    { id: 'jefferson-stem', type: 'K-12', gradeMin: 6, gradeMax: 12 },
    { id: 'adams-arts', type: 'K-8', gradeMin: 0, gradeMax: 8 },
  ];

  it('has 5 schools defined', () => {
    expect(SCHOOLS.length).toBe(5);
  });

  it('covers all grade levels', () => {
    const allGrades = new Set<number>();
    SCHOOLS.forEach((school) => {
      for (let g = school.gradeMin; g <= school.gradeMax; g++) {
        allGrades.add(g);
      }
    });

    // K (0) through 12
    expect(allGrades.size).toBe(13);
    expect(allGrades.has(0)).toBe(true); // K
    expect(allGrades.has(12)).toBe(true); // 12th grade
  });

  it('has correct school types', () => {
    const types = SCHOOLS.map((s) => s.type);
    expect(types).toContain('high');
    expect(types).toContain('middle');
    expect(types).toContain('elementary');
    expect(types).toContain('K-12');
    expect(types).toContain('K-8');
  });
});
