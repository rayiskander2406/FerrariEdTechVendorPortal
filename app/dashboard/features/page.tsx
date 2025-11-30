"use client";

import { FeatureFlagsDashboard } from "@/components/dashboard/FeatureFlagsDashboard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function FeatureFlagsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Chat
          </Link>
          <span className="text-sm text-gray-500">
            SchoolDay Vendor Portal
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <FeatureFlagsDashboard />
      </main>
    </div>
  );
}
