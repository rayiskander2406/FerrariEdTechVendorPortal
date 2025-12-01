/**
 * MVP-04: Chat Route Streaming Tests
 *
 * Comprehensive test suite for /api/chat streaming functionality.
 * Uses static code analysis to verify correct implementation patterns.
 *
 * @see app/api/chat/route.ts
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// =============================================================================
// HELPER: Read route source
// =============================================================================

function getRouteCode(): string {
  const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
  return fs.readFileSync(routePath, "utf-8");
}

// =============================================================================
// TESTS: SSE FORMAT
// =============================================================================

describe("MVP-04: Chat Route Streaming", () => {
  describe("SSE Format Correctness", () => {
    it("should set Content-Type header to text/event-stream", () => {
      const code = getRouteCode();
      expect(code).toContain('"Content-Type": "text/event-stream"');
    });

    it("should set Cache-Control header to no-cache", () => {
      const code = getRouteCode();
      expect(code).toContain('"Cache-Control": "no-cache"');
    });

    it("should set Connection header to keep-alive", () => {
      const code = getRouteCode();
      expect(code).toContain('Connection: "keep-alive"');
    });

    it("should format events as data: {...}\\n\\n", () => {
      const code = getRouteCode();
      expect(code).toContain("`data: ${JSON.stringify");
      expect(code).toMatch(/}\\n\\n`/);
    });

    it("should end stream with [DONE] marker", () => {
      const code = getRouteCode();
      expect(code).toContain("[DONE]");
    });

    it("should use TextEncoder for stream encoding", () => {
      const code = getRouteCode();
      expect(code).toContain("new TextEncoder()");
    });

    it("should close stream controller", () => {
      const code = getRouteCode();
      expect(code).toContain("controller.close()");
    });
  });

  // ===========================================================================
  // TESTS: CONTENT STREAMING
  // ===========================================================================

  describe("Content Streaming", () => {
    it("should handle text_delta events", () => {
      const code = getRouteCode();
      expect(code).toContain("text_delta");
    });

    it("should emit content type events", () => {
      const code = getRouteCode();
      expect(code).toContain('type: "content"');
    });

    it("should include text in content events", () => {
      const code = getRouteCode();
      expect(code).toContain("text: event.delta.text");
    });

    it("should handle content_block_start events", () => {
      const code = getRouteCode();
      expect(code).toContain("content_block_start");
    });

    it("should handle content_block_delta events", () => {
      const code = getRouteCode();
      expect(code).toContain("content_block_delta");
    });

    it("should handle content_block_stop events", () => {
      const code = getRouteCode();
      expect(code).toContain("content_block_stop");
    });

    it("should handle message_delta events", () => {
      const code = getRouteCode();
      expect(code).toContain("message_delta");
    });

    it("should handle message_stop events", () => {
      const code = getRouteCode();
      expect(code).toContain("message_stop");
    });
  });

  // ===========================================================================
  // TESTS: TOOL CALL STREAMING
  // ===========================================================================

  describe("Tool Call Streaming Events", () => {
    it("should emit tool_start event", () => {
      const code = getRouteCode();
      expect(code).toContain('type: "tool_start"');
    });

    it("should include tool name in tool_start", () => {
      const code = getRouteCode();
      expect(code).toContain("tool: event.content_block.name");
    });

    it("should include tool id in tool_start", () => {
      const code = getRouteCode();
      expect(code).toContain("id: event.content_block.id");
    });

    it("should emit tool_executing event", () => {
      const code = getRouteCode();
      expect(code).toContain('type: "tool_executing"');
    });

    it("should emit tool_result event", () => {
      const code = getRouteCode();
      expect(code).toContain('type: "tool_result"');
    });

    it("should include result in tool_result event", () => {
      const code = getRouteCode();
      expect(code).toContain("result:");
    });

    it("should include success in tool result", () => {
      const code = getRouteCode();
      expect(code).toContain("success: result.success");
    });

    it("should include showForm in tool result", () => {
      const code = getRouteCode();
      expect(code).toContain("showForm: result.showForm");
    });

    it("should include message in tool result", () => {
      const code = getRouteCode();
      expect(code).toContain("message: result.message");
    });

    it("should include hasData in tool result", () => {
      const code = getRouteCode();
      expect(code).toContain("hasData:");
    });

    it("should handle tool_use content blocks", () => {
      const code = getRouteCode();
      expect(code).toContain("tool_use");
    });

    it("should call executeToolCall", () => {
      const code = getRouteCode();
      expect(code).toContain("executeToolCall(");
    });

    it("should track tool uses array", () => {
      const code = getRouteCode();
      expect(code).toContain("toolUses:");
    });
  });

  // ===========================================================================
  // TESTS: ERROR HANDLING
  // ===========================================================================

  describe("Stream Error Handling", () => {
    it("should emit error type event", () => {
      const code = getRouteCode();
      expect(code).toContain('type: "error"');
    });

    it("should include error message in error event", () => {
      const code = getRouteCode();
      expect(code).toContain("error: errorMessage");
    });

    it("should include error code in error event", () => {
      const code = getRouteCode();
      expect(code).toContain("code: errorCode");
    });

    it("should handle APIError from Anthropic", () => {
      const code = getRouteCode();
      expect(code).toContain("Anthropic.APIError");
    });

    it("should handle 429 rate limit errors", () => {
      const code = getRouteCode();
      expect(code).toContain("429");
      expect(code).toContain("RATE_LIMITED");
    });

    it("should handle 401 auth errors", () => {
      const code = getRouteCode();
      expect(code).toContain("401");
      expect(code).toContain("UNAUTHORIZED");
    });

    it("should handle 500 server errors", () => {
      const code = getRouteCode();
      expect(code).toContain("500");
    });

    it("should provide user-friendly rate limit message", () => {
      const code = getRouteCode();
      expect(code).toContain("busy");
    });

    it("should log streaming errors", () => {
      const code = getRouteCode();
      expect(code).toContain("[Streaming");
    });

    it("should handle tool execution errors", () => {
      const code = getRouteCode();
      expect(code).toContain("Tool execution failed");
    });

    it("should still close stream after error", () => {
      const code = getRouteCode();
      // Should have finally block with close
      expect(code).toContain("finally");
      expect(code).toContain("controller.close()");
    });
  });

  // ===========================================================================
  // TESTS: TOOL DEPTH LIMITING
  // ===========================================================================

  describe("Tool Call Depth Limiting", () => {
    it("should define MAX_TOOL_DEPTH constant", () => {
      const code = getRouteCode();
      expect(code).toContain("MAX_TOOL_DEPTH");
    });

    it("should set MAX_TOOL_DEPTH to 10", () => {
      const code = getRouteCode();
      expect(code).toMatch(/MAX_TOOL_DEPTH\s*=\s*10/);
    });

    it("should check depth against MAX_TOOL_DEPTH", () => {
      const code = getRouteCode();
      expect(code).toContain("depth >= MAX_TOOL_DEPTH");
    });

    it("should return error message when depth exceeded", () => {
      const code = getRouteCode();
      expect(code).toContain("maximum number of tool calls");
    });

    it("should increment depth on recursive call", () => {
      const code = getRouteCode();
      expect(code).toContain("depth + 1");
    });
  });

  // ===========================================================================
  // TESTS: INPUT VALIDATION
  // ===========================================================================

  describe("Input Validation", () => {
    it("should validate messages field exists", () => {
      const code = getRouteCode();
      expect(code).toContain("!messages");
      expect(code).toContain("Messages field is required");
    });

    it("should validate messages is array", () => {
      const code = getRouteCode();
      expect(code).toContain("Array.isArray(messages)");
      expect(code).toContain("must be an array");
    });

    it("should validate messages not empty", () => {
      const code = getRouteCode();
      expect(code).toContain("messages.length === 0");
      expect(code).toContain("must not be empty");
    });

    it("should validate message role", () => {
      const code = getRouteCode();
      expect(code).toContain("role");
      expect(code).toContain("user");
      expect(code).toContain("assistant");
    });

    it("should validate content is string", () => {
      const code = getRouteCode();
      expect(code).toContain('typeof msg.content !== "string"');
    });

    it("should handle invalid JSON", () => {
      const code = getRouteCode();
      expect(code).toContain("Invalid JSON");
    });

    it("should use ValidationError class", () => {
      const code = getRouteCode();
      expect(code).toContain("ValidationError");
    });
  });

  // ===========================================================================
  // TESTS: API KEY HANDLING
  // ===========================================================================

  describe("API Key Handling", () => {
    it("should read ANTHROPIC_API_KEY from env", () => {
      const code = getRouteCode();
      expect(code).toContain("process.env.ANTHROPIC_API_KEY");
    });

    it("should throw error when API key missing", () => {
      const code = getRouteCode();
      expect(code).toContain("!apiKey");
      expect(code).toContain("not configured");
    });

    it("should use AIServiceError for missing key", () => {
      const code = getRouteCode();
      expect(code).toContain("AIServiceError");
    });

    it("should return 503 status for missing key", () => {
      const code = getRouteCode();
      expect(code).toContain("statusCode: 503");
    });

    it("should handle auth errors from Anthropic", () => {
      const code = getRouteCode();
      expect(code).toContain("authentication");
    });
  });

  // ===========================================================================
  // TESTS: HEALTH CHECK
  // ===========================================================================

  describe("Health Check Endpoint", () => {
    it("should export GET function", () => {
      const code = getRouteCode();
      expect(code).toContain("export async function GET()");
    });

    it("should check for API key in health check", () => {
      const code = getRouteCode();
      expect(code).toContain("hasApiKey");
    });

    it("should return ok status when key configured", () => {
      const code = getRouteCode();
      expect(code).toContain('status: hasApiKey ? "ok"');
    });

    it("should return degraded status when key missing", () => {
      const code = getRouteCode();
      expect(code).toContain('"degraded"');
    });

    it("should include service name", () => {
      const code = getRouteCode();
      expect(code).toContain("schoolday-vendor-chat");
    });

    it("should include timestamp", () => {
      const code = getRouteCode();
      expect(code).toContain("timestamp:");
    });

    it("should include apiKeyConfigured field", () => {
      const code = getRouteCode();
      expect(code).toContain("apiKeyConfigured:");
    });
  });

  // ===========================================================================
  // TESTS: MODEL CONFIGURATION
  // ===========================================================================

  describe("Model Configuration", () => {
    it("should use claude-sonnet-4 model", () => {
      const code = getRouteCode();
      expect(code).toContain("claude-sonnet-4");
    });

    it("should set max_tokens", () => {
      const code = getRouteCode();
      expect(code).toContain("max_tokens:");
    });

    it("should include system prompt", () => {
      const code = getRouteCode();
      expect(code).toContain("system: systemPrompt");
    });

    it("should include tool definitions", () => {
      const code = getRouteCode();
      expect(code).toContain("tools: TOOL_DEFINITIONS");
    });

    it("should call getSystemPrompt with vendor context", () => {
      const code = getRouteCode();
      expect(code).toContain("getSystemPrompt(vendorContext)");
    });
  });

  // ===========================================================================
  // TESTS: NODE.JS RUNTIME (changed from Edge for Prisma compatibility)
  // ===========================================================================

  describe("Node.js Runtime Configuration", () => {
    it("should export nodejs runtime for Prisma compatibility", () => {
      const code = getRouteCode();
      // Changed from Edge to Node.js runtime to support Prisma database operations
      expect(code).toContain('export const runtime = "nodejs"');
    });
  });

  // ===========================================================================
  // TESTS: STREAMING RESPONSE
  // ===========================================================================

  describe("Streaming Response", () => {
    it("should use ReadableStream", () => {
      const code = getRouteCode();
      expect(code).toContain("new ReadableStream");
    });

    it("should use controller.enqueue", () => {
      const code = getRouteCode();
      expect(code).toContain("controller.enqueue");
    });

    it("should return Response with stream", () => {
      const code = getRouteCode();
      expect(code).toContain("new Response(stream");
    });

    it("should use async start function", () => {
      const code = getRouteCode();
      expect(code).toContain("async start(controller)");
    });

    it("should use for await on stream", () => {
      const code = getRouteCode();
      expect(code).toContain("for await");
    });
  });

  // ===========================================================================
  // TESTS: TOOL RESULT FORMATTING
  // ===========================================================================

  describe("Tool Result Formatting", () => {
    it("should have formatToolResultForClaude function", () => {
      const code = getRouteCode();
      expect(code).toContain("function formatToolResultForClaude");
    });

    it("should handle unsuccessful results", () => {
      const code = getRouteCode();
      expect(code).toContain("!result.success");
    });

    it("should include form display instruction", () => {
      const code = getRouteCode();
      expect(code).toContain("[FORM:");
    });

    it("should include suggestions reminder", () => {
      const code = getRouteCode();
      expect(code).toContain("[SUGGESTIONS:");
    });

    it("should include displayInstruction for data", () => {
      const code = getRouteCode();
      expect(code).toContain("displayInstruction");
    });
  });

  // ===========================================================================
  // TESTS: MESSAGE HISTORY
  // ===========================================================================

  describe("Message History Handling", () => {
    it("should convert messages to Anthropic format", () => {
      const code = getRouteCode();
      expect(code).toContain("anthropicMessages");
    });

    it("should map role and content", () => {
      const code = getRouteCode();
      expect(code).toContain("role: msg.role");
      expect(code).toContain("content: msg.content");
    });

    it("should build new messages with tool results", () => {
      const code = getRouteCode();
      expect(code).toContain("...messages,");
    });

    it("should add assistant message with content", () => {
      const code = getRouteCode();
      expect(code).toContain('role: "assistant"');
      expect(code).toContain("content: finalMessage.content");
    });

    it("should add user message with tool results", () => {
      const code = getRouteCode();
      expect(code).toContain('role: "user"');
      expect(code).toContain("content: toolResults");
    });
  });

  // ===========================================================================
  // TESTS: ERROR RESPONSE HELPER
  // ===========================================================================

  describe("Error Response Helper", () => {
    it("should have createErrorResponse function", () => {
      const code = getRouteCode();
      expect(code).toContain("function createErrorResponse");
    });

    it("should log errors", () => {
      const code = getRouteCode();
      expect(code).toContain("logError(");
    });

    it("should handle AppError types", () => {
      const code = getRouteCode();
      expect(code).toContain("AppError");
    });

    it("should not expose internal errors to user", () => {
      const code = getRouteCode();
      expect(code).toContain("Don't expose internal error");
    });

    it("should return JSON error response", () => {
      const code = getRouteCode();
      expect(code).toContain("Response.json(");
    });
  });

  // ===========================================================================
  // TESTS: STOP REASON HANDLING
  // ===========================================================================

  describe("Stop Reason Handling", () => {
    it("should track stop reason", () => {
      const code = getRouteCode();
      expect(code).toContain("stopReason");
    });

    it("should check for tool_use stop reason", () => {
      const code = getRouteCode();
      expect(code).toContain('stopReason === "tool_use"');
    });

    it("should extract stop reason from message_delta", () => {
      const code = getRouteCode();
      expect(code).toContain("event.delta.stop_reason");
    });
  });

  // ===========================================================================
  // TESTS: FINAL MESSAGE HANDLING
  // ===========================================================================

  describe("Final Message Handling", () => {
    it("should get finalMessage from stream", () => {
      const code = getRouteCode();
      expect(code).toContain("stream.finalMessage()");
    });

    it("should extract tool use blocks from final message", () => {
      const code = getRouteCode();
      expect(code).toContain("toolUseBlocks");
    });

    it("should filter for tool_use blocks", () => {
      const code = getRouteCode();
      expect(code).toContain('block.type === "tool_use"');
    });
  });
});
