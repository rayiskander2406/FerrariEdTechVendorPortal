"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
  TrendingUp,
  Users,
  CheckCircle,
  Lock,
  Globe,
  Building2,
  GraduationCap,
  DollarSign,
  Target,
  Award,
  ArrowRight,
  Layers,
  BarChart3,
  FileCheck,
  Network,
  Sparkles,
} from "lucide-react";

// Slide data for the presentation
const slides = [
  {
    id: "title",
    type: "title",
    content: {
      title: "EdTech Credit Bureau",
      subtitle: "The Trust Layer for K-12 Education Technology",
      tagline: "Verification-as-a-Service for the $28B EdTech Market",
    },
  },
  {
    id: "problem",
    type: "problem",
    content: {
      title: "The $2.8B Problem",
      headline: "Districts Can't Verify EdTech Vendors at Scale",
      points: [
        {
          icon: "clock",
          title: "Weeks of Manual Review",
          description: "Each vendor takes 2-6 weeks to evaluate",
        },
        {
          icon: "warning",
          title: "13,000+ Vendors",
          description: "No standardized way to assess legitimacy",
        },
        {
          icon: "shield",
          title: "Privacy Risk",
          description: "78% of districts experienced data incidents",
        },
        {
          icon: "dollar",
          title: "Hidden Costs",
          description: "$50K+ annually in compliance overhead",
        },
      ],
    },
  },
  {
    id: "vision",
    type: "vision",
    content: {
      title: "The Vision",
      analogy: {
        left: {
          title: "FICO",
          subtitle: "Consumer Lending",
          flow: ["Credit Score", "Banks", "Loan Decisions", "Standardized Risk"],
        },
        right: {
          title: "SchoolDay",
          subtitle: "EdTech Access",
          flow: [
            "Credibility Score",
            "Districts",
            "Access Decisions",
            "Standardized Trust",
          ],
        },
      },
      tagline:
        "Just as FICO revolutionized lending, SchoolDay will revolutionize EdTech trust.",
    },
  },
  {
    id: "solution",
    type: "solution",
    content: {
      title: "SchoolDay Verification API",
      subtitle: "One API Call. Complete Vendor Credibility.",
      demo: {
        endpoint: "POST /v1/verify",
        input: '{ "vendor": "NewEdTechCo", "website": "https://..." }',
        output: {
          score: 87,
          percentile: "Top 15%",
          recommendation: "AUTO_APPROVE",
          tier: "Full Access Eligible",
        },
      },
    },
  },
  {
    id: "engine",
    type: "engine",
    content: {
      title: "Verification Engine",
      subtitle: "13+ Signals Across 3 Categories",
      categories: [
        {
          name: "Basic Signals",
          count: 5,
          color: "primary",
          signals: [
            "Email Domain Match",
            "Website SSL",
            "Domain Age",
            "LinkedIn Company",
            "Employee Count",
          ],
        },
        {
          name: "Enhanced Signals",
          count: 2,
          color: "secondary",
          signals: ["Applicant LinkedIn", "Corporate Email"],
        },
        {
          name: "Directory Signals",
          count: 8,
          color: "success",
          signals: [
            "1EdTech",
            "Common Sense",
            "SDPC",
            "iKeepSafe",
            "Privacy Pledge",
            "Clever",
            "ClassLink",
            "State Lists",
          ],
        },
      ],
    },
  },
  {
    id: "tiers",
    type: "tiers",
    content: {
      title: "Three-Tier Access Model",
      subtitle: "Score-Based Data Access",
      tiers: [
        {
          name: "Privacy-Safe",
          score: "60+",
          percentage: "80%",
          access: "Tokenized Data Only",
          approval: "Auto-Approved",
          color: "success",
        },
        {
          name: "Selective",
          score: "75+",
          percentage: "15%",
          access: "Limited PII",
          approval: "Review Required",
          color: "warning",
        },
        {
          name: "Full Access",
          score: "85+",
          percentage: "5%",
          access: "Complete PII",
          approval: "Manual Approval",
          color: "error",
        },
      ],
    },
  },
  {
    id: "revenue",
    type: "revenue",
    content: {
      title: "Revenue Model",
      subtitle: "SaaS Pricing with Network Effects",
      tiers: [
        {
          name: "Free",
          price: "$0",
          features: ["100 verifications/mo", "Basic signals", "API access"],
          target: "Adoption",
        },
        {
          name: "Pro",
          price: "$500/mo",
          features: [
            "Unlimited verifications",
            "All 13+ signals",
            "Webhooks & analytics",
          ],
          target: "Revenue",
          highlighted: true,
        },
        {
          name: "Enterprise",
          price: "Custom",
          features: ["SLA guarantee", "Dedicated support", "On-premise option"],
          target: "Enterprise",
        },
      ],
      projection: {
        target: "$3.3M ARR",
        timeline: "18 months",
        districts: "1,000+",
        vendors: "5,000+",
      },
    },
  },
  {
    id: "moat",
    type: "moat",
    content: {
      title: "The Strategic Moat",
      subtitle: "Why This Is Defensible",
      advantages: [
        {
          icon: "network",
          title: "Network Effects",
          description:
            "Every vendor verified + every district contract strengthens the ecosystem",
        },
        {
          icon: "database",
          title: "Data Moat",
          description:
            "Historical verification data becomes irreplaceable competitive advantage",
        },
        {
          icon: "award",
          title: "Trust Authority",
          description:
            "SchoolDay becomes the 'seal of approval' for EdTech vendors",
        },
        {
          icon: "first",
          title: "First Mover",
          description:
            "No competitor offers standardized verification-as-a-service",
        },
      ],
    },
  },
  {
    id: "connection",
    type: "connection",
    content: {
      title: "Connected Ecosystem",
      subtitle: "How It Powers the Vendor Portal",
      flow: [
        {
          step: 1,
          title: "Vendor Applies",
          description: "PoDS-Lite 13-question form",
          icon: "form",
        },
        {
          step: 2,
          title: "Verification API",
          description: "Automated credibility scoring",
          icon: "api",
        },
        {
          step: 3,
          title: "Tier Assignment",
          description: "Privacy-Safe / Selective / Full",
          icon: "tier",
        },
        {
          step: 4,
          title: "Instant Access",
          description: "Auto-approved in minutes",
          icon: "access",
        },
      ],
      vendorPortalBenefit:
        "Districts using our portal get verification built-in. External districts pay for API access.",
    },
  },
  {
    id: "timeline",
    type: "timeline",
    content: {
      title: "Implementation Roadmap",
      subtitle: "16 Weeks to Market",
      phases: [
        {
          name: "Phase 1",
          weeks: "1-4",
          title: "Foundation",
          deliverable: "MVP API with basic verification",
          effort: "60 hrs",
        },
        {
          name: "Phase 2",
          weeks: "5-8",
          title: "Enhanced Signals",
          deliverable: "Full signal coverage + directories",
          effort: "80 hrs",
        },
        {
          name: "Phase 3",
          weeks: "9-12",
          title: "Contracts",
          deliverable: "Production-ready + caching",
          effort: "80 hrs",
        },
        {
          name: "Phase 4",
          weeks: "13-16",
          title: "Commercialize",
          deliverable: "Pricing, billing, docs",
          effort: "60 hrs",
        },
      ],
      total: "280 hours",
    },
  },
  {
    id: "cta",
    type: "cta",
    content: {
      title: "The Opportunity",
      headline: "Become the FICO of EdTech",
      stats: [
        { value: "$3.3M", label: "ARR Target" },
        { value: "1,000", label: "Districts" },
        { value: "5,000", label: "Vendors" },
        { value: "280", label: "Dev Hours" },
      ],
      action: "Let's Build the Trust Layer for K-12",
    },
  },
];

// Icon mapping component
function SlideIcon({
  name,
  className = "w-6 h-6",
}: {
  name: string;
  className?: string;
}) {
  const icons: Record<string, React.ReactNode> = {
    clock: <Zap className={className} />,
    warning: <Shield className={className} />,
    shield: <Lock className={className} />,
    dollar: <DollarSign className={className} />,
    network: <Network className={className} />,
    database: <Layers className={className} />,
    award: <Award className={className} />,
    first: <Sparkles className={className} />,
    form: <FileCheck className={className} />,
    api: <Globe className={className} />,
    tier: <BarChart3 className={className} />,
    access: <CheckCircle className={className} />,
  };
  return <>{icons[name] || <Shield className={className} />}</>;
}

// Title Slide
function TitleSlide({ content }: { content: (typeof slides)[0]["content"] }) {
  const c = content as { title: string; subtitle: string; tagline: string };
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 sm:px-8">
      {/* Logo */}
      <div className="mb-6 sm:mb-8">
        <img
          src="https://www.schoolday.com/wp-content/uploads/2025/03/logo.svg"
          alt="SchoolDay"
          className="h-10 sm:h-12 md:h-14 mx-auto"
        />
      </div>

      {/* Main Title */}
      <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-600 bg-clip-text text-transparent mb-4 sm:mb-6 animate-fade-in-up">
        {c.title}
      </h1>

      {/* Subtitle */}
      <p className="text-xl sm:text-2xl md:text-3xl text-gray-600 mb-6 sm:mb-8 max-w-3xl animate-fade-in-up [animation-delay:200ms]">
        {c.subtitle}
      </p>

      {/* Tagline */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-full px-6 sm:px-8 py-3 sm:py-4 animate-fade-in-up [animation-delay:400ms]">
        <p className="text-base sm:text-lg md:text-xl font-medium text-gray-700">
          {c.tagline}
        </p>
      </div>

      {/* Visual Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-30 animate-pulse-ring" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-100 rounded-full blur-3xl opacity-30 animate-pulse-ring [animation-delay:1s]" />
      </div>
    </div>
  );
}

// Problem Slide
function ProblemSlide({ content }: { content: (typeof slides)[1]["content"] }) {
  const c = content as {
    title: string;
    headline: string;
    points: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  return (
    <div className="flex flex-col h-full px-4 sm:px-8 lg:px-16 py-8">
      <div className="mb-6 sm:mb-8">
        <p className="text-primary-500 font-semibold text-sm sm:text-base uppercase tracking-wider mb-2">
          {c.title}
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900">
          {c.headline}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 flex-1">
        {c.points.map((point, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100
                       transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
                       animate-fade-in-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-error-100 flex items-center justify-center mb-4">
              <SlideIcon
                name={point.icon}
                className="w-6 h-6 sm:w-7 sm:h-7 text-error-600"
              />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
              {point.title}
            </h3>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600">
              {point.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Vision Slide (FICO Analogy)
function VisionSlide({ content }: { content: (typeof slides)[2]["content"] }) {
  const c = content as {
    title: string;
    analogy: {
      left: { title: string; subtitle: string; flow: string[] };
      right: { title: string; subtitle: string; flow: string[] };
    };
    tagline: string;
  };
  return (
    <div className="flex flex-col h-full px-4 sm:px-8 lg:px-16 py-8">
      <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 text-center mb-8 sm:mb-12">
        {c.title}
      </h2>

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8">
        {/* FICO Side */}
        <div className="flex-1 w-full max-w-md">
          <div className="bg-gray-100 rounded-2xl p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-2">
              {c.analogy.left.title}
            </h3>
            <p className="text-gray-500 text-center mb-6">
              {c.analogy.left.subtitle}
            </p>
            <div className="space-y-3">
              {c.analogy.left.flow.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-sm">
                    {i + 1}
                  </div>
                  <span className="text-sm sm:text-base text-gray-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="text-4xl font-light text-gray-300">::</div>
        </div>

        {/* SchoolDay Side */}
        <div className="flex-1 w-full max-w-md">
          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-6 sm:p-8 border-2 border-primary-200">
            <h3 className="text-xl sm:text-2xl font-bold text-primary-700 text-center mb-2">
              {c.analogy.right.title}
            </h3>
            <p className="text-primary-500 text-center mb-6">
              {c.analogy.right.subtitle}
            </p>
            <div className="space-y-3">
              {c.analogy.right.flow.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 animate-fade-in-up"
                  style={{ animationDelay: `${(i + 4) * 100}ms` }}
                >
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
                    {i + 1}
                  </div>
                  <span className="text-sm sm:text-base text-gray-800 font-medium">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-base sm:text-lg lg:text-xl text-gray-600 mt-8 sm:mt-12 max-w-3xl mx-auto italic">
        {c.tagline}
      </p>
    </div>
  );
}

// Solution Slide (API Demo)
function SolutionSlide({
  content,
}: {
  content: (typeof slides)[3]["content"];
}) {
  const c = content as {
    title: string;
    subtitle: string;
    demo: {
      endpoint: string;
      input: string;
      output: {
        score: number;
        percentile: string;
        recommendation: string;
        tier: string;
      };
    };
  };
  return (
    <div className="flex flex-col h-full px-4 sm:px-8 lg:px-16 py-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-4">
          {c.title}
        </h2>
        <p className="text-lg sm:text-xl text-gray-600">{c.subtitle}</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl">
          {/* API Demo */}
          <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
            {/* Terminal Header */}
            <div className="bg-gray-800 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-4 text-gray-400 text-sm font-mono">
                {c.demo.endpoint}
              </span>
            </div>

            {/* Request */}
            <div className="p-4 sm:p-6 border-b border-gray-800">
              <p className="text-gray-400 text-xs sm:text-sm mb-2">Request:</p>
              <pre className="text-green-400 font-mono text-sm sm:text-base overflow-x-auto">
                {c.demo.input}
              </pre>
            </div>

            {/* Response */}
            <div className="p-4 sm:p-6">
              <p className="text-gray-400 text-xs sm:text-sm mb-4">Response:</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">Score</p>
                  <p className="text-4xl sm:text-5xl font-bold text-primary-400">
                    {c.demo.output.score}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">Percentile</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-400">
                    {c.demo.output.percentile}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">Recommendation</p>
                  <p className="text-base sm:text-lg font-bold text-green-400">
                    {c.demo.output.recommendation}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">Tier</p>
                  <p className="text-base sm:text-lg font-bold text-secondary-400">
                    {c.demo.output.tier}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Engine Slide
function EngineSlide({ content }: { content: (typeof slides)[4]["content"] }) {
  const c = content as {
    title: string;
    subtitle: string;
    categories: Array<{
      name: string;
      count: number;
      color: string;
      signals: string[];
    }>;
  };
  const colorClasses: Record<string, string> = {
    primary: "bg-primary-100 border-primary-300 text-primary-700",
    secondary: "bg-secondary-100 border-secondary-300 text-secondary-700",
    success: "bg-success-100 border-success-300 text-success-700",
  };
  const badgeClasses: Record<string, string> = {
    primary: "bg-primary-500",
    secondary: "bg-secondary-500",
    success: "bg-success-500",
  };

  return (
    <div className="flex flex-col h-full px-4 sm:px-8 lg:px-16 py-8">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-2">
          {c.title}
        </h2>
        <p className="text-lg sm:text-xl text-gray-600">{c.subtitle}</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {c.categories.map((cat, i) => (
          <div
            key={i}
            className={`rounded-2xl p-4 sm:p-6 border-2 ${colorClasses[cat.color]} animate-fade-in-up`}
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`${badgeClasses[cat.color]} text-white text-xl sm:text-2xl font-bold w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center`}
              >
                {cat.count}
              </span>
              <h3 className="text-lg sm:text-xl font-bold">{cat.name}</h3>
            </div>
            <ul className="space-y-2">
              {cat.signals.map((signal, j) => (
                <li key={j} className="flex items-center gap-2 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tiers Slide
function TiersSlide({ content }: { content: (typeof slides)[5]["content"] }) {
  const c = content as {
    title: string;
    subtitle: string;
    tiers: Array<{
      name: string;
      score: string;
      percentage: string;
      access: string;
      approval: string;
      color: string;
    }>;
  };
  const colorClasses: Record<string, { bg: string; text: string; bar: string }> = {
    success: {
      bg: "bg-success-50",
      text: "text-success-700",
      bar: "bg-success-500",
    },
    warning: {
      bg: "bg-warning-50",
      text: "text-warning-700",
      bar: "bg-warning-500",
    },
    error: { bg: "bg-error-50", text: "text-error-700", bar: "bg-error-500" },
  };

  const defaultColorClass = { bg: "bg-gray-50", text: "text-gray-700", bar: "bg-gray-500" };

  return (
    <div className="flex flex-col h-full px-4 sm:px-8 lg:px-16 py-8">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-2">
          {c.title}
        </h2>
        <p className="text-lg sm:text-xl text-gray-600">{c.subtitle}</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl space-y-4 sm:space-y-6">
          {c.tiers.map((tier, i) => {
            const colors = colorClasses[tier.color] ?? defaultColorClass;
            return (
              <div
                key={i}
                className={`${colors.bg} rounded-2xl p-4 sm:p-6 animate-fade-in-up`}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-shrink-0">
                    <div
                      className={`${colors.text} text-2xl sm:text-3xl font-bold`}
                    >
                      {tier.name}
                    </div>
                    <div className="text-gray-500 text-sm">
                      Score: {tier.score}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.bar} transition-all duration-1000`}
                        style={{ width: tier.percentage }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {tier.percentage} of vendors
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                    <div className="bg-white rounded-lg px-3 py-2">
                      <span className="text-gray-500">Access:</span>{" "}
                      <span className="font-medium">{tier.access}</span>
                    </div>
                    <div className="bg-white rounded-lg px-3 py-2">
                      <span className="text-gray-500">Approval:</span>{" "}
                      <span className="font-medium">{tier.approval}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Revenue Slide
function RevenueSlide({ content }: { content: (typeof slides)[6]["content"] }) {
  const c = content as {
    title: string;
    subtitle: string;
    tiers: Array<{
      name: string;
      price: string;
      features: string[];
      target: string;
      highlighted?: boolean;
    }>;
    projection: {
      target: string;
      timeline: string;
      districts: string;
      vendors: string;
    };
  };

  return (
    <div className="flex flex-col h-full px-4 sm:px-8 lg:px-16 py-8">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-2">
          {c.title}
        </h2>
        <p className="text-lg sm:text-xl text-gray-600">{c.subtitle}</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {c.tiers.map((tier, i) => (
          <div
            key={i}
            className={`rounded-2xl p-4 sm:p-6 ${
              tier.highlighted
                ? "bg-gradient-to-br from-primary-500 to-secondary-500 text-white ring-4 ring-primary-200"
                : "bg-white border-2 border-gray-200"
            } animate-fade-in-up`}
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div className="text-center mb-4">
              <h3
                className={`text-xl sm:text-2xl font-bold ${tier.highlighted ? "text-white" : "text-gray-900"}`}
              >
                {tier.name}
              </h3>
              <p
                className={`text-3xl sm:text-4xl font-bold mt-2 ${tier.highlighted ? "text-white" : "text-primary-500"}`}
              >
                {tier.price}
              </p>
              <p
                className={`text-sm ${tier.highlighted ? "text-white/80" : "text-gray-500"}`}
              >
                {tier.target}
              </p>
            </div>
            <ul className="space-y-2">
              {tier.features.map((feature, j) => (
                <li key={j} className="flex items-center gap-2 text-sm sm:text-base">
                  <CheckCircle
                    className={`w-4 h-4 flex-shrink-0 ${tier.highlighted ? "text-white" : "text-success-500"}`}
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Projection */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-primary-600">
              {c.projection.target}
            </p>
            <p className="text-sm text-gray-600">Target ARR</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-primary-600">
              {c.projection.timeline}
            </p>
            <p className="text-sm text-gray-600">Timeline</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-primary-600">
              {c.projection.districts}
            </p>
            <p className="text-sm text-gray-600">Districts</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-primary-600">
              {c.projection.vendors}
            </p>
            <p className="text-sm text-gray-600">Vendors</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Moat Slide
function MoatSlide({ content }: { content: (typeof slides)[7]["content"] }) {
  const c = content as {
    title: string;
    subtitle: string;
    advantages: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };

  return (
    <div className="flex flex-col h-full px-4 sm:px-8 lg:px-16 py-8">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-2">
          {c.title}
        </h2>
        <p className="text-lg sm:text-xl text-gray-600">{c.subtitle}</p>
      </div>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {c.advantages.map((adv, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100
                       transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
                       animate-fade-in-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center mb-4">
              <SlideIcon
                name={adv.icon}
                className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600"
              />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
              {adv.title}
            </h3>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600">
              {adv.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Connection Slide
function ConnectionSlide({
  content,
}: {
  content: (typeof slides)[8]["content"];
}) {
  const c = content as {
    title: string;
    subtitle: string;
    flow: Array<{
      step: number;
      title: string;
      description: string;
      icon: string;
    }>;
    vendorPortalBenefit: string;
  };

  return (
    <div className="flex flex-col h-full px-4 sm:px-8 lg:px-16 py-8">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-2">
          {c.title}
        </h2>
        <p className="text-lg sm:text-xl text-gray-600">{c.subtitle}</p>
      </div>

      {/* Flow */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {c.flow.map((step, i) => (
              <div
                key={i}
                className="relative animate-fade-in-up"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {step.step}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center mx-auto mb-3">
                    <SlideIcon
                      name={step.icon}
                      className="w-5 h-5 text-primary-600"
                    />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                {i < c.flow.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 transform -translate-y-1/2">
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Benefit callout */}
          <div className="mt-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-4 sm:p-6 text-white text-center">
            <p className="text-base sm:text-lg font-medium">
              {c.vendorPortalBenefit}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Timeline Slide
function TimelineSlide({
  content,
}: {
  content: (typeof slides)[9]["content"];
}) {
  const c = content as {
    title: string;
    subtitle: string;
    phases: Array<{
      name: string;
      weeks: string;
      title: string;
      deliverable: string;
      effort: string;
    }>;
    total: string;
  };

  return (
    <div className="flex flex-col h-full px-4 sm:px-8 lg:px-16 py-8">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-2">
          {c.title}
        </h2>
        <p className="text-lg sm:text-xl text-gray-600">{c.subtitle}</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl">
          {/* Timeline */}
          <div className="relative">
            {/* Line */}
            <div className="hidden sm:block absolute left-0 right-0 top-8 h-1 bg-gray-200 rounded-full" />

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-0">
              {c.phases.map((phase, i) => (
                <div
                  key={i}
                  className="relative animate-fade-in-up"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  {/* Circle */}
                  <div className="hidden sm:flex w-16 h-16 rounded-full bg-primary-500 text-white items-center justify-center mx-auto mb-4 relative z-10">
                    <div className="text-center">
                      <div className="text-xs">Wk</div>
                      <div className="font-bold">{phase.weeks}</div>
                    </div>
                  </div>

                  {/* Card */}
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                    <div className="sm:hidden flex items-center gap-2 mb-2">
                      <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded">
                        Weeks {phase.weeks}
                      </span>
                      <span className="text-xs text-gray-500">
                        {phase.effort}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900">{phase.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {phase.deliverable}
                    </p>
                    <div className="hidden sm:block mt-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {phase.effort}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-6 py-3 rounded-full">
              <TrendingUp className="w-5 h-5" />
              <span className="font-bold">Total: {c.total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// CTA Slide
function CTASlide({ content }: { content: (typeof slides)[10]["content"] }) {
  const c = content as {
    title: string;
    headline: string;
    stats: Array<{ value: string; label: string }>;
    action: string;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-40 animate-pulse-ring" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-100 rounded-full blur-3xl opacity-40 animate-pulse-ring [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary-50 to-secondary-50 rounded-full blur-3xl opacity-30" />
      </div>

      <p className="text-primary-500 font-semibold text-sm sm:text-base uppercase tracking-wider mb-4 relative z-10">
        {c.title}
      </p>

      <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-8 sm:mb-12 relative z-10">
        {c.headline}
      </h2>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 mb-8 sm:mb-12 relative z-10">
        {c.stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg animate-fade-in-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              {stat.value}
            </p>
            <p className="text-sm sm:text-base text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <button className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-full text-lg sm:text-xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 relative z-10">
        {c.action}
      </button>

      {/* Logo */}
      <div className="mt-8 sm:mt-12 relative z-10">
        <img
          src="https://www.schoolday.com/wp-content/uploads/2025/03/logo.svg"
          alt="SchoolDay"
          className="h-8 sm:h-10 mx-auto opacity-50"
        />
      </div>
    </div>
  );
}

// Slide renderer
function renderSlide(slide: (typeof slides)[number]) {
  switch (slide.type) {
    case "title":
      return <TitleSlide content={slide.content} />;
    case "problem":
      return <ProblemSlide content={slide.content} />;
    case "vision":
      return <VisionSlide content={slide.content} />;
    case "solution":
      return <SolutionSlide content={slide.content} />;
    case "engine":
      return <EngineSlide content={slide.content} />;
    case "tiers":
      return <TiersSlide content={slide.content} />;
    case "revenue":
      return <RevenueSlide content={slide.content} />;
    case "moat":
      return <MoatSlide content={slide.content} />;
    case "connection":
      return <ConnectionSlide content={slide.content} />;
    case "timeline":
      return <TimelineSlide content={slide.content} />;
    case "cta":
      return <CTASlide content={slide.content} />;
    default:
      return null;
  }
}

// Main Presentation Component
export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goToSlide = useCallback(
    (index: number) => {
      if (isAnimating || index === currentSlide) return;
      if (index < 0 || index >= slides.length) return;

      setIsAnimating(true);
      setCurrentSlide(index);
      setTimeout(() => setIsAnimating(false), 500);
    },
    [currentSlide, isAnimating]
  );

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Touch navigation
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) setTouchStart(touch.clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const touchEnd = touch.clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    setTouchStart(null);
  };

  return (
    <div
      className="h-screen w-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <header className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-2 sm:py-3 flex items-center justify-between z-50">
        <img
          src="https://www.schoolday.com/wp-content/uploads/2025/03/logo.svg"
          alt="SchoolDay"
          className="h-6 sm:h-8"
        />
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs sm:text-sm text-gray-500">
            {currentSlide + 1} / {slides.length}
          </span>
          <a
            href="https://www.schoolday.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm text-primary-500 hover:text-primary-600 font-medium"
          >
            www.schoolday.com
          </a>
        </div>
      </header>

      {/* Slide Content */}
      <main className="flex-1 relative overflow-hidden">
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${isAnimating ? "opacity-0" : "opacity-100"}`}
        >
          {slides[currentSlide] && renderSlide(slides[currentSlide])}
        </div>
      </main>

      {/* Navigation */}
      <footer className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Previous Button */}
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline text-sm font-medium">Previous</span>
          </button>

          {/* Slide Dots */}
          <div className="flex gap-1 sm:gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                  i === currentSlide
                    ? "bg-primary-500 scale-125"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <span className="hidden sm:inline text-sm font-medium">Next</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
