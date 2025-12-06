'use client';

/**
 * DashboardLayout Component
 *
 * Main layout wrapper for Portal 2.0 dashboard pages.
 * Combines Sidebar, TopNav, and main content area.
 *
 * Structure:
 * ┌──────────┬─────────────────────────────────────┐
 * │          │           TopNav                    │
 * │          ├─────────────────────────────────────┤
 * │ Sidebar  │                                     │
 * │          │         Main Content                │
 * │          │         (children)                  │
 * │          │                                     │
 * └──────────┴─────────────────────────────────────┘
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

// =============================================================================
// TYPES
// =============================================================================

interface DashboardLayoutProps {
  /** Page content */
  children: React.ReactNode;
  /** Vendor display name */
  vendorName?: string;
  /** Privacy tier */
  tier?: 'PRIVACY_SAFE' | 'SELECTIVE' | 'FULL_ACCESS';
  /** Number of unread notifications */
  notificationCount?: number;
  className?: string;
}

// =============================================================================
// DASHBOARD LAYOUT COMPONENT
// =============================================================================

export function DashboardLayout({
  children,
  vendorName = 'Vendor',
  tier = 'PRIVACY_SAFE',
  notificationCount = 0,
  className,
}: DashboardLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleAIHelpClick = () => {
    // Future: Open AI command palette (Cmd+K)
    console.log('AI Help triggered');
  };

  return (
    <div
      data-testid="dashboard-layout"
      className={cn('flex h-screen bg-background', className)}
    >
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Sidebar - Mobile Overlay */}
      {isMobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <Sidebar />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNav
          vendorName={vendorName}
          tier={tier}
          onMenuClick={handleMenuClick}
          onAIHelpClick={handleAIHelpClick}
          notificationCount={notificationCount}
        />

        {/* Page Content */}
        <main
          role="main"
          className={cn(
            'flex-1 overflow-auto',
            'bg-background p-6'
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
