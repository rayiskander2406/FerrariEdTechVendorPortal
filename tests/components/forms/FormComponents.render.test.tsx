/**
 * @vitest-environment jsdom
 */

/**
 * Form Components Rendering Tests
 *
 * Tests basic rendering, form submission, and cancel handling for all form components.
 * This file covers: AppSubmitForm, LtiConfigForm, SsoConfigForm, ApiTester
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AppSubmitForm } from "@/components/forms/AppSubmitForm";
import { LtiConfigForm } from "@/components/forms/LtiConfigForm";
import { SsoConfigForm } from "@/components/forms/SsoConfigForm";
import { ApiTester } from "@/components/forms/ApiTester";

// =============================================================================
// MOCK HANDLERS
// =============================================================================

let mockSubmit: ReturnType<typeof vi.fn>;
let mockCancel: ReturnType<typeof vi.fn>;
let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  mockSubmit = vi.fn().mockResolvedValue(undefined);
  mockCancel = vi.fn();
  user = userEvent.setup();
});

afterEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// APP SUBMIT FORM TESTS
// =============================================================================

describe("AppSubmitForm", () => {
  describe("Basic Rendering", () => {
    it("should render the form header", () => {
      render(<AppSubmitForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByText("Freemium App Submission")).toBeInTheDocument();
      expect(screen.getByText(/Submit your app for LAUSD/)).toBeInTheDocument();
    });

    it("should render all form fields", () => {
      render(<AppSubmitForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByText(/App Name \*/)).toBeInTheDocument();
      expect(screen.getByText(/Description \*/)).toBeInTheDocument();
      expect(screen.getByText(/Category \*/)).toBeInTheDocument();
      expect(screen.getByText(/Target Grades \*/)).toBeInTheDocument();
      expect(screen.getByText(/Subjects \*/)).toBeInTheDocument();
      expect(screen.getByText(/App URL \*/)).toBeInTheDocument();
    });

    it("should render category options", () => {
      render(<AppSubmitForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByText("Learning")).toBeInTheDocument();
      expect(screen.getByText("Assessment")).toBeInTheDocument();
      expect(screen.getByText("Collaboration")).toBeInTheDocument();
      expect(screen.getByText("Productivity")).toBeInTheDocument();
    });

    it("should render submit and cancel buttons", () => {
      render(<AppSubmitForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByRole("button", { name: /submit application/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("should have submit disabled initially", () => {
      render(<AppSubmitForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByRole("button", { name: /submit application/i })).toBeDisabled();
    });
  });

  describe("Form Interactions", () => {
    it("should call onCancel when cancel clicked", async () => {
      render(<AppSubmitForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(mockCancel).toHaveBeenCalled();
    });

    it("should toggle grade selection", async () => {
      render(<AppSubmitForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      const kLabel = screen.getByText("K");
      await user.click(kLabel);

      // Should be selected (has cyan color)
      expect(kLabel.closest("label")).toHaveClass("border-cyan-500");
    });

    it("should select all grades when Select all clicked", async () => {
      render(<AppSubmitForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.click(screen.getByText("Select all"));

      // Button should change to "Clear all"
      expect(screen.getByText("Clear all")).toBeInTheDocument();
    });
  });
});

// =============================================================================
// LTI CONFIG FORM TESTS
// =============================================================================

describe("LtiConfigForm", () => {
  describe("Basic Rendering", () => {
    it("should render the form header", () => {
      render(<LtiConfigForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByText("LTI 1.3 Configuration")).toBeInTheDocument();
      expect(screen.getByText(/Connect your tool to Schoology/)).toBeInTheDocument();
    });

    it("should render platform credentials section", () => {
      render(<LtiConfigForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByText("LAUSD Platform Credentials")).toBeInTheDocument();
      expect(screen.getByText("ISSUER")).toBeInTheDocument();
      expect(screen.getByText("AUTHORIZATION_ENDPOINT")).toBeInTheDocument();
      expect(screen.getByText("TOKEN_ENDPOINT")).toBeInTheDocument();
      expect(screen.getByText("PLATFORM_JWKS_URI")).toBeInTheDocument();
    });

    it("should render tool configuration fields", () => {
      render(<LtiConfigForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByText("Your Tool Configuration")).toBeInTheDocument();
      expect(screen.getByText(/Client ID \*/)).toBeInTheDocument();
      expect(screen.getByText(/Deployment ID \*/)).toBeInTheDocument();
      expect(screen.getByText(/Tool Launch URL \*/)).toBeInTheDocument();
      expect(screen.getByText(/Tool JWKS URL \*/)).toBeInTheDocument();
    });

    it("should render LTI features", () => {
      render(<LtiConfigForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByText("Available LTI Features")).toBeInTheDocument();
      expect(screen.getByText("Deep Linking")).toBeInTheDocument();
      expect(screen.getByText("Assignment & Grades")).toBeInTheDocument();
    });

    it("should render submit and cancel buttons", () => {
      render(<LtiConfigForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByRole("button", { name: /save lti configuration/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("should have submit disabled initially", () => {
      render(<LtiConfigForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByRole("button", { name: /save lti configuration/i })).toBeDisabled();
    });
  });

  describe("Form Interactions", () => {
    it("should call onCancel when cancel clicked", async () => {
      render(<LtiConfigForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(mockCancel).toHaveBeenCalled();
    });

    it("should show configuration preview", () => {
      render(<LtiConfigForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByText("Configuration Preview")).toBeInTheDocument();
      // Preview should contain JSON structure
      expect(screen.getByText(/"platform":/)).toBeInTheDocument();
    });
  });
});

// =============================================================================
// SSO CONFIG FORM TESTS
// =============================================================================

describe("SsoConfigForm", () => {
  describe("Basic Rendering", () => {
    it("should render the form header", () => {
      render(<SsoConfigForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByText("SSO Configuration")).toBeInTheDocument();
    });

    it("should render provider options", () => {
      render(<SsoConfigForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      // Provider options from lib/config/sso.ts
      expect(screen.getByText("Clever")).toBeInTheDocument();
      expect(screen.getByText("ClassLink")).toBeInTheDocument();
      expect(screen.getByText("Google Workspace")).toBeInTheDocument();
    });

    it("should render submit and cancel buttons", () => {
      render(<SsoConfigForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByRole("button", { name: /save.*configuration/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("should have submit disabled initially", () => {
      render(<SsoConfigForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      const submitButton = screen.getByRole("button", { name: /save.*configuration/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Form Interactions", () => {
    it("should call onCancel when cancel clicked", async () => {
      render(<SsoConfigForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(mockCancel).toHaveBeenCalled();
    });

    it("should switch provider tabs", async () => {
      render(<SsoConfigForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      // Click on Clever tab
      await user.click(screen.getByText("Clever"));

      // Scopes should be visible
      expect(screen.getByText(/Scopes/)).toBeInTheDocument();
    });
  });
});

// =============================================================================
// API TESTER TESTS
// =============================================================================

describe("ApiTester", () => {
  describe("Basic Rendering", () => {
    it("should render the form header", () => {
      render(<ApiTester onClose={mockCancel} />);

      expect(screen.getByText("OneRoster API Tester")).toBeInTheDocument();
    });

    it("should render endpoint dropdown", () => {
      render(<ApiTester onClose={mockCancel} />);

      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("should render execute button", () => {
      render(<ApiTester onClose={mockCancel} />);

      expect(screen.getByRole("button", { name: /execute/i })).toBeInTheDocument();
    });

    it("should render endpoint tabs", () => {
      render(<ApiTester onClose={mockCancel} />);

      // Should have endpoint tab buttons from ONEROSTER_ENDPOINT_METADATA
      expect(screen.getByText("Users")).toBeInTheDocument();
      expect(screen.getByText("Classes")).toBeInTheDocument();
    });
  });

  describe("Form Interactions", () => {
    it("should have clickable endpoint tabs", async () => {
      render(<ApiTester onClose={mockCancel} />);

      // Click on Classes tab
      await user.click(screen.getByText("Classes"));

      // Classes should now be selected (has emerald styling)
      expect(screen.getByText("Classes").closest("button")).toHaveClass("border-emerald-500");
    });

    it("should allow limit selection", () => {
      render(<ApiTester onClose={mockCancel} />);

      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
    });
  });
});
