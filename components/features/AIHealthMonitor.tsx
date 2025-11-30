"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureBadge } from "./FeatureGate";

interface HealthMetric {
  name: string;
  status: "healthy" | "warning" | "critical";
  value: string;
  trend?: "up" | "down" | "stable";
  lastChecked: Date;
}

interface IntegrationAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
  suggestion: string;
  timestamp: Date;
}

// Mock data for demo
const MOCK_METRICS: HealthMetric[] = [
  { name: "API Response Time", status: "healthy", value: "124ms", trend: "down", lastChecked: new Date() },
  { name: "SSO Success Rate", status: "healthy", value: "99.8%", trend: "stable", lastChecked: new Date() },
  { name: "Data Sync Status", status: "warning", value: "1 pending", trend: "up", lastChecked: new Date() },
  { name: "Webhook Delivery", status: "healthy", value: "100%", trend: "stable", lastChecked: new Date() },
];

const MOCK_ALERTS: IntegrationAlert[] = [
  {
    id: "1",
    severity: "warning",
    message: "OneRoster sync taking longer than usual",
    suggestion: "Consider optimizing batch size or check network latency",
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: "2",
    severity: "info",
    message: "New API version available (v2.1)",
    suggestion: "Review changelog and plan migration timeline",
    timestamp: new Date(Date.now() - 3600000),
  },
];

export function AIHealthMonitor() {
  const [metrics, setMetrics] = useState<HealthMetric[]>(MOCK_METRICS);
  const [alerts] = useState<IntegrationAlert[]>(MOCK_ALERTS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setMetrics((prev) =>
      prev.map((m) => ({ ...m, lastChecked: new Date() }))
    );
    setIsRefreshing(false);
  };

  const statusIcon = {
    healthy: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    critical: <Activity className="w-4 h-4 text-red-500" />,
  };

  const severityColors = {
    info: "bg-blue-50 border-blue-200 text-blue-700",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
    critical: "bg-red-50 border-red-200 text-red-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                AI Integration Health Monitor
              </h2>
              <FeatureBadge status="beta" />
            </div>
            <p className="text-sm text-gray-500">
              Real-time monitoring with AI-powered anomaly detection
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              {statusIcon[metric.status]}
              {metric.trend && (
                <TrendingUp
                  className={cn(
                    "w-4 h-4",
                    metric.trend === "up" && "text-green-500",
                    metric.trend === "down" && "text-red-500 rotate-180",
                    metric.trend === "stable" && "text-gray-400"
                  )}
                />
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
            <div className="text-sm text-gray-500">{metric.name}</div>
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {metric.lastChecked.toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">AI Insights</h3>
        </div>
        <p className="text-sm text-blue-800">
          Integration health is <strong>94% optimal</strong>. One sync operation
          is pending - this typically resolves within 5 minutes. No action required.
        </p>
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Recent Alerts</h3>
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "rounded-lg border p-4",
              severityColors[alert.severity]
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{alert.message}</p>
                <p className="text-sm opacity-80 mt-1">
                  Suggestion: {alert.suggestion}
                </p>
              </div>
              <span className="text-xs opacity-70">
                {Math.round((Date.now() - alert.timestamp.getTime()) / 60000)}m ago
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AIHealthMonitor;
