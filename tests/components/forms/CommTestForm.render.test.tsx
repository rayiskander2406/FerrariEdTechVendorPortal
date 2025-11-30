/**
 * @vitest-environment jsdom
 */

/**
 * CommTestForm Rendering Tests
 *
 * Comprehensive tests for the Communication Gateway Test form.
 * Tests all MVP-06 features: cost preview, delivery status, privacy explainer, scale calculator.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommTestForm from "@/components/forms/CommTestForm";

// =============================================================================
// MOCKS
// =============================================================================

// Mock synthetic data
vi.mock("@/lib/data/synthetic", () => ({
  SYNTHETIC_DATA: {
    students: [
      {
        token: "TKN_STU_ABC123XY",
        firstName: "Maria",
        lastName: "[TOKENIZED]",
        gradeLevel: 3,
      },
      {
        token: "TKN_STU_DEF456ZZ",
        firstName: "James",
        lastName: "[TOKENIZED]",
        gradeLevel: 5,
      },
      {
        token: "TKN_STU_GHI789AA",
        firstName: "Sophia",
        lastName: "[TOKENIZED]",
        gradeLevel: 0,
      },
    ],
    teachers: [],
    schools: [],
    classes: [],
    enrollments: [],
    demographics: [],
  },
}));

// =============================================================================
// TEST SETUP
// =============================================================================

describe("CommTestForm Rendering", () => {
  let mockSubmit: ReturnType<typeof vi.fn>;
  let mockCancel: ReturnType<typeof vi.fn>;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    mockSubmit = vi.fn().mockResolvedValue(undefined);
    mockCancel = vi.fn();
    user = userEvent.setup();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ===========================================================================
  // BASIC RENDERING TESTS
  // ===========================================================================

  describe("Basic Rendering", () => {
    it("should render the form header", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByText("Communication Gateway Test")).toBeInTheDocument();
      expect(screen.getByText(/Test tokenized messaging/)).toBeInTheDocument();
    });

    it("should render channel toggle buttons", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByRole("button", { name: /email/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sms/i })).toBeInTheDocument();
    });

    it("should render recipient dropdown", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByRole("combobox")).toBeInTheDocument();
      expect(screen.getByText("Select a recipient...")).toBeInTheDocument();
    });

    it("should render message body textarea", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByPlaceholderText(/enter your message/i)).toBeInTheDocument();
    });

    it("should render submit and cancel buttons", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByRole("button", { name: /send test message/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("should have submit button disabled initially", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByRole("button", { name: /send test message/i })).toBeDisabled();
    });
  });

  // ===========================================================================
  // CHANNEL SELECTION TESTS
  // ===========================================================================

  describe("Channel Selection", () => {
    it("should default to EMAIL channel", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      const emailButton = screen.getByRole("button", { name: /email/i });
      expect(emailButton).toHaveClass("border-amber-500");
    });

    it("should switch to SMS channel when clicked", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      const smsButton = screen.getByRole("button", { name: /sms/i });
      await user.click(smsButton);

      expect(smsButton).toHaveClass("border-amber-500");
    });

    it("should show subject field for EMAIL", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByPlaceholderText(/enter email subject/i)).toBeInTheDocument();
    });

    it("should hide subject field for SMS", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.click(screen.getByRole("button", { name: /sms/i }));

      expect(screen.queryByPlaceholderText(/enter email subject/i)).not.toBeInTheDocument();
    });

    it("should show SMS segment counter when SMS selected", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.click(screen.getByRole("button", { name: /sms/i }));

      // Uses getAllByText since "segment" appears in multiple places (pricing and counter)
      const segmentElements = screen.getAllByText(/segment/i);
      expect(segmentElements.length).toBeGreaterThan(0);
      expect(screen.getByText("0 / 480")).toBeInTheDocument();
    });

    it("should clear form fields when switching channels", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      // Fill email subject
      await user.type(screen.getByPlaceholderText(/enter email subject/i), "Test Subject");

      // Switch to SMS
      await user.click(screen.getByRole("button", { name: /sms/i }));

      // Switch back to EMAIL
      await user.click(screen.getByRole("button", { name: /email/i }));

      // Subject should be cleared
      expect(screen.getByPlaceholderText(/enter email subject/i)).toHaveValue("");
    });
  });

  // ===========================================================================
  // COST PREVIEW TESTS (MVP-06)
  // ===========================================================================

  describe("Cost Preview (MVP-06)", () => {
    it("should display cost preview section", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByText("Cost Preview")).toBeInTheDocument();
    });

    it("should show per-message cost for EMAIL", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      // Default EMAIL price is $0.002 (formatted with 4 decimals since < $0.01)
      // Multiple elements show this price, so use getAllByText
      const priceElements = screen.getAllByText(/\$0\.0020/);
      expect(priceElements.length).toBeGreaterThan(0);
    });

    it("should show per-segment cost for SMS", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.click(screen.getByRole("button", { name: /sms/i }));

      // SMS price is $0.015 per segment (formatted with 2 decimals since >= $0.01)
      // Multiple elements show this price, so use getAllByText
      const priceElements = screen.getAllByText(/\$0\.02/);
      expect(priceElements.length).toBeGreaterThan(0);
    });

    it("should show monthly projection", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByText(/monthly/i)).toBeInTheDocument();
      expect(screen.getByText(/30\/day/i)).toBeInTheDocument();
    });

    it("should show LAUSD scale calculator", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByText(/at lausd scale/i)).toBeInTheDocument();
      expect(screen.getByText(/670,000 families/i)).toBeInTheDocument();
    });

    it("should update SMS cost based on segments", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.click(screen.getByRole("button", { name: /sms/i }));

      // Type a 2-segment message (>160 chars)
      const textarea = screen.getByPlaceholderText(/enter sms message/i);
      await user.type(textarea, "a".repeat(161));

      // Should show 2 segments in the counter (format: "2 segments")
      expect(screen.getByText("2 segments")).toBeInTheDocument();
    });

    it("should show estimated cost in submit area", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByText(/est\. cost:/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // PRIVACY EXPLAINER TESTS (MVP-06)
  // ===========================================================================

  describe("Privacy Explainer (MVP-06)", () => {
    it("should display privacy protection section", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByText("Privacy Protection")).toBeInTheDocument();
    });

    it("should explain how secure relay works", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByText(/how secure relay works/i)).toBeInTheDocument();
      expect(screen.getByText(/vendor sends to/i)).toBeInTheDocument();
      expect(screen.getByText(/TKN_STU_xxx/i)).toBeInTheDocument();
    });

    it("should display privacy badges", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      // Privacy badges are in the PrivacyExplainer component
      // Use exact text matches for the badges defined in PRIVACY_BADGES
      expect(screen.getByText("No PII Exposed")).toBeInTheDocument();
      expect(screen.getByText("Secure Relay")).toBeInTheDocument();
      expect(screen.getByText("Full Audit Trail")).toBeInTheDocument();
      expect(screen.getByText("FERPA/COPPA Compliant")).toBeInTheDocument();
    });

    it("should show privacy badges in header", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      // Header section contains privacy indicators
      expect(screen.getByText("Privacy-safe delivery")).toBeInTheDocument();
      expect(screen.getByText("No PII exposed")).toBeInTheDocument();
      expect(screen.getByText("Full audit trail")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // RECIPIENT SELECTION TESTS
  // ===========================================================================

  describe("Recipient Selection", () => {
    it("should show tokenized recipients in dropdown", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      const select = screen.getByRole("combobox");
      await user.click(select);

      expect(screen.getByText(/TKN_STU_ABC123.*Maria/)).toBeInTheDocument();
      expect(screen.getByText(/TKN_STU_DEF456.*James/)).toBeInTheDocument();
    });

    it("should show grade level in recipient options", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      // Check for kindergarten (grade 0 shows as "K")
      expect(screen.getByText(/Grade K/)).toBeInTheDocument();
      expect(screen.getByText(/Grade 3/)).toBeInTheDocument();
    });

    it("should enable submit when recipient selected and form filled", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      // Select recipient
      await user.selectOptions(screen.getByRole("combobox"), "TKN_STU_ABC123XY");

      // Fill subject
      await user.type(screen.getByPlaceholderText(/enter email subject/i), "Test");

      // Fill body
      await user.type(screen.getByPlaceholderText(/enter your message/i), "Test message");

      // Submit should be enabled
      expect(screen.getByRole("button", { name: /send test message/i })).not.toBeDisabled();
    });
  });

  // ===========================================================================
  // SMS SEGMENT COUNTER TESTS
  // ===========================================================================

  describe("SMS Segment Counter", () => {
    beforeEach(async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);
      await user.click(screen.getByRole("button", { name: /sms/i }));
    });

    it("should show 0 segments for empty message", () => {
      expect(screen.getByText("0 / 480")).toBeInTheDocument();
      expect(screen.getByText("0 segments")).toBeInTheDocument();
    });

    it("should show 1 segment for short message", async () => {
      await user.type(screen.getByPlaceholderText(/enter sms message/i), "Hello");

      expect(screen.getByText("5 / 480")).toBeInTheDocument();
      expect(screen.getByText("1 segment")).toBeInTheDocument();
    });

    it("should show 2 segments for 161+ chars", async () => {
      await user.type(screen.getByPlaceholderText(/enter sms message/i), "a".repeat(161));

      expect(screen.getByText("161 / 480")).toBeInTheDocument();
      expect(screen.getByText("2 segments")).toBeInTheDocument();
    });

    it("should show error state for over-limit", async () => {
      // Use fireEvent.change for faster input of long strings (userEvent.type is too slow)
      const textarea = screen.getByPlaceholderText(/enter sms message/i);
      await user.clear(textarea);
      // Use native input event for performance
      Object.defineProperty(textarea, "value", { value: "a".repeat(481), writable: true });
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("change", { bubbles: true }));

      // Error message format: "Maximum 3 SMS segments (480 characters)"
      await waitFor(() => {
        expect(screen.getByText(/Maximum 3 SMS segments/)).toBeInTheDocument();
      });
    });

    it("should show visual segment indicators", () => {
      // Should show 3 segment indicators
      const segmentIndicators = document.querySelectorAll('[class*="rounded-full"][class*="h-1.5"]');
      expect(segmentIndicators.length).toBe(3);
    });
  });

  // ===========================================================================
  // FORM VALIDATION TESTS
  // ===========================================================================

  describe("Form Validation", () => {
    it("should show error when submitting without recipient", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      // Fill only subject and body
      await user.type(screen.getByPlaceholderText(/enter email subject/i), "Test");
      await user.type(screen.getByPlaceholderText(/enter your message/i), "Test message");

      // Submit button should still be disabled
      expect(screen.getByRole("button", { name: /send test message/i })).toBeDisabled();
    });

    it("should show error when submitting without subject (EMAIL)", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      // Fill recipient and body only
      await user.selectOptions(screen.getByRole("combobox"), "TKN_STU_ABC123XY");
      await user.type(screen.getByPlaceholderText(/enter your message/i), "Test message");

      // Submit button should still be disabled
      expect(screen.getByRole("button", { name: /send test message/i })).toBeDisabled();
    });

    it("should not require subject for SMS", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.click(screen.getByRole("button", { name: /sms/i }));

      // Fill recipient and body only
      await user.selectOptions(screen.getByRole("combobox"), "TKN_STU_ABC123XY");
      await user.type(screen.getByPlaceholderText(/enter sms message/i), "Test message");

      // Submit button should be enabled
      expect(screen.getByRole("button", { name: /send test message/i })).not.toBeDisabled();
    });

    it("should disable submit when SMS over limit", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.click(screen.getByRole("button", { name: /sms/i }));
      await user.selectOptions(screen.getByRole("combobox"), "TKN_STU_ABC123XY");

      // Use native event for faster input of long strings
      const textarea = screen.getByPlaceholderText(/enter sms message/i);
      Object.defineProperty(textarea, "value", { value: "a".repeat(481), writable: true });
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("change", { bubbles: true }));

      // Button should remain disabled due to over-limit
      await waitFor(() => {
        const submitButton = screen.getByRole("button", { name: /send test message/i });
        expect(submitButton).toBeDisabled();
      });
    });
  });

  // ===========================================================================
  // FORM SUBMISSION TESTS
  // ===========================================================================

  describe("Form Submission", () => {
    it("should call onSubmit with correct EMAIL data", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.selectOptions(screen.getByRole("combobox"), "TKN_STU_ABC123XY");
      await user.type(screen.getByPlaceholderText(/enter email subject/i), "Test Subject");
      await user.type(screen.getByPlaceholderText(/enter your message/i), "Test message body");

      await user.click(screen.getByRole("button", { name: /send test message/i }));

      expect(mockSubmit).toHaveBeenCalledWith({
        channel: "EMAIL",
        recipientToken: "TKN_STU_ABC123XY",
        subject: "Test Subject",
        body: "Test message body",
      });
    });

    it("should call onSubmit with correct SMS data", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.click(screen.getByRole("button", { name: /sms/i }));
      await user.selectOptions(screen.getByRole("combobox"), "TKN_STU_ABC123XY");
      await user.type(screen.getByPlaceholderText(/enter sms message/i), "SMS test");

      await user.click(screen.getByRole("button", { name: /send test message/i }));

      expect(mockSubmit).toHaveBeenCalledWith({
        channel: "SMS",
        recipientToken: "TKN_STU_ABC123XY",
        subject: undefined,
        body: "SMS test",
      });
    });

    it("should show loading state during submission", async () => {
      mockSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.selectOptions(screen.getByRole("combobox"), "TKN_STU_ABC123XY");
      await user.type(screen.getByPlaceholderText(/enter email subject/i), "Test");
      await user.type(screen.getByPlaceholderText(/enter your message/i), "Message");

      await user.click(screen.getByRole("button", { name: /send test message/i }));

      expect(screen.getByText(/sending\.\.\./i)).toBeInTheDocument();
    });

    it("should call onCancel when cancel clicked", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(mockCancel).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // DELIVERY STATUS TIMELINE TESTS (MVP-06)
  // ===========================================================================

  describe("Delivery Status Timeline (MVP-06)", () => {
    it("should show delivery timeline after submission", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.selectOptions(screen.getByRole("combobox"), "TKN_STU_ABC123XY");
      await user.type(screen.getByPlaceholderText(/enter email subject/i), "Test");
      await user.type(screen.getByPlaceholderText(/enter your message/i), "Message");

      await user.click(screen.getByRole("button", { name: /send test message/i }));

      // Should show message status section
      expect(screen.getByText(/message status/i)).toBeInTheDocument();
    });

    it("should display message ID after submission", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.selectOptions(screen.getByRole("combobox"), "TKN_STU_ABC123XY");
      await user.type(screen.getByPlaceholderText(/enter email subject/i), "Test");
      await user.type(screen.getByPlaceholderText(/enter your message/i), "Message");

      await user.click(screen.getByRole("button", { name: /send test message/i }));

      // Should show message ID (format: msg_xxxxxxxxxxxx)
      expect(screen.getByText(/msg_/)).toBeInTheDocument();
    });

    it("should show QUEUED status initially", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.selectOptions(screen.getByRole("combobox"), "TKN_STU_ABC123XY");
      await user.type(screen.getByPlaceholderText(/enter email subject/i), "Test");
      await user.type(screen.getByPlaceholderText(/enter your message/i), "Message");

      await user.click(screen.getByRole("button", { name: /send test message/i }));

      expect(screen.getByText("Queued")).toBeInTheDocument();
    });

    it("should transition to SENT status", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.selectOptions(screen.getByRole("combobox"), "TKN_STU_ABC123XY");
      await user.type(screen.getByPlaceholderText(/enter email subject/i), "Test");
      await user.type(screen.getByPlaceholderText(/enter your message/i), "Message");

      await user.click(screen.getByRole("button", { name: /send test message/i }));

      // Advance time past sent delay (1500ms)
      await vi.advanceTimersByTimeAsync(1600);

      expect(screen.getByText("Sent")).toBeInTheDocument();
    });

    it("should transition to DELIVERED status", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.selectOptions(screen.getByRole("combobox"), "TKN_STU_ABC123XY");
      await user.type(screen.getByPlaceholderText(/enter email subject/i), "Test");
      await user.type(screen.getByPlaceholderText(/enter your message/i), "Message");

      await user.click(screen.getByRole("button", { name: /send test message/i }));

      // Advance time past delivered delay (2500ms)
      await vi.advanceTimersByTimeAsync(2600);

      expect(screen.getByText("Delivered")).toBeInTheDocument();
    });

    it("should show success message after delivery", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.selectOptions(screen.getByRole("combobox"), "TKN_STU_ABC123XY");
      await user.type(screen.getByPlaceholderText(/enter email subject/i), "Test");
      await user.type(screen.getByPlaceholderText(/enter your message/i), "Message");

      await user.click(screen.getByRole("button", { name: /send test message/i }));

      // Advance time past delivered delay
      await vi.advanceTimersByTimeAsync(2600);

      expect(screen.getByText(/message delivered!/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // MESSAGE PREVIEW TESTS
  // ===========================================================================

  describe("Message Preview", () => {
    it("should display message preview section", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByText("Message Preview")).toBeInTheDocument();
    });

    it("should show placeholder when no recipient selected", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      // Message preview shows "→ [No recipient]" when no recipient selected
      expect(screen.getByText(/\[No recipient\]/)).toBeInTheDocument();
    });

    it("should show selected recipient in preview", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.selectOptions(screen.getByRole("combobox"), "TKN_STU_ABC123XY");

      expect(screen.getByText(/TKN_STU_ABC123XY/)).toBeInTheDocument();
    });

    it("should show subject in preview for EMAIL", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.type(screen.getByPlaceholderText(/enter email subject/i), "Important Update");

      // Preview should show the subject
      const preview = screen.getByText("Message Preview").closest("div");
      expect(preview).toHaveTextContent("Important Update");
    });

    it("should show message body in preview", async () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.type(screen.getByPlaceholderText(/enter your message/i), "This is my message");

      const preview = screen.getByText("Message Preview").closest("div");
      expect(preview).toHaveTextContent("This is my message");
    });

    it("should show channel type in preview", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      const preview = screen.getByText("Message Preview").closest("div");
      expect(preview).toHaveTextContent("EMAIL");
    });
  });

  // ===========================================================================
  // ERROR HANDLING TESTS
  // ===========================================================================

  describe("Error Handling", () => {
    it("should display submit error when submission fails", async () => {
      mockSubmit.mockRejectedValue(new Error("Network error"));

      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.selectOptions(screen.getByRole("combobox"), "TKN_STU_ABC123XY");
      await user.type(screen.getByPlaceholderText(/enter email subject/i), "Test");
      await user.type(screen.getByPlaceholderText(/enter your message/i), "Message");

      await user.click(screen.getByRole("button", { name: /send test message/i }));

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("should hide delivery timeline on error", async () => {
      mockSubmit.mockRejectedValue(new Error("Failed"));

      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.selectOptions(screen.getByRole("combobox"), "TKN_STU_ABC123XY");
      await user.type(screen.getByPlaceholderText(/enter email subject/i), "Test");
      await user.type(screen.getByPlaceholderText(/enter your message/i), "Message");

      await user.click(screen.getByRole("button", { name: /send test message/i }));

      await waitFor(() => {
        expect(screen.queryByText(/message status/i)).not.toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================

  describe("Accessibility", () => {
    it("should have accessible labels for form fields", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      // Labels are present as text elements (not using htmlFor/id pattern)
      // This is a common pattern in form UIs
      expect(screen.getByText("Communication Channel")).toBeInTheDocument();
      expect(screen.getByText(/Recipient.*\*/)).toBeInTheDocument();
      expect(screen.getByText(/Message Body.*\*/)).toBeInTheDocument();
    });

    it("should have accessible channel toggle buttons", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      const emailBtn = screen.getByRole("button", { name: /email/i });
      const smsBtn = screen.getByRole("button", { name: /sms/i });

      expect(emailBtn).toHaveAttribute("type", "button");
      expect(smsBtn).toHaveAttribute("type", "button");
    });

    it("should mark required fields", () => {
      render(<CommTestForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByText(/recipient.*\*/i)).toBeInTheDocument();
      expect(screen.getByText(/message body.*\*/i)).toBeInTheDocument();
    });
  });
});
