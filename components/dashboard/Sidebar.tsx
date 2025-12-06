'use client';

/**
 * Sidebar Component
 *
 * Main navigation sidebar for Portal 2.0 dashboard.
 * Features:
 * - Navigation items with icons
 * - Active state highlighting
 * - Collapsible mode
 * - Chat Mode toggle at bottom
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DASHBOARD_NAV,
  ACCOUNT_NAV,
  CHAT_NAV,
  isNavItemActive,
  type NavItem,
} from '@/lib/config/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// =============================================================================
// TYPES
// =============================================================================

interface SidebarProps {
  className?: string;
}

// =============================================================================
// NAV ITEM COMPONENT
// =============================================================================

interface NavItemProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
}

function NavItemLink({ item, isActive, isCollapsed }: NavItemProps) {
  const Icon = item.icon;

  const linkContent = (
    <Link
      href={item.href}
      data-active={isActive}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/70',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && <span>{item.label}</span>}
      {!isCollapsed && item.badge !== undefined && (
        <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.label}
          {item.description && (
            <span className="text-muted-foreground text-xs">
              {item.description}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

// =============================================================================
// SIDEBAR COMPONENT
// =============================================================================

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        data-testid="sidebar"
        data-collapsed={isCollapsed}
        className={cn(
          'flex h-screen flex-col border-r border-sidebar-border bg-sidebar-background',
          'transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-[var(--sidebar-width)]',
          className
        )}
      >
        {/* Logo / Brand */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!isCollapsed && (
            <Link href="/overview" className="flex items-center gap-2">
              <img
                src="/schoolday-logo.svg"
                alt="SchoolDay"
                className="h-8 w-8"
                onError={(e) => {
                  // Fallback if logo doesn't exist
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-sidebar-foreground">
                  SchoolDay
                </span>
                <span className="text-xs text-sidebar-foreground/60">
                  Vendor Portal
                </span>
              </div>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/overview" className="mx-auto">
              <img
                src="/schoolday-logo.svg"
                alt="SchoolDay"
                className="h-8 w-8"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </Link>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {/* Integration Links */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
                Integrations
              </span>
            )}
            {DASHBOARD_NAV.map((item) => (
              <NavItemLink
                key={item.href}
                item={item}
                isActive={isNavItemActive(item.href, pathname)}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>

          <Separator className="my-4" />

          {/* Account Links */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
                Account
              </span>
            )}
            {ACCOUNT_NAV.map((item) => (
              <NavItemLink
                key={item.href}
                item={item}
                isActive={isNavItemActive(item.href, pathname)}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          {/* Chat Mode Toggle */}
          <NavItemLink
            item={CHAT_NAV}
            isActive={isNavItemActive(CHAT_NAV.href, pathname)}
            isCollapsed={isCollapsed}
          />

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'w-full justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground',
              isCollapsed ? 'px-2' : 'px-3'
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

export default Sidebar;
