"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronRight,
  MessageSquare,
  FileText,
  MousePointer,
  Eye,
  Copy,
  Check,
  Clock,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_WORKFLOWS, type DemoStep, type DemoWorkflow } from "@/lib/demo/demo-workflows";

// =============================================================================
// STEP TYPE ICONS
// =============================================================================

function StepIcon({ type, className }: { type: DemoStep["type"]; className?: string }) {
  const iconClass = cn("w-5 h-5", className);
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
      return <Eye className={iconClass} />;
  }
}

function StepTypeLabel({ type }: { type: DemoStep["type"] }) {
  const labels: Record<DemoStep["type"], string> = {
    message: "Type in chat",
    form: "Fill form",
    action: "Click/interact",
    observe: "Observe result",
  };
  return <span className="text-xs text-gray-500">{labels[type]}</span>;
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
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
// WORKFLOW CARD
// =============================================================================

function WorkflowCard({
  workflow,
  isSelected,
  onClick,
}: {
  workflow: DemoWorkflow;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-xl border-2 text-left transition-all",
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{workflow.description}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 ml-3">
          <Clock className="w-3.5 h-3.5" />
          {workflow.estimatedDuration}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
        <span>{workflow.steps.length} steps</span>
        {isSelected && (
          <span className="ml-auto text-primary font-medium flex items-center gap-1">
            Selected <ChevronRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </button>
  );
}

// =============================================================================
// STEP CARD
// =============================================================================

function StepCard({ step, index }: { step: DemoStep; index: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StepIcon type={step.type} className="text-gray-400" />
            <StepTypeLabel type={step.type} />
          </div>
          <h4 className="font-semibold text-gray-900">{step.title}</h4>
          <p className="text-sm text-gray-500">{step.description}</p>
        </div>
      </div>

      {/* Instruction */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <p className="text-sm text-gray-700">{step.instruction}</p>
      </div>

      {/* Message to copy */}
      {step.message && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs text-blue-600 font-medium mb-1">
                Copy this message:
              </p>
              <p className="text-sm text-blue-900 font-mono bg-white/50 p-2 rounded">
                {step.message}
              </p>
            </div>
            <CopyButton text={step.message} />
          </div>
        </div>
      )}

      {/* Expected Outcome */}
      {step.expectedOutcome && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
          <p className="text-xs text-green-600 font-medium mb-1">
            What you should see:
          </p>
          <p className="text-sm text-green-800">{step.expectedOutcome}</p>
        </div>
      )}

      {/* Hint */}
      {step.hint && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-600 font-medium mb-1">Tip:</p>
          <p className="text-sm text-amber-800">{step.hint}</p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// DEMO GUIDE PAGE
// =============================================================================

export default function DemoGuidePage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<DemoWorkflow | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/chat"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back to Chat</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <Image
                src="/schoolday-logo.svg"
                alt="SchoolDay"
                width={100}
                height={38}
                className="h-8 w-auto"
              />
            </div>
            <Link
              href="/chat"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              Open Chat
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Demo Walkthrough Guide
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Follow these step-by-step instructions to explore the vendor portal.
            Open the chat in another window and follow along at your own pace.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Workflow Selection */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Choose a Workflow
              </h2>
              <div className="space-y-3">
                {DEMO_WORKFLOWS.map((workflow) => (
                  <WorkflowCard
                    key={workflow.id}
                    workflow={workflow}
                    isSelected={selectedWorkflow?.id === workflow.id}
                    onClick={() => setSelectedWorkflow(workflow)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Steps Display */}
          <div className="lg:col-span-2">
            {selectedWorkflow ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedWorkflow.name}
                    </h2>
                    <p className="text-gray-500 text-sm">
                      {selectedWorkflow.steps.length} steps &bull;{" "}
                      {selectedWorkflow.estimatedDuration}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedWorkflow.steps.map((step, index) => (
                    <StepCard key={step.id} step={step} index={index} />
                  ))}
                </div>

                {/* Completion Message */}
                <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl text-center">
                  <Check className="w-10 h-10 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-800 mb-1">
                    Workflow Complete!
                  </h3>
                  <p className="text-sm text-green-700">
                    Once you&apos;ve followed all steps, you&apos;ll have completed the{" "}
                    {selectedWorkflow.name.toLowerCase()} process.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Eye className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Select a Workflow
                </h3>
                <p className="text-gray-500 max-w-md">
                  Choose a demo workflow from the left to see the step-by-step
                  instructions. Follow along in the chat interface.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
