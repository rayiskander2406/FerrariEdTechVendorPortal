/**
 * HARD-02 Pre-Refactor Test: Stale Closure Race Condition
 *
 * This test specifically reproduces the bug that isLoadingRef workaround fixes.
 * The bug: Without the ref, rapid sendMessage calls see stale isLoading=false
 * even when a request is already in-flight.
 *
 * This test MUST pass before and after the useReducer refactor.
 * If this test fails, the refactor broke the race condition protection.
 *
 * @see lib/hooks/useChat.ts lines 100-104, 193
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { VendorProvider } from "@/lib/contexts";

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("@/lib/config/forms", () => ({
  getLastFormTrigger: vi.fn(() => null),
}));

// =============================================================================
// HELPERS
// =============================================================================

function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(VendorProvider, null, children);
  };
}

const wrapper = createWrapper();

/**
 * Create a SLOW mock SSE stream that takes time to complete
 * This simulates a real API call that takes time
 */
function createSlowMockSSEStream(delayMs: number): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let sent = false;

  return new ReadableStream({
    async pull(controller) {
      if (!sent) {
        // Simulate slow response
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        controller.enqueue(encoder.encode('data: {"type":"content","text":"Response"}\n\n'));
        sent = true;
      } else {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });
}

function createSlowMockResponse(delayMs: number): Response {
  return new Response(createSlowMockSSEStream(delayMs), {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

// =============================================================================
// TESTS
// =============================================================================

describe("HARD-02: Stale Closure Race Condition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rapid sendMessage calls (demo mode scenario)", () => {
    /**
     * THE CRITICAL TEST
     *
     * This reproduces the exact bug that isLoadingRef fixes:
     * - Call sendMessage("First")
     * - Immediately call sendMessage("Second") before first completes
     * - Second call SHOULD be blocked (isLoading is true)
     *
     * Without isLoadingRef: Both calls would go through (BUG)
     * With isLoadingRef: Second call is blocked (CORRECT)
     */
    it("should block second sendMessage when first is still loading", async () => {
      // Setup: Create a slow response so we can call sendMessage twice while first is in-flight
      mockFetch.mockImplementation(() => createSlowMockResponse(500));

      const { useChat } = await import("@/lib/hooks/useChat");
      const { result } = renderHook(() => useChat(), { wrapper });

      // Verify initial state
      expect(result.current.isLoading).toBe(false);
      expect(result.current.messages.length).toBe(0);

      // Call sendMessage twice in rapid succession (simulating demo mode behavior)
      await act(async () => {
        // First call - should proceed
        const firstPromise = result.current.sendMessage("First message");

        // Advance just enough for first call to set isLoading=true
        await vi.advanceTimersByTimeAsync(10);

        // Second call - should be BLOCKED because isLoading is true
        const secondPromise = result.current.sendMessage("Second message");

        // Wait a bit for second call to be processed (or blocked)
        await vi.advanceTimersByTimeAsync(10);

        // Both promises resolve (first completes, second returns early)
        await vi.advanceTimersByTimeAsync(600);
        await Promise.all([firstPromise, secondPromise]);
      });

      // Wait for streaming to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      // THE ASSERTION: fetch should only be called ONCE
      // If this fails (fetch called twice), the race condition protection is broken
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Should only have 2 messages (1 user + 1 AI), not 4
      expect(result.current.messages.length).toBe(2);
      expect(result.current.messages[0].role).toBe("user");
      expect(result.current.messages[0].content).toBe("First message");
      expect(result.current.messages[1].role).toBe("assistant");
    });

    it("should allow second message AFTER first completes", async () => {
      mockFetch.mockImplementation(() => createSlowMockResponse(100));

      const { useChat } = await import("@/lib/hooks/useChat");
      const { result } = renderHook(() => useChat(), { wrapper });

      // First message
      await act(async () => {
        result.current.sendMessage("First message");
        await vi.advanceTimersByTimeAsync(200);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      // Second message AFTER first completes - should work
      await act(async () => {
        result.current.sendMessage("Second message");
        await vi.advanceTimersByTimeAsync(200);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      // Both should have gone through
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.current.messages.length).toBe(4); // 2 user + 2 AI
    });

    it("should block empty messages even when not loading", async () => {
      const { useChat } = await import("@/lib/hooks/useChat");
      const { result } = renderHook(() => useChat(), { wrapper });

      await act(async () => {
        result.current.sendMessage("");
        result.current.sendMessage("   ");
        result.current.sendMessage("\n\t");
      });

      // None should have gone through
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.messages.length).toBe(0);
    });

    /**
     * Stress test: Multiple rapid calls
     */
    it("should only process first message when many are sent rapidly", async () => {
      mockFetch.mockImplementation(() => createSlowMockResponse(500));

      const { useChat } = await import("@/lib/hooks/useChat");
      const { result } = renderHook(() => useChat(), { wrapper });

      await act(async () => {
        // Simulate demo mode sending many messages rapidly
        const promises = [
          result.current.sendMessage("Message 1"),
          result.current.sendMessage("Message 2"),
          result.current.sendMessage("Message 3"),
          result.current.sendMessage("Message 4"),
          result.current.sendMessage("Message 5"),
        ];

        await vi.advanceTimersByTimeAsync(1000);
        await Promise.all(promises);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      // Only the first message should have been processed
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.current.messages.length).toBe(2);
      expect(result.current.messages[0].content).toBe("Message 1");
    });
  });

  describe("isLoading state transitions", () => {
    it("should set isLoading=true immediately when sendMessage is called", async () => {
      mockFetch.mockImplementation(() => createSlowMockResponse(500));

      const { useChat } = await import("@/lib/hooks/useChat");
      const { result } = renderHook(() => useChat(), { wrapper });

      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        result.current.sendMessage("Test");
        // Don't advance timers - check immediate state
      });

      // isLoading should be true immediately
      expect(result.current.isLoading).toBe(true);

      // Cleanup
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
    });

    it("should set isLoading=false when response completes", async () => {
      mockFetch.mockImplementation(() => createSlowMockResponse(100));

      const { useChat } = await import("@/lib/hooks/useChat");
      const { result } = renderHook(() => useChat(), { wrapper });

      await act(async () => {
        result.current.sendMessage("Test");
        await vi.advanceTimersByTimeAsync(10);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
