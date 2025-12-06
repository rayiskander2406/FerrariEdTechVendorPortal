/**
 * Navigation Configuration
 *
 * Single source of truth for dashboard navigation items.
 * Used by Sidebar component and routing validation.
 */

import {
  LayoutDashboard,
  Database,
  KeyRound,
  Puzzle,
  Mail,
  FileText,
  Settings,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export interface NavItem {
  /** Display label */
  label: string;
  /** Route href */
  href: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Optional description for tooltips */
  description?: string;
  /** Optional badge count */
  badge?: number;
}

export interface NavSection {
  /** Section title (optional, for grouping) */
  title?: string;
  /** Navigation items in this section */
  items: NavItem[];
}

// =============================================================================
// DASHBOARD NAVIGATION
// =============================================================================

/**
 * Main dashboard navigation items
 */
export const DASHBOARD_NAV: NavItem[] = [
  {
    label: 'Overview',
    href: '/overview',
    icon: LayoutDashboard,
    description: 'Dashboard home with status overview',
  },
  {
    label: 'OneRoster',
    href: '/oneroster',
    icon: Database,
    description: 'API credentials and endpoint testing',
  },
  {
    label: 'SSO',
    href: '/sso',
    icon: KeyRound,
    description: 'Single sign-on configuration',
  },
  {
    label: 'LTI',
    href: '/lti',
    icon: Puzzle,
    description: 'LTI 1.3 integration settings',
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: Mail,
    description: 'Communication gateway',
  },
  {
    label: 'Audit Log',
    href: '/audit',
    icon: FileText,
    description: 'Activity and access logs',
  },
];

/**
 * Account/settings navigation items
 */
export const ACCOUNT_NAV: NavItem[] = [
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Account and preferences',
  },
];

/**
 * Chat mode navigation (legacy fallback)
 */
export const CHAT_NAV: NavItem = {
  label: 'Chat Mode',
  href: '/chat',
  icon: MessageSquare,
  description: 'AI-powered conversational interface',
};

// =============================================================================
// NAVIGATION HELPERS
// =============================================================================

/**
 * Get all navigation items as flat array
 */
export function getAllNavItems(): NavItem[] {
  return [...DASHBOARD_NAV, ...ACCOUNT_NAV, CHAT_NAV];
}

/**
 * Find nav item by href
 */
export function getNavItemByHref(href: string): NavItem | undefined {
  return getAllNavItems().find((item) => item.href === href);
}

/**
 * Check if a path matches a nav item (handles nested routes)
 */
export function isNavItemActive(itemHref: string, currentPath: string): boolean {
  if (itemHref === '/overview' && currentPath === '/') {
    return true;
  }
  return currentPath.startsWith(itemHref);
}

/**
 * Navigation sections for grouped display
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Integrations',
    items: DASHBOARD_NAV,
  },
  {
    title: 'Account',
    items: ACCOUNT_NAV,
  },
];
