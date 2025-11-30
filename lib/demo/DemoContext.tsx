"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import {
  type DemoWorkflow,
  type DemoStep,
  DEMO_WORKFLOWS,
  getWorkflowByChoice,
} from "./demo-workflows";

// =============================================================================
// TYPES
// =============================================================================

export type DemoStatus =
  | "idle"           // Not in demo mode
  | "selecting"      // User is selecting a demo workflow
  | "active";        // Demo is active (guided mode)

export interface DemoState {
  status: DemoStatus;
  workflow: DemoWorkflow | null;
  currentStepIndex: number;
  currentStep: DemoStep | null;
  totalSteps: number;
}

interface DemoContextValue {
  // State
  state: DemoState;

  // Actions
  startDemoMode: () => void;
  selectWorkflow: (choice: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  markStepComplete: () => void;
  stopDemo: () => void;

  // Query
  isDemoMode: boolean;
  canGoNext: boolean;
  canGoPrev: boolean;
  progress: number;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const INITIAL_STATE: DemoState = {
  status: "idle",
  workflow: null,
  currentStepIndex: 0,
  currentStep: null,
  totalSteps: 0,
};

// =============================================================================
// CONTEXT
// =============================================================================

const DemoContext = createContext<DemoContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface DemoProviderProps {
  children: ReactNode;
}

export function DemoProvider({ children }: DemoProviderProps) {
  const [state, setState] = useState<DemoState>(INITIAL_STATE);

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  const startDemoMode = useCallback(() => {
    console.log("[Demo] Starting demo mode - showing workflow selection");
    setState({
      ...INITIAL_STATE,
      status: "selecting",
    });
  }, []);

  const selectWorkflow = useCallback((choice: string) => {
    const workflow = getWorkflowByChoice(choice);
    if (!workflow) {
      console.log("[Demo] Workflow not found for choice:", choice);
      return;
    }

    console.log("[Demo] Selected workflow:", workflow.name);
    const firstStep = workflow.steps[0] ?? null;

    setState({
      status: "active",
      workflow,
      currentStepIndex: 0,
      currentStep: firstStep,
      totalSteps: workflow.steps.length,
    });
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => {
      if (!prev.workflow) return prev;

      const nextIndex = prev.currentStepIndex + 1;
      if (nextIndex >= prev.workflow.steps.length) {
        // Demo complete
        console.log("[Demo] Demo complete!");
        return INITIAL_STATE;
      }

      const nextStepData = prev.workflow.steps[nextIndex] ?? null;
      console.log("[Demo] Moving to step:", nextIndex, nextStepData?.description);

      return {
        ...prev,
        currentStepIndex: nextIndex,
        currentStep: nextStepData,
      };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => {
      if (!prev.workflow || prev.currentStepIndex <= 0) return prev;

      const prevIndex = prev.currentStepIndex - 1;
      const prevStepData = prev.workflow.steps[prevIndex] ?? null;
      console.log("[Demo] Moving back to step:", prevIndex, prevStepData?.description);

      return {
        ...prev,
        currentStepIndex: prevIndex,
        currentStep: prevStepData,
      };
    });
  }, []);

  const goToStep = useCallback((index: number) => {
    setState((prev) => {
      if (!prev.workflow) return prev;
      if (index < 0 || index >= prev.workflow.steps.length) return prev;

      const stepData = prev.workflow.steps[index] ?? null;
      console.log("[Demo] Jumping to step:", index, stepData?.description);

      return {
        ...prev,
        currentStepIndex: index,
        currentStep: stepData,
      };
    });
  }, []);

  const markStepComplete = useCallback(() => {
    // Alias for nextStep - advances to next step
    nextStep();
  }, [nextStep]);

  const stopDemo = useCallback(() => {
    console.log("[Demo] Stopping demo");
    setState(INITIAL_STATE);
  }, []);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const isDemoMode = state.status !== "idle";
  const canGoNext = state.workflow !== null && state.currentStepIndex < state.totalSteps - 1;
  const canGoPrev = state.workflow !== null && state.currentStepIndex > 0;
  const progress = state.totalSteps > 0
    ? Math.round(((state.currentStepIndex + 1) / state.totalSteps) * 100)
    : 0;

  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================

  const value: DemoContextValue = {
    state,
    startDemoMode,
    selectWorkflow,
    nextStep,
    prevStep,
    goToStep,
    markStepComplete,
    stopDemo,
    isDemoMode,
    canGoNext,
    canGoPrev,
    progress,
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useDemo(): DemoContextValue {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { DEMO_WORKFLOWS };
