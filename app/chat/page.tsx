"use client";

import { useRef, useEffect, useState, useCallback, type KeyboardEvent } from "react";
import Image from "next/image";
import { Send, CheckCircle2, Loader2, AlertCircle, X, Settings, RotateCcw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useChat } from "@/lib/hooks/useChat";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { SuggestionChips } from "@/components/chat/SuggestionChips";
import { useToast } from "@/components/ui/Toast";

// Form components
import { PodsLiteForm } from "@/components/forms/PodsLiteForm";
import { SsoConfigForm, type SsoConfig } from "@/components/forms/SsoConfigForm";
import { LtiConfigForm, type LtiConfig } from "@/components/forms/LtiConfigForm";
import { ApiTester } from "@/components/forms/ApiTester";
import { CommTestForm, type CommMessage } from "@/components/forms/CommTestForm";
import { AppSubmitForm, type AppSubmission } from "@/components/forms/AppSubmitForm";
import { CredentialsDisplay } from "@/components/dashboard/CredentialsDisplay";
import { AuditLogViewer } from "@/components/dashboard/AuditLogViewer";

// Error boundaries (HARD-06)
import { ChatErrorBoundary, FormErrorBoundary } from "@/components/ui/ErrorBoundary";

// DB functions (only for audit logs which don't need server persistence)
import { logAuditEvent, getAuditLogs } from "@/lib/db";

// Config - for converting data elements to endpoints
import { dataElementsToEndpoints } from "@/lib/config/oneroster";

// =============================================================================
// API HELPERS - Server-side persistence to fix client/server memory isolation
// =============================================================================

/**
 * Create vendor via API (server-side storage)
 * CRITICAL: This ensures the vendor is stored in server memory where AI tools can access it
 */
async function createVendorViaApi(podsLiteInput: PodsLiteInput, accessTier: string = "PRIVACY_SAFE"): Promise<{
  id: string;
  name: string;
  contactEmail: string;
  accessTier: string;
  podsStatus: string;
  podsApplicationId?: string;
}> {
  const response = await fetch("/api/vendors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ podsLiteInput, accessTier }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error((errorData as { error?: string }).error ?? "Failed to create vendor");
  }

  const data = await response.json();
  // Note: Vendor ID intentionally not logged to avoid PII leakage
  return data.vendor;
}

/**
 * Create sandbox credentials via API (server-side storage)
 * CRITICAL: This ensures credentials are stored in server memory where AI tools can access them
 */
async function createSandboxViaApi(vendorId: string, requestedEndpoints?: string[]): Promise<{
  id: string;
  vendorId: string;
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  environment: string;
  status: string;
  expiresAt: string;
  rateLimitPerMinute: number;
  allowedEndpoints: string[];
}> {
  const response = await fetch("/api/sandbox/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vendorId, requestedEndpoints }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error((errorData as { error?: string }).error ?? "Failed to create sandbox");
  }

  const data = await response.json();
  // Note: Sandbox ID and endpoints intentionally not logged to avoid PII leakage
  return data.sandbox;
}

/**
 * Persist PoDS application to server-side store
 */
async function persistPodsApplication(data: {
  id: string;
  vendorName: string;
  applicationName: string;
  contactEmail: string;
  status: string;
  accessTier: string;
  submittedAt: Date;
  reviewedAt: Date;
  expiresAt: Date;
}): Promise<void> {
  try {
    const response = await fetch("/api/pods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        submittedAt: data.submittedAt.toISOString(),
        reviewedAt: data.reviewedAt.toISOString(),
        expiresAt: data.expiresAt.toISOString(),
      }),
    });
    if (!response.ok) {
      console.error("[persistPodsApplication] Failed to persist:", await response.text());
    }
  } catch (err) {
    console.error("[persistPodsApplication] Error:", err);
  }
}

// Types
import type { PodsLiteInput, AuditLog } from "@/lib/types";

// =============================================================================
// CHAT PAGE
// =============================================================================

export default function ChatPage() {
  // Chat hook
  const {
    messages,
    isLoading,
    activeForm,
    formData,
    vendorState,
    error,
    suggestedResponses,
    sendMessage,
    setActiveForm,
    updateVendorState,
    clearChat,
    clearError,
  } = useChat();

  // Toast notifications
  const toast = useToast();

  // Local state
  const [inputValue, setInputValue] = useState("");

  // Ref to always have latest sendMessage function for suggestion chips
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ==========================================================================
  // AUTO-SCROLL - Only on new messages, respects user scroll position
  // ==========================================================================

  const lastMessageCountRef = useRef(0);
  const userHasScrolledRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Track if user has scrolled away from bottom
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold
    userHasScrolledRef.current = !isAtBottom;
  }, []);

  // Only auto-scroll when a NEW message is added (not during streaming updates)
  useEffect(() => {
    const messageCount = messages.length;
    const isNewMessage = messageCount > lastMessageCountRef.current;

    if (isNewMessage && !userHasScrolledRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    lastMessageCountRef.current = messageCount;
  }, [messages.length]); // Only trigger on message count change, not content updates

  // ==========================================================================
  // SHOW TOAST ON ERROR
  // ==========================================================================

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, toast]);

  // ==========================================================================
  // RESTORE PoDS DATA FROM LOCALSTORAGE (survives server restarts)
  // NOTE: vendorState restoration is now handled by VendorProvider (HARD-01)
  // This effect only restores server-side PoDS data for AI tool lookups
  // ==========================================================================

  useEffect(() => {
    const restorePodsToServer = async () => {
      try {
        const backup = localStorage.getItem("schoolday_pods_backup");
        if (!backup) return;

        const backupList = JSON.parse(backup);
        if (!Array.isArray(backupList) || backupList.length === 0) return;

        // Re-persist each PoDS application to the server (silent - no logging)
        for (const podsData of backupList) {
          try {
            await persistPodsApplication({
              ...podsData,
              submittedAt: new Date(podsData.submittedAt),
              reviewedAt: new Date(podsData.reviewedAt),
              expiresAt: new Date(podsData.expiresAt),
            });
          } catch {
            // Silent fail - server may already have this data
          }
        }
      } catch {
        // Silent fail on localStorage restore
      }
    };

    restorePodsToServer();
  }, []); // Run once on mount - no dependencies needed

  // ==========================================================================
  // HELPER: Add system message to chat
  // ==========================================================================

  const addSystemMessage = useCallback((_content: string) => {
    // This is a workaround since we can't directly add messages
    // In production, this would be handled by the useChat hook
    // Note: System messages intentionally not logged to avoid console noise
  }, []);

  // ==========================================================================
  // FORM SUBMISSION HANDLERS
  // ==========================================================================

  /**
   * Handle PoDS-Lite form submission
   * Creates vendor and sandbox credentials
   * NOTE: The PodsLiteForm handles its own internal step flow (submitted → credentials),
   *       so we do NOT call setActiveForm here - that would override the form's internal state
   */
  const handlePodsLiteSubmit = useCallback(
    async (data: PodsLiteInput) => {
      try {
        // =====================================================================
        // CRITICAL: All operations go through API routes to ensure server-side
        // storage. This fixes the client/server memory isolation issue where
        // data created in browser couldn't be found by AI tool handlers.
        // =====================================================================

        // Create vendor via API (server-side storage)
        const vendor = await createVendorViaApi(data, "PRIVACY_SAFE");

        // Convert selected data elements (e.g., "STUDENT_ID", "CLASS_ROSTER") to endpoint paths
        // NOTE: dataElementsRequested contains DataElementEnum values, NOT resource names
        // Use dataElementsToEndpoints() to map PII field types → API endpoints
        const requestedEndpoints = dataElementsToEndpoints(data.dataElementsRequested);

        // Create sandbox credentials via API (server-side storage)
        const creds = await createSandboxViaApi(vendor.id, requestedEndpoints);

        // Persist to server-side PoDS database so lookup_pods can find it
        const podsId = `PODS-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
        const now = new Date();
        const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

        const podsData = {
          id: podsId,
          vendorName: data.vendorName,
          applicationName: data.applicationName || data.vendorName,
          contactEmail: data.contactEmail,
          status: "APPROVED",
          accessTier: "PRIVACY_SAFE",
          submittedAt: now,
          reviewedAt: now,
          expiresAt: oneYearFromNow,
        };

        await persistPodsApplication(podsData);

        // Backup to localStorage so data survives server restarts
        try {
          const existingBackup = localStorage.getItem("schoolday_pods_backup");
          const backupList = existingBackup ? JSON.parse(existingBackup) : [];
          // Add or update this vendor's PoDS data
          const existingIndex = backupList.findIndex(
            (p: { vendorName: string }) => p.vendorName.toLowerCase() === data.vendorName.toLowerCase()
          );
          if (existingIndex >= 0) {
            backupList[existingIndex] = {
              ...podsData,
              submittedAt: now.toISOString(),
              reviewedAt: now.toISOString(),
              expiresAt: oneYearFromNow.toISOString(),
            };
          } else {
            backupList.push({
              ...podsData,
              submittedAt: now.toISOString(),
              reviewedAt: now.toISOString(),
              expiresAt: oneYearFromNow.toISOString(),
            });
          }
          localStorage.setItem("schoolday_pods_backup", JSON.stringify(backupList));
        } catch {
          // Silent fail on localStorage backup - data is persisted on server
        }

        // Convert API response to SandboxCredentials format for vendorState
        const credsForState = {
          id: creds.id,
          vendorId: creds.vendorId,
          apiKey: creds.apiKey,
          apiSecret: creds.apiSecret,
          baseUrl: creds.baseUrl,
          environment: creds.environment as "sandbox" | "production",
          status: creds.status as "PROVISIONING" | "ACTIVE" | "EXPIRED" | "REVOKED",
          expiresAt: new Date(creds.expiresAt),
          createdAt: new Date(),
          rateLimitPerMinute: creds.rateLimitPerMinute,
          allowedEndpoints: creds.allowedEndpoints,
        };

        // Update vendor state (but don't change activeForm - let PodsLiteForm handle its own flow)
        const newVendorState = {
          isOnboarded: true,
          vendorId: vendor.id,
          companyName: data.vendorName,
          accessTier: vendor.accessTier as "PRIVACY_SAFE" | "SELECTIVE" | "FULL_ACCESS",
          podsStatus: vendor.podsStatus,
          credentials: credsForState,
        };
        updateVendorState(newVendorState);

        // Also save vendorState to localStorage for persistence across page reloads
        try {
          localStorage.setItem("schoolday_vendor_state", JSON.stringify(newVendorState));
        } catch {
          // Silent fail - state already updated via VendorContext
        }

        // NOTE: Removed setActiveForm("credentials") - PodsLiteForm now handles
        // its own internal step progression: form → verification → submitted → credentials

        // Show success toast
        toast.success(`Welcome ${data.vendorName}! Your PoDS-Lite application has been approved.`);

        addSystemMessage(
          `Welcome ${data.vendorName}! Your PoDS-Lite application has been approved with ${vendor.accessTier} access. Your sandbox credentials are ready.`
        );
      } catch (err) {
        console.error("Failed to create vendor:", err);
        toast.error("Failed to create vendor. Please try again.");
        throw err;
      }
    },
    [updateVendorState, addSystemMessage, toast]
  );

  /**
   * Handle SSO configuration submission
   */
  const handleSsoSubmit = useCallback(
    async (config: SsoConfig) => {
      try {
        // Log the SSO configuration
        if (vendorState.vendorId) {
          await logAuditEvent({
            vendorId: vendorState.vendorId,
            action: "config.sso",
            resourceType: "integration",
            resourceId: `sso_${config.provider.toLowerCase()}`,
            details: {
              provider: config.provider,
              scopes: config.scopes,
              launchUrl: config.launchUrl,
            },
          });
        }

        // Update vendor state with SSO integration
        updateVendorState({
          integrations: [
            ...vendorState.integrations,
            {
              id: crypto.randomUUID(),
              vendorId: vendorState.vendorId ?? "",
              type: "SSO",
              status: "ACTIVE",
              ssoProvider: config.provider === "SCHOOLDAY" ? "CLEVER" : config.provider === "CLEVER" ? "CLEVER" : "GOOGLE",
              ssoRedirectUri: config.redirectUri,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        });

        setActiveForm(null);

        // Show success toast
        toast.success(`SSO configuration for ${config.provider} saved successfully.`);

        addSystemMessage(
          `SSO configuration for ${config.provider} has been saved successfully.`
        );
      } catch (err) {
        console.error("Failed to save SSO config:", err);
        toast.error("Failed to save SSO configuration. Please try again.");
        throw err;
      }
    },
    [vendorState, updateVendorState, setActiveForm, addSystemMessage, toast]
  );

  /**
   * Handle LTI configuration submission
   */
  const handleLtiSubmit = useCallback(
    async (config: LtiConfig) => {
      try {
        // Log the LTI configuration
        if (vendorState.vendorId) {
          await logAuditEvent({
            vendorId: vendorState.vendorId,
            action: "config.lti",
            resourceType: "integration",
            resourceId: `lti_${config.deploymentId}`,
            details: {
              clientId: config.clientId,
              deploymentId: config.deploymentId,
              launchUrl: config.launchUrl,
              jwksUrl: config.jwksUrl,
            },
          });
        }

        // Update vendor state with LTI integration
        updateVendorState({
          integrations: [
            ...vendorState.integrations,
            {
              id: crypto.randomUUID(),
              vendorId: vendorState.vendorId ?? "",
              type: "LTI",
              status: "ACTIVE",
              ltiClientId: config.clientId,
              ltiDeploymentId: config.deploymentId,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        });

        setActiveForm(null);

        // Show success toast
        toast.success("LTI 1.3 configuration saved successfully.");

        addSystemMessage(
          `LTI 1.3 integration has been configured for Schoology. Your tool can now receive launches from LAUSD's LMS.`
        );
      } catch (err) {
        console.error("Failed to save LTI config:", err);
        toast.error("Failed to save LTI configuration. Please try again.");
        throw err;
      }
    },
    [vendorState, updateVendorState, setActiveForm, addSystemMessage, toast]
  );

  /**
   * Handle communication test submission
   */
  const handleCommSubmit = useCallback(
    async (msg: CommMessage) => {
      try {
        // Log the message send
        if (vendorState.vendorId) {
          await logAuditEvent({
            vendorId: vendorState.vendorId,
            action: "comm.sent",
            resourceType: "message",
            resourceId: `msg_${Date.now()}`,
            details: {
              channel: msg.channel,
              recipientToken: msg.recipientToken,
              subject: msg.subject,
              bodyLength: msg.body.length,
            },
          });
        }

        setActiveForm(null);

        // Show success toast
        toast.success(`Test ${msg.channel} message queued for delivery.`);

        addSystemMessage(
          `Test ${msg.channel} message queued for delivery to ${msg.recipientToken.substring(0, 16)}...`
        );
      } catch (err) {
        console.error("Failed to send message:", err);
        toast.error("Failed to send test message. Please try again.");
        throw err;
      }
    },
    [vendorState, setActiveForm, addSystemMessage, toast]
  );

  /**
   * Handle app submission
   */
  const handleAppSubmit = useCallback(
    async (submission: AppSubmission) => {
      try {
        // Log the app submission
        if (vendorState.vendorId) {
          await logAuditEvent({
            vendorId: vendorState.vendorId,
            action: "pods.submitted",
            resourceType: "application",
            resourceId: `app_${Date.now()}`,
            details: {
              appName: submission.appName,
              category: submission.category,
              targetGrades: submission.targetGrades,
              subjects: submission.subjects,
            },
          });
        }

        setActiveForm(null);

        // Show success toast
        toast.success(`App "${submission.appName}" submitted for review.`);

        addSystemMessage(
          `Your app "${submission.appName}" has been submitted to the freemium catalog for review.`
        );
      } catch (err) {
        console.error("Failed to submit app:", err);
        toast.error("Failed to submit app. Please try again.");
        throw err;
      }
    },
    [vendorState, setActiveForm, addSystemMessage, toast]
  );

  /**
   * Handle showing audit logs
   */
  const handleShowAuditLogs = useCallback(async () => {
    if (vendorState.vendorId) {
      const logs = await getAuditLogs(vendorState.vendorId);
      setAuditLogs(logs);
    }
  }, [vendorState.vendorId]);

  // Load audit logs when audit_log form is shown
  useEffect(() => {
    if (activeForm === "audit_log") {
      handleShowAuditLogs();
    }
  }, [activeForm, handleShowAuditLogs]);

  // ==========================================================================
  // BASIC HANDLERS
  // ==========================================================================

  const handleSend = useCallback(async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || isLoading) return;

    setInputValue("");
    await sendMessage(trimmedValue);

    // Focus back to input
    inputRef.current?.focus();
  }, [inputValue, isLoading, sendMessage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      // Use ref to always get latest sendMessage function
      sendMessageRef.current(suggestion);
    },
    [] // No dependencies needed since we use ref
  );

  const handleCloseForm = useCallback(() => {
    setActiveForm(null);
  }, [setActiveForm]);

  /**
   * Handle reset - clears localStorage and reloads the page
   */
  const handleReset = useCallback(() => {
    // Clear all SchoolDay-related localStorage
    localStorage.removeItem("schoolday_pods_backup");
    localStorage.removeItem("schoolday_vendor_state");

    // Clear chat state
    clearChat();

    // Reload the page to reset server-side state as well
    window.location.reload();
  }, [clearChat]);

  // ==========================================================================
  // RENDER FORM
  // ==========================================================================

  const renderForm = () => {
    switch (activeForm) {
      case "pods_lite":
        // Get prefill from formData (AI tool result) or vendorState
        const podsPrefill = formData?.prefill as { vendorName?: string; contactEmail?: string } | undefined;
        return (
          <PodsLiteForm
            onSubmit={handlePodsLiteSubmit}
            onCancel={handleCloseForm}
            onTestApi={() => setActiveForm("api_tester")}
            prefill={
              podsPrefill?.vendorName
                ? podsPrefill
                : vendorState.companyName
                  ? { vendorName: vendorState.companyName }
                  : undefined
            }
          />
        );

      case "sso_config":
        return (
          <SsoConfigForm
            onSubmit={handleSsoSubmit}
            onCancel={handleCloseForm}
          />
        );

      case "lti_config":
        return (
          <LtiConfigForm
            onSubmit={handleLtiSubmit}
            onCancel={handleCloseForm}
          />
        );

      case "api_tester":
        return (
          <ApiTester
            onClose={handleCloseForm}
            allowedEndpoints={vendorState.credentials?.allowedEndpoints}
          />
        );

      case "comm_test":
        return (
          <CommTestForm
            onSubmit={handleCommSubmit}
            onCancel={handleCloseForm}
          />
        );

      case "credentials":
        if (vendorState.credentials) {
          return <CredentialsDisplay credentials={vendorState.credentials} />;
        }
        return (
          <div className="text-center py-8 text-gray-500">
            <p>No credentials available. Complete onboarding first.</p>
          </div>
        );

      case "audit_log":
        return <AuditLogViewer logs={auditLogs} />;

      case "app_submit":
        return (
          <AppSubmitForm
            onSubmit={handleAppSubmit}
            onCancel={handleCloseForm}
          />
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">
              Form type <code className="bg-gray-100 px-1 rounded">{activeForm}</code> not implemented.
            </p>
          </div>
        );
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm" role="banner">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Image
                src="/schoolday-logo.svg"
                alt="SchoolDay"
                width={120}
                height={45}
                className="h-8 sm:h-10 w-auto flex-shrink-0"
                priority
              />
              <div className="hidden md:block border-l border-gray-300 pl-4">
                <h1 className="text-lg font-semibold text-gray-800">
                  Vendor Integration Portal
                </h1>
                <p className="text-xs text-gray-500">
                  AI-Powered Self-Service Platform
                </p>
              </div>
            </div>

            {/* Right: Status */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Vendor Badge - hide company name on very small screens */}
              {vendorState.isOnboarded && vendorState.companyName && (
                <div className="hidden xs:flex items-center gap-2 bg-gray-100 rounded-full px-2 sm:px-3 py-1 sm:py-1.5">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[100px] sm:max-w-none">
                    {vendorState.companyName}
                  </span>
                  {vendorState.accessTier && (
                    <span className="text-[10px] sm:text-xs bg-primary/10 text-primary rounded px-1 sm:px-1.5 py-0.5">
                      {vendorState.accessTier}
                    </span>
                  )}
                </div>
              )}

              {/* AI Status */}
              <div
                className="flex items-center gap-1 sm:gap-1.5 bg-success-50 rounded-full px-2 sm:px-3 py-1 sm:py-1.5"
                role="status"
                aria-label="AI assistant is online"
              >
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-success-700">AI Online</span>
              </div>

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                title="Reset session and clear all data"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>

              {/* Feature Flags Dashboard Link */}
              <Link
                href="/dashboard/features"
                className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Feature Flags Dashboard"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div
          className="flex-shrink-0 bg-error-50 border-b border-error-200 px-3 sm:px-4 py-2"
          role="alert"
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-error-700 min-w-0">
              <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm truncate">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-error-500 hover:text-error-700 p-1 rounded focus:outline-none focus:ring-2 focus:ring-error-300 flex-shrink-0"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        role="main"
      >
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {/* Welcome message if no messages */}
          {messages.length === 0 && !activeForm && (
            <div className="text-center py-8 sm:py-12 animate-fade-in-up">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white mb-4 sm:mb-6 shadow-lg">
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-1 sm:mb-2">
                Welcome to SchoolDay
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mb-1">Vendor Integration Portal</p>
              <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto mb-6 sm:mb-8 px-2">
                I&apos;m your AI integration assistant. I can help you onboard as a
                vendor, configure SSO, test APIs, and more - all with
                privacy-protected tokenized data.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm px-2">
                <div className="flex items-center justify-center gap-2 bg-white rounded-full px-3 sm:px-4 py-2 shadow-sm border border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                  <span className="text-gray-700">Instant Privacy-Safe approval</span>
                </div>
                <div className="flex items-center justify-center gap-2 bg-white rounded-full px-3 sm:px-4 py-2 shadow-sm border border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                  <span className="text-gray-700">Zero PII exposure</span>
                </div>
                <div className="flex items-center justify-center gap-2 bg-white rounded-full px-3 sm:px-4 py-2 shadow-sm border border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                  <span className="text-gray-700">Full API access</span>
                </div>
              </div>
            </div>
          )}

          {/* Messages - wrapped with error boundary (HARD-06) */}
          <ChatErrorBoundary>
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {/* Typing Indicator */}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <TypingIndicator />
            )}

            {/* Active Form - uses stable key to prevent animation replay on same form */}
            {activeForm && (
              <div
                key={`form-${activeForm}`}
                className="mt-4 animate-slide-in-bottom"
                style={{ willChange: "transform, opacity" }}
              >
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Form Header - only show for forms that need close button */}
                  {activeForm !== "api_tester" && (
                    <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-b border-gray-200">
                      <h3 className="font-medium text-gray-800 text-sm sm:text-base">
                        {getFormTitle(activeForm)}
                      </h3>
                      <button
                        onClick={handleCloseForm}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-200"
                        aria-label="Close form"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {/* Form Content - wrapped with error boundary (HARD-06) */}
                  <div className="p-3 sm:p-4">
                    <FormErrorBoundary formName={getFormTitle(activeForm)}>
                      {renderForm()}
                    </FormErrorBoundary>
                  </div>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
          </ChatErrorBoundary>
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-shrink-0 border-t border-gray-200 bg-white" role="contentinfo">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Suggestion Chips - scrollable on mobile */}
          {messages.length === 0 || !isLoading ? (
            <div className="mb-2 sm:mb-3 -mx-3 sm:mx-0 px-3 sm:px-0">
              <SuggestionChips
                onSelect={handleSuggestionSelect}
                vendorState={vendorState}
                contextualSuggestions={suggestedResponses}
                disabled={isLoading}
              />
            </div>
          ) : null}

          {/* Input Row */}
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={1}
                disabled={isLoading}
                aria-label="Message input"
                className={cn(
                  "w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-gray-300",
                  "resize-none text-base",
                  "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary",
                  "disabled:bg-gray-50 disabled:text-gray-500",
                  "placeholder:text-gray-400",
                  "text-gray-800"
                )}
                style={{
                  minHeight: "44px",
                  maxHeight: "120px",
                }}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              aria-label={isLoading ? "Sending message" : "Send message"}
              className={cn(
                "flex items-center justify-center",
                "w-11 h-11 sm:w-12 sm:h-12 rounded-xl",
                "bg-primary text-white",
                "transition-all duration-200",
                "hover:bg-primary-700 hover:scale-105 active:scale-95",
                "disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:scale-100",
                "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Footer note - stack on mobile */}
          <p className="text-[10px] sm:text-xs text-gray-400 text-center mt-2 sm:mt-3">
            <span className="hidden sm:inline">Protected by LAUSD Privacy Framework • </span>
            <span className="sm:hidden">LAUSD Privacy • </span>
            FERPA • COPPA • SOPIPA
          </p>
        </div>
      </footer>
    </div>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getFormTitle(formType: string): string {
  const titles: Record<string, string> = {
    pods_lite: "PoDS-Lite Application",
    sso_config: "SSO Configuration",
    api_tester: "OneRoster API Tester",
    comm_test: "Communication Gateway Test",
    app_submit: "Freemium App Submission",
    credentials: "Sandbox Credentials",
    audit_log: "Audit Log",
    lti_config: "LTI 1.3 Configuration",
  };
  return titles[formType] ?? "Form";
}
