"use client";

import {
  Users,
  Network,
  Sparkles,
  MessageSquare,
  Building2,
  Rocket,
  Eye,
  TrendingUp,
  Globe,
  GitBranch,
  Heart,
  BarChart3,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureBadge } from "./FeatureGate";

// =============================================================================
// SYNTHETIC SANDBOX (Rank 3)
// =============================================================================

interface SyntheticStudent {
  id: string;
  name: string;
  grade: string;
  flags: string[];
}

const MOCK_SYNTHETIC_STUDENTS: SyntheticStudent[] = [
  { id: "SYN-001", name: "Alex Rivera", grade: "6th", flags: ["ELL", "FRPL"] },
  { id: "SYN-002", name: "Jordan Chen", grade: "7th", flags: ["IEP", "Gifted"] },
  { id: "SYN-003", name: "Sam Williams", grade: "8th", flags: ["504", "Foster"] },
  { id: "SYN-004", name: "Taylor Johnson", grade: "6th", flags: [] },
];

export function SyntheticSandbox() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <Users className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Synthetic Student Data Sandbox
            </h2>
            <FeatureBadge status="beta" />
          </div>
          <p className="text-sm text-gray-500">
            Realistic test data with edge cases, zero privacy risk
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-yellow-600" />
          <span className="font-medium text-yellow-900">100% Synthetic Data</span>
        </div>
        <p className="text-sm text-yellow-800">
          All student records below are AI-generated synthetic personas.
          No real student data is exposed.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {MOCK_SYNTHETIC_STUDENTS.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-gray-600">{student.id}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{student.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{student.grade}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {student.flags.length > 0 ? (
                      student.flags.map((flag) => (
                        <span
                          key={flag}
                          className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium"
                        >
                          {flag}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-xs">None</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="w-full py-3 bg-yellow-100 text-yellow-700 rounded-lg font-medium hover:bg-yellow-200 transition-colors">
        Generate More Synthetic Students
      </button>
    </div>
  );
}

// =============================================================================
// VENDOR MARKETPLACE (Rank 4)
// =============================================================================

interface VendorPartner {
  id: string;
  name: string;
  category: string;
  integrations: number;
  logo: string;
}

const MOCK_VENDORS: VendorPartner[] = [
  { id: "1", name: "LearningPath Pro", category: "Curriculum", integrations: 12, logo: "LP" },
  { id: "2", name: "AssessmentHub", category: "Assessment", integrations: 8, logo: "AH" },
  { id: "3", name: "ClassroomConnect", category: "Communication", integrations: 15, logo: "CC" },
];

export function VendorMarketplace() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Network className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Vendor-to-Vendor Marketplace
            </h2>
            <FeatureBadge status="experimental" />
          </div>
          <p className="text-sm text-gray-500">
            Connect with other LAUSD-approved vendors
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {MOCK_VENDORS.map((vendor) => (
          <div
            key={vendor.id}
            className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white font-bold">
              {vendor.logo}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{vendor.name}</h3>
              <p className="text-sm text-gray-500">{vendor.category}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-purple-600">{vendor.integrations}</div>
              <div className="text-xs text-gray-500">Integrations</div>
            </div>
            <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors">
              Connect
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// PREDICTIVE ONBOARDING (Rank 5)
// =============================================================================

export function PredictiveOnboarding() {
  const predictions = [
    { step: "API Integration", completion: 85, suggestion: "Similar vendors complete this in 2 days" },
    { step: "SSO Configuration", completion: 60, suggestion: "You may need IT team involvement" },
    { step: "Data Mapping", completion: 40, suggestion: "Consider using our template" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-pink-100 rounded-lg">
          <Sparkles className="w-6 h-6 text-pink-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Predictive Onboarding Assistant
            </h2>
            <FeatureBadge status="alpha" />
          </div>
          <p className="text-sm text-gray-500">
            AI-powered guidance based on similar vendors
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-pink-600" />
          <span className="font-medium text-pink-900">AI Prediction</span>
        </div>
        <p className="text-sm text-pink-800">
          Based on vendors in your category, you&apos;re likely to complete onboarding
          in <strong>4-5 business days</strong>. Focus on SSO early to avoid delays.
        </p>
      </div>

      <div className="space-y-4">
        {predictions.map((pred) => (
          <div key={pred.step} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">{pred.step}</span>
              <span className="text-sm text-pink-600">{pred.completion}% likely next</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-purple-400"
                style={{ width: `${pred.completion}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{pred.suggestion}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// TEACHER FEEDBACK (Rank 6)
// =============================================================================

export function TeacherFeedback() {
  const feedback = [
    { teacher: "Ms. Rodriguez", rating: 5, comment: "Students love the interactive features!", date: "2 days ago" },
    { teacher: "Mr. Thompson", rating: 4, comment: "Good tool, could use better reporting", date: "1 week ago" },
    { teacher: "Dr. Patel", rating: 5, comment: "Excellent for differentiated instruction", date: "2 weeks ago" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 rounded-lg">
          <MessageSquare className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Teacher Feedback Loop
            </h2>
            <FeatureBadge status="experimental" />
          </div>
          <p className="text-sm text-gray-500">
            Anonymous ratings from classroom educators
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-gray-900">4.7</div>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Heart
                  key={star}
                  className={cn(
                    "w-4 h-4",
                    star <= 4 ? "text-orange-500 fill-orange-500" : "text-gray-300"
                  )}
                />
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-700">127</div>
            <div className="text-sm text-gray-500">Reviews</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {feedback.map((fb, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">{fb.teacher}</span>
              <span className="text-xs text-gray-500">{fb.date}</span>
            </div>
            <div className="flex gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Heart
                  key={star}
                  className={cn(
                    "w-3 h-3",
                    star <= fb.rating ? "text-orange-500 fill-orange-500" : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600">{fb.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MULTI-DISTRICT FEDERATION (Rank 7)
// =============================================================================

export function MultiDistrictFederation() {
  const districts = [
    { name: "LAUSD", status: "active", vendors: 156, color: "bg-green-500" },
    { name: "SFUSD", status: "pending", vendors: 0, color: "bg-yellow-500" },
    { name: "Oakland USD", status: "invited", vendors: 0, color: "bg-gray-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Building2 className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Multi-District Federation
            </h2>
            <FeatureBadge status="experimental" />
          </div>
          <p className="text-sm text-gray-500">
            Integrate once, deploy to multiple CA districts
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-900">Federation Benefits</span>
        </div>
        <p className="text-sm text-blue-800">
          Your integration is automatically available to all federated districts.
          One compliance review covers all.
        </p>
      </div>

      <div className="space-y-3">
        {districts.map((district) => (
          <div
            key={district.name}
            className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4"
          >
            <div className={cn("w-3 h-3 rounded-full", district.color)} />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{district.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{district.status}</p>
            </div>
            {district.vendors > 0 && (
              <div className="text-right">
                <div className="text-lg font-semibold text-blue-600">{district.vendors}</div>
                <div className="text-xs text-gray-500">Vendors</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// ZERO-TOUCH DEPLOYMENT (Rank 8)
// =============================================================================

export function ZeroTouchDeploy() {
  const stages = [
    { name: "Sandbox", status: "deployed", version: "v2.1.0" },
    { name: "Staging", status: "pending", version: "v2.1.0" },
    { name: "Production", status: "locked", version: "v2.0.8" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Rocket className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Zero-Touch Deployment Pipeline
            </h2>
            <FeatureBadge status="alpha" />
          </div>
          <p className="text-sm text-gray-500">
            GitOps-style deployments with compliance gates
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-5 h-5 text-indigo-600" />
          <span className="font-medium text-gray-900">Deployment Pipeline</span>
        </div>

        <div className="flex items-center justify-between">
          {stages.map((stage, i) => (
            <div key={stage.name} className="flex-1 flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium",
                    stage.status === "deployed" && "bg-green-500",
                    stage.status === "pending" && "bg-yellow-500",
                    stage.status === "locked" && "bg-gray-400"
                  )}
                >
                  {i + 1}
                </div>
                <div className="mt-2 text-sm font-medium text-gray-900">{stage.name}</div>
                <div className="text-xs text-gray-500">{stage.version}</div>
              </div>
              {i < stages.length - 1 && (
                <div className="flex-1 h-1 bg-gray-200 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      <button className="w-full py-3 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors">
        Promote v2.1.0 to Staging
      </button>
    </div>
  );
}

// =============================================================================
// PARENT TRANSPARENCY (Rank 9)
// =============================================================================

export function ParentTransparency() {
  const dataAccess = [
    { type: "Student Name", shared: true, purpose: "Account identification" },
    { type: "Grade Level", shared: true, purpose: "Content personalization" },
    { type: "Assessment Scores", shared: true, purpose: "Progress tracking" },
    { type: "Home Address", shared: false, purpose: "Not collected" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-cyan-100 rounded-lg">
          <Eye className="w-6 h-6 text-cyan-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Parent Transparency Portal
            </h2>
            <FeatureBadge status="experimental" />
          </div>
          <p className="text-sm text-gray-500">
            Show parents exactly what data you access
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-5 h-5 text-cyan-600" />
          <span className="font-medium text-cyan-900">Transparency Preview</span>
        </div>
        <p className="text-sm text-cyan-800">
          This is what parents will see about your data practices. Clear, honest disclosure builds trust.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shared</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {dataAccess.map((item) => (
              <tr key={item.type}>
                <td className="px-4 py-3 text-sm text-gray-900">{item.type}</td>
                <td className="px-4 py-3">
                  {item.shared ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Yes</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">No</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// IMPACT ANALYTICS (Rank 10)
// =============================================================================

export function ImpactAnalytics() {
  const metrics = [
    { label: "Student Engagement", value: "+23%", trend: "up" },
    { label: "Time on Task", value: "+15%", trend: "up" },
    { label: "Assignment Completion", value: "+18%", trend: "up" },
    { label: "Teacher Satisfaction", value: "4.7/5", trend: "stable" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <TrendingUp className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Impact Analytics Dashboard
            </h2>
            <FeatureBadge status="experimental" />
          </div>
          <p className="text-sm text-gray-500">
            Track student outcomes with privacy-preserving aggregation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="text-sm text-gray-500 mb-1">{metric.label}</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-emerald-600">{metric.value}</span>
              {metric.trend === "up" && (
                <TrendingUp className="w-5 h-5 text-green-500" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          <span className="font-medium text-emerald-900">AI Insight</span>
        </div>
        <p className="text-sm text-emerald-800">
          Students using your tool show <strong>23% higher engagement</strong> compared
          to district average. This correlates with improved assignment completion rates.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// BARREL EXPORT
// =============================================================================

export {
  SyntheticSandbox as SyntheticSandboxFeature,
  VendorMarketplace as VendorMarketplaceFeature,
  PredictiveOnboarding as PredictiveOnboardingFeature,
  TeacherFeedback as TeacherFeedbackFeature,
  MultiDistrictFederation as MultiDistrictFederationFeature,
  ZeroTouchDeploy as ZeroTouchDeployFeature,
  ParentTransparency as ParentTransparencyFeature,
  ImpactAnalytics as ImpactAnalyticsFeature,
};
