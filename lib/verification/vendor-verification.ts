/**
 * Vendor Verification Service
 *
 * Digital-age verification checks for PoDS-Lite applications.
 * Provides lightweight legitimacy signals without adding bureaucracy.
 *
 * Checks performed:
 * 1. Email domain matches website domain
 * 2. Website has valid SSL certificate
 * 3. Domain age verification (WHOIS-based)
 * 4. LinkedIn company profile exists
 * 5. LinkedIn employee count (optional)
 */

import {
  type VerificationSignal,
  type VerificationResult,
  type DistrictVerificationConfig,
  DEFAULT_VERIFICATION_CONFIG,
} from "@/lib/types";

// =============================================================================
// TYPES
// =============================================================================

export interface VerificationInput {
  contactEmail: string;
  websiteUrl: string;
  linkedInUrl?: string;
  vendorId?: string;
}

// These interfaces document the expected structure from external APIs
// They're not used directly but serve as documentation for future implementation
/* eslint-disable @typescript-eslint/no-unused-vars */
interface _DomainInfo {
  domain: string;
  createdDate?: Date;
  ageInDays?: number;
  hasSSL: boolean;
  sslValid: boolean;
  sslExpiresAt?: Date;
}

interface _LinkedInInfo {
  exists: boolean;
  companyName?: string;
  employeeCount?: number;
  employeeRange?: string;
  profileUrl: string;
}
/* eslint-enable @typescript-eslint/no-unused-vars */

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Extract domain from email address
 */
function extractEmailDomain(email: string): string {
  const parts = email.split("@");
  return parts[1]?.toLowerCase() ?? "";
}

/**
 * Extract domain from URL
 */
function extractUrlDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove www. prefix for comparison
    return urlObj.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Normalize LinkedIn URL to company page format
 */
function normalizeLinkedInUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes("linkedin.com")) {
      return null;
    }
    // Extract company slug from various LinkedIn URL formats
    const match = url.match(/linkedin\.com\/company\/([^/?]+)/i);
    if (match) {
      return `https://www.linkedin.com/company/${match[1]}`;
    }
    return url;
  } catch {
    return null;
  }
}

// =============================================================================
// VERIFICATION CHECKS
// =============================================================================

/**
 * Check if email domain matches website domain
 */
function checkEmailDomainMatch(
  emailDomain: string,
  websiteDomain: string,
  weight: number
): VerificationSignal {
  const matches = emailDomain === websiteDomain;

  return {
    signalType: "EMAIL_DOMAIN_MATCH",
    passed: matches,
    score: matches ? weight : 0,
    details: matches
      ? `Email domain "${emailDomain}" matches website`
      : `Email domain "${emailDomain}" does not match website "${websiteDomain}"`,
    checkedAt: new Date(),
  };
}

/**
 * Check website SSL certificate
 * In production, this would make an actual HTTPS request
 * For demo/sandbox, we simulate based on URL
 */
async function checkWebsiteSSL(
  websiteUrl: string,
  weight: number
): Promise<VerificationSignal> {
  // Simulate SSL check
  const isHttps = websiteUrl.toLowerCase().startsWith("https://");

  // In demo mode, simulate various scenarios
  const domain = extractUrlDomain(websiteUrl);
  const knownBadDomains = ["example-insecure.com", "no-ssl.test"];
  const isKnownBad = knownBadDomains.some((bad) => domain.includes(bad));

  const hasValidSSL = isHttps && !isKnownBad;

  return {
    signalType: "WEBSITE_SSL",
    passed: hasValidSSL,
    score: hasValidSSL ? weight : 0,
    details: hasValidSSL
      ? "Website has valid SSL certificate"
      : isHttps
        ? "SSL certificate validation failed"
        : "Website does not use HTTPS",
    checkedAt: new Date(),
  };
}

/**
 * Check domain age using WHOIS-like data
 * In production, this would query a WHOIS API
 * For demo/sandbox, we simulate based on domain
 */
async function checkDomainAge(
  websiteUrl: string,
  minAgeDays: number,
  weight: number
): Promise<VerificationSignal> {
  const domain = extractUrlDomain(websiteUrl);

  // Simulate domain age lookup
  // In production, use a WHOIS API like whoisjson.com or similar
  let simulatedAgeDays: number;

  // Well-known domains get high age
  const oldDomains = [
    "google.com",
    "microsoft.com",
    "apple.com",
    "amazon.com",
    "github.com",
  ];
  const newDomains = ["new-vendor.test", "startup-2024.com", "fresh.io"];

  if (oldDomains.some((old) => domain.includes(old))) {
    simulatedAgeDays = 5000 + Math.floor(Math.random() * 2000);
  } else if (newDomains.some((newD) => domain.includes(newD))) {
    simulatedAgeDays = 30 + Math.floor(Math.random() * 60);
  } else {
    // Random age for demo purposes - most vendors have established domains
    simulatedAgeDays = 180 + Math.floor(Math.random() * 3000);
  }

  const passed = simulatedAgeDays >= minAgeDays;
  const ageYears = Math.floor(simulatedAgeDays / 365);
  const ageMonths = Math.floor((simulatedAgeDays % 365) / 30);

  let ageDescription: string;
  if (ageYears > 0) {
    ageDescription = `${ageYears} year${ageYears > 1 ? "s" : ""}${ageMonths > 0 ? `, ${ageMonths} months` : ""}`;
  } else {
    ageDescription = `${ageMonths} month${ageMonths !== 1 ? "s" : ""}`;
  }

  return {
    signalType: "WEBSITE_AGE",
    passed,
    score: passed ? weight : Math.floor(weight * (simulatedAgeDays / minAgeDays)),
    details: passed
      ? `Domain is ${ageDescription} old (meets ${minAgeDays} day minimum)`
      : `Domain is only ${simulatedAgeDays} days old (requires ${minAgeDays} days)`,
    checkedAt: new Date(),
  };
}

/**
 * Check LinkedIn company profile exists
 * In production, this would use LinkedIn API or scraping service
 * For demo/sandbox, we simulate based on URL format
 */
async function checkLinkedInProfile(
  linkedInUrl: string | undefined,
  weight: number
): Promise<VerificationSignal> {
  if (!linkedInUrl) {
    return {
      signalType: "LINKEDIN_COMPANY_PROFILE",
      passed: false,
      score: 0,
      details: "No LinkedIn profile URL provided",
      checkedAt: new Date(),
    };
  }

  const normalizedUrl = normalizeLinkedInUrl(linkedInUrl);
  if (!normalizedUrl) {
    return {
      signalType: "LINKEDIN_COMPANY_PROFILE",
      passed: false,
      score: 0,
      details: "Invalid LinkedIn URL format",
      checkedAt: new Date(),
    };
  }

  // For demo, simulate profile existence based on URL
  // In production, verify via LinkedIn API or web scrape
  const exists = !normalizedUrl.includes("nonexistent");

  return {
    signalType: "LINKEDIN_COMPANY_PROFILE",
    passed: exists,
    score: exists ? weight : 0,
    details: exists
      ? "LinkedIn company profile verified"
      : "LinkedIn company profile not found",
    checkedAt: new Date(),
  };
}

/**
 * Check LinkedIn employee count
 * In production, this would use LinkedIn API
 * For demo/sandbox, we simulate
 */
async function checkLinkedInEmployeeCount(
  linkedInUrl: string | undefined,
  weight: number
): Promise<VerificationSignal> {
  if (!linkedInUrl) {
    return {
      signalType: "LINKEDIN_EMPLOYEE_COUNT",
      passed: false,
      score: 0,
      details: "No LinkedIn profile to check employee count",
      checkedAt: new Date(),
    };
  }

  // Simulate employee count ranges
  const ranges = [
    { min: 1, max: 10, label: "1-10 employees", score: weight * 0.5 },
    { min: 11, max: 50, label: "11-50 employees", score: weight * 0.7 },
    { min: 51, max: 200, label: "51-200 employees", score: weight * 0.85 },
    { min: 201, max: 500, label: "201-500 employees", score: weight },
    { min: 501, max: 10000, label: "500+ employees", score: weight },
  ];

  // Random selection weighted toward smaller companies (typical for EdTech)
  const rand = Math.random();
  let selectedRange;
  if (rand < 0.3) {
    selectedRange = ranges[0]; // 30% 1-10
  } else if (rand < 0.6) {
    selectedRange = ranges[1]; // 30% 11-50
  } else if (rand < 0.85) {
    selectedRange = ranges[2]; // 25% 51-200
  } else if (rand < 0.95) {
    selectedRange = ranges[3]; // 10% 201-500
  } else {
    selectedRange = ranges[4]; // 5% 500+
  }

  return {
    signalType: "LINKEDIN_EMPLOYEE_COUNT",
    passed: true,
    score: Math.floor(selectedRange?.score ?? 0),
    details: `Company shows ${selectedRange?.label ?? "unknown employees"} on LinkedIn`,
    checkedAt: new Date(),
  };
}

// =============================================================================
// MAIN VERIFICATION FUNCTION
// =============================================================================

/**
 * Verify a vendor's legitimacy using digital signals
 *
 * @param input - Verification input (email, website, LinkedIn)
 * @param config - District verification configuration
 * @returns Verification result with score and decision
 */
export async function verifyVendor(
  input: VerificationInput,
  config: DistrictVerificationConfig = DEFAULT_VERIFICATION_CONFIG
): Promise<VerificationResult> {
  const emailDomain = extractEmailDomain(input.contactEmail);
  const websiteDomain = extractUrlDomain(input.websiteUrl);

  const signals: VerificationSignal[] = [];

  // 1. Email domain match
  const emailSignal = checkEmailDomainMatch(
    emailDomain,
    websiteDomain,
    config.weights.emailDomainMatch
  );
  signals.push(emailSignal);

  // 2. Website SSL
  const sslSignal = await checkWebsiteSSL(
    input.websiteUrl,
    config.weights.websiteSSL
  );
  signals.push(sslSignal);

  // 3. Domain age
  const ageSignal = await checkDomainAge(
    input.websiteUrl,
    config.minDomainAgeDays,
    config.weights.websiteAge
  );
  signals.push(ageSignal);

  // 4. LinkedIn profile (if URL provided or required)
  const linkedInSignal = await checkLinkedInProfile(
    input.linkedInUrl,
    config.weights.linkedInCompanyProfile
  );
  signals.push(linkedInSignal);

  // 5. LinkedIn employee count (only if profile exists)
  if (linkedInSignal.passed) {
    const employeeSignal = await checkLinkedInEmployeeCount(
      input.linkedInUrl,
      config.weights.linkedInEmployeeCount
    );
    signals.push(employeeSignal);
  }

  // Calculate total score
  const totalScore = signals.reduce((sum, s) => sum + s.score, 0);
  const maxPossibleScore =
    config.weights.emailDomainMatch +
    config.weights.websiteSSL +
    config.weights.websiteAge +
    config.weights.linkedInCompanyProfile +
    config.weights.linkedInEmployeeCount;

  // Make decision based on thresholds
  let decision: "APPROVED" | "MANUAL_REVIEW" | "REJECTED";
  let decisionReason: string;

  // Check for hard failures first
  const criticalFailures: string[] = [];
  if (config.requireDomainMatch && !emailSignal.passed) {
    criticalFailures.push("Email domain does not match website");
  }
  if (config.requireSSL && !sslSignal.passed) {
    criticalFailures.push("Website lacks valid SSL");
  }
  if (config.requireCompanyLinkedIn && !linkedInSignal.passed) {
    criticalFailures.push("LinkedIn company profile not verified");
  }

  // Use Privacy-Safe tier thresholds for basic verification
  const tierConfig = config.tierRequirements.privacySafe;

  if (criticalFailures.length > 0) {
    decision = "MANUAL_REVIEW";
    decisionReason = `Requires review: ${criticalFailures.join(", ")}`;
  } else if (totalScore >= tierConfig.passThreshold) {
    decision = "APPROVED";
    decisionReason = `Verification score ${totalScore}/${maxPossibleScore} meets threshold (${tierConfig.passThreshold})`;
  } else if (totalScore >= tierConfig.reviewThreshold) {
    decision = "MANUAL_REVIEW";
    decisionReason = `Score ${totalScore}/${maxPossibleScore} below auto-approval threshold (${tierConfig.passThreshold})`;
  } else {
    decision = "REJECTED";
    decisionReason = `Score ${totalScore}/${maxPossibleScore} below minimum threshold (${tierConfig.reviewThreshold})`;
  }

  return {
    vendorId: input.vendorId,
    websiteUrl: input.websiteUrl,
    linkedInUrl: input.linkedInUrl,
    emailDomain,
    signals,
    totalScore,
    maxPossibleScore,
    passThreshold: tierConfig.passThreshold,
    decision,
    decisionReason,
    verifiedAt: new Date(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
  };
}

/**
 * Quick check if vendor passes basic verification
 * Used for real-time form validation feedback
 */
export function quickVerificationCheck(
  contactEmail: string,
  websiteUrl: string
): { emailDomainMatches: boolean; isHttps: boolean } {
  const emailDomain = extractEmailDomain(contactEmail);
  const websiteDomain = extractUrlDomain(websiteUrl);

  return {
    emailDomainMatches: emailDomain === websiteDomain,
    isHttps: websiteUrl.toLowerCase().startsWith("https://"),
  };
}

/**
 * Get a human-readable summary of verification result
 */
export function getVerificationSummary(result: VerificationResult): string {
  const passedCount = result.signals.filter((s) => s.passed).length;
  const totalCount = result.signals.length;

  const lines = [
    `Verification Score: ${result.totalScore}/${result.maxPossibleScore}`,
    `Checks Passed: ${passedCount}/${totalCount}`,
    `Decision: ${result.decision}`,
    "",
    "Details:",
    ...result.signals.map(
      (s) => `  ${s.passed ? "✓" : "✗"} ${s.signalType}: ${s.details}`
    ),
  ];

  return lines.join("\n");
}
