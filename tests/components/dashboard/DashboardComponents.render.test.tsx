/**
 * @vitest-environment jsdom
 */

/**
 * Dashboard Components Rendering Tests
 *
 * Tests basic rendering and interactions for all dashboard components.
 * This file covers: CredentialsDisplay, AuditLogViewer, FeatureFlagsDashboard
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CredentialsDisplay } from "@/components/dashboard/CredentialsDisplay";
import { AuditLogViewer } from "@/components/dashboard/AuditLogViewer";
import type { SandboxCredentials, AuditLog } from "@/lib/types";

// =============================================================================
// MOCK FEATURE FLAGS (for FeatureFlagsDashboard)
// =============================================================================

// Mock the useFeatureFlags hook
const mockToggle = vi.fn();
const mockEnableAll = vi.fn();
const mockDisableAll = vi.fn();
const mockReset = vi.fn();
const mockExportConfig = vi.fn(() => '{"features":{}}');
const mockImportConfig = vi.fn(() => true);
const mockGetFeaturesByRank = vi.fn(() => [
  {
    id: "ai-health-monitor",
    name: "AI Health Monitor",
    description: "Real-time monitoring of AI system health",
    longDescription: "Full description here",
    valueProposition: "Value here",
    category: "monitoring" as const,
    status: "stable" as const,
    icon: "Activity",
    rank: 1,
    enabled: true,
  },
  {
    id: "compliance-pipeline",
    name: "Compliance Pipeline",
    description: "Automated compliance checking",
    longDescription: "Full description here",
    valueProposition: "Value here",
    category: "compliance" as const,
    status: "beta" as const,
    icon: "ShieldCheck",
    rank: 2,
    enabled: false,
  },
]);
const mockIsEnabled = vi.fn((id: string) => id === "ai-health-monitor");

vi.mock("@/lib/features", () => ({
  useFeatureFlags: () => ({
    isLoaded: true,
    toggle: mockToggle,
    enableAll: mockEnableAll,
    disableAll: mockDisableAll,
    reset: mockReset,
    exportConfig: mockExportConfig,
    importConfig: mockImportConfig,
    getFeaturesByRank: mockGetFeaturesByRank,
    isEnabled: mockIsEnabled,
  }),
}));

// Import after mock
import { FeatureFlagsDashboard } from "@/components/dashboard/FeatureFlagsDashboard";

// =============================================================================
// TEST UTILITIES
// =============================================================================

function createMockCredentials(overrides: Partial<SandboxCredentials> = {}): SandboxCredentials {
  return {
    id: "cred-123-456-789",
    vendorId: "vendor-abc-def",
    apiKey: "sbox_test_abc123def456",
    apiSecret: "secret_xyz789abc123def456ghi789",
    baseUrl: "https://sandbox.schoolday.lausd.net/api/v1",
    environment: "sandbox",
    status: "ACTIVE",
    expiresAt: new Date("2025-06-15T00:00:00"),
    createdAt: new Date("2024-12-01T00:00:00"),
    lastUsedAt: new Date("2024-12-15T10:30:00"),
    rateLimitPerMinute: 60,
    allowedEndpoints: ["/students", "/teachers", "/classes", "/schools"],
    ...overrides,
  };
}

function createMockAuditLog(overrides: Partial<AuditLog> = {}): AuditLog {
  return {
    id: "log-1",
    vendorId: "vendor-abc",
    action: "api.request",
    resourceType: "students",
    resourceId: "TKN_STU_ABC123",
    details: { method: "GET", path: "/students" },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0",
    timestamp: new Date(),
    ...overrides,
  };
}

// =============================================================================
// CREDENTIALS DISPLAY TESTS
// =============================================================================

describe("CredentialsDisplay", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    // Mock clipboard properly using stubGlobal
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe("Basic Rendering", () => {
    it("should render the header", async () => {
      const credentials = createMockCredentials();

      render(<CredentialsDisplay credentials={credentials} />);

      // Wait for component to mount (skeleton replaced)
      await waitFor(() => {
        expect(screen.getByText("Sandbox Credentials")).toBeInTheDocument();
      });
    });

    it("should render credential labels", async () => {
      const credentials = createMockCredentials();

      render(<CredentialsDisplay credentials={credentials} />);

      await waitFor(() => {
        expect(screen.getByText("API_KEY")).toBeInTheDocument();
        expect(screen.getByText("API_SECRET")).toBeInTheDocument();
        expect(screen.getByText("CLIENT_ID")).toBeInTheDocument();
        expect(screen.getByText("CLIENT_SECRET")).toBeInTheDocument();
        expect(screen.getByText("BASE_URL")).toBeInTheDocument();
      });
    });

    it("should render status badge", async () => {
      const credentials = createMockCredentials({ status: "ACTIVE" });

      render(<CredentialsDisplay credentials={credentials} />);

      await waitFor(() => {
        expect(screen.getByText("ACTIVE")).toBeInTheDocument();
      });
    });

    it("should render rate limit info", async () => {
      const credentials = createMockCredentials({ rateLimitPerMinute: 60 });

      render(<CredentialsDisplay credentials={credentials} />);

      await waitFor(() => {
        expect(screen.getByText("60 calls/min")).toBeInTheDocument();
      });
    });

    it("should render allowed endpoints", async () => {
      const credentials = createMockCredentials({
        allowedEndpoints: ["/students", "/teachers"],
      });

      render(<CredentialsDisplay credentials={credentials} />);

      await waitFor(() => {
        expect(screen.getByText("Allowed Endpoints")).toBeInTheDocument();
        expect(screen.getByText("/students")).toBeInTheDocument();
        expect(screen.getByText("/teachers")).toBeInTheDocument();
      });
    });
  });

  describe("Masked Values", () => {
    it("should mask sensitive values by default", async () => {
      const credentials = createMockCredentials();

      render(<CredentialsDisplay credentials={credentials} />);

      await waitFor(() => {
        // API key should be masked (showing dots)
        const apiKeyRow = screen.getByText("API_KEY").closest("div")?.parentElement;
        expect(apiKeyRow?.textContent).toContain("•");
      });
    });

    it("should show base URL unmasked", async () => {
      const credentials = createMockCredentials();

      render(<CredentialsDisplay credentials={credentials} />);

      await waitFor(() => {
        expect(screen.getByText("https://sandbox.schoolday.lausd.net/api/v1")).toBeInTheDocument();
      });
    });
  });

  describe("API Explorer", () => {
    it("should render API Explorer toggle", async () => {
      const credentials = createMockCredentials();

      render(<CredentialsDisplay credentials={credentials} />);

      await waitFor(() => {
        expect(screen.getByText("API Explorer - Try It Now")).toBeInTheDocument();
      });
    });

    it("should expand API Explorer on click", async () => {
      const credentials = createMockCredentials();

      render(<CredentialsDisplay credentials={credentials} />);

      await waitFor(() => {
        expect(screen.getByText("API Explorer - Try It Now")).toBeInTheDocument();
      });

      await user.click(screen.getByText("API Explorer - Try It Now"));

      // Should show endpoint buttons (may have multiple instances due to selected state)
      await waitFor(() => {
        const studentsElements = screen.getAllByText("Students");
        expect(studentsElements.length).toBeGreaterThan(0);
        expect(screen.getByText("Teachers")).toBeInTheDocument();
        expect(screen.getByText("Classes")).toBeInTheDocument();
        expect(screen.getByText("Schools")).toBeInTheDocument();
      });
    });

    it("should show execute button in expanded API Explorer", async () => {
      const credentials = createMockCredentials();

      render(<CredentialsDisplay credentials={credentials} />);

      await waitFor(() => {
        expect(screen.getByText("API Explorer - Try It Now")).toBeInTheDocument();
      });

      await user.click(screen.getByText("API Explorer - Try It Now"));

      await waitFor(() => {
        expect(screen.getByText("Execute")).toBeInTheDocument();
      });
    });

    it("should show cURL command section", async () => {
      const credentials = createMockCredentials();

      render(<CredentialsDisplay credentials={credentials} />);

      await waitFor(() => {
        expect(screen.getByText("API Explorer - Try It Now")).toBeInTheDocument();
      });

      await user.click(screen.getByText("API Explorer - Try It Now"));

      await waitFor(() => {
        expect(screen.getByText("cURL command (for Postman)")).toBeInTheDocument();
      });
    });
  });

  describe("Expiration Status", () => {
    it("should show normal expiration for future dates", async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);

      const credentials = createMockCredentials({ expiresAt: futureDate });

      render(<CredentialsDisplay credentials={credentials} />);

      await waitFor(() => {
        expect(screen.getByText(/Expires/)).toBeInTheDocument();
      });
    });
  });
});

// =============================================================================
// AUDIT LOG VIEWER TESTS
// =============================================================================

describe("AuditLogViewer", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    // Mock URL APIs for export functions
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe("Basic Rendering", () => {
    it("should render the header", () => {
      render(<AuditLogViewer logs={[]} />);

      expect(screen.getByText("Audit Log")).toBeInTheDocument();
    });

    it("should render event count badge", () => {
      const logs = [
        createMockAuditLog({ id: "1" }),
        createMockAuditLog({ id: "2" }),
        createMockAuditLog({ id: "3" }),
      ];

      render(<AuditLogViewer logs={logs} />);

      expect(screen.getByText("3 events")).toBeInTheDocument();
    });

    it("should render export buttons", () => {
      render(<AuditLogViewer logs={[]} />);

      expect(screen.getByText("CSV")).toBeInTheDocument();
      expect(screen.getByText("JSON")).toBeInTheDocument();
    });

    it("should show empty state when no logs", () => {
      render(<AuditLogViewer logs={[]} />);

      expect(screen.getByText("No audit events yet")).toBeInTheDocument();
    });
  });

  describe("Log Entry Rendering", () => {
    it("should render log action badges", () => {
      const logs = [createMockAuditLog({ action: "api.request" })];

      render(<AuditLogViewer logs={logs} />);

      expect(screen.getByText("api.request")).toBeInTheDocument();
    });

    it("should render resource type", () => {
      const logs = [createMockAuditLog({ resourceType: "students" })];

      render(<AuditLogViewer logs={logs} />);

      expect(screen.getByText("students")).toBeInTheDocument();
    });

    it("should render resource ID", () => {
      const logs = [createMockAuditLog({ resourceId: "TKN_STU_ABC123" })];

      render(<AuditLogViewer logs={logs} />);

      expect(screen.getByText("TKN_STU_ABC123")).toBeInTheDocument();
    });

    it("should render different action types with appropriate styling", () => {
      const logs = [
        createMockAuditLog({ id: "1", action: "auth.login" }),
        createMockAuditLog({ id: "2", action: "credentials.created" }),
        createMockAuditLog({ id: "3", action: "api.error" }),
      ];

      render(<AuditLogViewer logs={logs} />);

      expect(screen.getByText("auth.login")).toBeInTheDocument();
      expect(screen.getByText("credentials.created")).toBeInTheDocument();
      expect(screen.getByText("api.error")).toBeInTheDocument();
    });
  });

  describe("Timestamp Formatting", () => {
    it("should show 'Just now' for very recent logs", () => {
      const logs = [createMockAuditLog({ timestamp: new Date() })];

      render(<AuditLogViewer logs={logs} />);

      expect(screen.getByText("Just now")).toBeInTheDocument();
    });

    it("should show minutes ago for recent logs", () => {
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

      const logs = [createMockAuditLog({ timestamp: fiveMinutesAgo })];

      render(<AuditLogViewer logs={logs} />);

      expect(screen.getByText("5m ago")).toBeInTheDocument();
    });

    it("should show hours ago for older logs", () => {
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      const logs = [createMockAuditLog({ timestamp: twoHoursAgo })];

      render(<AuditLogViewer logs={logs} />);

      expect(screen.getByText("2h ago")).toBeInTheDocument();
    });
  });

  describe("Log Details Expansion", () => {
    it("should expand log details on click", async () => {
      const logs = [
        createMockAuditLog({
          details: { method: "GET", path: "/students", limit: 10 },
        }),
      ];

      render(<AuditLogViewer logs={logs} />);

      // Click on the log row
      const logRow = screen.getByText("api.request").closest("div[class*='hover:bg-gray-50']");
      if (logRow) {
        await user.click(logRow);
      }

      // Details should be visible (JSON formatted)
      await waitFor(() => {
        expect(screen.getByText(/"method":/)).toBeInTheDocument();
      });
    });

    it("should show IP address in expanded details", async () => {
      const logs = [
        createMockAuditLog({
          details: { test: true },
          ipAddress: "192.168.1.100",
        }),
      ];

      render(<AuditLogViewer logs={logs} />);

      // Click on the log row
      const logRow = screen.getByText("api.request").closest("div[class*='hover:bg-gray-50']");
      if (logRow) {
        await user.click(logRow);
      }

      await waitFor(() => {
        expect(screen.getByText("IP: 192.168.1.100")).toBeInTheDocument();
      });
    });
  });

  describe("Sorting", () => {
    it("should sort logs by timestamp (newest first)", () => {
      const olderLog = createMockAuditLog({
        id: "old",
        action: "auth.login",
        timestamp: new Date("2024-01-01"),
      });
      const newerLog = createMockAuditLog({
        id: "new",
        action: "api.request",
        timestamp: new Date("2024-12-01"),
      });

      render(<AuditLogViewer logs={[olderLog, newerLog]} />);

      // Get all action badges
      const actions = screen.getAllByText(/auth\.|api\./);

      // Newer should come first
      expect(actions[0].textContent).toBe("api.request");
      expect(actions[1].textContent).toBe("auth.login");
    });
  });
});

// =============================================================================
// FEATURE FLAGS DASHBOARD TESTS
// =============================================================================

describe("FeatureFlagsDashboard", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    // Mock clipboard properly using stubGlobal
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe("Basic Rendering", () => {
    it("should render the dashboard header", () => {
      render(<FeatureFlagsDashboard />);

      expect(screen.getByText("Feature Flags Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Toggle moonshot features for demo or production")).toBeInTheDocument();
    });

    it("should render stats section", () => {
      render(<FeatureFlagsDashboard />);

      expect(screen.getByText("Total Features")).toBeInTheDocument();
      expect(screen.getByText("Enabled")).toBeInTheDocument();
      expect(screen.getByText("Disabled")).toBeInTheDocument();
    });

    it("should render bulk action buttons", () => {
      render(<FeatureFlagsDashboard />);

      expect(screen.getByText("Enable All")).toBeInTheDocument();
      expect(screen.getByText("Disable All")).toBeInTheDocument();
      expect(screen.getByText("Reset")).toBeInTheDocument();
    });

    it("should render import/export buttons", () => {
      render(<FeatureFlagsDashboard />);

      expect(screen.getByText("Export")).toBeInTheDocument();
      expect(screen.getByText("Import")).toBeInTheDocument();
    });

    it("should render sort controls", () => {
      render(<FeatureFlagsDashboard />);

      expect(screen.getByText("Sort by:")).toBeInTheDocument();
      expect(screen.getByText("rank")).toBeInTheDocument();
      expect(screen.getByText("category")).toBeInTheDocument();
      expect(screen.getByText("status")).toBeInTheDocument();
    });
  });

  describe("Feature Cards", () => {
    it("should render feature cards from mock data", () => {
      render(<FeatureFlagsDashboard />);

      expect(screen.getByText("AI Health Monitor")).toBeInTheDocument();
      expect(screen.getByText("Compliance Pipeline")).toBeInTheDocument();
    });

    it("should render feature descriptions", () => {
      render(<FeatureFlagsDashboard />);

      expect(screen.getByText("Real-time monitoring of AI system health")).toBeInTheDocument();
      expect(screen.getByText("Automated compliance checking")).toBeInTheDocument();
    });

    it("should render category badges", () => {
      render(<FeatureFlagsDashboard />);

      expect(screen.getByText("Monitoring")).toBeInTheDocument();
      expect(screen.getByText("Compliance")).toBeInTheDocument();
    });

    it("should render status badges", () => {
      render(<FeatureFlagsDashboard />);

      expect(screen.getByText("Stable")).toBeInTheDocument();
      expect(screen.getByText("Beta")).toBeInTheDocument();
    });

    it("should render rank numbers", () => {
      render(<FeatureFlagsDashboard />);

      expect(screen.getByText("#1")).toBeInTheDocument();
      expect(screen.getByText("#2")).toBeInTheDocument();
    });
  });

  describe("Bulk Actions", () => {
    it("should call enableAll when Enable All clicked", async () => {
      render(<FeatureFlagsDashboard />);

      await user.click(screen.getByText("Enable All"));

      expect(mockEnableAll).toHaveBeenCalled();
    });

    it("should call disableAll when Disable All clicked", async () => {
      render(<FeatureFlagsDashboard />);

      await user.click(screen.getByText("Disable All"));

      expect(mockDisableAll).toHaveBeenCalled();
    });

    it("should call reset when Reset clicked", async () => {
      render(<FeatureFlagsDashboard />);

      await user.click(screen.getByText("Reset"));

      expect(mockReset).toHaveBeenCalled();
    });
  });

  describe("Feature Card Interactions", () => {
    it("should show 'More details' button", () => {
      render(<FeatureFlagsDashboard />);

      const moreDetailsButtons = screen.getAllByText("More details");
      expect(moreDetailsButtons.length).toBeGreaterThan(0);
    });

    it("should expand feature details on More details click", async () => {
      render(<FeatureFlagsDashboard />);

      const moreDetailsButtons = screen.getAllByText("More details");
      await user.click(moreDetailsButtons[0]);

      // Should show expanded content
      await waitFor(() => {
        expect(screen.getByText("Full Description")).toBeInTheDocument();
        expect(screen.getByText("Value Proposition")).toBeInTheDocument();
      });
    });
  });

  describe("Import Modal", () => {
    it("should show import modal when Import clicked", async () => {
      render(<FeatureFlagsDashboard />);

      await user.click(screen.getByText("Import"));

      await waitFor(() => {
        expect(screen.getByText("Import Configuration")).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/features/)).toBeInTheDocument();
      });
    });

    it("should close import modal when Cancel clicked", async () => {
      render(<FeatureFlagsDashboard />);

      await user.click(screen.getByText("Import"));

      await waitFor(() => {
        expect(screen.getByText("Import Configuration")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Cancel"));

      await waitFor(() => {
        expect(screen.queryByText("Import Configuration")).not.toBeInTheDocument();
      });
    });
  });

  describe("CLI Instructions", () => {
    it("should render CLI commands section", () => {
      render(<FeatureFlagsDashboard />);

      expect(screen.getByText("Claude Code CLI Commands")).toBeInTheDocument();
      expect(screen.getByText("/features list")).toBeInTheDocument();
      // There are multiple enable/disable commands, use getAllByText
      const enableCommands = screen.getAllByText(/\/features enable/);
      expect(enableCommands.length).toBeGreaterThan(0);
      const disableCommands = screen.getAllByText(/\/features disable/);
      expect(disableCommands.length).toBeGreaterThan(0);
    });
  });
});
