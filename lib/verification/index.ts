/**
 * Vendor Verification Module
 *
 * Digital-age legitimacy verification for PoDS-Lite applications.
 * Provides lightweight checks without bureaucracy.
 *
 * Features:
 * - Basic verification (Privacy-Safe tier): Domain match, SSL, website age
 * - Enhanced verification (PII tiers): Applicant LinkedIn, EdTech directories
 * - Configurable per-district thresholds
 */

// Basic vendor verification
export {
  verifyVendor,
  quickVerificationCheck,
  getVerificationSummary,
  type VerificationInput,
} from "./vendor-verification";

// EdTech directory and applicant verification
export {
  checkAllDirectories,
  directoryResultsToSignals,
  checkApplicantLinkedIn,
  checkApplicantEmailCorporate,
  getDirectorySummary,
  getDirectoryById,
  getPIIRequiredDirectories,
  type DirectoryCheckInput,
  type DirectoryCheckResult,
  type ApplicantVerificationInput,
} from "./directory-verification";

// Types and configuration
export {
  DEFAULT_VERIFICATION_CONFIG,
  EDTECH_DIRECTORIES,
  type VerificationSignal,
  type VerificationSignalType,
  type VerificationResult,
  type DistrictVerificationConfig,
  type TierVerificationRequirements,
  type EdTechDirectory,
} from "@/lib/types";
