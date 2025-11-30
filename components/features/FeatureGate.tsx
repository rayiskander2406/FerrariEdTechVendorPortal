"use client";

import React, { type ReactNode } from "react";
import { useFeature } from "@/lib/features";
import { Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureGateProps {
  featureId: string;
  children: ReactNode;
  fallback?: ReactNode;
  showLockedState?: boolean;
}

/**
 * FeatureGate - Conditionally renders children based on feature flag status
 *
 * Usage:
 * <FeatureGate featureId="ai-health-monitor">
 *   <HealthMonitorDashboard />
 * </FeatureGate>
 */
export function FeatureGate({
  featureId,
  children,
  fallback,
  showLockedState = false,
}: FeatureGateProps) {
  const isEnabled = useFeature(featureId);

  if (isEnabled) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showLockedState) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
          <Lock className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="font-medium text-gray-700 mb-1">Feature Locked</h3>
        <p className="text-sm text-gray-500 mb-3">
          This feature is not currently enabled.
        </p>
        <a
          href="/dashboard/features"
          className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-600"
        >
          <Sparkles className="w-4 h-4" />
          Enable in Dashboard
        </a>
      </div>
    );
  }

  return null;
}

/**
 * FeatureBadge - Shows a badge for experimental/beta features
 */
interface FeatureBadgeProps {
  status: "stable" | "beta" | "alpha" | "experimental";
  className?: string;
}

export function FeatureBadge({ status, className }: FeatureBadgeProps) {
  const config = {
    stable: { label: "Stable", color: "bg-green-100 text-green-700" },
    beta: { label: "Beta", color: "bg-blue-100 text-blue-700" },
    alpha: { label: "Alpha", color: "bg-yellow-100 text-yellow-700" },
    experimental: { label: "Experimental", color: "bg-red-100 text-red-700" },
  };

  const { label, color } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        color,
        className
      )}
    >
      {label}
    </span>
  );
}

export default FeatureGate;
