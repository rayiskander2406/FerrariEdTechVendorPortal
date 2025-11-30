/**
 * @vitest-environment jsdom
 */

/**
 * UI Components Rendering Tests
 *
 * Tests basic rendering for UI utility components.
 * This file covers: Toast, Skeleton
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ToastProvider, StandaloneToast, useToast } from "@/components/ui/Toast";
import { Skeleton, CredentialsSkeleton, FormSkeleton, MessageSkeleton } from "@/components/ui/Skeleton";

// =============================================================================
// SKELETON TESTS
// =============================================================================

describe("Skeleton", () => {
  describe("Base Skeleton", () => {
    it("should render with default classes", () => {
      render(<Skeleton />);

      const skeleton = document.querySelector(".animate-pulse");
      expect(skeleton).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(<Skeleton className="w-24 h-6" />);

      const skeleton = document.querySelector(".w-24.h-6");
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe("CredentialsSkeleton", () => {
    it("should render credential rows", () => {
      render(<CredentialsSkeleton />);

      // Should have header and rows
      const container = document.querySelector(".bg-gray-900");
      expect(container).toBeInTheDocument();
    });

    it("should have multiple skeleton rows", () => {
      render(<CredentialsSkeleton />);

      // Should have multiple skeleton elements
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("FormSkeleton", () => {
    it("should render form skeleton", () => {
      render(<FormSkeleton />);

      const container = document.querySelector(".space-y-4");
      expect(container).toBeInTheDocument();
    });

    it("should have skeleton elements", () => {
      render(<FormSkeleton />);

      const skeletons = document.querySelectorAll(".animate-pulse, .animate-shimmer");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("MessageSkeleton", () => {
    it("should render message skeleton", () => {
      render(<MessageSkeleton />);

      // Should have avatar
      const avatar = document.querySelector(".rounded-full");
      expect(avatar).toBeInTheDocument();
    });

    it("should render user variant", () => {
      render(<MessageSkeleton isUser={true} />);

      // Should have flex-row-reverse for user
      const container = document.querySelector(".flex-row-reverse");
      expect(container).toBeInTheDocument();
    });

    it("should render assistant variant", () => {
      render(<MessageSkeleton isUser={false} />);

      // Should have flex-row for assistant
      const container = document.querySelector(".flex-row");
      expect(container).toBeInTheDocument();
    });
  });
});

// =============================================================================
// TOAST TESTS
// =============================================================================

describe("StandaloneToast", () => {
  describe("Basic Rendering", () => {
    it("should render toast message", () => {
      render(<StandaloneToast message="Test message" />);

      expect(screen.getByText("Test message")).toBeInTheDocument();
    });

    it("should render with info variant by default", () => {
      render(<StandaloneToast message="Info message" />);

      // Should have blue styling for info
      const toast = document.querySelector(".bg-blue-50");
      expect(toast).toBeInTheDocument();
    });

    it("should render success variant", () => {
      render(<StandaloneToast message="Success!" variant="success" />);

      const toast = document.querySelector(".bg-green-50");
      expect(toast).toBeInTheDocument();
    });

    it("should render error variant", () => {
      render(<StandaloneToast message="Error!" variant="error" />);

      const toast = document.querySelector(".bg-red-50");
      expect(toast).toBeInTheDocument();
    });

    it("should render warning variant", () => {
      render(<StandaloneToast message="Warning!" variant="warning" />);

      const toast = document.querySelector(".bg-amber-50");
      expect(toast).toBeInTheDocument();
    });

    it("should have dismiss button", () => {
      render(<StandaloneToast message="Test" />);

      expect(screen.getByLabelText("Dismiss notification")).toBeInTheDocument();
    });

    it("should have role=alert for accessibility", () => {
      render(<StandaloneToast message="Alert" />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});

describe("ToastProvider", () => {
  it("should render children", () => {
    render(
      <ToastProvider>
        <div data-testid="child">Child content</div>
      </ToastProvider>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("should render toast container", () => {
    render(
      <ToastProvider>
        <div>Content</div>
      </ToastProvider>
    );

    // Should have fixed toast container at top-right
    const container = document.querySelector(".fixed.top-4.right-4");
    expect(container).toBeInTheDocument();
  });

  it("should provide toast context to children", () => {
    // Test that useToast throws when used outside provider
    function TestComponent() {
      try {
        useToast();
        return <div>Has context</div>;
      } catch {
        return <div>No context</div>;
      }
    }

    // Without provider
    const { container: withoutProvider } = render(<TestComponent />);
    expect(withoutProvider.textContent).toBe("No context");

    // With provider
    const { container: withProvider } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    expect(withProvider.textContent).toBe("Has context");
  });
});
