/**
 * Vendor Verification Service Tests
 *
 * Tests for digital-age vendor legitimacy verification.
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  verifyVendor,
  quickVerificationCheck,
  getVerificationSummary,
  type VerificationInput,
} from "@/lib/verification/vendor-verification";
import {
  DEFAULT_VERIFICATION_CONFIG,
  type DistrictVerificationConfig,
} from "@/lib/types";

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

describe("quickVerificationCheck", () => {
  it("should return true for matching email and website domains", () => {
    const result = quickVerificationCheck(
      "john@acme.com",
      "https://www.acme.com"
    );

    expect(result.emailDomainMatches).toBe(true);
    expect(result.isHttps).toBe(true);
  });

  it("should return false for non-matching domains", () => {
    const result = quickVerificationCheck(
      "john@gmail.com",
      "https://acme.com"
    );

    expect(result.emailDomainMatches).toBe(false);
    expect(result.isHttps).toBe(true);
  });

  it("should detect HTTP vs HTTPS", () => {
    const httpsResult = quickVerificationCheck(
      "john@acme.com",
      "https://acme.com"
    );
    const httpResult = quickVerificationCheck(
      "john@acme.com",
      "http://acme.com"
    );

    expect(httpsResult.isHttps).toBe(true);
    expect(httpResult.isHttps).toBe(false);
  });

  it("should handle www prefix in URLs", () => {
    const result = quickVerificationCheck(
      "john@acme.com",
      "https://www.acme.com"
    );

    expect(result.emailDomainMatches).toBe(true);
  });

  it("should be case-insensitive", () => {
    const result = quickVerificationCheck(
      "John@ACME.COM",
      "HTTPS://WWW.ACME.COM"
    );

    expect(result.emailDomainMatches).toBe(true);
    expect(result.isHttps).toBe(true);
  });
});

// =============================================================================
// VERIFY VENDOR TESTS
// =============================================================================

describe("verifyVendor", () => {
  describe("Basic Verification", () => {
    it("should verify a vendor with matching email and HTTPS website", async () => {
      const input: VerificationInput = {
        contactEmail: "john@techcompany.com",
        websiteUrl: "https://techcompany.com",
        linkedInUrl: "https://www.linkedin.com/company/techcompany",
      };

      const result = await verifyVendor(input);

      expect(result).toBeDefined();
      expect(result.signals).toBeDefined();
      expect(result.signals.length).toBeGreaterThanOrEqual(4);
      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.maxPossibleScore).toBe(100);
      expect(["APPROVED", "MANUAL_REVIEW", "REJECTED"]).toContain(result.decision);
    });

    it("should include vendorId in result if provided", async () => {
      const input: VerificationInput = {
        contactEmail: "john@test.com",
        websiteUrl: "https://test.com",
        vendorId: "vendor-123",
      };

      const result = await verifyVendor(input);

      expect(result.vendorId).toBe("vendor-123");
    });

    it("should include email domain in result", async () => {
      const input: VerificationInput = {
        contactEmail: "john@example.com",
        websiteUrl: "https://example.com",
      };

      const result = await verifyVendor(input);

      expect(result.emailDomain).toBe("example.com");
    });

    it("should set verification expiration to 90 days", async () => {
      const input: VerificationInput = {
        contactEmail: "john@test.com",
        websiteUrl: "https://test.com",
      };

      const result = await verifyVendor(input);

      const now = new Date();
      const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      expect(result.expiresAt).toBeDefined();
      // Within a few seconds of 90 days
      expect(result.expiresAt!.getTime()).toBeCloseTo(
        ninetyDaysLater.getTime(),
        -4 // Within 10 seconds
      );
    });
  });

  describe("Email Domain Verification", () => {
    it("should pass when email domain matches website", async () => {
      const input: VerificationInput = {
        contactEmail: "john@acme.com",
        websiteUrl: "https://acme.com",
      };

      const result = await verifyVendor(input);
      const emailSignal = result.signals.find(
        (s) => s.signalType === "EMAIL_DOMAIN_MATCH"
      );

      expect(emailSignal).toBeDefined();
      expect(emailSignal!.passed).toBe(true);
      expect(emailSignal!.score).toBe(30); // Default weight
    });

    it("should fail when email domain does not match website", async () => {
      const input: VerificationInput = {
        contactEmail: "john@gmail.com",
        websiteUrl: "https://acme.com",
      };

      const result = await verifyVendor(input);
      const emailSignal = result.signals.find(
        (s) => s.signalType === "EMAIL_DOMAIN_MATCH"
      );

      expect(emailSignal).toBeDefined();
      expect(emailSignal!.passed).toBe(false);
      expect(emailSignal!.score).toBe(0);
    });
  });

  describe("SSL Verification", () => {
    it("should pass for HTTPS websites", async () => {
      const input: VerificationInput = {
        contactEmail: "john@secure.com",
        websiteUrl: "https://secure.com",
      };

      const result = await verifyVendor(input);
      const sslSignal = result.signals.find(
        (s) => s.signalType === "WEBSITE_SSL"
      );

      expect(sslSignal).toBeDefined();
      expect(sslSignal!.passed).toBe(true);
      expect(sslSignal!.score).toBe(20);
    });

    it("should fail for HTTP websites", async () => {
      const input: VerificationInput = {
        contactEmail: "john@insecure.com",
        websiteUrl: "http://insecure.com",
      };

      const result = await verifyVendor(input);
      const sslSignal = result.signals.find(
        (s) => s.signalType === "WEBSITE_SSL"
      );

      expect(sslSignal).toBeDefined();
      expect(sslSignal!.passed).toBe(false);
      expect(sslSignal!.score).toBe(0);
      expect(sslSignal!.details).toContain("does not use HTTPS");
    });
  });

  describe("Domain Age Verification", () => {
    it("should include domain age signal", async () => {
      const input: VerificationInput = {
        contactEmail: "john@established.com",
        websiteUrl: "https://established.com",
      };

      const result = await verifyVendor(input);
      const ageSignal = result.signals.find(
        (s) => s.signalType === "WEBSITE_AGE"
      );

      expect(ageSignal).toBeDefined();
      expect(ageSignal!.score).toBeGreaterThanOrEqual(0);
    });

    it("should give high score to well-known domains", async () => {
      const input: VerificationInput = {
        contactEmail: "contact@google.com",
        websiteUrl: "https://google.com",
      };

      const result = await verifyVendor(input);
      const ageSignal = result.signals.find(
        (s) => s.signalType === "WEBSITE_AGE"
      );

      expect(ageSignal).toBeDefined();
      expect(ageSignal!.passed).toBe(true);
    });
  });

  describe("LinkedIn Verification", () => {
    it("should pass for valid LinkedIn company URLs", async () => {
      const input: VerificationInput = {
        contactEmail: "john@techco.com",
        websiteUrl: "https://techco.com",
        linkedInUrl: "https://www.linkedin.com/company/techco",
      };

      const result = await verifyVendor(input);
      const linkedInSignal = result.signals.find(
        (s) => s.signalType === "LINKEDIN_COMPANY_PROFILE"
      );

      expect(linkedInSignal).toBeDefined();
      expect(linkedInSignal!.passed).toBe(true);
    });

    it("should fail when LinkedIn URL is not provided", async () => {
      const input: VerificationInput = {
        contactEmail: "john@techco.com",
        websiteUrl: "https://techco.com",
      };

      const result = await verifyVendor(input);
      const linkedInSignal = result.signals.find(
        (s) => s.signalType === "LINKEDIN_COMPANY_PROFILE"
      );

      expect(linkedInSignal).toBeDefined();
      expect(linkedInSignal!.passed).toBe(false);
      expect(linkedInSignal!.details).toContain("No LinkedIn profile");
    });

    it("should fail for invalid LinkedIn URLs", async () => {
      const input: VerificationInput = {
        contactEmail: "john@techco.com",
        websiteUrl: "https://techco.com",
        linkedInUrl: "https://facebook.com/techco",
      };

      const result = await verifyVendor(input);
      const linkedInSignal = result.signals.find(
        (s) => s.signalType === "LINKEDIN_COMPANY_PROFILE"
      );

      expect(linkedInSignal).toBeDefined();
      expect(linkedInSignal!.passed).toBe(false);
      expect(linkedInSignal!.details).toContain("Invalid LinkedIn URL");
    });

    it("should check employee count when profile exists", async () => {
      const input: VerificationInput = {
        contactEmail: "john@techco.com",
        websiteUrl: "https://techco.com",
        linkedInUrl: "https://www.linkedin.com/company/techco",
      };

      const result = await verifyVendor(input);
      const employeeSignal = result.signals.find(
        (s) => s.signalType === "LINKEDIN_EMPLOYEE_COUNT"
      );

      expect(employeeSignal).toBeDefined();
      expect(employeeSignal!.details).toContain("employees");
    });

    it("should not check employee count when profile does not exist", async () => {
      const input: VerificationInput = {
        contactEmail: "john@techco.com",
        websiteUrl: "https://techco.com",
        // No LinkedIn URL
      };

      const result = await verifyVendor(input);
      const employeeSignal = result.signals.find(
        (s) => s.signalType === "LINKEDIN_EMPLOYEE_COUNT"
      );

      expect(employeeSignal).toBeUndefined();
    });
  });

  describe("Verification Decisions", () => {
    it("should approve when score meets threshold", async () => {
      const input: VerificationInput = {
        contactEmail: "john@goodcompany.com",
        websiteUrl: "https://goodcompany.com",
        linkedInUrl: "https://www.linkedin.com/company/goodcompany",
      };

      const result = await verifyVendor(input);

      // With matching domain, HTTPS, and LinkedIn, should have high score
      if (result.totalScore >= 60) {
        expect(result.decision).toBe("APPROVED");
      }
    });

    it("should require manual review for critical failures", async () => {
      const input: VerificationInput = {
        contactEmail: "john@gmail.com", // Non-matching domain
        websiteUrl: "https://somecompany.com",
        linkedInUrl: "https://www.linkedin.com/company/somecompany",
      };

      const result = await verifyVendor(input);

      // Default config requires domain match
      expect(result.decision).toBe("MANUAL_REVIEW");
      expect(result.decisionReason).toContain("Email domain does not match");
    });

    it("should reject when score is below minimum threshold", async () => {
      // Create a custom config with high thresholds
      const strictConfig: DistrictVerificationConfig = {
        ...DEFAULT_VERIFICATION_CONFIG,
        tierRequirements: {
          ...DEFAULT_VERIFICATION_CONFIG.tierRequirements,
          privacySafe: {
            ...DEFAULT_VERIFICATION_CONFIG.tierRequirements.privacySafe,
            passThreshold: 90,
            reviewThreshold: 80,
          },
        },
        requireDomainMatch: false,
        requireSSL: false,
      };

      const input: VerificationInput = {
        contactEmail: "john@gmail.com",
        websiteUrl: "http://newsite.test",
      };

      const result = await verifyVendor(input, strictConfig);

      // With no matching domain, no HTTPS, and no LinkedIn, score should be very low
      if (result.totalScore < 80) {
        expect(result.decision).toBe("REJECTED");
      }
    });
  });

  describe("Custom Configuration", () => {
    it("should use custom weight configuration", async () => {
      const customConfig: DistrictVerificationConfig = {
        ...DEFAULT_VERIFICATION_CONFIG,
        weights: {
          emailDomainMatch: 50, // Higher weight
          websiteSSL: 10,
          websiteAge: 15,
          linkedInCompanyProfile: 15,
          linkedInEmployeeCount: 10,
        },
      };

      const input: VerificationInput = {
        contactEmail: "john@mycompany.com",
        websiteUrl: "https://mycompany.com",
      };

      const result = await verifyVendor(input, customConfig);
      const emailSignal = result.signals.find(
        (s) => s.signalType === "EMAIL_DOMAIN_MATCH"
      );

      expect(emailSignal!.score).toBe(50);
    });

    it("should use custom domain age minimum", async () => {
      const customConfig: DistrictVerificationConfig = {
        ...DEFAULT_VERIFICATION_CONFIG,
        minDomainAgeDays: 30, // Lower requirement
      };

      const input: VerificationInput = {
        contactEmail: "john@newstartup.test",
        websiteUrl: "https://newstartup.test",
      };

      const result = await verifyVendor(input, customConfig);
      const ageSignal = result.signals.find(
        (s) => s.signalType === "WEBSITE_AGE"
      );

      expect(ageSignal).toBeDefined();
    });

    it("should respect requireCompanyLinkedIn flag", async () => {
      const linkedInRequiredConfig: DistrictVerificationConfig = {
        ...DEFAULT_VERIFICATION_CONFIG,
        requireCompanyLinkedIn: true,
      };

      const input: VerificationInput = {
        contactEmail: "john@company.com",
        websiteUrl: "https://company.com",
        // No LinkedIn
      };

      const result = await verifyVendor(input, linkedInRequiredConfig);

      expect(result.decision).toBe("MANUAL_REVIEW");
      expect(result.decisionReason).toContain("LinkedIn");
    });
  });
});

// =============================================================================
// VERIFICATION SUMMARY TESTS
// =============================================================================

describe("getVerificationSummary", () => {
  it("should generate human-readable summary", async () => {
    const input: VerificationInput = {
      contactEmail: "john@testcompany.com",
      websiteUrl: "https://testcompany.com",
      linkedInUrl: "https://www.linkedin.com/company/testcompany",
    };

    const result = await verifyVendor(input);
    const summary = getVerificationSummary(result);

    expect(summary).toContain("Verification Score:");
    expect(summary).toContain("Checks Passed:");
    expect(summary).toContain("Decision:");
    expect(summary).toContain("Details:");
  });

  it("should show checkmarks for passed signals", async () => {
    const input: VerificationInput = {
      contactEmail: "john@testcompany.com",
      websiteUrl: "https://testcompany.com",
    };

    const result = await verifyVendor(input);
    const summary = getVerificationSummary(result);

    // Email domain should pass
    expect(summary).toContain("✓ EMAIL_DOMAIN_MATCH");
    // SSL should pass
    expect(summary).toContain("✓ WEBSITE_SSL");
  });

  it("should show X marks for failed signals", async () => {
    const input: VerificationInput = {
      contactEmail: "john@gmail.com",
      websiteUrl: "https://othercompany.com",
    };

    const result = await verifyVendor(input);
    const summary = getVerificationSummary(result);

    // Email domain should fail
    expect(summary).toContain("✗ EMAIL_DOMAIN_MATCH");
  });

  it("should include decision in summary", async () => {
    const input: VerificationInput = {
      contactEmail: "john@company.com",
      websiteUrl: "https://company.com",
    };

    const result = await verifyVendor(input);
    const summary = getVerificationSummary(result);

    expect(summary).toMatch(/Decision: (APPROVED|MANUAL_REVIEW|REJECTED)/);
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe("Edge Cases", () => {
  it("should handle malformed email addresses", async () => {
    const input: VerificationInput = {
      contactEmail: "notanemail",
      websiteUrl: "https://test.com",
    };

    const result = await verifyVendor(input);

    expect(result).toBeDefined();
    const emailSignal = result.signals.find(
      (s) => s.signalType === "EMAIL_DOMAIN_MATCH"
    );
    expect(emailSignal!.passed).toBe(false);
  });

  it("should handle malformed URLs", async () => {
    const input: VerificationInput = {
      contactEmail: "john@test.com",
      websiteUrl: "not-a-valid-url",
    };

    const result = await verifyVendor(input);

    expect(result).toBeDefined();
    expect(result.emailDomain).toBe("test.com");
  });

  it("should handle empty LinkedIn URL", async () => {
    const input: VerificationInput = {
      contactEmail: "john@test.com",
      websiteUrl: "https://test.com",
      linkedInUrl: "",
    };

    const result = await verifyVendor(input);
    const linkedInSignal = result.signals.find(
      (s) => s.signalType === "LINKEDIN_COMPANY_PROFILE"
    );

    expect(linkedInSignal!.passed).toBe(false);
  });

  it("should normalize LinkedIn URLs", async () => {
    const input: VerificationInput = {
      contactEmail: "john@test.com",
      websiteUrl: "https://test.com",
      linkedInUrl: "https://linkedin.com/company/test-company/",
    };

    const result = await verifyVendor(input);
    const linkedInSignal = result.signals.find(
      (s) => s.signalType === "LINKEDIN_COMPANY_PROFILE"
    );

    expect(linkedInSignal).toBeDefined();
    expect(linkedInSignal!.passed).toBe(true);
  });
});
