/**
 * ErrorBoundary Component Tests
 *
 * HARD-06: Tests for React error boundaries
 *
 * Tests:
 * 1. Base ErrorBoundary catches errors and shows fallback
 * 2. Reset functionality works correctly
 * 3. onError callback is called with error details
 * 4. Custom fallbackRender receives error and reset function
 * 5. ChatErrorBoundary shows chat-specific UI
 * 6. FormErrorBoundary shows form-specific UI
 * 7. Children render normally when no error
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import {
  ErrorBoundary,
  ChatErrorBoundary,
  FormErrorBoundary,
} from "@/components/ui/ErrorBoundary";

// =============================================================================
// TEST HELPERS
// =============================================================================

/**
 * Component that throws an error when rendered
 */
function ThrowingComponent({ error }: { error: Error }): never {
  throw error;
}

/**
 * Component that can be toggled to throw an error
 */
function ToggleableErrorComponent({
  shouldThrow,
  error,
}: {
  shouldThrow: boolean;
  error: Error;
}): React.ReactElement {
  if (shouldThrow) {
    throw error;
  }
  return <div data-testid="child-content">Normal content</div>;
}

/**
 * Simple child component for testing normal rendering
 */
function ChildComponent(): React.ReactElement {
  return <div data-testid="child-content">Child rendered successfully</div>;
}

// Suppress console.error during tests since we're testing error scenarios
const originalConsoleError = console.error;

beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// =============================================================================
// BASE ERROR BOUNDARY TESTS
// =============================================================================

describe("ErrorBoundary", () => {
  describe("Normal rendering", () => {
    it("should render children when no error occurs", () => {
      render(
        <ErrorBoundary>
          <ChildComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId("child-content")).toBeInTheDocument();
      expect(screen.getByText("Child rendered successfully")).toBeInTheDocument();
    });

    it("should render multiple children without error", () => {
      render(
        <ErrorBoundary>
          <div data-testid="first">First</div>
          <div data-testid="second">Second</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId("first")).toBeInTheDocument();
      expect(screen.getByTestId("second")).toBeInTheDocument();
    });
  });

  describe("Error catching", () => {
    it("should catch errors thrown by children", () => {
      const testError = new Error("Test error message");

      render(
        <ErrorBoundary>
          <ThrowingComponent error={testError} />
        </ErrorBoundary>
      );

      // Should show default fallback UI
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByText("Test error message")).toBeInTheDocument();
    });

    it("should show 'An unexpected error occurred' when error has no message", () => {
      const testError = new Error("");

      render(
        <ErrorBoundary>
          <ThrowingComponent error={testError} />
        </ErrorBoundary>
      );

      expect(screen.getByText("An unexpected error occurred")).toBeInTheDocument();
    });
  });

  describe("Fallback UI", () => {
    it("should use static fallback when provided", () => {
      const testError = new Error("Test error");

      render(
        <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom fallback</div>}>
          <ThrowingComponent error={testError} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
      expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
    });

    it("should use fallbackRender when provided", () => {
      const testError = new Error("Render function error");

      render(
        <ErrorBoundary
          fallbackRender={({ error, reset }) => (
            <div data-testid="render-fallback">
              <span data-testid="error-message">{error.message}</span>
              <button data-testid="reset-button" onClick={reset}>
                Reset
              </button>
            </div>
          )}
        >
          <ThrowingComponent error={testError} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId("render-fallback")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent("Render function error");
      expect(screen.getByTestId("reset-button")).toBeInTheDocument();
    });

    it("should prefer fallbackRender over static fallback", () => {
      const testError = new Error("Test");

      render(
        <ErrorBoundary
          fallback={<div data-testid="static">Static</div>}
          fallbackRender={() => <div data-testid="render">Render</div>}
        >
          <ThrowingComponent error={testError} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId("render")).toBeInTheDocument();
      expect(screen.queryByTestId("static")).not.toBeInTheDocument();
    });
  });

  describe("Reset functionality", () => {
    it("should reset error state when reset is called", () => {
      const testError = new Error("Resettable error");
      const TestComponent = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true);

        return (
          <ErrorBoundary
            fallbackRender={({ reset }) => (
              <div>
                <span>Error occurred</span>
                <button
                  onClick={() => {
                    setShouldThrow(false);
                    reset();
                  }}
                >
                  Try Again
                </button>
              </div>
            )}
          >
            <ToggleableErrorComponent shouldThrow={shouldThrow} error={testError} />
          </ErrorBoundary>
        );
      };

      render(<TestComponent />);

      // Initially shows error
      expect(screen.getByText("Error occurred")).toBeInTheDocument();

      // Click reset
      fireEvent.click(screen.getByText("Try Again"));

      // Should now show normal content
      expect(screen.getByTestId("child-content")).toBeInTheDocument();
      expect(screen.queryByText("Error occurred")).not.toBeInTheDocument();
    });

    it("should show Try Again button in default fallback", () => {
      const testError = new Error("Test");

      render(
        <ErrorBoundary>
          <ThrowingComponent error={testError} />
        </ErrorBoundary>
      );

      expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
    });
  });

  describe("onError callback", () => {
    it("should call onError when error is caught", () => {
      const onError = vi.fn();
      const testError = new Error("Callback test error");

      render(
        <ErrorBoundary onError={onError}>
          <ThrowingComponent error={testError} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        testError,
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it("should include componentName in console log when provided", () => {
      const testError = new Error("Named boundary error");

      render(
        <ErrorBoundary componentName="TestComponent">
          <ThrowingComponent error={testError} />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[ErrorBoundary:TestComponent]"),
        testError,
        expect.any(String)
      );
    });
  });
});

// =============================================================================
// CHAT ERROR BOUNDARY TESTS
// =============================================================================

describe("ChatErrorBoundary", () => {
  it("should render children normally when no error", () => {
    render(
      <ChatErrorBoundary>
        <ChildComponent />
      </ChatErrorBoundary>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("should show chat-specific error UI when error occurs", () => {
    const testError = new Error("Chat rendering failed");

    render(
      <ChatErrorBoundary>
        <ThrowingComponent error={testError} />
      </ChatErrorBoundary>
    );

    expect(screen.getByText("Chat Unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(/The chat assistant encountered an error/)
    ).toBeInTheDocument();
    expect(screen.getByText("Chat rendering failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload Chat" })).toBeInTheDocument();
  });

  it("should have Reload Chat button that resets the boundary", () => {
    const testError = new Error("Resettable chat error");
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      // Need to wrap in a way that allows state change before reset
      return (
        <div>
          <button onClick={() => setShouldThrow(false)}>Fix Error</button>
          <ChatErrorBoundary>
            <ToggleableErrorComponent shouldThrow={shouldThrow} error={testError} />
          </ChatErrorBoundary>
        </div>
      );
    };

    render(<TestComponent />);

    // Shows error state
    expect(screen.getByText("Chat Unavailable")).toBeInTheDocument();

    // Fix the error condition
    fireEvent.click(screen.getByText("Fix Error"));

    // Click reload
    fireEvent.click(screen.getByRole("button", { name: "Reload Chat" }));

    // Should show normal content
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });
});

// =============================================================================
// FORM ERROR BOUNDARY TESTS
// =============================================================================

describe("FormErrorBoundary", () => {
  it("should render children normally when no error", () => {
    render(
      <FormErrorBoundary>
        <ChildComponent />
      </FormErrorBoundary>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("should show form-specific error UI when error occurs", () => {
    const testError = new Error("Form validation failed");

    render(
      <FormErrorBoundary>
        <ThrowingComponent error={testError} />
      </FormErrorBoundary>
    );

    expect(screen.getByText("Form Error")).toBeInTheDocument();
    expect(screen.getByText("Unable to load this form. Please try again.")).toBeInTheDocument();
    expect(screen.getByText("Form validation failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("should show form name in error when provided", () => {
    const testError = new Error("SSO form error");

    render(
      <FormErrorBoundary formName="SSO Configuration">
        <ThrowingComponent error={testError} />
      </FormErrorBoundary>
    );

    expect(screen.getByText("SSO Configuration Form Error")).toBeInTheDocument();
  });

  it("should show generic form error when no formName", () => {
    const testError = new Error("Unknown form error");

    render(
      <FormErrorBoundary>
        <ThrowingComponent error={testError} />
      </FormErrorBoundary>
    );

    expect(screen.getByText("Form Error")).toBeInTheDocument();
  });

  it("should have Retry button that resets the boundary", () => {
    const testError = new Error("Resettable form error");
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      return (
        <div>
          <button onClick={() => setShouldThrow(false)}>Fix Error</button>
          <FormErrorBoundary formName="Test Form">
            <ToggleableErrorComponent shouldThrow={shouldThrow} error={testError} />
          </FormErrorBoundary>
        </div>
      );
    };

    render(<TestComponent />);

    // Shows error state
    expect(screen.getByText("Test Form Form Error")).toBeInTheDocument();

    // Fix the error condition
    fireEvent.click(screen.getByText("Fix Error"));

    // Click retry
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    // Should show normal content
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe("ErrorBoundary Integration", () => {
  it("should not affect sibling components when one child throws", () => {
    const testError = new Error("Sibling test error");

    render(
      <div>
        <div data-testid="sibling">Sibling content</div>
        <ErrorBoundary>
          <ThrowingComponent error={testError} />
        </ErrorBoundary>
      </div>
    );

    // Sibling should still render
    expect(screen.getByTestId("sibling")).toBeInTheDocument();
    // Error boundary should show fallback
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should handle nested error boundaries correctly", () => {
    const outerError = new Error("Outer error");
    const innerError = new Error("Inner error");

    render(
      <ErrorBoundary
        fallbackRender={({ error }) => (
          <div data-testid="outer-fallback">{error.message}</div>
        )}
      >
        <div>
          <ErrorBoundary
            fallbackRender={({ error }) => (
              <div data-testid="inner-fallback">{error.message}</div>
            )}
          >
            <ThrowingComponent error={innerError} />
          </ErrorBoundary>
        </div>
      </ErrorBoundary>
    );

    // Inner boundary should catch the error
    expect(screen.getByTestId("inner-fallback")).toHaveTextContent("Inner error");
    // Outer boundary should not be triggered
    expect(screen.queryByTestId("outer-fallback")).not.toBeInTheDocument();
  });

  it("should preserve error message across re-renders", () => {
    const testError = new Error("Persistent error");
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowingComponent error={testError} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Persistent error")).toBeInTheDocument();

    // Re-render with same error
    rerender(
      <ErrorBoundary>
        <ThrowingComponent error={testError} />
      </ErrorBoundary>
    );

    // Should still show the error
    expect(screen.getByText("Persistent error")).toBeInTheDocument();
  });
});
