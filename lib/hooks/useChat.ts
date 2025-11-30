/**
 * useChat Hook - Chat state management for LAUSD Vendor Portal
 *
 * Manages:
 * - Message history with streaming AI responses
 * - Form triggers from AI responses
 * - Vendor state tracking
 * - Loading and error states
 */

"use client";

import { useState, useCallback, useRef } from "react";
import { type VendorContext, type AccessTier, type SandboxCredentials, type IntegrationConfig } from "@/lib/types";
import { NetworkError, getUserErrorMessage } from "@/lib/errors";
import { getLastFormTrigger } from "@/lib/config/forms";

// =============================================================================
// TYPES
// =============================================================================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolCalls?: ToolCallInfo[];
  error?: string;
}

export interface ToolCallInfo {
  id: string;
  name: string;
  status: "pending" | "executing" | "completed" | "error";
  result?: {
    success: boolean;
    showForm?: string;
    message?: string;
    hasData?: boolean;
  };
}

export interface VendorState {
  isOnboarded: boolean;
  vendorId: string | null;
  companyName: string | null;
  accessTier: AccessTier | null;
  podsStatus: string | null;
  credentials: SandboxCredentials | null;
  integrations: IntegrationConfig[];
}

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  activeForm: string | null;
  vendorState: VendorState;
  error: string | null;
  suggestedResponses: string[];
  sendMessage: (content: string) => Promise<void>;
  setActiveForm: (form: string | null) => void;
  updateVendorState: (updates: Partial<VendorState>) => void;
  clearChat: () => void;
  clearError: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const INITIAL_VENDOR_STATE: VendorState = {
  isOnboarded: false,
  vendorId: null,
  companyName: null,
  accessTier: null,
  podsStatus: null,
  credentials: null,
  integrations: [],
};

const FETCH_TIMEOUT_MS = 30000; // 30 seconds
const SUGGESTIONS_REGEX = /\[SUGGESTIONS:(.*?)\]/g;

// =============================================================================
// HOOK
// =============================================================================

export function useChat(): UseChatReturn {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeForm, setActiveFormState] = useState<string | null>(null);
  const [vendorState, setVendorState] = useState<VendorState>(INITIAL_VENDOR_STATE);
  const [error, setError] = useState<string | null>(null);
  const [suggestedResponses, setSuggestedResponses] = useState<string[]>([]);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);

  // CRITICAL: Use ref for isLoading to avoid stale closure issues in sendMessage
  // The ref is updated synchronously so it always reflects the current state
  const isLoadingRef = useRef(isLoading);
  // Update ref synchronously during render (not in useEffect) to avoid timing gaps
  isLoadingRef.current = isLoading;

  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================

  /**
   * Generate a unique message ID
   */
  const generateMessageId = useCallback((): string => {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  /**
   * Detect form triggers in AI response
   * Uses centralized getLastFormTrigger from lib/config/forms.ts
   */
  const detectFormTriggers = useCallback((content: string): string | null => {
    return getLastFormTrigger(content);
  }, []);

  /**
   * Extract suggested responses from AI response
   * Format: [SUGGESTIONS:option1|option2|option3]
   */
  const extractSuggestions = useCallback((content: string): string[] => {
    const matches = content.match(SUGGESTIONS_REGEX);
    if (matches && matches.length > 0) {
      // Get the last suggestions block
      const lastMatch = matches[matches.length - 1];
      const suggestionsStr = lastMatch?.replace("[SUGGESTIONS:", "").replace("]", "");
      if (suggestionsStr) {
        return suggestionsStr.split("|").map(s => s.trim()).filter(s => s.length > 0);
      }
    }
    return [];
  }, []);

  /**
   * Build vendor context for API request
   */
  const buildVendorContext = useCallback((): VendorContext | undefined => {
    if (!vendorState.vendorId) {
      return undefined;
    }

    return {
      vendor: vendorState.vendorId
        ? {
            id: vendorState.vendorId,
            name: vendorState.companyName ?? "Unknown",
            contactEmail: "", // Would be populated from actual vendor data
            contactName: "",
            accessTier: vendorState.accessTier ?? "PRIVACY_SAFE",
            podsStatus: (vendorState.podsStatus as "NOT_STARTED" | "IN_PROGRESS" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "EXPIRED") ?? "NOT_STARTED",
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        : undefined,
      sandboxCredentials: vendorState.credentials ?? undefined,
      integrations: vendorState.integrations,
      sessionId: `session_${Date.now()}`,
      lastActivity: new Date(),
    };
  }, [vendorState]);

  // ==========================================================================
  // MAIN FUNCTIONS
  // ==========================================================================

  /**
   * Send a message and stream the AI response
   * CRITICAL: Uses isLoadingRef.current instead of isLoading closure
   * to ensure we always check the CURRENT loading state, not a stale closure value.
   * This fixes the demo mode race condition where messages were silently dropped.
   */
  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      // Use ref to check current isLoading state, not closure value
      // This is critical for demo mode where ref chains can have timing gaps
      if (!content.trim() || isLoadingRef.current) {
        console.log("[useChat] sendMessage blocked:", {
          emptyContent: !content.trim(),
          isLoading: isLoadingRef.current
        });
        return;
      }

      // Clear any previous error and suggestions
      // NOTE: DO NOT clear activeForm here - let it persist until explicitly closed
      // or a new form is triggered. Clearing it causes flash/glitch as form unmounts
      // and remounts during the API response cycle.
      setError(null);
      setSuggestedResponses([]);

      // Create user message
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      // Add user message to state
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Create placeholder for AI response
      const aiMessageId = generateMessageId();
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
        toolCalls: [],
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Create abort controller for timeout
      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(() => {
        abortControllerRef.current?.abort();
      }, FETCH_TIMEOUT_MS);

      try {
        // Prepare messages for API
        const apiMessages = [...messages, userMessage].map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

        // Build vendor context
        const vendorContext = buildVendorContext();

        // Make API request
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: apiMessages,
            vendorContext,
          }),
          signal: abortControllerRef.current.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            (errorData as { error?: string }).error ?? `HTTP ${response.status}: ${response.statusText}`
          );
        }

        // Process streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Response body is not readable");
        }

        const decoder = new TextDecoder();
        let accumulatedContent = "";
        let currentToolCalls: ToolCallInfo[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);

            if (data === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data) as {
                type: string;
                text?: string;
                tool?: string;
                id?: string;
                result?: ToolCallInfo["result"];
                error?: string;
              };

              switch (parsed.type) {
                case "content":
                  if (parsed.text) {
                    accumulatedContent += parsed.text;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === aiMessageId
                          ? { ...msg, content: accumulatedContent }
                          : msg
                      )
                    );
                  }
                  break;

                case "tool_start":
                  if (parsed.tool && parsed.id) {
                    currentToolCalls = [
                      ...currentToolCalls,
                      {
                        id: parsed.id,
                        name: parsed.tool,
                        status: "pending",
                      },
                    ];
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === aiMessageId
                          ? { ...msg, toolCalls: currentToolCalls }
                          : msg
                      )
                    );
                  }
                  break;

                case "tool_executing":
                  if (parsed.id) {
                    currentToolCalls = currentToolCalls.map((tc) =>
                      tc.id === parsed.id ? { ...tc, status: "executing" } : tc
                    );
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === aiMessageId
                          ? { ...msg, toolCalls: currentToolCalls }
                          : msg
                      )
                    );
                  }
                  break;

                case "tool_result":
                  if (parsed.id && parsed.result) {
                    currentToolCalls = currentToolCalls.map((tc) =>
                      tc.id === parsed.id
                        ? {
                            ...tc,
                            status: parsed.result?.success ? "completed" : "error",
                            result: parsed.result,
                          }
                        : tc
                    );
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === aiMessageId
                          ? { ...msg, toolCalls: currentToolCalls }
                          : msg
                      )
                    );

                    // Check if tool result triggers a form
                    if (parsed.result.showForm) {
                      setActiveFormState(parsed.result.showForm);
                    }
                  }
                  break;

                case "error":
                  setError(parsed.error ?? "An error occurred");
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId
                        ? { ...msg, error: parsed.error, isStreaming: false }
                        : msg
                    )
                  );
                  break;
              }
            } catch {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }

        // Finalize message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, isStreaming: false, content: accumulatedContent }
              : msg
          )
        );

        // Check for form triggers in final content
        const formTrigger = detectFormTriggers(accumulatedContent);
        if (formTrigger) {
          setActiveFormState(formTrigger);
        }

        // Extract and set suggested responses
        const suggestions = extractSuggestions(accumulatedContent);
        if (suggestions.length > 0) {
          setSuggestedResponses(suggestions);
        }
      } catch (err) {
        // Handle different error types with user-friendly messages
        let errorMessage: string;

        if (err instanceof Error) {
          if (err.name === "AbortError") {
            // Timeout or manual abort
            errorMessage = "Request timed out. Please try again.";
          } else if (
            err.message.includes("Failed to fetch") ||
            err.message.includes("NetworkError") ||
            err.message.includes("fetch")
          ) {
            // Network connectivity issues
            const networkError = NetworkError.fromFetchError(err);
            errorMessage = networkError.toUserMessage();
          } else {
            // Use the error utilities for consistent messaging
            errorMessage = getUserErrorMessage(err);
          }
        } else {
          errorMessage = "An unexpected error occurred. Please try again.";
        }

        setError(errorMessage);

        // Update AI message with error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? {
                  ...msg,
                  content:
                    msg.content ||
                    "I apologize, but I encountered an error processing your request. Please try again.",
                  error: errorMessage,
                  isStreaming: false,
                }
              : msg
          )
        );
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [
      // NOTE: isLoading is NOT in deps - we use isLoadingRef.current instead
      // This prevents stale closure issues and ensures stable sendMessage reference
      messages,
      generateMessageId,
      buildVendorContext,
      detectFormTriggers,
      extractSuggestions,
    ]
  );

  /**
   * Set the active form
   */
  const setActiveForm = useCallback((form: string | null): void => {
    setActiveFormState(form);
  }, []);

  /**
   * Update vendor state
   */
  const updateVendorState = useCallback(
    (updates: Partial<VendorState>): void => {
      setVendorState((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  /**
   * Clear chat history
   */
  const clearChat = useCallback((): void => {
    // Abort any pending request
    abortControllerRef.current?.abort();

    setMessages([]);
    setIsLoading(false);
    setActiveFormState(null);
    setError(null);
    setSuggestedResponses([]);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    messages,
    isLoading,
    activeForm,
    vendorState,
    error,
    suggestedResponses,
    sendMessage,
    setActiveForm,
    updateVendorState,
    clearChat,
    clearError,
  };
}

export default useChat;
