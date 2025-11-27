/**
 * Demo Test Scenarios for SchoolDay Vendor Portal
 *
 * Provides structured test scenarios to validate AI assistant responses
 * and form triggers across different user journeys.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface TestScenario {
  id: string;
  name: string;
  category: string;
  userMessage: string;
  expectedKeywords: string[];
  expectedForm?: string;
  description?: string;
}

export interface ScenarioTestResult {
  scenario: TestScenario;
  passed: boolean;
  response: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  formTriggered: string | null;
  formMatch: boolean;
  duration: number;
  error?: string;
}

// =============================================================================
// TEST SCENARIOS
// =============================================================================

export const testScenarios: TestScenario[] = [
  // ---------------------------------------------------------------------------
  // ONBOARDING SCENARIOS
  // ---------------------------------------------------------------------------
  {
    id: "onboard-new-vendor",
    name: "New Vendor Introduction",
    category: "Onboarding",
    userMessage: "I'm a new vendor and want to integrate with LAUSD",
    expectedKeywords: ["PoDS-Lite", "tokenized", "instant"],
    expectedForm: "pods_lite",
    description: "New vendor should be guided to PoDS-Lite application",
  },
  {
    id: "onboard-getting-started",
    name: "Getting Started Query",
    category: "Onboarding",
    userMessage: "How do I get started as an EdTech vendor?",
    expectedKeywords: ["PoDS-Lite", "TOKEN_ONLY", "privacy"],
    expectedForm: "pods_lite",
    description: "Getting started should explain the onboarding process",
  },
  {
    id: "onboard-existing-pods-valid",
    name: "Existing Valid PoDS ID",
    category: "Onboarding",
    userMessage: "I have PoDS PODS-2024-0001",
    expectedKeywords: ["Acme", "Approved", "TOKEN_ONLY"],
    description: "Valid PoDS ID should return vendor details",
  },
  {
    id: "onboard-existing-pods-invalid",
    name: "Invalid PoDS ID",
    category: "Onboarding",
    userMessage: "I have PoDS PODS-9999-9999",
    expectedKeywords: ["couldn't find", "PoDS-Lite"],
    description: "Invalid PoDS should offer to start new application",
  },
  {
    id: "onboard-what-is-pods",
    name: "What is PoDS",
    category: "Onboarding",
    userMessage: "What is PoDS-Lite?",
    expectedKeywords: ["Privacy", "Data", "Sharing", "streamlined"],
    description: "Should explain the PoDS-Lite program",
  },

  // ---------------------------------------------------------------------------
  // SSO SCENARIOS
  // ---------------------------------------------------------------------------
  {
    id: "sso-general-setup",
    name: "General SSO Setup",
    category: "SSO",
    userMessage: "Set up SSO for my application",
    expectedKeywords: ["Schoology", "SchoolDay", "Parent Portal"],
    expectedForm: "sso_config",
    description: "Should present SSO provider options",
  },
  {
    id: "sso-schoology",
    name: "Schoology SSO Configuration",
    category: "SSO",
    userMessage: "Configure Schoology SSO",
    expectedKeywords: ["launch", "redirect", "OAuth"],
    expectedForm: "sso_config",
    description: "Should guide through Schoology SSO setup",
  },
  {
    id: "sso-clever",
    name: "Clever SSO Setup",
    category: "SSO",
    userMessage: "I want to use Clever for single sign-on",
    expectedKeywords: ["Clever", "roster", "sync"],
    expectedForm: "sso_config",
    description: "Should explain Clever SSO integration",
  },
  {
    id: "sso-parent-portal",
    name: "Parent Portal SSO",
    category: "SSO",
    userMessage: "How do parents log into our app?",
    expectedKeywords: ["Parent Portal", "guardian", "family"],
    description: "Should explain parent authentication flow",
  },

  // ---------------------------------------------------------------------------
  // API SCENARIOS
  // ---------------------------------------------------------------------------
  {
    id: "api-test-oneroster",
    name: "Test OneRoster API",
    category: "API",
    userMessage: "Test OneRoster API",
    expectedKeywords: ["tokenized", "/users", "synthetic"],
    expectedForm: "api_tester",
    description: "Should open API tester for OneRoster",
  },
  {
    id: "api-show-students",
    name: "Show Student Data",
    category: "API",
    userMessage: "Show me student data from the API",
    expectedKeywords: ["TKN_STU", "tokenized"],
    expectedForm: "api_tester",
    description: "Should explain tokenized student data access",
  },
  {
    id: "api-endpoints",
    name: "Available API Endpoints",
    category: "API",
    userMessage: "What API endpoints are available?",
    expectedKeywords: ["/users", "/orgs", "/classes", "OneRoster"],
    description: "Should list available API endpoints",
  },
  {
    id: "api-rate-limits",
    name: "API Rate Limits",
    category: "API",
    userMessage: "What are the API rate limits?",
    expectedKeywords: ["requests", "minute", "limit"],
    description: "Should explain API rate limiting",
  },

  // ---------------------------------------------------------------------------
  // TOKENIZATION SCENARIOS
  // ---------------------------------------------------------------------------
  {
    id: "token-how-works",
    name: "How Tokenization Works",
    category: "Tokenization",
    userMessage: "How does tokenization work?",
    expectedKeywords: ["TKN_STU", "privacy", "identifier"],
    description: "Should explain the tokenization process",
  },
  {
    id: "token-data-breach",
    name: "Data Breach Protection",
    category: "Tokenization",
    userMessage: "What if you're breached? Is student data safe?",
    expectedKeywords: ["useless", "cryptographic", "cannot"],
    description: "Should explain breach protection via tokenization",
  },
  {
    id: "token-reverse",
    name: "Token Reversal",
    category: "Tokenization",
    userMessage: "Can tokens be reversed to get real names?",
    expectedKeywords: ["cannot", "one-way", "SchoolDay"],
    description: "Should explain tokens cannot be reversed by vendors",
  },
  {
    id: "token-vs-pii",
    name: "Tokens vs PII",
    category: "Tokenization",
    userMessage: "What's the difference between tokens and real student data?",
    expectedKeywords: ["PII", "token", "privacy", "identifier"],
    description: "Should contrast tokenized vs PII data",
  },

  // ---------------------------------------------------------------------------
  // COMMUNICATION SCENARIOS
  // ---------------------------------------------------------------------------
  {
    id: "comm-test-email",
    name: "Test Email Gateway",
    category: "Communication",
    userMessage: "Test email gateway",
    expectedKeywords: ["routing", "relay", "privacy"],
    expectedForm: "comm_test",
    description: "Should open communication test form",
  },
  {
    id: "comm-send-to-parent",
    name: "Send Message to Parent",
    category: "Communication",
    userMessage: "How do I send a message to a parent?",
    expectedKeywords: ["token", "relay", "email"],
    description: "Should explain parent communication flow",
  },
  {
    id: "comm-sms-support",
    name: "SMS Support",
    category: "Communication",
    userMessage: "Can I send SMS messages to students?",
    expectedKeywords: ["SMS", "channel", "gateway"],
    description: "Should explain SMS capabilities",
  },

  // ---------------------------------------------------------------------------
  // COMPLIANCE SCENARIOS
  // ---------------------------------------------------------------------------
  {
    id: "comply-ferpa",
    name: "FERPA Compliance",
    category: "Compliance",
    userMessage: "Are you FERPA compliant?",
    expectedKeywords: ["FERPA", "audit", "tokenization"],
    description: "Should explain FERPA compliance measures",
  },
  {
    id: "comply-coppa",
    name: "COPPA Compliance",
    category: "Compliance",
    userMessage: "What about COPPA for younger students?",
    expectedKeywords: ["under 13", "consent", "token"],
    description: "Should explain COPPA protections",
  },
  {
    id: "comply-sopipa",
    name: "SOPIPA Compliance",
    category: "Compliance",
    userMessage: "How do you handle SOPIPA requirements?",
    expectedKeywords: ["SOPIPA", "California", "privacy"],
    description: "Should explain SOPIPA compliance",
  },
  {
    id: "comply-audit",
    name: "Audit Trail",
    category: "Compliance",
    userMessage: "Show me the audit log",
    expectedKeywords: ["audit", "log", "activity"],
    expectedForm: "audit_log",
    description: "Should show audit log viewer",
  },

  // ---------------------------------------------------------------------------
  // CREDENTIALS SCENARIOS
  // ---------------------------------------------------------------------------
  {
    id: "creds-show",
    name: "Show Credentials",
    category: "Credentials",
    userMessage: "Show me my sandbox credentials",
    expectedKeywords: ["API", "key", "secret"],
    expectedForm: "credentials",
    description: "Should display sandbox credentials",
  },
  {
    id: "creds-rotate",
    name: "Rotate API Keys",
    category: "Credentials",
    userMessage: "I need to rotate my API keys",
    expectedKeywords: ["rotate", "new", "key"],
    description: "Should explain key rotation process",
  },

  // ---------------------------------------------------------------------------
  // APP SUBMISSION SCENARIOS
  // ---------------------------------------------------------------------------
  {
    id: "app-submit",
    name: "Submit App to Catalog",
    category: "App Submission",
    userMessage: "I want to submit my app to the freemium catalog",
    expectedKeywords: ["freemium", "catalog", "submit"],
    expectedForm: "app_submit",
    description: "Should open app submission form",
  },
  {
    id: "app-requirements",
    name: "App Requirements",
    category: "App Submission",
    userMessage: "What are the requirements to list my app?",
    expectedKeywords: ["PoDS", "compliance", "review"],
    description: "Should explain app listing requirements",
  },

  // ---------------------------------------------------------------------------
  // HELP & GENERAL SCENARIOS
  // ---------------------------------------------------------------------------
  {
    id: "help-what-can-you-do",
    name: "Capabilities Query",
    category: "Help",
    userMessage: "What can you help me with?",
    expectedKeywords: ["onboard", "SSO", "API", "integration"],
    description: "Should list assistant capabilities",
  },
  {
    id: "help-contact-support",
    name: "Contact Support",
    category: "Help",
    userMessage: "I need to talk to a human",
    expectedKeywords: ["support", "contact", "help"],
    description: "Should provide support contact info",
  },
];

// =============================================================================
// SCENARIO TEST RUNNER
// =============================================================================

/**
 * Run a single scenario test against the chat API
 */
export async function runScenarioTest(
  scenario: TestScenario,
  options: {
    apiUrl?: string;
    timeout?: number;
    vendorContext?: Record<string, unknown>;
  } = {}
): Promise<ScenarioTestResult> {
  const {
    apiUrl = "/api/chat",
    timeout = 30000,
    vendorContext,
  } = options;

  const startTime = Date.now();
  let response = "";
  let formTriggered: string | null = null;
  let error: string | undefined;

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Make API request
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: scenario.userMessage }],
        vendorContext,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    // Read streaming response
    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data) as {
            type: string;
            text?: string;
            result?: { showForm?: string };
          };

          if (parsed.type === "content" && parsed.text) {
            response += parsed.text;
          }

          if (parsed.type === "tool_result" && parsed.result?.showForm) {
            formTriggered = parsed.result.showForm;
          }
        } catch {
          // Ignore JSON parse errors
        }
      }
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  const duration = Date.now() - startTime;

  // Check for expected keywords (case-insensitive)
  const responseLower = response.toLowerCase();
  const matchedKeywords = scenario.expectedKeywords.filter((kw) =>
    responseLower.includes(kw.toLowerCase())
  );
  const missingKeywords = scenario.expectedKeywords.filter(
    (kw) => !responseLower.includes(kw.toLowerCase())
  );

  // Check form trigger
  const formMatch = scenario.expectedForm
    ? formTriggered === scenario.expectedForm
    : formTriggered === null;

  // Determine pass/fail
  const passed =
    !error &&
    missingKeywords.length === 0 &&
    formMatch;

  return {
    scenario,
    passed,
    response,
    matchedKeywords,
    missingKeywords,
    formTriggered,
    formMatch,
    duration,
    error,
  };
}

/**
 * Run all scenarios and return results
 */
export async function runAllScenarios(
  options: {
    apiUrl?: string;
    timeout?: number;
    vendorContext?: Record<string, unknown>;
    onProgress?: (result: ScenarioTestResult, index: number, total: number) => void;
  } = {}
): Promise<ScenarioTestResult[]> {
  const results: ScenarioTestResult[] = [];
  const total = testScenarios.length;

  for (let i = 0; i < total; i++) {
    const scenario = testScenarios[i]!;
    const result = await runScenarioTest(scenario, options);
    results.push(result);

    if (options.onProgress) {
      options.onProgress(result, i + 1, total);
    }

    // Small delay between requests to avoid rate limiting
    if (i < total - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Get scenarios by category
 */
export function getScenariosByCategory(category: string): TestScenario[] {
  return testScenarios.filter((s) => s.category === category);
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
  return Array.from(new Set(testScenarios.map((s) => s.category)));
}

/**
 * Generate a summary report from test results
 */
export function generateTestReport(results: ScenarioTestResult[]): {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  avgDuration: number;
  byCategory: Record<string, { passed: number; failed: number }>;
  failures: ScenarioTestResult[];
} {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

  const byCategory: Record<string, { passed: number; failed: number }> = {};
  for (const result of results) {
    const category = result.scenario.category;
    if (!byCategory[category]) {
      byCategory[category] = { passed: 0, failed: 0 };
    }
    if (result.passed) {
      byCategory[category].passed++;
    } else {
      byCategory[category].failed++;
    }
  }

  return {
    total: results.length,
    passed,
    failed,
    passRate: (passed / results.length) * 100,
    avgDuration,
    byCategory,
    failures: results.filter((r) => !r.passed),
  };
}
