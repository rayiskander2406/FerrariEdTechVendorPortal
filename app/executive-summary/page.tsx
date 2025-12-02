'use client';

import { useState, useEffect } from 'react';

const CORRECT_PASSWORD = 'Priv@cyWINS';
const SESSION_KEY = 'exec-summary-auth';

// SchoolDay Brand Colors from www.schoolday.com
const BRAND = {
  primary: '#0693e3',      // Vivid cyan blue
  primaryDark: '#0577b8',  // Darker blue for hover
  accent: '#b7e4f4',       // Pale cyan blue
  dark: '#32373c',         // Dark charcoal
  text: '#686868',         // Medium gray
  lightBg: '#f2f2f2',      // Off-white background
};

export default function ExecutiveSummary() {
  const [activePhase, setActivePhase] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (session === 'authenticated') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'authenticated');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Password gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${BRAND.dark} 0%, #1a1f24 100%)` }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          {/* SchoolDay Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="https://www.schoolday.com/wp-content/uploads/2025/03/logo.svg"
              alt="SchoolDay"
              className="h-10"
            />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: BRAND.primary }}>Project Ferrari</p>
            <h1 className="text-2xl font-bold mb-2" style={{ color: BRAND.dark }}>Executive Summary</h1>
            <p style={{ color: BRAND.text }}>Vendor Portal Initiative</p>
          </div>

          {/* Lock Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Enter Password to Continue
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-900 placeholder-slate-400"
                placeholder="••••••••••"
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
              style={{ backgroundColor: BRAND.primary }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = BRAND.primaryDark}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = BRAND.primary}
            >
              Access Report
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400 mt-6">
            This document is confidential. Authorized access only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.lightBg }}>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="https://www.schoolday.com/wp-content/uploads/2025/03/logo.svg"
                alt="SchoolDay"
                className="h-8"
              />
            </div>
            <span className="text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full" style={{ backgroundColor: BRAND.accent, color: BRAND.primaryDark }}>
              Project Ferrari
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Title Section */}
        <section className="text-center mb-12 sm:mb-16">
          <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: BRAND.primary }}>
            Project Ferrari
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: BRAND.dark }}>
            SchoolDay Vendor Portal
          </h1>
          <p className="text-lg sm:text-xl max-w-2xl mx-auto" style={{ color: BRAND.text }}>
            Executive Summary for Management
          </p>
          <div className="mt-6 flex justify-center">
            <div className="h-1 w-24 rounded-full" style={{ backgroundColor: BRAND.primary }} />
          </div>
        </section>

        {/* The Problem */}
        <section className="mb-12 sm:mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                The Problem
              </h2>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                Every school district in America faces the same challenge: <strong className="text-slate-900">EdTech vendors need student data to personalize learning</strong>, but sharing that data requires weeks of privacy reviews and manual integration work.
              </p>

              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <p className="text-slate-700 mb-4">
                  <span className="text-2xl font-bold text-slate-900">LAUSD</span> alone has <span className="text-2xl font-bold text-blue-600">670,000 students</span> and <span className="text-2xl font-bold text-blue-600">hundreds of vendors</span>.
                </p>
                <p className="text-slate-600">Each vendor integration currently requires:</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">📋</div>
                  <h3 className="font-semibold text-slate-900">Legal Review</h3>
                  <p className="text-sm text-slate-600">Data sharing agreements</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">🔧</div>
                  <h3 className="font-semibold text-slate-900">Technical Work</h3>
                  <p className="text-sm text-slate-600">SSO, rostering, grades</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">🔒</div>
                  <h3 className="font-semibold text-slate-900">Compliance</h3>
                  <p className="text-sm text-slate-600">Ongoing privacy monitoring</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-amber-800 text-center font-medium">
                  ⏳ This creates a bottleneck where valuable educational tools sit waiting for approval while students miss out on learning opportunities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Solution */}
        <section className="mb-12 sm:mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Our Solution
              </h2>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                <strong className="text-slate-900">SchoolDay</strong> is an AI-powered self-service portal where vendors integrate themselves&mdash;<span className="text-green-600 font-semibold">in minutes instead of weeks</span>&mdash;while student privacy is protected by design.
              </p>

              {/* Tokenization Demo */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🔐</span> The Key Innovation: Tokenization
                </h3>
                <p className="text-slate-700 mb-4">
                  Vendors get everything they need to build personalized learning experiences, but instead of seeing real student data...
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4">
                    <p className="text-xs text-red-600 font-semibold mb-1">❌ TRADITIONAL (PII Exposed)</p>
                    <p className="font-mono text-sm text-red-800">{'"Maria Rodriguez"'}</p>
                    <p className="font-mono text-sm text-red-800">{'"DOB: 03/15/2012"'}</p>
                    <p className="font-mono text-sm text-red-800">{'"SSN: ***-**-1234"'}</p>
                  </div>
                  <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4">
                    <p className="text-xs text-green-600 font-semibold mb-1">✅ SCHOOLDAY (Tokenized)</p>
                    <p className="font-mono text-sm text-green-800">{'"TKN_STU_8X9Y2Z"'}</p>
                    <p className="font-mono text-sm text-green-800">{'"Grade 5"'}</p>
                    <p className="font-mono text-sm text-green-800">{'"Math Period 3"'}</p>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">80%</p>
                  <p className="font-semibold text-slate-900">Auto-Approved</p>
                  <p className="text-sm text-slate-600">Zero human review needed</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">100%</p>
                  <p className="font-semibold text-slate-900">Privacy Protected</p>
                  <p className="text-sm text-slate-600">Identity never exposed</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">100%</p>
                  <p className="font-semibold text-slate-900">Full Control</p>
                  <p className="text-sm text-slate-600">Complete audit trails</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why This Phased Approach */}
        <section className="mb-12 sm:mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Why This Phased Approach
              </h2>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                {"We're building in three phases because"} <strong className="text-slate-900">each phase proves value before adding complexity</strong>:
              </p>

              {/* Phase Cards */}
              <div className="space-y-4">
                <div
                  className="border-l-4 border-blue-500 bg-slate-50 rounded-r-xl p-4 sm:p-6 hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => setActivePhase(activePhase === 0 ? null : 0)}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">🎯</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">Phase 1: PoC</h3>
                      <p className="text-sm text-slate-500 mb-2">3-5 vendors, LAUSD</p>
                      <p className="text-slate-700">Prove the tokenization model works in production with real vendors</p>
                    </div>
                  </div>
                </div>
                <div
                  className="border-l-4 border-indigo-500 bg-slate-50 rounded-r-xl p-4 sm:p-6 hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => setActivePhase(activePhase === 1 ? null : 1)}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">🏫</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">Phase 2: LAUSD Full</h3>
                      <p className="text-sm text-slate-500 mb-2">All vendors, all integrations</p>
                      <p className="text-slate-700">Prove we can handle district-wide scale before expanding</p>
                    </div>
                  </div>
                </div>
                <div
                  className="border-l-4 border-purple-500 bg-slate-50 rounded-r-xl p-4 sm:p-6 hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => setActivePhase(activePhase === 2 ? null : 2)}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">🌐</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">Phase 3: Multi-District</h3>
                      <p className="text-sm text-slate-500 mb-2">5+ large districts</p>
                      <p className="text-slate-700">Prove the platform works across different SIS systems and policies</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-slate-100 rounded-xl">
                <p className="text-slate-700 text-center italic">
                  {'"A vendor portal that works for 3 vendors but breaks at 300 is worthless. A system that works for LAUSD but can\'t adapt to Denver\'s different policies has limited value."'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Where We Are Today */}
        <section className="mb-12 sm:mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Where We Are Today
              </h2>
            </div>
            <div className="p-6 sm:p-8">

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Phase 1: PoC (LAUSD + 3-5 Vendors)</span>
                  <span className="text-sm font-bold text-amber-600">~75% Complete</span>
                </div>
                <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000"
                    style={{ width: '75%' }}
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    We are here
                  </span>
                </div>
              </div>

              {/* Status Grid */}
              <div className="grid sm:grid-cols-3 gap-6">
                {/* Completed */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
                    Completed
                  </h3>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>AI assistant with 12 tools</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Three-tier privacy model</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>All 4 integration types</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>2,239 automated tests</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Demo-ready</span>
                    </li>
                  </ul>
                </div>

                {/* In Progress */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs">⟳</span>
                    In Progress
                  </h3>
                  <ul className="space-y-2 text-sm text-amber-800">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">⟳</span>
                      <span>PostgreSQL infrastructure</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">⟳</span>
                      <span>Vault database for tokens</span>
                    </li>
                  </ul>
                </div>

                {/* Remaining */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-slate-400 rounded-full flex items-center justify-center text-white text-xs">○</span>
                    Remaining
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5">○</span>
                      <span>Seed LAUSD demo data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5">○</span>
                      <span>Connect to LAUSD SIS</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5">○</span>
                      <span>Onboard 3-5 pilot vendors</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What's Remaining by Phase */}
        <section className="mb-12 sm:mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {"What's Remaining by Phase"}
              </h2>
            </div>
            <div className="p-6 sm:p-8">

              {/* Phase 1 */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  Robust PoC (LAUSD + 3-5 Vendors)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 font-semibold text-slate-700">Area</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-700">Status</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-700">{"What's Left"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-3 font-medium text-slate-900">Core Platform</td>
                        <td className="py-2 px-3 text-green-600">✅ Done</td>
                        <td className="py-2 px-3 text-slate-600">&mdash;</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-3 font-medium text-slate-900">Database</td>
                        <td className="py-2 px-3 text-amber-600">🔄 In Progress</td>
                        <td className="py-2 px-3 text-slate-600">Vault database, demo data seeding</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-3 font-medium text-slate-900">LAUSD Integration</td>
                        <td className="py-2 px-3 text-slate-600">Not Started</td>
                        <td className="py-2 px-3 text-slate-600">SIS connection, real data sync</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-3 font-medium text-slate-900">Vendor Onboarding</td>
                        <td className="py-2 px-3 text-slate-600">Not Started</td>
                        <td className="py-2 px-3 text-slate-600">Pilot 3-5 vendors through full flow</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-3 font-medium text-slate-900">Monitoring</td>
                        <td className="py-2 px-3 text-slate-600">Not Started</td>
                        <td className="py-2 px-3 text-slate-600">Basic observability and alerting</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Phase 2 */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  Production-Ready for LAUSD
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full mt-2" />
                    <div>
                      <span className="font-medium text-slate-900">Scale:</span>
                      <span className="text-slate-600 ml-1">Handle hundreds of concurrent vendors</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full mt-2" />
                    <div>
                      <span className="font-medium text-slate-900">Reliability:</span>
                      <span className="text-slate-600 ml-1">99.9% uptime, automated failover</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full mt-2" />
                    <div>
                      <span className="font-medium text-slate-900">Security:</span>
                      <span className="text-slate-600 ml-1">SOC 2 compliance, penetration testing</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full mt-2" />
                    <div>
                      <span className="font-medium text-slate-900">Operations:</span>
                      <span className="text-slate-600 ml-1">Admin dashboard, vendor management</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full mt-2" />
                    <div>
                      <span className="font-medium text-slate-900">Support:</span>
                      <span className="text-slate-600 ml-1">Documentation, escalation paths</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase 3 */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  Multi-District (5+ Large Districts)
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mt-2" />
                    <div>
                      <span className="font-medium text-slate-900">Multi-tenancy:</span>
                      <span className="text-slate-600 ml-1">District isolation, custom branding</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mt-2" />
                    <div>
                      <span className="font-medium text-slate-900">Flexibility:</span>
                      <span className="text-slate-600 ml-1">Support different SIS systems</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mt-2" />
                    <div>
                      <span className="font-medium text-slate-900">Policy Engine:</span>
                      <span className="text-slate-600 ml-1">District-specific privacy rules</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mt-2" />
                    <div>
                      <span className="font-medium text-slate-900">Billing:</span>
                      <span className="text-slate-600 ml-1">Usage tracking, invoicing</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mt-2" />
                    <div>
                      <span className="font-medium text-slate-900">Compliance:</span>
                      <span className="text-slate-600 ml-1">State-specific regulations</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Bottom Line */}
        <section className="mb-12 sm:mb-16">
          <div className="rounded-2xl p-6 sm:p-8 text-white shadow-xl" style={{ background: `linear-gradient(135deg, ${BRAND.dark} 0%, #1a1f24 100%)` }}>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              The Bottom Line
            </h2>
            <p className="text-lg leading-relaxed mb-6" style={{ color: BRAND.accent }}>
              {"We've built the hardest part: "}<strong className="text-white">an AI-powered integration engine that protects student privacy while giving vendors what they need</strong>.
            </p>
            <p className="mb-6" style={{ color: BRAND.accent }}>
              The PoC will prove this works with real vendors at LAUSD. Once proven, scaling to all LAUSD vendors is primarily operational work. Expanding to other districts adds complexity in policy and SIS integration, but the core platform is designed to handle it.
            </p>

            {/* Path Visualization */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 my-8">
              <div className="backdrop-blur rounded-lg px-3 sm:px-4 py-2 text-center" style={{ backgroundColor: 'rgba(6, 147, 227, 0.2)' }}>
                <p className="text-xs" style={{ color: BRAND.accent }}>Phase 1</p>
                <p className="font-bold">PoC</p>
              </div>
              <svg className="w-6 h-6" style={{ color: BRAND.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div className="backdrop-blur rounded-lg px-3 sm:px-4 py-2 text-center" style={{ backgroundColor: 'rgba(6, 147, 227, 0.2)' }}>
                <p className="text-xs" style={{ color: BRAND.accent }}>Phase 2</p>
                <p className="font-bold">LAUSD Full</p>
              </div>
              <svg className="w-6 h-6" style={{ color: BRAND.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div className="backdrop-blur rounded-lg px-3 sm:px-4 py-2 text-center" style={{ backgroundColor: 'rgba(6, 147, 227, 0.2)' }}>
                <p className="text-xs" style={{ color: BRAND.accent }}>Phase 3</p>
                <p className="font-bold">Multi-District</p>
              </div>
            </div>

            <p className="text-center text-lg font-semibold text-white">
              Each phase earns the right to proceed to the next.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <p className="text-xl mb-4" style={{ color: BRAND.text }}>
              Questions? <strong style={{ color: BRAND.dark }}>The platform is demo-ready.</strong>
            </p>
            <p className="text-2xl font-bold" style={{ color: BRAND.primary }}>
              We can show it working today.
            </p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="https://www.schoolday.com/wp-content/uploads/2025/03/logo.svg"
                alt="SchoolDay"
                className="h-6 opacity-60"
              />
            </div>
            <p className="text-sm" style={{ color: BRAND.text }}>
              Project Ferrari &bull; Executive Summary &bull; December 2025
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
