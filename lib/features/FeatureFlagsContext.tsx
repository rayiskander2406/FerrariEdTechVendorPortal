"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  type FeatureFlagsState,
  type FeatureFlag,
  loadFeatureFlags,
  saveFeatureFlags,
  isFeatureEnabled as checkFeatureEnabled,
  enableFeature,
  disableFeature,
  toggleFeature,
  enableAllFeatures,
  disableAllFeatures,
  resetFeatureFlags,
  getFeaturesByRank,
  getFeaturesByCategory,
  exportFeatureFlags,
  importFeatureFlags,
} from "./feature-flags";

// =============================================================================
// CONTEXT TYPE
// =============================================================================

interface FeatureFlagsContextValue {
  // State
  state: FeatureFlagsState;
  isLoaded: boolean;

  // Feature checks
  isEnabled: (featureId: string) => boolean;
  getFeature: (featureId: string) => FeatureFlag | undefined;
  getFeaturesByRank: () => FeatureFlag[];
  getFeaturesByCategory: () => ReturnType<typeof getFeaturesByCategory>;

  // Mutations
  enable: (featureId: string) => void;
  disable: (featureId: string) => void;
  toggle: (featureId: string) => void;
  enableAll: () => void;
  disableAll: () => void;
  reset: () => void;

  // Import/Export
  exportConfig: () => string;
  importConfig: (json: string) => boolean;
}

// =============================================================================
// CONTEXT
// =============================================================================

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

export function FeatureFlagsProvider({ children }: FeatureFlagsProviderProps) {
  const [state, setState] = useState<FeatureFlagsState | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadFeatureFlags();
    setState(loaded);
    setIsLoaded(true);
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    if (state && isLoaded) {
      saveFeatureFlags(state);
    }
  }, [state, isLoaded]);

  // ==========================================================================
  // METHODS
  // ==========================================================================

  const isEnabled = useCallback(
    (featureId: string) => {
      if (!state) return false;
      return checkFeatureEnabled(state, featureId);
    },
    [state]
  );

  const getFeature = useCallback(
    (featureId: string) => {
      return state?.features[featureId];
    },
    [state]
  );

  const getFeaturesByRankFn = useCallback(() => {
    if (!state) return [];
    return getFeaturesByRank(state);
  }, [state]);

  const getFeaturesByCategoryFn = useCallback(() => {
    if (!state) {
      return {
        monitoring: [],
        compliance: [],
        testing: [],
        integration: [],
        ai: [],
        analytics: [],
        transparency: [],
      };
    }
    return getFeaturesByCategory(state);
  }, [state]);

  const enable = useCallback((featureId: string) => {
    setState((prev) => (prev ? enableFeature(prev, featureId) : prev));
  }, []);

  const disable = useCallback((featureId: string) => {
    setState((prev) => (prev ? disableFeature(prev, featureId) : prev));
  }, []);

  const toggle = useCallback((featureId: string) => {
    setState((prev) => (prev ? toggleFeature(prev, featureId) : prev));
  }, []);

  const enableAll = useCallback(() => {
    setState((prev) => (prev ? enableAllFeatures(prev) : prev));
  }, []);

  const disableAll = useCallback(() => {
    setState((prev) => (prev ? disableAllFeatures(prev) : prev));
  }, []);

  const reset = useCallback(() => {
    setState(resetFeatureFlags());
  }, []);

  const exportConfig = useCallback(() => {
    if (!state) return "{}";
    return exportFeatureFlags(state);
  }, [state]);

  const importConfigFn = useCallback((json: string) => {
    const imported = importFeatureFlags(json);
    if (imported) {
      setState(imported);
      return true;
    }
    return false;
  }, []);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // Always provide a context value, even before loaded state
  // to prevent errors during SSR/prerendering
  const value: FeatureFlagsContextValue = {
    state: state ?? {
      features: {},
      lastUpdated: "",
      version: "1.0.0",
    },
    isLoaded,
    isEnabled,
    getFeature,
    getFeaturesByRank: getFeaturesByRankFn,
    getFeaturesByCategory: getFeaturesByCategoryFn,
    enable,
    disable,
    toggle,
    enableAll,
    disableAll,
    reset,
    exportConfig,
    importConfig: importConfigFn,
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useFeatureFlags(): FeatureFlagsContextValue {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error(
      "useFeatureFlags must be used within a FeatureFlagsProvider"
    );
  }
  return context;
}

/**
 * Simple hook to check if a single feature is enabled
 */
export function useFeature(featureId: string): boolean {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(featureId);
}

/**
 * Hook to get feature details
 */
export function useFeatureDetails(featureId: string): FeatureFlag | undefined {
  const { getFeature } = useFeatureFlags();
  return getFeature(featureId);
}
