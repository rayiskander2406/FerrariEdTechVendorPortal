/**
 * EdTech Directory Verification Service Tests
 *
 * Tests for directory verification (1EdTech, Common Sense, SDPC, etc.)
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkAllDirectories,
  directoryResultsToSignals,
  checkApplicantLinkedIn,
  checkApplicantEmailCorporate,
  getDirectorySummary,
  getDirectoryById,
  getPIIRequiredDirectories,
  type DirectoryCheckInput,
  type ApplicantVerificationInput,
} from "@/lib/verification/directory-verification";
import { EDTECH_DIRECTORIES } from "@/lib/types";

// =============================================================================
// DIRECTORY CHECK TESTS
// =============================================================================

describe("checkAllDirectories", () => {
  it("should check multiple directories for a vendor", async () => {
    const input: DirectoryCheckInput = {
      vendorName: "Canvas",
      websiteUrl: "https://canvas.com",
    };

    const results = await checkAllDirectories(input, ["1edtech", "common_sense"]);

    expect(results).toBeDefined();
    expect(results.length).toBe(2);
    expect(results.every(r => r.directoryId)).toBe(true);
  });

  it("should find known vendors in simulated directories", async () => {
    const input: DirectoryCheckInput = {
      vendorName: "Khan Academy",
      websiteUrl: "https://khanacademy.org",
    };

    const results = await checkAllDirectories(input, [
      "common_sense",
      "privacy_pledge",
    ]);

    // Khan Academy is in the simulated listings
    const foundResults = results.filter(r => r.found);
    expect(foundResults.length).toBeGreaterThan(0);
  });

  it("should include certification level when found", async () => {
    const input: DirectoryCheckInput = {
      vendorName: "Google Classroom",
      websiteUrl: "https://classroom.google.com",
    };

    const results = await checkAllDirectories(input, ["1edtech"]);
    const foundResult = results.find(r => r.found);

    if (foundResult) {
      expect(foundResult.certificationLevel).toBeDefined();
    }
  });

  it("should only check enabled directories", async () => {
    const input: DirectoryCheckInput = {
      vendorName: "TestVendor",
      websiteUrl: "https://test.com",
    };

    // Check with a mix of valid and invalid IDs
    const results = await checkAllDirectories(input, [
      "1edtech",
      "nonexistent_directory",
    ]);

    // Should only return results for valid directories
    expect(results.every(r => r.directoryId !== "nonexistent_directory")).toBe(true);
  });

  it("should include application name in search", async () => {
    const input: DirectoryCheckInput = {
      vendorName: "Generic Company",
      websiteUrl: "https://generic.com",
      applicationName: "Duolingo", // Well-known app
    };

    const results = await checkAllDirectories(input, ["common_sense"]);
    const foundResult = results.find(r => r.found);

    // Should find based on application name
    expect(foundResult).toBeDefined();
  });
});

// =============================================================================
// DIRECTORY RESULTS TO SIGNALS TESTS
// =============================================================================

describe("directoryResultsToSignals", () => {
  it("should convert found results to passing signals", () => {
    const results = [
      {
        directoryId: "1edtech",
        directoryName: "1EdTech",
        found: true,
        certificationLevel: "Certified",
        details: "Certified in 1EdTech",
      },
    ];

    const signals = directoryResultsToSignals(results, 15);

    expect(signals.length).toBe(1);
    expect(signals[0].signalType).toBe("DIRECTORY_1EDTECH");
    expect(signals[0].passed).toBe(true);
    expect(signals[0].score).toBe(15);
  });

  it("should convert not-found results to failing signals", () => {
    const results = [
      {
        directoryId: "common_sense",
        directoryName: "Common Sense Privacy Program",
        found: false,
        details: "Not found in Common Sense",
      },
    ];

    const signals = directoryResultsToSignals(results, 15);

    expect(signals.length).toBe(1);
    expect(signals[0].signalType).toBe("DIRECTORY_COMMON_SENSE");
    expect(signals[0].passed).toBe(false);
    expect(signals[0].score).toBe(0);
  });

  it("should include directory data for found results", () => {
    const certifiedSince = new Date("2023-01-01");
    const expiresAt = new Date("2025-01-01");

    const results = [
      {
        directoryId: "sdpc",
        directoryName: "SDPC",
        found: true,
        certificationLevel: "NDPA Signatory",
        listingUrl: "https://sdpc.a4l.org/vendor/test",
        certifiedSince,
        expiresAt,
        details: "NDPA Signatory",
      },
    ];

    const signals = directoryResultsToSignals(results, 15);

    expect(signals[0].directoryData).toBeDefined();
    expect(signals[0].directoryData?.certificationLevel).toBe("NDPA Signatory");
    expect(signals[0].directoryData?.listingUrl).toBe("https://sdpc.a4l.org/vendor/test");
  });

  it("should handle unknown directory IDs", () => {
    const results = [
      {
        directoryId: "unknown_directory",
        directoryName: "Unknown Directory",
        found: true,
        details: "Found in Unknown Directory",
      },
    ];

    const signals = directoryResultsToSignals(results, 15);

    // Should default to STATE_APPROVED signal type
    expect(signals[0].signalType).toBe("DIRECTORY_STATE_APPROVED");
  });

  it("should apply weight to each directory", () => {
    const results = [
      { directoryId: "1edtech", directoryName: "1EdTech", found: true, details: "Found" },
      { directoryId: "sdpc", directoryName: "SDPC", found: true, details: "Found" },
      { directoryId: "clever", directoryName: "Clever", found: false, details: "Not found" },
    ];

    const signals = directoryResultsToSignals(results, 20);

    const passedSignals = signals.filter(s => s.passed);
    const failedSignals = signals.filter(s => !s.passed);

    expect(passedSignals.every(s => s.score === 20)).toBe(true);
    expect(failedSignals.every(s => s.score === 0)).toBe(true);
  });
});

// =============================================================================
// APPLICANT LINKEDIN VERIFICATION TESTS
// =============================================================================

describe("checkApplicantLinkedIn", () => {
  it("should fail when no LinkedIn URL provided", async () => {
    const input: ApplicantVerificationInput = {
      applicantName: "John Doe",
      applicantEmail: "john@company.com",
      companyName: "Test Company",
    };

    const result = await checkApplicantLinkedIn(input, 25);

    expect(result.signalType).toBe("APPLICANT_LINKEDIN_VERIFIED");
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.details).toContain("No applicant LinkedIn URL provided");
  });

  it("should fail for non-LinkedIn URLs", async () => {
    const input: ApplicantVerificationInput = {
      applicantName: "John Doe",
      applicantEmail: "john@company.com",
      applicantLinkedInUrl: "https://twitter.com/johndoe",
      companyName: "Test Company",
    };

    const result = await checkApplicantLinkedIn(input, 25);

    expect(result.passed).toBe(false);
    expect(result.details).toContain("Invalid LinkedIn URL");
  });

  it("should fail for invalid URL format", async () => {
    const input: ApplicantVerificationInput = {
      applicantName: "John Doe",
      applicantEmail: "john@company.com",
      applicantLinkedInUrl: "not-a-valid-url",
      companyName: "Test Company",
    };

    const result = await checkApplicantLinkedIn(input, 25);

    expect(result.passed).toBe(false);
    expect(result.details).toContain("Invalid URL format");
  });

  it("should process valid LinkedIn URLs", async () => {
    const input: ApplicantVerificationInput = {
      applicantName: "John Doe",
      applicantEmail: "john@company.com",
      applicantLinkedInUrl: "https://www.linkedin.com/in/johndoe",
      companyName: "Test Company",
    };

    const result = await checkApplicantLinkedIn(input, 25);

    // Result should be deterministic structure (verification is simulated)
    expect(result.signalType).toBe("APPLICANT_LINKEDIN_VERIFIED");
    expect(result.checkedAt).toBeDefined();
    expect([0, 25]).toContain(result.score);
  });

  it("should include applicant and company names in details", async () => {
    const input: ApplicantVerificationInput = {
      applicantName: "Jane Smith",
      applicantEmail: "jane@acme.com",
      applicantLinkedInUrl: "https://linkedin.com/in/janesmith",
      companyName: "Acme Corp",
    };

    const result = await checkApplicantLinkedIn(input, 25);

    // Details should mention both names regardless of pass/fail
    if (result.passed) {
      expect(result.details).toContain("Jane Smith");
      expect(result.details).toContain("Acme Corp");
    } else {
      expect(result.details).toContain("Jane Smith");
      expect(result.details).toContain("Acme Corp");
    }
  });
});

// =============================================================================
// APPLICANT EMAIL CORPORATE TESTS
// =============================================================================

describe("checkApplicantEmailCorporate", () => {
  it("should fail for free email providers", () => {
    const freeEmails = [
      "user@gmail.com",
      "user@yahoo.com",
      "user@hotmail.com",
      "user@outlook.com",
      "user@icloud.com",
    ];

    for (const email of freeEmails) {
      const result = checkApplicantEmailCorporate(email, "company.com", 10);

      expect(result.signalType).toBe("APPLICANT_EMAIL_CORPORATE");
      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.details).toContain("free email provider");
    }
  });

  it("should give full score when email matches company domain", () => {
    const result = checkApplicantEmailCorporate(
      "john@techcompany.com",
      "techcompany.com",
      10
    );

    expect(result.passed).toBe(true);
    expect(result.score).toBe(10);
    expect(result.details).toContain("matches company domain");
  });

  it("should give partial score for corporate email not matching domain", () => {
    const result = checkApplicantEmailCorporate(
      "john@subsidiary.com",
      "parentcompany.com",
      10
    );

    expect(result.passed).toBe(true);
    expect(result.score).toBe(5); // 50% of weight
    expect(result.details).toContain("does not match company website domain");
  });

  it("should be case-insensitive", () => {
    const result = checkApplicantEmailCorporate(
      "JOHN@COMPANY.COM",
      "Company.com",
      10
    );

    expect(result.passed).toBe(true);
    expect(result.score).toBe(10);
  });

  it("should handle missing @ symbol", () => {
    const result = checkApplicantEmailCorporate(
      "invalid-email",
      "company.com",
      10
    );

    // Should not crash, email domain will be empty
    expect(result).toBeDefined();
    expect(result.passed).toBe(true); // Not a free provider, partial credit
    expect(result.score).toBe(5);
  });
});

// =============================================================================
// SUMMARY HELPERS TESTS
// =============================================================================

describe("getDirectorySummary", () => {
  it("should summarize directory check results", () => {
    const results = [
      {
        directoryId: "1edtech",
        directoryName: "1EdTech",
        found: true,
        certificationLevel: "Certified",
      },
      {
        directoryId: "common_sense",
        directoryName: "Common Sense Privacy Program",
        found: true,
        certificationLevel: "Pass",
      },
      {
        directoryId: "sdpc",
        directoryName: "SDPC",
        found: false,
      },
    ];

    const summary = getDirectorySummary(results);

    expect(summary.totalChecked).toBe(3);
    expect(summary.totalFound).toBe(2);
    expect(summary.directories).toContain("1EdTech");
    expect(summary.directories).toContain("Common Sense Privacy Program");
    expect(summary.certifications.length).toBe(2);
  });

  it("should handle empty results", () => {
    const summary = getDirectorySummary([]);

    expect(summary.totalChecked).toBe(0);
    expect(summary.totalFound).toBe(0);
    expect(summary.directories).toEqual([]);
    expect(summary.certifications).toEqual([]);
  });

  it("should handle results without certification levels", () => {
    const results = [
      {
        directoryId: "1edtech",
        directoryName: "1EdTech",
        found: true,
        // No certificationLevel
      },
    ];

    const summary = getDirectorySummary(results);

    expect(summary.totalFound).toBe(1);
    expect(summary.certifications).toEqual([]); // No certification to list
  });
});

describe("getDirectoryById", () => {
  it("should return directory configuration by ID", () => {
    const directory = getDirectoryById("1edtech");

    expect(directory).toBeDefined();
    expect(directory?.id).toBe("1edtech");
    expect(directory?.name).toBe("1EdTech (IMS Global)");
  });

  it("should return undefined for unknown ID", () => {
    const directory = getDirectoryById("unknown_id");

    expect(directory).toBeUndefined();
  });
});

describe("getPIIRequiredDirectories", () => {
  it("should return only directories required for PII access", () => {
    const piiDirectories = getPIIRequiredDirectories();

    // All returned directories should have requiredForPII=true
    expect(piiDirectories.every(d => d.requiredForPII)).toBe(true);
  });

  it("should only include enabled directories", () => {
    const piiDirectories = getPIIRequiredDirectories();

    expect(piiDirectories.every(d => d.enabled)).toBe(true);
  });

  it("should include Common Sense (requiredForPII=true)", () => {
    const piiDirectories = getPIIRequiredDirectories();

    const commonSense = piiDirectories.find(d => d.id === "common_sense");
    expect(commonSense).toBeDefined();
  });
});

// =============================================================================
// EDTECH DIRECTORIES CONSTANT TESTS
// =============================================================================

describe("EDTECH_DIRECTORIES", () => {
  it("should contain expected directories", () => {
    const ids = EDTECH_DIRECTORIES.map(d => d.id);

    expect(ids).toContain("1edtech");
    expect(ids).toContain("common_sense");
    expect(ids).toContain("sdpc");
    expect(ids).toContain("ikeepsafe");
    expect(ids).toContain("privacy_pledge");
    expect(ids).toContain("clever");
    expect(ids).toContain("classlink");
  });

  it("should have valid weights for all directories", () => {
    for (const directory of EDTECH_DIRECTORIES) {
      expect(directory.weight).toBeGreaterThanOrEqual(0);
      expect(directory.weight).toBeLessThanOrEqual(100);
    }
  });

  it("should have names and descriptions for all directories", () => {
    for (const directory of EDTECH_DIRECTORIES) {
      expect(directory.name).toBeDefined();
      expect(directory.name.length).toBeGreaterThan(0);
      expect(directory.description).toBeDefined();
      expect(directory.description.length).toBeGreaterThan(0);
    }
  });
});
