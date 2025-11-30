/**
 * SchemaFormSection Tests
 *
 * Tests for the schema-driven form section renderer.
 * Verifies that sections render correctly from generated config.
 *
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SchemaFormSection } from "@/components/forms/SchemaFormSection";
import { PodsLiteSchema, generateFormConfig } from "@/lib/schemas";
import type { FormSectionConfig } from "@/lib/schemas";

// =============================================================================
// TEST FIXTURES
// =============================================================================

const mockFormData: Record<string, unknown> = {
  vendorName: "Test Company",
  applicationName: "Test App",
  applicationDescription: "A test application",
  contactName: "John Doe",
  contactEmail: "john@test.com",
};

const mockErrors: Record<string, string> = {};

// =============================================================================
// COMPANY SECTION TESTS
// =============================================================================

describe("SchemaFormSection - Company Section", () => {
  const formConfig = generateFormConfig(PodsLiteSchema);
  const companySection = formConfig.sections.find((s) => s.id === "company")!;

  it("should render section title", () => {
    render(
      <SchemaFormSection
        section={companySection}
        formData={mockFormData}
        errors={mockErrors}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText("Company Information")).toBeInTheDocument();
  });

  it("should render all company fields", () => {
    render(
      <SchemaFormSection
        section={companySection}
        formData={mockFormData}
        errors={mockErrors}
        onChange={vi.fn()}
      />
    );

    // Check for field labels
    expect(screen.getByText(/Company Name/)).toBeInTheDocument();
    expect(screen.getByText(/Product Name/)).toBeInTheDocument();
    expect(screen.getByText(/Product Description/)).toBeInTheDocument();
  });

  it("should display form values", () => {
    render(
      <SchemaFormSection
        section={companySection}
        formData={mockFormData}
        errors={mockErrors}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue("Test Company")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test App")).toBeInTheDocument();
  });

  it("should call onChange when input changes", () => {
    const onChange = vi.fn();
    render(
      <SchemaFormSection
        section={companySection}
        formData={mockFormData}
        errors={mockErrors}
        onChange={onChange}
      />
    );

    const input = screen.getByDisplayValue("Test Company");
    fireEvent.change(input, { target: { value: "New Company" } });

    expect(onChange).toHaveBeenCalledWith("vendorName", "New Company");
  });

  it("should display validation errors", () => {
    const errorsWithVendor = { vendorName: "Company name is required" };

    render(
      <SchemaFormSection
        section={companySection}
        formData={{ ...mockFormData, vendorName: "" }}
        errors={errorsWithVendor}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText("Company name is required")).toBeInTheDocument();
  });

  it("should mark required fields with asterisk", () => {
    render(
      <SchemaFormSection
        section={companySection}
        formData={mockFormData}
        errors={mockErrors}
        onChange={vi.fn()}
      />
    );

    // Required fields should have asterisk
    expect(screen.getByText(/Company Name \*/)).toBeInTheDocument();
    expect(screen.getByText(/Product Name \*/)).toBeInTheDocument();
  });
});

// =============================================================================
// CONTACT SECTION TESTS
// =============================================================================

describe("SchemaFormSection - Contact Section", () => {
  const formConfig = generateFormConfig(PodsLiteSchema);
  const contactSection = formConfig.sections.find((s) => s.id === "contact")!;

  it("should render email field with email type", () => {
    render(
      <SchemaFormSection
        section={contactSection}
        formData={mockFormData}
        errors={mockErrors}
        onChange={vi.fn()}
      />
    );

    const emailInput = screen.getByDisplayValue("john@test.com");
    expect(emailInput).toHaveAttribute("type", "email");
  });
});

// =============================================================================
// INTEGRATION SECTION TESTS
// =============================================================================

describe("SchemaFormSection - Integration Section", () => {
  const formConfig = generateFormConfig(PodsLiteSchema);
  const integrationSection = formConfig.sections.find((s) => s.id === "integration")!;

  it("should render select field for integrationMethod", () => {
    render(
      <SchemaFormSection
        section={integrationSection}
        formData={{ integrationMethod: "ONEROSTER_API" }}
        errors={mockErrors}
        onChange={vi.fn()}
      />
    );

    // Should have select with options
    expect(screen.getByText(/Integration Method/)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should render multiselect for dataElementsRequested", () => {
    render(
      <SchemaFormSection
        section={integrationSection}
        formData={{ dataElementsRequested: ["STUDENT_ID"] }}
        errors={mockErrors}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText(/Data Elements Requested/)).toBeInTheDocument();
  });

  it("should show conditional field when condition is met", () => {
    render(
      <SchemaFormSection
        section={integrationSection}
        formData={{ thirdPartySharing: true }}
        errors={mockErrors}
        onChange={vi.fn()}
      />
    );

    // thirdPartyDetails should be visible when thirdPartySharing is true
    expect(screen.getByText(/Third Party Details/)).toBeInTheDocument();
  });

  it("should hide conditional field when condition is not met", () => {
    render(
      <SchemaFormSection
        section={integrationSection}
        formData={{ thirdPartySharing: false }}
        errors={mockErrors}
        onChange={vi.fn()}
      />
    );

    // thirdPartyDetails should NOT be visible when thirdPartySharing is false
    expect(screen.queryByText(/Third Party Details/)).not.toBeInTheDocument();
  });
});

// =============================================================================
// COMPLIANCE SECTION TESTS
// =============================================================================

describe("SchemaFormSection - Compliance Section", () => {
  const formConfig = generateFormConfig(PodsLiteSchema);
  const complianceSection = formConfig.sections.find((s) => s.id === "compliance")!;

  it("should render checkbox fields", () => {
    render(
      <SchemaFormSection
        section={complianceSection}
        formData={{ coppaCompliant: true, acceptsTerms: false }}
        errors={mockErrors}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText(/COPPA Compliance/)).toBeInTheDocument();
    expect(screen.getByText(/Terms & Conditions/)).toBeInTheDocument();
  });

  it("should toggle checkbox on click", () => {
    const onChange = vi.fn();
    render(
      <SchemaFormSection
        section={complianceSection}
        formData={{ coppaCompliant: false }}
        errors={mockErrors}
        onChange={onChange}
      />
    );

    const checkbox = screen.getByRole("checkbox", { name: /COPPA Compliance/ });
    fireEvent.click(checkbox);

    expect(onChange).toHaveBeenCalledWith("coppaCompliant", true);
  });
});

// =============================================================================
// DISABLED STATE TESTS
// =============================================================================

describe("SchemaFormSection - Disabled State", () => {
  const formConfig = generateFormConfig(PodsLiteSchema);
  const companySection = formConfig.sections.find((s) => s.id === "company")!;

  it("should disable all inputs when disabled prop is true", () => {
    render(
      <SchemaFormSection
        section={companySection}
        formData={mockFormData}
        errors={mockErrors}
        onChange={vi.fn()}
        disabled={true}
      />
    );

    const inputs = screen.getAllByRole("textbox");
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });
});

// =============================================================================
// ALL SECTIONS RENDER TEST
// =============================================================================

describe("SchemaFormSection - All Sections", () => {
  const formConfig = generateFormConfig(PodsLiteSchema);

  it("should render all 8 sections without errors", () => {
    const fullFormData: Record<string, unknown> = {
      vendorName: "Test",
      applicationName: "Test",
      applicationDescription: "Test",
      contactName: "Test",
      contactEmail: "test@test.com",
      contactPhone: "555-1234",
      websiteUrl: "https://test.com",
      street: "123 Main St",
      city: "LA",
      state: "CA",
      zipCode: "90001",
      integrationMethod: "ONEROSTER_API",
      dataElementsRequested: ["STUDENT_ID"],
      thirdPartySharing: false,
      dataPurpose: "Testing",
      dataRetentionDays: 30,
      breachNotificationHours: 24,
      coppaCompliant: true,
      acceptsTerms: true,
      acceptsDataDeletion: true,
    };

    // Render each section and verify no errors
    for (const section of formConfig.sections) {
      const { container } = render(
        <SchemaFormSection
          section={section}
          formData={fullFormData}
          errors={{}}
          onChange={vi.fn()}
        />
      );

      // Section should have rendered content
      expect(container.querySelector(".bg-white")).toBeInTheDocument();
    }
  });

  it("all sections should have correct titles", () => {
    const expectedTitles = [
      "Company Information",
      "Primary Contact",
      "Company Verification",
      "Business Address",
      "Integration Types",
      "Data Usage",
      "Security & Compliance",
      "Compliance Acknowledgments",
    ];

    formConfig.sections.forEach((section, index) => {
      expect(section.title).toBe(expectedTitles[index]);
    });
  });
});
