/**
 * OneRoster Sandbox API - Real testable endpoints for vendors
 *
 * This provides a real API that vendors can test with Postman, curl, or any HTTP client.
 * Supports standard OneRoster 1.1 endpoints with tokenized synthetic data.
 *
 * Base URL: /api/sandbox/oneroster
 *
 * Endpoints:
 * - GET /students - List all students
 * - GET /students/:id - Get a specific student
 * - GET /teachers - List all teachers
 * - GET /teachers/:id - Get a specific teacher
 * - GET /classes - List all classes
 * - GET /classes/:id - Get a specific class
 * - GET /schools - List all schools
 * - GET /schools/:id - Get a specific school
 * - GET /enrollments - List all enrollments
 * - GET /academicSessions - List academic sessions
 * - GET /orgs - List all organizations
 * - GET /courses - List all courses
 */

import { type NextRequest } from "next/server";
import {
  getSyntheticData,
  type SyntheticStudent,
  type SyntheticTeacher,
  type SyntheticClass,
  type SyntheticSchool,
  type SyntheticEnrollment,
} from "@/lib/data/synthetic";

// =============================================================================
// TYPES
// =============================================================================

interface OneRosterResponseData {
  [key: string]: unknown;
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    status: number;
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function validateApiKey(request: NextRequest): { valid: boolean; error?: string } {
  const authHeader = request.headers.get("Authorization");
  const apiKeyHeader = request.headers.get("X-API-Key");

  // Accept either Bearer token or X-API-Key header
  let apiKey: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    apiKey = authHeader.slice(7);
  } else if (apiKeyHeader) {
    apiKey = apiKeyHeader;
  }

  if (!apiKey) {
    return {
      valid: false,
      error: "Missing API key. Include 'Authorization: Bearer <api_key>' or 'X-API-Key: <api_key>' header.",
    };
  }

  // For sandbox, accept any key that starts with sk_test_ or the demo key
  if (!apiKey.startsWith("sk_test_") && apiKey !== "demo_key_lausd_sandbox") {
    return {
      valid: false,
      error: "Invalid API key format. Sandbox keys should start with 'sk_test_'.",
    };
  }

  return { valid: true };
}

function createErrorResponse(code: string, message: string, status: number): Response {
  const error: ErrorResponse = {
    error: {
      code,
      message,
      status,
    },
  };
  return Response.json(error, {
    status,
    headers: {
      "X-RateLimit-Limit": "60",
      "X-RateLimit-Remaining": "59",
      "X-Request-Id": `req_${Date.now().toString(36)}`,
    },
  });
}

function createSuccessResponse(data: OneRosterResponseData): Response {
  return Response.json(data, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "X-RateLimit-Limit": "60",
      "X-RateLimit-Remaining": "59",
      "X-Request-Id": `req_${Date.now().toString(36)}`,
      "X-OneRoster-Version": "1.1",
      "X-Sandbox-Mode": "true",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, X-API-Key, Content-Type",
    },
  });
}

// =============================================================================
// GET Handler
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Validate API key
  const authResult = validateApiKey(request);
  if (!authResult.valid) {
    return createErrorResponse("unauthorized", authResult.error!, 401);
  }

  const { path } = await params;
  const endpoint = "/" + path.join("/");
  const searchParams = request.nextUrl.searchParams;

  // Parse query parameters
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");
  const filter = searchParams.get("filter");

  // Parse filters (basic OneRoster filter syntax)
  const filters: Record<string, string> = {};
  if (filter) {
    // Simple filter parsing: field='value'
    const filterMatch = filter.match(/(\w+)='([^']+)'/);
    if (filterMatch && filterMatch[1] && filterMatch[2]) {
      filters[filterMatch[1]] = filterMatch[2];
    }
  }

  try {
    // Route to appropriate handler
    const [resource, resourceId] = path;

    switch (resource) {
      case "students":
        return handleStudents(resourceId, limit, offset, filters);

      case "teachers":
        return handleTeachers(resourceId, limit, offset, filters);

      case "classes":
        return handleClasses(resourceId, limit, offset, filters);

      case "schools":
        return handleSchools(resourceId, limit, offset);

      case "enrollments":
        return handleEnrollments(resourceId, limit, offset, filters);

      case "academicSessions":
        return handleAcademicSessions(resourceId);

      case "orgs":
        return handleOrgs(resourceId, limit, offset);

      case "courses":
        return handleCourses(limit, offset);

      default:
        return createErrorResponse(
          "not_found",
          `Endpoint '${endpoint}' not found. Available endpoints: /students, /teachers, /classes, /schools, /enrollments, /academicSessions, /orgs, /courses`,
          404
        );
    }
  } catch (error) {
    console.error("[Sandbox API Error]", error);
    return createErrorResponse(
      "internal_error",
      "An internal error occurred. Please try again.",
      500
    );
  }
}

// =============================================================================
// OPTIONS Handler (CORS preflight)
// =============================================================================

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, X-API-Key, Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

// =============================================================================
// Resource Handlers
// =============================================================================

function handleStudents(
  studentId: string | undefined,
  limit: number,
  offset: number,
  filters: Record<string, string>
): Response {
  const data = getSyntheticData();
  const students = data.students;

  if (studentId) {
    // Get specific student
    const student = students.find(s => s.token === studentId);
    if (!student) {
      return createErrorResponse("not_found", `Student '${studentId}' not found`, 404);
    }
    return createSuccessResponse({ user: formatStudent(student) });
  }

  // List students with filtering
  let filtered = students;

  if (filters["grade"]) {
    const grade = parseInt(filters["grade"]);
    filtered = filtered.filter(s => s.gradeLevel === grade);
  }
  if (filters["schoolId"]) {
    filtered = filtered.filter(s => s.schoolToken === filters["schoolId"]);
  }

  const paginated = filtered.slice(offset, offset + limit);

  return createSuccessResponse({
    users: paginated.map(formatStudent),
    pagination: {
      total: filtered.length,
      limit,
      offset,
      hasMore: offset + limit < filtered.length,
    },
  });
}

function handleTeachers(
  teacherId: string | undefined,
  limit: number,
  offset: number,
  filters: Record<string, string>
): Response {
  const data = getSyntheticData();
  const teachers = data.teachers;

  if (teacherId) {
    const teacher = teachers.find(t => t.token === teacherId);
    if (!teacher) {
      return createErrorResponse("not_found", `Teacher '${teacherId}' not found`, 404);
    }
    return createSuccessResponse({ user: formatTeacher(teacher) });
  }

  let filtered = teachers;
  if (filters["schoolId"]) {
    filtered = filtered.filter(t => t.schoolToken === filters["schoolId"]);
  }

  const paginated = filtered.slice(offset, offset + limit);

  return createSuccessResponse({
    users: paginated.map(formatTeacher),
    pagination: {
      total: filtered.length,
      limit,
      offset,
      hasMore: offset + limit < filtered.length,
    },
  });
}

function handleClasses(
  classId: string | undefined,
  limit: number,
  offset: number,
  filters: Record<string, string>
): Response {
  const data = getSyntheticData();
  const classes = data.classes;

  if (classId) {
    const cls = classes.find(c => c.token === classId);
    if (!cls) {
      return createErrorResponse("not_found", `Class '${classId}' not found`, 404);
    }
    return createSuccessResponse({ class: formatClass(cls) });
  }

  let filtered = classes;
  if (filters["schoolId"]) {
    filtered = filtered.filter(c => c.schoolToken === filters["schoolId"]);
  }
  if (filters["subject"]) {
    const subjectFilter = filters["subject"].toLowerCase();
    filtered = filtered.filter(c => c.subject.toLowerCase().includes(subjectFilter));
  }

  const paginated = filtered.slice(offset, offset + limit);

  return createSuccessResponse({
    classes: paginated.map(formatClass),
    pagination: {
      total: filtered.length,
      limit,
      offset,
      hasMore: offset + limit < filtered.length,
    },
  });
}

function handleSchools(
  schoolId: string | undefined,
  limit: number,
  offset: number
): Response {
  const data = getSyntheticData();
  const schools = data.schools;

  if (schoolId) {
    const school = schools.find(s => s.token === schoolId);
    if (!school) {
      return createErrorResponse("not_found", `School '${schoolId}' not found`, 404);
    }
    return createSuccessResponse({ org: formatSchool(school) });
  }

  const paginated = schools.slice(offset, offset + limit);

  return createSuccessResponse({
    orgs: paginated.map(formatSchool),
    pagination: {
      total: schools.length,
      limit,
      offset,
      hasMore: offset + limit < schools.length,
    },
  });
}

function handleEnrollments(
  enrollmentId: string | undefined,
  limit: number,
  offset: number,
  filters: Record<string, string>
): Response {
  const data = getSyntheticData();
  const enrollments = data.enrollments;

  if (enrollmentId) {
    const enrollment = enrollments.find(e => e.token === enrollmentId);
    if (!enrollment) {
      return createErrorResponse("not_found", `Enrollment '${enrollmentId}' not found`, 404);
    }
    return createSuccessResponse({ enrollment: formatEnrollment(enrollment, data) });
  }

  let filtered = enrollments;
  if (filters["classId"]) {
    filtered = filtered.filter(e => e.classToken === filters["classId"]);
  }
  if (filters["userId"]) {
    filtered = filtered.filter(e => e.studentToken === filters["userId"]);
  }

  const paginated = filtered.slice(offset, offset + limit);

  return createSuccessResponse({
    enrollments: paginated.map(e => formatEnrollment(e, data)),
    pagination: {
      total: filtered.length,
      limit,
      offset,
      hasMore: offset + limit < filtered.length,
    },
  });
}

function handleAcademicSessions(sessionId: string | undefined): Response {
  // Generate mock academic sessions
  const sessions = [
    {
      sourcedId: "as_2024_fall",
      status: "active",
      dateLastModified: new Date().toISOString(),
      title: "Fall 2024",
      type: "semester",
      startDate: "2024-08-19",
      endDate: "2024-12-20",
      schoolYear: "2024-2025",
    },
    {
      sourcedId: "as_2024_spring",
      status: "tobedeleted",
      dateLastModified: new Date().toISOString(),
      title: "Spring 2024",
      type: "semester",
      startDate: "2024-01-08",
      endDate: "2024-05-31",
      schoolYear: "2023-2024",
    },
  ];

  if (sessionId) {
    const session = sessions.find(s => s.sourcedId === sessionId);
    if (!session) {
      return createErrorResponse("not_found", `Academic session '${sessionId}' not found`, 404);
    }
    return createSuccessResponse({ academicSession: session });
  }

  return createSuccessResponse({ academicSessions: sessions });
}

function handleOrgs(
  orgId: string | undefined,
  limit: number,
  offset: number
): Response {
  const data = getSyntheticData();

  // Orgs includes both schools and the district
  const district = {
    sourcedId: "org_lausd_district",
    status: "active",
    dateLastModified: new Date().toISOString(),
    name: "Los Angeles Unified School District",
    type: "district",
    identifier: "LAUSD",
  };

  const orgs = [district, ...data.schools.map(formatSchool)];

  if (orgId) {
    const org = orgs.find(o => o.sourcedId === orgId);
    if (!org) {
      return createErrorResponse("not_found", `Organization '${orgId}' not found`, 404);
    }
    return createSuccessResponse({ org });
  }

  const paginated = orgs.slice(offset, offset + limit);

  return createSuccessResponse({
    orgs: paginated,
    pagination: {
      total: orgs.length,
      limit,
      offset,
      hasMore: offset + limit < orgs.length,
    },
  });
}

function handleCourses(limit: number, offset: number): Response {
  const data = getSyntheticData();

  // Generate unique courses from classes
  const courseMap = new Map<string, { title: string; subject: string; gradeLevel: number }>();

  for (const cls of data.classes) {
    const courseKey = `${cls.subject}_${cls.gradeLevel}`;
    if (!courseMap.has(courseKey)) {
      courseMap.set(courseKey, {
        title: cls.title.split(" - ")[0] || cls.title,
        subject: cls.subject,
        gradeLevel: cls.gradeLevel,
      });
    }
  }

  const courses = Array.from(courseMap.entries()).map(([key, value]) => ({
    sourcedId: `course_${key.toLowerCase().replace(/\s+/g, "_")}`,
    status: "active",
    dateLastModified: new Date().toISOString(),
    title: value.title,
    courseCode: `LAUSD-${key.toUpperCase().replace(/\s+/g, "")}`,
    subjects: [value.subject],
    grades: [value.gradeLevel === 0 ? "KG" : value.gradeLevel.toString()],
  }));

  const paginated = courses.slice(offset, offset + limit);

  return createSuccessResponse({
    courses: paginated,
    pagination: {
      total: courses.length,
      limit,
      offset,
      hasMore: offset + limit < courses.length,
    },
  });
}

// =============================================================================
// Formatters (OneRoster 1.1 format)
// =============================================================================

function formatStudent(student: SyntheticStudent) {
  return {
    sourcedId: student.token,
    status: "active",
    dateLastModified: new Date().toISOString(),
    enabledUser: true,
    role: "student",
    username: student.email.split("@")[0],
    userIds: [{ type: "LAUSD_ID", identifier: student.token }],
    givenName: student.firstName,
    familyName: student.lastName, // Will show [TOKENIZED] for Privacy-Safe
    email: student.email, // Will be tokenized email
    grades: [student.gradeLevel === 0 ? "KG" : student.gradeLevel.toString()],
    orgs: [{
      href: `/api/sandbox/oneroster/orgs/${student.schoolToken}`,
      sourcedId: student.schoolToken,
      type: "org",
    }],
    metadata: {
      accessTier: "PRIVACY_SAFE",
      tokenized: true,
      piiRestricted: ["familyName", "email", "dateOfBirth"],
    },
  };
}

function formatTeacher(teacher: SyntheticTeacher) {
  return {
    sourcedId: teacher.token,
    status: "active",
    dateLastModified: new Date().toISOString(),
    enabledUser: true,
    role: "teacher",
    username: teacher.email.split("@")[0],
    userIds: [{ type: "LAUSD_ID", identifier: teacher.token }],
    givenName: teacher.firstName,
    familyName: teacher.lastName,
    email: teacher.email,
    orgs: [{
      href: `/api/sandbox/oneroster/orgs/${teacher.schoolToken}`,
      sourcedId: teacher.schoolToken,
      type: "org",
    }],
    metadata: {
      accessTier: "PRIVACY_SAFE",
      tokenized: true,
      department: teacher.department,
      subjects: teacher.subjects,
    },
  };
}

function formatClass(cls: SyntheticClass) {
  return {
    sourcedId: cls.token,
    status: "active",
    dateLastModified: new Date().toISOString(),
    title: cls.title,
    classCode: cls.courseCode,
    classType: "scheduled",
    location: `Room ${cls.period}0${cls.gradeLevel}`,
    grades: [cls.gradeLevel === 0 ? "KG" : cls.gradeLevel.toString()],
    subjects: [cls.subject],
    course: {
      href: `/api/sandbox/oneroster/courses/course_${cls.subject.toLowerCase().replace(/\s+/g, "_")}_${cls.gradeLevel}`,
      sourcedId: `course_${cls.subject.toLowerCase().replace(/\s+/g, "_")}_${cls.gradeLevel}`,
      type: "course",
    },
    school: {
      href: `/api/sandbox/oneroster/schools/${cls.schoolToken}`,
      sourcedId: cls.schoolToken,
      type: "org",
    },
    terms: [{
      href: "/api/sandbox/oneroster/academicSessions/as_2024_fall",
      sourcedId: "as_2024_fall",
      type: "academicSession",
    }],
    periods: [cls.period.toString()],
  };
}

function formatSchool(school: SyntheticSchool) {
  return {
    sourcedId: school.token,
    status: "active",
    dateLastModified: new Date().toISOString(),
    name: school.name,
    type: "school",
    identifier: school.shortName.replace(/\s+/g, "_").toUpperCase(),
    parent: {
      href: "/api/sandbox/oneroster/orgs/org_lausd_district",
      sourcedId: "org_lausd_district",
      type: "org",
    },
    metadata: {
      gradeRange: school.gradeRange,
      studentCount: school.studentCount,
      address: school.address,
      principal: school.principal,
    },
  };
}

function formatEnrollment(
  enrollment: SyntheticEnrollment,
  data: ReturnType<typeof getSyntheticData>
) {
  // Find the class to get the school
  const cls = data.classes.find(c => c.token === enrollment.classToken);
  const schoolToken = cls?.schoolToken ?? "UNKNOWN";

  return {
    sourcedId: enrollment.token,
    status: enrollment.status === "active" ? "active" : "tobedeleted",
    dateLastModified: new Date().toISOString(),
    role: enrollment.role,
    primary: true,
    beginDate: enrollment.startDate,
    endDate: null,
    user: {
      href: `/api/sandbox/oneroster/students/${enrollment.studentToken}`,
      sourcedId: enrollment.studentToken,
      type: "user",
    },
    class: {
      href: `/api/sandbox/oneroster/classes/${enrollment.classToken}`,
      sourcedId: enrollment.classToken,
      type: "class",
    },
    school: {
      href: `/api/sandbox/oneroster/schools/${schoolToken}`,
      sourcedId: schoolToken,
      type: "org",
    },
  };
}
