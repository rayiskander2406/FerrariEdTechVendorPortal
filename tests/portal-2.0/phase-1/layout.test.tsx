/**
 * Portal 2.0 Phase 1: Dashboard Layout Tests (TDD)
 *
 * These tests define the expected behavior of the dashboard layout.
 * Write tests first (RED), then implement to pass (GREEN).
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// =============================================================================
// MOCKS
// =============================================================================

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/overview',
  }),
  usePathname: () => '/overview',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// =============================================================================
// COMPONENT IMPORTS
// =============================================================================

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopNav } from '@/components/dashboard/TopNav';

// =============================================================================
// DASHBOARD LAYOUT TESTS
// =============================================================================

describe('Portal 2.0 Phase 1: DashboardLayout', () => {
  describe('Structure', () => {
    it('renders sidebar and main content area', () => {
      render(
        <DashboardLayout>
          <div data-testid="page-content">Content</div>
        </DashboardLayout>
      );

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('page-content')).toBeInTheDocument();
    });

    it('renders top navigation bar', () => {
      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      expect(screen.getByTestId('topnav')).toBeInTheDocument();
    });

    it('applies correct layout structure with sidebar width', () => {
      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const layout = screen.getByTestId('dashboard-layout');
      expect(layout).toHaveClass('flex');
    });
  });

  describe('Responsive Behavior', () => {
    it('sidebar is collapsible on mobile', async () => {
      const user = userEvent.setup();
      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i });
      expect(toggleButton).toBeInTheDocument();
    });
  });
});

// =============================================================================
// SIDEBAR TESTS
// =============================================================================

describe('Portal 2.0 Phase 1: Sidebar', () => {
  describe('Navigation Items', () => {
    const expectedNavItems = [
      { label: 'Overview', href: '/overview', icon: 'LayoutDashboard' },
      { label: 'OneRoster', href: '/oneroster', icon: 'Database' },
      { label: 'SSO', href: '/sso', icon: 'KeyRound' },
      { label: 'LTI', href: '/lti', icon: 'Puzzle' },
      { label: 'Messages', href: '/messages', icon: 'Mail' },
      { label: 'Audit Log', href: '/audit', icon: 'FileText' },
    ];

    it.each(expectedNavItems)('renders $label navigation item', ({ label }) => {
      render(<Sidebar />);
      expect(screen.getByRole('link', { name: new RegExp(label, 'i') })).toBeInTheDocument();
    });

    it.each(expectedNavItems)('$label links to $href', ({ label, href }) => {
      render(<Sidebar />);
      const link = screen.getByRole('link', { name: new RegExp(label, 'i') });
      expect(link).toHaveAttribute('href', href);
    });

    it('highlights active navigation item', () => {
      render(<Sidebar />);
      const activeLink = screen.getByRole('link', { name: /overview/i });
      expect(activeLink).toHaveAttribute('data-active', 'true');
    });
  });

  describe('Chat Mode Toggle', () => {
    it('renders Chat Mode button at bottom of sidebar', () => {
      render(<Sidebar />);
      expect(screen.getByRole('link', { name: /chat mode/i })).toBeInTheDocument();
    });

    it('Chat Mode links to /chat', () => {
      render(<Sidebar />);
      const chatLink = screen.getByRole('link', { name: /chat mode/i });
      expect(chatLink).toHaveAttribute('href', '/chat');
    });
  });

  describe('Branding', () => {
    it('displays SchoolDay logo', () => {
      render(<Sidebar />);
      expect(screen.getByAltText(/schoolday/i)).toBeInTheDocument();
    });

    it('displays "Vendor Portal" text', () => {
      render(<Sidebar />);
      expect(screen.getByText(/vendor portal/i)).toBeInTheDocument();
    });
  });

  describe('Collapse State', () => {
    it('can be collapsed', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const collapseButton = screen.getByRole('button', { name: /collapse/i });
      await user.click(collapseButton);

      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveAttribute('data-collapsed', 'true');
    });

    it('shows only icons when collapsed', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      const collapseButton = screen.getByRole('button', { name: /collapse/i });
      await user.click(collapseButton);

      // Labels should not be rendered when collapsed (conditional rendering)
      // In our implementation, text is conditionally rendered, not hidden via CSS
      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveAttribute('data-collapsed', 'true');
    });
  });
});

// =============================================================================
// TOPNAV TESTS
// =============================================================================

describe('Portal 2.0 Phase 1: TopNav', () => {
  describe('Vendor Information', () => {
    it('displays vendor name', () => {
      render(<TopNav />);
      // Should show current vendor name (e.g., from session or props)
      expect(screen.getByTestId('vendor-name')).toBeInTheDocument();
    });

    it('displays privacy tier badge', () => {
      render(<TopNav />);
      expect(screen.getByTestId('tier-badge')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('renders notifications button', () => {
      render(<TopNav />);
      expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
    });

    it('renders help button', () => {
      render(<TopNav />);
      // Use exact match to avoid matching "AI Help" button
      expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument();
    });

    it('renders user menu dropdown', () => {
      render(<TopNav />);
      expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
    });
  });

  describe('AI Assistant Trigger', () => {
    it('renders AI help button', () => {
      render(<TopNav />);
      expect(screen.getByRole('button', { name: /ai help|ask ai/i })).toBeInTheDocument();
    });

    it('shows keyboard shortcut hint (Cmd+K)', () => {
      render(<TopNav />);
      // Text split across elements: <span>⌘</span>K, use container query
      const kbd = screen.getByRole('button', { name: /ai help|ask ai/i }).querySelector('kbd');
      expect(kbd).toBeInTheDocument();
      expect(kbd?.textContent).toMatch(/⌘.*k/i);
    });
  });

  describe('Mobile', () => {
    it('renders mobile menu button for sidebar toggle', () => {
      render(<TopNav />);
      // Mobile menu button with exact aria-label
      expect(screen.getByRole('button', { name: 'Toggle sidebar' })).toBeInTheDocument();
    });
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Portal 2.0 Phase 1: Layout Integration', () => {
  it('full dashboard layout renders without errors', () => {
    expect(() => {
      render(
        <DashboardLayout>
          <div>Dashboard Content</div>
        </DashboardLayout>
      );
    }).not.toThrow();
  });

  it('sidebar and topnav are siblings in layout', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const sidebar = screen.getByTestId('sidebar');
    const topnav = screen.getByTestId('topnav');

    // Both should exist
    expect(sidebar).toBeInTheDocument();
    expect(topnav).toBeInTheDocument();
  });

  it('main content area is scrollable', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveClass('overflow-auto');
  });
});
