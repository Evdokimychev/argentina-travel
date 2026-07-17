import { describe, expect, it } from "vitest";
import {
  OPERATIONAL_ANALYTICS_EVENT_DICTIONARY,
  validateOperationalEventMetadata,
} from "@/lib/analytics/operational-event-contract";

describe("operational analytics event dictionary", () => {
  it("contains the five PII-free operations events", () => {
    expect(Object.keys(OPERATIONAL_ANALYTICS_EVENT_DICTIONARY)).toEqual([
      "booking_capability_view",
      "booking_transition",
      "booking_error",
      "inventory_update_rejected",
      "moderation_conflict",
    ]);
  });

  it("accepts the documented booking transition and drops unknown safe fields", () => {
    expect(validateOperationalEventMetadata("booking_transition", {
      outcome: "partner_handoff",
      partner: "tripster",
      placement: "tour_detail",
      operation_id: "op-123",
      harmless_unknown: "not persisted",
    })).toEqual({
      outcome: "partner_handoff",
      partner: "tripster",
      placement: "tour_detail",
      operation_id: "op-123",
    });
  });

  it("fails closed on missing fields, invalid enums or contact data", () => {
    expect(validateOperationalEventMetadata("inventory_update_rejected", {
      reason: "capacity_below_booked",
      email: "owner@example.com",
    })).toBeNull();
    expect(validateOperationalEventMetadata("booking_error", {
      stage: "database",
      retryable: true,
      support_owner: "platform",
      http_status_class: "5xx",
    })).toBeNull();
    expect(validateOperationalEventMetadata("moderation_conflict", {
      action: "publish",
      expected_state: "review",
    })).toBeNull();
  });
});
