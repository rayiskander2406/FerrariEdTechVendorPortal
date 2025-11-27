"use client";

import { useState, useCallback } from "react";
import {
  Play,
  X,
  Clock,
  Database,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getOneRosterResponse } from "@/lib/data/synthetic";

// =============================================================================
// TYPES
// =============================================================================

interface ApiTesterProps {
  onClose: () => void;
}

type Endpoint = "/users" | "/classes" | "/enrollments" | "/orgs";
type Limit = 10 | 25 | 50;

interface ApiResult {
  status: number;
  statusText: string;
  recordCount: number;
  responseTime: number;
  data: unknown;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ENDPOINTS: { value: Endpoint; label: string; description: string }[] = [
  { value: "/users", label: "Users", description: "Students & Teachers" },
  { value: "/classes", label: "Classes", description: "Course sections" },
  { value: "/enrollments", label: "Enrollments", description: "Class rosters" },
  { value: "/orgs", label: "Orgs", description: "Schools & Districts" },
];

const LIMITS: Limit[] = [10, 25, 50];

const BASE_URL = "https://api.schoolday.lausd.net/ims/oneroster/v1p1";

// =============================================================================
// SYNTAX HIGHLIGHTING
// =============================================================================

function highlightJson(json: string): React.ReactNode[] {
  const lines = json.split("\n");

  return lines.map((line, lineIndex) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let keyIndex = 0;

    // Match patterns in order
    while (remaining.length > 0) {
      // Check for tokenized values (TKN_XXX_...)
      const tokenMatch = remaining.match(/^("TKN_[A-Z]{3}_[A-Z0-9]+(?:@[^"]+)?"|TKN_[A-Z]{3}_[A-Z0-9]+(?:@[^\s,}]+)?)/);
      if (tokenMatch) {
        parts.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-amber-400">
            {tokenMatch[0]}
          </span>
        );
        remaining = remaining.slice(tokenMatch[0].length);
        continue;
      }

      // Check for [TOKENIZED]
      const tokenizedMatch = remaining.match(/^"\[TOKENIZED\]"/);
      if (tokenizedMatch) {
        parts.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-amber-400">
            {tokenizedMatch[0]}
          </span>
        );
        remaining = remaining.slice(tokenizedMatch[0].length);
        continue;
      }

      // Check for string keys
      const keyMatch = remaining.match(/^"([^"]+)":/);
      if (keyMatch) {
        parts.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-cyan-400">
            &quot;{keyMatch[1]}&quot;
          </span>
        );
        parts.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-gray-400">
            :
          </span>
        );
        remaining = remaining.slice(keyMatch[0].length);
        continue;
      }

      // Check for string values
      const stringMatch = remaining.match(/^"([^"]*)"/);
      if (stringMatch) {
        parts.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-emerald-400">
            &quot;{stringMatch[1]}&quot;
          </span>
        );
        remaining = remaining.slice(stringMatch[0].length);
        continue;
      }

      // Check for numbers
      const numberMatch = remaining.match(/^-?\d+\.?\d*/);
      if (numberMatch) {
        parts.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-purple-400">
            {numberMatch[0]}
          </span>
        );
        remaining = remaining.slice(numberMatch[0].length);
        continue;
      }

      // Check for booleans/null
      const boolMatch = remaining.match(/^(true|false|null)/);
      if (boolMatch) {
        parts.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-orange-400">
            {boolMatch[0]}
          </span>
        );
        remaining = remaining.slice(boolMatch[0].length);
        continue;
      }

      // Check for brackets/braces
      const bracketMatch = remaining.match(/^[\[\]{}]/);
      if (bracketMatch) {
        parts.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-gray-300">
            {bracketMatch[0]}
          </span>
        );
        remaining = remaining.slice(1);
        continue;
      }

      // Default: take one character
      parts.push(
        <span key={`${lineIndex}-${keyIndex++}`} className="text-gray-400">
          {remaining[0]}
        </span>
      );
      remaining = remaining.slice(1);
    }

    return (
      <div key={lineIndex} className="whitespace-pre">
        {parts}
      </div>
    );
  });
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ApiTester({ onClose }: ApiTesterProps) {
  const [endpoint, setEndpoint] = useState<Endpoint>("/users");
  const [limit, setLimit] = useState<Limit>(10);
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [copied, setCopied] = useState(false);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleExecute = useCallback(async () => {
    setIsExecuting(true);
    setResult(null);

    // Simulate network delay
    const startTime = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));

    try {
      const response = getOneRosterResponse(endpoint, undefined, limit, 0);
      const endTime = performance.now();

      // Count records
      let recordCount = 0;
      if ("users" in response && response.users) recordCount = response.users.length;
      if ("classes" in response && response.classes) recordCount = response.classes.length;
      if ("enrollments" in response && response.enrollments) recordCount = response.enrollments.length;
      if ("orgs" in response && response.orgs) recordCount = response.orgs.length;

      setResult({
        status: 200,
        statusText: "OK",
        recordCount,
        responseTime: Math.round(endTime - startTime),
        data: response,
      });
    } catch {
      setResult({
        status: 500,
        statusText: "Internal Server Error",
        recordCount: 0,
        responseTime: 0,
        data: { error: "Failed to fetch data" },
      });
    } finally {
      setIsExecuting(false);
    }
  }, [endpoint, limit]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [result]);

  const requestUrl = `${BASE_URL}${endpoint}?limit=${limit}`;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="space-y-4">
      {/* Header Banner - Green/Emerald Gradient Border */}
      <div className="relative rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-[2px] rounded-lg">
          <div className="absolute inset-[2px] bg-white rounded-lg" />
        </div>
        <div className="relative bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">OneRoster API Tester</h3>
                <p className="text-sm text-white/80">
                  Test API endpoints with tokenized sandbox data
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Endpoint Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ENDPOINTS.map((ep) => (
          <button
            key={ep.value}
            onClick={() => setEndpoint(ep.value)}
            className={cn(
              "flex flex-col items-start px-4 py-2 rounded-lg border transition-all min-w-[120px]",
              endpoint === ep.value
                ? "border-emerald-500 bg-emerald-50 shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300"
            )}
          >
            <span
              className={cn(
                "font-medium text-sm",
                endpoint === ep.value ? "text-emerald-700" : "text-gray-700"
              )}
            >
              {ep.label}
            </span>
            <span className="text-xs text-gray-500">{ep.description}</span>
          </button>
        ))}
      </div>

      {/* Controls Row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Limit:</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) as Limit)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
          >
            {LIMITS.map((l) => (
              <option key={l} value={l}>
                {l} records
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExecute}
          disabled={isExecuting}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
            "bg-gradient-to-r from-emerald-500 to-green-500 text-white",
            "hover:from-emerald-600 hover:to-green-600 active:scale-95",
            "disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed",
            "transition-all duration-200"
          )}
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Execute
            </>
          )}
        </button>
      </div>

      {/* Request Preview */}
      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-medium rounded">
            GET
          </span>
          <span className="text-xs text-gray-400">Request URL</span>
        </div>
        <code className="text-sm text-emerald-400 font-mono break-all">
          {requestUrl}
        </code>
      </div>

      {/* Response Panel */}
      {result && (
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          {/* Response Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <div className="flex items-center gap-4">
              {/* Status Badge */}
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
                  result.status === 200
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                )}
              >
                {result.status === 200 ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
                {result.status} {result.statusText}
              </div>

              {/* Record Count */}
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Database className="w-3 h-3" />
                {result.recordCount} records
              </div>

              {/* Response Time */}
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {result.responseTime}ms
              </div>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* JSON Response */}
          <div className="p-4 max-h-80 overflow-auto">
            <div className="font-mono text-xs leading-relaxed">
              {highlightJson(JSON.stringify(result.data, null, 2))}
            </div>
          </div>

          {/* Legend */}
          <div className="px-4 py-2 border-t border-gray-700 flex items-center gap-4 text-xs">
            <span className="text-gray-500">Legend:</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-gray-400">Tokenized</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-gray-400">Keys</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-gray-400">Strings</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-gray-400">Numbers</span>
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !isExecuting && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
            <Play className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600">
            Click <span className="font-medium text-emerald-600">Execute</span> to test the API endpoint
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Response will appear here with syntax highlighting
          </p>
        </div>
      )}
    </div>
  );
}

export default ApiTester;
