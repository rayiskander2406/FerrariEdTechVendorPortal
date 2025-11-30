/**
 * @vitest-environment jsdom
 */

/**
 * Feature Components Rendering Tests
 *
 * Tests basic rendering for feature flag components.
 * This file covers: FeatureGate, FeatureBadge
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock useFeature hook
const mockUseFeature = vi.fn();

vi.mock("@/lib/features", () => ({
  useFeature: (id: string) => mockUseFeature(id),
}));

import { FeatureGate, FeatureBadge } from "@/components/features/FeatureGate";

// =============================================================================
// FEATURE GATE TESTS
// =============================================================================

describe("FeatureGate", () => {
  beforeEach(() => {
    mockUseFeature.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("When feature is enabled", () => {
    beforeEach(() => {
      mockUseFeature.mockReturnValue(true);
    });

    it("should render children", () => {
      render(
        <FeatureGate featureId="test-feature">
          <div data-testid="child">Child content</div>
        </FeatureGate>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should call useFeature with correct feature ID", () => {
      render(
        <FeatureGate featureId="my-feature">
          <div>Content</div>
        </FeatureGate>
      );

      expect(mockUseFeature).toHaveBeenCalledWith("my-feature");
    });
  });

  describe("When feature is disabled", () => {
    beforeEach(() => {
      mockUseFeature.mockReturnValue(false);
    });

    it("should not render children", () => {
      render(
        <FeatureGate featureId="test-feature">
          <div data-testid="child">Child content</div>
        </FeatureGate>
      );

      expect(screen.queryByTestId("child")).not.toBeInTheDocument();
    });

    it("should render fallback when provided", () => {
      render(
        <FeatureGate
          featureId="test-feature"
          fallback={<div data-testid="fallback">Fallback content</div>}
        >
          <div data-testid="child">Child content</div>
        </FeatureGate>
      );

      expect(screen.queryByTestId("child")).not.toBeInTheDocument();
      expect(screen.getByTestId("fallback")).toBeInTheDocument();
    });

    it("should render locked state when showLockedState is true", () => {
      render(
        <FeatureGate featureId="test-feature" showLockedState>
          <div data-testid="child">Child content</div>
        </FeatureGate>
      );

      expect(screen.queryByTestId("child")).not.toBeInTheDocument();
      expect(screen.getByText("Feature Locked")).toBeInTheDocument();
      expect(screen.getByText("This feature is not currently enabled.")).toBeInTheDocument();
    });

    it("should render 'Enable in Dashboard' link in locked state", () => {
      render(
        <FeatureGate featureId="test-feature" showLockedState>
          <div>Child</div>
        </FeatureGate>
      );

      expect(screen.getByText("Enable in Dashboard")).toBeInTheDocument();
    });

    it("should render nothing when no fallback and showLockedState is false", () => {
      const { container } = render(
        <FeatureGate featureId="test-feature">
          <div data-testid="child">Child content</div>
        </FeatureGate>
      );

      expect(container.firstChild).toBeNull();
    });
  });
});

// =============================================================================
// FEATURE BADGE TESTS
// =============================================================================

describe("FeatureBadge", () => {
  describe("Status Variants", () => {
    it("should render stable badge", () => {
      render(<FeatureBadge status="stable" />);

      expect(screen.getByText("Stable")).toBeInTheDocument();
      const badge = document.querySelector(".bg-green-100");
      expect(badge).toBeInTheDocument();
    });

    it("should render beta badge", () => {
      render(<FeatureBadge status="beta" />);

      expect(screen.getByText("Beta")).toBeInTheDocument();
      const badge = document.querySelector(".bg-blue-100");
      expect(badge).toBeInTheDocument();
    });

    it("should render alpha badge", () => {
      render(<FeatureBadge status="alpha" />);

      expect(screen.getByText("Alpha")).toBeInTheDocument();
      const badge = document.querySelector(".bg-yellow-100");
      expect(badge).toBeInTheDocument();
    });

    it("should render experimental badge", () => {
      render(<FeatureBadge status="experimental" />);

      expect(screen.getByText("Experimental")).toBeInTheDocument();
      const badge = document.querySelector(".bg-red-100");
      expect(badge).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should apply custom className", () => {
      render(<FeatureBadge status="stable" className="ml-2" />);

      const badge = screen.getByText("Stable");
      expect(badge).toHaveClass("ml-2");
    });

    it("should have pill styling", () => {
      render(<FeatureBadge status="beta" />);

      const badge = screen.getByText("Beta");
      expect(badge).toHaveClass("rounded-full");
    });

    it("should have inline-flex display", () => {
      render(<FeatureBadge status="alpha" />);

      const badge = screen.getByText("Alpha");
      expect(badge).toHaveClass("inline-flex");
    });
  });
});
