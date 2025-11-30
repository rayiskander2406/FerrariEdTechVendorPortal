"use client";

import React, { memo } from "react";
import { Bot } from "lucide-react";

// =============================================================================
// TYPING INDICATOR
// =============================================================================

export const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center">
        <Bot className="w-4 h-4" />
      </div>

      {/* Bubble with dots */}
      <div className="flex flex-col items-start">
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-1 text-xs text-gray-500">
          <span>Integration Assistant</span>
        </div>

        {/* Dots container */}
        <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-1">
            <span
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms", animationDuration: "600ms" }}
            />
            <span
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms", animationDuration: "600ms" }}
            />
            <span
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms", animationDuration: "600ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default TypingIndicator;
