'use client';

/**
 * TopNav Component
 *
 * Top navigation bar for Portal 2.0 dashboard.
 * Features:
 * - Vendor name and tier badge
 * - AI help trigger (Cmd+K)
 * - Notifications
 * - User menu
 * - Mobile sidebar toggle
 */

import React from 'react';
import { Bell, HelpCircle, Menu, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// =============================================================================
// TYPES
// =============================================================================

interface TopNavProps {
  /** Vendor display name */
  vendorName?: string;
  /** Privacy tier */
  tier?: 'PRIVACY_SAFE' | 'SELECTIVE' | 'FULL_ACCESS';
  /** Callback when mobile menu button clicked */
  onMenuClick?: () => void;
  /** Callback when AI help triggered */
  onAIHelpClick?: () => void;
  /** Number of unread notifications */
  notificationCount?: number;
  className?: string;
}

// =============================================================================
// TIER BADGE COMPONENT
// =============================================================================

const tierConfig = {
  PRIVACY_SAFE: {
    label: 'Privacy-Safe',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
  SELECTIVE: {
    label: 'Selective',
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  },
  FULL_ACCESS: {
    label: 'Full Access',
    variant: 'destructive' as const,
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  },
};

function TierBadge({ tier }: { tier: TopNavProps['tier'] }) {
  if (!tier) return null;
  const config = tierConfig[tier];

  return (
    <Badge
      data-testid="tier-badge"
      variant={config.variant}
      className={config.className}
    >
      {config.label}
    </Badge>
  );
}

// =============================================================================
// TOPNAV COMPONENT
// =============================================================================

export function TopNav({
  vendorName = 'Vendor',
  tier = 'PRIVACY_SAFE',
  onMenuClick,
  onAIHelpClick,
  notificationCount = 0,
  className,
}: TopNavProps) {
  return (
    <TooltipProvider>
      <header
        data-testid="topnav"
        className={cn(
          'flex h-16 items-center justify-between border-b border-border bg-background px-4',
          className
        )}
      >
        {/* Left Section: Mobile Menu + Vendor Info */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            aria-label="Toggle sidebar"
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Vendor Name and Tier */}
          <div className="flex items-center gap-3">
            <span
              data-testid="vendor-name"
              className="text-sm font-medium text-foreground"
            >
              {vendorName}
            </span>
            <TierBadge tier={tier} />
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-2">
          {/* AI Help Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onAIHelpClick}
                aria-label="AI Help"
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Ask AI</span>
                <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open AI Assistant (⌘K)</p>
            </TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifications"
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>

          {/* Help */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Help">
                <HelpCircle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Help & Documentation</p>
            </TooltipContent>
          </Tooltip>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="User menu"
                className="rounded-full"
              >
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>API Keys</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </TooltipProvider>
  );
}

export default TopNav;
