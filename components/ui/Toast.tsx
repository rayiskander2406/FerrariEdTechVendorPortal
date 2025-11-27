/**
 * Toast Component - Notification system for SchoolDay Vendor Portal
 *
 * Features:
 * - Four variants: success (green), error (red), warning (amber), info (blue)
 * - Auto-dismiss after 5 seconds
 * - Manual dismiss with X button
 * - Smooth animations
 */

"use client";

import React, { useCallback, useEffect, useState, createContext, useContext } from "react";

// =============================================================================
// TYPES
// =============================================================================

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number; // ms, default 5000
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_DURATION = 5000; // 5 seconds

const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string; icon: string; text: string }> = {
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "text-green-600",
    text: "text-green-800",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "text-red-600",
    text: "text-red-800",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "text-amber-600",
    text: "text-amber-800",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-600",
    text: "text-blue-800",
  },
};

// =============================================================================
// ICONS
// =============================================================================

function SuccessIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={20} height={20}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={20} height={20}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={20} height={20}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={20} height={20}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={16} height={16}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

const VARIANT_ICONS: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
};

// =============================================================================
// CONTEXT
// =============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// =============================================================================
// TOAST ITEM COMPONENT
// =============================================================================

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const styles = VARIANT_STYLES[toast.variant];
  const Icon = VARIANT_ICONS[toast.variant];

  // Define handleDismiss first
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // Match animation duration
  }, [toast.id, onRemove]);

  // Entry animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    const duration = toast.duration ?? DEFAULT_DURATION;
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.duration, handleDismiss]);

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md
        transition-all duration-300 ease-out
        ${styles.bg} ${styles.border}
        ${isVisible && !isExiting ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
      role="alert"
    >
      <Icon className={`flex-shrink-0 ${styles.icon}`} />
      <p className={`flex-1 text-sm font-medium ${styles.text}`}>{toast.message}</p>
      <button
        onClick={handleDismiss}
        className={`flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors ${styles.text}`}
        aria-label="Dismiss notification"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

// =============================================================================
// TOAST PROVIDER
// =============================================================================

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = useCallback((): string => {
    return `toast_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = "info", duration?: number) => {
      const toast: Toast = {
        id: generateId(),
        message,
        variant,
        duration,
      };
      setToasts((prev) => [...prev, toast]);
    },
    [generateId]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Convenience methods
  const success = useCallback(
    (message: string, duration?: number) => addToast(message, "success", duration),
    [addToast]
  );

  const error = useCallback(
    (message: string, duration?: number) => addToast(message, "error", duration),
    [addToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) => addToast(message, "warning", duration),
    [addToast]
  );

  const info = useCallback(
    (message: string, duration?: number) => addToast(message, "info", duration),
    [addToast]
  );

  const value: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container - Fixed position at top-right */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// =============================================================================
// STANDALONE TOAST COMPONENT (for direct usage without context)
// =============================================================================

interface StandaloneToastProps {
  message: string;
  variant?: ToastVariant;
  onClose?: () => void;
  duration?: number;
}

export function StandaloneToast({ message, variant = "info", onClose, duration = DEFAULT_DURATION }: StandaloneToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const styles = VARIANT_STYLES[variant];
  const Icon = VARIANT_ICONS[variant];

  // Define handleDismiss first
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, handleDismiss]);

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md
        transition-all duration-300 ease-out
        ${styles.bg} ${styles.border}
        ${isVisible && !isExiting ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
      role="alert"
    >
      <Icon className={`flex-shrink-0 ${styles.icon}`} />
      <p className={`flex-1 text-sm font-medium ${styles.text}`}>{message}</p>
      <button
        onClick={handleDismiss}
        className={`flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors ${styles.text}`}
        aria-label="Dismiss notification"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

export default ToastProvider;
