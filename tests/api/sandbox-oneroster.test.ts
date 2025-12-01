/**
 * OneRoster Sandbox API Tests
 *
 * Tests for the /api/sandbox/oneroster endpoints.
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, OPTIONS } from "@/app/api/sandbox/oneroster/[...path]/route";
import { NextRequest } from "next/server";

// =============================================================================
// TEST HELPERS
// =============================================================================

function createMockRequest(
  path: string,
  options: {
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest {
  const url = new URL(`http://localhost/api/sandbox/oneroster${path}`);

  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      url.searchParams.set(key, value);
    }
  }

  const headers = new Headers();
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      headers.set(key, value);
    }
  }

  return new NextRequest(url, { headers });
}

function createParams(path: string[]): Promise<{ path: string[] }> {
  return Promise.resolve({ path });
}

// =============================================================================
// AUTHENTICATION TESTS
// =============================================================================

describe("OneRoster Sandbox API - Authentication", () => {
  it("should reject requests without API key", async () => {
    const request = createMockRequest("/students");
    const response = await GET(request, { params: createParams(["students"]) });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error.code).toBe("unauthorized");
    expect(data.error.message).toContain("Missing API key");
  });

  it("should reject requests with invalid API key format", async () => {
    const request = createMockRequest("/students", {
      headers: { Authorization: "Bearer invalid_key" },
    });
    const response = await GET(request, { params: createParams(["students"]) });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error.code).toBe("unauthorized");
    expect(data.error.message).toContain("Invalid API key format");
  });

  it("should accept valid sandbox API key with Bearer token", async () => {
    const request = createMockRequest("/students", {
      headers: { Authorization: "Bearer sbox_test_1234567890123456789012" },
    });
    const response = await GET(request, { params: createParams(["students"]) });

    expect(response.status).toBe(200);
  });

  it("should accept valid sandbox API key with X-API-Key header", async () => {
    const request = createMockRequest("/students", {
      headers: { "X-API-Key": "sbox_test_1234567890123456789012" },
    });
    const response = await GET(request, { params: createParams(["students"]) });

    expect(response.status).toBe(200);
  });

  it("should accept demo key", async () => {
    const request = createMockRequest("/students", {
      headers: { Authorization: "Bearer demo_key_lausd_sandbox" },
    });
    const response = await GET(request, { params: createParams(["students"]) });

    expect(response.status).toBe(200);
  });
});

// =============================================================================
// STUDENTS ENDPOINT TESTS
// =============================================================================

describe("OneRoster Sandbox API - /students", () => {
  const headers = { Authorization: "Bearer sbox_test_1234567890123456789012" };

  it("should list students with pagination", async () => {
    const request = createMockRequest("/students", { headers });
    const response = await GET(request, { params: createParams(["students"]) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.users).toBeDefined();
    expect(Array.isArray(data.users)).toBe(true);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.total).toBeGreaterThan(0);
  });

  it("should limit results based on limit parameter", async () => {
    const request = createMockRequest("/students", {
      headers,
      searchParams: { limit: "5" },
    });
    const response = await GET(request, { params: createParams(["students"]) });

    const data = await response.json();
    expect(data.users.length).toBeLessThanOrEqual(5);
    expect(data.pagination.limit).toBe(5);
  });

  it("should offset results based on offset parameter", async () => {
    const request = createMockRequest("/students", {
      headers,
      searchParams: { offset: "10" },
    });
    const response = await GET(request, { params: createParams(["students"]) });

    const data = await response.json();
    expect(data.pagination.offset).toBe(10);
  });

  it("should filter students by grade", async () => {
    const request = createMockRequest("/students", {
      headers,
      searchParams: { filter: "grade='5'" },
    });
    const response = await GET(request, { params: createParams(["students"]) });

    const data = await response.json();
    for (const student of data.users) {
      expect(student.grades).toContain("5");
    }
  });

  it("should get specific student by ID", async () => {
    // First get a student token
    const listRequest = createMockRequest("/students", {
      headers,
      searchParams: { limit: "1" },
    });
    const listResponse = await GET(listRequest, { params: createParams(["students"]) });
    const listData = await listResponse.json();
    const studentToken = listData.users[0].sourcedId;

    // Then get that specific student
    const request = createMockRequest(`/students/${studentToken}`, { headers });
    const response = await GET(request, { params: createParams(["students", studentToken]) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.sourcedId).toBe(studentToken);
    expect(data.user.role).toBe("student");
  });

  it("should return 404 for non-existent student", async () => {
    const request = createMockRequest("/students/TKN_STU_NOTEXIST", { headers });
    const response = await GET(request, { params: createParams(["students", "TKN_STU_NOTEXIST"]) });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error.code).toBe("not_found");
  });

  it("should include tokenization metadata in student response", async () => {
    const request = createMockRequest("/students", {
      headers,
      searchParams: { limit: "1" },
    });
    const response = await GET(request, { params: createParams(["students"]) });

    const data = await response.json();
    const student = data.users[0];
    expect(student.metadata).toBeDefined();
    expect(student.metadata.accessTier).toBe("PRIVACY_SAFE");
    expect(student.metadata.tokenized).toBe(true);
  });
});

// =============================================================================
// TEACHERS ENDPOINT TESTS
// =============================================================================

describe("OneRoster Sandbox API - /teachers", () => {
  const headers = { Authorization: "Bearer sbox_test_1234567890123456789012" };

  it("should list teachers with pagination", async () => {
    const request = createMockRequest("/teachers", { headers });
    const response = await GET(request, { params: createParams(["teachers"]) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.users).toBeDefined();
    expect(Array.isArray(data.users)).toBe(true);
    expect(data.pagination).toBeDefined();
  });

  it("should get specific teacher by ID", async () => {
    const listRequest = createMockRequest("/teachers", {
      headers,
      searchParams: { limit: "1" },
    });
    const listResponse = await GET(listRequest, { params: createParams(["teachers"]) });
    const listData = await listResponse.json();
    const teacherToken = listData.users[0].sourcedId;

    const request = createMockRequest(`/teachers/${teacherToken}`, { headers });
    const response = await GET(request, { params: createParams(["teachers", teacherToken]) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user.role).toBe("teacher");
  });

  it("should return 404 for non-existent teacher", async () => {
    const request = createMockRequest("/teachers/TKN_TCH_NOTEXIST", { headers });
    const response = await GET(request, { params: createParams(["teachers", "TKN_TCH_NOTEXIST"]) });

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// CLASSES ENDPOINT TESTS
// =============================================================================

describe("OneRoster Sandbox API - /classes", () => {
  const headers = { Authorization: "Bearer sbox_test_1234567890123456789012" };

  it("should list classes with pagination", async () => {
    const request = createMockRequest("/classes", { headers });
    const response = await GET(request, { params: createParams(["classes"]) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.classes).toBeDefined();
    expect(Array.isArray(data.classes)).toBe(true);
  });

  it("should filter classes by subject", async () => {
    const request = createMockRequest("/classes", {
      headers,
      searchParams: { filter: "subject='Math'" },
    });
    const response = await GET(request, { params: createParams(["classes"]) });

    const data = await response.json();
    for (const cls of data.classes) {
      expect(cls.subjects[0].toLowerCase()).toContain("math");
    }
  });

  it("should get specific class by ID", async () => {
    const listRequest = createMockRequest("/classes", {
      headers,
      searchParams: { limit: "1" },
    });
    const listResponse = await GET(listRequest, { params: createParams(["classes"]) });
    const listData = await listResponse.json();
    const classToken = listData.classes[0].sourcedId;

    const request = createMockRequest(`/classes/${classToken}`, { headers });
    const response = await GET(request, { params: createParams(["classes", classToken]) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.class.sourcedId).toBe(classToken);
  });

  it("should return 404 for non-existent class", async () => {
    const request = createMockRequest("/classes/TKN_CLS_NOTEXIST", { headers });
    const response = await GET(request, { params: createParams(["classes", "TKN_CLS_NOTEXIST"]) });

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// SCHOOLS ENDPOINT TESTS
// =============================================================================

describe("OneRoster Sandbox API - /schools", () => {
  const headers = { Authorization: "Bearer sbox_test_1234567890123456789012" };

  it("should list schools", async () => {
    const request = createMockRequest("/schools", { headers });
    const response = await GET(request, { params: createParams(["schools"]) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.orgs).toBeDefined();
    expect(data.orgs.length).toBeGreaterThan(0);
  });

  it("should get specific school by ID", async () => {
    const listRequest = createMockRequest("/schools", { headers });
    const listResponse = await GET(listRequest, { params: createParams(["schools"]) });
    const listData = await listResponse.json();
    const schoolToken = listData.orgs[0].sourcedId;

    const request = createMockRequest(`/schools/${schoolToken}`, { headers });
    const response = await GET(request, { params: createParams(["schools", schoolToken]) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.org.type).toBe("school");
  });

  it("should return 404 for non-existent school", async () => {
    const request = createMockRequest("/schools/TKN_SCH_NOTEXIST", { headers });
    const response = await GET(request, { params: createParams(["schools", "TKN_SCH_NOTEXIST"]) });

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// ENROLLMENTS ENDPOINT TESTS
// =============================================================================

describe("OneRoster Sandbox API - /enrollments", () => {
  const headers = { Authorization: "Bearer sbox_test_1234567890123456789012" };

  it("should list enrollments", async () => {
    const request = createMockRequest("/enrollments", { headers });
    const response = await GET(request, { params: createParams(["enrollments"]) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.enrollments).toBeDefined();
    expect(Array.isArray(data.enrollments)).toBe(true);
  });

  it("should get specific enrollment by ID", async () => {
    const listRequest = createMockRequest("/enrollments", {
      headers,
      searchParams: { limit: "1" },
    });
    const listResponse = await GET(listRequest, { params: createParams(["enrollments"]) });
    const listData = await listResponse.json();
    const enrollmentToken = listData.enrollments[0].sourcedId;

    const request = createMockRequest(`/enrollments/${enrollmentToken}`, { headers });
    const response = await GET(request, { params: createParams(["enrollments", enrollmentToken]) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.enrollment.sourcedId).toBe(enrollmentToken);
  });

  it("should return 404 for non-existent enrollment", async () => {
    const request = createMockRequest("/enrollments/TKN_ENR_NOTEXIST", { headers });
    const response = await GET(request, { params: createParams(["enrollments", "TKN_ENR_NOTEXIST"]) });

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// ACADEMIC SESSIONS ENDPOINT TESTS
// =============================================================================

describe("OneRoster Sandbox API - /academicSessions", () => {
  const headers = { Authorization: "Bearer sbox_test_1234567890123456789012" };

  it("should list academic sessions", async () => {
    const request = createMockRequest("/academicSessions", { headers });
    const response = await GET(request, { params: createParams(["academicSessions"]) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.academicSessions).toBeDefined();
    expect(data.academicSessions.length).toBeGreaterThan(0);
  });

  it("should get specific academic session by ID", async () => {
    const request = createMockRequest("/academicSessions/as_2024_fall", { headers });
    const response = await GET(request, { params: createParams(["academicSessions", "as_2024_fall"]) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.academicSession.sourcedId).toBe("as_2024_fall");
  });

  it("should return 404 for non-existent academic session", async () => {
    const request = createMockRequest("/academicSessions/as_notexist", { headers });
    const response = await GET(request, { params: createParams(["academicSessions", "as_notexist"]) });

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// ORGS ENDPOINT TESTS
// =============================================================================

describe("OneRoster Sandbox API - /orgs", () => {
  const headers = { Authorization: "Bearer sbox_test_1234567890123456789012" };

  it("should list orgs including district", async () => {
    const request = createMockRequest("/orgs", { headers });
    const response = await GET(request, { params: createParams(["orgs"]) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.orgs).toBeDefined();

    // Should include the district
    const district = data.orgs.find((o: { type: string }) => o.type === "district");
    expect(district).toBeDefined();
    expect(district.name).toContain("Los Angeles");
  });

  it("should get specific org by ID", async () => {
    const request = createMockRequest("/orgs/org_lausd_district", { headers });
    const response = await GET(request, { params: createParams(["orgs", "org_lausd_district"]) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.org.type).toBe("district");
  });

  it("should return 404 for non-existent org", async () => {
    const request = createMockRequest("/orgs/org_notexist", { headers });
    const response = await GET(request, { params: createParams(["orgs", "org_notexist"]) });

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// COURSES ENDPOINT TESTS
// =============================================================================

describe("OneRoster Sandbox API - /courses", () => {
  const headers = { Authorization: "Bearer sbox_test_1234567890123456789012" };

  it("should list courses", async () => {
    const request = createMockRequest("/courses", { headers });
    const response = await GET(request, { params: createParams(["courses"]) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.courses).toBeDefined();
    expect(Array.isArray(data.courses)).toBe(true);
  });

  it("should include course metadata", async () => {
    const request = createMockRequest("/courses", {
      headers,
      searchParams: { limit: "1" },
    });
    const response = await GET(request, { params: createParams(["courses"]) });

    const data = await response.json();
    const course = data.courses[0];
    expect(course.sourcedId).toBeDefined();
    expect(course.title).toBeDefined();
    expect(course.courseCode).toBeDefined();
    expect(course.subjects).toBeDefined();
  });
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

describe("OneRoster Sandbox API - Error Handling", () => {
  const headers = { Authorization: "Bearer sbox_test_1234567890123456789012" };

  it("should return 404 for unknown endpoint", async () => {
    const request = createMockRequest("/unknown", { headers });
    const response = await GET(request, { params: createParams(["unknown"]) });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error.code).toBe("not_found");
    expect(data.error.message).toContain("Available endpoints");
  });

  it("should cap limit at 100", async () => {
    const request = createMockRequest("/students", {
      headers,
      searchParams: { limit: "500" },
    });
    const response = await GET(request, { params: createParams(["students"]) });

    const data = await response.json();
    expect(data.users.length).toBeLessThanOrEqual(100);
  });
});

// =============================================================================
// CORS / OPTIONS TESTS
// =============================================================================

describe("OneRoster Sandbox API - CORS", () => {
  it("should handle OPTIONS preflight request", async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("GET");
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain("Authorization");
  });

  it("should include CORS headers in responses", async () => {
    const request = createMockRequest("/students", {
      headers: { Authorization: "Bearer sbox_test_1234567890123456789012" },
    });
    const response = await GET(request, { params: createParams(["students"]) });

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

// =============================================================================
// RESPONSE HEADERS TESTS
// =============================================================================

describe("OneRoster Sandbox API - Response Headers", () => {
  const headers = { Authorization: "Bearer sbox_test_1234567890123456789012" };

  it("should include rate limit headers", async () => {
    const request = createMockRequest("/students", { headers });
    const response = await GET(request, { params: createParams(["students"]) });

    expect(response.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("59");
  });

  it("should include request ID header", async () => {
    const request = createMockRequest("/students", { headers });
    const response = await GET(request, { params: createParams(["students"]) });

    expect(response.headers.get("X-Request-Id")).toMatch(/^req_/);
  });

  it("should include OneRoster version header", async () => {
    const request = createMockRequest("/students", { headers });
    const response = await GET(request, { params: createParams(["students"]) });

    expect(response.headers.get("X-OneRoster-Version")).toBe("1.1");
  });

  it("should include sandbox mode header", async () => {
    const request = createMockRequest("/students", { headers });
    const response = await GET(request, { params: createParams(["students"]) });

    expect(response.headers.get("X-Sandbox-Mode")).toBe("true");
  });
});
