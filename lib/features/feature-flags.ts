/**
 * Feature Flags Configuration
 *
 * This module defines all moonshot features that can be toggled on/off
 * via the dashboard or Claude Code slash command.
 *
 * Usage:
 *   - Dashboard: /dashboard/features
 *   - Claude Code: /features enable <feature-id> | /features disable <feature-id>
 */

// =============================================================================
// TYPES
// =============================================================================

export type FeatureCategory =
  | "monitoring"
  | "compliance"
  | "testing"
  | "integration"
  | "ai"
  | "analytics"
  | "transparency";

export type FeatureStatus = "stable" | "beta" | "alpha" | "experimental";

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  category: FeatureCategory;
  status: FeatureStatus;
  enabled: boolean;
  rank: number; // 1-10, from moonshot ranking
  valueProposition: string;
  dependencies?: string[]; // Other feature IDs this depends on
  icon: string; // Lucide icon name
}

export interface FeatureFlagsState {
  features: Record<string, FeatureFlag>;
  lastUpdated: string;
  version: string;
}

// =============================================================================
// DEFAULT FEATURE FLAGS
// =============================================================================

export const DEFAULT_FEATURES: Record<string, FeatureFlag> = {
  // Rank 1
  "ai-health-monitor": {
    id: "ai-health-monitor",
    name: "AI Integration Health Monitor",
    description: "Real-time AI-powered monitoring for integration anomalies",
    longDescription: "Detects integration anomalies, predicts failures, and auto-suggests fixes. Reduces vendor support burden by 70%+ and creates audit trail for compliance.",
    category: "monitoring",
    status: "beta",
    enabled: false,
    rank: 1,
    valueProposition: "Reduces support burden, enables self-diagnosis, positions LAUSD as tech-forward",
    icon: "Activity",
  },

  // Rank 2
  "compliance-pipeline": {
    id: "compliance-pipeline",
    name: "Automated Compliance Certification",
    description: "Self-service FERPA, COPPA, CA-AB1584 verification",
    longDescription: "Automatically validates compliance requirements and generates certification badges. Turns weeks of manual review into hours.",
    category: "compliance",
    status: "alpha",
    enabled: false,
    rank: 2,
    valueProposition: "Removes legal/procurement bottleneck, provides marketing badges, creates audit trail",
    icon: "ShieldCheck",
  },

  // Rank 3
  "synthetic-sandbox": {
    id: "synthetic-sandbox",
    name: "Synthetic Student Data Sandbox",
    description: "Realistic synthetic student cohorts for testing",
    longDescription: "Generate realistic synthetic student cohorts with edge cases (IEP, ELL, foster youth) for testing without touching real data. Zero privacy risk.",
    category: "testing",
    status: "beta",
    enabled: true, // Default enabled - core testing feature
    rank: 3,
    valueProposition: "Eliminates vendor complaint about testing, includes edge cases, accelerates go-live",
    icon: "Users",
  },

  // Rank 4
  "vendor-marketplace": {
    id: "vendor-marketplace",
    name: "Vendor-to-Vendor Marketplace",
    description: "Discover and connect with other approved vendors",
    longDescription: "Allow approved vendors to discover and connect with each other (e.g., SIS vendor + curriculum vendor). Creates network effects and reduces LAUSD integration burden.",
    category: "integration",
    status: "experimental",
    enabled: false,
    rank: 4,
    valueProposition: "Network effects, platform positioning, vendors build on each other",
    icon: "Network",
  },

  // Rank 5
  "predictive-onboarding": {
    id: "predictive-onboarding",
    name: "Predictive Onboarding Assistant",
    description: "AI that learns from successful onboardings",
    longDescription: "Learns from successful onboardings to predict blockers, auto-populate forms based on vendor category, and proactively suggest next steps.",
    category: "ai",
    status: "alpha",
    enabled: false,
    rank: 5,
    dependencies: ["ai-health-monitor"],
    valueProposition: "First-time-right rate increases, reduces back-and-forth, institutional memory",
    icon: "Sparkles",
  },

  // Rank 6
  "teacher-feedback": {
    id: "teacher-feedback",
    name: "Teacher Feedback Loop",
    description: "Anonymous teacher ratings for vendor products",
    longDescription: "Anonymous feedback channel where teachers rate vendor products, visible to procurement and the vendor. Closes loop between purchase decisions and classroom impact.",
    category: "analytics",
    status: "experimental",
    enabled: false,
    rank: 6,
    valueProposition: "Classroom accountability, actionable vendor signals, empowers teachers",
    icon: "MessageSquare",
  },

  // Rank 7
  "multi-district": {
    id: "multi-district",
    name: "Multi-District Federation",
    description: "Allow other CA districts to federate",
    longDescription: "Architecture to allow other CA districts to federate into the same portal with district-specific configurations. Amortizes development investment.",
    category: "integration",
    status: "experimental",
    enabled: false,
    rank: 7,
    valueProposition: "Investment amortization, integrate once deploy many, statewide standards",
    icon: "Building2",
  },

  // Rank 8
  "zero-touch-deploy": {
    id: "zero-touch-deploy",
    name: "Zero-Touch Deployment Pipeline",
    description: "GitOps-style deployment with compliance gates",
    longDescription: "Vendors push code to a repo and it automatically deploys to sandbox -> staging -> production with compliance gates. Full audit trail.",
    category: "integration",
    status: "alpha",
    enabled: false,
    rank: 8,
    dependencies: ["compliance-pipeline"],
    valueProposition: "Removes deployment overhead, automated compliance, faster iteration",
    icon: "Rocket",
  },

  // Rank 9
  "parent-transparency": {
    id: "parent-transparency",
    name: "Parent Transparency Portal",
    description: "Parent-facing view of data access and opt-out",
    longDescription: "Parent-facing view showing which vendors have access to their child's data, what data is shared, and how to opt out. Builds community trust.",
    category: "transparency",
    status: "experimental",
    enabled: false,
    rank: 9,
    valueProposition: "Community trust, preempts complaints, differentiates LAUSD as privacy-first",
    icon: "Eye",
  },

  // Rank 10
  "impact-analytics": {
    id: "impact-analytics",
    name: "Impact Analytics Dashboard",
    description: "Track student outcomes correlated with vendor usage",
    longDescription: "Track student outcomes correlated with vendor product usage (engagement, grade changes, attendance) with privacy-preserving aggregation.",
    category: "analytics",
    status: "experimental",
    enabled: false,
    rank: 10,
    dependencies: ["synthetic-sandbox"],
    valueProposition: "Answers 'is this helping students?', data-driven procurement, proof-of-impact",
    icon: "TrendingUp",
  },
};

// =============================================================================
// STORAGE KEYS
// =============================================================================

export const FEATURE_FLAGS_STORAGE_KEY = "schoolday-feature-flags";
export const FEATURE_FLAGS_VERSION = "1.0.0";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get initial feature flags state
 */
export function getInitialFeatureFlagsState(): FeatureFlagsState {
  return {
    features: { ...DEFAULT_FEATURES },
    lastUpdated: new Date().toISOString(),
    version: FEATURE_FLAGS_VERSION,
  };
}

/**
 * Load feature flags from localStorage (client-side only)
 */
export function loadFeatureFlags(): FeatureFlagsState {
  if (typeof window === "undefined") {
    return getInitialFeatureFlagsState();
  }

  try {
    const stored = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as FeatureFlagsState;
      // Merge with defaults to handle new features
      const merged: FeatureFlagsState = {
        ...parsed,
        features: {
          ...DEFAULT_FEATURES,
          ...Object.fromEntries(
            Object.entries(parsed.features).map(([key, value]) => [
              key,
              { ...DEFAULT_FEATURES[key], ...value, enabled: value.enabled },
            ])
          ),
        },
      };
      return merged;
    }
  } catch (error) {
    console.error("Failed to load feature flags:", error);
  }

  return getInitialFeatureFlagsState();
}

/**
 * Save feature flags to localStorage (client-side only)
 */
export function saveFeatureFlags(state: FeatureFlagsState): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify({
      ...state,
      lastUpdated: new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Failed to save feature flags:", error);
  }
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(
  state: FeatureFlagsState,
  featureId: string
): boolean {
  const feature = state.features[featureId];
  if (!feature) return false;

  // Check dependencies
  if (feature.dependencies) {
    for (const depId of feature.dependencies) {
      if (!isFeatureEnabled(state, depId)) {
        return false;
      }
    }
  }

  return feature.enabled;
}

/**
 * Get features by category
 */
export function getFeaturesByCategory(
  state: FeatureFlagsState
): Record<FeatureCategory, FeatureFlag[]> {
  const byCategory: Record<FeatureCategory, FeatureFlag[]> = {
    monitoring: [],
    compliance: [],
    testing: [],
    integration: [],
    ai: [],
    analytics: [],
    transparency: [],
  };

  for (const feature of Object.values(state.features)) {
    byCategory[feature.category].push(feature);
  }

  // Sort each category by rank
  for (const category of Object.keys(byCategory) as FeatureCategory[]) {
    byCategory[category].sort((a, b) => a.rank - b.rank);
  }

  return byCategory;
}

/**
 * Get features sorted by rank
 */
export function getFeaturesByRank(state: FeatureFlagsState): FeatureFlag[] {
  return Object.values(state.features).sort((a, b) => a.rank - b.rank);
}

/**
 * Enable a feature (and its dependencies)
 */
export function enableFeature(
  state: FeatureFlagsState,
  featureId: string
): FeatureFlagsState {
  const feature = state.features[featureId];
  if (!feature) return state;

  const newState = { ...state, features: { ...state.features } };

  // Enable dependencies first
  if (feature.dependencies) {
    for (const depId of feature.dependencies) {
      const depFeature = newState.features[depId];
      if (depFeature && !depFeature.enabled) {
        newState.features[depId] = {
          ...depFeature,
          enabled: true,
        };
      }
    }
  }

  // Enable the feature
  const targetFeature = newState.features[featureId];
  if (targetFeature) {
    newState.features[featureId] = {
      ...targetFeature,
      enabled: true,
    };
  }

  return newState;
}

/**
 * Disable a feature (and dependents)
 */
export function disableFeature(
  state: FeatureFlagsState,
  featureId: string
): FeatureFlagsState {
  const newState = { ...state, features: { ...state.features } };

  // Disable dependents first
  for (const [id, feature] of Object.entries(newState.features)) {
    if (feature.dependencies?.includes(featureId) && feature.enabled) {
      newState.features[id] = { ...feature, enabled: false };
    }
  }

  // Disable the feature
  const targetFeature = newState.features[featureId];
  if (targetFeature) {
    newState.features[featureId] = {
      ...targetFeature,
      enabled: false,
    };
  }

  return newState;
}

/**
 * Toggle a feature
 */
export function toggleFeature(
  state: FeatureFlagsState,
  featureId: string
): FeatureFlagsState {
  const feature = state.features[featureId];
  if (!feature) return state;

  return feature.enabled
    ? disableFeature(state, featureId)
    : enableFeature(state, featureId);
}

/**
 * Enable all features
 */
export function enableAllFeatures(state: FeatureFlagsState): FeatureFlagsState {
  const newFeatures: Record<string, FeatureFlag> = {};
  for (const [id, feature] of Object.entries(state.features)) {
    newFeatures[id] = { ...feature, enabled: true };
  }
  return { ...state, features: newFeatures };
}

/**
 * Disable all features
 */
export function disableAllFeatures(state: FeatureFlagsState): FeatureFlagsState {
  const newFeatures: Record<string, FeatureFlag> = {};
  for (const [id, feature] of Object.entries(state.features)) {
    newFeatures[id] = { ...feature, enabled: false };
  }
  return { ...state, features: newFeatures };
}

/**
 * Reset to defaults
 */
export function resetFeatureFlags(): FeatureFlagsState {
  return getInitialFeatureFlagsState();
}

/**
 * Export feature flags as JSON for CLI usage
 */
export function exportFeatureFlags(state: FeatureFlagsState): string {
  return JSON.stringify(
    {
      version: state.version,
      lastUpdated: state.lastUpdated,
      features: Object.fromEntries(
        Object.entries(state.features).map(([id, f]) => [
          id,
          { enabled: f.enabled, status: f.status },
        ])
      ),
    },
    null,
    2
  );
}

/**
 * Import feature flags from JSON
 */
export function importFeatureFlags(
  json: string
): FeatureFlagsState | null {
  try {
    const parsed = JSON.parse(json);
    const state = getInitialFeatureFlagsState();

    for (const [id, config] of Object.entries(parsed.features || {})) {
      if (state.features[id] && typeof config === "object" && config !== null) {
        const featureConfig = config as { enabled?: boolean };
        state.features[id] = {
          ...state.features[id],
          enabled: featureConfig.enabled ?? state.features[id].enabled,
        };
      }
    }

    return state;
  } catch {
    return null;
  }
}
