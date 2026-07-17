import { describe, expect, it, vi } from "vitest";
import { money } from "./money";
import { createStablePaymentIdempotencyKey } from "./payment-idempotency";

describe("provider-neutral payment idempotency", () => {
  const input = {
    providerId: "planned-provider",
    operation: "refund" as const,
    resourceId: "booking-1",
    operationId: "refund-request-1",
    amount: money("RUB", 12_345),
  };

  it("returns the same key for the same durable operation identity", () => {
    expect(createStablePaymentIdempotencyKey(input)).toBe(
      createStablePaymentIdempotencyKey(input),
    );
  });

  it("normalizes provider casing and surrounding whitespace", () => {
    expect(
      createStablePaymentIdempotencyKey({
        ...input,
        providerId: "  PLANNED-PROVIDER ",
        resourceId: " booking-1 ",
        operationId: " refund-request-1 ",
      }),
    ).toBe(createStablePaymentIdempotencyKey(input));
  });

  it("preserves case-sensitive business identities", () => {
    expect(
      createStablePaymentIdempotencyKey({ ...input, operationId: "REFUND-REQUEST-1" }),
    ).not.toBe(createStablePaymentIdempotencyKey(input));
  });

  it("separates providers, operations, resources, durable operation ids and money", () => {
    const key = createStablePaymentIdempotencyKey(input);
    expect(createStablePaymentIdempotencyKey({ ...input, providerId: "manual" })).not.toBe(key);
    expect(createStablePaymentIdempotencyKey({ ...input, operation: "capture" })).not.toBe(key);
    expect(createStablePaymentIdempotencyKey({ ...input, resourceId: "booking-2" })).not.toBe(key);
    expect(createStablePaymentIdempotencyKey({ ...input, operationId: "refund-request-2" })).not.toBe(
      key,
    );
    expect(createStablePaymentIdempotencyKey({ ...input, amount: money("RUB", 12_346) })).not.toBe(
      key,
    );
    expect(createStablePaymentIdempotencyKey({ ...input, amount: money("ARS", 12_345) })).not.toBe(
      key,
    );
  });

  it("keeps every supported operation key within a 64-character provider budget", () => {
    const keys = [
      createStablePaymentIdempotencyKey(input),
      createStablePaymentIdempotencyKey({ ...input, operation: "checkout" }),
      createStablePaymentIdempotencyKey({ ...input, operation: "capture" }),
      createStablePaymentIdempotencyKey({
        providerId: input.providerId,
        operation: "webhook",
        resourceId: input.resourceId,
        operationId: "webhook-event-1",
      }),
      createStablePaymentIdempotencyKey({
        providerId: input.providerId,
        operation: "reconciliation",
        resourceId: input.resourceId,
        operationId: "reconciliation-run-1",
      }),
    ];
    expect(keys.every((key) => key.length <= 64)).toBe(true);
  });

  it("does not depend on wall-clock time", () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1);
    try {
      const first = createStablePaymentIdempotencyKey(input);
      nowSpy.mockReturnValue(9_999_999_999_999);
      const second = createStablePaymentIdempotencyKey(input);
      expect(second).toBe(first);
      expect(nowSpy).not.toHaveBeenCalled();
    } finally {
      nowSpy.mockRestore();
    }
  });

  it("rejects an invalid structural Money value", () => {
    expect(() =>
      createStablePaymentIdempotencyKey({
        ...input,
        amount: { currency: "USD", minorUnits: -1 },
      }),
    ).toThrow(RangeError);
    expect(() =>
      createStablePaymentIdempotencyKey({
        ...input,
        amount: { currency: "toString" as "USD", minorUnits: 100 },
      }),
    ).toThrow(/Unsupported amount currency/);
  });

  it("rejects missing durable identity fields", () => {
    expect(() => createStablePaymentIdempotencyKey({ ...input, providerId: " " })).toThrow(
      TypeError,
    );
    expect(() => createStablePaymentIdempotencyKey({ ...input, resourceId: " " })).toThrow(
      TypeError,
    );
    expect(() => createStablePaymentIdempotencyKey({ ...input, operationId: " " })).toThrow(
      TypeError,
    );
  });

  it("rejects control characters and invalid operation amount semantics", () => {
    expect(() =>
      createStablePaymentIdempotencyKey({ ...input, operationId: "refund\u0000request" }),
    ).toThrow(/control characters/);
    expect(() =>
      createStablePaymentIdempotencyKey({
        ...input,
        amount: undefined,
      } as unknown as Parameters<typeof createStablePaymentIdempotencyKey>[0]),
    ).toThrow(/requires an amount/);
    expect(() =>
      createStablePaymentIdempotencyKey({
        ...input,
        operation: "webhook",
      } as unknown as Parameters<typeof createStablePaymentIdempotencyKey>[0]),
    ).toThrow(/must not include an amount/);
  });
});
