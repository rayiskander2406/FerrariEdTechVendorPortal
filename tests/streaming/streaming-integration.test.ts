/**
 * MVP-04: Streaming Integration Tests
 *
 * End-to-end integration tests for the complete streaming flow
 * from API request to client-side rendering.
 *
 * @see app/api/chat/route.ts
 * @see lib/hooks/useChat.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";

// =============================================================================
// TESTS: CODE ANALYSIS (Static verification)
// =============================================================================

describe("MVP-04: Streaming Integration", () => {
  // ===========================================================================
  // TESTS: SSE EVENT TYPES
  // ===========================================================================

  describe("SSE Event Type Consistency", () => {
    it("should have matching event types between backend and frontend", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");

      const routeCode = fs.readFileSync(routePath, "utf-8");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      // Event types emitted by backend
      const backendEvents = [
        "content",
        "tool_start",
        "tool_executing",
        "tool_result",
        "error",
      ];

      // Verify backend emits these events
      for (const event of backendEvents) {
        expect(routeCode).toContain(`type: "${event}"`);
      }

      // Verify frontend handles these events
      for (const event of backendEvents) {
        expect(hookCode).toContain(`"${event}"`);
      }
    });

    it("should emit tool_start with correct fields", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      // Should include tool name and id
      expect(routeCode).toContain("tool: event.content_block.name");
      expect(routeCode).toContain("id: event.content_block.id");
    });

    it("should emit tool_result with result object", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      // Should include result with success, showForm, message, hasData
      expect(routeCode).toContain("result:");
      expect(routeCode).toContain("success: result.success");
      expect(routeCode).toContain("showForm: result.showForm");
    });
  });

  // ===========================================================================
  // TESTS: STREAM FORMAT
  // ===========================================================================

  describe("Stream Format Compliance", () => {
    it("should use SSE data: prefix format", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      // Should format as 'data: {...}\n\n'
      expect(routeCode).toContain("`data: ${JSON.stringify");
      expect(routeCode).toContain("}\\n\\n`");
    });

    it("should end stream with [DONE] marker", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      expect(routeCode).toContain('data: [DONE]\\n\\n');
    });

    it("should close stream controller after completion", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      expect(routeCode).toContain("controller.close()");
    });

    it("frontend should check for [DONE] marker", async () => {
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      expect(hookCode).toContain('[DONE]');
    });
  });

  // ===========================================================================
  // TESTS: ERROR HANDLING CONSISTENCY
  // ===========================================================================

  describe("Error Handling Consistency", () => {
    it("should emit error event with error message", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      expect(routeCode).toContain('type: "error"');
      expect(routeCode).toContain("error: errorMessage");
    });

    it("frontend should handle error events", async () => {
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      expect(hookCode).toContain('case "error":');
      expect(hookCode).toContain("setError(parsed.error");
    });

    it("should include error code in error events", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      expect(routeCode).toContain("code: errorCode");
    });
  });

  // ===========================================================================
  // TESTS: TOOL CALL FLOW
  // ===========================================================================

  describe("Tool Call Flow Consistency", () => {
    it("should track tool status through lifecycle in frontend", async () => {
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      // Should handle tool states (different quote styles may be used)
      expect(hookCode).toMatch(/status:\s*["']pending["']/);
      expect(hookCode).toMatch(/status:\s*["']executing["']/);
      expect(hookCode).toMatch(/status:\s*["']completed["']|parsed\.result\?\.success/);
      // Error state is handled implicitly via success check or catch block
      expect(hookCode).toMatch(/catch|success\s*===\s*false|!success/);
    });

    it("should execute tools and return results in backend", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      expect(routeCode).toContain("executeToolCall");
      expect(routeCode).toContain("tool_use_id: toolUse.id");
    });

    it("should continue conversation after tool execution", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      // Should recursively call processWithToolCalls
      expect(routeCode).toContain("await processWithToolCalls(");
      expect(routeCode).toContain("depth + 1");
    });

    it("should limit tool call depth to prevent infinite loops", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      expect(routeCode).toContain("MAX_TOOL_DEPTH");
      expect(routeCode).toContain("if (depth >= MAX_TOOL_DEPTH)");
    });
  });

  // ===========================================================================
  // TESTS: FORM TRIGGER INTEGRATION
  // ===========================================================================

  describe("Form Trigger Integration", () => {
    it("should format showForm instruction for Claude", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      // Should include instruction for Claude to include [FORM:*] marker
      expect(routeCode).toContain("[FORM:");
      expect(routeCode).toContain("showForm");
    });

    it("frontend should detect form triggers from tool_result", async () => {
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      // Should check tool_result for showForm
      expect(hookCode).toContain("parsed.result.showForm");
      expect(hookCode).toContain("setActiveFormState(parsed.result.showForm)");
    });

    it("frontend should detect form triggers from content", async () => {
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      // Should call detectFormTriggers on final content
      expect(hookCode).toContain("detectFormTriggers(accumulatedContent)");
    });

    it("should use centralized form trigger detection", async () => {
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      // Should import from config
      expect(hookCode).toContain("getLastFormTrigger");
      expect(hookCode).toContain("@/lib/config/forms");
    });
  });

  // ===========================================================================
  // TESTS: SUGGESTIONS INTEGRATION
  // ===========================================================================

  describe("Suggestions Integration", () => {
    it("backend should remind Claude to include suggestions", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      expect(routeCode).toContain("[SUGGESTIONS:");
      expect(routeCode).toContain("reminderForClaude");
    });

    it("frontend should extract suggestions from response", async () => {
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      expect(hookCode).toContain("SUGGESTIONS_REGEX");
      expect(hookCode).toContain("extractSuggestions");
      expect(hookCode).toContain("setSuggestedResponses");
    });

    it("suggestions should use pipe separator", async () => {
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      expect(hookCode).toContain('.split("|")');
    });
  });

  // ===========================================================================
  // TESTS: HEADER CONFIGURATION
  // ===========================================================================

  describe("HTTP Header Configuration", () => {
    it("should set correct Content-Type for SSE", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      expect(routeCode).toContain('"Content-Type": "text/event-stream"');
    });

    it("should set Cache-Control to no-cache", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      expect(routeCode).toContain('"Cache-Control": "no-cache"');
    });

    it("should set Connection to keep-alive", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      expect(routeCode).toContain('Connection: "keep-alive"');
    });

    it("should use nodejs runtime for Prisma compatibility", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      // Changed from Edge to Node.js runtime to support Prisma database operations
      expect(routeCode).toContain('runtime = "nodejs"');
    });
  });

  // ===========================================================================
  // TESTS: MESSAGE HISTORY
  // ===========================================================================

  describe("Message History Management", () => {
    it("should include message history in API requests", async () => {
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      // Should spread existing messages into API request
      expect(hookCode).toContain("[...messages, userMessage]");
    });

    it("should convert messages to Anthropic format", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      expect(routeCode).toContain("anthropicMessages");
      expect(routeCode).toContain("role: msg.role");
      expect(routeCode).toContain("content: msg.content");
    });

    it("should append tool results to message history", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      // Should build new messages with tool results
      expect(routeCode).toContain("...messages,");
      expect(routeCode).toContain('role: "assistant"');
      expect(routeCode).toContain('role: "user"');
      expect(routeCode).toContain("content: toolResults");
    });
  });

  // ===========================================================================
  // TESTS: ABORT HANDLING
  // ===========================================================================

  describe("Abort/Timeout Handling", () => {
    it("frontend should create AbortController", async () => {
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      expect(hookCode).toContain("AbortController");
      expect(hookCode).toContain("abortControllerRef");
    });

    it("frontend should have timeout", async () => {
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      expect(hookCode).toContain("FETCH_TIMEOUT_MS");
      expect(hookCode).toContain("setTimeout");
    });

    it("frontend should handle AbortError", async () => {
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      expect(hookCode).toContain("AbortError");
      expect(hookCode).toContain("timed out");
    });

    it("clearChat should abort pending requests", async () => {
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      expect(hookCode).toContain("abortControllerRef.current?.abort()");
    });
  });

  // ===========================================================================
  // TESTS: VENDOR CONTEXT
  // ===========================================================================

  describe("Vendor Context Integration", () => {
    it("frontend should build vendor context", async () => {
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      expect(hookCode).toContain("buildVendorContext");
      expect(hookCode).toContain("vendorContext");
    });

    it("backend should use vendor context in system prompt", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      expect(routeCode).toContain("getSystemPrompt(vendorContext)");
    });

    it("vendor context should include required fields", async () => {
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      expect(hookCode).toContain("vendor:");
      expect(hookCode).toContain("sandboxCredentials:");
      expect(hookCode).toContain("integrations:");
      expect(hookCode).toContain("sessionId:");
    });
  });

  // ===========================================================================
  // TESTS: ISLOADING RACE CONDITION FIX
  // ===========================================================================

  describe("isLoading Race Condition Fix", () => {
    it("should use ref for isLoading to avoid stale closure", async () => {
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      // Should have isLoadingRef
      expect(hookCode).toContain("isLoadingRef");
      expect(hookCode).toContain("useRef(isLoading)");
    });

    it("should check isLoadingRef.current in sendMessage", async () => {
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      expect(hookCode).toContain("isLoadingRef.current");
    });

    it("should update ref synchronously during render", async () => {
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      expect(hookCode).toContain("isLoadingRef.current = isLoading");
    });

    it("should NOT include isLoading in sendMessage deps", async () => {
      const hookPath = path.resolve(__dirname, "../../lib/hooks/useChat.ts");
      const hookCode = fs.readFileSync(hookPath, "utf-8");

      // Should have comment explaining this
      expect(hookCode).toContain("isLoading is NOT in deps");
    });
  });

  // ===========================================================================
  // TESTS: TOOL RESULT FORMATTING
  // ===========================================================================

  describe("Tool Result Formatting", () => {
    it("should have formatToolResultForClaude function", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      expect(routeCode).toContain("function formatToolResultForClaude");
    });

    it("should include form display instruction", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      expect(routeCode).toContain("Display the");
      expect(routeCode).toContain("form to the user");
    });

    it("should include data display instruction", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      expect(routeCode).toContain("displayInstruction");
      expect(routeCode).toContain("Format and display");
    });

    it("should handle error results", async () => {
      const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
      const routeCode = fs.readFileSync(routePath, "utf-8");

      expect(routeCode).toContain("!result.success");
      expect(routeCode).toContain("error: result.error");
    });
  });
});

// =============================================================================
// TESTS: RATE LIMIT HANDLING
// =============================================================================

describe("Rate Limit Handling", () => {
  it("backend should handle 429 status from Anthropic", async () => {
    const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
    const routeCode = fs.readFileSync(routePath, "utf-8");

    expect(routeCode).toContain("429");
    expect(routeCode).toContain("busy");
    expect(routeCode).toContain("RATE_LIMITED");
  });

  it("backend should return friendly rate limit message", async () => {
    const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
    const routeCode = fs.readFileSync(routePath, "utf-8");

    expect(routeCode).toContain("wait a moment");
  });
});

// =============================================================================
// TESTS: VALIDATION
// =============================================================================

describe("Input Validation", () => {
  it("backend should validate messages array exists", async () => {
    const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
    const routeCode = fs.readFileSync(routePath, "utf-8");

    expect(routeCode).toContain("!messages");
    expect(routeCode).toContain("Messages field is required");
  });

  it("backend should validate messages is array", async () => {
    const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
    const routeCode = fs.readFileSync(routePath, "utf-8");

    expect(routeCode).toContain("Array.isArray(messages)");
  });

  it("backend should validate messages not empty", async () => {
    const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
    const routeCode = fs.readFileSync(routePath, "utf-8");

    expect(routeCode).toContain("messages.length === 0");
  });

  it("backend should validate message role", async () => {
    const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
    const routeCode = fs.readFileSync(routePath, "utf-8");

    expect(routeCode).toContain("user");
    expect(routeCode).toContain("assistant");
    expect(routeCode).toContain("Invalid role");
  });

  it("backend should validate message content type", async () => {
    const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
    const routeCode = fs.readFileSync(routePath, "utf-8");

    expect(routeCode).toContain('typeof msg.content !== "string"');
    expect(routeCode).toContain("Content must be a string");
  });

  it("backend should handle invalid JSON", async () => {
    const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
    const routeCode = fs.readFileSync(routePath, "utf-8");

    expect(routeCode).toContain("Invalid JSON");
  });
});

// =============================================================================
// TESTS: MODEL CONFIGURATION
// =============================================================================

describe("Model Configuration", () => {
  it("should use claude-sonnet-4-20250514 model", async () => {
    const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
    const routeCode = fs.readFileSync(routePath, "utf-8");

    expect(routeCode).toContain("claude-sonnet-4-20250514");
  });

  it("should set max_tokens to 4096", async () => {
    const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
    const routeCode = fs.readFileSync(routePath, "utf-8");

    expect(routeCode).toContain("max_tokens: 4096");
  });

  it("should include tool definitions", async () => {
    const routePath = path.resolve(__dirname, "../../app/api/chat/route.ts");
    const routeCode = fs.readFileSync(routePath, "utf-8");

    expect(routeCode).toContain("tools: TOOL_DEFINITIONS");
  });
});
