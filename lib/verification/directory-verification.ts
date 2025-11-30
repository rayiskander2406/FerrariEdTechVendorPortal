/**
 * EdTech Directory Verification Service
 *
 * Checks vendor presence in credible EdTech directories and certification bodies.
 * These checks are primarily used for Selective and Full Access tiers.
 *
 * Supported Directories:
 * - 1EdTech (IMS Global) - LTI/OneRoster certification
 * - Common Sense Privacy Program - Privacy evaluation ratings
 * - SDPC - Student Data Privacy Consortium (NDPA signatories)
 * - iKeepSafe - COPPA/FERPA certifications
 * - Student Privacy Pledge - FPF commitment
 * - Clever/ClassLink - Integration partner certifications
 * - State-specific approved lists
 */

import {
  type VerificationSignal,
  type VerificationSignalType,
  type EdTechDirectory,
  EDTECH_DIRECTORIES,
} from "@/lib/types";

// =============================================================================
// TYPES
// =============================================================================

export interface DirectoryCheckInput {
  vendorName: string;
  websiteUrl: string;
  applicationName?: string;
}

export interface DirectoryCheckResult {
  directoryId: string;
  directoryName: string;
  found: boolean;
  certificationLevel?: string;
  listingUrl?: string;
  certifiedSince?: Date;
  expiresAt?: Date;
  rating?: string;
  details?: string;
}

export interface ApplicantVerificationInput {
  applicantName: string;
  applicantEmail: string;
  applicantLinkedInUrl?: string;
  companyName: string;
  companyLinkedInUrl?: string;
}

// =============================================================================
// DIRECTORY SIGNAL MAPPING
// =============================================================================

const DIRECTORY_TO_SIGNAL: Record<string, VerificationSignalType> = {
  "1edtech": "DIRECTORY_1EDTECH",
  "common_sense": "DIRECTORY_COMMON_SENSE",
  "sdpc": "DIRECTORY_SDPC",
  "ikeepsafe": "DIRECTORY_IKEEPSAFE",
  "privacy_pledge": "DIRECTORY_PRIVACY_PLEDGE",
  "clever": "DIRECTORY_CLEVER",
  "classlink": "DIRECTORY_CLASSLINK",
  "ca_approved": "DIRECTORY_STATE_APPROVED",
};

// =============================================================================
// SIMULATED DIRECTORY DATA (for demo purposes)
// =============================================================================

// In production, these would be actual API calls to each directory
const SIMULATED_DIRECTORY_LISTINGS: Record<string, string[]> = {
  "1edtech": [
    "Canvas", "Schoology", "Google Classroom", "Clever", "ClassLink",
    "PowerSchool", "Infinite Campus", "Blackboard", "Moodle", "D2L",
    "McGraw-Hill", "Pearson", "Cengage", "Khan Academy", "Quizlet",
  ],
  "common_sense": [
    "Google Classroom", "Khan Academy", "Duolingo", "Quizlet", "BrainPOP",
    "Newsela", "Epic!", "Seesaw", "ClassDojo", "Remind",
    "Nearpod", "Kahoot!", "Flipgrid", "Edpuzzle", "Pear Deck",
  ],
  "sdpc": [
    "Canvas", "Schoology", "PowerSchool", "Infinite Campus", "Clever",
    "ClassLink", "Aeries", "Illuminate", "NWEA", "Renaissance",
    "IXL", "Lexia", "DreamBox", "ST Math", "Imagine Learning",
  ],
  "ikeepsafe": [
    "ClassDojo", "Seesaw", "Remind", "Bloomz", "ParentSquare",
    "SchoolMessenger", "Clever", "ClassLink", "Google Workspace",
    "Microsoft 365 Education", "Zoom", "GoGuardian", "Securly",
  ],
  "privacy_pledge": [
    "Google", "Microsoft", "Apple", "Amazon", "Clever", "ClassLink",
    "Canvas", "Schoology", "Khan Academy", "Quizlet", "Duolingo",
    "McGraw-Hill", "Pearson", "Houghton Mifflin", "Cengage",
  ],
  "clever": [
    "Canvas", "Schoology", "Google Classroom", "IXL", "Khan Academy",
    "Quizlet", "Newsela", "BrainPOP", "DreamBox", "Lexia",
    "ST Math", "Achieve3000", "Amplify", "Curriculum Associates",
  ],
  "classlink": [
    "Canvas", "Schoology", "Google Workspace", "Microsoft 365",
    "PowerSchool", "Infinite Campus", "Aeries", "Skyward",
    "Renaissance", "NWEA", "Illuminate", "Edgenuity",
  ],
  "ca_approved": [
    "Canvas", "Schoology", "Google Classroom", "PowerSchool",
    "Illuminate", "Aeries", "NWEA", "Renaissance", "IXL",
    "Khan Academy", "BrainPOP", "Newsela", "Achieve3000",
  ],
};

// Simulated certification levels
const CERTIFICATION_LEVELS: Record<string, string[]> = {
  "1edtech": ["Certified", "Certified with Distinction", "Conformant"],
  "common_sense": ["Pass", "Pass with Warning", "Not Evaluated"],
  "sdpc": ["NDPA Signatory", "State DPA Signatory"],
  "ikeepsafe": ["COPPA Safe Harbor", "FERPA Certified", "CSPC Certified"],
  "privacy_pledge": ["Signatory", "K-12 Pledge Signatory"],
  "clever": ["Certified Partner", "Premier Partner"],
  "classlink": ["Certified Partner", "Roster Server Certified"],
  "ca_approved": ["Approved", "Conditionally Approved"],
};

// =============================================================================
// DIRECTORY CHECK FUNCTIONS
// =============================================================================

/**
 * Check if a vendor is listed in a specific directory
 */
async function checkDirectory(
  directory: EdTechDirectory,
  input: DirectoryCheckInput
): Promise<DirectoryCheckResult> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  const listings = SIMULATED_DIRECTORY_LISTINGS[directory.id] ?? [];
  const certLevels = CERTIFICATION_LEVELS[directory.id] ?? ["Certified"];

  // Check if vendor name or application name matches any listing
  const vendorLower = input.vendorName.toLowerCase();
  const appLower = (input.applicationName ?? "").toLowerCase();

  const found = listings.some(
    (listing) =>
      listing.toLowerCase().includes(vendorLower) ||
      vendorLower.includes(listing.toLowerCase()) ||
      listing.toLowerCase().includes(appLower) ||
      appLower.includes(listing.toLowerCase())
  );

  if (!found) {
    // For demo, randomly include some vendors (30% chance)
    const randomInclude = Math.random() < 0.3;
    if (!randomInclude) {
      return {
        directoryId: directory.id,
        directoryName: directory.name,
        found: false,
        details: `Not found in ${directory.name}`,
      };
    }
  }

  // Generate simulated certification data
  const certLevel = certLevels[Math.floor(Math.random() * certLevels.length)];
  const certifiedSince = new Date();
  certifiedSince.setMonth(certifiedSince.getMonth() - Math.floor(Math.random() * 36));

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  return {
    directoryId: directory.id,
    directoryName: directory.name,
    found: true,
    certificationLevel: certLevel,
    listingUrl: directory.apiEndpoint
      ? `${directory.apiEndpoint}?vendor=${encodeURIComponent(input.vendorName)}`
      : undefined,
    certifiedSince,
    expiresAt,
    details: `${certLevel} in ${directory.name}`,
  };
}

/**
 * Check all enabled directories for a vendor
 */
export async function checkAllDirectories(
  input: DirectoryCheckInput,
  enabledDirectoryIds: string[]
): Promise<DirectoryCheckResult[]> {
  const enabledDirectories = EDTECH_DIRECTORIES.filter(
    (d) => enabledDirectoryIds.includes(d.id) && d.enabled
  );

  const results = await Promise.all(
    enabledDirectories.map((dir) => checkDirectory(dir, input))
  );

  return results;
}

/**
 * Convert directory check results to verification signals
 */
export function directoryResultsToSignals(
  results: DirectoryCheckResult[],
  weightPerDirectory: number
): VerificationSignal[] {
  return results.map((result) => {
    const signalType = DIRECTORY_TO_SIGNAL[result.directoryId];
    if (!signalType) {
      // Default to state approved for unknown directories
      return {
        signalType: "DIRECTORY_STATE_APPROVED" as VerificationSignalType,
        passed: result.found,
        score: result.found ? weightPerDirectory : 0,
        details: result.details,
        checkedAt: new Date(),
        directoryData: result.found
          ? {
              directoryName: result.directoryName,
              listingUrl: result.listingUrl,
              certificationLevel: result.certificationLevel,
              certifiedSince: result.certifiedSince,
              expiresAt: result.expiresAt,
            }
          : undefined,
      };
    }

    return {
      signalType,
      passed: result.found,
      score: result.found ? weightPerDirectory : 0,
      details: result.details,
      checkedAt: new Date(),
      directoryData: result.found
        ? {
            directoryName: result.directoryName,
            listingUrl: result.listingUrl,
            certificationLevel: result.certificationLevel,
            certifiedSince: result.certifiedSince,
            expiresAt: result.expiresAt,
          }
        : undefined,
    };
  });
}

// =============================================================================
// APPLICANT VERIFICATION
// =============================================================================

/**
 * Check if applicant's LinkedIn shows company affiliation
 */
export async function checkApplicantLinkedIn(
  input: ApplicantVerificationInput,
  weight: number
): Promise<VerificationSignal> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 150));

  if (!input.applicantLinkedInUrl) {
    return {
      signalType: "APPLICANT_LINKEDIN_VERIFIED",
      passed: false,
      score: 0,
      details: "No applicant LinkedIn URL provided",
      checkedAt: new Date(),
    };
  }

  // Validate LinkedIn URL format
  try {
    const url = new URL(input.applicantLinkedInUrl);
    if (!url.hostname.includes("linkedin.com")) {
      return {
        signalType: "APPLICANT_LINKEDIN_VERIFIED",
        passed: false,
        score: 0,
        details: "Invalid LinkedIn URL",
        checkedAt: new Date(),
      };
    }
  } catch {
    return {
      signalType: "APPLICANT_LINKEDIN_VERIFIED",
      passed: false,
      score: 0,
      details: "Invalid URL format",
      checkedAt: new Date(),
    };
  }

  // In production, this would use LinkedIn API to verify:
  // 1. Profile exists
  // 2. Current company matches vendor company
  // 3. Profile is verified (has verification badge)
  // 4. Employment duration

  // For demo, simulate verification (80% pass rate for valid URLs)
  const verified = Math.random() < 0.8;

  if (verified) {
    return {
      signalType: "APPLICANT_LINKEDIN_VERIFIED",
      passed: true,
      score: weight,
      details: `Verified: ${input.applicantName} is listed as employee at ${input.companyName}`,
      checkedAt: new Date(),
    };
  }

  return {
    signalType: "APPLICANT_LINKEDIN_VERIFIED",
    passed: false,
    score: 0,
    details: `Could not verify ${input.applicantName}'s affiliation with ${input.companyName}`,
    checkedAt: new Date(),
  };
}

/**
 * Check if applicant email is corporate (not free email provider)
 */
export function checkApplicantEmailCorporate(
  email: string,
  companyDomain: string,
  weight: number
): VerificationSignal {
  const freeEmailProviders = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "aol.com",
    "icloud.com",
    "mail.com",
    "protonmail.com",
    "zoho.com",
    "yandex.com",
  ];

  const emailDomain = email.split("@")[1]?.toLowerCase() ?? "";
  const isFreeEmail = freeEmailProviders.includes(emailDomain);
  const matchesCompany = emailDomain === companyDomain.toLowerCase();

  if (isFreeEmail) {
    return {
      signalType: "APPLICANT_EMAIL_CORPORATE",
      passed: false,
      score: 0,
      details: `Using free email provider (${emailDomain}). Corporate email required for PII access.`,
      checkedAt: new Date(),
    };
  }

  if (matchesCompany) {
    return {
      signalType: "APPLICANT_EMAIL_CORPORATE",
      passed: true,
      score: weight,
      details: `Corporate email verified: ${emailDomain} matches company domain`,
      checkedAt: new Date(),
    };
  }

  // Email is not free but doesn't match company domain - partial credit
  return {
    signalType: "APPLICANT_EMAIL_CORPORATE",
    passed: true,
    score: Math.floor(weight * 0.5),
    details: `Corporate email (${emailDomain}) but does not match company website domain`,
    checkedAt: new Date(),
  };
}

// =============================================================================
// SUMMARY HELPERS
// =============================================================================

/**
 * Get a summary of directory check results
 */
export function getDirectorySummary(results: DirectoryCheckResult[]): {
  totalChecked: number;
  totalFound: number;
  directories: string[];
  certifications: string[];
} {
  const found = results.filter((r) => r.found);

  return {
    totalChecked: results.length,
    totalFound: found.length,
    directories: found.map((r) => r.directoryName),
    certifications: found
      .filter((r) => r.certificationLevel)
      .map((r) => `${r.directoryName}: ${r.certificationLevel}`),
  };
}

/**
 * Get the directory configuration by ID
 */
export function getDirectoryById(id: string): EdTechDirectory | undefined {
  return EDTECH_DIRECTORIES.find((d) => d.id === id);
}

/**
 * Get all directories required for PII access
 */
export function getPIIRequiredDirectories(): EdTechDirectory[] {
  return EDTECH_DIRECTORIES.filter((d) => d.requiredForPII && d.enabled);
}
