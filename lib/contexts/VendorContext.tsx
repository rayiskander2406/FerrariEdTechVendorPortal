/**
 * VendorContext - Single Source of Truth for Vendor State
 *
 * HARD-01: State Architecture Hardening
 *
 * This context eliminates the stale closure issues that required vendorStateRef
 * workarounds in useChat. All vendor state now flows through this single provider.
 *
 * Features:
 * - Single source of truth for vendor state
 * - Auto-sync to localStorage on every change
 * - SSR-safe hydration (no mismatch warnings)
 * - Exposed via useVendor() hook
 *
 * @see .claude/HARDENING_PLAN.md - HARD-01 task
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { type AccessTier, type SandboxCredentials, type IntegrationConfig } from "@/lib/types";

// =============================================================================
// TYPES
// =============================================================================

export interface VendorState {
  isOnboarded: boolean;
  vendorId: string | null;
  companyName: string | null;
  accessTier: AccessTier | null;
  podsStatus: string | null;
  credentials: SandboxCredentials | null;
  integrations: IntegrationConfig[];
}

export interface VendorContextValue {
  /** Current vendor state */
  vendorState: VendorState;
  /** Whether we've hydrated from localStorage (false during SSR) */
  isHydrated: boolean;
  /** Update vendor state (partial updates allowed) */
  updateVendorState: (updates: Partial<VendorState>) => void;
  /** Reset vendor state to initial values and clear localStorage */
  resetVendorState: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEY = "schoolday_vendor_state";

const INITIAL_VENDOR_STATE: VendorState = {
  isOnboarded: false,
  vendorId: null,
  companyName: null,
  accessTier: null,
  podsStatus: null,
  credentials: null,
  integrations: [],
};

// =============================================================================
// CONTEXT
// =============================================================================

const VendorContext = createContext<VendorContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface VendorProviderProps {
  children: ReactNode;
}

export function VendorProvider({ children }: VendorProviderProps) {
  // Start with initial state - will be updated after hydration
  const [vendorState, setVendorState] = useState<VendorState>(INITIAL_VENDOR_STATE);
  const [isHydrated, setIsHydrated] = useState(false);

  // ==========================================================================
  // HYDRATION: Load from localStorage on mount (client-side only)
  // ==========================================================================
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<VendorState>;
        // Merge with initial state to ensure all fields exist
        setVendorState((prev) => ({
          ...prev,
          ...parsed,
          // Ensure credentials dates are properly restored
          credentials: parsed.credentials
            ? {
                ...parsed.credentials,
                expiresAt: new Date(parsed.credentials.expiresAt),
                createdAt: new Date(parsed.credentials.createdAt),
                lastUsedAt: parsed.credentials.lastUsedAt
                  ? new Date(parsed.credentials.lastUsedAt)
                  : undefined,
              }
            : prev.credentials,
        }));
        // Note: Vendor state intentionally not logged to avoid browser console exposure
      }
    } catch {
      // Silent fail on hydration - state will use defaults
    }
    setIsHydrated(true);
  }, []);

  // ==========================================================================
  // PERSISTENCE: Save to localStorage on every state change (after hydration)
  // ==========================================================================
  useEffect(() => {
    if (!isHydrated) return; // Don't save during SSR or before hydration

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vendorState));
      // Note: Vendor state intentionally not logged to avoid browser console exposure
    } catch {
      // Silent fail on persistence - state still works in memory
    }
  }, [vendorState, isHydrated]);

  // ==========================================================================
  // UPDATE: Partial state updates
  // ==========================================================================
  const updateVendorState = useCallback((updates: Partial<VendorState>) => {
    setVendorState((prev) => ({ ...prev, ...updates }));
  }, []);

  // ==========================================================================
  // RESET: Clear state and localStorage
  // ==========================================================================
  const resetVendorState = useCallback(() => {
    setVendorState(INITIAL_VENDOR_STATE);
    try {
      localStorage.removeItem(STORAGE_KEY);
      // Also clear the legacy key used by chat
      localStorage.removeItem("schoolday_pods_backup");
    } catch {
      // Silent fail on clear - state is already reset in memory
    }
  }, []);

  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================
  const value: VendorContextValue = {
    vendorState,
    isHydrated,
    updateVendorState,
    resetVendorState,
  };

  return (
    <VendorContext.Provider value={value}>
      {children}
    </VendorContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Access vendor state from any component.
 *
 * @example
 * const { vendorState, updateVendorState, resetVendorState } = useVendor();
 *
 * // Update vendor after PoDS submission
 * updateVendorState({
 *   isOnboarded: true,
 *   vendorId: "vendor-123",
 *   companyName: "MathGenius Learning",
 *   accessTier: "PRIVACY_SAFE",
 *   podsStatus: "APPROVED",
 * });
 *
 * // Reset on logout/reset button
 * resetVendorState();
 */
export function useVendor(): VendorContextValue {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error("useVendor must be used within a VendorProvider");
  }
  return context;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { INITIAL_VENDOR_STATE, STORAGE_KEY };
