/**
 * AI Tool Handlers for LAUSD Vendor Integration Assistant
 *
 * Each handler implements the logic for a specific tool, returning
 * structured results that the AI can interpret and present to users.
 */

import {
  getMockPodsDatabase,
  getOneRosterResponse,
} from "@/lib/data/synthetic";
import {
  getVendor,
  getSandbox,
  createSandbox,
  getAuditLogs,
  logAuditEvent,
} from "@/lib/db";
import type {
  LookupPodsInput,
  ProvisionSandboxInput,
  ConfigureSsoInput,
  TestOneRosterInput,
  SendTestMessageInput,
  GetAuditLogsInput,
  GetCredentialsInput,
  CheckStatusInput,
  RequestUpgradeInput,
} from "./tools";

// =============================================================================
// TYPES
// =============================================================================

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  showForm?: string;
  message?: string;
}

// =============================================================================
// HANDLER IMPLEMENTATIONS
// =============================================================================

/**
 * 1. lookup_pods - Query existing PoDS applications
 */
export async function handleLookupPods(
  input: LookupPodsInput
): Promise<ToolResult> {
  const { query } = input;
  const podsDatabase = getMockPodsDatabase();

  // Search by ID, vendor name, or email (case-insensitive)
  const searchLower = query.toLowerCase();
  const found = podsDatabase.find(
    (app) =>
      app.id.toLowerCase() === searchLower ||
      app.vendorName.toLowerCase().includes(searchLower) ||
      app.contactEmail.toLowerCase() === searchLower
  );

  if (!found) {
    return {
      success: true,
      data: null,
      message: `No PoDS application found for "${query}". This vendor may need to complete the PoDS-Lite application to get started.`,
    };
  }

  return {
    success: true,
    data: {
      applicationId: found.id,
      vendorName: found.vendorName,
      applicationName: found.applicationName,
      contactEmail: found.contactEmail,
      status: found.status,
      accessTier: found.accessTier,
      submittedAt: found.submittedAt?.toISOString() ?? null,
      reviewedAt: found.reviewedAt?.toISOString() ?? null,
      expiresAt: found.expiresAt?.toISOString() ?? null,
      statusDescription: getPodsStatusDescription(found.status),
      tierDescription: getAccessTierDescription(found.accessTier),
    },
    message: `Found PoDS application for ${found.vendorName}`,
  };
}

/**
 * 2. submit_pods_lite - Trigger PoDS-Lite form
 */
export async function handleSubmitPodsLite(input: {
  trigger_form: boolean;
  prefill_vendor_name?: string;
  prefill_email?: string;
}): Promise<ToolResult> {
  return {
    success: true,
    showForm: "pods_lite",
    data: {
      prefill: {
        vendorName: input.prefill_vendor_name,
        contactEmail: input.prefill_email,
      },
    },
    message:
      "Please complete the PoDS-Lite application below. This streamlined 13-question form will grant you TOKEN_ONLY access with instant approval.",
  };
}

/**
 * 3. provision_sandbox - Generate API credentials
 */
export async function handleProvisionSandbox(
  input: ProvisionSandboxInput
): Promise<ToolResult> {
  const { vendor_id } = input;

  try {
    // Check if vendor exists
    const vendor = await getVendor(vendor_id);
    if (!vendor) {
      return {
        success: false,
        error: `Vendor not found with ID: ${vendor_id}. Please complete the PoDS-Lite application first.`,
      };
    }

    // Check if already has sandbox
    const existingSandbox = await getSandbox(vendor_id);
    if (existingSandbox && existingSandbox.status === "ACTIVE") {
      return {
        success: true,
        showForm: "credentials",
        data: {
          existing: true,
          apiKey: existingSandbox.apiKey,
          baseUrl: existingSandbox.baseUrl,
          environment: existingSandbox.environment,
          expiresAt: existingSandbox.expiresAt.toISOString(),
          rateLimitPerMinute: existingSandbox.rateLimitPerMinute,
          allowedEndpoints: existingSandbox.allowedEndpoints,
        },
        message:
          "You already have active sandbox credentials. Here are your existing credentials:",
      };
    }

    // Create new sandbox
    const sandbox = await createSandbox(vendor_id);

    return {
      success: true,
      showForm: "credentials",
      data: {
        new: true,
        apiKey: sandbox.apiKey,
        apiSecret: sandbox.apiSecret, // Only shown once on creation
        baseUrl: sandbox.baseUrl,
        environment: sandbox.environment,
        expiresAt: sandbox.expiresAt.toISOString(),
        rateLimitPerMinute: sandbox.rateLimitPerMinute,
        allowedEndpoints: sandbox.allowedEndpoints,
      },
      message:
        "Your sandbox credentials have been provisioned! Save the API secret now - it will not be shown again.",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to provision sandbox: ${errorMessage}`,
    };
  }
}

/**
 * 4. configure_sso - Configure SSO provider
 */
export async function handleConfigureSso(
  input: ConfigureSsoInput
): Promise<ToolResult> {
  const { provider, trigger_form, client_id, client_secret, redirect_uri } =
    input;

  // If credentials provided directly, validate and configure
  if (!trigger_form && client_id && client_secret) {
    // In a real implementation, this would store the SSO config
    await logAuditEvent({
      vendorId: "current-session", // Would be actual vendor ID
      action: "SSO_CONFIGURED",
      resourceType: "sso",
      details: {
        provider,
        clientIdPrefix: client_id.substring(0, 8) + "...",
        redirectUri: redirect_uri,
      },
    });

    return {
      success: true,
      data: {
        provider,
        status: "configured",
        redirectUri: redirect_uri,
        nextSteps: [
          `Add ${getProviderDomain(provider)} as an authorized domain`,
          "Test the SSO flow with a sample user",
          "Configure role mappings if needed",
        ],
      },
      message: `${provider} SSO has been configured successfully!`,
    };
  }

  // Trigger the configuration form
  return {
    success: true,
    showForm: "sso_config",
    data: {
      provider,
      providerInfo: getSsoProviderInfo(provider),
      requiredFields: ["client_id", "client_secret", "redirect_uri"],
    },
    message: `Let's configure ${provider} SSO. Please fill out the configuration form below.`,
  };
}

/**
 * 5. test_oneroster - Execute test API call
 */
export async function handleTestOneroster(
  input: TestOneRosterInput
): Promise<ToolResult> {
  const { endpoint, filters, limit = 10 } = input;
  const startTime = Date.now();

  try {
    // Convert filters to expected format
    const apiFilters = filters
      ? {
          schoolId: filters.schoolId,
          role: filters.role,
          grade: filters.grade,
          classId: filters.classId,
          userId: filters.userId,
        }
      : undefined;

    const response = getOneRosterResponse(
      endpoint,
      apiFilters,
      Math.min(limit, 100)
    );
    const responseTime = Date.now() - startTime;

    // Get the data array name based on endpoint
    const dataKey = endpoint.replace("/", "") as keyof typeof response;
    const dataArray = response[dataKey];
    const recordCount = Array.isArray(dataArray) ? dataArray.length : 0;

    return {
      success: true,
      data: {
        endpoint,
        filters: filters ?? {},
        response,
        metadata: {
          recordCount,
          responseTimeMs: responseTime,
          rateLimitRemaining: 59,
          requestId: `req_${Date.now().toString(36)}`,
        },
      },
      message: `Successfully retrieved ${recordCount} records from ${endpoint}`,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `OneRoster API error: ${errorMessage}`,
    };
  }
}

/**
 * 6. configure_lti - Configure LTI 1.3
 */
export async function handleConfigureLti(input: {
  trigger_form: boolean;
  client_id?: string;
  deployment_id?: string;
  jwks_url?: string;
  auth_url?: string;
  token_url?: string;
  launch_url?: string;
}): Promise<ToolResult> {
  // If all required fields provided, configure directly
  if (
    !input.trigger_form &&
    input.client_id &&
    input.deployment_id &&
    input.launch_url
  ) {
    return {
      success: true,
      data: {
        status: "configured",
        platformConfig: {
          issuer: "https://schoology.lausd.net",
          authorizationEndpoint:
            "https://schoology.lausd.net/lti/authorize",
          tokenEndpoint: "https://schoology.lausd.net/lti/token",
          jwksUri: "https://schoology.lausd.net/.well-known/jwks.json",
        },
        vendorConfig: {
          clientId: input.client_id,
          deploymentId: input.deployment_id,
          launchUrl: input.launch_url,
        },
        nextSteps: [
          "Register these platform credentials in your LTI tool",
          "Test a launch from Schoology sandbox",
          "Configure grade passback if needed",
        ],
      },
      message: "LTI 1.3 integration has been configured!",
    };
  }

  return {
    success: true,
    showForm: "lti_config",
    data: {
      platformInfo: {
        name: "Schoology (LAUSD)",
        issuer: "https://schoology.lausd.net",
        authorizationEndpoint: "https://schoology.lausd.net/lti/authorize",
        tokenEndpoint: "https://schoology.lausd.net/lti/token",
        jwksUri: "https://schoology.lausd.net/.well-known/jwks.json",
      },
      requiredFields: [
        "client_id",
        "deployment_id",
        "launch_url",
        "jwks_url",
      ],
    },
    message:
      "Let's configure LTI 1.3 for Schoology integration. Please fill out the form below with your tool's configuration.",
  };
}

/**
 * 7. send_test_message - Test communication gateway
 */
export async function handleSendTestMessage(
  input: SendTestMessageInput
): Promise<ToolResult> {
  const { channel, recipient_token, subject, body } = input;

  // Validate recipient token format
  if (
    channel === "EMAIL" &&
    !recipient_token.match(/^TKN_STU_[a-z0-9]+@relay\.schoolday\.lausd\.net$/)
  ) {
    return {
      success: false,
      error:
        "Invalid email token format. Expected format: TKN_STU_xxx@relay.schoolday.lausd.net",
    };
  }

  if (channel === "SMS" && !recipient_token.match(/^TKN_555_XXX_\d{4}$/)) {
    return {
      success: false,
      error: "Invalid SMS token format. Expected format: TKN_555_XXX_1234",
    };
  }

  // Validate email has subject
  if (channel === "EMAIL" && !subject) {
    return {
      success: false,
      error: "Email messages require a subject line",
    };
  }

  // Simulate message sending
  const messageId = `msg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

  await logAuditEvent({
    vendorId: "current-session",
    action: "TEST_MESSAGE_SENT",
    resourceType: "communication",
    details: {
      channel,
      recipientToken: recipient_token,
      messageId,
      bodyLength: body.length,
    },
  });

  // Simulate delivery status
  const deliveryStatus = {
    messageId,
    channel,
    recipient: recipient_token,
    status: "QUEUED",
    queuedAt: new Date().toISOString(),
    estimatedDelivery:
      channel === "EMAIL" ? "Within 5 minutes" : "Within 30 seconds",
    routingPath:
      channel === "EMAIL"
        ? "Vendor → LAUSD Relay → Student Gmail"
        : "Vendor → LAUSD Gateway → Parent Mobile",
  };

  return {
    success: true,
    data: {
      delivery: deliveryStatus,
      explanation:
        channel === "EMAIL"
          ? `Your message will be sent to ${recipient_token}. The LAUSD relay server will automatically route it to the actual student email address while keeping the real address private.`
          : `Your SMS will be sent via the LAUSD gateway to the parent's mobile number associated with token ${recipient_token}.`,
    },
    message: `Test ${channel.toLowerCase()} message queued successfully!`,
  };
}

/**
 * 8. submit_app - Submit for freemium whitelist
 */
export async function handleSubmitApp(input: {
  trigger_form: boolean;
  app_name?: string;
  app_url?: string;
  grade_levels?: string[];
  subject_areas?: string[];
}): Promise<ToolResult> {
  return {
    success: true,
    showForm: "app_submit",
    data: {
      prefill: {
        appName: input.app_name,
        appUrl: input.app_url,
        gradeLevels: input.grade_levels,
        subjectAreas: input.subject_areas,
      },
      requirements: [
        "Application must be free for students and teachers",
        "Must have approved PoDS application",
        "Must meet LAUSD educational quality standards",
        "Must not contain advertising or in-app purchases",
      ],
      benefits: [
        "Featured placement in LAUSD's approved apps catalog",
        "Promotion to 35,000+ LAUSD educators",
        "Streamlined school-level deployment",
        "LAUSD endorsement badge for marketing",
      ],
    },
    message:
      "Submit your application for LAUSD's freemium app whitelist. Please complete the form below.",
  };
}

/**
 * 9. get_audit_logs - Retrieve audit trail
 */
export async function handleGetAuditLogs(
  input: GetAuditLogsInput
): Promise<ToolResult> {
  const { vendor_id, limit = 50 } = input;

  try {
    const logs = await getAuditLogs(vendor_id, limit);

    if (logs.length === 0) {
      return {
        success: true,
        showForm: "audit_log",
        data: {
          logs: [],
          summary: {
            totalEvents: 0,
            dateRange: null,
          },
        },
        message: "No audit logs found for this vendor yet.",
      };
    }

    // Format logs for display
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      details: log.details,
      ipAddress: log.ipAddress ?? "N/A",
    }));

    // Generate summary
    const actionCounts: Record<string, number> = {};
    for (const log of logs) {
      actionCounts[log.action] = (actionCounts[log.action] ?? 0) + 1;
    }

    return {
      success: true,
      showForm: "audit_log",
      data: {
        logs: formattedLogs,
        summary: {
          totalEvents: logs.length,
          dateRange: {
            oldest: logs[logs.length - 1]?.timestamp.toISOString(),
            newest: logs[0]?.timestamp.toISOString(),
          },
          actionCounts,
        },
      },
      message: `Retrieved ${logs.length} audit log entries`,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to retrieve audit logs: ${errorMessage}`,
    };
  }
}

/**
 * 10. get_credentials - Display sandbox credentials
 */
export async function handleGetCredentials(
  input: GetCredentialsInput
): Promise<ToolResult> {
  const { vendor_id, show_secret = false } = input;

  try {
    const sandbox = await getSandbox(vendor_id);

    if (!sandbox) {
      return {
        success: true,
        data: null,
        message:
          "No sandbox credentials found. Would you like me to provision new credentials?",
      };
    }

    // Check if expired
    const isExpired = sandbox.expiresAt < new Date();
    const isRevoked = sandbox.status === "REVOKED";

    if (isExpired || isRevoked) {
      return {
        success: true,
        data: {
          status: isRevoked ? "REVOKED" : "EXPIRED",
          expiredAt: sandbox.expiresAt.toISOString(),
        },
        message: isRevoked
          ? "Your sandbox credentials have been revoked. Please contact LAUSD support."
          : "Your sandbox credentials have expired. Would you like me to provision new ones?",
      };
    }

    return {
      success: true,
      showForm: "credentials",
      data: {
        apiKey: sandbox.apiKey,
        apiSecret: show_secret ? sandbox.apiSecret : "••••••••••••••••",
        baseUrl: sandbox.baseUrl,
        environment: sandbox.environment,
        status: sandbox.status,
        expiresAt: sandbox.expiresAt.toISOString(),
        lastUsedAt: sandbox.lastUsedAt?.toISOString() ?? "Never",
        rateLimitPerMinute: sandbox.rateLimitPerMinute,
        allowedEndpoints: sandbox.allowedEndpoints,
      },
      message: "Here are your sandbox credentials:",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to retrieve credentials: ${errorMessage}`,
    };
  }
}

/**
 * 11. check_status - Get integration statuses
 */
export async function handleCheckStatus(
  input: CheckStatusInput
): Promise<ToolResult> {
  const { vendor_id, include_details = true } = input;

  try {
    const vendor = await getVendor(vendor_id);
    const sandbox = await getSandbox(vendor_id);

    // If no vendor, check mock PoDS database
    let podsInfo = null;
    if (!vendor) {
      const podsDb = getMockPodsDatabase();
      const mockPods = podsDb.find((p) => p.id === vendor_id);
      if (mockPods) {
        podsInfo = {
          status: mockPods.status,
          accessTier: mockPods.accessTier,
          applicationId: mockPods.id,
        };
      }
    }

    const status = {
      pods: vendor
        ? {
            status: vendor.podsStatus,
            statusDescription: getPodsStatusDescription(vendor.podsStatus),
            accessTier: vendor.accessTier,
            tierDescription: getAccessTierDescription(vendor.accessTier),
            applicationId: vendor.podsApplicationId,
            expiresAt: null, // Would come from actual PoDS record
          }
        : podsInfo
          ? {
              status: podsInfo.status,
              statusDescription: getPodsStatusDescription(podsInfo.status),
              accessTier: podsInfo.accessTier,
              tierDescription: getAccessTierDescription(podsInfo.accessTier),
              applicationId: podsInfo.applicationId,
            }
          : { status: "NOT_FOUND", statusDescription: "No PoDS application found" },

      sandbox: sandbox
        ? {
            status: sandbox.status,
            environment: sandbox.environment,
            expiresAt: sandbox.expiresAt.toISOString(),
            isExpired: sandbox.expiresAt < new Date(),
            rateLimitPerMinute: sandbox.rateLimitPerMinute,
          }
        : { status: "NOT_PROVISIONED" },

      sso: {
        clever: { status: "NOT_CONFIGURED" },
        classlink: { status: "NOT_CONFIGURED" },
        google: { status: "NOT_CONFIGURED" },
      },

      oneroster: sandbox
        ? {
            status: "AVAILABLE",
            baseUrl: sandbox.baseUrl,
            allowedEndpoints: include_details
              ? sandbox.allowedEndpoints
              : undefined,
          }
        : { status: "NOT_AVAILABLE" },

      lti: { status: "NOT_CONFIGURED" },

      communication: {
        email: { status: "AVAILABLE" },
        sms: { status: "AVAILABLE" },
      },
    };

    // Determine next recommended action
    const nextAction = determineNextAction(status);

    return {
      success: true,
      data: {
        vendorId: vendor_id,
        vendorName: vendor?.name ?? "Unknown",
        status,
        nextAction,
        lastChecked: new Date().toISOString(),
      },
      message: generateStatusSummary(status),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to check status: ${errorMessage}`,
    };
  }
}

/**
 * 12. request_upgrade - Initiate tier upgrade
 */
export async function handleRequestUpgrade(
  input: RequestUpgradeInput
): Promise<ToolResult> {
  const {
    vendor_id,
    target_tier,
    justification,
    data_elements_needed,
    retention_period,
  } = input;

  // Validate justification length
  if (justification.length < 50) {
    return {
      success: false,
      error:
        "Justification must be at least 50 characters. Please provide a detailed explanation of why you need this data access.",
    };
  }

  // Generate upgrade request
  const requestId = `UPG-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

  await logAuditEvent({
    vendorId: vendor_id,
    action: "UPGRADE_REQUESTED",
    resourceType: "access_tier",
    details: {
      requestId,
      targetTier: target_tier,
      dataElements: data_elements_needed,
      retentionPeriod: retention_period,
    },
  });

  const requirements =
    target_tier === "FULL_ACCESS"
      ? {
          required: [
            "Complete full PoDS application (71 questions)",
            "Execute Data Privacy Agreement (DPA)",
            "Provide SOC 2 Type II certification",
            "Complete security questionnaire",
            "Schedule privacy office review meeting",
          ],
          timeline: "4-6 weeks typical review time",
          contact: "privacy@lausd.net",
        }
      : {
          required: [
            "Complete full PoDS application (71 questions)",
            "Provide detailed data use documentation",
            "Demonstrate necessity for requested PII elements",
          ],
          timeline: "2-4 weeks typical review time",
          contact: "privacy@lausd.net",
        };

  return {
    success: true,
    data: {
      requestId,
      targetTier: target_tier,
      status: "SUBMITTED",
      submittedAt: new Date().toISOString(),
      justification,
      dataElementsRequested: data_elements_needed ?? [],
      retentionPeriod: retention_period ?? "Not specified",
      requirements,
      nextSteps: [
        `Your upgrade request ${requestId} has been submitted`,
        "LAUSD Privacy Office will review within 5 business days",
        "You may be contacted for additional information",
        `Continue using TOKEN_ONLY access in the meantime`,
      ],
    },
    message: `Upgrade request submitted successfully. Request ID: ${requestId}. The LAUSD Privacy Office will review your request and contact you within 5 business days.`,
  };
}

// =============================================================================
// TOOL ROUTER
// =============================================================================

/**
 * Execute a tool call by name with parameters
 */
export async function executeToolCall(
  name: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  try {
    switch (name) {
      case "lookup_pods":
        return await handleLookupPods(params as unknown as LookupPodsInput);

      case "submit_pods_lite":
        return await handleSubmitPodsLite(
          params as { trigger_form: boolean; prefill_vendor_name?: string; prefill_email?: string }
        );

      case "provision_sandbox":
        return await handleProvisionSandbox(
          params as unknown as ProvisionSandboxInput
        );

      case "configure_sso":
        return await handleConfigureSso(params as unknown as ConfigureSsoInput);

      case "test_oneroster":
        return await handleTestOneroster(
          params as unknown as TestOneRosterInput
        );

      case "configure_lti":
        return await handleConfigureLti(
          params as {
            trigger_form: boolean;
            client_id?: string;
            deployment_id?: string;
            jwks_url?: string;
            auth_url?: string;
            token_url?: string;
            launch_url?: string;
          }
        );

      case "send_test_message":
        return await handleSendTestMessage(
          params as unknown as SendTestMessageInput
        );

      case "submit_app":
        return await handleSubmitApp(
          params as {
            trigger_form: boolean;
            app_name?: string;
            app_url?: string;
            grade_levels?: string[];
            subject_areas?: string[];
          }
        );

      case "get_audit_logs":
        return await handleGetAuditLogs(
          params as unknown as GetAuditLogsInput
        );

      case "get_credentials":
        return await handleGetCredentials(
          params as unknown as GetCredentialsInput
        );

      case "check_status":
        return await handleCheckStatus(params as unknown as CheckStatusInput);

      case "request_upgrade":
        return await handleRequestUpgrade(
          params as unknown as RequestUpgradeInput
        );

      default:
        return {
          success: false,
          error: `Unknown tool: ${name}`,
        };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: `Tool execution failed: ${errorMessage}`,
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getPodsStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    NOT_STARTED:
      "Application has not been started. Complete PoDS-Lite for quick TOKEN_ONLY approval.",
    IN_PROGRESS:
      "Application is in progress. Complete all required fields to submit.",
    PENDING_REVIEW:
      "Application submitted and awaiting LAUSD Privacy Office review.",
    APPROVED:
      "Application approved! You can now configure integrations and access data.",
    REJECTED:
      "Application was not approved. Contact privacy@lausd.net for details.",
    EXPIRED:
      "Application has expired. Please submit a new application to renew access.",
  };
  return descriptions[status] ?? status;
}

function getAccessTierDescription(tier: string): string {
  const descriptions: Record<string, string> = {
    TOKEN_ONLY:
      "Zero actual PII. Receive tokenized identifiers, first names, and grade levels only. Instant approval available.",
    SELECTIVE:
      "Limited PII access (e.g., first name + email). Requires full PoDS review.",
    FULL_ACCESS:
      "Complete student records within approved scope. Requires DPA and manual approval.",
  };
  return descriptions[tier] ?? tier;
}

function getSsoProviderInfo(provider: string): Record<string, string> {
  const info: Record<string, Record<string, string>> = {
    CLEVER: {
      name: "Clever",
      website: "https://clever.com",
      devPortal: "https://dev.clever.com",
      docUrl: "https://dev.clever.com/docs",
      typicalUse: "K-8 applications, instant login",
    },
    CLASSLINK: {
      name: "ClassLink",
      website: "https://classlink.com",
      devPortal: "https://developer.classlink.com",
      docUrl: "https://developer.classlink.com/docs",
      typicalUse: "6-12 applications, LaunchPad integration",
    },
    GOOGLE: {
      name: "Google Workspace",
      website: "https://workspace.google.com",
      devPortal: "https://console.cloud.google.com",
      docUrl: "https://developers.google.com/identity",
      typicalUse: "Universal SSO, all grade levels",
    },
  };
  return info[provider] ?? { name: provider };
}

function getProviderDomain(provider: string): string {
  const domains: Record<string, string> = {
    CLEVER: "clever.com",
    CLASSLINK: "classlink.com",
    GOOGLE: "accounts.google.com",
  };
  return domains[provider] ?? provider.toLowerCase();
}

interface IntegrationStatus {
  pods: { status: string; accessTier?: string };
  sandbox: { status: string };
  sso: Record<string, { status: string }>;
  oneroster: { status: string };
  lti: { status: string };
  communication: Record<string, { status: string }>;
}

function determineNextAction(status: IntegrationStatus): {
  action: string;
  description: string;
} {
  if (
    status.pods.status === "NOT_FOUND" ||
    status.pods.status === "NOT_STARTED"
  ) {
    return {
      action: "complete_pods_lite",
      description:
        "Complete PoDS-Lite application to get TOKEN_ONLY access approved instantly.",
    };
  }

  if (status.pods.status === "PENDING_REVIEW") {
    return {
      action: "wait_for_review",
      description:
        "Your PoDS application is under review. Typical timeline is 2-4 weeks for non-TOKEN_ONLY tiers.",
    };
  }

  if (status.pods.status === "REJECTED" || status.pods.status === "EXPIRED") {
    return {
      action: "reapply",
      description:
        "Submit a new PoDS application. Consider TOKEN_ONLY tier for faster approval.",
    };
  }

  if (status.sandbox.status === "NOT_PROVISIONED") {
    return {
      action: "provision_sandbox",
      description:
        "Provision sandbox credentials to start testing the OneRoster API.",
    };
  }

  if (
    status.sso.clever?.status === "NOT_CONFIGURED" &&
    status.sso.classlink?.status === "NOT_CONFIGURED" &&
    status.sso.google?.status === "NOT_CONFIGURED"
  ) {
    return {
      action: "configure_sso",
      description:
        "Configure SSO with Clever, ClassLink, or Google for seamless student login.",
    };
  }

  return {
    action: "test_integration",
    description:
      "Your integration is configured! Test the OneRoster API or SSO flow.",
  };
}

function generateStatusSummary(status: IntegrationStatus): string {
  const parts: string[] = [];

  // PoDS status
  if (status.pods.status === "APPROVED") {
    parts.push(
      `✅ PoDS: Approved (${status.pods.accessTier ?? "Unknown"} tier)`
    );
  } else if (status.pods.status === "PENDING_REVIEW") {
    parts.push("⏳ PoDS: Pending review");
  } else {
    parts.push(`⬜ PoDS: ${status.pods.status}`);
  }

  // Sandbox status
  if (status.sandbox.status === "ACTIVE") {
    parts.push("✅ Sandbox: Active");
  } else {
    parts.push(`⬜ Sandbox: ${status.sandbox.status}`);
  }

  // SSO status
  const configuredSso = Object.entries(status.sso)
    .filter(([, v]) => v.status === "ACTIVE")
    .map(([k]) => k);
  if (configuredSso.length > 0) {
    parts.push(`✅ SSO: ${configuredSso.join(", ")}`);
  } else {
    parts.push("⬜ SSO: Not configured");
  }

  // OneRoster status
  if (status.oneroster.status === "AVAILABLE") {
    parts.push("✅ OneRoster: Available");
  } else {
    parts.push(`⬜ OneRoster: ${status.oneroster.status}`);
  }

  return parts.join(" | ");
}
