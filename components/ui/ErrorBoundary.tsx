/**
 * Error Boundary Components
 *
 * HARD-06: React error boundaries for graceful error handling.
 *
 * Provides:
 * - Base ErrorBoundary component (class component required by React)
 * - ChatErrorBoundary - for chat message area
 * - FormErrorBoundary - for embedded forms
 *
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */

"use client";

import React, { Component, type ReactNode } from "react";

// =============================================================================
// TYPES
// =============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Fallback UI to show when error occurs */
  fallback?: ReactNode;
  /** Custom fallback render function with error details */
  fallbackRender?: (props: { error: Error; reset: () => void }) => ReactNode;
  /** Called when error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Component name for logging */
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// =============================================================================
// BASE ERROR BOUNDARY
// =============================================================================

/**
 * Base React Error Boundary
 *
 * Must be a class component - React doesn't support error boundaries as hooks.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const { onError, componentName } = this.props;

    // Log error with component context
    console.error(
      `[ErrorBoundary${componentName ? `:${componentName}` : ""}] Caught error:`,
      error,
      errorInfo.componentStack
    );

    // Call custom error handler if provided
    onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, fallbackRender } = this.props;

    if (hasError && error) {
      // Use custom fallback render if provided
      if (fallbackRender) {
        return fallbackRender({ error, reset: this.handleReset });
      }

      // Use static fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default fallback
      return <DefaultErrorFallback error={error} reset={this.handleReset} />;
    }

    return children;
  }
}

// =============================================================================
// DEFAULT FALLBACK UI
// =============================================================================

interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
}

function DefaultErrorFallback({ error, reset }: ErrorFallbackProps): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="text-red-600 mb-2">
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-red-800 mb-1">
        Something went wrong
      </h3>
      <p className="text-sm text-red-600 mb-4 text-center max-w-md">
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
      >
        Try Again
      </button>
    </div>
  );
}

// =============================================================================
// SPECIALIZED ERROR BOUNDARIES
// =============================================================================

/**
 * Chat Error Boundary
 *
 * Specialized boundary for the chat area with chat-specific recovery UI.
 */
export function ChatErrorBoundary({ children }: { children: ReactNode }): ReactNode {
  return (
    <ErrorBoundary
      componentName="Chat"
      fallbackRender={({ error, reset }) => (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Chat Unavailable
          </h3>
          <p className="text-sm text-gray-600 mb-4 text-center max-w-md">
            The chat assistant encountered an error. Your conversation history
            may be preserved.
          </p>
          <p className="text-xs text-gray-400 mb-4 font-mono">
            {error.message}
          </p>
          <button
            onClick={reset}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Reload Chat
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Form Error Boundary
 *
 * Specialized boundary for embedded forms with form-specific recovery UI.
 */
export function FormErrorBoundary({
  children,
  formName,
}: {
  children: ReactNode;
  formName?: string;
}): ReactNode {
  return (
    <ErrorBoundary
      componentName={`Form:${formName || "Unknown"}`}
      fallbackRender={({ error, reset }) => (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-amber-500 flex-shrink-0">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-800">
                {formName ? `${formName} Form Error` : "Form Error"}
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                Unable to load this form. Please try again.
              </p>
              <p className="text-xs text-amber-500 mt-1 font-mono">
                {error.message}
              </p>
              <button
                onClick={reset}
                className="mt-3 px-3 py-1.5 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ErrorBoundary;
