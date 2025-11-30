/**
 * Chat API Route Tests
 *
 * Tests for the chat API route including validation and health checks.
 * Note: Full streaming tests with Claude require complex mocking.
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the Anthropic SDK before importing the route
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn(),
      },
    })),
    APIError: class APIError extends Error {
      status: number;
      headers: Record<string, string>;
      constructor(message: string, status: number = 500) {
        super(message);
        this.name = "APIError";
        this.status = status;
        this.headers = {};
      }
    },
  };
});

// Import after mocking
import { GET, POST } from "@/app/api/chat/route";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function createMockRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

// =============================================================================
// GET ENDPOINT TESTS
// =============================================================================

describe("GET /api/chat", () => {
  const originalEnv = process.env.ANTHROPIC_API_KEY;

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalEnv;
  });

  it("should return ok status when API key is configured", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.service).toBe("schoolday-vendor-chat");
    expect(data.apiKeyConfigured).toBe(true);
    expect(data.timestamp).toBeDefined();
  });

  it("should return degraded status when API key is not configured", async () => {
    process.env.ANTHROPIC_API_KEY = "";

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("degraded");
    expect(data.apiKeyConfigured).toBe(false);
  });
});

// =============================================================================
// POST VALIDATION TESTS
// =============================================================================

describe("POST /api/chat - Validation", () => {
  it("should reject invalid JSON", async () => {
    const request = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "not valid json",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid JSON");
  });

  it("should reject missing messages field", async () => {
    const request = createMockRequest({});

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Messages field is required");
  });

  it("should reject non-array messages", async () => {
    const request = createMockRequest({ messages: "not an array" });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Messages must be an array");
  });

  it("should reject empty messages array", async () => {
    const request = createMockRequest({ messages: [] });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("must not be empty");
  });

  it("should reject invalid message role", async () => {
    const request = createMockRequest({
      messages: [{ role: "invalid", content: "test" }],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid role");
  });

  it("should reject missing message role", async () => {
    const request = createMockRequest({
      messages: [{ content: "test" }],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid role");
  });

  it("should reject non-string content", async () => {
    const request = createMockRequest({
      messages: [{ role: "user", content: 123 }],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Content must be a string");
  });

  it("should reject message with null content", async () => {
    const request = createMockRequest({
      messages: [{ role: "user", content: null }],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Content must be a string");
  });
});

// =============================================================================
// MESSAGE VALIDATION EDGE CASES
// =============================================================================

describe("POST /api/chat - Message Validation Edge Cases", () => {
  it("should reject array with null message", async () => {
    const request = createMockRequest({
      messages: [null],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
  });

  it("should reject array with undefined message", async () => {
    const request = createMockRequest({
      messages: [undefined],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
  });

  it("should validate multiple messages in array", async () => {
    const request = createMockRequest({
      messages: [
        { role: "user", content: "First" },
        { role: "invalid", content: "Second" }, // This should fail
      ],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid role");
  });
});
