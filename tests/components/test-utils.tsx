/**
 * Test Utilities for React Component Testing
 *
 * Provides common utilities, mocks, and helpers for rendering tests.
 */

import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// =============================================================================
// CUSTOM RENDER WITH PROVIDERS
// =============================================================================

/**
 * Custom render function that wraps components with necessary providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { ...options }),
  };
}

// =============================================================================
// MOCK DATA
// =============================================================================

export const mockStudents = [
  {
    token: "TKN_STU_ABC123XY",
    firstName: "Maria",
    lastName: "[TOKENIZED]",
    gradeLevel: 3,
    schoolToken: "TKN_SCH_001",
    email: "TKN_STU_ABC123XY@relay.schoolday.lausd.net",
  },
  {
    token: "TKN_STU_DEF456ZZ",
    firstName: "James",
    lastName: "[TOKENIZED]",
    gradeLevel: 5,
    schoolToken: "TKN_SCH_001",
    email: "TKN_STU_DEF456ZZ@relay.schoolday.lausd.net",
  },
  {
    token: "TKN_STU_GHI789AA",
    firstName: "Sophia",
    lastName: "[TOKENIZED]",
    gradeLevel: 0, // Kindergarten
    schoolToken: "TKN_SCH_002",
    email: "TKN_STU_GHI789AA@relay.schoolday.lausd.net",
  },
];

export const mockTeachers = [
  {
    token: "TKN_TCH_001ABC",
    firstName: "Robert",
    lastName: "[TOKENIZED]",
    email: "TKN_TCH_001ABC@relay.schoolday.lausd.net",
    schoolToken: "TKN_SCH_001",
  },
];

export const mockSchools = [
  {
    token: "TKN_SCH_001",
    name: "Lincoln Elementary",
    type: "elementary",
  },
  {
    token: "TKN_SCH_002",
    name: "Washington Middle School",
    type: "middle",
  },
];

export const mockCredentials = {
  apiKey: "sk_test_abc123xyz789",
  apiSecret: "secret_xyz789abc123",
  sandboxUrl: "https://sandbox.schoolday.lausd.net/api/v1",
  onerosterBaseUrl: "https://sandbox.schoolday.lausd.net/oneroster/v1p2",
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

export const mockAuditLogs = [
  {
    id: "log_001",
    timestamp: new Date().toISOString(),
    action: "API_CALL",
    resource: "/oneroster/students",
    vendorId: "vendor_001",
    status: "success",
    details: { recordCount: 100 },
  },
  {
    id: "log_002",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    action: "SSO_LOGIN",
    resource: "saml_auth",
    vendorId: "vendor_001",
    status: "success",
    details: { provider: "SAML" },
  },
];

// =============================================================================
// MOCK HANDLERS
// =============================================================================

export const createMockSubmitHandler = () => {
  const handler = vi.fn().mockResolvedValue(undefined);
  return handler;
};

export const createMockCancelHandler = () => {
  const handler = vi.fn();
  return handler;
};

export const createMockOnMessage = () => {
  const handler = vi.fn();
  return handler;
};

// =============================================================================
// WAIT UTILITIES
// =============================================================================

export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

export const waitForAnimation = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// =============================================================================
// FORM HELPERS
// =============================================================================

export async function fillInput(
  user: ReturnType<typeof userEvent.setup>,
  element: HTMLElement,
  value: string
) {
  await user.clear(element);
  await user.type(element, value);
}

export async function selectOption(
  user: ReturnType<typeof userEvent.setup>,
  selectElement: HTMLElement,
  optionValue: string
) {
  await user.selectOptions(selectElement, optionValue);
}

// =============================================================================
// EXPORTS
// =============================================================================

export * from "@testing-library/react";
export { customRender as render };
export { userEvent };
