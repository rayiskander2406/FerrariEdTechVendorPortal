"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Monitor,
  MessageSquare,
  FileText,
  MousePointer,
  Eye,
  Copy,
  Check,
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemo, DEMO_WORKFLOWS } from "@/lib/demo";
import type { DemoStep } from "@/lib/demo/demo-workflows";

// =============================================================================
// STEP TYPE ICONS
// =============================================================================

function StepIcon({ type, className }: { type: DemoStep["type"]; className?: string }) {
  const iconClass = cn("w-4 h-4", className);
  switch (type) {
    case "message":
      return <MessageSquare className={iconClass} />;
    case "form":
      return <FileText className={iconClass} />;
    case "action":
      return <MousePointer className={iconClass} />;
    case "observe":
      return <Eye className={iconClass} />;
    default:
      return <HelpCircle className={iconClass} />;
  }
}

// =============================================================================
// COPY BUTTON
// =============================================================================

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 hover:bg-gray-200 rounded transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4 text-gray-500" />
      )}
    </button>
  );
}

// =============================================================================
// DEMO OVERLAY COMPONENT
// =============================================================================

export function DemoOverlay() {
  const {
    state,
    selectWorkflow,
    nextStep,
    prevStep,
    stopDemo,
    isDemoMode,
    canGoNext,
    canGoPrev,
    progress,
  } = useDemo();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Keyboard navigation - arrow keys to navigate steps
  // Only intercept when no interactive element is focused
  useEffect(() => {
    if (state.status !== "active") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // Don't intercept if user is in any interactive element
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLButtonElement ||
        target.isContentEditable ||
        target.closest('[role="dialog"]') ||
        target.closest('[role="menu"]')
      ) {
        return;
      }

      // Only handle Escape universally, arrows only when body is focused
      if (e.key === "Escape") {
        e.preventDefault();
        stopDemo();
      } else if (target === document.body || target.tagName === "HTML") {
        // Only handle navigation when no specific element is focused
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          nextStep();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          prevStep();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.status, nextStep, prevStep, stopDemo]);

  // Don't render if not in demo mode
  if (!isDemoMode) return null;

  // ==========================================================================
  // SELECTION SCREEN
  // ==========================================================================

  if (state.status === "selecting") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Monitor className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Guided Demo Mode</h2>
            </div>
            <p className="text-white/80">
              Choose a demo scenario. You&apos;ll be guided through each step at your own pace.
            </p>
          </div>

          {/* Options */}
          <div className="p-6 space-y-3">
            {DEMO_WORKFLOWS.map((workflow) => (
              <button
                key={workflow.id}
                onClick={() => selectWorkflow(workflow.name)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all",
                  "hover:border-primary hover:bg-primary-50",
                  "focus:outline-none focus:ring-2 focus:ring-primary-200"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {workflow.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {workflow.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {workflow.steps.length} steps
                    </p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {workflow.estimatedDuration}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Cancel */}
          <div className="px-6 pb-6">
            <button
              onClick={stopDemo}
              className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // ACTIVE GUIDED MODE
  // ==========================================================================

  const { workflow, currentStep, currentStepIndex, totalSteps } = state;

  if (!workflow || !currentStep) return null;

  return (
    <>
      {/* Guide Panel - Fixed at bottom right */}
      <div
        className={cn(
          "fixed bottom-4 right-4 z-50 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300",
          isCollapsed ? "h-14" : "max-h-[80vh]"
        )}
      >
        {/* Header - Always visible */}
        <div
          className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-white p-3 cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              <span className="font-semibold text-sm">
                {workflow.name}
              </span>
              <span className="text-white/70 text-xs">
                ({currentStepIndex + 1}/{totalSteps})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  stopDemo();
                }}
                className="p-1 hover:bg-white/20 rounded"
                title="Exit Demo"
              >
                <X className="w-4 h-4" />
              </button>
              {isCollapsed ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content - Collapsible */}
        {!isCollapsed && (
          <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
            {/* Current Step */}
            <div className="space-y-3">
              {/* Step Header */}
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <StepIcon type={currentStep.type} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {currentStep.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {currentStep.description}
                  </p>
                </div>
              </div>

              {/* Instruction */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  {currentStep.instruction}
                </p>
              </div>

              {/* Message to type (if applicable) */}
              {currentStep.message && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-blue-600 font-medium mb-1">
                        Type this message:
                      </p>
                      <p className="text-sm text-blue-900 font-mono bg-white/50 p-2 rounded">
                        {currentStep.message}
                      </p>
                    </div>
                    <CopyButton text={currentStep.message} />
                  </div>
                </div>
              )}

              {/* Expected Outcome */}
              {currentStep.expectedOutcome && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-green-600 font-medium mb-1">
                    Expected outcome:
                  </p>
                  <p className="text-sm text-green-800">
                    {currentStep.expectedOutcome}
                  </p>
                </div>
              )}

              {/* Hint */}
              {currentStep.hint && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      {currentStep.hint}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <button
                onClick={prevStep}
                disabled={!canGoPrev}
                className={cn(
                  "flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors",
                  canGoPrev
                    ? "text-gray-700 hover:bg-gray-100"
                    : "text-gray-300 cursor-not-allowed"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex items-center gap-2">
                {/* Step dots */}
                <div className="flex gap-1">
                  {workflow.steps.slice(0, 7).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        i === currentStepIndex
                          ? "bg-primary"
                          : i < currentStepIndex
                          ? "bg-primary/40"
                          : "bg-gray-200"
                      )}
                    />
                  ))}
                  {workflow.steps.length > 7 && (
                    <span className="text-xs text-gray-400">...</span>
                  )}
                </div>
              </div>

              <button
                onClick={nextStep}
                className={cn(
                  "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  canGoNext
                    ? "bg-primary text-white hover:bg-primary-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                )}
              >
                {canGoNext ? (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Finish
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard shortcut hint - pointer-events-none so it doesn't block clicks */}
      {!isCollapsed && (
        <div className="fixed bottom-4 right-[26rem] z-50 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded pointer-events-none">
          Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">→</kbd> to advance
        </div>
      )}
    </>
  );
}

export default DemoOverlay;
