"use client";

import React, { useState, useCallback, useMemo, useEffect, type FormEvent } from "react";
import { z } from "zod";
import {
  Mail,
  MessageSquare,
  Send,
  User,
  AlertCircle,
  Loader2,
  CheckCircle2,
  DollarSign,
  Shield,
  Lock,
  FileText,
  Clock,
  TrendingUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SYNTHETIC_DATA } from "@/lib/data/synthetic";
import {
  CPAAS_CHANNELS,
  DEFAULT_PRICES,
  DELIVERY_STATUSES,
  DELIVERY_STATUS_ORDER,
  DELIVERY_SIMULATION,
  LAUSD_SCALE,
  PRIVACY_BADGES,
  calculateMessageCost,
  formatCurrency,
  generateMessageId,
  type CpaasChannelId,
  type DeliveryStatusId,
} from "@/lib/config/cpaas";

// =============================================================================
// TYPES
// =============================================================================

export type CommChannel = "EMAIL" | "SMS";

export interface CommMessage {
  channel: CommChannel;
  recipientToken: string;
  subject?: string;
  body: string;
}

interface CommTestFormProps {
  onSubmit: (msg: CommMessage) => Promise<void>;
  onCancel: () => void;
}

interface FormErrors {
  [key: string]: string | undefined;
}

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const EmailSchema = z.object({
  channel: z.literal("EMAIL"),
  recipientToken: z.string().min(1, "Please select a recipient"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message body is required"),
});

const SmsSchema = z.object({
  channel: z.literal("SMS"),
  recipientToken: z.string().min(1, "Please select a recipient"),
  body: z.string().min(1, "Message body is required").max(480, "SMS limited to 480 characters (3 segments)"),
});

// =============================================================================
// CONSTANTS
// =============================================================================

const SMS_SEGMENT_LENGTH = CPAAS_CHANNELS.SMS.segmentLength!;
const MAX_SMS_SEGMENTS = 3;

// =============================================================================
// DELIVERY STATUS COMPONENT
// =============================================================================

interface DeliveryStatusProps {
  currentStatus: DeliveryStatusId | null;
  messageId: string | null;
}

function DeliveryStatusTimeline({ currentStatus, messageId }: DeliveryStatusProps) {
  if (!currentStatus || !messageId) return null;

  const currentIndex = DELIVERY_STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-emerald-600" />
        <span className="font-medium text-emerald-800">Message Status</span>
        <span className="text-xs text-emerald-600 ml-auto font-mono">{messageId}</span>
      </div>

      {/* Timeline */}
      <div className="flex items-center justify-between">
        {DELIVERY_STATUS_ORDER.slice(0, 3).map((statusId, index) => {
          const status = DELIVERY_STATUSES[statusId as keyof typeof DELIVERY_STATUSES];
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={statusId} className="flex flex-col items-center flex-1">
              {/* Status icon */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
                  isComplete && "bg-emerald-500 text-white",
                  isCurrent && "bg-emerald-500 text-white ring-4 ring-emerald-200 animate-pulse",
                  isPending && "bg-gray-200 text-gray-400"
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>

              {/* Status label */}
              <span
                className={cn(
                  "text-xs mt-2 font-medium",
                  isComplete && "text-emerald-600",
                  isCurrent && "text-emerald-700",
                  isPending && "text-gray-400"
                )}
              >
                {status.label}
              </span>

              {/* Connector line */}
              {index < 2 && (
                <div
                  className={cn(
                    "absolute h-1 w-[calc(33%-20px)] top-5 left-[calc(33%*index+16.5%)]",
                    index < currentIndex ? "bg-emerald-500" : "bg-gray-200"
                  )}
                  style={{
                    left: `calc(${(index + 1) * 33.33}% - 16.5%)`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current status description */}
      <div className="text-center text-sm text-emerald-700">
        {DELIVERY_STATUSES[currentStatus as keyof typeof DELIVERY_STATUSES]?.description}
      </div>
    </div>
  );
}

// =============================================================================
// COST PREVIEW COMPONENT
// =============================================================================

interface CostPreviewProps {
  channel: CpaasChannelId;
  smsSegments?: number;
}

function CostPreview({ channel, smsSegments = 1 }: CostPreviewProps) {
  const unitPrice = DEFAULT_PRICES[channel];
  const totalCost = channel === "SMS" ? unitPrice * smsSegments : unitPrice;
  const scaleInfo = LAUSD_SCALE.scaleMessage(unitPrice, channel);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-blue-600" />
        <span className="font-medium text-blue-800">Cost Preview</span>
      </div>

      {/* Per-message cost */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="text-gray-500 text-xs mb-1">Per Message</div>
          <div className="text-xl font-bold text-blue-700">
            {formatCurrency(totalCost)}
          </div>
          {channel === "SMS" && smsSegments > 1 && (
            <div className="text-xs text-gray-500">
              ({smsSegments} segments × {formatCurrency(unitPrice)})
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="text-gray-500 text-xs mb-1">Monthly (30/day)</div>
          <div className="text-xl font-bold text-blue-700">
            {formatCurrency(totalCost * 30)}
          </div>
        </div>
      </div>

      {/* Scale calculator */}
      <div className="bg-white rounded-lg p-3 border border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-medium text-gray-700">At LAUSD Scale</span>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-blue-700">{scaleInfo.totalCost}</span>
          {" "}to reach all {scaleInfo.familyCount} families
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {scaleInfo.comparisonMessage}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PRIVACY EXPLAINER COMPONENT
// =============================================================================

function PrivacyExplainer() {
  const badgeIcons: Record<string, typeof Shield> = {
    Shield: Shield,
    Lock: Lock,
    FileText: FileText,
    CheckCircle: CheckCircle2,
  };

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-purple-600" />
        <span className="font-medium text-purple-800">Privacy Protection</span>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-lg p-3 border border-purple-100 text-sm">
        <div className="font-medium text-gray-700 mb-2">How Secure Relay Works</div>
        <div className="space-y-2 text-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-purple-500 font-mono text-xs bg-purple-100 px-1 rounded">1</span>
            <span>Vendor sends to <code className="text-xs bg-gray-100 px-1 rounded">TKN_STU_xxx</code></span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-500 font-mono text-xs bg-purple-100 px-1 rounded">2</span>
            <span>SchoolDay resolves token → real contact (hidden)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-500 font-mono text-xs bg-purple-100 px-1 rounded">3</span>
            <span>Message delivered via secure relay network</span>
          </div>
        </div>
      </div>

      {/* Privacy badges */}
      <div className="grid grid-cols-2 gap-2">
        {Object.values(PRIVACY_BADGES).map((badge) => {
          const IconComponent = badgeIcons[badge.icon] || Shield;
          return (
            <div
              key={badge.id}
              className="flex items-center gap-2 bg-white rounded-lg p-2 border border-purple-100"
            >
              <IconComponent className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <span className="text-xs text-gray-700">{badge.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CommTestForm({ onSubmit, onCancel }: CommTestFormProps) {
  // Form state
  const [channel, setChannel] = useState<CommChannel>("EMAIL");
  const [recipientToken, setRecipientToken] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Delivery status simulation state
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatusId | null>(null);
  const [messageId, setMessageId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Get sample students for recipient dropdown
  const recipients = useMemo(() => {
    return SYNTHETIC_DATA.students.slice(0, 20).map((student) => ({
      token: student.token,
      display: `${student.token.substring(0, 16)}... (${student.firstName}, Grade ${student.gradeLevel === 0 ? "K" : student.gradeLevel})`,
      shortToken: student.token.replace("TKN_STU_", "").substring(0, 6),
      firstName: student.firstName,
      gradeLevel: student.gradeLevel,
    }));
  }, []);

  // SMS character counting
  const smsSegments = Math.ceil(body.length / SMS_SEGMENT_LENGTH) || 0;
  const smsCharsRemaining = smsSegments * SMS_SEGMENT_LENGTH - body.length;
  const smsOverLimit = body.length > SMS_SEGMENT_LENGTH * MAX_SMS_SEGMENTS;

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleChannelChange = useCallback((newChannel: CommChannel) => {
    setChannel(newChannel);
    setErrors({});
    setSubject("");
    setBody("");
    // Reset delivery status when changing channel
    setDeliveryStatus(null);
    setMessageId(null);
    setShowSuccess(false);
  }, []);

  const clearFieldError = useCallback((field: string) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const simulateDelivery = useCallback(async () => {
    const newMessageId = generateMessageId();
    setMessageId(newMessageId);

    // Simulate QUEUED
    setDeliveryStatus("QUEUED");

    // Simulate SENT after delay
    await new Promise((resolve) => setTimeout(resolve, DELIVERY_SIMULATION.sentDelay));
    setDeliveryStatus("SENT");

    // Simulate DELIVERED after delay
    await new Promise((resolve) =>
      setTimeout(resolve, DELIVERY_SIMULATION.deliveredDelay - DELIVERY_SIMULATION.sentDelay)
    );
    setDeliveryStatus("DELIVERED");
    setShowSuccess(true);
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setSubmitError(null);
      setDeliveryStatus(null);
      setMessageId(null);
      setShowSuccess(false);

      const formData = {
        channel,
        recipientToken,
        subject: channel === "EMAIL" ? subject : undefined,
        body,
      };

      // Validate based on channel
      const schema = channel === "EMAIL" ? EmailSchema : SmsSchema;
      const result = schema.safeParse(formData);

      if (!result.success) {
        const newErrors: FormErrors = {};
        for (const issue of result.error.issues) {
          const path = issue.path[0];
          if (typeof path === "string") {
            newErrors[path] = issue.message;
          }
        }
        setErrors(newErrors);
        return;
      }

      setIsSubmitting(true);

      try {
        // Start delivery simulation
        simulateDelivery();

        // Call actual onSubmit
        await onSubmit(formData as CommMessage);
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Failed to send message"
        );
        setDeliveryStatus(null);
        setMessageId(null);
      } finally {
        setIsSubmitting(false);
      }
    },
    [channel, recipientToken, subject, body, onSubmit, simulateDelivery]
  );

  // ==========================================================================
  // VALIDATION CHECK
  // ==========================================================================

  const isFormValid =
    recipientToken.length > 0 &&
    body.length > 0 &&
    (channel === "SMS" || subject.length > 0) &&
    !smsOverLimit;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Banner - Amber/Orange Gradient Border */}
      <div className="relative rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-[2px] rounded-lg">
          <div className="absolute inset-[2px] bg-white rounded-lg" />
        </div>
        <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">Communication Gateway Test</h3>
              <p className="text-sm text-white/80">
                Test tokenized messaging through SchoolDay Secure Network
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Privacy-safe delivery
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              No PII exposed
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Full audit trail
            </span>
          </div>
        </div>
      </div>

      {/* Delivery Status Timeline (shows after submit) */}
      {deliveryStatus && (
        <DeliveryStatusTimeline currentStatus={deliveryStatus} messageId={messageId} />
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          <div>
            <div className="font-medium text-emerald-800">Message Delivered!</div>
            <div className="text-sm text-emerald-600">
              The test message was successfully delivered through the secure relay.
            </div>
          </div>
        </div>
      )}

      {/* Submit Error */}
      {submitError && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-3 flex items-center gap-2 text-error-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{submitError}</span>
        </div>
      )}

      {/* Channel Toggle */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Communication Channel
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleChannelChange("EMAIL")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all flex-1",
              channel === "EMAIL"
                ? "border-amber-500 bg-amber-50 text-amber-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            )}
          >
            <Mail className={cn("w-5 h-5", channel === "EMAIL" ? "text-amber-500" : "text-gray-400")} />
            <div className="text-left">
              <div className="font-medium">Email</div>
              <div className="text-xs opacity-70">{formatCurrency(DEFAULT_PRICES.EMAIL)}/msg</div>
            </div>
            {channel === "EMAIL" && (
              <CheckCircle2 className="w-5 h-5 text-amber-500 ml-auto" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleChannelChange("SMS")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all flex-1",
              channel === "SMS"
                ? "border-amber-500 bg-amber-50 text-amber-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            )}
          >
            <MessageSquare className={cn("w-5 h-5", channel === "SMS" ? "text-amber-500" : "text-gray-400")} />
            <div className="text-left">
              <div className="font-medium">SMS</div>
              <div className="text-xs opacity-70">{formatCurrency(DEFAULT_PRICES.SMS)}/segment</div>
            </div>
            {channel === "SMS" && (
              <CheckCircle2 className="w-5 h-5 text-amber-500 ml-auto" />
            )}
          </button>
        </div>
      </div>

      {/* Cost Preview */}
      <CostPreview channel={channel} smsSegments={channel === "SMS" ? Math.max(1, smsSegments) : 1} />

      {/* Recipient Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Recipient (Tokenized) *
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={recipientToken}
            onChange={(e) => {
              setRecipientToken(e.target.value);
              clearFieldError("recipientToken");
            }}
            className={cn(
              "w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm appearance-none bg-white",
              "focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-500",
              errors.recipientToken ? "border-error-300 bg-error-50" : "border-gray-300"
            )}
          >
            <option value="">Select a recipient...</option>
            {recipients.map((r) => (
              <option key={r.token} value={r.token}>
                TKN_STU_{r.shortToken} ({r.firstName}, Grade {r.gradeLevel === 0 ? "K" : r.gradeLevel})
              </option>
            ))}
          </select>
        </div>
        {errors.recipientToken && (
          <p className="text-xs text-error-600">{errors.recipientToken}</p>
        )}
        <p className="text-xs text-gray-500">
          Messages are routed through SchoolDay&apos;s privacy relay - no real contact info is exposed
        </p>
      </div>

      {/* Email Subject (only for email) */}
      {channel === "EMAIL" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Subject *
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              clearFieldError("subject");
            }}
            placeholder="Enter email subject..."
            className={cn(
              "w-full px-3 py-2.5 border rounded-lg text-sm",
              "focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-500",
              errors.subject ? "border-error-300 bg-error-50" : "border-gray-300"
            )}
          />
          {errors.subject && (
            <p className="text-xs text-error-600">{errors.subject}</p>
          )}
        </div>
      )}

      {/* Message Body */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Message Body *
          </label>
          {channel === "SMS" && (
            <div className="flex items-center gap-2 text-xs">
              <span
                className={cn(
                  "px-2 py-0.5 rounded",
                  smsOverLimit
                    ? "bg-error-100 text-error-700"
                    : smsSegments > 1
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-600"
                )}
              >
                {body.length} / {SMS_SEGMENT_LENGTH * MAX_SMS_SEGMENTS}
              </span>
              <span className="text-gray-500">
                {smsSegments} segment{smsSegments !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
        <textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            clearFieldError("body");
          }}
          placeholder={
            channel === "EMAIL"
              ? "Enter your message..."
              : "Enter SMS message (160 chars per segment)..."
          }
          rows={channel === "EMAIL" ? 5 : 3}
          className={cn(
            "w-full px-3 py-2.5 border rounded-lg text-sm resize-none",
            "focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-500",
            errors.body || smsOverLimit ? "border-error-300 bg-error-50" : "border-gray-300"
          )}
        />
        {errors.body && (
          <p className="text-xs text-error-600">{errors.body}</p>
        )}
        {channel === "SMS" && !errors.body && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {smsSegments > 0 && !smsOverLimit && (
                <>
                  {smsCharsRemaining} chars until next segment
                </>
              )}
              {smsOverLimit && (
                <span className="text-error-600">
                  Maximum 3 SMS segments ({SMS_SEGMENT_LENGTH * MAX_SMS_SEGMENTS} characters)
                </span>
              )}
            </span>
            <div className="flex gap-1">
              {[1, 2, 3].map((seg) => (
                <div
                  key={seg}
                  className={cn(
                    "w-4 h-1.5 rounded-full transition-colors",
                    smsSegments >= seg
                      ? smsOverLimit
                        ? "bg-error-400"
                        : "bg-amber-400"
                      : "bg-gray-200"
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Privacy Explainer */}
      <PrivacyExplainer />

      {/* Preview */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Message Preview</h4>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-sm">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            {channel === "EMAIL" ? (
              <Mail className="w-4 h-4" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )}
            <span className="font-medium">{channel}</span>
            <span className="text-amber-600">
              → {recipientToken ? `${recipientToken.substring(0, 16)}...` : "[No recipient]"}
            </span>
          </div>
          {channel === "EMAIL" && (
            <div className="text-gray-700 font-medium mb-1">
              {subject || "[No subject]"}
            </div>
          )}
          <div className="text-gray-600 whitespace-pre-wrap">
            {body || "[No message]"}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>

        <div className="flex items-center gap-3">
          {/* Show cost in button area */}
          <span className="text-sm text-gray-500">
            Est. cost: <span className="font-medium text-blue-600">
              {formatCurrency(channel === "SMS" ? DEFAULT_PRICES.SMS * Math.max(1, smsSegments) : DEFAULT_PRICES.EMAIL)}
            </span>
          </span>

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium",
              "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
              "hover:from-amber-600 hover:to-orange-600 active:scale-95",
              "disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Test Message
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

export default CommTestForm;
