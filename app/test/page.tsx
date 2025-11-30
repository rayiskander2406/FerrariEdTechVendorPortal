"use client";

import { useState } from "react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { SuggestionChips } from "@/components/chat/SuggestionChips";
import { PodsLiteForm } from "@/components/forms/PodsLiteForm";
import type { ChatMessage } from "@/lib/hooks/useChat";
import type { PodsLiteInput } from "@/lib/types";

// Sample messages for testing
const sampleMessages: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    content: "Hi, I'm from MathPractice Pro and want to integrate with LAUSD.",
    timestamp: new Date(Date.now() - 60000),
  },
  {
    id: "2",
    role: "assistant",
    content: `Welcome to LAUSD's Vendor Integration Portal! I'm here to help **MathPractice Pro** get integrated quickly and securely.

Most math practice applications work perfectly with our **Privacy-Safe** tier, which provides:
- Unique student identifiers (tokens like \`TKN_STU_8X9Y2Z\`)
- First names for personalization
- Grade levels for content alignment

The best part? Privacy-Safe access can be **approved in minutes**!

Would you like me to start the PoDS-Lite application?`,
    timestamp: new Date(Date.now() - 30000),
    toolCalls: [
      { id: "tc1", name: "lookup_pods", status: "completed", result: { success: true, message: "No existing PoDS found" } },
    ],
  },
];

export default function TestPage() {
  const [activeTab, setActiveTab] = useState<"messages" | "typing" | "chips" | "form">("messages");
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleFormSubmit = async (data: PodsLiteInput) => {
    console.log("Form submitted:", data);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setFormSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Component Test Page</h1>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {(["messages", "typing", "chips", "form"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {activeTab === "messages" && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800 mb-4">Message Bubbles</h2>
              {sampleMessages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
          )}

          {activeTab === "typing" && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800 mb-4">Typing Indicator</h2>
              <TypingIndicator />
            </div>
          )}

          {activeTab === "chips" && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800 mb-4">Suggestion Chips</h2>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Initial State (not onboarded):</p>
                  <SuggestionChips
                    onSelect={(s) => alert(`Selected: ${s}`)}
                    vendorState={undefined}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Onboarded State:</p>
                  <SuggestionChips
                    onSelect={(s) => alert(`Selected: ${s}`)}
                    vendorState={{
                      isOnboarded: true,
                      vendorId: "test-123",
                      companyName: "Test Vendor",
                      accessTier: "PRIVACY_SAFE",
                      podsStatus: "APPROVED",
                      credentials: null,
                      integrations: [],
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "form" && (
            <div>
              <h2 className="font-semibold text-gray-800 mb-4">PoDS-Lite Form</h2>
              {formSubmitted ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-100 text-success-600 mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Application Submitted!</h3>
                  <p className="text-gray-600 mt-1">Check the console for submitted data.</p>
                  <button
                    onClick={() => setFormSubmitted(false)}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm"
                  >
                    Reset Form
                  </button>
                </div>
              ) : (
                <PodsLiteForm
                  onSubmit={handleFormSubmit}
                  onCancel={() => alert("Cancelled")}
                  prefill={{ vendorName: "Test Company", contactEmail: "test@example.com" }}
                />
              )}
            </div>
          )}
        </div>

        {/* API Test Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">API Tests</h2>
          <div className="space-y-3">
            <TestButton
              label="Health Check"
              onClick={async () => {
                const res = await fetch("/api/chat");
                const data = await res.json();
                alert(JSON.stringify(data, null, 2));
              }}
            />
            <TestButton
              label="Test Chat (requires API key)"
              onClick={async () => {
                const res = await fetch("/api/chat", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    messages: [{ role: "user", content: "Hello" }],
                  }),
                });
                if (!res.ok) {
                  const error = await res.json();
                  alert(`Error: ${error.error}`);
                  return;
                }
                alert("Streaming response started - check Network tab");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TestButton({ label, onClick }: { label: string; onClick: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onClick();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {label}
    </button>
  );
}
