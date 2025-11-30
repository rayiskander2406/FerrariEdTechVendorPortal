/**
 * @vitest-environment jsdom
 */

/**
 * Demo Components Rendering Tests
 *
 * Tests basic rendering for demo mode components.
 * This file covers: DemoOverlay
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock useDemo hook and DEMO_WORKFLOWS
const mockSelectWorkflow = vi.fn();
const mockNextStep = vi.fn();
const mockPrevStep = vi.fn();
const mockStopDemo = vi.fn();

const mockUseDemo = vi.fn();

vi.mock("@/lib/demo", () => ({
  useDemo: () => mockUseDemo(),
  DEMO_WORKFLOWS: [
    {
      id: "workflow-1",
      name: "Complete Onboarding",
      description: "Full vendor onboarding workflow",
      estimatedDuration: "15-20 min",
      steps: [
        {
          id: "step-1",
          type: "message",
          title: "Welcome",
          description: "Get started",
          instruction: "Type your first message",
          message: "Hello, I need to onboard",
        },
        {
          id: "step-2",
          type: "form",
          title: "Fill Form",
          description: "Complete the form",
          instruction: "Fill out all fields",
          expectedOutcome: "Form submitted successfully",
          hint: "All fields are required",
        },
      ],
    },
    {
      id: "workflow-2",
      name: "API Testing",
      description: "Test API endpoints",
      estimatedDuration: "5-10 min",
      steps: [
        {
          id: "step-1",
          type: "action",
          title: "Test API",
          description: "Make API calls",
          instruction: "Click Execute",
        },
      ],
    },
  ],
}));

import { DemoOverlay } from "@/components/demo/DemoOverlay";

// =============================================================================
// DEMO OVERLAY TESTS
// =============================================================================

describe("DemoOverlay", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockSelectWorkflow.mockReset();
    mockNextStep.mockReset();
    mockPrevStep.mockReset();
    mockStopDemo.mockReset();
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

  describe("When not in demo mode", () => {
    beforeEach(() => {
      mockUseDemo.mockReturnValue({
        state: { status: "idle" },
        selectWorkflow: mockSelectWorkflow,
        nextStep: mockNextStep,
        prevStep: mockPrevStep,
        stopDemo: mockStopDemo,
        isDemoMode: false,
        canGoNext: false,
        canGoPrev: false,
        progress: 0,
      });
    });

    it("should not render anything", () => {
      const { container } = render(<DemoOverlay />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("When selecting workflow", () => {
    beforeEach(() => {
      mockUseDemo.mockReturnValue({
        state: { status: "selecting" },
        selectWorkflow: mockSelectWorkflow,
        nextStep: mockNextStep,
        prevStep: mockPrevStep,
        stopDemo: mockStopDemo,
        isDemoMode: true,
        canGoNext: false,
        canGoPrev: false,
        progress: 0,
      });
    });

    it("should render workflow selection modal", () => {
      render(<DemoOverlay />);

      expect(screen.getByText("Guided Demo Mode")).toBeInTheDocument();
    });

    it("should show workflow options", () => {
      render(<DemoOverlay />);

      expect(screen.getByText("Complete Onboarding")).toBeInTheDocument();
      expect(screen.getByText("API Testing")).toBeInTheDocument();
    });

    it("should show workflow descriptions", () => {
      render(<DemoOverlay />);

      expect(screen.getByText("Full vendor onboarding workflow")).toBeInTheDocument();
      expect(screen.getByText("Test API endpoints")).toBeInTheDocument();
    });

    it("should show step counts", () => {
      render(<DemoOverlay />);

      expect(screen.getByText("2 steps")).toBeInTheDocument();
      expect(screen.getByText("1 steps")).toBeInTheDocument();
    });

    it("should show estimated durations", () => {
      render(<DemoOverlay />);

      expect(screen.getByText("15-20 min")).toBeInTheDocument();
      expect(screen.getByText("5-10 min")).toBeInTheDocument();
    });

    it("should call selectWorkflow when option clicked", async () => {
      render(<DemoOverlay />);

      await user.click(screen.getByText("Complete Onboarding"));

      expect(mockSelectWorkflow).toHaveBeenCalledWith("Complete Onboarding");
    });

    it("should show cancel button", () => {
      render(<DemoOverlay />);

      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should call stopDemo when cancel clicked", async () => {
      render(<DemoOverlay />);

      await user.click(screen.getByText("Cancel"));

      expect(mockStopDemo).toHaveBeenCalled();
    });
  });

  describe("When demo is active", () => {
    const mockWorkflow = {
      id: "workflow-1",
      name: "Complete Onboarding",
      description: "Full vendor onboarding workflow",
      steps: [
        {
          id: "step-1",
          type: "message" as const,
          title: "Welcome",
          description: "Get started",
          instruction: "Type your first message",
          message: "Hello, I need to onboard",
        },
        {
          id: "step-2",
          type: "form" as const,
          title: "Fill Form",
          description: "Complete the form",
          instruction: "Fill out all fields",
          expectedOutcome: "Form submitted successfully",
          hint: "All fields are required",
        },
      ],
    };

    beforeEach(() => {
      mockUseDemo.mockReturnValue({
        state: {
          status: "active",
          workflow: mockWorkflow,
          currentStep: mockWorkflow.steps[0],
          currentStepIndex: 0,
          totalSteps: 2,
        },
        selectWorkflow: mockSelectWorkflow,
        nextStep: mockNextStep,
        prevStep: mockPrevStep,
        stopDemo: mockStopDemo,
        isDemoMode: true,
        canGoNext: true,
        canGoPrev: false,
        progress: 50,
      });
    });

    it("should render guide panel", () => {
      render(<DemoOverlay />);

      expect(screen.getByText("Complete Onboarding")).toBeInTheDocument();
    });

    it("should show current step info", () => {
      render(<DemoOverlay />);

      expect(screen.getByText("Welcome")).toBeInTheDocument();
      expect(screen.getByText("Get started")).toBeInTheDocument();
    });

    it("should show instruction", () => {
      render(<DemoOverlay />);

      expect(screen.getByText("Type your first message")).toBeInTheDocument();
    });

    it("should show message to type when present", () => {
      render(<DemoOverlay />);

      expect(screen.getByText("Type this message:")).toBeInTheDocument();
      expect(screen.getByText("Hello, I need to onboard")).toBeInTheDocument();
    });

    it("should show step counter", () => {
      render(<DemoOverlay />);

      expect(screen.getByText("(1/2)")).toBeInTheDocument();
    });

    it("should have next button", () => {
      render(<DemoOverlay />);

      expect(screen.getByText("Next")).toBeInTheDocument();
    });

    it("should have back button", () => {
      render(<DemoOverlay />);

      expect(screen.getByText("Back")).toBeInTheDocument();
    });

    it("should call nextStep when Next clicked", async () => {
      render(<DemoOverlay />);

      await user.click(screen.getByText("Next"));

      expect(mockNextStep).toHaveBeenCalled();
    });

    it("should disable back button on first step", () => {
      render(<DemoOverlay />);

      const backButton = screen.getByText("Back").closest("button");
      expect(backButton).toBeDisabled();
    });
  });

  describe("When on last step", () => {
    const mockWorkflow = {
      id: "workflow-1",
      name: "Test Workflow",
      steps: [
        {
          id: "step-1",
          type: "message" as const,
          title: "Final Step",
          description: "Last step",
          instruction: "Complete",
        },
      ],
    };

    beforeEach(() => {
      mockUseDemo.mockReturnValue({
        state: {
          status: "active",
          workflow: mockWorkflow,
          currentStep: mockWorkflow.steps[0],
          currentStepIndex: 0,
          totalSteps: 1,
        },
        selectWorkflow: mockSelectWorkflow,
        nextStep: mockNextStep,
        prevStep: mockPrevStep,
        stopDemo: mockStopDemo,
        isDemoMode: true,
        canGoNext: false,
        canGoPrev: false,
        progress: 100,
      });
    });

    it("should show Finish button on last step", () => {
      render(<DemoOverlay />);

      expect(screen.getByText("Finish")).toBeInTheDocument();
    });
  });

  describe("Expected outcome and hint", () => {
    const mockWorkflow = {
      id: "workflow-1",
      name: "Test Workflow",
      steps: [
        {
          id: "step-1",
          type: "form" as const,
          title: "Test Step",
          description: "Description",
          instruction: "Do something",
          expectedOutcome: "Success expected",
          hint: "Here is a helpful hint",
        },
      ],
    };

    beforeEach(() => {
      mockUseDemo.mockReturnValue({
        state: {
          status: "active",
          workflow: mockWorkflow,
          currentStep: mockWorkflow.steps[0],
          currentStepIndex: 0,
          totalSteps: 1,
        },
        selectWorkflow: mockSelectWorkflow,
        nextStep: mockNextStep,
        prevStep: mockPrevStep,
        stopDemo: mockStopDemo,
        isDemoMode: true,
        canGoNext: true,
        canGoPrev: false,
        progress: 0,
      });
    });

    it("should show expected outcome when present", () => {
      render(<DemoOverlay />);

      expect(screen.getByText("Expected outcome:")).toBeInTheDocument();
      expect(screen.getByText("Success expected")).toBeInTheDocument();
    });

    it("should show hint when present", () => {
      render(<DemoOverlay />);

      expect(screen.getByText("Here is a helpful hint")).toBeInTheDocument();
    });
  });
});
