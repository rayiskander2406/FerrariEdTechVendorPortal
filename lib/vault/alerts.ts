/**
 * Vault Security Alerts
 *
 * Triggers and manages security alerts for suspicious vault activity.
 * Alerts are stored in the vault database and can be integrated with
 * external monitoring systems.
 *
 * Alert Types:
 * - rate_limit_exceeded: Too many requests in time window
 * - bulk_detokenize_attempt: Large batch detokenization attempt
 * - suspicious_pattern: Unusual access patterns detected
 * - access_denied: Repeated failed access attempts
 *
 * @module lib/vault/alerts
 */

import {
  getVaultClient,
  type AlertType,
  type AlertSeverity,
  type AlertStatus,
  type RequestorType,
} from './client';

// =============================================================================
// TYPES
// =============================================================================

export interface TriggerAlertInput {
  alertType: AlertType;
  severity: AlertSeverity;
  requestorId: string;
  requestorType: RequestorType;
  requestorIp?: string;
  description: string;
  metadata?: Record<string, unknown>;
  triggerEvent?: string;
  triggerCount?: number;
  triggerThreshold?: number;
}

export interface SecurityAlert {
  id: string;
  alertType: AlertType;
  severity: AlertSeverity;
  requestorId: string;
  requestorType: string;
  requestorIp: string | null;
  description: string;
  metadata: string | null;
  triggerEvent: string | null;
  triggerCount: number | null;
  triggerThreshold: number | null;
  status: AlertStatus;
  acknowledgedBy: string | null;
  acknowledgedAt: Date | null;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  resolution: string | null;
  createdAt: Date;
}

// =============================================================================
// ALERT FUNCTIONS
// =============================================================================

/**
 * Trigger a security alert.
 * Creates an alert record in the vault database.
 */
export async function triggerSecurityAlert(
  input: TriggerAlertInput
): Promise<SecurityAlert | null> {
  try {
    const vault = getVaultClient();

    const alert = await vault.securityAlert.create({
      data: {
        alertType: input.alertType,
        severity: input.severity,
        requestorId: input.requestorId,
        requestorType: input.requestorType,
        requestorIp: input.requestorIp ?? null,
        description: input.description,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        triggerEvent: input.triggerEvent ?? null,
        triggerCount: input.triggerCount ?? null,
        triggerThreshold: input.triggerThreshold ?? null,
        status: 'open',
      },
    });

    // Log to console for immediate visibility
    console.warn(
      `[SECURITY ALERT] ${input.severity.toUpperCase()}: ${input.alertType}`,
      {
        requestorId: input.requestorId,
        description: input.description,
        alertId: alert.id,
      }
    );

    // In production, this could also:
    // - Send to Slack/PagerDuty
    // - Trigger an email alert
    // - Push to SIEM system
    if (input.severity === 'critical' || input.severity === 'high') {
      await notifySecurityTeam(alert as SecurityAlert);
    }

    return alert as SecurityAlert;
  } catch (error) {
    console.error('[Vault] Failed to create security alert:', error);
    return null;
  }
}

/**
 * Acknowledge an alert.
 */
export async function acknowledgeAlert(
  alertId: string,
  acknowledgedBy: string
): Promise<SecurityAlert | null> {
  try {
    const vault = getVaultClient();

    const alert = await vault.securityAlert.update({
      where: { id: alertId },
      data: {
        status: 'acknowledged',
        acknowledgedBy,
        acknowledgedAt: new Date(),
      },
    });

    return alert as SecurityAlert;
  } catch (error) {
    console.error('[Vault] Failed to acknowledge alert:', error);
    return null;
  }
}

/**
 * Resolve an alert.
 */
export async function resolveAlert(
  alertId: string,
  resolvedBy: string,
  resolution: string
): Promise<SecurityAlert | null> {
  try {
    const vault = getVaultClient();

    const alert = await vault.securityAlert.update({
      where: { id: alertId },
      data: {
        status: 'resolved',
        resolvedBy,
        resolvedAt: new Date(),
        resolution,
      },
    });

    return alert as SecurityAlert;
  } catch (error) {
    console.error('[Vault] Failed to resolve alert:', error);
    return null;
  }
}

/**
 * Mark an alert as false positive.
 */
export async function markAlertFalsePositive(
  alertId: string,
  resolvedBy: string,
  reason: string
): Promise<SecurityAlert | null> {
  try {
    const vault = getVaultClient();

    const alert = await vault.securityAlert.update({
      where: { id: alertId },
      data: {
        status: 'false_positive',
        resolvedBy,
        resolvedAt: new Date(),
        resolution: `False positive: ${reason}`,
      },
    });

    return alert as SecurityAlert;
  } catch (error) {
    console.error('[Vault] Failed to mark alert as false positive:', error);
    return null;
  }
}

/**
 * Get open alerts.
 */
export async function getOpenAlerts(
  options: {
    severity?: AlertSeverity;
    alertType?: AlertType;
    limit?: number;
  } = {}
): Promise<SecurityAlert[]> {
  try {
    const vault = getVaultClient();

    const alerts = await vault.securityAlert.findMany({
      where: {
        status: 'open',
        ...(options.severity && { severity: options.severity }),
        ...(options.alertType && { alertType: options.alertType }),
      },
      orderBy: [
        { severity: 'desc' }, // critical first
        { createdAt: 'desc' },
      ],
      take: options.limit ?? 100,
    });

    return alerts as SecurityAlert[];
  } catch (error) {
    console.error('[Vault] Failed to get open alerts:', error);
    return [];
  }
}

/**
 * Get alerts for a specific requestor.
 */
export async function getAlertsForRequestor(
  requestorId: string,
  options: {
    status?: AlertStatus;
    limit?: number;
  } = {}
): Promise<SecurityAlert[]> {
  try {
    const vault = getVaultClient();

    const alerts = await vault.securityAlert.findMany({
      where: {
        requestorId,
        ...(options.status && { status: options.status }),
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit ?? 50,
    });

    return alerts as SecurityAlert[];
  } catch (error) {
    console.error('[Vault] Failed to get alerts for requestor:', error);
    return [];
  }
}

/**
 * Get alert statistics.
 */
export async function getAlertStats(): Promise<{
  open: number;
  acknowledged: number;
  resolved: number;
  bySeverity: Record<AlertSeverity, number>;
  byType: Record<AlertType, number>;
}> {
  try {
    const vault = getVaultClient();

    const [open, acknowledged, resolved] = await Promise.all([
      vault.securityAlert.count({ where: { status: 'open' } }),
      vault.securityAlert.count({ where: { status: 'acknowledged' } }),
      vault.securityAlert.count({ where: { status: 'resolved' } }),
    ]);

    // Note: For production, use groupBy for efficiency
    const bySeverity = {
      low: await vault.securityAlert.count({ where: { severity: 'low' } }),
      medium: await vault.securityAlert.count({ where: { severity: 'medium' } }),
      high: await vault.securityAlert.count({ where: { severity: 'high' } }),
      critical: await vault.securityAlert.count({ where: { severity: 'critical' } }),
    };

    const byType = {
      rate_limit_exceeded: await vault.securityAlert.count({
        where: { alertType: 'rate_limit_exceeded' },
      }),
      bulk_detokenize_attempt: await vault.securityAlert.count({
        where: { alertType: 'bulk_detokenize_attempt' },
      }),
      suspicious_pattern: await vault.securityAlert.count({
        where: { alertType: 'suspicious_pattern' },
      }),
      access_denied: await vault.securityAlert.count({
        where: { alertType: 'access_denied' },
      }),
    };

    return {
      open,
      acknowledged,
      resolved,
      bySeverity,
      byType,
    };
  } catch (error) {
    console.error('[Vault] Failed to get alert stats:', error);
    return {
      open: 0,
      acknowledged: 0,
      resolved: 0,
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      byType: {
        rate_limit_exceeded: 0,
        bulk_detokenize_attempt: 0,
        suspicious_pattern: 0,
        access_denied: 0,
      },
    };
  }
}

// =============================================================================
// NOTIFICATION (PLACEHOLDER)
// =============================================================================

/**
 * Notify security team of high/critical alerts.
 * In production, this would integrate with Slack, PagerDuty, etc.
 */
async function notifySecurityTeam(alert: SecurityAlert): Promise<void> {
  // Placeholder for external notification integration
  console.warn(
    `[SECURITY TEAM NOTIFICATION] ${alert.severity.toUpperCase()} alert: ${alert.description}`,
    {
      alertId: alert.id,
      alertType: alert.alertType,
      requestorId: alert.requestorId,
    }
  );

  // In production:
  // - Send to Slack webhook
  // - Trigger PagerDuty incident
  // - Send email to security@company.com
  // - Push to SIEM (Splunk, Datadog, etc.)
}
