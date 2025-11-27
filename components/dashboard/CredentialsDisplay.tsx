"use client";

import { useState, useCallback } from "react";
import {
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Clock,
  Activity,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SandboxCredentials } from "@/lib/types";

// =============================================================================
// TYPES
// =============================================================================

interface CredentialsDisplayProps {
  credentials: SandboxCredentials;
}

interface CredentialField {
  key: string;
  label: string;
  value: string;
  masked: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CredentialsDisplay({ credentials }: CredentialsDisplayProps) {
  const [revealedFields, setRevealedFields] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Define credential fields
  const fields: CredentialField[] = [
    { key: "apiKey", label: "API_KEY", value: credentials.apiKey, masked: false },
    { key: "apiSecret", label: "API_SECRET", value: credentials.apiSecret, masked: true },
    { key: "clientId", label: "CLIENT_ID", value: credentials.id, masked: false },
    { key: "clientSecret", label: "CLIENT_SECRET", value: credentials.apiSecret.slice(0, 32), masked: true },
    { key: "baseUrl", label: "BASE_URL", value: credentials.baseUrl, masked: false },
  ];

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const toggleReveal = useCallback((fieldKey: string) => {
    setRevealedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldKey)) {
        next.delete(fieldKey);
      } else {
        next.add(fieldKey);
      }
      return next;
    });
  }, []);

  const handleCopy = useCallback(async (fieldKey: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Clipboard API not available
    }
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const maskValue = (value: string) => {
    return "•".repeat(Math.min(value.length, 32));
  };

  const daysUntilExpiration = Math.ceil(
    (credentials.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const isExpiringSoon = daysUntilExpiration <= 7;
  const isExpired = daysUntilExpiration <= 0;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" />
          <span className="font-medium text-white">Sandbox Credentials</span>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
            isExpired
              ? "bg-error-500/20 text-error-400"
              : isExpiringSoon
                ? "bg-warning-500/20 text-warning-400"
                : "bg-success-500/20 text-success-400"
          )}
        >
          <Shield className="w-3 h-3" />
          {credentials.status}
        </div>
      </div>

      {/* Credential Rows */}
      <div className="divide-y divide-gray-800">
        {fields.map((field) => {
          const isRevealed = revealedFields.has(field.key);
          const isCopied = copiedField === field.key;
          const displayValue = field.masked && !isRevealed ? maskValue(field.value) : field.value;

          return (
            <div
              key={field.key}
              className="px-4 py-3 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 font-medium mb-1">
                  {field.label}
                </div>
                <div className="font-mono text-sm text-gray-200 truncate">
                  {displayValue}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Reveal Button (for masked fields) */}
                {field.masked && (
                  <button
                    onClick={() => toggleReveal(field.key)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    title={isRevealed ? "Hide" : "Reveal"}
                  >
                    {isRevealed ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                )}

                {/* Copy Button */}
                <button
                  onClick={() => handleCopy(field.key, field.value)}
                  className={cn(
                    "p-2 rounded transition-colors",
                    isCopied
                      ? "text-success-400 bg-success-500/20"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  )}
                  title={isCopied ? "Copied!" : "Copy"}
                >
                  {isCopied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/50 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          {/* Expiration */}
          <div
            className={cn(
              "flex items-center gap-1.5",
              isExpired
                ? "text-error-400"
                : isExpiringSoon
                  ? "text-warning-400"
                  : "text-gray-400"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {isExpired
                ? "Expired"
                : `Expires ${formatDate(credentials.expiresAt)}`}
            </span>
            {!isExpired && daysUntilExpiration <= 30 && (
              <span className="text-gray-500">({daysUntilExpiration} days)</span>
            )}
          </div>
        </div>

        {/* Rate Limit */}
        <div className="flex items-center gap-1.5 text-gray-400">
          <Activity className="w-3.5 h-3.5" />
          <span>{credentials.rateLimitPerMinute} calls/min</span>
        </div>
      </div>

      {/* Allowed Endpoints */}
      {credentials.allowedEndpoints.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-700 bg-gray-800/30">
          <div className="text-xs text-gray-500 mb-1.5">Allowed Endpoints</div>
          <div className="flex flex-wrap gap-1.5">
            {credentials.allowedEndpoints.map((endpoint) => (
              <span
                key={endpoint}
                className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300 font-mono"
              >
                {endpoint}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CredentialsDisplay;
