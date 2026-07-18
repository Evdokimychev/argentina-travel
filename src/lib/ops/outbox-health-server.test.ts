import { describe, expect, it } from "vitest";
import { evaluateOutboxHealth } from "@/lib/ops/outbox-health-server";

const NOW = new Date("2026-07-16T12:00:00.000Z");

describe("email outbox health", () => {
  it("is healthy when the provider is configured and the queue is empty", () => {
    const health = evaluateOutboxHealth({
      pending: 0,
      failed: 0,
      dead: 0,
      staleSending: 0,
      oldestQueuedAt: null,
      providerConfigured: true,
    }, NOW);

    expect(health.status).toBe("ok");
    expect(health.ok).toBe(true);
  });

  it("raises a critical state for dead letters or a missing provider", () => {
    const health = evaluateOutboxHealth({
      pending: 1,
      failed: 0,
      dead: 2,
      staleSending: 0,
      oldestQueuedAt: "2026-07-16T11:55:00.000Z",
      providerConfigured: false,
    }, NOW);

    expect(health.status).toBe("critical");
    expect(health.reasons).toEqual(
      expect.arrayContaining(["email_provider_not_configured", "dead_letters_present"]),
    );
  });

  it("warns when the oldest retry exceeded the delivery SLO", () => {
    const health = evaluateOutboxHealth({
      pending: 1,
      failed: 1,
      dead: 0,
      staleSending: 0,
      oldestQueuedAt: "2026-07-16T11:30:00.000Z",
      providerConfigured: true,
    }, NOW);

    expect(health.status).toBe("degraded");
    expect(health.oldestQueuedAgeMinutes).toBe(30);
    expect(health.reasons).toContain("oldest_queue_item_stale");
  });
});
