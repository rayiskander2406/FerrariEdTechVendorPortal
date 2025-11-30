"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Activity,
  ShieldCheck,
  Users,
  Network,
  Sparkles,
  MessageSquare,
  Building2,
  Rocket,
  Eye,
  TrendingUp,
  Settings,
  Power,
  PowerOff,
  RotateCcw,
  Download,
  Upload,
  Copy,
  Check,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFeatureFlags } from "@/lib/features";
import type { FeatureFlag, FeatureCategory, FeatureStatus } from "@/lib/features";

// =============================================================================
// ICON MAP
// =============================================================================

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Activity,
  ShieldCheck,
  Users,
  Network,
  Sparkles,
  MessageSquare,
  Building2,
  Rocket,
  Eye,
  TrendingUp,
};

// =============================================================================
// CATEGORY CONFIG
// =============================================================================

const CATEGORY_CONFIG: Record<FeatureCategory, { label: string; color: string }> = {
  monitoring: { label: "Monitoring", color: "bg-blue-100 text-blue-700" },
  compliance: { label: "Compliance", color: "bg-green-100 text-green-700" },
  testing: { label: "Testing", color: "bg-yellow-100 text-yellow-700" },
  integration: { label: "Integration", color: "bg-purple-100 text-purple-700" },
  ai: { label: "AI/ML", color: "bg-pink-100 text-pink-700" },
  analytics: { label: "Analytics", color: "bg-orange-100 text-orange-700" },
  transparency: { label: "Transparency", color: "bg-cyan-100 text-cyan-700" },
};

// =============================================================================
// STATUS CONFIG
// =============================================================================

const STATUS_CONFIG: Record<FeatureStatus, { label: string; color: string; icon: React.ReactNode }> = {
  stable: {
    label: "Stable",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: <Check className="w-3 h-3" />,
  },
  beta: {
    label: "Beta",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <Zap className="w-3 h-3" />,
  },
  alpha: {
    label: "Alpha",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  experimental: {
    label: "Experimental",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <Info className="w-3 h-3" />,
  },
};

// =============================================================================
// FEATURE CARD
// =============================================================================

interface FeatureCardProps {
  feature: FeatureFlag;
  onToggle: () => void;
  expanded: boolean;
  onExpandToggle: () => void;
  dependencyWarning?: string;
}

function FeatureCard({
  feature,
  onToggle,
  expanded,
  onExpandToggle,
  dependencyWarning,
}: FeatureCardProps) {
  const Icon = ICON_MAP[feature.icon] || Activity;
  const categoryConfig = CATEGORY_CONFIG[feature.category];
  const statusConfig = STATUS_CONFIG[feature.status];

  return (
    <div
      className={cn(
        "bg-white rounded-xl border-2 transition-all duration-200",
        feature.enabled
          ? "border-primary shadow-md"
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "p-2.5 rounded-lg flex-shrink-0 transition-colors",
              feature.enabled
                ? "bg-primary/10 text-primary"
                : "bg-gray-100 text-gray-500"
            )}
          >
            <Icon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={cn(
                  "font-semibold truncate",
                  feature.enabled ? "text-gray-900" : "text-gray-700"
                )}
              >
                {feature.name}
              </h3>
              <span className="text-xs font-medium text-gray-400">
                #{feature.rank}
              </span>
            </div>

            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
              {feature.description}
            </p>

            {/* Badges */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  categoryConfig.color
                )}
              >
                {categoryConfig.label}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                  statusConfig.color
                )}
              >
                {statusConfig.icon}
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Toggle */}
          <button
            onClick={onToggle}
            className={cn(
              "relative flex-shrink-0 w-14 h-7 rounded-full transition-colors duration-200",
              feature.enabled ? "bg-primary" : "bg-gray-300"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200",
                feature.enabled ? "translate-x-7" : "translate-x-0.5"
              )}
            />
          </button>
        </div>

        {/* Dependency Warning */}
        {dependencyWarning && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-xs text-yellow-700">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {dependencyWarning}
          </div>
        )}
      </div>

      {/* Expand Toggle */}
      <button
        onClick={onExpandToggle}
        className="w-full px-4 py-2 border-t border-gray-100 flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Less details
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            More details
          </>
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
              Full Description
            </h4>
            <p className="text-sm text-gray-600">{feature.longDescription}</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
              Value Proposition
            </h4>
            <p className="text-sm text-gray-600">{feature.valueProposition}</p>
          </div>

          {feature.dependencies && feature.dependencies.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                Dependencies
              </h4>
              <div className="flex flex-wrap gap-1">
                {feature.dependencies.map((dep) => (
                  <code
                    key={dep}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                  >
                    {dep}
                  </code>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
            <span>ID: <code className="text-gray-700">{feature.id}</code></span>
            <span>Rank: <span className="text-gray-700">#{feature.rank}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD
// =============================================================================

type SortMode = "rank" | "category" | "status";

export function FeatureFlagsDashboard() {
  const {
    isLoaded,
    toggle,
    enableAll,
    disableAll,
    reset,
    exportConfig,
    importConfig,
    getFeaturesByRank,
    isEnabled,
  } = useFeatureFlags();

  const [sortMode, setSortMode] = useState<SortMode>("rank");
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [copied, setCopied] = useState(false);

  // ==========================================================================
  // COMPUTED
  // ==========================================================================

  const features = useMemo(() => {
    const allFeatures = getFeaturesByRank();

    switch (sortMode) {
      case "category":
        return [...allFeatures].sort((a, b) =>
          a.category.localeCompare(b.category)
        );
      case "status":
        const statusOrder: FeatureStatus[] = ["stable", "beta", "alpha", "experimental"];
        return [...allFeatures].sort(
          (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
        );
      case "rank":
      default:
        return allFeatures;
    }
  }, [getFeaturesByRank, sortMode]);

  const stats = useMemo(() => {
    const total = features.length;
    const enabled = features.filter((f) => f.enabled).length;
    return { total, enabled, disabled: total - enabled };
  }, [features]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const toggleExpand = useCallback((featureId: string) => {
    setExpandedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(featureId)) {
        next.delete(featureId);
      } else {
        next.add(featureId);
      }
      return next;
    });
  }, []);

  const handleCopyConfig = useCallback(async () => {
    const config = exportConfig();
    await navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [exportConfig]);

  const handleImport = useCallback(() => {
    const success = importConfig(importText);
    if (success) {
      setShowImportModal(false);
      setImportText("");
    } else {
      alert("Invalid configuration format");
    }
  }, [importConfig, importText]);

  const getDependencyWarning = useCallback(
    (feature: FeatureFlag): string | undefined => {
      if (!feature.dependencies) return undefined;

      const missingDeps = feature.dependencies.filter(
        (dep) => !isEnabled(dep)
      );

      if (missingDeps.length > 0 && feature.enabled) {
        return `Requires: ${missingDeps.join(", ")} to be enabled`;
      }

      return undefined;
    },
    [isEnabled]
  );

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Feature Flags Dashboard</h1>
            <p className="text-white/80 text-sm">
              Toggle moonshot features for demo or production
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-white/70">Total Features</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-300">{stats.enabled}</div>
            <div className="text-xs text-white/70">Enabled</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-300">{stats.disabled}</div>
            <div className="text-xs text-white/70">Disabled</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={enableAll}
            className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
          >
            <Power className="w-4 h-4" />
            Enable All
          </button>
          <button
            onClick={disableAll}
            className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
          >
            <PowerOff className="w-4 h-4" />
            Disable All
          </button>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>

        {/* Import/Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyConfig}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Export
              </>
            )}
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">Sort by:</span>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(["rank", "category", "status"] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize",
                sortMode === mode
                  ? "bg-white text-gray-900 shadow"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            onToggle={() => toggle(feature.id)}
            expanded={expandedFeatures.has(feature.id)}
            onExpandToggle={() => toggleExpand(feature.id)}
            dependencyWarning={getDependencyWarning(feature)}
          />
        ))}
      </div>

      {/* CLI Instructions */}
      <div className="bg-gray-900 rounded-xl p-4 text-white">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Claude Code CLI Commands
        </h3>
        <div className="space-y-2 font-mono text-sm">
          <div className="flex items-start gap-2">
            <span className="text-gray-400">$</span>
            <code className="text-green-400">/features list</code>
            <span className="text-gray-500 ml-auto">Show all features</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-400">$</span>
            <code className="text-green-400">/features enable &lt;id&gt;</code>
            <span className="text-gray-500 ml-auto">Enable a feature</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-400">$</span>
            <code className="text-green-400">/features disable &lt;id&gt;</code>
            <span className="text-gray-500 ml-auto">Disable a feature</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-400">$</span>
            <code className="text-green-400">/features enable-all</code>
            <span className="text-gray-500 ml-auto">Enable all features</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-400">$</span>
            <code className="text-green-400">/features disable-all</code>
            <span className="text-gray-500 ml-auto">Disable all features</span>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold">Import Configuration</h3>
            <p className="text-sm text-gray-500">
              Paste your feature flags JSON configuration below:
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full h-48 p-3 border border-gray-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder='{"features": {"ai-health-monitor": {"enabled": true}}}'
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeatureFlagsDashboard;
