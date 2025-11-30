/**
 * Skeleton Loading Components
 *
 * Provides loading placeholders with shimmer effects
 */

import React from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// BASE SKELETON
// =============================================================================

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-gray-200 rounded animate-pulse",
        className
      )}
    />
  );
}

// =============================================================================
// SKELETON WITH SHIMMER
// =============================================================================

export function SkeletonShimmer({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded animate-shimmer",
        className
      )}
    />
  );
}

// =============================================================================
// SKELETON TEXT
// =============================================================================

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 1, className }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonShimmer
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

// =============================================================================
// CREDENTIALS SKELETON
// =============================================================================

export function CredentialsSkeleton() {
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 bg-gray-700" />
          <Skeleton className="h-5 w-32 bg-gray-700" />
        </div>
        <Skeleton className="h-6 w-16 bg-gray-700" />
      </div>

      {/* Credential Rows */}
      <div className="divide-y divide-gray-800">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="px-4 py-3 flex items-center justify-between gap-4"
          >
            <div className="flex-1">
              <Skeleton className="h-3 w-16 bg-gray-700 mb-2" />
              <SkeletonShimmer className="h-4 w-48 bg-gray-700" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="w-8 h-8 bg-gray-700" />
              <Skeleton className="w-8 h-8 bg-gray-700" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/50 flex items-center justify-between">
        <Skeleton className="h-4 w-40 bg-gray-700" />
        <Skeleton className="h-4 w-24 bg-gray-700" />
      </div>
    </div>
  );
}

// =============================================================================
// MESSAGE SKELETON
// =============================================================================

export function MessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <Skeleton
        className={cn(
          "w-8 h-8 rounded-full flex-shrink-0",
          isUser ? "bg-primary/30" : "bg-secondary-100"
        )}
      />

      {/* Content */}
      <div
        className={cn(
          "flex flex-col max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        {!isUser && (
          <Skeleton className="h-3 w-24 mb-2" />
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-primary/20 rounded-br-md"
              : "bg-white border border-gray-100 rounded-bl-md shadow-sm"
          )}
        >
          <SkeletonText lines={2} className="w-48" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// FORM SKELETON
// =============================================================================

export function FormSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Form fields */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <SkeletonShimmer className="h-10 w-full" />
        </div>
      ))}

      {/* Submit button */}
      <div className="pt-4">
        <SkeletonShimmer className="h-10 w-full" />
      </div>
    </div>
  );
}

// =============================================================================
// CARD SKELETON
// =============================================================================

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <SkeletonShimmer className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export default Skeleton;
