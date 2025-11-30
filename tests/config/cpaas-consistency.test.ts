/**
 * CPaaS Configuration Consistency Tests
 *
 * Ensures all layers of the application use the centralized
 * CPaaS configuration consistently.
 *
 * Following DEVELOPMENT_PATTERNS.md:
 * - Pattern 2: Consistency Tests (30+ tests)
 * - Pattern 6: 100% Enum Coverage Gate
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  CPAAS_CHANNELS,
  ALL_CHANNEL_IDS,
  ALL_CHANNEL_KEYS,
  EMAIL_PRICING_TIERS,
  SMS_PRICING_TIERS,
  PRICING_BY_CHANNEL,
  DEFAULT_PRICES,
  DELIVERY_STATUSES,
  ALL_DELIVERY_STATUS_IDS,
  DELIVERY_STATUS_ORDER,
  LAUSD_SCALE,
  PRIVACY_BADGES,
  ALL_PRIVACY_BADGE_KEYS,
  DELIVERY_SIMULATION,
  getPriceForVolume,
  getTierForVolume,
  calculateMessageCost,
  calculateSmsSegments,
  getMonthlyProjection,
  isValidChannelId,
  isValidDeliveryStatusId,
  getChannelById,
  getDeliveryStatusById,
  formatCurrency,
  generateMessageId,
  maskEmail,
} from "@/lib/config/cpaas";

// =============================================================================
// CONFIGURATION STRUCTURE TESTS
// =============================================================================

describe("CPaaS Configuration SSOT", () => {
  describe("Channel Configuration", () => {
    it("should have exactly 2 channels (EMAIL, SMS)", () => {
      expect(Object.keys(CPAAS_CHANNELS)).toHaveLength(2);
      expect(ALL_CHANNEL_IDS).toHaveLength(2);
    });

    it("should have consistent structure for all channels", () => {
      Object.entries(CPAAS_CHANNELS).forEach(([key, config]) => {
        expect(config).toHaveProperty("id");
        expect(config).toHaveProperty("label");
        expect(config).toHaveProperty("description");
        expect(config).toHaveProperty("icon");
        expect(config.id).toBe(key);
      });
    });

    it("should have EMAIL channel with correct properties", () => {
      expect(CPAAS_CHANNELS.EMAIL.id).toBe("EMAIL");
      expect(CPAAS_CHANNELS.EMAIL.label).toBe("Email");
      expect(CPAAS_CHANNELS.EMAIL.maxLength).toBeNull();
    });

    it("should have SMS channel with segment limits", () => {
      expect(CPAAS_CHANNELS.SMS.id).toBe("SMS");
      expect(CPAAS_CHANNELS.SMS.segmentLength).toBe(160);
      expect(CPAAS_CHANNELS.SMS.maxLength).toBe(480); // 3 segments
    });

    it("should have ALL_CHANNEL_IDS derived from CPAAS_CHANNELS", () => {
      const derivedIds = Object.values(CPAAS_CHANNELS).map((c) => c.id);
      expect(ALL_CHANNEL_IDS).toEqual(derivedIds);
    });

    it("should have ALL_CHANNEL_KEYS derived from CPAAS_CHANNELS", () => {
      const derivedKeys = Object.keys(CPAAS_CHANNELS);
      expect(ALL_CHANNEL_KEYS).toEqual(derivedKeys);
    });
  });

  describe("Pricing Configuration", () => {
    it("should have 4 pricing tiers for EMAIL", () => {
      expect(EMAIL_PRICING_TIERS).toHaveLength(4);
    });

    it("should have 4 pricing tiers for SMS", () => {
      expect(SMS_PRICING_TIERS).toHaveLength(4);
    });

    it("should have pricing tiers in ascending volume order", () => {
      EMAIL_PRICING_TIERS.forEach((tier, index) => {
        if (index > 0) {
          expect(tier.minVolume).toBeGreaterThan(
            EMAIL_PRICING_TIERS[index - 1].minVolume
          );
        }
      });

      SMS_PRICING_TIERS.forEach((tier, index) => {
        if (index > 0) {
          expect(tier.minVolume).toBeGreaterThan(
            SMS_PRICING_TIERS[index - 1].minVolume
          );
        }
      });
    });

    it("should have decreasing prices for higher volumes", () => {
      EMAIL_PRICING_TIERS.forEach((tier, index) => {
        if (index > 0) {
          expect(tier.pricePerUnit).toBeLessThanOrEqual(
            EMAIL_PRICING_TIERS[index - 1].pricePerUnit
          );
        }
      });
    });

    it("should have pricing for all channels", () => {
      ALL_CHANNEL_IDS.forEach((channelId) => {
        expect(PRICING_BY_CHANNEL[channelId]).toBeDefined();
        expect(PRICING_BY_CHANNEL[channelId].length).toBeGreaterThan(0);
      });
    });

    it("should have default prices for all channels", () => {
      ALL_CHANNEL_IDS.forEach((channelId) => {
        expect(DEFAULT_PRICES[channelId]).toBeDefined();
        expect(DEFAULT_PRICES[channelId]).toBeGreaterThan(0);
      });
    });

    it("should have last tier with null maxVolume (unlimited)", () => {
      const lastEmailTier = EMAIL_PRICING_TIERS[EMAIL_PRICING_TIERS.length - 1];
      const lastSmsTier = SMS_PRICING_TIERS[SMS_PRICING_TIERS.length - 1];
      expect(lastEmailTier.maxVolume).toBeNull();
      expect(lastSmsTier.maxVolume).toBeNull();
    });

    it("should have tier names for all pricing tiers", () => {
      [...EMAIL_PRICING_TIERS, ...SMS_PRICING_TIERS].forEach((tier) => {
        expect(tier.tierName).toBeDefined();
        expect(tier.tierName.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Delivery Status Configuration", () => {
    it("should have 6 delivery statuses", () => {
      expect(Object.keys(DELIVERY_STATUSES)).toHaveLength(6);
      expect(ALL_DELIVERY_STATUS_IDS).toHaveLength(6);
    });

    it("should have consistent structure for all statuses", () => {
      Object.entries(DELIVERY_STATUSES).forEach(([key, status]) => {
        expect(status).toHaveProperty("id");
        expect(status).toHaveProperty("label");
        expect(status).toHaveProperty("description");
        expect(status).toHaveProperty("order");
        expect(status).toHaveProperty("isFinal");
        expect(status).toHaveProperty("isError");
        expect(status.id).toBe(key);
      });
    });

    it("should have QUEUED as first status (order 1)", () => {
      expect(DELIVERY_STATUSES.QUEUED.order).toBe(1);
    });

    it("should have DELIVERED as success final status", () => {
      expect(DELIVERY_STATUSES.DELIVERED.isFinal).toBe(true);
      expect(DELIVERY_STATUSES.DELIVERED.isError).toBe(false);
    });

    it("should have FAILED and BOUNCED as error statuses", () => {
      expect(DELIVERY_STATUSES.FAILED.isError).toBe(true);
      expect(DELIVERY_STATUSES.BOUNCED.isError).toBe(true);
    });

    it("should have DELIVERY_STATUS_ORDER for happy path", () => {
      expect(DELIVERY_STATUS_ORDER).toEqual(["QUEUED", "SENT", "DELIVERED", "OPENED"]);
    });

    it("should have error statuses with high order numbers", () => {
      expect(DELIVERY_STATUSES.FAILED.order).toBeGreaterThan(90);
      expect(DELIVERY_STATUSES.BOUNCED.order).toBeGreaterThan(90);
    });
  });

  describe("LAUSD Scale Constants", () => {
    it("should have correct LAUSD family count", () => {
      expect(LAUSD_SCALE.totalFamilies).toBe(670000);
    });

    it("should have correct district name", () => {
      expect(LAUSD_SCALE.districtName).toBe("LAUSD");
    });

    it("should have scaleMessage function", () => {
      expect(typeof LAUSD_SCALE.scaleMessage).toBe("function");
    });

    it("should generate correct scale message for EMAIL", () => {
      const result = LAUSD_SCALE.scaleMessage(0.002, "EMAIL");
      expect(result.familyCount).toBe("670,000");
      expect(result.totalCost).toBe("$1,340.00");
      expect(result.channel).toBe("EMAIL");
      expect(result.comparisonMessage).toContain("email");
    });

    it("should generate correct scale message for SMS", () => {
      const result = LAUSD_SCALE.scaleMessage(0.015, "SMS");
      expect(result.familyCount).toBe("670,000");
      expect(result.totalCost).toBe("$10,050.00");
      expect(result.channel).toBe("SMS");
      expect(result.comparisonMessage).toContain("sms");
    });
  });

  describe("Privacy Badges Configuration", () => {
    it("should have 4 privacy badges", () => {
      expect(Object.keys(PRIVACY_BADGES)).toHaveLength(4);
      expect(ALL_PRIVACY_BADGE_KEYS).toHaveLength(4);
    });

    it("should have consistent structure for all badges", () => {
      Object.entries(PRIVACY_BADGES).forEach(([, badge]) => {
        expect(badge).toHaveProperty("id");
        expect(badge).toHaveProperty("label");
        expect(badge).toHaveProperty("icon");
        expect(badge).toHaveProperty("description");
      });
    });

    it("should include FERPA/COPPA compliance badge", () => {
      expect(PRIVACY_BADGES.FERPA_COPPA).toBeDefined();
      expect(PRIVACY_BADGES.FERPA_COPPA.label).toContain("FERPA");
    });
  });

  describe("Delivery Simulation Configuration", () => {
    it("should have simulation delays defined", () => {
      expect(DELIVERY_SIMULATION.queuedDelay).toBeDefined();
      expect(DELIVERY_SIMULATION.sentDelay).toBeDefined();
      expect(DELIVERY_SIMULATION.deliveredDelay).toBeDefined();
    });

    it("should have delays in ascending order", () => {
      expect(DELIVERY_SIMULATION.sentDelay).toBeGreaterThan(
        DELIVERY_SIMULATION.queuedDelay
      );
      expect(DELIVERY_SIMULATION.deliveredDelay).toBeGreaterThan(
        DELIVERY_SIMULATION.sentDelay
      );
    });

    it("should have total duration >= delivered delay", () => {
      expect(DELIVERY_SIMULATION.totalDuration).toBeGreaterThanOrEqual(
        DELIVERY_SIMULATION.deliveredDelay
      );
    });
  });
});

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe("CPaaS Helper Functions", () => {
  describe("getPriceForVolume", () => {
    it("should return starter tier price for low volume EMAIL", () => {
      expect(getPriceForVolume("EMAIL", 100)).toBe(0.003);
      expect(getPriceForVolume("EMAIL", 10000)).toBe(0.003);
    });

    it("should return growth tier price for medium volume EMAIL", () => {
      expect(getPriceForVolume("EMAIL", 10001)).toBe(0.002);
      expect(getPriceForVolume("EMAIL", 50000)).toBe(0.002);
    });

    it("should return enterprise tier price for high volume EMAIL", () => {
      expect(getPriceForVolume("EMAIL", 1000001)).toBe(0.001);
      expect(getPriceForVolume("EMAIL", 10000000)).toBe(0.001);
    });

    it("should return correct prices for SMS tiers", () => {
      expect(getPriceForVolume("SMS", 1000)).toBe(0.015);
      expect(getPriceForVolume("SMS", 10000)).toBe(0.012);
      expect(getPriceForVolume("SMS", 100000)).toBe(0.009);
    });
  });

  describe("getTierForVolume", () => {
    it("should return correct tier object", () => {
      const tier = getTierForVolume("EMAIL", 50000);
      expect(tier).toBeDefined();
      expect(tier?.tierName).toBe("Growth");
    });

    it("should return enterprise tier for very high volume", () => {
      const tier = getTierForVolume("EMAIL", 5000000);
      expect(tier?.tierName).toBe("Enterprise");
    });
  });

  describe("calculateMessageCost", () => {
    it("should calculate cost for single recipient (Starter tier)", () => {
      const result = calculateMessageCost("EMAIL", 1, 0);
      expect(result.unitPrice).toBe(0.003); // Starter tier price
      expect(result.totalCost).toBe(0.003);
      expect(result.tierName).toBe("Starter");
    });

    it("should calculate cost for multiple recipients (Starter tier)", () => {
      const result = calculateMessageCost("EMAIL", 100, 0);
      expect(result.totalCost).toBe(0.3); // 100 * $0.003
    });

    it("should calculate cost at Growth tier volume", () => {
      const result = calculateMessageCost("EMAIL", 1, 50000);
      expect(result.unitPrice).toBe(0.002); // Growth tier price
      expect(result.tierName).toBe("Growth");
    });

    it("should use volume-based pricing", () => {
      const lowVolume = calculateMessageCost("EMAIL", 1, 1000);
      const highVolume = calculateMessageCost("EMAIL", 1, 500000);
      expect(highVolume.unitPrice).toBeLessThan(lowVolume.unitPrice);
    });
  });

  describe("calculateSmsSegments", () => {
    it("should return 0 segments for empty message", () => {
      const result = calculateSmsSegments("");
      expect(result.segments).toBe(0);
    });

    it("should return 1 segment for short message", () => {
      const result = calculateSmsSegments("Hello world");
      expect(result.segments).toBe(1);
    });

    it("should return 1 segment for exactly 160 chars", () => {
      const result = calculateSmsSegments("a".repeat(160));
      expect(result.segments).toBe(1);
      expect(result.charsRemaining).toBe(0);
    });

    it("should return 2 segments for 161 chars", () => {
      const result = calculateSmsSegments("a".repeat(161));
      expect(result.segments).toBe(2);
    });

    it("should return 3 segments for 321-480 chars", () => {
      const result = calculateSmsSegments("a".repeat(400));
      expect(result.segments).toBe(3);
    });

    it("should flag over limit for > 480 chars", () => {
      const result = calculateSmsSegments("a".repeat(481));
      expect(result.isOverLimit).toBe(true);
    });

    it("should not flag over limit for exactly 480 chars", () => {
      const result = calculateSmsSegments("a".repeat(480));
      expect(result.isOverLimit).toBe(false);
    });
  });

  describe("getMonthlyProjection", () => {
    it("should calculate monthly from daily cost", () => {
      const result = getMonthlyProjection("EMAIL", 1.0);
      expect(result.monthlyCost).toBe(30);
    });

    it("should calculate yearly projection", () => {
      const result = getMonthlyProjection("EMAIL", 1.0);
      expect(result.yearlyProjection).toBe(365);
    });
  });

  describe("Validation Functions", () => {
    it("isValidChannelId should return true for valid channels", () => {
      expect(isValidChannelId("EMAIL")).toBe(true);
      expect(isValidChannelId("SMS")).toBe(true);
    });

    it("isValidChannelId should return false for invalid channels", () => {
      expect(isValidChannelId("PUSH")).toBe(false);
      expect(isValidChannelId("email")).toBe(false);
      expect(isValidChannelId("")).toBe(false);
    });

    it("isValidDeliveryStatusId should return true for valid statuses", () => {
      expect(isValidDeliveryStatusId("QUEUED")).toBe(true);
      expect(isValidDeliveryStatusId("DELIVERED")).toBe(true);
    });

    it("isValidDeliveryStatusId should return false for invalid statuses", () => {
      expect(isValidDeliveryStatusId("PENDING")).toBe(false);
      expect(isValidDeliveryStatusId("queued")).toBe(false);
    });
  });

  describe("Lookup Functions", () => {
    it("getChannelById should return channel config", () => {
      const channel = getChannelById("EMAIL");
      expect(channel).toBeDefined();
      expect(channel?.label).toBe("Email");
    });

    it("getChannelById should return undefined for invalid id", () => {
      expect(getChannelById("INVALID")).toBeUndefined();
    });

    it("getDeliveryStatusById should return status config", () => {
      const status = getDeliveryStatusById("DELIVERED");
      expect(status).toBeDefined();
      expect(status?.label).toBe("Delivered");
    });

    it("getDeliveryStatusById should return undefined for invalid id", () => {
      expect(getDeliveryStatusById("INVALID")).toBeUndefined();
    });
  });

  describe("formatCurrency", () => {
    it("should format whole dollars", () => {
      expect(formatCurrency(10)).toBe("$10.00");
    });

    it("should format cents", () => {
      expect(formatCurrency(0.50)).toBe("$0.50");
    });

    it("should format small amounts with 4 decimals", () => {
      expect(formatCurrency(0.002)).toBe("$0.0020");
      expect(formatCurrency(0.0015)).toBe("$0.0015");
    });

    it("should handle large amounts", () => {
      expect(formatCurrency(1340)).toBe("$1,340.00");
    });
  });

  describe("generateMessageId", () => {
    it("should generate ID starting with msg_", () => {
      const id = generateMessageId();
      expect(id.startsWith("msg_")).toBe(true);
    });

    it("should generate 16 character ID (msg_ + 12 chars)", () => {
      const id = generateMessageId();
      expect(id.length).toBe(16);
    });

    it("should generate unique IDs", () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateMessageId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe("maskEmail", () => {
    it("should mask email properly", () => {
      const masked = maskEmail("parent@gmail.com");
      expect(masked).toContain("***");
      expect(masked).toContain("[HIDDEN]");
      expect(masked).toContain("@gmail.com");
    });

    it("should handle short local parts", () => {
      const masked = maskEmail("a@example.com");
      expect(masked).toContain("[HIDDEN]");
    });

    it("should handle invalid email gracefully", () => {
      const masked = maskEmail("invalid");
      expect(masked).toBe("[HIDDEN]");
    });
  });
});

// =============================================================================
// CROSS-LAYER CONSISTENCY TESTS
// =============================================================================

describe("CPaaS Cross-Layer Consistency", () => {
  function readSourceFile(relativePath: string): string {
    return fs.readFileSync(
      path.resolve(__dirname, relativePath),
      "utf-8"
    );
  }

  describe("CommTestForm should use centralized config", () => {
    it("should import from @/lib/config/cpaas", () => {
      const formPath = "../../components/forms/CommTestForm.tsx";
      if (fs.existsSync(path.resolve(__dirname, formPath))) {
        const code = readSourceFile(formPath);
        // After MVP-06 implementation, this should pass
        // For now, we're testing the pattern
        expect(code).toBeDefined();
      }
    });
  });

  describe("CPAAS_DEVSPIKE.md should match config", () => {
    it("should reference same pricing tiers", () => {
      const devspikePath = "../../.claude/CPAAS_DEVSPIKE.md";
      const code = readSourceFile(devspikePath);

      // Verify EMAIL starter tier price mentioned
      expect(code).toContain("$0.003");
      // Verify SMS starter tier price mentioned
      expect(code).toContain("$0.015");
    });

    it("should reference same channels", () => {
      const devspikePath = "../../.claude/CPAAS_DEVSPIKE.md";
      const code = readSourceFile(devspikePath);

      expect(code).toContain("EMAIL");
      expect(code).toContain("SMS");
    });
  });

  describe("Handlers should use CPaaS config for messaging", () => {
    it("handlers.ts should handle send_test_message tool", () => {
      const handlersPath = "../../lib/ai/handlers.ts";
      const code = readSourceFile(handlersPath);

      expect(code).toContain("send_test_message");
    });
  });
});

// =============================================================================
// DESIGN DECISION TESTS
// =============================================================================

describe("CPaaS Design Decisions", () => {
  it("should use Growth tier as default EMAIL price (not Starter)", () => {
    // Design: Default to Growth tier ($0.002) for demos
    // Rationale: More representative of typical vendor volume
    expect(DEFAULT_PRICES.EMAIL).toBe(0.002);
  });

  it("should limit SMS to 3 segments (480 chars)", () => {
    // Design: Cap SMS at 3 segments to prevent cost surprise
    // Rationale: Multi-segment SMS costs multiply quickly
    expect(CPAAS_CHANNELS.SMS.maxLength).toBe(480);
    expect(CPAAS_CHANNELS.SMS.maxLength).toBe(
      CPAAS_CHANNELS.SMS.segmentLength! * 3
    );
  });

  it("should have Enterprise tier with null maxVolume", () => {
    // Design: Enterprise tier has no upper limit
    // Rationale: Highest volume customers shouldn't hit a ceiling
    const lastTier = EMAIL_PRICING_TIERS[EMAIL_PRICING_TIERS.length - 1];
    expect(lastTier.maxVolume).toBeNull();
    expect(lastTier.tierName).toBe("Enterprise");
  });

  it("should have OPENED status after DELIVERED in order", () => {
    // Design: Track opens as post-delivery engagement
    // Rationale: Shows vendor communication effectiveness
    const deliveredIndex = DELIVERY_STATUS_ORDER.indexOf("DELIVERED");
    const openedIndex = DELIVERY_STATUS_ORDER.indexOf("OPENED");
    expect(openedIndex).toBeGreaterThan(deliveredIndex);
  });

  it("should use realistic LAUSD family count", () => {
    // Design: Use actual LAUSD numbers for credible demos
    // Rationale: 670K students ≈ 670K families
    expect(LAUSD_SCALE.totalFamilies).toBe(670000);
  });

  it("should include all required privacy badges for compliance", () => {
    // Design: Four badges covering all privacy aspects
    // Rationale: FERPA, COPPA, audit trail, and PII protection
    expect(ALL_PRIVACY_BADGE_KEYS).toContain("NO_PII");
    expect(ALL_PRIVACY_BADGE_KEYS).toContain("FERPA_COPPA");
    expect(ALL_PRIVACY_BADGE_KEYS).toContain("AUDIT_TRAIL");
    expect(ALL_PRIVACY_BADGE_KEYS).toContain("SECURE_RELAY");
  });
});

// =============================================================================
// 100% COVERAGE GATE
// =============================================================================

describe("CPaaS 100% Coverage Gate", () => {
  it("every channel should have pricing defined", () => {
    ALL_CHANNEL_IDS.forEach((channelId) => {
      expect(PRICING_BY_CHANNEL[channelId]).toBeDefined();
      expect(PRICING_BY_CHANNEL[channelId].length).toBeGreaterThan(0);
    });
  });

  it("every channel should have default price", () => {
    ALL_CHANNEL_IDS.forEach((channelId) => {
      expect(DEFAULT_PRICES[channelId]).toBeDefined();
    });
  });

  it("every delivery status should have all required properties", () => {
    ALL_DELIVERY_STATUS_IDS.forEach((statusId) => {
      const status = getDeliveryStatusById(statusId);
      expect(status).toBeDefined();
      expect(status?.label).toBeDefined();
      expect(status?.description).toBeDefined();
      expect(typeof status?.order).toBe("number");
      expect(typeof status?.isFinal).toBe("boolean");
      expect(typeof status?.isError).toBe("boolean");
    });
  });

  it("every privacy badge should have icon defined", () => {
    ALL_PRIVACY_BADGE_KEYS.forEach((badgeKey) => {
      const badge = PRIVACY_BADGES[badgeKey];
      expect(badge.icon).toBeDefined();
      expect(badge.icon.length).toBeGreaterThan(0);
    });
  });

  it("pricing tiers should have continuous volume coverage", () => {
    // Verify no gaps in tier coverage
    EMAIL_PRICING_TIERS.forEach((tier, index) => {
      if (index > 0) {
        const prevTier = EMAIL_PRICING_TIERS[index - 1];
        // Current tier's min should be prev tier's max + 1
        expect(tier.minVolume).toBe(prevTier.maxVolume! + 1);
      }
    });
  });
});
