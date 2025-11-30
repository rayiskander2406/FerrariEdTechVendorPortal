"use client";

import { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Circle,
  Clock,
  Award,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureBadge } from "./FeatureGate";

interface ComplianceCheck {
  id: string;
  name: string;
  description: string;
  status: "passed" | "pending" | "failed" | "not_started";
  category: "FERPA" | "COPPA" | "CA-AB1584" | "LAUSD";
}

const MOCK_CHECKS: ComplianceCheck[] = [
  {
    id: "1",
    name: "Data Encryption at Rest",
    description: "All student data must be encrypted when stored",
    status: "passed",
    category: "FERPA",
  },
  {
    id: "2",
    name: "Data Encryption in Transit",
    description: "TLS 1.2+ required for all data transmission",
    status: "passed",
    category: "FERPA",
  },
  {
    id: "3",
    name: "Parental Consent Workflow",
    description: "Verifiable consent for users under 13",
    status: "pending",
    category: "COPPA",
  },
  {
    id: "4",
    name: "Data Deletion on Request",
    description: "Ability to delete all student data within 30 days",
    status: "passed",
    category: "CA-AB1584",
  },
  {
    id: "5",
    name: "Third-Party Data Sharing",
    description: "No unauthorized sharing of student data",
    status: "passed",
    category: "CA-AB1584",
  },
  {
    id: "6",
    name: "LAUSD Data Classification",
    description: "Proper handling of Tier 1/2/3 data",
    status: "not_started",
    category: "LAUSD",
  },
];

export function CompliancePipeline() {
  const [checks] = useState<ComplianceCheck[]>(MOCK_CHECKS);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ["FERPA", "COPPA", "CA-AB1584", "LAUSD"];

  const filteredChecks = selectedCategory
    ? checks.filter((c) => c.category === selectedCategory)
    : checks;

  const stats = {
    total: checks.length,
    passed: checks.filter((c) => c.status === "passed").length,
    pending: checks.filter((c) => c.status === "pending").length,
    failed: checks.filter((c) => c.status === "failed").length,
  };

  const completionPercent = Math.round((stats.passed / stats.total) * 100);

  const statusConfig = {
    passed: {
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      bg: "bg-green-50 border-green-200",
      text: "text-green-700",
    },
    pending: {
      icon: <Clock className="w-5 h-5 text-yellow-500" />,
      bg: "bg-yellow-50 border-yellow-200",
      text: "text-yellow-700",
    },
    failed: {
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
    },
    not_started: {
      icon: <Circle className="w-5 h-5 text-gray-400" />,
      bg: "bg-gray-50 border-gray-200",
      text: "text-gray-600",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <ShieldCheck className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Compliance Certification Pipeline
            </h2>
            <FeatureBadge status="alpha" />
          </div>
          <p className="text-sm text-gray-500">
            Automated FERPA, COPPA, CA-AB1584 verification
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Certification Progress</h3>
            <p className="text-sm text-gray-500">
              {stats.passed} of {stats.total} checks passed
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">
              {completionPercent}%
            </div>
            <p className="text-sm text-gray-500">Complete</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">{stats.passed}</div>
            <div className="text-xs text-gray-500">Passed</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-red-600">{stats.failed}</div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500">Filter:</span>
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            !selectedCategory
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              selectedCategory === cat
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Compliance Checks */}
      <div className="space-y-3">
        {filteredChecks.map((check) => {
          const config = statusConfig[check.status];
          return (
            <div
              key={check.id}
              className={cn(
                "rounded-lg border p-4 transition-colors",
                config.bg
              )}
            >
              <div className="flex items-start gap-3">
                {config.icon}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={cn("font-medium", config.text)}>
                      {check.name}
                    </h4>
                    <span className="px-2 py-0.5 bg-white/50 rounded text-xs font-medium text-gray-600">
                      {check.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {check.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Certification Badge Preview */}
      {completionPercent === 100 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6 text-center">
          <Award className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-900">
            Ready for Certification!
          </h3>
          <p className="text-sm text-green-700 mt-1">
            All compliance checks passed. You can now request official LAUSD certification.
          </p>
          <button className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
            Request Certification Badge
          </button>
        </div>
      )}
    </div>
  );
}

export default CompliancePipeline;
