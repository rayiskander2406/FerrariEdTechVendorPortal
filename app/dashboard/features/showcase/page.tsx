"use client";

import { useFeatureFlags } from "@/lib/features";
import Link from "next/link";
import { ArrowLeft, Settings, Sparkles } from "lucide-react";
import {
  AIHealthMonitor,
  CompliancePipeline,
  SyntheticSandbox,
  VendorMarketplace,
  PredictiveOnboarding,
  TeacherFeedback,
  MultiDistrictFederation,
  ZeroTouchDeploy,
  ParentTransparency,
  ImpactAnalytics,
} from "@/components/features";

// Feature component map
const FEATURE_COMPONENTS: Record<string, React.ComponentType> = {
  "ai-health-monitor": AIHealthMonitor,
  "compliance-pipeline": CompliancePipeline,
  "synthetic-sandbox": SyntheticSandbox,
  "vendor-marketplace": VendorMarketplace,
  "predictive-onboarding": PredictiveOnboarding,
  "teacher-feedback": TeacherFeedback,
  "multi-district": MultiDistrictFederation,
  "zero-touch-deploy": ZeroTouchDeploy,
  "parent-transparency": ParentTransparency,
  "impact-analytics": ImpactAnalytics,
};

export default function FeatureShowcasePage() {
  const { getFeaturesByRank, isEnabled } = useFeatureFlags();
  const features = getFeaturesByRank();
  const enabledFeatures = features.filter((f) => isEnabled(f.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/dashboard/features"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Feature Flags
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {enabledFeatures.length} of {features.length} features enabled
            </span>
            <Link
              href="/dashboard/features"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Configure
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Moonshot Features Showcase</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Enabled Features Demo
          </h1>
          <p className="text-white/80 max-w-xl mx-auto">
            Preview all enabled moonshot features. Toggle features in the dashboard
            to customize your demo experience.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {enabledFeatures.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Features Enabled
            </h2>
            <p className="text-gray-500 mb-4">
              Enable features in the dashboard to see them here.
            </p>
            <Link
              href="/dashboard/features"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {enabledFeatures.map((feature) => {
              const Component = FEATURE_COMPONENTS[feature.id];
              if (!Component) return null;

              return (
                <div
                  key={feature.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
                >
                  <Component />
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
