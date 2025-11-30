/**
 * @vitest-environment jsdom
 */

/**
 * CommTestForm Unit Tests
 *
 * Tests for MVP-06 CPaaS Demo Polish features:
 * - Cost preview section
 * - Delivery status simulation
 * - Privacy explainer panel
 * - Scale calculator
 *
 * Following DEVELOPMENT_PATTERNS.md patterns
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  CPAAS_CHANNELS,
  ALL_CHANNEL_IDS,
  DELIVERY_STATUSES,
  DELIVERY_STATUS_ORDER,
  DELIVERY_SIMULATION,
  LAUSD_SCALE,
  PRIVACY_BADGES,
  ALL_PRIVACY_BADGE_KEYS,
  calculateMessageCost,
  calculateSmsSegments,
  formatCurrency,
  generateMessageId,
  getMonthlyProjection,
} from "@/lib/config/cpaas";

// =============================================================================
// STATIC ANALYSIS TESTS - Verify CommTestForm uses centralized config
// =============================================================================

describe("CommTestForm Static Analysis", () => {
  function readSourceFile(relativePath: string): string {
    return fs.readFileSync(
      path.resolve(__dirname, relativePath),
      "utf-8"
    );
  }

  describe("CommTestForm.tsx implementation", () => {
    const formPath = "../../components/forms/CommTestForm.tsx";
    let code: string;

    beforeEach(() => {
      code = readSourceFile(formPath);
    });

    it("should define CommChannel type for EMAIL and SMS", () => {
      expect(code).toContain('CommChannel');
      expect(code).toMatch(/["']EMAIL["']/);
      expect(code).toMatch(/["']SMS["']/);
    });

    it("should have channel toggle with EMAIL and SMS options", () => {
      expect(code).toContain("handleChannelChange");
      expect(code).toContain("setChannel");
    });

    it("should have recipient selection dropdown", () => {
      expect(code).toContain("recipientToken");
      expect(code).toContain("setRecipientToken");
    });

    it("should have message body textarea", () => {
      expect(code).toContain("textarea");
      expect(code).toContain("body");
    });

    it("should have SMS segment counter", () => {
      expect(code).toContain("smsSegments");
      expect(code).toMatch(/160|SMS_SEGMENT_LENGTH/);
    });

    it("should have submit button with loading state", () => {
      expect(code).toContain("isSubmitting");
      expect(code).toContain("Sending");
    });

    it("should handle form submission", () => {
      expect(code).toContain("handleSubmit");
      expect(code).toContain("onSubmit");
    });

    it("should validate with Zod schemas", () => {
      expect(code).toContain("safeParse");
      expect(code).toMatch(/EmailSchema|SmsSchema/);
    });

    it("should have error display", () => {
      expect(code).toContain("errors");
      expect(code).toContain("submitError");
    });
  });
});

// =============================================================================
// MVP-06 FEATURE TESTS - Cost Preview
// =============================================================================

describe("MVP-06 Feature: Cost Preview", () => {
  describe("Email pricing calculations", () => {
    it("should calculate email cost at Starter tier", () => {
      const result = calculateMessageCost("EMAIL", 1, 0);
      expect(result.unitPrice).toBe(0.003);
      expect(result.tierName).toBe("Starter");
    });

    it("should calculate email cost at Growth tier", () => {
      const result = calculateMessageCost("EMAIL", 1, 50000);
      expect(result.unitPrice).toBe(0.002);
      expect(result.tierName).toBe("Growth");
    });

    it("should calculate email cost at Scale tier", () => {
      const result = calculateMessageCost("EMAIL", 1, 500000);
      expect(result.unitPrice).toBe(0.0015);
      expect(result.tierName).toBe("Scale");
    });

    it("should calculate email cost at Enterprise tier", () => {
      const result = calculateMessageCost("EMAIL", 1, 2000000);
      expect(result.unitPrice).toBe(0.001);
      expect(result.tierName).toBe("Enterprise");
    });
  });

  describe("SMS pricing calculations", () => {
    it("should calculate SMS cost at Starter tier", () => {
      const result = calculateMessageCost("SMS", 1, 0);
      expect(result.unitPrice).toBe(0.015);
      expect(result.tierName).toBe("Starter");
    });

    it("should calculate SMS cost at Growth tier", () => {
      const result = calculateMessageCost("SMS", 1, 25000);
      expect(result.unitPrice).toBe(0.012);
      expect(result.tierName).toBe("Growth");
    });

    it("should calculate multi-recipient SMS cost", () => {
      const result = calculateMessageCost("SMS", 100, 0);
      expect(result.totalCost).toBe(1.5); // 100 * $0.015
    });
  });

  describe("Cost formatting", () => {
    it("should format small amounts with 4 decimal places", () => {
      expect(formatCurrency(0.002)).toBe("$0.0020");
      expect(formatCurrency(0.0015)).toBe("$0.0015");
    });

    it("should format regular amounts with 2 decimal places", () => {
      expect(formatCurrency(1.5)).toBe("$1.50");
      expect(formatCurrency(100)).toBe("$100.00");
    });

    it("should format large amounts with comma separators", () => {
      expect(formatCurrency(1340)).toBe("$1,340.00");
      expect(formatCurrency(10050)).toBe("$10,050.00");
    });
  });

  describe("Monthly projections", () => {
    it("should project monthly cost from daily", () => {
      const result = getMonthlyProjection("EMAIL", 10);
      expect(result.monthlyCost).toBe(300);
    });

    it("should project yearly cost", () => {
      const result = getMonthlyProjection("SMS", 5);
      expect(result.yearlyProjection).toBe(1825);
    });
  });
});

// =============================================================================
// MVP-06 FEATURE TESTS - Delivery Status Simulation
// =============================================================================

describe("MVP-06 Feature: Delivery Status Simulation", () => {
  describe("Delivery status order", () => {
    it("should have correct happy path order", () => {
      expect(DELIVERY_STATUS_ORDER).toEqual([
        "QUEUED",
        "SENT",
        "DELIVERED",
        "OPENED",
      ]);
    });

    it("should have QUEUED before SENT", () => {
      expect(DELIVERY_STATUSES.QUEUED.order).toBeLessThan(
        DELIVERY_STATUSES.SENT.order
      );
    });

    it("should have SENT before DELIVERED", () => {
      expect(DELIVERY_STATUSES.SENT.order).toBeLessThan(
        DELIVERY_STATUSES.DELIVERED.order
      );
    });

    it("should have DELIVERED before OPENED", () => {
      expect(DELIVERY_STATUSES.DELIVERED.order).toBeLessThan(
        DELIVERY_STATUSES.OPENED.order
      );
    });
  });

  describe("Delivery simulation timing", () => {
    it("should have queued delay < sent delay", () => {
      expect(DELIVERY_SIMULATION.queuedDelay).toBeLessThan(
        DELIVERY_SIMULATION.sentDelay
      );
    });

    it("should have sent delay < delivered delay", () => {
      expect(DELIVERY_SIMULATION.sentDelay).toBeLessThan(
        DELIVERY_SIMULATION.deliveredDelay
      );
    });

    it("should complete within total duration", () => {
      expect(DELIVERY_SIMULATION.deliveredDelay).toBeLessThanOrEqual(
        DELIVERY_SIMULATION.totalDuration
      );
    });

    it("should have realistic timing for demo (2-3 seconds)", () => {
      expect(DELIVERY_SIMULATION.totalDuration).toBeGreaterThanOrEqual(2000);
      expect(DELIVERY_SIMULATION.totalDuration).toBeLessThanOrEqual(5000);
    });
  });

  describe("Status properties", () => {
    it("QUEUED should not be final", () => {
      expect(DELIVERY_STATUSES.QUEUED.isFinal).toBe(false);
    });

    it("SENT should not be final", () => {
      expect(DELIVERY_STATUSES.SENT.isFinal).toBe(false);
    });

    it("DELIVERED should be final and not error", () => {
      expect(DELIVERY_STATUSES.DELIVERED.isFinal).toBe(true);
      expect(DELIVERY_STATUSES.DELIVERED.isError).toBe(false);
    });

    it("FAILED should be final and error", () => {
      expect(DELIVERY_STATUSES.FAILED.isFinal).toBe(true);
      expect(DELIVERY_STATUSES.FAILED.isError).toBe(true);
    });
  });

  describe("Message ID generation", () => {
    it("should generate unique message IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 50; i++) {
        ids.add(generateMessageId());
      }
      expect(ids.size).toBe(50);
    });

    it("should generate IDs with msg_ prefix", () => {
      const id = generateMessageId();
      expect(id).toMatch(/^msg_[a-z0-9]{12}$/);
    });
  });
});

// =============================================================================
// MVP-06 FEATURE TESTS - Privacy Explainer
// =============================================================================

describe("MVP-06 Feature: Privacy Explainer", () => {
  describe("Privacy badges", () => {
    it("should have NO_PII badge", () => {
      expect(PRIVACY_BADGES.NO_PII).toBeDefined();
      expect(PRIVACY_BADGES.NO_PII.label).toContain("PII");
    });

    it("should have SECURE_RELAY badge", () => {
      expect(PRIVACY_BADGES.SECURE_RELAY).toBeDefined();
      expect(PRIVACY_BADGES.SECURE_RELAY.description).toContain("relay");
    });

    it("should have AUDIT_TRAIL badge", () => {
      expect(PRIVACY_BADGES.AUDIT_TRAIL).toBeDefined();
      expect(PRIVACY_BADGES.AUDIT_TRAIL.description).toContain("audit");
    });

    it("should have FERPA_COPPA compliance badge", () => {
      expect(PRIVACY_BADGES.FERPA_COPPA).toBeDefined();
      expect(PRIVACY_BADGES.FERPA_COPPA.label).toContain("FERPA");
      expect(PRIVACY_BADGES.FERPA_COPPA.label).toContain("COPPA");
    });

    it("every badge should have an icon", () => {
      ALL_PRIVACY_BADGE_KEYS.forEach((key) => {
        expect(PRIVACY_BADGES[key].icon).toBeDefined();
        expect(PRIVACY_BADGES[key].icon.length).toBeGreaterThan(0);
      });
    });

    it("every badge should have a description", () => {
      ALL_PRIVACY_BADGE_KEYS.forEach((key) => {
        expect(PRIVACY_BADGES[key].description).toBeDefined();
        expect(PRIVACY_BADGES[key].description.length).toBeGreaterThan(10);
      });
    });
  });
});

// =============================================================================
// MVP-06 FEATURE TESTS - Scale Calculator
// =============================================================================

describe("MVP-06 Feature: Scale Calculator", () => {
  describe("LAUSD scale constants", () => {
    it("should have 670K families", () => {
      expect(LAUSD_SCALE.totalFamilies).toBe(670000);
    });

    it("should have district name", () => {
      expect(LAUSD_SCALE.districtName).toBe("LAUSD");
    });

    it("should have 35K teachers", () => {
      expect(LAUSD_SCALE.totalTeachers).toBe(35000);
    });

    it("should have 1000 schools", () => {
      expect(LAUSD_SCALE.totalSchools).toBe(1000);
    });
  });

  describe("Scale message generation", () => {
    it("should generate scale message for EMAIL", () => {
      const result = LAUSD_SCALE.scaleMessage(0.002, "EMAIL");
      expect(result.familyCount).toBe("670,000");
      expect(result.totalCost).toBe("$1,340.00");
      expect(result.channel).toBe("EMAIL");
    });

    it("should generate scale message for SMS", () => {
      const result = LAUSD_SCALE.scaleMessage(0.015, "SMS");
      expect(result.familyCount).toBe("670,000");
      expect(result.totalCost).toBe("$10,050.00");
      expect(result.channel).toBe("SMS");
    });

    it("should include compelling comparison message", () => {
      const result = LAUSD_SCALE.scaleMessage(0.002, "EMAIL");
      expect(result.comparisonMessage).toContain("every LAUSD family");
      expect(result.comparisonMessage).toContain("email");
    });
  });

  describe("Scale cost calculations", () => {
    it("should calculate LAUSD email blast cost correctly", () => {
      const { totalCost } = calculateMessageCost("EMAIL", LAUSD_SCALE.totalFamilies, 0);
      // 670,000 * $0.003 (Starter tier) = $2,010
      expect(totalCost).toBe(2010);
    });

    it("should calculate LAUSD SMS blast cost correctly", () => {
      const { totalCost } = calculateMessageCost("SMS", LAUSD_SCALE.totalFamilies, 0);
      // 670,000 * $0.015 (Starter tier) = $10,050
      expect(totalCost).toBe(10050);
    });

    it("should calculate better rate at scale volumes", () => {
      const starterCost = calculateMessageCost("EMAIL", LAUSD_SCALE.totalFamilies, 0);
      const scaleCost = calculateMessageCost("EMAIL", LAUSD_SCALE.totalFamilies, 500000);
      expect(scaleCost.unitPrice).toBeLessThan(starterCost.unitPrice);
    });
  });
});

// =============================================================================
// SMS SEGMENT TESTS
// =============================================================================

describe("SMS Segment Calculations", () => {
  describe("Character counting", () => {
    it("should count 0 segments for empty message", () => {
      expect(calculateSmsSegments("").segments).toBe(0);
    });

    it("should count 1 segment for up to 160 chars", () => {
      expect(calculateSmsSegments("Hello").segments).toBe(1);
      expect(calculateSmsSegments("a".repeat(160)).segments).toBe(1);
    });

    it("should count 2 segments for 161-320 chars", () => {
      expect(calculateSmsSegments("a".repeat(161)).segments).toBe(2);
      expect(calculateSmsSegments("a".repeat(320)).segments).toBe(2);
    });

    it("should count 3 segments for 321-480 chars", () => {
      expect(calculateSmsSegments("a".repeat(321)).segments).toBe(3);
      expect(calculateSmsSegments("a".repeat(480)).segments).toBe(3);
    });
  });

  describe("Over-limit detection", () => {
    it("should not flag 480 chars as over limit", () => {
      expect(calculateSmsSegments("a".repeat(480)).isOverLimit).toBe(false);
    });

    it("should flag 481+ chars as over limit", () => {
      expect(calculateSmsSegments("a".repeat(481)).isOverLimit).toBe(true);
    });

    it("should flag very long messages as over limit", () => {
      expect(calculateSmsSegments("a".repeat(1000)).isOverLimit).toBe(true);
    });
  });

  describe("Chars remaining calculation", () => {
    it("should calculate remaining chars in segment", () => {
      const result = calculateSmsSegments("Hello"); // 5 chars
      expect(result.charsRemaining).toBe(155); // 160 - 5
    });

    it("should show 0 remaining when segment is full", () => {
      const result = calculateSmsSegments("a".repeat(160));
      expect(result.charsRemaining).toBe(0);
    });

    it("should calculate remaining in second segment", () => {
      const result = calculateSmsSegments("a".repeat(200)); // 200 chars in 2 segments
      // 2 segments = 320 chars max, 200 used = 120 remaining
      expect(result.charsRemaining).toBe(120);
    });
  });
});

// =============================================================================
// CHANNEL CONFIGURATION TESTS
// =============================================================================

describe("Channel Configuration", () => {
  describe("EMAIL channel", () => {
    it("should have no max length", () => {
      expect(CPAAS_CHANNELS.EMAIL.maxLength).toBeNull();
    });

    it("should have correct label", () => {
      expect(CPAAS_CHANNELS.EMAIL.label).toBe("Email");
    });

    it("should have Mail icon", () => {
      expect(CPAAS_CHANNELS.EMAIL.icon).toBe("Mail");
    });
  });

  describe("SMS channel", () => {
    it("should have 480 char max (3 segments)", () => {
      expect(CPAAS_CHANNELS.SMS.maxLength).toBe(480);
    });

    it("should have 160 char segment length", () => {
      expect(CPAAS_CHANNELS.SMS.segmentLength).toBe(160);
    });

    it("should have MessageSquare icon", () => {
      expect(CPAAS_CHANNELS.SMS.icon).toBe("MessageSquare");
    });
  });

  describe("All channels", () => {
    it("should support exactly 2 channels", () => {
      expect(ALL_CHANNEL_IDS).toHaveLength(2);
    });

    it("should include EMAIL and SMS", () => {
      expect(ALL_CHANNEL_IDS).toContain("EMAIL");
      expect(ALL_CHANNEL_IDS).toContain("SMS");
    });
  });
});

// =============================================================================
// INTEGRATION TESTS - Handler integration
// =============================================================================

describe("Integration: Handler uses CPaaS config", () => {
  function readSourceFile(relativePath: string): string {
    return fs.readFileSync(
      path.resolve(__dirname, relativePath),
      "utf-8"
    );
  }

  it("handlers.ts should handle send_test_message tool", () => {
    const code = readSourceFile("../../lib/ai/handlers.ts");
    expect(code).toContain("send_test_message");
  });

  it("tools.ts should define send_test_message tool", () => {
    const code = readSourceFile("../../lib/ai/tools.ts");
    expect(code).toContain("send_test_message");
  });
});

// =============================================================================
// DESIGN DECISION TESTS
// =============================================================================

describe("Design Decisions", () => {
  it("should use 3-segment limit for SMS to prevent cost surprise", () => {
    // Design: Cap at 3 segments (480 chars)
    // Rationale: Multi-segment SMS costs multiply; prevent accidental $$$
    expect(CPAAS_CHANNELS.SMS.maxLength).toBe(480);
    expect(CPAAS_CHANNELS.SMS.maxLength).toBe(
      CPAAS_CHANNELS.SMS.segmentLength! * 3
    );
  });

  it("should simulate realistic delivery timing (2-3 seconds)", () => {
    // Design: Demo shows QUEUED → SENT → DELIVERED in ~3 seconds
    // Rationale: Long enough to see, short enough to not bore
    expect(DELIVERY_SIMULATION.totalDuration).toBeGreaterThanOrEqual(2000);
    expect(DELIVERY_SIMULATION.totalDuration).toBeLessThanOrEqual(4000);
  });

  it("should include OPENED in delivery timeline for engagement tracking", () => {
    // Design: Show OPENED as final status
    // Rationale: Demonstrates vendor can track engagement
    expect(DELIVERY_STATUS_ORDER).toContain("OPENED");
  });

  it("should use LAUSD actual family count for credibility", () => {
    // Design: Use real 670K number
    // Rationale: Demo with real numbers is more compelling
    expect(LAUSD_SCALE.totalFamilies).toBe(670000);
  });

  it("should format small prices with 4 decimals for accuracy", () => {
    // Design: $0.0020 not $0.00 for unit prices
    // Rationale: Shows actual per-message cost clearly
    expect(formatCurrency(0.002)).toBe("$0.0020");
  });
});
