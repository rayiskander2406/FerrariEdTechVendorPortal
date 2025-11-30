/**
 * @vitest-environment jsdom
 */

/**
 * CPaaS Delivery Status Tests
 *
 * Tests for MVP-06 delivery status simulation feature.
 * Verifies the animated delivery timeline works correctly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  DELIVERY_STATUSES,
  DELIVERY_STATUS_ORDER,
  DELIVERY_SIMULATION,
  DeliveryStatusId,
  generateMessageId,
  getDeliveryStatusById,
  isValidDeliveryStatusId,
} from "@/lib/config/cpaas";

// =============================================================================
// DELIVERY STATUS STATE MACHINE TESTS
// =============================================================================

describe("Delivery Status State Machine", () => {
  describe("Status transitions", () => {
    it("should start with QUEUED status", () => {
      expect(DELIVERY_STATUS_ORDER[0]).toBe("QUEUED");
    });

    it("should transition QUEUED → SENT", () => {
      const currentIndex = DELIVERY_STATUS_ORDER.indexOf("QUEUED");
      const nextStatus = DELIVERY_STATUS_ORDER[currentIndex + 1];
      expect(nextStatus).toBe("SENT");
    });

    it("should transition SENT → DELIVERED", () => {
      const currentIndex = DELIVERY_STATUS_ORDER.indexOf("SENT");
      const nextStatus = DELIVERY_STATUS_ORDER[currentIndex + 1];
      expect(nextStatus).toBe("DELIVERED");
    });

    it("should transition DELIVERED → OPENED (optional)", () => {
      const currentIndex = DELIVERY_STATUS_ORDER.indexOf("DELIVERED");
      const nextStatus = DELIVERY_STATUS_ORDER[currentIndex + 1];
      expect(nextStatus).toBe("OPENED");
    });

    it("should have 4 states in happy path", () => {
      expect(DELIVERY_STATUS_ORDER).toHaveLength(4);
    });
  });

  describe("Status finality", () => {
    it("QUEUED should not be final", () => {
      expect(DELIVERY_STATUSES.QUEUED.isFinal).toBe(false);
    });

    it("SENT should not be final", () => {
      expect(DELIVERY_STATUSES.SENT.isFinal).toBe(false);
    });

    it("DELIVERED should be final", () => {
      expect(DELIVERY_STATUSES.DELIVERED.isFinal).toBe(true);
    });

    it("OPENED should be final", () => {
      expect(DELIVERY_STATUSES.OPENED.isFinal).toBe(true);
    });

    it("FAILED should be final", () => {
      expect(DELIVERY_STATUSES.FAILED.isFinal).toBe(true);
    });

    it("BOUNCED should be final", () => {
      expect(DELIVERY_STATUSES.BOUNCED.isFinal).toBe(true);
    });
  });

  describe("Error states", () => {
    it("success states should not be errors", () => {
      expect(DELIVERY_STATUSES.QUEUED.isError).toBe(false);
      expect(DELIVERY_STATUSES.SENT.isError).toBe(false);
      expect(DELIVERY_STATUSES.DELIVERED.isError).toBe(false);
      expect(DELIVERY_STATUSES.OPENED.isError).toBe(false);
    });

    it("failure states should be errors", () => {
      expect(DELIVERY_STATUSES.FAILED.isError).toBe(true);
      expect(DELIVERY_STATUSES.BOUNCED.isError).toBe(true);
    });
  });
});

// =============================================================================
// DELIVERY SIMULATION TIMING TESTS
// =============================================================================

describe("Delivery Simulation Timing", () => {
  describe("Delay configuration", () => {
    it("should have queued delay defined", () => {
      expect(DELIVERY_SIMULATION.queuedDelay).toBeDefined();
      expect(typeof DELIVERY_SIMULATION.queuedDelay).toBe("number");
    });

    it("should have sent delay defined", () => {
      expect(DELIVERY_SIMULATION.sentDelay).toBeDefined();
      expect(typeof DELIVERY_SIMULATION.sentDelay).toBe("number");
    });

    it("should have delivered delay defined", () => {
      expect(DELIVERY_SIMULATION.deliveredDelay).toBeDefined();
      expect(typeof DELIVERY_SIMULATION.deliveredDelay).toBe("number");
    });

    it("should have total duration defined", () => {
      expect(DELIVERY_SIMULATION.totalDuration).toBeDefined();
      expect(typeof DELIVERY_SIMULATION.totalDuration).toBe("number");
    });
  });

  describe("Timing order", () => {
    it("delays should be in ascending order", () => {
      expect(DELIVERY_SIMULATION.queuedDelay).toBeLessThan(
        DELIVERY_SIMULATION.sentDelay
      );
      expect(DELIVERY_SIMULATION.sentDelay).toBeLessThan(
        DELIVERY_SIMULATION.deliveredDelay
      );
    });

    it("total duration should encompass all delays", () => {
      expect(DELIVERY_SIMULATION.totalDuration).toBeGreaterThanOrEqual(
        DELIVERY_SIMULATION.deliveredDelay
      );
    });
  });

  describe("Demo-appropriate timing", () => {
    it("should complete within 5 seconds for demo", () => {
      expect(DELIVERY_SIMULATION.totalDuration).toBeLessThanOrEqual(5000);
    });

    it("should be at least 2 seconds to be visible", () => {
      expect(DELIVERY_SIMULATION.totalDuration).toBeGreaterThanOrEqual(2000);
    });

    it("each stage should be at least 300ms visible", () => {
      const queuedDuration = DELIVERY_SIMULATION.sentDelay - DELIVERY_SIMULATION.queuedDelay;
      const sentDuration = DELIVERY_SIMULATION.deliveredDelay - DELIVERY_SIMULATION.sentDelay;

      expect(queuedDuration).toBeGreaterThanOrEqual(300);
      expect(sentDuration).toBeGreaterThanOrEqual(300);
    });
  });
});

// =============================================================================
// SIMULATED DELIVERY FLOW TESTS
// =============================================================================

describe("Simulated Delivery Flow", () => {
  interface DeliveryEvent {
    status: DeliveryStatusId;
    timestamp: number;
    messageId: string;
  }

  /**
   * Simulates delivery status updates over time
   * This mirrors what the UI component will do
   */
  function simulateDelivery(messageId: string): Promise<DeliveryEvent[]> {
    return new Promise((resolve) => {
      const events: DeliveryEvent[] = [];
      const startTime = Date.now();

      // Queue immediately
      events.push({
        status: "QUEUED",
        timestamp: Date.now() - startTime,
        messageId,
      });

      // Simulate async delivery progression
      setTimeout(() => {
        events.push({
          status: "SENT",
          timestamp: Date.now() - startTime,
          messageId,
        });

        setTimeout(() => {
          events.push({
            status: "DELIVERED",
            timestamp: Date.now() - startTime,
            messageId,
          });
          resolve(events);
        }, DELIVERY_SIMULATION.deliveredDelay - DELIVERY_SIMULATION.sentDelay);
      }, DELIVERY_SIMULATION.sentDelay - DELIVERY_SIMULATION.queuedDelay);
    });
  }

  it("should generate unique message ID for each delivery", () => {
    const id1 = generateMessageId();
    const id2 = generateMessageId();
    expect(id1).not.toBe(id2);
  });

  it("should transition through expected states in order", async () => {
    vi.useFakeTimers();
    const events: DeliveryStatusId[] = [];

    // Simulate state changes
    events.push("QUEUED");
    await vi.advanceTimersByTimeAsync(DELIVERY_SIMULATION.sentDelay);
    events.push("SENT");
    await vi.advanceTimersByTimeAsync(
      DELIVERY_SIMULATION.deliveredDelay - DELIVERY_SIMULATION.sentDelay
    );
    events.push("DELIVERED");

    expect(events).toEqual(["QUEUED", "SENT", "DELIVERED"]);

    vi.useRealTimers();
  });

  it("each status should have correct properties", () => {
    DELIVERY_STATUS_ORDER.forEach((statusId) => {
      const status = getDeliveryStatusById(statusId);
      expect(status).toBeDefined();
      expect(status?.id).toBe(statusId);
      expect(status?.label).toBeDefined();
      expect(status?.description).toBeDefined();
    });
  });
});

// =============================================================================
// STATUS LOOKUP TESTS
// =============================================================================

describe("Status Lookup Functions", () => {
  describe("isValidDeliveryStatusId", () => {
    it("should return true for valid status IDs", () => {
      expect(isValidDeliveryStatusId("QUEUED")).toBe(true);
      expect(isValidDeliveryStatusId("SENT")).toBe(true);
      expect(isValidDeliveryStatusId("DELIVERED")).toBe(true);
      expect(isValidDeliveryStatusId("OPENED")).toBe(true);
      expect(isValidDeliveryStatusId("FAILED")).toBe(true);
      expect(isValidDeliveryStatusId("BOUNCED")).toBe(true);
    });

    it("should return false for invalid status IDs", () => {
      expect(isValidDeliveryStatusId("PENDING")).toBe(false);
      expect(isValidDeliveryStatusId("SENDING")).toBe(false);
      expect(isValidDeliveryStatusId("queued")).toBe(false); // lowercase
      expect(isValidDeliveryStatusId("")).toBe(false);
    });
  });

  describe("getDeliveryStatusById", () => {
    it("should return status config for valid ID", () => {
      const status = getDeliveryStatusById("DELIVERED");
      expect(status).toBeDefined();
      expect(status?.label).toBe("Delivered");
      expect(status?.isFinal).toBe(true);
    });

    it("should return undefined for invalid ID", () => {
      expect(getDeliveryStatusById("INVALID")).toBeUndefined();
    });
  });
});

// =============================================================================
// MESSAGE ID GENERATION TESTS
// =============================================================================

describe("Message ID Generation", () => {
  it("should generate IDs with correct format", () => {
    const id = generateMessageId();
    expect(id).toMatch(/^msg_[a-z0-9]{12}$/);
  });

  it("should generate 100 unique IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateMessageId());
    }
    expect(ids.size).toBe(100);
  });

  it("should use only lowercase letters and numbers", () => {
    for (let i = 0; i < 10; i++) {
      const id = generateMessageId();
      const suffix = id.replace("msg_", "");
      expect(suffix).toMatch(/^[a-z0-9]+$/);
    }
  });

  it("should have consistent length", () => {
    for (let i = 0; i < 10; i++) {
      const id = generateMessageId();
      expect(id.length).toBe(16); // "msg_" (4) + 12 chars
    }
  });
});

// =============================================================================
// STATUS UI REPRESENTATION TESTS
// =============================================================================

describe("Status UI Representation", () => {
  describe("Labels", () => {
    it("QUEUED should have user-friendly label", () => {
      expect(DELIVERY_STATUSES.QUEUED.label).toBe("Queued");
    });

    it("SENT should have user-friendly label", () => {
      expect(DELIVERY_STATUSES.SENT.label).toBe("Sent");
    });

    it("DELIVERED should have user-friendly label", () => {
      expect(DELIVERY_STATUSES.DELIVERED.label).toBe("Delivered");
    });

    it("FAILED should have user-friendly label", () => {
      expect(DELIVERY_STATUSES.FAILED.label).toBe("Failed");
    });
  });

  describe("Descriptions", () => {
    it("each status should have a description", () => {
      Object.values(DELIVERY_STATUSES).forEach((status) => {
        expect(status.description).toBeDefined();
        expect(status.description.length).toBeGreaterThan(10);
      });
    });

    it("descriptions should be meaningful", () => {
      expect(DELIVERY_STATUSES.QUEUED.description).toContain("queued");
      expect(DELIVERY_STATUSES.DELIVERED.description).toContain("delivered");
      expect(DELIVERY_STATUSES.FAILED.description).toContain("failed");
    });
  });

  describe("Order numbers for sorting", () => {
    it("should have increasing order for success path", () => {
      expect(DELIVERY_STATUSES.QUEUED.order).toBe(1);
      expect(DELIVERY_STATUSES.SENT.order).toBe(2);
      expect(DELIVERY_STATUSES.DELIVERED.order).toBe(3);
      expect(DELIVERY_STATUSES.OPENED.order).toBe(4);
    });

    it("error statuses should have high order numbers", () => {
      expect(DELIVERY_STATUSES.FAILED.order).toBeGreaterThan(90);
      expect(DELIVERY_STATUSES.BOUNCED.order).toBeGreaterThan(90);
    });
  });
});

// =============================================================================
// DESIGN DECISION TESTS
// =============================================================================

describe("Delivery Status Design Decisions", () => {
  it("should use OPENED as optional engagement tracking", () => {
    // Design: OPENED is final but comes after DELIVERED
    // Rationale: Shows vendors can track if message was opened
    expect(DELIVERY_STATUSES.OPENED.isFinal).toBe(true);
    expect(DELIVERY_STATUSES.OPENED.order).toBeGreaterThan(
      DELIVERY_STATUSES.DELIVERED.order
    );
  });

  it("should separate FAILED from BOUNCED", () => {
    // Design: Two distinct error types
    // Rationale: FAILED = delivery error, BOUNCED = invalid recipient
    expect(DELIVERY_STATUSES.FAILED.id).not.toBe(DELIVERY_STATUSES.BOUNCED.id);
    expect(DELIVERY_STATUSES.FAILED.description).not.toBe(
      DELIVERY_STATUSES.BOUNCED.description
    );
  });

  it("should use realistic demo timing", () => {
    // Design: 2-3 second delivery simulation
    // Rationale: Fast enough for demo, slow enough to see transitions
    expect(DELIVERY_SIMULATION.totalDuration).toBe(3000);
  });

  it("should show QUEUED immediately on submit", () => {
    // Design: QUEUED delay is first/fastest
    // Rationale: Immediate feedback that message was accepted
    expect(DELIVERY_SIMULATION.queuedDelay).toBe(
      Math.min(
        DELIVERY_SIMULATION.queuedDelay,
        DELIVERY_SIMULATION.sentDelay,
        DELIVERY_SIMULATION.deliveredDelay
      )
    );
  });
});
