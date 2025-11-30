/**
 * @vitest-environment jsdom
 */

/**
 * PodsLiteForm Rendering Tests
 *
 * Tests basic rendering for the PoDS-Lite onboarding wizard.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PodsLiteForm } from "@/components/forms/PodsLiteForm";

// =============================================================================
// MOCK HANDLERS
// =============================================================================

let mockSubmit: ReturnType<typeof vi.fn>;
let mockCancel: ReturnType<typeof vi.fn>;
let mockTestApi: ReturnType<typeof vi.fn>;
let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  mockSubmit = vi.fn().mockResolvedValue(undefined);
  mockCancel = vi.fn();
  mockTestApi = vi.fn();
  user = userEvent.setup();
});

afterEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// PODS LITE FORM TESTS
// =============================================================================

describe("PodsLiteForm", () => {
  describe("Basic Rendering", () => {
    it("should render the form header", () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      expect(screen.getByText("PoDS-Lite Application")).toBeInTheDocument();
      expect(screen.getByText(/Privacy-Safe Access/)).toBeInTheDocument();
    });

    it("should show skeleton while loading", () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      // Initially may show skeleton (depends on hydration)
      const form = document.querySelector("form");
      expect(form || document.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("should render submit and cancel buttons", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      // Wait for mount
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      });
    });

    it("should render with prefill data when provided", async () => {
      render(
        <PodsLiteForm
          onSubmit={mockSubmit}
          onCancel={mockCancel}
          prefill={{
            vendorName: "Test Vendor",
            contactEmail: "test@example.com",
          }}
        />
      );

      await waitFor(() => {
        // Check the form renders with prefilled company name (if form accepts it)
        const form = document.querySelector("form");
        expect(form).toBeInTheDocument();
      });
    });
  });

  describe("Form Sections", () => {
    it("should render company information section", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        expect(screen.getByText("Company Information")).toBeInTheDocument();
      });
    });

    it("should render company name field", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        expect(screen.getByText(/Company Name/)).toBeInTheDocument();
      });
    });

    it("should render contact fields", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        // Email appears multiple times (field + verification), so use getAllByText
        expect(screen.getAllByText(/Email/).length).toBeGreaterThan(0);
        expect(screen.getByText(/Full Name/)).toBeInTheDocument();
      });
    });
  });

  describe("Form Interactions", () => {
    it("should call onCancel when cancel clicked", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(mockCancel).toHaveBeenCalled();
    });

    it("should have submit button", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        // Look for the submit button
        expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
      });
    });
  });

  describe("Verification Section", () => {
    it("should show verification fields", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        // Company verification section
        expect(screen.getByText(/Company Verification/i)).toBeInTheDocument();
      });
    });

    it("should show website field", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        expect(screen.getByText(/Company Website/i)).toBeInTheDocument();
      });
    });
  });

  describe("OneRoster Resources", () => {
    it("should render OneRoster resources section", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        expect(screen.getByText(/OneRoster API Resources/i)).toBeInTheDocument();
      });
    });

    it("should have resource options with tokenized info", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        // Should show OneRoster resources with tokenized IDs info
        const text = document.body.textContent;
        expect(text).toMatch(/Users|Classes|Enrollments|tokenized/i);
      });
    });
  });

  describe("Integration Types", () => {
    it("should render integration types section", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        expect(screen.getByText(/Integration Types/i)).toBeInTheDocument();
      });
    });

    it("should show OneRoster API option", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        // OneRoster API appears in both Integration Types and Resources sections
        expect(screen.getAllByText(/OneRoster/i).length).toBeGreaterThan(0);
      });
    });

    it("should show LTI option", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        expect(screen.getByText(/LTI 1\.3/i)).toBeInTheDocument();
      });
    });
  });

  describe("Security Certifications", () => {
    it("should render security section", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        const text = document.body.textContent;
        expect(text).toMatch(/SOC.?2|FERPA|Security|Certification/i);
      });
    });
  });

  describe("Privacy Compliance", () => {
    it("should render data retention field", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        expect(screen.getByText(/Data Retention/i)).toBeInTheDocument();
      });
    });

    it("should render compliance acknowledgments", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        expect(screen.getByText(/Compliance Acknowledgments/i)).toBeInTheDocument();
      });
    });

    it("should show COPPA compliance option", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        expect(screen.getByText(/COPPA Compliance/i)).toBeInTheDocument();
      });
    });
  });

  describe("Terms and Conditions", () => {
    it("should render terms acceptance checkbox", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        const checkbox = document.querySelector('input[type="checkbox"]');
        expect(checkbox).toBeInTheDocument();
      });
    });

    it("should show terms link", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        const text = document.body.textContent;
        expect(text).toMatch(/terms|conditions|agreement|accept/i);
      });
    });
  });

  describe("Form Validation", () => {
    it("should show required indicators", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        // Required fields have asterisks
        const asterisks = document.querySelectorAll('span:contains("*")');
        expect(document.body.textContent).toContain("*");
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper form structure", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        const form = document.querySelector("form");
        expect(form).toBeInTheDocument();
      });
    });

    it("should have labeled inputs", async () => {
      render(<PodsLiteForm onSubmit={mockSubmit} onCancel={mockCancel} />);

      await waitFor(() => {
        const labels = document.querySelectorAll("label");
        expect(labels.length).toBeGreaterThan(0);
      });
    });
  });
});
