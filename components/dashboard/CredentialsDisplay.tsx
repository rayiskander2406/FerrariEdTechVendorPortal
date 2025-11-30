"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Clock,
  Activity,
  Shield,
  Terminal,
  ChevronDown,
  ChevronUp,
  Play,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SandboxCredentials } from "@/lib/types";
import { CredentialsSkeleton } from "@/components/ui/Skeleton";

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

interface ApiExample {
  name: string;
  description: string;
  endpoint: string;
  queryParams?: string;
}

interface ApiResponse {
  status: number;
  data: unknown;
  timing: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CredentialsDisplay({ credentials }: CredentialsDisplayProps) {
  const [revealedFields, setRevealedFields] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showApiExplorer, setShowApiExplorer] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("/students");
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [limitParam, setLimitParam] = useState("5");

  // Prevent hydration mismatch by waiting for mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Normalize expiresAt to Date object (handles JSON string serialization)
  const expiresAt = useMemo(() => {
    if (credentials.expiresAt instanceof Date) {
      return credentials.expiresAt;
    }
    return new Date(credentials.expiresAt);
  }, [credentials.expiresAt]);

  // Define credential fields - ALL sensitive values masked by default
  const fields: CredentialField[] = [
    { key: "apiKey", label: "API_KEY", value: credentials.apiKey, masked: true },
    { key: "apiSecret", label: "API_SECRET", value: credentials.apiSecret, masked: true },
    { key: "clientId", label: "CLIENT_ID", value: credentials.id, masked: true },
    { key: "clientSecret", label: "CLIENT_SECRET", value: credentials.apiSecret.slice(0, 32), masked: true },
    { key: "baseUrl", label: "BASE_URL", value: credentials.baseUrl, masked: false },
  ];

  // API endpoints for the explorer
  const apiEndpoints: ApiExample[] = [
    {
      name: "Students",
      description: "List students with tokenized PII",
      endpoint: "/students",
      queryParams: `?limit=${limitParam}`,
    },
    {
      name: "Teachers",
      description: "List teachers",
      endpoint: "/teachers",
      queryParams: `?limit=${limitParam}`,
    },
    {
      name: "Classes",
      description: "List classes with enrollment info",
      endpoint: "/classes",
      queryParams: `?limit=${limitParam}`,
    },
    {
      name: "Schools",
      description: "List LAUSD schools",
      endpoint: "/schools",
      queryParams: `?limit=${limitParam}`,
    },
    {
      name: "Enrollments",
      description: "Student-class relationships",
      endpoint: "/enrollments",
      queryParams: `?limit=${limitParam}`,
    },
    {
      name: "Courses",
      description: "Course catalog",
      endpoint: "/courses",
      queryParams: `?limit=${limitParam}`,
    },
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

  const executeApiCall = useCallback(async () => {
    setIsLoading(true);
    setApiResponse(null);

    const startTime = performance.now();
    const baseUrl = "/api/sandbox/oneroster";
    const endpoint = apiEndpoints.find(e => e.endpoint === selectedEndpoint);
    const url = `${baseUrl}${selectedEndpoint}${endpoint?.queryParams || ""}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${credentials.apiKey}`,
          "Accept": "application/json",
        },
      });

      const data = await response.json();
      const timing = Math.round(performance.now() - startTime);

      setApiResponse({
        status: response.status,
        data,
        timing,
      });
    } catch (error) {
      const timing = Math.round(performance.now() - startTime);
      setApiResponse({
        status: 500,
        data: { error: error instanceof Error ? error.message : "Request failed" },
        timing,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedEndpoint, credentials.apiKey, apiEndpoints, limitParam]);

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

  const formatJson = (data: unknown): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const daysUntilExpiration = Math.ceil(
    (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const isExpiringSoon = daysUntilExpiration <= 7;
  const isExpired = daysUntilExpiration <= 0;

  // Get current endpoint for cURL display
  const currentEndpoint = apiEndpoints.find(e => e.endpoint === selectedEndpoint);
  const curlCommand = useMemo(() => {
    const baseUrl = typeof window !== "undefined"
      ? `${window.location.origin}/api/sandbox/oneroster`
      : credentials.baseUrl;
    return `curl -X GET "${baseUrl}${selectedEndpoint}${currentEndpoint?.queryParams || ""}" \\
  -H "Authorization: Bearer ${credentials.apiKey}" \\
  -H "Accept: application/json"`;
  }, [selectedEndpoint, currentEndpoint?.queryParams, credentials.apiKey, credentials.baseUrl]);

  // Show skeleton until mounted to prevent hydration glitch
  if (!isMounted) {
    return <CredentialsSkeleton />;
  }

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
                : `Expires ${formatDate(expiresAt)}`}
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

      {/* API Explorer Section */}
      <div className="border-t border-gray-700">
        <button
          onClick={() => setShowApiExplorer(!showApiExplorer)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-white">API Explorer - Try It Now</span>
          </div>
          {showApiExplorer ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {showApiExplorer && (
          <div className="px-4 pb-4 space-y-4">
            {/* Endpoint Selection */}
            <div className="flex flex-wrap gap-2">
              {apiEndpoints.map((endpoint) => (
                <button
                  key={endpoint.endpoint}
                  onClick={() => {
                    setSelectedEndpoint(endpoint.endpoint);
                    setApiResponse(null);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    selectedEndpoint === endpoint.endpoint
                      ? "bg-primary text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  )}
                >
                  {endpoint.name}
                </button>
              ))}
            </div>

            {/* Limit Parameter */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-400">Results limit:</label>
              <select
                value={limitParam}
                onChange={(e) => setLimitParam(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
              >
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
            </div>

            {/* Current Endpoint Info */}
            {currentEndpoint && (
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-white">{currentEndpoint.name}</span>
                    <span className="ml-2 text-xs text-gray-500">GET {currentEndpoint.endpoint}</span>
                  </div>
                  <button
                    onClick={executeApiCall}
                    disabled={isLoading}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      isLoading
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-primary text-white hover:bg-primary/80"
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        Execute
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400">{currentEndpoint.description}</p>
              </div>
            )}

            {/* Response Display */}
            {apiResponse && (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        apiResponse.status >= 200 && apiResponse.status < 300
                          ? "bg-success-500/20 text-success-400"
                          : "bg-error-500/20 text-error-400"
                      )}
                    >
                      {apiResponse.status}
                    </span>
                    <span className="text-xs text-gray-500">{apiResponse.timing}ms</span>
                  </div>
                  <button
                    onClick={() => handleCopy("response", formatJson(apiResponse.data))}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                      copiedField === "response"
                        ? "text-success-400 bg-success-500/20"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    )}
                  >
                    {copiedField === "response" ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 text-xs text-gray-300 font-mono overflow-x-auto max-h-80 overflow-y-auto">
                  {formatJson(apiResponse.data)}
                </pre>
              </div>
            )}

            {/* cURL Command */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">cURL command (for Postman)</span>
                <button
                  onClick={() => handleCopy("curl", curlCommand)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                    copiedField === "curl"
                      ? "text-success-400 bg-success-500/20"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  )}
                >
                  {copiedField === "curl" ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap break-all">
                {curlCommand}
              </pre>
            </div>

            {/* Tip */}
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-xs text-primary-300">
                <strong>Tip:</strong> All student data is tokenized for privacy. Last names show as
                &quot;[TOKENIZED]&quot; and emails use relay addresses. This matches Privacy-Safe access tier.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CredentialsDisplay;
