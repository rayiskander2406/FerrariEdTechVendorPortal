/**
 * Demo Workflows Configuration - Guided Mode
 *
 * Each workflow is a sequence of guided steps that the user can follow.
 * Steps can be completed manually or with optional auto-execution.
 */

// =============================================================================
// TYPES
// =============================================================================

export type DemoStepType =
  | "message"      // Type a chat message
  | "form"         // Fill out and submit a form
  | "action"       // Click a button or UI element
  | "observe";     // Just observe/read something

export interface DemoStep {
  id: string;
  type: DemoStepType;
  title: string;           // Short title for the step
  description: string;     // What this step accomplishes
  instruction: string;     // What the user should do

  // Type-specific data
  message?: string;           // For "message" type - suggested text
  formName?: string;          // For "form" type - which form
  actionTarget?: string;      // For "action" type - what to click

  // Optional hints
  hint?: string;             // Additional help text
  expectedOutcome?: string;  // What should happen after this step
}

export interface DemoWorkflow {
  id: string;
  name: string;
  description: string;
  estimatedDuration: string;
  steps: DemoStep[];
}

// =============================================================================
// DEMO WORKFLOWS
// =============================================================================

export const DEMO_WORKFLOWS: DemoWorkflow[] = [
  // -------------------------------------------------------------------------
  // VENDOR ONBOARDING DEMO
  // -------------------------------------------------------------------------
  {
    id: "vendor-onboarding",
    name: "New Vendor Onboarding",
    description: "Complete end-to-end vendor onboarding flow with PoDS-Lite application",
    estimatedDuration: "3 minutes",
    steps: [
      {
        id: "start-conversation",
        type: "message",
        title: "Start Onboarding",
        description: "Begin the vendor onboarding process",
        instruction: "Type the message below in the chat (or copy-paste it)",
        message: "I'd like to register my EdTech app to get API access",
        expectedOutcome: "The AI will start the PoDS-Lite onboarding form",
      },
      {
        id: "trigger-form",
        type: "observe",
        title: "Review AI Response",
        description: "The AI explains the onboarding process",
        instruction: "Read the AI's response. It should mention the PoDS-Lite application form.",
        expectedOutcome: "A form should appear below the chat",
        hint: "If no form appears, try asking: 'I'd like to start the PoDS-Lite application'",
      },
      {
        id: "fill-form",
        type: "form",
        title: "Complete PoDS-Lite Form",
        description: "Fill out the vendor registration form",
        instruction: "Fill in the form with your vendor details. Use demo data or real data.",
        formName: "pods_lite",
        hint: "Required fields: Vendor Name, Contact Name, Email, Product Description",
        expectedOutcome: "After submission, you'll see verification and then credentials",
      },
      {
        id: "view-credentials",
        type: "observe",
        title: "Review Credentials",
        description: "Your sandbox API credentials are now available",
        instruction: "Review the API credentials displayed. These are for the sandbox environment.",
        expectedOutcome: "You should see Client ID, Client Secret, and API endpoints",
      },
      {
        id: "test-api",
        type: "message",
        title: "Test the API",
        description: "Try out the OneRoster API",
        instruction: "Type the message below to open the API tester",
        message: "Test the OneRoster API",
        expectedOutcome: "The API tester panel will open",
      },
      {
        id: "explore-api",
        type: "action",
        title: "Explore API Data",
        description: "See tokenized student data",
        instruction: "In the API tester, click 'Fetch Students' to see sample tokenized data",
        actionTarget: "Fetch Students button",
        expectedOutcome: "You'll see student records with tokenized IDs (no PII exposed)",
      },
      {
        id: "complete",
        type: "observe",
        title: "Onboarding Complete!",
        description: "You've successfully completed vendor onboarding",
        instruction: "Congratulations! You now have sandbox API access. Continue exploring or exit demo mode.",
        hint: "Try asking the AI about SSO configuration or the communication gateway",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // API TESTING DEMO
  // -------------------------------------------------------------------------
  {
    id: "api-testing",
    name: "API Integration Testing",
    description: "Explore the OneRoster API with live sandbox data",
    estimatedDuration: "2 minutes",
    steps: [
      {
        id: "quick-setup",
        type: "message",
        title: "Quick Setup",
        description: "Register as a demo vendor",
        instruction: "Type the message below to start",
        message: "I'd like to register my EdTech app to get API access",
        expectedOutcome: "The AI will start the registration form",
      },
      {
        id: "complete-form",
        type: "form",
        title: "Quick Registration",
        description: "Complete the registration form",
        instruction: "Fill the form with any demo values. This creates your sandbox access.",
        formName: "pods_lite",
      },
      {
        id: "open-tester",
        type: "message",
        title: "Open API Tester",
        description: "Access the interactive API tester",
        instruction: "Type the message below",
        message: "Test the OneRoster API",
        expectedOutcome: "The API tester panel opens",
      },
      {
        id: "fetch-students",
        type: "action",
        title: "Fetch Students",
        description: "Query the students endpoint",
        instruction: "Click 'Fetch Students' in the API tester",
        actionTarget: "Fetch Students",
        expectedOutcome: "You'll see tokenized student data",
      },
      {
        id: "understand-tokens",
        type: "message",
        title: "Learn About Tokenization",
        description: "Understand privacy-preserving tokens",
        instruction: "Ask the AI to explain tokenization",
        message: "What is tokenization and how does it protect privacy?",
        expectedOutcome: "The AI explains how tokens work",
      },
      {
        id: "complete",
        type: "observe",
        title: "Demo Complete!",
        description: "You've explored the OneRoster API",
        instruction: "You now understand how to access tokenized student data via API.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // SSO CONFIGURATION DEMO
  // -------------------------------------------------------------------------
  {
    id: "sso-config",
    name: "SSO Configuration",
    description: "Configure single sign-on with SchoolDay",
    estimatedDuration: "2 minutes",
    steps: [
      {
        id: "setup",
        type: "message",
        title: "Start SSO Setup",
        description: "Begin vendor registration for SSO",
        instruction: "Type the message below",
        message: "I'd like to register my EdTech app to get API access",
      },
      {
        id: "complete-registration",
        type: "form",
        title: "Complete Registration",
        description: "Register as a vendor first",
        instruction: "Fill out the registration form",
        formName: "pods_lite",
      },
      {
        id: "request-sso",
        type: "message",
        title: "Request SSO Config",
        description: "Ask to configure SSO",
        instruction: "Type the message below",
        message: "Configure SSO with SchoolDay",
        expectedOutcome: "The SSO configuration form appears",
      },
      {
        id: "configure-sso",
        type: "form",
        title: "Configure SSO",
        description: "Set up your SSO provider",
        instruction: "Fill in your SSO configuration details",
        formName: "sso_config",
        hint: "Choose your identity provider and set redirect URIs",
      },
      {
        id: "complete",
        type: "observe",
        title: "SSO Configured!",
        description: "Your SSO integration is set up",
        instruction: "SSO is now configured for your application.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // COMMUNICATION GATEWAY DEMO
  // -------------------------------------------------------------------------
  {
    id: "comm-gateway",
    name: "Communication Gateway",
    description: "Test the privacy-preserving communication gateway",
    estimatedDuration: "2 minutes",
    steps: [
      {
        id: "setup",
        type: "message",
        title: "Start Setup",
        description: "Register as a vendor",
        instruction: "Type the message below",
        message: "I'd like to register my EdTech app to get API access",
      },
      {
        id: "complete-registration",
        type: "form",
        title: "Complete Registration",
        description: "Register as a vendor",
        instruction: "Fill out the registration form",
        formName: "pods_lite",
      },
      {
        id: "request-comm",
        type: "message",
        title: "Test Communication",
        description: "Open the communication gateway",
        instruction: "Type the message below",
        message: "Test sending a message through the communication gateway",
        expectedOutcome: "The communication test form appears",
      },
      {
        id: "send-message",
        type: "form",
        title: "Send Test Message",
        description: "Send a test message via the gateway",
        instruction: "Fill out the message form and send",
        formName: "comm_test",
        hint: "Messages are routed using tokens - no PII is exposed to vendors",
      },
      {
        id: "understand-privacy",
        type: "message",
        title: "Understand Privacy",
        description: "Learn how communication stays private",
        instruction: "Ask the AI about privacy",
        message: "How does tokenization protect student privacy in communications?",
      },
      {
        id: "complete",
        type: "observe",
        title: "Demo Complete!",
        description: "You've tested the communication gateway",
        instruction: "You now understand privacy-preserving communication.",
      },
    ],
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a workflow by ID
 */
export function getWorkflowById(id: string): DemoWorkflow | undefined {
  return DEMO_WORKFLOWS.find(w => w.id === id);
}

/**
 * Get a workflow by initial choice selection
 */
export function getWorkflowByChoice(choice: string): DemoWorkflow | undefined {
  const choiceMap: Record<string, string> = {
    "New Vendor Onboarding": "vendor-onboarding",
    "API Integration Testing": "api-testing",
    "SSO Configuration": "sso-config",
    "Communication Gateway": "comm-gateway",
  };

  const workflowId = choiceMap[choice];
  return workflowId ? getWorkflowById(workflowId) : undefined;
}

/**
 * Get all available demo options
 */
export function getDemoOptions(): string[] {
  return DEMO_WORKFLOWS.map(w => w.name);
}
