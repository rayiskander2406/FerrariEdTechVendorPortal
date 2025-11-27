"use client";

import { memo, useMemo } from "react";
import {
  FileText,
  Key,
  Settings,
  TestTube,
  MessageSquare,
  ShieldCheck,
  HelpCircle,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VendorState } from "@/lib/hooks/useChat";

// =============================================================================
// TYPES
// =============================================================================

interface SuggestionChipsProps {
  suggestions?: string[];
  onSelect: (suggestion: string) => void;
  vendorState?: VendorState;
  disabled?: boolean;
}

interface Suggestion {
  text: string;
  icon?: React.ReactNode;
  category?: "onboarding" | "integration" | "testing" | "help";
}

// =============================================================================
// DEFAULT SUGGESTIONS
// =============================================================================

const INITIAL_SUGGESTIONS: Suggestion[] = [
  {
    text: "I'm a new vendor and want to integrate with LAUSD",
    icon: <Zap className="w-3.5 h-3.5" />,
    category: "onboarding",
  },
  {
    text: "Check if my company has an existing PoDS",
    icon: <FileText className="w-3.5 h-3.5" />,
    category: "onboarding",
  },
  {
    text: "What is tokenization and how does it work?",
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
    category: "help",
  },
  {
    text: "What data can I access with TOKEN_ONLY tier?",
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    category: "help",
  },
];

const ONBOARDED_SUGGESTIONS: Suggestion[] = [
  {
    text: "Provision my sandbox API credentials",
    icon: <Key className="w-3.5 h-3.5" />,
    category: "integration",
  },
  {
    text: "Configure SSO with Clever",
    icon: <Settings className="w-3.5 h-3.5" />,
    category: "integration",
  },
  {
    text: "Test the OneRoster API",
    icon: <TestTube className="w-3.5 h-3.5" />,
    category: "testing",
  },
  {
    text: "Check my integration status",
    icon: <FileText className="w-3.5 h-3.5" />,
    category: "integration",
  },
];

const WITH_CREDENTIALS_SUGGESTIONS: Suggestion[] = [
  {
    text: "Show me sample student data from the API",
    icon: <TestTube className="w-3.5 h-3.5" />,
    category: "testing",
  },
  {
    text: "Test sending a message through the communication gateway",
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    category: "testing",
  },
  {
    text: "Configure LTI for Schoology integration",
    icon: <Settings className="w-3.5 h-3.5" />,
    category: "integration",
  },
  {
    text: "View my audit logs",
    icon: <FileText className="w-3.5 h-3.5" />,
    category: "integration",
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

export const SuggestionChips = memo(function SuggestionChips({
  suggestions: customSuggestions,
  onSelect,
  vendorState,
  disabled = false,
}: SuggestionChipsProps) {
  // Determine which suggestions to show based on vendor state
  const activeSuggestions = useMemo((): Suggestion[] => {
    // If custom suggestions provided, use those
    if (customSuggestions && customSuggestions.length > 0) {
      return customSuggestions.map((text) => ({ text }));
    }

    // Otherwise, use state-based suggestions
    if (!vendorState) {
      return INITIAL_SUGGESTIONS;
    }

    if (vendorState.credentials) {
      return WITH_CREDENTIALS_SUGGESTIONS;
    }

    if (vendorState.isOnboarded) {
      return ONBOARDED_SUGGESTIONS;
    }

    return INITIAL_SUGGESTIONS;
  }, [customSuggestions, vendorState]);

  if (activeSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden">
      <div
        className={cn(
          "flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
          "-mx-1" // Compensate for padding to allow edge items to touch edges
        )}
        style={{
          scrollbarWidth: "thin",
          msOverflowStyle: "none",
        }}
      >
        {activeSuggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.text}-${index}`}
            onClick={() => onSelect(suggestion.text)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-full",
              "text-sm whitespace-nowrap",
              "bg-white border border-gray-200",
              "text-gray-700",
              "transition-all duration-200",
              "hover:border-primary hover:bg-primary-50 hover:text-primary-700",
              "active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:text-gray-700",
              "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-1",
              // Category-based subtle coloring
              suggestion.category === "onboarding" && "hover:border-success hover:bg-success-50 hover:text-success-700",
              suggestion.category === "testing" && "hover:border-warning hover:bg-warning-50 hover:text-warning-700",
              suggestion.category === "help" && "hover:border-secondary hover:bg-secondary-50 hover:text-secondary-700"
            )}
          >
            {suggestion.icon && (
              <span className="flex-shrink-0 opacity-70">
                {suggestion.icon}
              </span>
            )}
            <span>{suggestion.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

export default SuggestionChips;
