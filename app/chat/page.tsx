"use client";

import { useRef, useEffect, useState, useCallback, type KeyboardEvent } from "react";
import Image from "next/image";
import { Send, CheckCircle2, Loader2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@/lib/hooks/useChat";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { SuggestionChips } from "@/components/chat/SuggestionChips";
import { useToast } from "@/components/ui/Toast";

// Form components
import { PodsLiteForm } from "@/components/forms/PodsLiteForm";
import { SsoConfigForm, type SsoConfig } from "@/components/forms/SsoConfigForm";
import { ApiTester } from "@/components/forms/ApiTester";
import { CommTestForm, type CommMessage } from "@/components/forms/CommTestForm";
import { AppSubmitForm, type AppSubmission } from "@/components/forms/AppSubmitForm";
import { CredentialsDisplay } from "@/components/dashboard/CredentialsDisplay";
import { AuditLogViewer } from "@/components/dashboard/AuditLogViewer";

// DB functions
import { createVendor, createSandbox, logAuditEvent, getAuditLogs } from "@/lib/db";

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
    vendorState,
    error,
    sendMessage,
    setActiveForm,
    updateVendorState,
    clearError,
  } = useChat();

  // Toast notifications
  const toast = useToast();

  // Local state
  const [inputValue, setInputValue] = useState("");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ==========================================================================
  // AUTO-SCROLL
  // ==========================================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, activeForm]);

  // ==========================================================================
  // SHOW TOAST ON ERROR
  // ==========================================================================

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, toast]);

  // ==========================================================================
  // HELPER: Add system message to chat
  // ==========================================================================

  const addSystemMessage = useCallback((content: string) => {
    // This is a workaround since we can't directly add messages
    // In production, this would be handled by the useChat hook
    console.log("[System Message]", content);
  }, []);

  // ==========================================================================
  // FORM SUBMISSION HANDLERS
  // ==========================================================================

  /**
   * Handle PoDS-Lite form submission
   * Creates vendor and sandbox credentials
   */
  const handlePodsLiteSubmit = useCallback(
    async (data: PodsLiteInput) => {
      try {
        // Create vendor
        const vendor = await createVendor({ podsLiteInput: data });

        // Create sandbox credentials
        const creds = await createSandbox(vendor.id);

        // Update vendor state
        updateVendorState({
          isOnboarded: true,
          vendorId: vendor.id,
          companyName: data.vendorName,
          accessTier: vendor.accessTier,
          podsStatus: vendor.podsStatus,
          credentials: creds,
        });

        // Show credentials display
        setActiveForm("credentials");

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
    [updateVendorState, setActiveForm, addSystemMessage, toast]
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
              ssoProvider: config.provider === "SCHOOLOGY" ? "CLEVER" : config.provider === "CLEVER" ? "CLEVER" : "GOOGLE",
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
      setInputValue(suggestion);
      // Auto-send suggestion
      sendMessage(suggestion);
    },
    [sendMessage]
  );

  const handleCloseForm = useCallback(() => {
    setActiveForm(null);
  }, [setActiveForm]);

  // ==========================================================================
  // RENDER FORM
  // ==========================================================================

  const renderForm = () => {
    switch (activeForm) {
      case "pods_lite":
        return (
          <PodsLiteForm
            onSubmit={handlePodsLiteSubmit}
            onCancel={handleCloseForm}
            prefill={
              vendorState.companyName
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

      case "api_tester":
        return <ApiTester onClose={handleCloseForm} />;

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
      <main className="flex-1 overflow-y-auto" role="main">
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
                  <span className="text-gray-700">Instant TOKEN_ONLY approval</span>
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

          {/* Messages */}
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {/* Typing Indicator */}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <TypingIndicator />
            )}

            {/* Active Form */}
            {activeForm && (
              <div className="mt-4 animate-slide-in-bottom">
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

                  {/* Form Content - full width on mobile */}
                  <div className="p-3 sm:p-4">
                    {renderForm()}
                  </div>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
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
