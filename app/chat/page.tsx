"use client";

import { useRef, useEffect, useState, useCallback, type KeyboardEvent } from "react";
import Image from "next/image";
import { Send, CheckCircle2, Loader2, AlertCircle, X, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@/lib/hooks/useChat";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { SuggestionChips } from "@/components/chat/SuggestionChips";

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
    clearError,
  } = useChat();

  // Local state
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ==========================================================================
  // AUTO-SCROLL
  // ==========================================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ==========================================================================
  // HANDLERS
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
  // RENDER
  // ==========================================================================

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-4">
              <Image
                src="/schoolday-logo.svg"
                alt="SchoolDay"
                width={120}
                height={45}
                className="h-10 w-auto"
                priority
              />
              <div className="hidden sm:block border-l border-gray-300 pl-4">
                <h1 className="text-lg font-semibold text-gray-800">
                  Vendor Integration Portal
                </h1>
                <p className="text-xs text-gray-500">
                  AI-Powered Self-Service Platform
                </p>
              </div>
            </div>

            {/* Right: Status */}
            <div className="flex items-center gap-3">
              {/* Vendor Badge */}
              {vendorState.isOnboarded && vendorState.companyName && (
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
                  <span className="text-sm font-medium text-gray-700">
                    {vendorState.companyName}
                  </span>
                  {vendorState.accessTier && (
                    <span className="text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5">
                      {vendorState.accessTier}
                    </span>
                  )}
                </div>
              )}

              {/* AI Status */}
              <div className="flex items-center gap-1.5 bg-success-50 rounded-full px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
                </span>
                <span className="text-xs font-medium text-success-700">AI Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="flex-shrink-0 bg-error-50 border-b border-error-200 px-4 py-2">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-error-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-error-500 hover:text-error-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Welcome message if no messages */}
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white mb-6 shadow-lg">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Welcome to SchoolDay
              </h2>
              <p className="text-lg text-gray-500 mb-1">Vendor Integration Portal</p>
              <p className="text-gray-600 max-w-lg mx-auto mb-8">
                I'm your AI integration assistant. I can help you onboard as a
                vendor, configure SSO, test APIs, and more - all with
                privacy-protected tokenized data.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-gray-700">Instant TOKEN_ONLY approval</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-gray-700">Zero PII exposure</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
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
              <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Form Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-medium text-gray-800">
                      {getFormTitle(activeForm)}
                    </h3>
                    <button
                      onClick={handleCloseForm}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Form Content Placeholder */}
                  <div className="p-4">
                    <FormPlaceholder formType={activeForm} />
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
      <footer className="flex-shrink-0 border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4">
          {/* Suggestion Chips */}
          {messages.length === 0 || !isLoading ? (
            <div className="mb-3">
              <SuggestionChips
                onSelect={handleSuggestionSelect}
                vendorState={vendorState}
                disabled={isLoading}
              />
            </div>
          ) : null}

          {/* Input Row */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={1}
                disabled={isLoading}
                className={cn(
                  "w-full px-4 py-3 rounded-xl border border-gray-300",
                  "resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary",
                  "disabled:bg-gray-50 disabled:text-gray-500",
                  "placeholder:text-gray-400",
                  "text-gray-800"
                )}
                style={{
                  minHeight: "48px",
                  maxHeight: "120px",
                }}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className={cn(
                "flex items-center justify-center",
                "w-12 h-12 rounded-xl",
                "bg-primary text-white",
                "transition-all duration-200",
                "hover:bg-primary-700 active:scale-95",
                "disabled:bg-gray-300 disabled:cursor-not-allowed",
                "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Footer note */}
          <p className="text-xs text-gray-400 text-center mt-3">
            Protected by LAUSD Privacy Framework • FERPA • COPPA • SOPIPA
            Compliant
          </p>
        </div>
      </footer>
    </div>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function getFormTitle(formType: string): string {
  const titles: Record<string, string> = {
    pods_lite: "PoDS-Lite Application",
    sso_config: "SSO Configuration",
    api_tester: "OneRoster API Tester",
    comm_test: "Communication Gateway Test",
    app_submit: "Freemium App Submission",
    credentials: "Sandbox Credentials",
    audit_log: "Audit Log Viewer",
    lti_config: "LTI 1.3 Configuration",
  };
  return titles[formType] ?? "Form";
}

function FormPlaceholder({ formType }: { formType: string }) {
  // This is a placeholder - actual form components will be implemented separately
  return (
    <div className="text-center py-8 text-gray-500">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
        <Building2 className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm">
        {getFormTitle(formType)} form will be rendered here.
      </p>
      <p className="text-xs text-gray-400 mt-1">
        Form type: <code className="bg-gray-100 px-1 rounded">{formType}</code>
      </p>
    </div>
  );
}
