"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Clock,
  ChevronDown,
  ChevronRight,
  FileJson,
  FileSpreadsheet,
  Shield,
  Key,
  Database,
  MessageSquare,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditLog } from "@/lib/types";

// =============================================================================
// TYPES
// =============================================================================

interface AuditLogViewerProps {
  logs: AuditLog[];
}

// =============================================================================
// EVENT TYPE CONFIGURATION
// =============================================================================

const EVENT_TYPES: Record<string, { color: string; bgColor: string; icon: typeof Shield }> = {
  // Authentication & Security
  "auth.login": { color: "text-success-400", bgColor: "bg-success-500/20", icon: Shield },
  "auth.logout": { color: "text-gray-400", bgColor: "bg-gray-500/20", icon: Shield },
  "auth.failed": { color: "text-error-400", bgColor: "bg-error-500/20", icon: AlertTriangle },

  // Credentials
  "credentials.created": { color: "text-primary", bgColor: "bg-primary/20", icon: Key },
  "credentials.rotated": { color: "text-warning-400", bgColor: "bg-warning-500/20", icon: Key },
  "credentials.revoked": { color: "text-error-400", bgColor: "bg-error-500/20", icon: Key },

  // API Access
  "api.request": { color: "text-primary", bgColor: "bg-primary/20", icon: Database },
  "api.error": { color: "text-error-400", bgColor: "bg-error-500/20", icon: Database },
  "api.rate_limited": { color: "text-warning-400", bgColor: "bg-warning-500/20", icon: AlertTriangle },

  // Data Access
  "data.accessed": { color: "text-secondary", bgColor: "bg-secondary/20", icon: Database },
  "data.exported": { color: "text-warning-400", bgColor: "bg-warning-500/20", icon: Database },

  // Communication
  "comm.sent": { color: "text-success-400", bgColor: "bg-success-500/20", icon: MessageSquare },
  "comm.failed": { color: "text-error-400", bgColor: "bg-error-500/20", icon: MessageSquare },

  // Configuration
  "config.updated": { color: "text-primary", bgColor: "bg-primary/20", icon: Settings },
  "config.sso": { color: "text-secondary", bgColor: "bg-secondary/20", icon: Settings },
  "config.lti": { color: "text-secondary", bgColor: "bg-secondary/20", icon: Settings },

  // PoDS Application
  "pods.submitted": { color: "text-primary", bgColor: "bg-primary/20", icon: CheckCircle2 },
  "pods.approved": { color: "text-success-400", bgColor: "bg-success-500/20", icon: CheckCircle2 },
  "pods.rejected": { color: "text-error-400", bgColor: "bg-error-500/20", icon: XCircle },

  // Default
  default: { color: "text-gray-400", bgColor: "bg-gray-500/20", icon: Info },
};

function getEventConfig(action: string): { color: string; bgColor: string; icon: typeof Shield } {
  return EVENT_TYPES[action] ?? EVENT_TYPES.default!;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AuditLogViewer({ logs }: AuditLogViewerProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const toggleExpand = useCallback((logId: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  }, []);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatFullTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }).format(date);
  };

  const exportToCsv = useCallback(() => {
    const headers = ["Timestamp", "Action", "Resource Type", "Resource ID", "Details", "IP Address", "User Agent"];
    const rows = logs.map((log) => [
      log.timestamp.toISOString(),
      log.action,
      log.resourceType,
      log.resourceId || "",
      JSON.stringify(log.details || {}),
      log.ipAddress || "",
      log.userAgent || "",
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  const exportToJson = useCallback(() => {
    const json = JSON.stringify(logs, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  // Sort logs by timestamp (newest first)
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [logs]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-800">Audit Log</span>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {logs.length} events
          </span>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={exportToJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileJson className="w-3.5 h-3.5" />
            JSON
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {sortedLogs.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No audit events yet</p>
          </div>
        ) : (
          sortedLogs.map((log) => {
            const isExpanded = expandedLogs.has(log.id);
            const eventConfig = getEventConfig(log.action);
            const Icon = eventConfig.icon;
            const hasDetails = log.details && Object.keys(log.details).length > 0;

            return (
              <div key={log.id} className="relative">
                {/* Main Row */}
                <div
                  className={cn(
                    "px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors",
                    hasDetails && "cursor-pointer"
                  )}
                  onClick={() => hasDetails && toggleExpand(log.id)}
                >
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        eventConfig.bgColor
                      )}
                    >
                      <Icon className={cn("w-4 h-4", eventConfig.color)} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Event Type Badge */}
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          eventConfig.bgColor,
                          eventConfig.color
                        )}
                      >
                        {log.action}
                      </span>

                      {/* Resource Type */}
                      {log.resourceType && (
                        <span className="text-xs text-gray-500">
                          {log.resourceType}
                        </span>
                      )}
                    </div>

                    {/* Resource ID */}
                    {log.resourceId && (
                      <p className="text-sm text-gray-700 truncate">
                        <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                          {log.resourceId}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Timestamp & Expand */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span title={formatFullTimestamp(log.timestamp)}>
                      {formatTimestamp(log.timestamp)}
                    </span>
                    {hasDetails && (
                      <div className="text-gray-400">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && hasDetails && (
                  <div className="px-4 pb-3 pl-14">
                    <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                      <pre className="text-xs text-gray-300 font-mono">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                    {(log.ipAddress || log.userAgent) && (
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        {log.ipAddress && (
                          <span>IP: {log.ipAddress}</span>
                        )}
                        {log.userAgent && (
                          <span className="truncate max-w-xs" title={log.userAgent}>
                            UA: {log.userAgent}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AuditLogViewer;
