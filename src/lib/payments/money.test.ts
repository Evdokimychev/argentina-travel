import { describe, expect, it } from "vitest";
import {
  MONEY_MINOR_UNIT_EXPONENT,
  MoneyCurrencyMismatchError,
  addMoney,
  calculateRefundRemaining,
  capRefundAmount,
  compareMoney,
  money,
  moneyFromMajorUnits,
  moneyToMajorUnits,
  parseMoneyCurrency,
  subtractMoney,
  zeroMoney,
} from "./money";

describe("payment money primitives", () => {
  it("converts supported major-unit values without losing kopecks or cents", () => {
    expect(moneyFromMajorUnits("RUB", 1250.45)).toEqual({
      currency: "RUB",
      minorUnits: 125045,
    });
    expect(moneyFromMajorUnits("ARS", 1495)).toEqual({
      currency: "ARS",
      minorUnits: 149500,
    });
    expect(moneyToMajorUnits(money("EUR", 1099))).toBe(10.99);
  });

  it("normalizes supported currency codes and rejects unknown codes", () => {
    expect(parseMoneyCurrency(" rub ")).toBe("RUB");
    expect(parseMoneyCurrency("btc")).toBeNull();
  });

  it("rejects amounts with unsupported precision", () => {
    expect(() => moneyFromMajorUnits("USD", 10.001)).toThrow(RangeError);
  });

  it("defines explicit minor units for every supported currency", () => {
    expect(MONEY_MINOR_UNIT_EXPONENT).toEqual({ RUB: 2, ARS: 2, USD: 2, EUR: 2 });
  });

  it.each(["RUB", "ARS", "USD", "EUR"] as const)(
    "keeps %s amounts as integer minor units",
    (currency) => {
      expect(money(currency, 12_345)).toEqual({ currency, minorUnits: 12_345 });
      expect(zeroMoney(currency)).toEqual({ currency, minorUnits: 0 });
    },
  );

  it("rejects negative, fractional, infinite and unsafe minor-unit values", () => {
    expect(() => money("USD", -1)).toThrow(RangeError);
    expect(() => money("USD", 1.5)).toThrow(RangeError);
    expect(() => money("USD", Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => money("USD", Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
    expect(() => money("GBP" as "USD", 100)).toThrow(TypeError);
    expect(() => money("toString" as "USD", 100)).toThrow(TypeError);
  });

  it("adds, subtracts and compares amounts only inside one currency", () => {
    expect(addMoney(money("ARS", 1_000), money("ARS", 250))).toEqual(
      money("ARS", 1_250),
    );
    expect(subtractMoney(money("RUB", 1_000), money("RUB", 250))).toEqual(
      money("RUB", 750),
    );
    expect(compareMoney(money("EUR", 100), money("EUR", 200))).toBe(-1);
    expect(compareMoney(money("EUR", 200), money("EUR", 200))).toBe(0);
    expect(compareMoney(money("EUR", 300), money("EUR", 200))).toBe(1);
  });

  it("throws before mixed-currency arithmetic or comparison", () => {
    expect(() => addMoney(money("USD", 100), money("ARS", 100))).toThrow(
      MoneyCurrencyMismatchError,
    );
    expect(() => subtractMoney(money("RUB", 100), money("EUR", 100))).toThrow(
      MoneyCurrencyMismatchError,
    );
    expect(() => compareMoney(money("USD", 100), money("EUR", 100))).toThrow(
      MoneyCurrencyMismatchError,
    );
  });

  it("does not allow subtraction to create a negative payment amount", () => {
    expect(() => subtractMoney(money("USD", 100), money("USD", 101))).toThrow(
      RangeError,
    );
  });

  it("fails closed when refund currencies do not match", () => {
    expect(calculateRefundRemaining(money("USD", 10_000), money("ARS", 1_000))).toEqual({
      ok: false,
      reason: "currency_mismatch",
    });
    expect(
      capRefundAmount({
        captured: money("RUB", 10_000),
        committedRefunds: money("RUB", 1_000),
        requested: money("EUR", 2_000),
      }),
    ).toEqual({ ok: false, reason: "currency_mismatch" });
  });

  it("calculates remaining refundable money and caps an excessive request", () => {
    expect(calculateRefundRemaining(money("ARS", 10_000), money("ARS", 2_500))).toEqual({
      ok: true,
      remaining: money("ARS", 7_500),
    });
    expect(
      capRefundAmount({
        captured: money("ARS", 10_000),
        committedRefunds: money("ARS", 2_500),
        requested: money("ARS", 9_000),
      }),
    ).toEqual({
      ok: true,
      remainingBeforeRefund: money("ARS", 7_500),
      approvedRefund: money("ARS", 7_500),
      remainingAfterRefund: money("ARS", 0),
      wasCapped: true,
    });
  });

  it("preserves an in-range request without capping it", () => {
    expect(
      capRefundAmount({
        captured: money("USD", 10_000),
        committedRefunds: money("USD", 2_500),
        requested: money("USD", 2_000),
      }),
    ).toEqual({
      ok: true,
      remainingBeforeRefund: money("USD", 7_500),
      approvedRefund: money("USD", 2_000),
      remainingAfterRefund: money("USD", 5_500),
      wasCapped: false,
    });
  });

  it("rejects negative amounts and an already over-refunded state", () => {
    expect(
      calculateRefundRemaining(
        { currency: "USD", minorUnits: -1 },
        money("USD", 0),
      ),
    ).toEqual({
      ok: false,
      reason: "negative_amount",
    });
    expect(calculateRefundRemaining(money("USD", 100), money("USD", 101))).toEqual({
      ok: false,
      reason: "invalid_refund_state",
    });
    expect(
      capRefundAmount({
        captured: money("USD", 100),
        committedRefunds: money("USD", 0),
        requested: { currency: "USD", minorUnits: -1 },
      }),
    ).toEqual({ ok: false, reason: "negative_amount" });
  });

  it("fails closed for zero requests, exhausted refunds and unsupported currencies", () => {
    expect(
      capRefundAmount({
        captured: money("USD", 100),
        committedRefunds: money("USD", 0),
        requested: money("USD", 0),
      }),
    ).toEqual({ ok: false, reason: "non_positive_request" });
    expect(
      capRefundAmount({
        captured: money("EUR", 100),
        committedRefunds: money("EUR", 100),
        requested: money("EUR", 1),
      }),
    ).toEqual({ ok: false, reason: "nothing_refundable" });
    expect(
      calculateRefundRemaining(
        { currency: "GBP" as "USD", minorUnits: 100 },
        { currency: "GBP" as "USD", minorUnits: 0 },
      ),
    ).toEqual({ ok: false, reason: "unsupported_currency" });
  });
});
