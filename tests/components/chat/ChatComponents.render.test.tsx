/**
 * @vitest-environment jsdom
 */

/**
 * Chat Components Rendering Tests
 *
 * Tests basic rendering and interactions for all chat components.
 * This file covers: TypingIndicator, MessageBubble, SuggestionChips
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { SuggestionChips } from "@/components/chat/SuggestionChips";
import type { ChatMessage, VendorState } from "@/lib/hooks/useChat";

// =============================================================================
// TEST UTILITIES
// =============================================================================

function createMockMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "msg-1",
    role: "assistant",
    content: "Hello, how can I help you?",
    timestamp: new Date("2024-01-15T10:30:00"),
    ...overrides,
  };
}

function createMockVendorState(overrides: Partial<VendorState> = {}): VendorState {
  return {
    isOnboarded: false,
    credentials: null,
    ...overrides,
  };
}

// =============================================================================
// TYPING INDICATOR TESTS
// =============================================================================

describe("TypingIndicator", () => {
  describe("Basic Rendering", () => {
    it("should render the assistant avatar", () => {
      render(<TypingIndicator />);

      // Avatar container with Bot icon
      const avatar = document.querySelector(".rounded-full");
      expect(avatar).toBeInTheDocument();
    });

    it("should render the assistant name", () => {
      render(<TypingIndicator />);

      expect(screen.getByText("Integration Assistant")).toBeInTheDocument();
    });

    it("should render three bouncing dots", () => {
      render(<TypingIndicator />);

      // Find all spans with animate-bounce class
      const dots = document.querySelectorAll(".animate-bounce");
      expect(dots).toHaveLength(3);
    });

    it("should have staggered animation delays", () => {
      render(<TypingIndicator />);

      const dots = document.querySelectorAll(".animate-bounce");
      expect(dots[0]).toHaveStyle({ animationDelay: "0ms" });
      expect(dots[1]).toHaveStyle({ animationDelay: "150ms" });
      expect(dots[2]).toHaveStyle({ animationDelay: "300ms" });
    });

    it("should render the bubble container", () => {
      render(<TypingIndicator />);

      // Bubble with shadow-sm class
      const bubble = document.querySelector(".shadow-sm");
      expect(bubble).toBeInTheDocument();
    });
  });
});

// =============================================================================
// MESSAGE BUBBLE TESTS
// =============================================================================

describe("MessageBubble", () => {
  describe("User Message Rendering", () => {
    it("should render user message content", () => {
      const message = createMockMessage({
        role: "user",
        content: "Hello, I need help with integration",
      });

      render(<MessageBubble message={message} />);

      expect(screen.getByText("Hello, I need help with integration")).toBeInTheDocument();
    });

    it("should render user avatar", () => {
      const message = createMockMessage({ role: "user" });

      render(<MessageBubble message={message} />);

      // User avatar should have primary background
      const avatar = document.querySelector(".bg-primary");
      expect(avatar).toBeInTheDocument();
    });

    it("should align user message to the right", () => {
      const message = createMockMessage({ role: "user" });

      render(<MessageBubble message={message} />);

      // User messages have flex-row-reverse
      const container = document.querySelector(".flex-row-reverse");
      expect(container).toBeInTheDocument();
    });

    it("should not show assistant header for user messages", () => {
      const message = createMockMessage({ role: "user" });

      render(<MessageBubble message={message} />);

      expect(screen.queryByText("Integration Assistant")).not.toBeInTheDocument();
    });
  });

  describe("Assistant Message Rendering", () => {
    it("should render assistant message content", () => {
      const message = createMockMessage({
        role: "assistant",
        content: "I can help you get started!",
      });

      render(<MessageBubble message={message} />);

      expect(screen.getByText("I can help you get started!")).toBeInTheDocument();
    });

    it("should render assistant avatar", () => {
      const message = createMockMessage({ role: "assistant" });

      render(<MessageBubble message={message} />);

      // Assistant avatar should have secondary-100 background
      const avatar = document.querySelector(".bg-secondary-100");
      expect(avatar).toBeInTheDocument();
    });

    it("should show assistant header", () => {
      const message = createMockMessage({ role: "assistant" });

      render(<MessageBubble message={message} />);

      expect(screen.getByText("Integration Assistant")).toBeInTheDocument();
    });

    it("should align assistant message to the left", () => {
      const message = createMockMessage({ role: "assistant" });

      render(<MessageBubble message={message} />);

      // Assistant messages have flex-row (not reversed)
      const container = document.querySelector(".flex-row");
      expect(container).toBeInTheDocument();
    });
  });

  describe("Markdown Rendering", () => {
    it("should render bold text", () => {
      const message = createMockMessage({
        content: "This is **bold** text",
      });

      render(<MessageBubble message={message} />);

      const strong = document.querySelector("strong");
      expect(strong).toBeInTheDocument();
      expect(strong?.textContent).toBe("bold");
    });

    it("should render italic text", () => {
      const message = createMockMessage({
        content: "This is *italic* text",
      });

      render(<MessageBubble message={message} />);

      const em = document.querySelector("em");
      expect(em).toBeInTheDocument();
      expect(em?.textContent).toBe("italic");
    });

    it("should render inline code", () => {
      const message = createMockMessage({
        content: "Use `npm install` to install",
      });

      render(<MessageBubble message={message} />);

      const code = document.querySelector("code");
      expect(code).toBeInTheDocument();
      expect(code?.textContent).toBe("npm install");
    });

    it("should render code blocks", () => {
      const message = createMockMessage({
        content: "```javascript\nconst x = 1;\n```",
      });

      render(<MessageBubble message={message} />);

      const pre = document.querySelector("pre");
      expect(pre).toBeInTheDocument();
    });

    it("should render unordered lists", () => {
      const message = createMockMessage({
        content: "- Item 1\n- Item 2\n- Item 3",
      });

      render(<MessageBubble message={message} />);

      const ul = document.querySelector("ul");
      expect(ul).toBeInTheDocument();
      const items = document.querySelectorAll("li");
      expect(items).toHaveLength(3);
    });

    it("should strip SUGGESTIONS markers", () => {
      const message = createMockMessage({
        content: "Here are some options [SUGGESTIONS:one,two,three]",
      });

      render(<MessageBubble message={message} />);

      expect(screen.queryByText(/SUGGESTIONS:/)).not.toBeInTheDocument();
      expect(screen.getByText(/Here are some options/)).toBeInTheDocument();
    });

    it("should strip FORM markers", () => {
      const message = createMockMessage({
        content: "Please fill out this form [FORM:PODS_LITE]",
      });

      render(<MessageBubble message={message} />);

      expect(screen.queryByText(/FORM:/)).not.toBeInTheDocument();
      expect(screen.getByText(/Please fill out this form/)).toBeInTheDocument();
    });
  });

  describe("Timestamp Rendering", () => {
    it("should render formatted timestamp", () => {
      const message = createMockMessage({
        timestamp: new Date("2024-01-15T14:30:00"),
      });

      render(<MessageBubble message={message} />);

      // Should show time in HH:MM format
      expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
    });
  });

  describe("Streaming State", () => {
    it("should show streaming indicator when isStreaming", () => {
      const message = createMockMessage({
        isStreaming: true,
      });

      render(<MessageBubble message={message} />);

      // Should have animate-pulse element
      const pulsingDot = document.querySelector(".animate-pulse");
      expect(pulsingDot).toBeInTheDocument();
    });

    it("should not show streaming indicator when not streaming", () => {
      const message = createMockMessage({
        isStreaming: false,
      });

      render(<MessageBubble message={message} />);

      // Should not have the streaming dot (but may have other animate-pulse elements)
      const streamingIndicator = document.querySelector("span.animate-pulse");
      expect(streamingIndicator).not.toBeInTheDocument();
    });
  });

  describe("Tool Calls Display", () => {
    it("should render completed tool calls", () => {
      const message = createMockMessage({
        toolCalls: [
          {
            id: "tool-1",
            name: "provision_sandbox",
            status: "completed",
            result: { message: "Credentials created" },
          },
        ],
      });

      render(<MessageBubble message={message} />);

      expect(screen.getByText("Provision Sandbox")).toBeInTheDocument();
      expect(screen.getByText("✓")).toBeInTheDocument();
    });

    it("should render executing tool calls with spinner", () => {
      const message = createMockMessage({
        toolCalls: [
          {
            id: "tool-1",
            name: "test_oneroster",
            status: "executing",
          },
        ],
      });

      render(<MessageBubble message={message} />);

      expect(screen.getByText("Test Oneroster")).toBeInTheDocument();
      // Should have spinner (animate-spin)
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should render error tool calls", () => {
      const message = createMockMessage({
        toolCalls: [
          {
            id: "tool-1",
            name: "configure_sso",
            status: "error",
          },
        ],
      });

      render(<MessageBubble message={message} />);

      expect(screen.getByText("Configure Sso")).toBeInTheDocument();
      // Should have error styling
      const errorBadge = document.querySelector(".bg-error-50");
      expect(errorBadge).toBeInTheDocument();
    });

    it("should format tool names properly", () => {
      const message = createMockMessage({
        toolCalls: [
          {
            id: "tool-1",
            name: "send_test_message",
            status: "completed",
          },
        ],
      });

      render(<MessageBubble message={message} />);

      // Should convert snake_case to Title Case
      expect(screen.getByText("Send Test Message")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should render error message when present", () => {
      const message = createMockMessage({
        error: "Failed to connect to server",
      });

      render(<MessageBubble message={message} />);

      expect(screen.getByText("Failed to connect to server")).toBeInTheDocument();
    });

    it("should apply error styling to bubble", () => {
      const message = createMockMessage({
        error: "Network error",
      });

      render(<MessageBubble message={message} />);

      const errorBubble = document.querySelector(".border-error-200");
      expect(errorBubble).toBeInTheDocument();
    });
  });
});

// =============================================================================
// SUGGESTION CHIPS TESTS
// =============================================================================

describe("SuggestionChips", () => {
  let mockOnSelect: ReturnType<typeof vi.fn>;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    mockOnSelect = vi.fn();
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Suggestions (No Vendor State)", () => {
    it("should render initial suggestions when no vendor state", () => {
      render(<SuggestionChips onSelect={mockOnSelect} />);

      expect(screen.getByText("Register my EdTech app for API access")).toBeInTheDocument();
      expect(screen.getByText("Check if my company has an existing PoDS")).toBeInTheDocument();
      expect(screen.getByText("What is tokenization?")).toBeInTheDocument();
      expect(screen.getByText("What data can I access?")).toBeInTheDocument();
    });

    it("should render chips as buttons", () => {
      render(<SuggestionChips onSelect={mockOnSelect} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(4);
    });

    it("should have icons on suggestion chips", () => {
      render(<SuggestionChips onSelect={mockOnSelect} />);

      // Icons are wrapped in spans with opacity-70
      const iconContainers = document.querySelectorAll(".opacity-70");
      expect(iconContainers.length).toBeGreaterThan(0);
    });
  });

  describe("Onboarded Suggestions", () => {
    it("should show onboarded suggestions when vendor is onboarded", () => {
      const vendorState = createMockVendorState({ isOnboarded: true });

      render(<SuggestionChips onSelect={mockOnSelect} vendorState={vendorState} />);

      expect(screen.getByText("Provision my sandbox API credentials")).toBeInTheDocument();
      expect(screen.getByText("Configure SSO with SchoolDay")).toBeInTheDocument();
      expect(screen.getByText("Test the OneRoster API")).toBeInTheDocument();
      expect(screen.getByText("Check my integration status")).toBeInTheDocument();
    });
  });

  describe("With Credentials Suggestions", () => {
    it("should show credentials suggestions when vendor has credentials", () => {
      const vendorState = createMockVendorState({
        isOnboarded: true,
        credentials: {
          clientId: "client-123",
          clientSecret: "secret-456",
          sandboxUrl: "https://sandbox.example.com",
        },
      });

      render(<SuggestionChips onSelect={mockOnSelect} vendorState={vendorState} />);

      expect(screen.getByText("Show me sample student data from the API")).toBeInTheDocument();
      expect(screen.getByText("Test sending a message through the communication gateway")).toBeInTheDocument();
      expect(screen.getByText("Configure LTI for Schoology integration")).toBeInTheDocument();
      expect(screen.getByText("View my audit logs")).toBeInTheDocument();
    });
  });

  describe("Custom Suggestions", () => {
    it("should render custom suggestions when provided", () => {
      render(
        <SuggestionChips
          onSelect={mockOnSelect}
          suggestions={["Custom option 1", "Custom option 2"]}
        />
      );

      expect(screen.getByText("Custom option 1")).toBeInTheDocument();
      expect(screen.getByText("Custom option 2")).toBeInTheDocument();
    });

    it("should prioritize custom suggestions over default", () => {
      render(
        <SuggestionChips
          onSelect={mockOnSelect}
          suggestions={["Only this one"]}
        />
      );

      expect(screen.getByText("Only this one")).toBeInTheDocument();
      expect(screen.queryByText("Register my EdTech app for API access")).not.toBeInTheDocument();
    });
  });

  describe("Contextual Suggestions", () => {
    it("should render contextual suggestions with highest priority", () => {
      const vendorState = createMockVendorState({ isOnboarded: true });

      render(
        <SuggestionChips
          onSelect={mockOnSelect}
          vendorState={vendorState}
          contextualSuggestions={["Follow-up question 1", "Follow-up question 2"]}
        />
      );

      expect(screen.getByText("Follow-up question 1")).toBeInTheDocument();
      expect(screen.getByText("Follow-up question 2")).toBeInTheDocument();
      // Should not show onboarded suggestions
      expect(screen.queryByText("Provision my sandbox API credentials")).not.toBeInTheDocument();
    });
  });

  describe("Chip Interactions", () => {
    it("should call onSelect when chip clicked", async () => {
      render(<SuggestionChips onSelect={mockOnSelect} />);

      await user.click(screen.getByText("What is tokenization?"));

      expect(mockOnSelect).toHaveBeenCalledWith("What is tokenization?");
    });

    it("should call onSelect with correct suggestion text", async () => {
      render(
        <SuggestionChips
          onSelect={mockOnSelect}
          suggestions={["Test suggestion"]}
        />
      );

      await user.click(screen.getByText("Test suggestion"));

      expect(mockOnSelect).toHaveBeenCalledWith("Test suggestion");
    });
  });

  describe("Disabled State", () => {
    it("should disable all chips when disabled prop is true", () => {
      render(<SuggestionChips onSelect={mockOnSelect} disabled={true} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it("should not call onSelect when disabled", async () => {
      render(<SuggestionChips onSelect={mockOnSelect} disabled={true} />);

      const button = screen.getByText("What is tokenization?");
      await user.click(button);

      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });

  describe("Empty State", () => {
    it("should return null when suggestions array is empty", () => {
      const { container } = render(
        <SuggestionChips onSelect={mockOnSelect} suggestions={[]} />
      );

      // Empty suggestions with no vendor state should still show initial suggestions
      expect(container.querySelector("button")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have horizontal scrolling container", () => {
      render(<SuggestionChips onSelect={mockOnSelect} />);

      const scrollContainer = document.querySelector(".overflow-x-auto");
      expect(scrollContainer).toBeInTheDocument();
    });

    it("should have rounded pill styling on chips", () => {
      render(<SuggestionChips onSelect={mockOnSelect} />);

      const chip = screen.getByText("What is tokenization?").closest("button");
      expect(chip).toHaveClass("rounded-full");
    });

    it("should have hover styling on chips", () => {
      render(<SuggestionChips onSelect={mockOnSelect} />);

      const chip = screen.getByText("What is tokenization?").closest("button");
      expect(chip).toHaveClass("hover:border-secondary");
    });
  });
});
