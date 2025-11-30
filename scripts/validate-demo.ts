#!/usr/bin/env npx tsx
/**
 * Demo Scenario Validator
 * Tests all 5 demo workflows to ensure demo readiness
 *
 * Usage: npx tsx scripts/validate-demo.ts
 */

import { executeToolCall } from '../lib/ai/handlers';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

interface WorkflowResult {
  name: string;
  passed: boolean;
  steps: StepResult[];
  duration: number;
}

interface StepResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

// Shared state for passing data between workflow steps
interface WorkflowState {
  vendorId?: string;
  [key: string]: unknown;
}

// ============================================================================
// WORKFLOW DEFINITIONS
// ============================================================================

const workflows = [
  {
    id: 1,
    name: 'Vendor Onboarding + Verification',
    description: 'Get approved in minutes, not weeks',
    steps: [
      {
        name: 'Submit PoDS-Lite application',
        tool: 'submit_pods_lite',
        params: {
          vendorName: 'DemoApp Learning',
          contactEmail: 'demo@demoapp.com',
          contactName: 'Demo User',
          appDescription: 'Interactive math learning platform',
          website: 'https://demoapp.com',
          dataElements: ['STUDENT_ID', 'FIRST_NAME', 'GRADE_LEVEL'],
          dataPurpose: 'Personalized learning experience',
          dataRetention: '1 year after account deletion',
          integrationMethod: 'API',
          thirdPartySharing: false,
          securityMeasures: 'AES-256 encryption, SOC 2 Type II',
          encryption: true,
          breachNotification: '24 hours',
          coppaCompliant: true,
          termsAccepted: true,
        },
        validate: (result: any, state: WorkflowState) => {
          if (!result.success) return { passed: false, error: result.error };
          if (result.showForm !== 'pods_lite' && !result.data?.vendorId) {
            return { passed: false, error: 'Expected form trigger or vendorId' };
          }
          // Store vendorId for subsequent steps
          if (result.data?.vendorId) {
            state.vendorId = result.data.vendorId;
          }
          return { passed: true, details: `Access tier: ${result.data?.accessTier || 'PRIVACY_SAFE'}` };
        },
      },
      {
        name: 'Provision sandbox credentials',
        tool: 'provision_sandbox',
        getParams: (state: WorkflowState) => ({
          vendor_id: state.vendorId || 'demo-vendor-001',
          integration_types: ['ONEROSTER'],
        }),
        validate: (result: any) => {
          if (!result.success) return { passed: false, error: result.error };
          // Accept showForm: 'credentials' OR direct credentials data
          if (result.showForm === 'credentials' || result.data?.apiKey) {
            return { passed: true, details: `Sandbox ${result.data?.new ? 'created' : 'retrieved'}` };
          }
          return { passed: false, error: 'Expected credentials form or data' };
        },
      },
      {
        name: 'Get credentials display',
        tool: 'get_credentials',
        getParams: (state: WorkflowState) => ({
          vendor_id: state.vendorId || 'demo-vendor-001',
        }),
        validate: (result: any) => {
          if (!result.success) return { passed: false, error: result.error };
          // Accept showForm OR data with credentials
          if (result.showForm === 'credentials' || result.data?.apiKey) {
            return { passed: true, details: 'Credentials form triggered' };
          }
          // Also accept null data with helpful message (no credentials yet)
          if (result.data === null && result.message) {
            return { passed: true, details: 'No credentials yet (expected for new vendor)' };
          }
          return { passed: false, error: 'Expected credentials form trigger or data' };
        },
      },
    ],
  },
  {
    id: 2,
    name: 'Communication Gateway (CPaaS)',
    description: 'Reach parents without knowing their identity',
    steps: [
      {
        name: 'Send test message to parent token',
        tool: 'send_test_message',
        params: {
          recipient_token: 'TKN_PAR_8X9Y2Z3A',
          channel: 'EMAIL',
          subject: "Sofia's math homework is due tomorrow",
          body: 'Hi! This is a reminder that Sofia has math homework due tomorrow.',
        },
        validate: (result: any) => {
          if (!result.success) return { passed: false, error: result.error };
          // Handler returns data.delivery.messageId
          const messageId = result.data?.delivery?.messageId || result.data?.messageId;
          if (result.showForm !== 'comm_test' && !messageId) {
            return { passed: false, error: 'Expected form trigger or messageId' };
          }
          return { passed: true, details: `Message ID: ${messageId || 'pending'}` };
        },
      },
      {
        name: 'Send SMS test message',
        tool: 'send_test_message',
        params: {
          recipient_token: 'TKN_PAR_8X9Y2Z3A',
          channel: 'SMS',
          body: 'Reminder: Sofia has homework due tomorrow.',
        },
        validate: (result: any) => {
          if (!result.success) return { passed: false, error: result.error };
          const messageId = result.data?.delivery?.messageId;
          return { passed: true, details: `SMS queued: ${messageId || 'OK'}` };
        },
      },
    ],
  },
  {
    id: 3,
    name: 'OneRoster API + Tokenized Data',
    description: 'Full functionality with zero PII exposure',
    steps: [
      {
        name: 'Test /users endpoint',
        tool: 'test_oneroster',
        params: {
          endpoint: '/users',
          method: 'GET',
          queryParams: { role: 'student', limit: 5 },
        },
        validate: (result: any) => {
          if (!result.success) return { passed: false, error: result.error };
          if (result.showForm !== 'api_tester' && !result.data?.response) {
            return { passed: false, error: 'Expected form trigger or response data' };
          }
          // Validate tokenization
          const response = result.data?.response;
          if (response?.users) {
            const hasTokens = response.users.every((u: any) =>
              u.sourcedId?.startsWith('TKN_') &&
              u.familyName === '[TOKENIZED]'
            );
            if (!hasTokens) {
              return { passed: false, error: 'Response contains non-tokenized PII!' };
            }
          }
          return { passed: true, details: `${response?.users?.length || 0} tokenized students returned` };
        },
      },
      {
        name: 'Test /orgs endpoint',
        tool: 'test_oneroster',
        params: {
          endpoint: '/orgs',
          method: 'GET',
          queryParams: { type: 'school' },
        },
        validate: (result: any) => {
          if (!result.success) return { passed: false, error: result.error };
          return { passed: true, details: 'Schools data returned' };
        },
      },
      {
        name: 'Test /classes endpoint',
        tool: 'test_oneroster',
        params: {
          endpoint: '/classes',
          method: 'GET',
          queryParams: { limit: 3 },
        },
        validate: (result: any) => {
          if (!result.success) return { passed: false, error: result.error };
          return { passed: true, details: 'Classes data returned' };
        },
      },
    ],
  },
  {
    id: 4,
    name: 'SSO Configuration',
    description: 'Seamless login, your choice of provider',
    steps: [
      {
        name: 'Configure Google SSO',
        tool: 'configure_sso',
        params: {
          vendorId: 'demo-vendor-001',
          provider: 'google',
          clientId: 'demo-client-id-google',
          clientSecret: 'demo-secret',
          redirectUri: 'https://demoapp.com/oauth/callback',
        },
        validate: (result: any) => {
          if (!result.success) return { passed: false, error: result.error };
          if (result.showForm !== 'sso_config' && !result.data?.integration) {
            return { passed: false, error: 'Expected form trigger or integration data' };
          }
          return { passed: true, details: `Google SSO configured` };
        },
      },
      {
        name: 'Configure Clever SSO',
        tool: 'configure_sso',
        params: {
          vendorId: 'demo-vendor-001',
          provider: 'clever',
          clientId: 'demo-client-id-clever',
          clientSecret: 'demo-secret',
          redirectUri: 'https://demoapp.com/oauth/callback',
        },
        validate: (result: any) => {
          if (!result.success) return { passed: false, error: result.error };
          return { passed: true, details: `Clever SSO configured` };
        },
      },
    ],
  },
  {
    id: 5,
    name: 'LTI 1.3 Integration',
    description: 'Deep integration with the learning platform',
    steps: [
      {
        name: 'Configure LTI 1.3 for Schoology',
        tool: 'configure_lti',
        params: {
          vendorId: 'demo-vendor-001',
          platformUrl: 'https://schoology.lausd.net',
          clientId: 'lti-demo-client',
          deploymentId: 'deployment-001',
          launchUrl: 'https://demoapp.com/lti/launch',
          jwksUrl: 'https://demoapp.com/.well-known/jwks.json',
        },
        validate: (result: any) => {
          if (!result.success) return { passed: false, error: result.error };
          if (result.showForm !== 'lti_config' && !result.data?.integration) {
            return { passed: false, error: 'Expected form trigger or integration data' };
          }
          return { passed: true, details: `LTI 1.3 configured for Schoology` };
        },
      },
    ],
  },
];

// ============================================================================
// VALIDATOR ENGINE
// ============================================================================

async function runStep(step: any, state: WorkflowState): Promise<StepResult> {
  try {
    // Get params from static params or dynamic getParams function
    const params = step.getParams ? step.getParams(state) : step.params;
    const result = await executeToolCall(step.tool, params);
    return step.validate(result, state);
  } catch (error) {
    return {
      name: step.name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runWorkflow(workflow: any): Promise<WorkflowResult> {
  const startTime = Date.now();
  const stepResults: StepResult[] = [];
  const state: WorkflowState = {}; // Shared state for the workflow

  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bold}Workflow ${workflow.id}: ${workflow.name}${colors.reset}`);
  console.log(`${colors.yellow}${workflow.description}${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

  for (const step of workflow.steps) {
    process.stdout.write(`  ${step.name}... `);

    const result = await runStep(step, state);
    result.name = step.name;
    stepResults.push(result);

    if (result.passed) {
      console.log(`${colors.green}✓${colors.reset} ${result.details || ''}`);
    } else {
      console.log(`${colors.red}✗ ${result.error}${colors.reset}`);
    }
  }

  const duration = Date.now() - startTime;
  const passed = stepResults.every((s) => s.passed);

  return {
    name: workflow.name,
    passed,
    steps: stepResults,
    duration,
  };
}

async function main() {
  console.log(`
${colors.bold}╔══════════════════════════════════════════════════════════════╗
║           DEMO SCENARIO VALIDATOR                              ║
║           SchoolDay Vendor Portal                              ║
╠══════════════════════════════════════════════════════════════╣
║  Testing all 5 demo workflows for presentation readiness      ║
╚══════════════════════════════════════════════════════════════╝${colors.reset}
`);

  const results: WorkflowResult[] = [];

  for (const workflow of workflows) {
    const result = await runWorkflow(workflow);
    results.push(result);
  }

  // Summary
  console.log(`\n${colors.bold}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}║                    VALIDATION SUMMARY                         ║${colors.reset}`);
  console.log(`${colors.bold}╠══════════════════════════════════════════════════════════════╣${colors.reset}`);

  let totalPassed = 0;
  let totalFailed = 0;
  let totalDuration = 0;

  for (const result of results) {
    const icon = result.passed ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
    const stepsInfo = result.steps.filter((s) => s.passed).length + '/' + result.steps.length;
    console.log(`  ${icon} Workflow ${results.indexOf(result) + 1}: ${result.name}`);
    console.log(`     Steps: ${stepsInfo} | Duration: ${result.duration}ms`);

    if (result.passed) totalPassed++;
    else totalFailed++;
    totalDuration += result.duration;
  }

  console.log(`${colors.bold}╠══════════════════════════════════════════════════════════════╣${colors.reset}`);

  const overallPassed = totalFailed === 0;
  if (overallPassed) {
    console.log(`  ${colors.green}${colors.bold}✅ ALL WORKFLOWS PASSED${colors.reset}`);
    console.log(`  ${colors.green}Demo is ready for presentation!${colors.reset}`);
  } else {
    console.log(`  ${colors.red}${colors.bold}❌ ${totalFailed} WORKFLOW(S) FAILED${colors.reset}`);
    console.log(`  ${colors.red}Please fix issues before demo.${colors.reset}`);
  }

  console.log(`\n  Total: ${totalPassed}/${results.length} workflows passed`);
  console.log(`  Duration: ${totalDuration}ms`);
  console.log(`${colors.bold}╚══════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  // Exit with appropriate code
  process.exit(overallPassed ? 0 : 1);
}

main().catch((error) => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
